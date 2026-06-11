'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { RedactedState, RedactedPlayer, Rank, Suit, Card } from '@/types/shared'
import { CARD_META, getCardImage } from '@/lib/card-meta'
import { Background } from '@/components/room2d/Background'
import { ArenaDecorationsLayer } from '@/components/room2d/ArenaDecorationsLayer'
import { OpponentArea } from '@/components/room2d/OpponentArea'
import { PlayerHand2D } from '@/components/room2d/PlayerHand2D'
import { DeckPile2D } from '@/components/room2d/DeckPile2D'
import { DiscardPile2D } from '@/components/room2d/DiscardPile2D'
import { TopChrome } from '@/components/room2d/TopChrome'
import { BateButton } from '@/components/room2d/BateButton'
import { InstructionBar } from '@/components/room2d/InstructionBar'
import { ActionLog } from '@/components/room2d/ActionLog'
import { LeaveButton } from '@/components/room2d/LeaveButton'
import { EmoteBar } from '@/components/room2d/EmoteBar'
import { SnapToast } from '@/components/room2d/SnapToast'
import { PenaltyPreview } from '@/components/room2d/PenaltyPreview'
import { BateAnnouncement } from '@/components/room2d/BateAnnouncement'
import {
  createController,
  type Controller,
  boxFor,
  getRect,
  FELIZ,
  LUPA,
  ESPIADINHA,
  TROCA,
  ASSUSTADO,
  TEMPO,
} from '@/lib/mascot-overlay'

function mockPlayer(id: string, name: string, score: number): RedactedPlayer {
  return {
    id,
    socketId: 'sock-' + id,
    name,
    hand: [
      { id: id + '-c0', hidden: true },
      { id: id + '-c1', hidden: true },
      { id: id + '-c2', hidden: true },
      { id: id + '-c3', hidden: true },
    ],
    score,
    connected: true,
    disconnectedAt: null,
    revealedToSelf: [],
    deck: 'default',
    arena: 'default',
  }
}

function mockState(opponentCount: 1 | 2 | 3, withTimer = false): RedactedState {
  const me = mockPlayer('me', 'Matheus', 12)
  const opponents = [
    mockPlayer('opp1', 'André', 8),
    mockPlayer('opp2', 'Bruna', 15),
    mockPlayer('opp3', 'Caio', 4),
  ].slice(0, opponentCount)
  return {
    roomId: 'mock',
    name: 'Mock Room',
    hostId: 'me',
    maxPlayers: (opponentCount + 1) as 2 | 3 | 4,
    players: [me, ...opponents],
    discard: [{ id: 'disc1', rank: 'Q', suit: 'hearts' }],
    deckCount: 24,
    turn: 0,
    phase: 'playing',
    bateCallerId: null,
    turnsRemaining: null,
    pendingEffect: null,
    snapWindow: null,
    log: [
      { timestamp: Date.now() - 30000, type: 'draw', actorId: 'opp1' },
      { timestamp: Date.now() - 20000, type: 'discard', actorId: 'opp1', payload: { rank: '5' } },
      { timestamp: Date.now() - 10000, type: 'draw', actorId: 'me' },
    ],
    createdAt: Date.now() - 60000,
    turnTimeLimitSec: withTimer ? 30 : null,
    turnDeadlineAt: withTimer ? Date.now() + 22000 : null,
    paused: false,
    pausedRemainingMs: null,
    roundTurnCount: 3,
    roundNumber: 1,
    roundStartedAt: Date.now() - 45000,
    pendingJoins: [],
    spectators: [],
  }
}

type Seat = 'top' | 'left' | 'right'

function seatFor(idx: number, count: number): Seat {
  if (count === 1) return 'top'
  if (count === 2) return idx === 0 ? 'left' : 'right'
  // 3 opponents: idx 0=left, 1=top, 2=right (UNO style)
  if (idx === 0) return 'left'
  if (idx === 1) return 'top'
  return 'right'
}

