'use client'

import { motion } from 'framer-motion'
import { CARD_META } from '@/lib/card-meta'
import type { Rank } from '@/types/shared'

type FloatingCard = { rank: Rank; left: string; top: string; delay: number; rotate: number }

const FLOATERS: FloatingCard[] = [
  { rank: 'JOKER', left: '6%', top: '10%', delay: 0, rotate: -14 },
  { rank: 'K', left: '82%', top: '6%', delay: 0.4, rotate: 12 },
  { rank: 'Q', left: '12%', top: '64%', delay: 0.8, rotate: 8 },
  { rank: '10', left: '84%', top: '60%', delay: 1.2, rotate: -10 },
]

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-bate-cream border-[4px] border-bate-ink px-6 py-12 sm:py-16 mb-10 shadow-hard-lg">
      <div className="absolute inset-0 pointer-events-none">
        {FLOATERS.map((f) => (
          <motion.div
            key={f.rank}
            initial={{ y: 0, rotate: f.rotate, opacity: 0 }}
            animate={{ y: [0, -14, 0], rotate: [f.rotate, f.rotate + 4, f.rotate], opacity: 1 }}
            transition={{
              y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: f.delay },
              rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: f.delay },
              opacity: { duration: 0.6, delay: f.delay },
            }}
            style={{ position: 'absolute', left: f.left, top: f.top }}
            className="hidden sm:block w-20 h-28 rounded-xl border-[3px] border-bate-ink shadow-hard overflow-hidden"
          >
            <img src={CARD_META[f.rank].image} alt="" className="w-full h-full object-cover" draggable={false} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.h1
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
          className="font-display text-7xl sm:text-8xl text-bate-red mb-3 tracking-tight"
          style={{
            WebkitTextStroke: '3px #1a0e08',
            textShadow: '6px 6px 0 #1a0e08, 6px 6px 0 #ffb81c, 8px 8px 0 #1a0e08',
            transform: 'rotate(-2deg)',
            display: 'inline-block',
          }}
        >
          BATE!
        </motion.h1>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <span className="inline-block font-display text-bate-gold bg-bate-ink px-3 py-1 rounded shadow-hard-red rotate-1 text-xs tracking-[0.2em]">
            CABO BRASILEIRO MULTIPLAYER
          </span>
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="font-body text-bate-ink/70 text-sm sm:text-base mt-3"
        >
          2 a 4 jogadores • sem cadastro • partida em 5 minutos
        </motion.p>
      </div>
    </section>
  )
}
