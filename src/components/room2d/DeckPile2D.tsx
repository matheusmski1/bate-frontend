'use client'

import { motion } from 'framer-motion'
import { CardBack } from './CardBack'

export function DeckPile2D({ count, onClick }: { count: number; onClick?: () => void }) {
  const visibleStack = Math.min(5, Math.max(1, Math.ceil(count / 12)))
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={onClick ? { scale: 1.08, y: -4 } : undefined}
        whileTap={onClick ? { scale: 0.96 } : undefined}
        className={`relative w-24 h-36 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!onClick}
      >
        {Array.from({ length: visibleStack }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-xl overflow-hidden shadow-[0_6px_16px_rgba(0,0,0,0.5)]"
            style={{ transform: `translate(${i * 1.5}px, ${-i * 1.5}px)`, zIndex: i }}
          >
            <CardBack />
          </div>
        ))}
        {onClick && (
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs font-bold text-bate-red whitespace-nowrap animate-pulse">
            ↑ Comprar
          </span>
        )}
      </motion.button>
      <span className="text-xs font-bold text-bate-ink mt-1">{count}</span>
    </div>
  )
}
