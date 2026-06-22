'use client'
import { toast } from '@/lib/ui-store'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, Clock } from 'lucide-react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import type { RedactedState } from '@/types/shared'

export function TurnTimer({ state }: { state: RedactedState }) {
  const myId = getPlayerId()
  const isHost = state.hostId === myId
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  if (state.turnTimeLimitSec === null) return null
  if (state.phase !== 'playing' && state.phase !== 'bate-called' && state.phase !== 'effect-pending') return null

  const remainingMs = state.paused
    ? state.pausedRemainingMs ?? 0
    : Math.max(0, (state.turnDeadlineAt ?? 0) - now)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const pct = Math.min(100, Math.max(0, (remainingMs / (state.turnTimeLimitSec * 1000)) * 100))
  const isCritical = !state.paused && remainingMs > 0 && remainingMs < 10_000

  function togglePause() {
    if (!isHost) return
    getSocket().emit('room:pause', { roomId: state.roomId, playerId: myId, paused: !state.paused }, (res: { ok?: true; error?: string }) => {
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <div className="fixed top-2 left-2 sm:top-20 sm:left-4 z-hud flex items-center gap-1 sm:gap-2">
      <motion.div
        animate={isCritical ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={isCritical ? { duration: 0.5, repeat: Infinity } : undefined}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border-[3px] border-bate-ink shadow-hard-sm ${
          state.paused ? 'bg-bate-paper' : isCritical ? 'bg-bate-red text-bate-paper' : 'bg-bate-paper text-bate-ink'
        }`}
      >
        <Clock size={14} strokeWidth={3} />
        <span className="font-display text-sm tabular-nums">
          {state.paused ? 'PAUSADO' : `${remainingSec}s`}
        </span>
        <div className="w-12 h-1 rounded-full bg-bate-ink/20 overflow-hidden">
          <div
            className={`h-full ${state.paused ? 'bg-bate-ink/40' : isCritical ? 'bg-bate-paper' : 'bg-bate-green'}`}
            style={{ width: `${pct}%`, transition: 'width 0.2s linear' }}
          />
        </div>
      </motion.div>
      {isHost && (
        <button
          type="button"
          onClick={togglePause}
          title={state.paused ? 'Continuar' : 'Pausar'}
          className="w-9 h-9 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
        >
          {state.paused ? <Play size={14} strokeWidth={3} fill="currentColor" /> : <Pause size={14} strokeWidth={3} fill="currentColor" />}
        </button>
      )}
    </div>
  )
}
