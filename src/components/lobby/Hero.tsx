'use client'

import { motion } from 'framer-motion'
import { Card2D } from '@/components/room2d/Card2D'
import type { Rank } from '@/types/shared'

type FloatingCard = { rank: Rank; left: string; top: string; delay: number; rotate: number }

const FLOATERS: FloatingCard[] = [
  { rank: 'JOKER', left: '8%', top: '12%', delay: 0, rotate: -14 },
  { rank: 'K', left: '78%', top: '8%', delay: 0.4, rotate: 12 },
  { rank: 'Q', left: '14%', top: '70%', delay: 0.8, rotate: 8 },
  { rank: '10', left: '82%', top: '66%', delay: 1.2, rotate: -10 },
]

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-cabo-bg via-cabo-surface to-black border border-cabo-purple/30 px-6 py-12 sm:py-16 mb-10 shadow-2xl">
      <div className="absolute inset-0 pointer-events-none opacity-40 sm:opacity-60">
        {FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, rotate: f.rotate, opacity: 0 }}
            animate={{
              y: [0, -14, 0],
              rotate: [f.rotate, f.rotate + 4, f.rotate],
              opacity: 1,
            }}
            transition={{
              y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: f.delay },
              rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: f.delay },
              opacity: { duration: 0.6, delay: f.delay },
            }}
            style={{ position: 'absolute', left: f.left, top: f.top }}
            className="hidden sm:block"
          >
            <Card2D card={{ id: `floater-${i}`, rank: f.rank, suit: null }} size="md" />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.h1
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
          className="text-7xl sm:text-8xl font-extrabold mb-3 tracking-tight bg-gradient-to-br from-cabo-gold via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(255,210,63,0.35)]"
        >
          BATE
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-cabo-purple text-sm sm:text-base font-bold uppercase tracking-[0.3em]"
        >
          Cabo brasileiro multiplayer
        </motion.p>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 text-sm sm:text-base mt-2"
        >
          2 a 4 jogadores • sem cadastro • partida em 5 minutos
        </motion.p>
      </div>
    </section>
  )
}
