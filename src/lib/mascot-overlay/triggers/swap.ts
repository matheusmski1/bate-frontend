// src/lib/mascot-overlay/triggers/swap.ts
// Dispara runSwapDelivery quando:
// - EU dei swap: localActions.swapResolved set pelo GameArea no callback
// - OUTRO deu swap: state.log ganha { type: 'swap', actorId } com payload contendo
//   targetPlayerId/targetCardIndex/myCardIndex

import { useEffect, useRef, type RefObject } from 'react'
import type { RedactedState } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, TROCA } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlayRef: RefObject<HTMLElement | null>
  controller: Controller
  localSwap: { myCardId: string; opponentCardId: string } | null
  onConsumed: () => void
}

export function useSwapTrigger({ state, myId, overlayRef, controller, localSwap, onConsumed }: Args) {
  const onConsumedRef = useRef(onConsumed)
  useEffect(() => {
    onConsumedRef.current = onConsumed
  })

  // EU como ator
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !localSwap) return
    const key = `${localSwap.myCardId}:${localSwap.opponentCardId}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    const fromRect = getRect('[data-discard-pile]')
    const midRect = getRect(`[data-card-id="${CSS.escape(localSwap.myCardId)}"]`)
    const toRect = getRect(`[data-card-id="${CSS.escape(localSwap.opponentCardId)}"]`)
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

      const actorPlayer = state.players.find((pl) => pl.id === entry.actorId)
      const targetPlayer = state.players.find((pl) => pl.id === p.targetPlayerId)
      const actorCard = actorPlayer?.hand[p.myCardIndex]
      const targetCard = targetPlayer?.hand[p.targetCardIndex]
      if (!actorCard || !targetCard) continue

      const fromRect = getRect('[data-discard-pile]')
      const midRect = getRect(`[data-card-id="${CSS.escape(actorCard.id)}"]`)
      const toRect = getRect(`[data-card-id="${CSS.escape(targetCard.id)}"]`)
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
  }, [overlayRef, controller, state.log, state.players, myId])
}
