// src/lib/mascot-overlay/triggers/snap.ts
// Dispara pop-on-card quando:
// - EU dei snap: localSnap set pelo GameArea no callback do socket
// - OUTRO deu snap: state.log ganha entrada nova { type: 'snap' } ou 'snap-fail'
//
// Pop SEMPRE no nameplate do ator. Snap success move a carta pro discard antes
// do popOnCard rodar, então lookup por handIndex pega a carta errada (a que
// shiftou pra essa posição). Nameplate é estável e comunica "esse player snapou".

import { useEffect, useRef, type RefObject } from 'react'
import type { RedactedState } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, ASSUSTADO } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlayRef: RefObject<HTMLElement | null>
  controller: Controller
  localSnap: { ok: boolean } | null
  onConsumed: () => void
}

function nameplateRectFor(playerId: string): DOMRect | null {
  return (
    getRect(`[data-opponent-nameplate="${CSS.escape(playerId)}"]`) ??
    getRect(`[data-player-nameplate="${CSS.escape(playerId)}"]`)
  )
}

export function useSnapTrigger({ state, myId, overlayRef, controller, localSnap, onConsumed }: Args) {
  const onConsumedRef = useRef(onConsumed)
  useEffect(() => {
    onConsumedRef.current = onConsumed
  })

  // EU como ator
  const lastLocalKeyRef = useRef<number>(0)
  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay || !localSnap) {
      if (!localSnap) lastLocalKeyRef.current = 0
      return
    }
    lastLocalKeyRef.current += 1

    const asset = localSnap.ok ? FELIZ : ASSUSTADO
    controller.popOnCard({
      overlay,
      targetRect: nameplateRectFor(myId),
      asset,
      variant: localSnap.ok ? 'success' : 'shake',
      box: boxFor(130, [asset]),
      onComplete: () => onConsumedRef.current(),
    })
  }, [overlayRef, controller, localSnap, myId])

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
      if (entry.type !== 'snap' && entry.type !== 'snap-fail') continue
      if (entry.actorId === myId) continue
      const ok = entry.type === 'snap'
      const asset = ok ? FELIZ : ASSUSTADO
      controller.popOnCard({
        overlay,
        targetRect: nameplateRectFor(entry.actorId),
        asset,
        variant: ok ? 'success' : 'shake',
        box: boxFor(130, [asset]),
      })
    }
  }, [overlayRef, controller, state.log, myId])
}
