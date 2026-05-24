'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { RedactedState, Card, Rank, Suit } from '@/types/shared'
import { getPlayerId } from '@/lib/player-id'
import { getSocket } from '@/lib/socket-client'
import { Background } from './Background'
import { OpponentArea } from './OpponentArea'
import { PlayerHand2D } from './PlayerHand2D'
import { DeckPile2D } from './DeckPile2D'
import { DiscardPile2D } from './DiscardPile2D'
import { DrawnCard2D } from './DrawnCard2D'
import { TurnBanner } from './TurnBanner'
import { CaboButton } from './CaboButton'
import { InstructionBar } from './InstructionBar'
import { PeekModal } from './PeekModal'
import { InitialPeekConfirm } from './InitialPeekConfirm'
import { ActionLog } from './ActionLog'
import { BateAnnouncement } from './BateAnnouncement'
import { SnapToast } from './SnapToast'
import { PenaltyPreview } from './PenaltyPreview'

const TEMP_REVEAL_MS = 3000

type RevealValue = { rank: Rank; suit: Suit | null }

export function GameArea({ state }: { state: RedactedState }) {
  const myId = getPlayerId()
  const me = state.players.find(p => p.id === myId)
  const opponents = state.players.filter(p => p.id !== myId)
  const currentPlayerId = state.players[state.turn]?.id
  const isMyTurn = currentPlayerId === myId
  const isPlayPhase = state.phase === 'playing' || state.phase === 'cabo-called'
  const pendingEffect = state.phase === 'effect-pending' ? state.pendingEffect : null
  const isMyEffect = pendingEffect?.playerId === myId

  const [drawnCard, setDrawnCard] = useState<Card | null>(null)
  const [tempReveals, setTempReveals] = useState<Map<string, RevealValue>>(new Map())
  const [knownCards, setKnownCards] = useState<Map<string, RevealValue>>(new Map())
  const [revealModal, setRevealModal] = useState<RevealValue | null>(null)
  const [mySwapPickIndex, setMySwapPickIndex] = useState<number | null>(null)
  const [peekConfirmedLocal, setPeekConfirmedLocal] = useState(false)
  const [victimEffects, setVictimEffects] = useState<Map<string, 'peeked' | 'swapped'>>(new Map())
  const [opponentsHoldingDrawn, setOpponentsHoldingDrawn] = useState<Set<string>>(new Set())
  const prevLogLenRef = useRef<number | null>(null)

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
  const canSnap = !isMyTurn && isPlayPhase && state.discard.length > 0
  const ownCardsClickable =
    canSwapDrawn ||
    canSnap ||
    (isMyEffect && (pendingEffect?.type === 'peek-own' || pendingEffect?.type === 'swap'))
  const opponentCardsClickable = isMyEffect && (pendingEffect?.type === 'peek-other' || (pendingEffect?.type === 'swap' && mySwapPickIndex !== null))

  function confirmInitialPeek() {
    setPeekConfirmedLocal(true)
    getSocket().emit('game:initial-peek-done', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string }) => {
      if (res?.error) { alert(res.error); setPeekConfirmedLocal(false) }
    })
  }

  function handleDeckClick() {
    if (!canDraw) return
    getSocket().emit('game:draw', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string; payload?: { card: Card } }) => {
      if (res?.error) { alert(res.error); return }
      if (res.payload?.card) setDrawnCard(res.payload.card)
    })
  }

  function handleDiscardDrawn() {
    if (!drawnCard) return
    getSocket().emit('game:keep-or-discard', { roomId: state.roomId, playerId: myId, action: 'discard' }, (res: { ok?: true; error?: string }) => {
      if (res?.error) { alert(res.error); return }
      setDrawnCard(null)
    })
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
            if (res?.error) { alert(res.error); return }
            const r = res.payload?.revealed?.[0]
            if (r) tempReveal(r.card.id, { rank: r.card.rank, suit: r.card.suit })
          })
        return
      }
      if (pendingEffect.type === 'swap' && mySwapPickIndex === null) {
        setMySwapPickIndex(handIndex)
        return
      }
      return
    }

    if (drawnCard && isMyTurn) {
      getSocket().emit('game:keep-or-discard',
        { roomId: state.roomId, playerId: myId, action: 'keep', handIndex },
        (res: { ok?: true; error?: string }) => {
          if (res?.error) { alert(res.error); return }
          setDrawnCard(null)
        })
      return
    }

    if (!isMyTurn && isPlayPhase && state.discard.length > 0) {
      getSocket().emit('game:snap', { roomId: state.roomId, playerId: myId, handIndex }, (res: { ok?: true; error?: string }) => {
        if (res?.error) alert(res.error)
      })
    }
  }

  function handleOpponentCardClick(opponentId: string, handIndex: number) {
    if (!isMyEffect || !pendingEffect) return
    if (pendingEffect.type === 'peek-other') {
      getSocket().emit('game:effect-target',
        { roomId: state.roomId, playerId: myId, targetPlayerId: opponentId, targetCardIndex: handIndex },
        (res: { ok?: true; error?: string; payload?: { revealed?: Array<{ card: { id: string; rank: Rank; suit: Suit | null } }> } }) => {
          if (res?.error) { alert(res.error); return }
          const r = res.payload?.revealed?.[0]
          if (r) tempReveal(r.card.id, { rank: r.card.rank, suit: r.card.suit })
        })
      return
    }
    if (pendingEffect.type === 'swap' && mySwapPickIndex !== null) {
      getSocket().emit('game:effect-target',
        { roomId: state.roomId, playerId: myId, targetPlayerId: opponentId, targetCardIndex: handIndex, myCardIndex: mySwapPickIndex },
        (res: { ok?: true; error?: string }) => {
          if (res?.error) { alert(res.error); return }
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
    instruction = 'Clica na carta comprada pra descartar, ou em uma das 4 pra trocar'
  } else if (isPlayPhase && !isMyTurn && state.discard.length > 0) {
    instruction = '✂️ Vez de outro — clica uma carta SUA pra cortar (se bater com o descarte)'
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Background />

      <div className="absolute inset-0 flex flex-col items-center justify-between py-12 px-6">
        {/* Opponents area */}
        <div className="flex gap-12 justify-center">
          {opponents.map(p => (
            <OpponentArea
              key={p.id}
              player={p}
              isCurrent={p.id === currentPlayerId}
              onCardClick={opponentCardsClickable ? (idx) => handleOpponentCardClick(p.id, idx) : undefined}
              tempReveals={tempReveals}
              highlightedIds={highlightedIds}
              victimEffects={victimEffects}
              holdingDrawn={opponentsHoldingDrawn.has(p.id)}
            />
          ))}
        </div>

        {/* Middle: deck + drawn + discard */}
        <div className="flex items-center gap-12">
          <DeckPile2D count={state.deckCount} onClick={canDraw ? handleDeckClick : undefined} />
          {drawnCard && <DrawnCard2D card={drawnCard} onClick={handleDiscardDrawn} />}
          <DiscardPile2D discard={state.discard} />
        </div>

        {/* Player hand */}
        <div>
          {me && (
            <PlayerHand2D
              player={me}
              isCurrent={isMyTurn}
              onCardClick={ownCardsClickable ? handlePlayerCardClick : undefined}
              tempReveals={tempReveals}
              highlightedIds={highlightedIds}
              victimEffects={victimEffects}
            />
          )}
        </div>
      </div>

      <TurnBanner state={state} isMyTurn={isMyTurn} myId={myId} />
      <CaboButton state={state} drawnExists={!!drawnCard} />
      <InstructionBar text={instruction} />
      <PeekModal reveal={revealModal} onClose={() => setRevealModal(null)} />
      <ActionLog state={state} />
      <SnapToast state={state} />
      <PenaltyPreview state={state} />
      <BateAnnouncement state={state} />
      {state.phase === 'initial-peek' && (
        <InitialPeekConfirm confirmed={peekConfirmedLocal} onConfirm={confirmInitialPeek} />
      )}
      {isMyEffect && (
        <button
          type="button"
          onClick={() => {
            setMySwapPickIndex(null)
            getSocket().emit('game:skip-effect', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string }) => {
              if (res?.error) alert(res.error)
            })
          }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-lg bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm text-bate-ink/80 hover:text-bate-ink hover:bg-bate-cream text-xs font-body font-semibold tracking-wide whitespace-nowrap"
        >
          ✕ pular ação
        </button>
      )}
    </div>
  )
}
