'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import { createController } from '@/lib/mascot-overlay'

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
  const controller = useMemo(() => createController(), [])

  // suprimir lint de "unused" — vão ser usados quando os triggers forem ligados
  void state
  void myId
  void localActions
  void onPeekArrived
  void controller

  useEffect(() => {
    // triggers serão registrados aqui em phases seguintes
  }, [])

  return <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden />
}
