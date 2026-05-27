// src/lib/mascot-overlay/triggers/peek-own.ts
// Dispara animação de olhadinha quando:
// - EU disparei: localActions.peekRevealed muda (set pelo GameArea no socket callback)
// - OUTRO disparou: state.log ganha entrada nova { type: 'peek', actorId !== myId }
//   E o targetPlayerId é o próprio actor (peek-own dele).
//
// PADRÃO PARA TODOS OS TRIGGERS (replicar nos 4 próximos):
// - overlayRef: RefObject (passado direto, sem useState extra)
// - onX callback: capturado via useRef pra evitar re-fire em renders do parent

import { useEffect, useRef, type RefObject } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, LUPA } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlayRef: RefObject<HTMLElement | null>
  controller: Controller
  localPeek: { cardId: string; reveal: { rank: Rank; suit: Suit | null } } | null
  onArrived: (reveal: { rank: Rank; suit: Suit | null }) => void
  onCardsSelected?: (cardIds: string[]) => void
  onCardsUnselected?: () => void
}

export function usePeekOwnTrigger({ state, myId, overlayRef, controller, localPeek, onArrived, onCardsSelected, onCardsUnselected }: Args) {
  // callback estável via ref — evita re-fire do effect quando parent re-renderiza
  const onArrivedRef = useRef(onArrived)
  const onCardsSelectedRef = useRef(onCardsSelected)
  const onCardsUnselectedRef = useRef(onCardsUnselected)
  useEffect(() => {
    onArrivedRef.current = onArrived
    onCardsSelectedRef.current = onCardsSelected
    onCardsUnselectedRef.current = onCardsUnselected
  })

  // ---- caso A: EU sou o ator ----
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !localPeek) return
    const key = `${localPeek.cardId}:${localPeek.reveal.rank}:${localPeek.reveal.suit ?? ''}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    const fromRect = getRect('[data-discard-pile]')
    const toRect = getRect(`[data-card-id="${CSS.escape(localPeek.cardId)}"]`)
    onCardsSelectedRef.current?.([localPeek.cardId])
    controller.runFlight({
      overlay,
      fromRect,
      toRect,
      travelAsset: FELIZ,
      arrivalAsset: LUPA,
      box: boxFor(140, [FELIZ, LUPA]),
      onArrived: () => onArrivedRef.current(localPeek.reveal),
      onComplete: () => onCardsUnselectedRef.current?.(),
    })
  }, [overlayRef, controller, localPeek])

  // ---- caso B: OUTRO é o ator ----
  const prevLogLenRef = useRef<number | null>(null)
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return
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
      if (entry.type !== 'peek') continue
      if (entry.actorId === myId) continue
      const p = entry.payload as { targetPlayerId?: string; cardIndex?: number; skipped?: boolean } | undefined
      if (!p || p.skipped) continue
      if (p.targetPlayerId !== entry.actorId) continue
      if (p.cardIndex === undefined) continue

      const targetPlayer = state.players.find((pl) => pl.id === p.targetPlayerId)
      const card = targetPlayer?.hand[p.cardIndex]
      if (!card) continue

      const fromRect = getRect('[data-discard-pile]')
      const toRect = getRect(`[data-card-id="${CSS.escape(card.id)}"]`)
      onCardsSelectedRef.current?.([card.id])
      controller.runFlight({
        overlay,
        fromRect,
        toRect,
        travelAsset: FELIZ,
        arrivalAsset: LUPA,
        box: boxFor(140, [FELIZ, LUPA]),
        onComplete: () => onCardsUnselectedRef.current?.(),
      })
    }
  }, [overlayRef, controller, state.log, state.players, myId])
}
