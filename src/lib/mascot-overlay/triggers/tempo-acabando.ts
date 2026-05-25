// src/lib/mascot-overlay/triggers/tempo-acabando.ts
// 100% client-side. Cada cliente conta seu próprio "tempo desde última ação".
// Se passar threshold sem state.log/turn mudar, ancora batinho-tempo-acabando
// no nameplate do jogador atual. Some quando turno muda ou alguém age.

import { useEffect, useRef, type RefObject } from 'react'
import type { RedactedState } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, TEMPO } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlayRef: RefObject<HTMLElement | null>
  controller: Controller
}

const IDLE_THRESHOLD_MS = 15000

export function useTempoAcabandoTrigger({ state, myId, overlayRef, controller }: Args) {
  // refs pra acessar estado atual de dentro do interval sem recriar o setInterval
  // a cada socket update (state é objeto novo toda vez)
  const stateRef = useRef(state)
  const myIdRef = useRef(myId)
  stateRef.current = state
  myIdRef.current = myId

  const attachedRef = useRef<{ cancel: () => void } | null>(null)
  const turnStartRef = useRef<number>(Date.now())
  const lastTurnRef = useRef<number>(-1)
  const lastLogLenRef = useRef<number>(0)

  // Reset timer quando turno muda OU log cresce (alguém agiu)
  useEffect(() => {
    let dirty = false
    if (state.turn !== lastTurnRef.current) {
      lastTurnRef.current = state.turn
      dirty = true
    }
    if (state.log.length !== lastLogLenRef.current) {
      lastLogLenRef.current = state.log.length
      dirty = true
    }
    if (dirty) {
      turnStartRef.current = Date.now()
      attachedRef.current?.cancel()
      attachedRef.current = null
    }
  }, [state.turn, state.log.length])

  // Polling 1s pra ver se passou do threshold. Deps reduzidas pra não recriar
  // interval — estado lido via refs.
  useEffect(() => {
    const interval = setInterval(() => {
      const overlay = overlayRef.current
      if (!overlay) return
      const s = stateRef.current
      const me = myIdRef.current
      const currentPlayerId = s.players[s.turn]?.id
      if (!currentPlayerId) return
      if (attachedRef.current) return
      const elapsed = Date.now() - turnStartRef.current
      if (elapsed < IDLE_THRESHOLD_MS) return

      const selector =
        currentPlayerId === me
          ? `[data-player-nameplate="${CSS.escape(currentPlayerId)}"]`
          : `[data-opponent-nameplate="${CSS.escape(currentPlayerId)}"]`

      const anchorRect = getRect(selector)
      if (!anchorRect) return

      attachedRef.current = controller.attachLoop({
        overlay,
        anchorRect,
        asset: TEMPO,
        box: boxFor(110, [TEMPO]),
        position: 'top-right',
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [overlayRef, controller])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      attachedRef.current?.cancel()
      attachedRef.current = null
    }
  }, [])
}
