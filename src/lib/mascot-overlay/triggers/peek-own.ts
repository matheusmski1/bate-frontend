// src/lib/mascot-overlay/triggers/peek-own.ts
// Dispara animação de olhadinha quando:
// - EU disparei: localActions.peekRevealed muda (set pelo GameArea no socket callback)
// - OUTRO disparou: state.log ganha entrada nova { type: 'peek', actorId !== myId }
//   E o targetPlayerId é o próprio actor (peek-own dele).

import { useEffect, useRef } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, LUPA } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlay: HTMLElement | null
  controller: Controller
  localPeek: { cardId: string; reveal: { rank: Rank; suit: Suit | null } } | null
  onArrived: (reveal: { rank: Rank; suit: Suit | null }) => void
}

export function usePeekOwnTrigger({ state, myId, overlay, controller, localPeek, onArrived }: Args) {
  // ---- caso A: EU sou o ator ----
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!overlay || !localPeek) return
    const key = `${localPeek.cardId}:${localPeek.reveal.rank}:${localPeek.reveal.suit ?? ''}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    const fromRect = getRect('[data-discard-pile]')
    const toRect = getRect(`[data-card-id="${CSS.escape(localPeek.cardId)}"]`)
    controller.runFlight({
      overlay,
      fromRect,
      toRect,
      travelAsset: FELIZ,
      arrivalAsset: LUPA,
      box: boxFor(140, [FELIZ, LUPA]),
      onArrived: () => onArrived(localPeek.reveal),
    })
  }, [overlay, controller, localPeek, onArrived])

  // ---- caso B: OUTRO é o ator ----
  const prevLogLenRef = useRef<number | null>(null)
  useEffect(() => {
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
      // peek-own significa actor === targetPlayer
      if (p.targetPlayerId !== entry.actorId) continue
      if (p.cardIndex === undefined) continue

      const targetPlayer = state.players.find((pl) => pl.id === p.targetPlayerId)
      const card = targetPlayer?.hand[p.cardIndex]
      if (!card) continue

      const fromRect = getRect('[data-discard-pile]')
      const toRect = getRect(`[data-card-id="${CSS.escape(card.id)}"]`)
      controller.runFlight({
        overlay,
        fromRect,
        toRect,
        travelAsset: FELIZ,
        arrivalAsset: LUPA,
        box: boxFor(140, [FELIZ, LUPA]),
      })
    }
  }, [overlay, controller, state.log, state.players, myId])
}
