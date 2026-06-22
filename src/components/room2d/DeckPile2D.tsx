'use client'

import { motion } from 'framer-motion'
import { CardBack } from './CardBack'

export function DeckPile2D({ count, onClick, viewerDeckId = null }: { count: number; onClick?: () => void; viewerDeckId?: string | null }) {
  const visibleStack = Math.min(5, Math.max(1, Math.ceil(count / 12)))
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={onClick ? { scale: 1.08, y: -4 } : undefined}
        whileTap={onClick ? { scale: 0.96 } : undefined}
        className={`relative w-16 h-24 sm:w-24 sm:h-36 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!onClick}
      >
        {Array.from({ length: visibleStack }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
            style={{ transform: `translate(${i * 1.5}px, ${-i * 1.5}px) scaleX(-1)`, zIndex: i }}
          >
            <CardBack deckId={viewerDeckId} />
          </div>
        ))}
        {onClick && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-bate-paper/95 border-[2px] border-bate-ink shadow-hard-sm font-display text-[10px] sm:text-xs text-bate-red whitespace-nowrap animate-pulse pointer-events-none">
            Comprar
          </span>
        )}
      </motion.button>
      <span className="text-xs font-bold text-bate-ink mt-1">{count}</span>
    </div>
  )
}
