'use client'

import { motion } from 'framer-motion'
import { Repeat, Layers } from 'lucide-react'
import type { RedactedState } from '@/types/shared'

export function TurnCounter({ state }: { state: RedactedState }) {
  if (state.phase !== 'playing' && state.phase !== 'bate-called' && state.phase !== 'effect-pending') return null
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-overlay flex items-center gap-1.5">
      <motion.div
        key={`r-${state.roundNumber}`}
        initial={{ scale: 0.85, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm text-bate-ink"
      >
        <Layers size={12} strokeWidth={3} />
        <span className="font-display text-[11px] sm:text-xs tracking-wider">
          RODADA <span className="text-bate-red">{state.roundNumber}</span>
        </span>
      </motion.div>
      <motion.div
        key={`t-${state.roundTurnCount}`}
        initial={{ scale: 0.85, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm text-bate-ink"
      >
        <Repeat size={12} strokeWidth={3} />
        <span className="font-display text-[11px] sm:text-xs tracking-wider">
          TURNO <span className="text-bate-red">{state.roundTurnCount}</span>
        </span>
      </motion.div>
    </div>
  )
}
