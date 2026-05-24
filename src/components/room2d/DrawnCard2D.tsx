'use client'

import { motion } from 'framer-motion'
import type { Card as CardType } from '@/types/shared'
import { Card2D } from './Card2D'

export function DrawnCard2D({ card, onClick }: { card: CardType; onClick: () => void }) {
  return (
    <motion.div
      initial={{ x: -300, y: 80, opacity: 0, rotate: -8 }}
      animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-bate-gold text-bate-ink text-xs font-extrabold whitespace-nowrap shadow-lg">
        Comprou
      </div>
      <Card2D card={{ id: card.id, rank: card.rank, suit: card.suit }} size="lg" onClick={onClick} highlighted />
    </motion.div>
  )
}
