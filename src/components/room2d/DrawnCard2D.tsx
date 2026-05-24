'use client'

import { motion } from 'framer-motion'
import type { Card as CardType } from '@/types/shared'
import { Card2D } from './Card2D'
import { CARD_META } from '@/lib/card-meta'

export function DrawnCard2D({
  card,
  onUseAction,
  onDiscard,
}: {
  card: CardType
  onUseAction: () => void
  onDiscard: () => void
}) {
  const meta = CARD_META[card.rank]
  const isAction = meta.kind === 'action'

  return (
    <motion.div
      initial={{ x: -300, y: 80, opacity: 0, rotate: -8 }}
      animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-3"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {isAction && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -24, scale: 0.85 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 320, damping: 18 }}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.96 }}
            onClick={onUseAction}
            className="px-4 py-3 rounded-2xl bg-bate-gold border-[3px] border-bate-ink shadow-hard-lg text-bate-ink font-display uppercase whitespace-nowrap text-center leading-tight"
          >
            <div className="text-sm">🎯 USAR</div>
            <div className="text-[10px] mt-0.5">{meta.displayName}</div>
          </motion.button>
        )}

        <div className="relative">
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-bate-gold text-bate-ink text-xs font-extrabold whitespace-nowrap shadow-lg">
            Comprou
          </div>
          <Card2D
            card={{ id: card.id, rank: card.rank, suit: card.suit }}
            size="lg"
            onClick={isAction ? undefined : onDiscard}
            highlighted
          />
        </div>

        <motion.button
          type="button"
          initial={{ opacity: 0, x: 24, scale: 0.85 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 320, damping: 18 }}
          whileHover={{ scale: 1.05, y: -3 }}
          whileTap={{ scale: 0.96 }}
          onClick={onDiscard}
          className="px-4 py-3 rounded-2xl bg-bate-paper border-[3px] border-bate-ink shadow-hard text-bate-ink font-display uppercase whitespace-nowrap text-center leading-tight"
        >
          <div className="text-sm">🗑️ DESCARTAR</div>
          {isAction && <div className="text-[10px] mt-0.5 text-bate-ink/60">sem ação</div>}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm font-display text-[11px] text-bate-ink uppercase whitespace-nowrap"
      >
        🔄 OU TROCA: clica uma carta SUA pra colocar esta no lugar
      </motion.div>
    </motion.div>
  )
}
