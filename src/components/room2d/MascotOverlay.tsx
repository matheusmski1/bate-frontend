'use client'

import { useMemo, useRef } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import { createController, type Controller } from '@/lib/mascot-overlay'
import { usePeekOwnTrigger } from '@/lib/mascot-overlay/triggers/peek-own'
import { usePeekOtherTrigger } from '@/lib/mascot-overlay/triggers/peek-other'
import { useSnapTrigger } from '@/lib/mascot-overlay/triggers/snap'
import { useSwapTrigger } from '@/lib/mascot-overlay/triggers/swap'
import { useTempoAcabandoTrigger } from '@/lib/mascot-overlay/triggers/tempo-acabando'

export type LocalMascotActions = {
  peekRevealed: { cardId: string; reveal: { rank: Rank; suit: Suit | null }; kind: 'own' | 'other' } | null
  snapResult: { ok: boolean } | null
  swapResolved: {
    actorPlayerId: string
    actorCardIndex: number
    targetPlayerId: string
    targetCardIndex: number
  } | null
}

export type MascotOverlayProps = {
  state: RedactedState
  myId: string
  localActions: LocalMascotActions
  onPeekArrived?: (reveal: { rank: Rank; suit: Suit | null }) => void
  onSnapConsumed?: () => void
  onSwapConsumed?: () => void
  // Recebe os card.ids envolvidos numa animação (peek/swap) pra GameArea poder
  // elevar visualmente as cartas selecionadas durante a anim. Sincronizado
  // entre ator e observadores via os caminhos duplos dos triggers.
  onCardsSelected?: (cardIds: string[]) => void
  onCardsUnselected?: () => void
}

export function MascotOverlay({ state, myId, localActions, onPeekArrived, onSnapConsumed, onSwapConsumed, onCardsSelected, onCardsUnselected }: MascotOverlayProps) {
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
    onCardsSelected,
    onCardsUnselected,
  })

  usePeekOtherTrigger({
    state,
    myId,
    overlayRef,
    controller,
    localPeek: peekOtherLocal,
    onArrived: onPeekArrived ?? (() => {}),
    onCardsSelected,
    onCardsUnselected,
  })

  useSnapTrigger({
    state,
    myId,
    overlayRef,
    controller,
    localSnap: localActions.snapResult,
    onConsumed: onSnapConsumed ?? (() => {}),
  })

  useSwapTrigger({
    state,
    myId,
    overlayRef,
    controller,
    localSwap: localActions.swapResolved,
    onConsumed: onSwapConsumed ?? (() => {}),
    onCardsSelected,
    onCardsUnselected,
  })

  useTempoAcabandoTrigger({ state, myId, overlayRef, controller })

  return <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden />
}
