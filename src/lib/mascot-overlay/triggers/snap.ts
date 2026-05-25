// src/lib/mascot-overlay/triggers/snap.ts
// Dispara pop-on-card quando:
// - EU dei snap: localSnap set pelo GameArea no callback do socket
//   (variant 'success' ou 'shake' baseado em ok)
// - OUTRO deu snap: state.log ganha entrada nova { type: 'snap' } ou 'snap-fail'
//   Pra outros, animamos no NAMEPLATE do actor (sem handIndex confiável)

import { useEffect, useRef, type RefObject } from 'react'
import type { RedactedState } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, ASSUSTADO } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlayRef: RefObject<HTMLElement | null>
  controller: Controller
  localSnap: { handIndex: number; ok: boolean } | null
  onConsumed: () => void
}

export function useSnapTrigger({ state, myId, overlayRef, controller, localSnap, onConsumed }: Args) {
  const onConsumedRef = useRef(onConsumed)
  useEffect(() => {
    onConsumedRef.current = onConsumed
  })

  // ---- caso A: EU sou o ator ----
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !localSnap) return
    const key = `${localSnap.handIndex}:${localSnap.ok}:${Date.now()}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    const me = state.players.find((p) => p.id === myId)
    const card = me?.hand[localSnap.handIndex]
    const targetRect = card
      ? getRect(`[data-card-id="${CSS.escape(card.id)}"]`)
      : getRect(`[data-player-nameplate="${CSS.escape(myId)}"]`)

    const asset = localSnap.ok ? FELIZ : ASSUSTADO
    controller.popOnCard({
      overlay,
      targetRect,
      asset,
      variant: localSnap.ok ? 'success' : 'shake',
      box: boxFor(130, [asset]),
      onComplete: () => onConsumedRef.current(),
    })
  }, [overlayRef, controller, localSnap, state.players, myId])

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
      if (entry.type !== 'snap' && entry.type !== 'snap-fail') continue
      if (entry.actorId === myId) continue
      const targetRect =
        getRect(`[data-opponent-nameplate="${CSS.escape(entry.actorId)}"]`) ??
        getRect(`[data-player-nameplate="${CSS.escape(entry.actorId)}"]`)
      const ok = entry.type === 'snap'
      const asset = ok ? FELIZ : ASSUSTADO
      controller.popOnCard({
        overlay,
        targetRect,
        asset,
        variant: ok ? 'success' : 'shake',
        box: boxFor(130, [asset]),
      })
    }
  }, [overlayRef, controller, state.log, myId])
}
