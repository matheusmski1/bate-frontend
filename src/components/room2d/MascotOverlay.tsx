'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import { createController, type Controller } from '@/lib/mascot-overlay'
import { usePeekOwnTrigger } from '@/lib/mascot-overlay/triggers/peek-own'

export type LocalMascotActions = {
  peekRevealed: { cardId: string; reveal: { rank: Rank; suit: Suit | null } } | null
  snapResult: { handIndex: number; ok: boolean } | null
  swapResolved: { myCardId: string; opponentCardId: string } | null
}

export type MascotOverlayProps = {
  state: RedactedState
  myId: string
  localActions: LocalMascotActions
  onPeekArrived?: (reveal: { rank: Rank; suit: Suit | null }) => void
}

export function MascotOverlay({ state, myId, localActions, onPeekArrived }: MascotOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [overlay, setOverlay] = useState<HTMLElement | null>(null)
  const controller = useMemo<Controller>(() => createController(), [])

  useEffect(() => {
    setOverlay(overlayRef.current)
  }, [])

  usePeekOwnTrigger({
    state,
    myId,
    overlay,
    controller,
    localPeek: localActions.peekRevealed,
    onArrived: onPeekArrived ?? (() => {}),
  })

  return <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden />
}
