// src/lib/mascot-overlay/triggers/swap.ts
// Dispara runSwapDelivery quando:
// - EU dei swap: localActions.swapResolved set pelo GameArea no callback
// - OUTRO deu swap: state.log ganha { type: 'swap', actorId } com payload contendo
//   targetPlayerId/targetCardIndex/myCardIndex
//
// IMPORTANTE: lookup é por SLOT INDEX, não por card.id. Após o swap aplicar,
// os card.ids capturados antes da ação estão nas posições TROCADAS. Os slots
// (índice na mão de cada player) ficam fixos visualmente. Lookup via cards
// atualmente nesses slots dá as posições visuais corretas.

import { useEffect, useRef, type RefObject } from 'react'
import type { RedactedState } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, TROCA } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlayRef: RefObject<HTMLElement | null>
  controller: Controller
  localSwap: {
    actorPlayerId: string
    actorCardIndex: number
    targetPlayerId: string
    targetCardIndex: number
  } | null
  onConsumed: () => void
}

function lookupSlotRects(
  state: RedactedState,
  actorPlayerId: string,
  actorCardIndex: number,
  targetPlayerId: string,
  targetCardIndex: number,
): { midRect: DOMRect | null; toRect: DOMRect | null } {
  const actorPlayer = state.players.find((pl) => pl.id === actorPlayerId)
  const targetPlayer = state.players.find((pl) => pl.id === targetPlayerId)
  const cardAtActorSlot = actorPlayer?.hand[actorCardIndex]
  const cardAtTargetSlot = targetPlayer?.hand[targetCardIndex]
  const midRect = cardAtActorSlot
    ? getRect(`[data-card-id="${CSS.escape(cardAtActorSlot.id)}"]`)
    : null
  const toRect = cardAtTargetSlot
    ? getRect(`[data-card-id="${CSS.escape(cardAtTargetSlot.id)}"]`)
    : null
  return { midRect, toRect }
}

export function useSwapTrigger({ state, myId, overlayRef, controller, localSwap, onConsumed }: Args) {
  const onConsumedRef = useRef(onConsumed)
  useEffect(() => {
    onConsumedRef.current = onConsumed
  })

  // refs pra ler players de dentro de callbacks/effects sem incluir state.players em deps
  const statePlayersRef = useRef(state.players)
  statePlayersRef.current = state.players

  // EU como ator
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !localSwap) {
      if (!localSwap) lastLocalKeyRef.current = null
      return
    }
    const key = `${localSwap.actorPlayerId}:${localSwap.actorCardIndex}:${localSwap.targetPlayerId}:${localSwap.targetCardIndex}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    const fromRect = getRect('[data-discard-pile]')
    const { midRect, toRect } = lookupSlotRects(
      { ...state, players: statePlayersRef.current } as RedactedState,
      localSwap.actorPlayerId,
      localSwap.actorCardIndex,
      localSwap.targetPlayerId,
      localSwap.targetCardIndex,
    )
    controller.runSwapDelivery({
      overlay,
      fromRect,
      midRect,
      toRect,
      travelAsset: FELIZ,
      carryAsset: TROCA,
      box: boxFor(140, [FELIZ, TROCA]),
      onComplete: () => onConsumedRef.current(),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlayRef, controller, localSwap])

  // OUTRO como ator
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
      if (entry.type !== 'swap') continue
      if (entry.actorId === myId) continue
      const p = entry.payload as { targetPlayerId?: string; targetCardIndex?: number; myCardIndex?: number } | undefined
      if (!p || p.targetPlayerId === undefined || p.targetCardIndex === undefined || p.myCardIndex === undefined) continue

      const fromRect = getRect('[data-discard-pile]')
      const { midRect, toRect } = lookupSlotRects(state, entry.actorId, p.myCardIndex, p.targetPlayerId, p.targetCardIndex)
      if (!midRect || !toRect) continue

      controller.runSwapDelivery({
        overlay,
        fromRect,
        midRect,
        toRect,
        travelAsset: FELIZ,
        carryAsset: TROCA,
        box: boxFor(140, [FELIZ, TROCA]),
      })
    }
  }, [overlayRef, controller, state, state.log, myId])
}