function opponentPosUno(seat: Seat): string {
  // Mobile: todos opponents na mesma slot (tabs controlam qual aparece).
  // top-24 deixa espaço pra TopChrome (top-2) + tabs (top-12)
  const mobileSlot = 'top-24 left-2 right-2'
  if (seat === 'top') return `${mobileSlot} sm:top-8 sm:left-1/2 sm:right-auto sm:-translate-x-1/2`
  if (seat === 'left') return `${mobileSlot} sm:top-1/2 sm:left-8 sm:right-auto sm:-translate-y-1/2`
  return `${mobileSlot} sm:top-1/2 sm:right-8 sm:left-auto sm:-translate-y-1/2`
}

function rotationFor(seat: Seat): string {
  if (seat === 'left') return 'rotate(90deg)'
  if (seat === 'right') return 'rotate(-90deg)'
  return 'rotate(180deg)'
}

export default function TestLayoutPage() {
  // Detecta modo "bare" via URL — quando true, esconde a toolbar e fica
  // totalmente controlado por postMessage (usado pelo /test-mobile)
  const [isBare, setIsBare] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsBare(new URLSearchParams(window.location.search).get('bare') === '1')
  }, [])

  const [opponentCount, setOpponentCount] = useState<1 | 2 | 3>(3)
  const [meIndex, setMeIndex] = useState(0)
  const [showRealUI, setShowRealUI] = useState(true)
  const state = mockState(opponentCount, true)
  const allPlayers = state.players
  const me = allPlayers[meIndex] ?? allPlayers[0]!
  const opponents = allPlayers.filter(p => p.id !== me.id)
  const arenaId = 'default'

  // Mobile: qual oponente é mostrado em destaque (tabs controlam)
  const [activeOppIdx, setActiveOppIdx] = useState(0)
  useEffect(() => {
    if (activeOppIdx >= opponents.length) setActiveOppIdx(0)
  }, [opponents.length, activeOppIdx])

  // Stage com tamanho fixo de design (1280x800) que é escalado uniformemente
  // pra caber em qualquer viewport. Padrão usado por jogos como Hearthstone/Marvel Snap.
  const STAGE_W = 1280
  const STAGE_H = 800

  // Overlay e controller pra animações de mascote
  const overlayRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<Controller | null>(null)
  const tempoCancelRef = useRef<{ cancel: () => void } | null>(null)
  const [eventLog, setEventLog] = useState<string[]>([])
  const [tempoActive, setTempoActive] = useState(false)

  // Modo de seleção: cada animação que precisa de alvo entra em modo de seleção
  // e aguarda o user clicar numa carta antes de rodar.
  // 'drawn-swap': substitui uma carta minha pela carta comprada (drawn → mão, antiga → descarte)
  type SelectionMode = 'peek-own' | 'peek-other' | 'swap-mine' | 'swap-target' | 'drawn-swap'
  const [selection, setSelection] = useState<{ mode: SelectionMode | null; myCardId?: string }>({ mode: null })

  // Carta "comprada" — renderiza DrawnCard2D no centro da mesa
  const [drawnCard, setDrawnCard] = useState<Card | null>(null)


  useEffect(() => {
    if (!controllerRef.current) controllerRef.current = createController()
    return () => { tempoCancelRef.current?.cancel() }
  }, [])

  // Persiste meu playerId no localStorage pra getPlayerId() em TopChrome/BateButton
  // funcionar corretamente. Atualiza quando troca de perspectiva.
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('bate:player-id', me.id)
      window.localStorage.setItem('bate:player-name', me.name)
    }
  }, [me.id, me.name])

  const log = (msg: string) =>
    setEventLog(prev => [...prev.slice(-8), `${new Date().toISOString().slice(11, 23)} ${msg}`])

  // Mock de carta revelada — em produção viria do servidor
  const mockReveal = (): { rank: Rank; suit: Suit | null } => ({
    rank: (['A', '2', '5', '7', '9', 'K', 'JOKER'] as Rank[])[Math.floor(Math.random() * 7)]!,
    suit: 'hearts',
  })

  const runPeekOwn = (cardId: string) => {
    const ctrl = controllerRef.current
    const overlay = overlayRef.current
    if (!ctrl || !overlay) return
    log(`▶ peek-own → ${cardId}`)
    setActiveSelectedIds([cardId])
    ctrl.runFlight({
      overlay,
      fromRect: getRect('[data-discard-pile]'),
      toRect: getRect(`[data-card-id="${CSS.escape(cardId)}"]`),
      travelAsset: FELIZ,
      arrivalAsset: LUPA,
      box: boxFor(140, [FELIZ, LUPA]),
      onArrived: () => log('✓ peek-own arrived (carta vira no tabuleiro)'),
      onComplete: () => {
        log('✓ peek-own complete')
        setActiveSelectedIds([])
      },
    })
  }

  const runPeekOther = (cardId: string, ownerName: string) => {
    const ctrl = controllerRef.current
    const overlay = overlayRef.current
    if (!ctrl || !overlay) return
    log(`▶ peek-other → ${ownerName} ${cardId}`)
    setActiveSelectedIds([cardId])
    ctrl.runFlight({
      overlay,
      fromRect: getRect('[data-discard-pile]'),
      toRect: getRect(`[data-card-id="${CSS.escape(cardId)}"]`),
      travelAsset: FELIZ,
      arrivalAsset: ESPIADINHA,
      box: boxFor(140, [FELIZ, ESPIADINHA]),
      onArrived: () => log('✓ peek-other arrived (carta vira no tabuleiro)'),
      onComplete: () => {
        log('✓ peek-other complete')
        setActiveSelectedIds([])
      },
    })
  }

  const runSwap = (myCardId: string, oppCardId: string, oppName: string) => {
    const ctrl = controllerRef.current
    const overlay = overlayRef.current
    if (!ctrl || !overlay) return
    log(`▶ swap (${myCardId} ↔ ${oppName} ${oppCardId})`)
    setActiveSelectedIds([myCardId, oppCardId])
    ctrl.runSwapDelivery({
      overlay,
      fromRect: getRect('[data-discard-pile]'),
      midRect: getRect(`[data-card-id="${CSS.escape(myCardId)}"]`),
      toRect: getRect(`[data-card-id="${CSS.escape(oppCardId)}"]`),
      travelAsset: FELIZ,
      carryAsset: TROCA,
      box: boxFor(140, [FELIZ, TROCA]),
      onSwapped: () => log('✓ swap swapped'),
      onComplete: () => {
        log('✓ swap complete')
        setActiveSelectedIds([])
      },
    })
  }

  const runSnap = (ok: boolean) => {
    const ctrl = controllerRef.current
    const overlay = overlayRef.current
    if (!ctrl || !overlay) return
    const asset = ok ? FELIZ : ASSUSTADO
    log(`▶ snap ${ok ? 'OK' : 'ERR'}`)
    ctrl.popOnCard({
      overlay,
      targetRect: getRect(`[data-player-nameplate="${CSS.escape(me.id)}"]`),
      asset,
      variant: ok ? 'success' : 'shake',
      box: boxFor(130, [asset]),
      onComplete: () => log(`✓ snap ${ok ? 'OK' : 'ERR'} complete`),
    })
  }

  const runTempo = () => {
    const ctrl = controllerRef.current
    const overlay = overlayRef.current
    if (!ctrl || !overlay) return
    if (tempoCancelRef.current) {
      tempoCancelRef.current.cancel()
      tempoCancelRef.current = null
      setTempoActive(false)
      log('✕ tempo detach')
      return
    }
    const opp = opponents[0]
    if (!opp) return
    log(`▶ tempo attach em ${opp.name}`)
    tempoCancelRef.current = ctrl.attachLoop({
      overlay,
      anchorRect: getRect(`[data-opponent-nameplate="${CSS.escape(opp.id)}"]`),
      asset: TEMPO,
      box: boxFor(110, [TEMPO]),
      position: 'top-right',
    })
    setTempoActive(true)
  }

  const cancelSelection = () => {
    setSelection({ mode: null })
    log('✕ seleção cancelada')
  }

  const [flashCardId, setFlashCardId] = useState<string | null>(null)
  // Cartas atualmente "selecionadas" — ficam elevadas durante a animação
  const [activeSelectedIds, setActiveSelectedIds] = useState<string[]>([])

  const onMyCardClick = (handIndex: number) => {
    const card = me.hand[handIndex]
    if (!card) return
    if (selection.mode === 'peek-own') {
      runPeekOwn(card.id)
      setSelection({ mode: null })
    } else if (selection.mode === 'swap-mine') {
      log(`• swap: minha carta #${handIndex} escolhida, agora clica numa de oponente`)
      setSelection({ mode: 'swap-target', myCardId: card.id })
    } else if (selection.mode === 'drawn-swap') {
      log(`✓ carta #${handIndex} foi pro descarte, comprada entrou no slot`)
      setFlashCardId(card.id)
      setTimeout(() => setFlashCardId(null), 900)
      setSelection({ mode: null })
    }
  }

  const onOppCardClick = (oppId: string, handIndex: number) => {
    const opp = opponents.find(p => p.id === oppId)
    const card = opp?.hand[handIndex]
    if (!opp || !card) return
    if (selection.mode === 'peek-other') {
      runPeekOther(card.id, opp.name)
      setSelection({ mode: null })
    } else if (selection.mode === 'swap-target' && selection.myCardId) {
      runSwap(selection.myCardId, card.id, opp.name)
      setSelection({ mode: null })
    }
  }

  const selectionHint = (() => {
    if (selection.mode === 'peek-own') return '👁 Clica numa carta SUA pra espiar (olhadinha)'
    if (selection.mode === 'peek-other') return '🔍 Clica numa carta de OPONENTE pra espiar (espiadinha)'
    if (selection.mode === 'swap-mine') return '🔄 Clica numa carta SUA (1/2)'
    if (selection.mode === 'swap-target') return '🔄 Clica numa carta de OPONENTE (2/2)'
    if (selection.mode === 'drawn-swap') return '🔄 Clica qual carta SUA vai pro descarte'
    return null
  })()

  // Comprar uma carta (simula `draw`) — abre DrawnCard2D no centro da mesa
  const drawCard = (rank: Rank) => {
    setDrawnCard({ id: 'drawn-' + Date.now(), rank, suit: 'hearts' })
    log(`▶ comprou ${rank}`)
  }

  // Usuário clica USE no DrawnCard2D — entra em modo de seleção do efeito
  const onUseDrawn = () => {
    if (!drawnCard) return
    const rank = drawnCard.rank
    log(`✓ ${rank} usada — abriu modo de seleção`)
    setDrawnCard(null)
    if (rank === '10') setSelection({ mode: 'peek-own' })
    else if (rank === 'J') setSelection({ mode: 'peek-other' })
    else if (rank === 'Q') setSelection({ mode: 'swap-mine' })
  }

  const onDiscardDrawn = () => {
    if (!drawnCard) return
    log(`✕ ${drawnCard.rank} descartada (sem ação)`)
    setDrawnCard(null)
  }

  // Trocar carta comprada com uma minha: drawn vai pra mão, antiga vai pro descarte
  const onSwapDrawn = () => {
    if (!drawnCard) return
    log(`▶ trocar ${drawnCard.rank} com minha carta — clica qual`)
    setDrawnCard(null)
    setSelection({ mode: 'drawn-swap' })
  }

  // Ref pra latest action functions — message handler chama via ref pra não
  // ficar com closure stale (useEffect roda só uma vez)
  const actionsRef = useRef({ drawCard, runSnap, runTempo })
  useEffect(() => {
    actionsRef.current = { drawCard, runSnap, runTempo }
  })

  // Listener de postMessage — quando embedded em iframe (/test-mobile), o
  // parent envia comandos por aqui. Aceita config (opp/me/hud) e ações
  // (draw-card, snap, tempo).
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data
      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return
      if (msg.type === 'set-opp-count') setOpponentCount(msg.value)
      else if (msg.type === 'set-me-index') setMeIndex(msg.value)
      else if (msg.type === 'set-hud') setShowRealUI(msg.value)
      else if (msg.type === 'draw-card') actionsRef.current.drawCard(msg.rank)
      else if (msg.type === 'run-snap') actionsRef.current.runSnap(msg.ok)
      else if (msg.type === 'run-tempo') actionsRef.current.runTempo()
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bate-cream flex items-center justify-center">
      <Background arenaId={arenaId} />

      {/* Toolbar fora do stage — fica em tamanho real (não escala). Escondida
          em modo bare (controlado externamente via postMessage) */}
      {!isBare && (
      <div className="fixed top-2 left-2 z-50 flex flex-col gap-2 bg-bate-paper border-[2px] border-bate-ink rounded-xl p-2 shadow-hard-sm">
        <div className="flex gap-2 items-center">
          <span className="font-display text-xs text-bate-ink/80 self-center w-20">Oponentes:</span>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setOpponentCount(n as 1 | 2 | 3)
                if (meIndex > n) setMeIndex(0)
              }}
              className={`px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink ${
                opponentCount === n ? 'bg-bate-gold' : 'bg-bate-paper hover:bg-bate-cream'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-display text-xs text-bate-ink/80 self-center w-20">Eu sou:</span>
          {allPlayers.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setMeIndex(idx)}
              className={`px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink whitespace-nowrap ${
                meIndex === idx ? 'bg-bate-red text-bate-paper' : 'bg-bate-paper hover:bg-bate-cream'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center flex-wrap pt-1 border-t border-bate-ink/30">
          <span className="font-display text-xs text-bate-ink/80 self-center w-20">Comprar:</span>
          <button type="button" onClick={() => drawCard('10')} className="px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink bg-bate-paper hover:bg-bate-gold">10 (olha)</button>
          <button type="button" onClick={() => drawCard('J')} className="px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink bg-bate-paper hover:bg-bate-gold">J (espia)</button>
          <button type="button" onClick={() => drawCard('Q')} className="px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink bg-bate-paper hover:bg-bate-gold">Q (troca)</button>
          <button type="button" onClick={() => drawCard('5')} className="px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink bg-bate-paper hover:bg-bate-gold">5 (num)</button>
          <button type="button" onClick={() => drawCard('K')} className="px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink bg-bate-paper hover:bg-bate-gold">K (prata)</button>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="font-display text-xs text-bate-ink/80 self-center w-20">Outras:</span>
          <button type="button" onClick={() => runSnap(true)} className="px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink bg-bate-paper hover:bg-bate-gold">snap OK</button>
          <button type="button" onClick={() => runSnap(false)} className="px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink bg-bate-red text-bate-paper hover:bg-bate-red/90">snap ERR</button>
          <button type="button" onClick={runTempo} className={`px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink ${tempoActive ? 'bg-bate-red text-bate-paper' : 'bg-bate-paper hover:bg-bate-gold'}`}>
            tempo {tempoActive ? '(stop)' : ''}
          </button>
        </div>

        {selectionHint && (
          <div className="flex items-center gap-2 pt-1 border-t border-bate-ink/30">
            <span className="font-display text-xs text-bate-red">{selectionHint}</span>
            <button type="button" onClick={cancelSelection} className="px-2 py-0.5 rounded-md font-display text-[10px] border-2 border-bate-ink bg-bate-paper hover:bg-bate-cream">cancelar</button>
          </div>
        )}

        <div className="flex gap-2 items-center pt-1 border-t border-bate-ink/30">
          <span className="font-display text-xs text-bate-ink/80 self-center w-20">HUD real:</span>
          <button
            type="button"
            onClick={() => setShowRealUI(v => !v)}
            className={`px-2 py-1 rounded-md font-display text-xs border-2 border-bate-ink ${showRealUI ? 'bg-bate-gold' : 'bg-bate-paper hover:bg-bate-cream'}`}
          >
            {showRealUI ? 'ON' : 'OFF'}
          </button>
        </div>

        {eventLog.length > 0 && (
          <div className="font-mono text-[10px] text-bate-ink/80 max-h-24 overflow-y-auto pt-1 border-t border-bate-ink/30">
            {eventLog.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
      </div>
      )}

      {/* Banner de seleção — entre oponente e mesa no mobile, topo no desktop */}
      <AnimatePresence>
        {selectionHint && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="fixed top-[22%] sm:top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
          >
            <div className="flex items-center gap-2 px-2.5 py-1 sm:px-5 sm:py-3 rounded-xl sm:rounded-full bg-bate-gold border-[2px] sm:border-[3px] border-bate-ink shadow-hard-sm sm:shadow-hard-lg">
              <span className="font-display text-[10px] sm:text-base text-bate-ink uppercase tracking-wider text-center">{selectionHint}</span>
              <button
                type="button"
                onClick={cancelSelection}
                className="px-1.5 py-0.5 rounded-full font-display text-[9px] sm:text-xs border-2 border-bate-ink bg-bate-paper hover:bg-bate-cream shrink-0"
              >
                cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay onde os mascotes são renderizados (fora do stage scale, fixed inset-0) */}
      <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden />


      {/* Wizard: carta comprada — modal centralizado com USE/DISCARD */}
      <AnimatePresence>
        {drawnCard && (() => {
          const meta = CARD_META[drawnCard.rank]
          const isAction = meta.kind === 'action'
          return (
            <motion.div
              key="drawn-wizard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.6, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.7, y: 30, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="bg-bate-paper rounded-2xl sm:rounded-3xl border-[3px] sm:border-[4px] border-bate-ink shadow-hard-lg p-3 sm:p-8 flex flex-col items-center gap-2 sm:gap-6 max-w-sm w-full"
              >
                <div className="text-center">
                  <div className="font-display text-[9px] sm:text-xs uppercase tracking-widest text-bate-ink/60">você comprou</div>
                  <h2
                    className="font-display text-xl sm:text-4xl text-bate-red leading-none"
                    style={{
                      WebkitTextStroke: '1.5px #1a0e08',
                      textShadow: '2px 2px 0 #1a0e08, 2px 2px 0 #ffb81c',
                    }}
                  >
                    {meta.displayName ?? drawnCard.rank}
                  </h2>
                  {meta.abilityText && (
                    <p className="text-[10px] sm:text-sm text-bate-ink/80 mt-1 sm:mt-2 font-body">{meta.abilityText}</p>
                  )}
                </div>

                <motion.div
                  initial={{ rotateY: 180, scale: 0.4 }}
                  animate={{ rotateY: 0, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                  className="w-20 h-28 sm:w-36 sm:h-52 rounded-xl border-[2px] sm:border-[4px] border-bate-ink overflow-hidden shadow-hard"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <img src={getCardImage(drawnCard.rank, me.deck)} alt={drawnCard.rank} className="w-full h-full object-cover" draggable={false} />
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3 w-full">
                  {isAction && (
                    <button
                      type="button"
                      onClick={onUseDrawn}
                      className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-2xl bg-bate-gold border-[2px] sm:border-[3px] border-bate-ink shadow-hard text-bate-ink font-display uppercase text-xs sm:text-base hover:scale-105 active:scale-95 transition-transform sm:col-span-2"
                    >
                      🎯 USAR EFEITO
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onSwapDrawn}
                    className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-2xl bg-bate-red text-bate-paper border-[2px] sm:border-[3px] border-bate-ink shadow-hard font-display uppercase text-xs sm:text-base hover:scale-105 active:scale-95 transition-transform"
                  >
                    🔄 TROCAR
                  </button>
                  <button
                    type="button"
                    onClick={onDiscardDrawn}
                    className="px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-2xl bg-bate-paper border-[2px] sm:border-[3px] border-bate-ink shadow-hard-sm text-bate-ink font-display uppercase text-xs sm:text-base hover:scale-105 active:scale-95 transition-transform"
                  >
                    🗑️ DESCARTAR
                  </button>
                </div>

                <div className="hidden sm:block text-xs text-bate-ink/60 text-center font-body leading-relaxed max-w-xs">
                  {isAction
                    ? '🎯 USAR = dispara o efeito  ·  🔄 TROCAR = põe na sua mão (uma sua vai pro descarte)  ·  🗑️ DESCARTAR = sem efeito'
                    : '🔄 TROCAR = põe na sua mão (uma sua vai pro descarte)  ·  🗑️ DESCARTAR = joga fora'}
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* Componentes reais do GameArea — todos position:fixed, ficam fora do stage scale */}
      {showRealUI && (
        <>
          <TopChrome state={state} />
          <InstructionBar text={selectionHint ? null : '✋ Sua vez — clica no baralho pra comprar'} />
          <ActionLog state={state} />
          <LeaveButton roomId={state.roomId} inGame />
          <EmoteBar roomId={state.roomId} />
          <SnapToast state={state} />
          <PenaltyPreview state={state} />
          <BateAnnouncement state={state} />
        </>
      )}

      {/* Stage: design fixo 1280x800 que escala uniformemente */}
      <div
        className="relative"
        style={{
          width: STAGE_W + 'px',
          height: STAGE_H + 'px',
          transform: `scale(min(calc(100vw / ${STAGE_W}), calc(100vh / ${STAGE_H})))`,
          transformOrigin: 'center center',
        }}
      >
        <ArenaDecorationsLayer arenaId={arenaId} />
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
            width: 'min(720px, 80%)',
            height: 'min(420px, 50%)',
            background: 'radial-gradient(ellipse, rgba(26, 14, 8, 0.10) 0%, transparent 70%)',
            boxShadow: 'inset 0 0 60px rgba(26, 14, 8, 0.12)',
          }}
        />

      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full pointer-events-auto">
          {opponents.map((p, i) => {
            const seat = seatFor(i, opponents.length)
            const canClick = selection.mode === 'peek-other' || selection.mode === 'swap-target'
            return (
              <div key={p.id} className={`absolute z-20 ${opponentPosUno(seat)}`}>
                <OpponentArea
                  player={p}
                  isCurrent={i === 0}
                  isHost={false}
                  isLeader={false}
                  seat={seat}
                  onCardClick={canClick ? (idx) => onOppCardClick(p.id, idx) : undefined}
                  selectedCardIds={activeSelectedIds}
                  mobileVisible={i === activeOppIdx}
                />
              </div>
            )
          })}

          {/* Tabs mobile: troca qual oponente fica visível em destaque */}
          {opponents.length > 1 && (
            <div className="sm:hidden absolute top-12 left-2 right-2 z-30 flex gap-1.5">
              {opponents.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveOppIdx(i)}
                  className={`flex-1 px-2 py-1 rounded-full font-display text-[11px] border-2 border-bate-ink whitespace-nowrap truncate ${
                    activeOppIdx === i
                      ? 'bg-bate-gold text-bate-ink shadow-hard-sm'
                      : 'bg-bate-paper/70 text-bate-ink/70'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className={`relative max-w-[calc(100vw-1rem)] px-2 sm:px-12 py-2 sm:py-8 rounded-2xl sm:rounded-3xl border-[3px] sm:border-[4px] border-bate-ink bg-bate-paper/70 shadow-hard sm:shadow-hard-lg backdrop-blur-sm table-surface table-surface-${arenaId}`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-bate-ink text-bate-gold font-display text-[10px] tracking-[0.25em] uppercase whitespace-nowrap shadow-hard-sm rotate-[-1deg]">
                ✦ MESA ✦
              </div>
              <div className="flex flex-col items-center gap-3 sm:gap-5">
                <div className="flex items-center gap-2 sm:gap-14">
                  <DeckPile2D count={state.deckCount} viewerDeckId={me.deck} />
                  <DiscardPile2D discard={state.discard} players={state.players} />
                </div>
                {showRealUI && <BateButton state={state} drawnExists={!!drawnCard} embedded />}
              </div>
            </div>
          </div>

          <div className="absolute bottom-16 sm:bottom-8 left-1/2 -translate-x-1/2 z-20">
            <PlayerHand2D
              player={me}
              isCurrent
              isHost
              isLeader={false}
              onCardClick={selection.mode === 'peek-own' || selection.mode === 'swap-mine' || selection.mode === 'drawn-swap' ? onMyCardClick : undefined}
              victimEffects={flashCardId ? new Map([[flashCardId, 'swapped']]) : undefined}
              selectedCardIds={activeSelectedIds.length > 0 ? activeSelectedIds : (selection.mode === 'swap-target' && selection.myCardId ? [selection.myCardId] : [])}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
