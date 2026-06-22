'use client'
import { toast } from '@/lib/ui-store'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, Clock, Layers, Repeat } from 'lucide-react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import type { RedactedState } from '@/types/shared'

export function TopChrome({ state }: { state: RedactedState }) {
  const myId = getPlayerId()
  const isHost = state.hostId === myId
  const [now, setNow] = useState(() => Date.now())

  const inActivePhase = state.phase === 'playing' || state.phase === 'bate-called' || state.phase === 'effect-pending'

  useEffect(() => {
    if (!inActivePhase) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [inActivePhase])

  if (!inActivePhase) return null

  const hasTimer = state.turnTimeLimitSec !== null && state.turnTimeLimitSec > 0
  const remainingMs = state.paused
    ? state.pausedRemainingMs ?? 0
    : Math.max(0, (state.turnDeadlineAt ?? 0) - now)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const pct = hasTimer ? Math.min(100, Math.max(0, (remainingMs / (state.turnTimeLimitSec! * 1000)) * 100)) : 0
  const isCritical = hasTimer && !state.paused && remainingMs > 0 && remainingMs < 10_000

  function togglePause() {
    if (!isHost) return
    getSocket().emit('room:pause', { roomId: state.roomId, playerId: myId, paused: !state.paused }, (res: { ok?: true; error?: string }) => {
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="fixed top-2 left-2 sm:top-3 sm:left-1/2 sm:-translate-x-1/2 z-hud flex items-center gap-1.5">
      <motion.div
        animate={isCritical ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={isCritical ? { duration: 0.5, repeat: Infinity } : undefined}
        className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 rounded-2xl border-[2px] sm:border-[3px] border-bate-ink shadow-hard-sm ${
          state.paused ? 'bg-bate-paper' : isCritical ? 'bg-bate-red text-bate-paper' : 'bg-bate-paper text-bate-ink'
        }`}
      >
        {hasTimer && (
          <>
            <Clock size={11} strokeWidth={3} />
            <span className="font-display text-[10px] sm:text-xs tabular-nums">
              {state.paused ? 'PAUSADO' : `${remainingSec}s`}
            </span>
            <span className="hidden sm:inline-block w-px h-3 bg-bate-ink/30" />
          </>
        )}
        <motion.span
          key={`r-${state.roundNumber}`}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="flex items-center gap-1 font-display text-[10px] sm:text-xs"
        >
          <Layers size={10} strokeWidth={3} />
          <span>
            R<span className="text-bate-red">{state.roundNumber}</span>
          </span>
        </motion.span>
        <span className="inline-block w-px h-3 bg-bate-ink/30" />
        <motion.span
          key={`t-${state.roundTurnCount}`}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className="flex items-center gap-1 font-display text-[10px] sm:text-xs"
        >
          <Repeat size={10} strokeWidth={3} />
          <span>
            T<span className="text-bate-red">{state.roundTurnCount}</span>
          </span>
        </motion.span>
      </motion.div>
      {hasTimer && (
        <div className="hidden sm:block w-16 h-1.5 rounded-full bg-bate-ink/20 overflow-hidden border border-bate-ink/30">
          <div
            className={`h-full ${state.paused ? 'bg-bate-ink/40' : isCritical ? 'bg-bate-red' : 'bg-bate-green'}`}
            style={{ width: `${pct}%`, transition: 'width 0.2s linear' }}
          />
        </div>
      )}
      {isHost && hasTimer && (
        <button
          type="button"
          onClick={togglePause}
          title={state.paused ? 'Continuar' : 'Pausar'}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
        >
          {state.paused ? <Play size={11} strokeWidth={3} fill="currentColor" /> : <Pause size={11} strokeWidth={3} fill="currentColor" />}
        </button>
      )}
    </div>
  )
}
