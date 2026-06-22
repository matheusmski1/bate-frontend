'use client'

import { motion } from 'framer-motion'
import { Zap, X } from 'lucide-react'
import { CARD_META } from '@/lib/card-meta'
import type { EffectType } from '@/types/shared'

const RANK_BY_EFFECT: Record<EffectType, '10' | 'J' | 'Q'> = {
  'peek-own': '10',
  'peek-other': 'J',
  swap: 'Q',
}

export function EffectPrompt({ kind, onUse, onSkip }: { kind: EffectType; onUse: () => void; onSkip: () => void }) {
  const rank = RANK_BY_EFFECT[kind]
  const meta = CARD_META[rank]
  const name = meta.displayName ?? rank
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="flex flex-col items-center gap-1.5 sm:gap-2"
    >
      <button
        type="button"
        onClick={onUse}
        className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-bate-gold border-[2px] sm:border-[3px] border-bate-ink shadow-hard sm:shadow-hard-lg text-bate-ink font-display uppercase whitespace-nowrap leading-tight text-center hover:scale-105 active:scale-95 transition-transform"
      >
        <div className="text-[11px] sm:text-sm"><Zap size={14} strokeWidth={3} className="inline" /> USAR</div>
        <div className="text-[9px] sm:text-[10px] mt-0.5">{name}</div>
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="px-3 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm text-bate-ink/80 font-display text-[9px] sm:text-[10px] uppercase whitespace-nowrap hover:bg-bate-cream active:scale-95 transition-transform"
      >
        <X size={12} strokeWidth={3} className="inline" /> pular ação
      </button>
    </motion.div>
  )
}
