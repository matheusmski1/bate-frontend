'use client'

import { useMemo, useRef } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import { createController, type Controller } from '@/lib/mascot-overlay'
import { usePeekOwnTrigger } from '@/lib/mascot-overlay/triggers/peek-own'
import { usePeekOtherTrigger } from '@/lib/mascot-overlay/triggers/peek-other'

export type LocalMascotActions = {
  peekRevealed: { cardId: string; reveal: { rank: Rank; suit: Suit | null }; kind: 'own' | 'other' } | null
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
  const controller = useMemo<Controller>(() => createController(), [])

  const peekOwnLocal =
    localActions.peekRevealed?.kind === 'own' ? localActions.peekRevealed : null
  const peekOtherLocal =
    localActions.peekRevealed?.kind === 'other' ? localActions.peekRevealed : null

  usePeekOwnTrigger({
    state,
    myId,
    overlayRef,
    controller,
    localPeek: peekOwnLocal,
    onArrived: onPeekArrived ?? (() => {}),
  })

  usePeekOtherTrigger({
    state,
    myId,
    overlayRef,
    controller,
    localPeek: peekOtherLocal,
    onArrived: onPeekArrived ?? (() => {}),
  })

  return <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden />
}
