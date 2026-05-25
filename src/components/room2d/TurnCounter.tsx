'use client'

import { motion } from 'framer-motion'
import { Repeat } from 'lucide-react'
import type { RedactedState } from '@/types/shared'

export function TurnCounter({ state }: { state: RedactedState }) {
  if (state.phase !== 'playing' && state.phase !== 'cabo-called' && state.phase !== 'effect-pending') return null
  return (
    <motion.div
      key={state.roundTurnCount}
      initial={{ scale: 0.85, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
      className="fixed top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm text-bate-ink"
    >
      <Repeat size={12} strokeWidth={3} />
      <span className="font-display text-[11px] sm:text-xs tracking-wider">
        TURNO <span className="text-bate-red">{state.roundTurnCount}</span>
      </span>
    </motion.div>
  )
}
