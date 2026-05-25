'use client'
import { toast } from '@/lib/ui-store'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RedactedState, Card, Rank, Suit } from '@/types/shared'
import { getPlayerId } from '@/lib/player-id'
import { getSocket } from '@/lib/socket-client'
import { Background } from './Background'
import { OpponentArea } from './OpponentArea'
import { PlayerHand2D } from './PlayerHand2D'
import { DeckPile2D } from './DeckPile2D'
import { DiscardPile2D } from './DiscardPile2D'
import { DrawnCard2D } from './DrawnCard2D'
import { EffectPrompt } from './EffectPrompt'
import { BateButton } from './BateButton'
import { InstructionBar } from './InstructionBar'
import { PeekModal } from './PeekModal'
import { ActionLog } from './ActionLog'
import { BateAnnouncement } from './BateAnnouncement'
import { SnapToast } from './SnapToast'
import { PenaltyPreview } from './PenaltyPreview'
import { TopChrome } from './TopChrome'
import { LeaveButton } from './LeaveButton'
import { EmoteBar } from './EmoteBar'
import { playSound } from '@/lib/sounds'

const TEMP_REVEAL_MS = 3000

type RevealValue = { rank: Rank; suit: Suit | null }

export function GameArea({ state }: { state: RedactedState }) {
  const myId = getPlayerId()
  const me = state.players.find(p => p.id === myId)
  const opponents = state.players.filter(p => p.id !== myId)
  const currentPlayerId = state.players[state.turn]?.id
  const isMyTurn = currentPlayerId === myId
  const isPlayPhase = state.phase === 'playing' || state.phase === 'bate-called'
  const pendingEffect = state.phase === 'effect-pending' ? state.pendingEffect : null
  const isMyEffect = pendingEffect?.playerId === myId

  const [drawnCard, setDrawnCard] = useState<Card | null>(null)
  const [drawnExit, setDrawnExit] = useState<'swap' | 'discard'>('discard')
  const [tempReveals, setTempReveals] = useState<Map<string, RevealValue>>(new Map())
  const [knownCards, setKnownCards] = useState<Map<string, RevealValue>>(new Map())
  const [revealModal, setRevealModal] = useState<RevealValue | null>(null)
  const [mySwapPickIndex, setMySwapPickIndex] = useState<number | null>(null)
  const [peekConfirmedLocal, setPeekConfirmedLocal] = useState(false)
  const [victimEffects, setVictimEffects] = useState<Map<string, 'peeked' | 'swapped'>>(new Map())
  const [opponentsHoldingDrawn, setOpponentsHoldingDrawn] = useState<Set<string>>(new Set())
  const [effectPromptDismissed, setEffectPromptDismissed] = useState(false)
  const [emotes, setEmotes] = useState<Map<string, { id: number; key: string }>>(new Map())
  const emoteCounterRef = useRef(0)
  const lastSnapAt = useRef(0)
  const prevLogLenRef = useRef<number | null>(null)

  useEffect(() => {
    const socket = getSocket()
    function onEmote(payload: { playerId: string; emote: string }) {
      emoteCounterRef.current += 1
      const id = emoteCounterRef.current
      setEmotes(prev => new Map(prev).set(payload.playerId, { id, key: payload.emote }))
      playSound('emote-pop')
      setTimeout(() => {
        setEmotes(prev => {
          const cur = prev.get(payload.playerId)
          if (!cur || cur.id !== id) return prev
          const next = new Map(prev)
          next.delete(payload.playerId)
          return next
        })
      }, 2400)
    }
    socket.on('room:emote', onEmote)
    return () => { socket.off('room:emote', onEmote) }
  }, [])

  useEffect(() => {
    if (!pendingEffect) setEffectPromptDismissed(false)
  }, [pendingEffect])

  useEffect(() => {
    if (state.phase !== 'initial-peek') setPeekConfirmedLocal(false)
  }, [state.phase])

  useEffect(() => {
    if (!pendingEffect) setMySwapPickIndex(null)
  }, [pendingEffect])

  useEffect(() => {
    if (state.phase === 'round-end' || state.phase === 'match-end' || state.phase === 'waiting') {
      setKnownCards(new Map())
      setOpponentsHoldingDrawn(new Set())
    }
  }, [state.phase])

  useEffect(() => {
    if (!me) return
    setKnownCards(prev => {
      let changed = false
      const next = new Map(prev)
      for (const c of me.hand) {
        if (!('hidden' in c) && !next.has(c.id)) {
          next.set(c.id, { rank: c.rank, suit: c.suit })
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [me])

  useEffect(() => {
    if (!drawnCard) return
    setKnownCards(prev => {
      if (prev.has(drawnCard.id)) return prev
      const next = new Map(prev)
      next.set(drawnCard.id, { rank: drawnCard.rank, suit: drawnCard.suit })
      return next
    })
  }, [drawnCard])

  const markVictimEffect = useCallback((cardId: string, kind: 'peeked' | 'swapped') => {
    setVictimEffects(prev => new Map(prev).set(cardId, kind))
    setTimeout(() => {
      setVictimEffects(prev => {
        const next = new Map(prev)
        next.delete(cardId)
        return next
      })
    }, TEMP_REVEAL_MS)
  }, [])

  useEffect(() => {
    if (prevLogLenRef.current === null) {
      prevLogLenRef.current = state.log.length
      return
    }
    if (state.log.length <= prevLogLenRef.current) {
      prevLogLenRef.current = state.log.length
      return
    }
    const newEntries = state.log.slice(prevLogLenRef.current)
    prevLogLenRef.current = state.log.length
    for (const entry of newEntries) {
      if (entry.type === 'draw' && entry.actorId !== myId) {
        setOpponentsHoldingDrawn(prev => {
          const next = new Set(prev)
          next.add(entry.actorId)
          return next
        })
      }
      if (entry.type === 'discard' && entry.actorId !== myId) {
        setOpponentsHoldingDrawn(prev => {
          if (!prev.has(entry.actorId)) return prev
          const next = new Set(prev)
          next.delete(entry.actorId)
          return next
        })
      }
      if (entry.actorId === myId) continue
      if (entry.type === 'peek') {
        const p = entry.payload as { targetPlayerId?: string; cardIndex?: number; skipped?: boolean } | undefined
        if (!p || p.skipped || p.targetPlayerId === undefined || p.cardIndex === undefined) continue
        const targetPlayer = state.players.find(pl => pl.id === p.targetPlayerId)
        const card = targetPlayer?.hand[p.cardIndex]
        if (card) markVictimEffect(card.id, 'peeked')
      }
      if (entry.type === 'swap') {
        const p = entry.payload as { targetPlayerId?: string; targetCardIndex?: number; myCardIndex?: number } | undefined
        if (!p || p.targetPlayerId === undefined || p.targetCardIndex === undefined) continue
        const targetPlayer = state.players.find(pl => pl.id === p.targetPlayerId)
        const card = targetPlayer?.hand[p.targetCardIndex]
        if (card) markVictimEffect(card.id, 'swapped')
        if (p.myCardIndex !== undefined) {
          const actorPlayer = state.players.find(pl => pl.id === entry.actorId)
          const actorCard = actorPlayer?.hand[p.myCardIndex]
          if (actorCard) markVictimEffect(actorCard.id, 'swapped')
        }
      }
    }
  }, [state.log, state.players, myId, markVictimEffect])

  const tempReveal = useCallback((cardId: string, value: RevealValue) => {
    setTempReveals(prev => new Map(prev).set(cardId, value))
    setKnownCards(prev => new Map(prev).set(cardId, value))
    setRevealModal(value)
    setTimeout(() => {
      setTempReveals(prev => {
        const next = new Map(prev)
        next.delete(cardId)
        return next
      })
    }, TEMP_REVEAL_MS)
  }, [])

  const canDraw = isMyTurn && isPlayPhase && !drawnCard
  const canSwapDrawn = isMyTurn && !!drawnCard
  const canSnap = isPlayPhase && state.discard.length > 0 && (!isMyTurn || !!drawnCard)
  const topDiscardRank = state.discard[state.discard.length - 1]?.rank ?? null
  const snapHintIds = (() => {
    if (!canSnap || !topDiscardRank || !me) return new Set<string>()
    const ids = new Set<string>()
    for (const c of me.hand) {
      const visibleRank = tempReveals.get(c.id)?.rank ?? (!('hidden' in c) ? c.rank : null)
      if (visibleRank === topDiscardRank) ids.add(c.id)
    }
    return ids
  })()
  const ownCardsClickable =
    canSwapDrawn ||
    canSnap ||
    (isMyEffect && (pendingEffect?.type === 'peek-own' || pendingEffect?.type === 'swap'))
  const opponentCardsClickable = isMyEffect && (pendingEffect?.type === 'peek-other' || (pendingEffect?.type === 'swap' && mySwapPickIndex !== null))

  function confirmInitialPeek() {
    setPeekConfirmedLocal(true)
    getSocket().emit('game:initial-peek-done', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string }) => {
      if (res?.error) { toast.error(res.error); setPeekConfirmedLocal(false) }
    })
  }

  useEffect(() => {
    if (state.phase !== 'initial-peek' || peekConfirmedLocal) return
    const t = setTimeout(() => { confirmInitialPeek() }, 4000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, peekConfirmedLocal])

  function handleDeckClick() {
    if (!canDraw) return
    getSocket().emit('game:draw', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string; payload?: { card: Card } }) => {
      if (res?.error) { toast.error(res.error); return }
      if (res.payload?.card) setDrawnCard(res.payload.card)
    })
  }

  function handleDiscardDrawn(useEffect: boolean) {
    if (!drawnCard) return
    setDrawnExit('discard')
    getSocket().emit(
      'game:keep-or-discard',
      { roomId: state.roomId, playerId: myId, action: 'discard', useEffect },
      (res: { ok?: true; error?: string }) => {
        if (res?.error) { toast.error(res.error); return }
        setDrawnCard(null)
      },
    )
  }

  function handlePlayerCardClick(handIndex: number) {
    if (!me) return
    const card = me.hand[handIndex]
    if (!card) return

    if (isMyEffect && pendingEffect) {
      if (pendingEffect.type === 'peek-own') {
        getSocket().emit('game:effect-target',
          { roomId: state.roomId, playerId: myId, targetPlayerId: myId, targetCardIndex: handIndex },
          (res: { ok?: true; error?: string; payload?: { revealed?: Array<{ card: { id: string; rank: Rank; suit: Suit | null } }> } }) => {
            if (res?.error) { toast.error(res.error); return }
            const r = res.payload?.revealed?.[0]
            if (r) tempReveal(r.card.id, { rank: r.card.rank, suit: r.card.suit })
          })
        return
      }
      if (pendingEffect.type === 'swap') {
        setMySwapPickIndex(handIndex)
        return
      }
      return
    }

    const knownRank = knownCards.get(card.id)?.rank ?? (!('hidden' in card) ? card.rank : null)
    const wouldMatchSnap = topDiscardRank !== null && knownRank !== null && knownRank === topDiscardRank

    if (drawnCard && isMyTurn && !wouldMatchSnap) {
      setDrawnExit('swap')
      getSocket().emit('game:keep-or-discard',
        { roomId: state.roomId, playerId: myId, action: 'keep', handIndex },
        (res: { ok?: true; error?: string }) => {
          if (res?.error) { toast.error(res.error); return }
          setDrawnCard(null)
        })
      return
    }

    if (canSnap) {
      if (handIndex >= me.hand.length) return
      const now = Date.now()
      if (now - lastSnapAt.current < 500) return
      lastSnapAt.current = now
      getSocket().emit('game:snap', { roomId: state.roomId, playerId: myId, handIndex }, (res: { ok?: true; error?: string }) => {
        if (res?.error && res.error !== 'INVALID_HAND_INDEX') toast.error(res.error)
      })
    }
  }

  function handleOpponentCardClick(opponentId: string, handIndex: number) {
    if (!isMyEffect || !pendingEffect) return
    if (pendingEffect.type === 'peek-other') {
      getSocket().emit('game:effect-target',
        { roomId: state.roomId, playerId: myId, targetPlayerId: opponentId, targetCardIndex: handIndex },
        (res: { ok?: true; error?: string; payload?: { revealed?: Array<{ card: { id: string; rank: Rank; suit: Suit | null } }> } }) => {
          if (res?.error) { toast.error(res.error); return }
          const r = res.payload?.revealed?.[0]
          if (r) tempReveal(r.card.id, { rank: r.card.rank, suit: r.card.suit })
        })
      return
    }
    if (pendingEffect.type === 'swap' && mySwapPickIndex !== null) {
      getSocket().emit('game:effect-target',
        { roomId: state.roomId, playerId: myId, targetPlayerId: opponentId, targetCardIndex: handIndex, myCardIndex: mySwapPickIndex },
        (res: { ok?: true; error?: string }) => {
          if (res?.error) { toast.error(res.error); return }
          setMySwapPickIndex(null)
        })
    }
  }

  const highlightedIds = new Set<string>()
  if (mySwapPickIndex !== null && me) {
    const c = me.hand[mySwapPickIndex]
    if (c) highlightedIds.add(c.id)
  }

  let instruction: string | null = null
  if (isMyEffect && pendingEffect) {
    if (pendingEffect.type === 'peek-own') {
      instruction = 'OLHADINHA — clica em UMA das suas cartas pra espiar (ou pula)'
    } else if (pendingEffect.type === 'peek-other') {
      instruction = 'ESPIADINHA — clica em UMA carta de um adversário pra espiar (ou pula)'
    } else if (pendingEffect.type === 'swap') {
      instruction = mySwapPickIndex === null
        ? 'TROCA — escolhe UMA das suas cartas pra trocar (ou pula)'
        : 'TROCA — agora escolhe UMA carta do adversário pra trocar com a sua'
    }
  } else if (isPlayPhase && isMyTurn && !drawnCard) {
    instruction = '👆 Clica no baralho pra comprar'
  } else if (drawnCard && isMyTurn) {
    instruction = null
  } else if (isPlayPhase && !isMyTurn && state.discard.length > 0) {
    instruction = '✂️ Vez de outro — clica uma carta SUA pra cortar (se bater com o descarte)'
  }

  const opponentPos = (idx: number): string => {
    const count = opponents.length
    const mobileStack = ['top-12 left-2 right-2', 'top-24 left-2 right-2', 'top-36 left-2 right-2'][idx] ?? ''
    if (count === 1) return `${mobileStack} sm:top-14 sm:left-1/2 sm:right-auto sm:-translate-x-1/2`
    if (count === 2) {
      if (idx === 0) return `${mobileStack} sm:top-14 sm:left-10 sm:right-auto`
      return `${mobileStack} sm:top-14 sm:right-10 sm:left-auto`
    }
    if (idx === 0) return `${mobileStack} sm:top-14 sm:left-1/2 sm:right-auto sm:-translate-x-1/2`
    if (idx === 1) return `${mobileStack} sm:top-1/4 sm:left-8 sm:right-auto`
    return `${mobileStack} sm:top-1/4 sm:right-8 sm:left-auto`
  }

  const leaderId = (() => {
    const playing = state.players.filter(p => p.connected || p.score > 0)
    const pool = playing.length > 0 ? playing : state.players
    if (pool.every(p => p.score === pool[0]?.score)) return null
    return pool.reduce((best, p) => (p.score < best.score ? p : best), pool[0]!).id
  })()


  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Background />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 50% 52%, rgba(255, 184, 28, 0.30) 0%, rgba(255, 184, 28, 0.10) 40%, transparent 75%)',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: 'min(720px, 80vw)',
          height: 'min(420px, 50vh)',
          background: 'radial-gradient(ellipse, rgba(26, 14, 8, 0.10) 0%, transparent 70%)',
          boxShadow: 'inset 0 0 60px rgba(26, 14, 8, 0.12)',
        }}
      />

      {opponents.map((p, i) => (
        <div key={p.id} className={`absolute z-20 ${opponentPos(i)}`}>
          <OpponentArea
            player={p}
            isCurrent={p.id === currentPlayerId}
            isHost={p.id === state.hostId}
            isLeader={p.id === leaderId}
            onCardClick={opponentCardsClickable ? (idx) => handleOpponentCardClick(p.id, idx) : undefined}
            tempReveals={tempReveals}
            highlightedIds={highlightedIds}
            victimEffects={victimEffects}
            holdingDrawn={opponentsHoldingDrawn.has(p.id)}
            emote={emotes.get(p.id) ?? null}
          />
        </div>
      ))}

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="relative max-w-[calc(100vw-1rem)] px-2 sm:px-12 py-2 sm:py-8 rounded-2xl sm:rounded-3xl border-[3px] sm:border-[4px] border-bate-ink bg-bate-paper/70 shadow-hard sm:shadow-hard-lg backdrop-blur-sm">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-bate-ink text-bate-gold font-display text-[10px] tracking-[0.25em] uppercase whitespace-nowrap shadow-hard-sm rotate-[-1deg]">
            ✦ MESA ✦
          </div>
          <div className="flex items-center gap-2 sm:gap-14">
            <DeckPile2D count={state.deckCount} onClick={canDraw ? handleDeckClick : undefined} />
            <AnimatePresence mode="wait">
              {drawnCard ? (
                <motion.div
                  key={drawnCard.id}
                  exit={
                    drawnExit === 'swap'
                      ? { y: 260, x: 0, opacity: 0, scale: 0.5, rotate: -8 }
                      : { y: 0, x: 180, opacity: 0, scale: 0.5, rotate: 12 }
                  }
                  transition={{ duration: 0.42, ease: [0.55, 0, 0.55, 1] }}
                >
                  <DrawnCard2D
                    card={drawnCard}
                    onUseAction={() => handleDiscardDrawn(true)}
                    onDiscard={() => handleDiscardDrawn(false)}
                  />
                </motion.div>
              ) : isMyEffect && pendingEffect && !effectPromptDismissed ? (
                <EffectPrompt
                  key="prompt"
                  kind={pendingEffect.type}
                  onUse={() => setEffectPromptDismissed(true)}
                  onSkip={() => {
                    setMySwapPickIndex(null)
                    setEffectPromptDismissed(false)
                    getSocket().emit('game:skip-effect', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string }) => {
                      if (res?.error) toast.error(res.error)
                    })
                  }}
                />
              ) : isMyEffect && pendingEffect && effectPromptDismissed ? (
                <motion.button
                  key="skipBtn"
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    setMySwapPickIndex(null)
                    setEffectPromptDismissed(false)
                    getSocket().emit('game:skip-effect', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string }) => {
                      if (res?.error) toast.error(res.error)
                    })
                  }}
                  className="px-3 py-2 rounded-xl bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm text-bate-ink/80 text-[10px] sm:text-xs font-display whitespace-nowrap"
                >
                  ✕ pular ação
                </motion.button>
              ) : null}
            </AnimatePresence>
            <DiscardPile2D discard={state.discard} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-16 sm:bottom-8 left-1/2 -translate-x-1/2 z-20">
        {me && (
          <PlayerHand2D
            player={me}
            isCurrent={isMyTurn}
            isHost={me.id === state.hostId}
            isLeader={me.id === leaderId}
            onCardClick={ownCardsClickable ? handlePlayerCardClick : undefined}
            tempReveals={tempReveals}
            highlightedIds={highlightedIds}
            victimEffects={victimEffects}
            snapHintIds={snapHintIds}
            emote={emotes.get(me.id) ?? null}
          />
        )}
      </div>

      <BateButton state={state} drawnExists={!!drawnCard} />
      <InstructionBar text={instruction} />
      <PeekModal reveal={revealModal} onClose={() => setRevealModal(null)} />
      <ActionLog state={state} />
      <TopChrome state={state} />
      <LeaveButton roomId={state.roomId} inGame={state.phase !== 'waiting'} />
      <button
        type="button"
        onClick={() => {
          const sock = getSocket()
          const name = (typeof window !== 'undefined' ? window.localStorage.getItem('bate:name') : null) ?? me?.name ?? ''
          sock.emit('room:join', { roomId: state.roomId, playerId: myId, playerName: name }, (res: { ok?: true; error?: string }) => {
            if (res?.error) toast.error(`Resync falhou: ${res.error}`)
          })
        }}
        title="Forçar resync com o servidor (se algo travar)"
        className="fixed bottom-2 left-2 sm:bottom-4 sm:left-4 z-40 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-bate-paper border-[2px] sm:border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold text-sm"
      >
        🔄
      </button>
      <SnapToast state={state} />
      <PenaltyPreview state={state} />
      <BateAnnouncement state={state} />
      <EmoteBar roomId={state.roomId} />
    </div>
  )
}
