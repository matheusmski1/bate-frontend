'use client'

import { useEffect, useRef } from 'react'
import { createTimeline } from 'animejs'
import { AnimatePresence, motion } from 'framer-motion'
import type { Rank, Suit } from '@/types/shared'
import { CARD_META, getCardImage } from '@/lib/card-meta'

export function PeekModal({ reveal, onClose }: { reveal: { rank: Rank; suit: Suit | null } | null; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!reveal || !cardRef.current) return
    const tl = createTimeline({ defaults: { ease: 'outExpo' } })
    tl.add(cardRef.current, { scale: [0.4, 1], rotateY: [180, 0], opacity: [0, 1], duration: 700 })
      .add(cardRef.current, { rotate: [-2, 2, 0], duration: 600, ease: 'inOutSine' }, '-=200')
    return () => { tl.pause() }
  }, [reveal])

  return (
    <AnimatePresence>
      {reveal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-float flex items-center justify-center cursor-pointer"
          onClick={onClose}
        >
          <div ref={cardRef} className="relative w-44 h-64 rounded-xl border-[4px] border-bate-ink overflow-hidden shadow-hard-lg" style={{ transformStyle: 'preserve-3d' }}>
            <img src={getCardImage(reveal.rank)} alt={reveal.rank} className="w-full h-full object-cover" draggable={false} />
          </div>
          <div className="absolute bottom-12 text-bate-red font-bold text-sm tracking-wide">click pra fechar</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
