'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CARD_META, formatPoints } from '@/lib/card-meta'
import type { RedactedState, Rank } from '@/types/shared'

const PREVIEW_MS = 2600

type Preview = { id: number; rank: Rank; player: string }

export function PenaltyPreview({ state }: { state: RedactedState }) {
  const [preview, setPreview] = useState<Preview | null>(null)
  const prevLogLenRef = useRef<number | null>(null)
  const counterRef = useRef(0)

  useEffect(() => {
    if (prevLogLenRef.current === null) {
      prevLogLenRef.current = state.log.length
      return
    }
    if (state.log.length <= prevLogLenRef.current) {
      prevLogLenRef.current = state.log.length
      return
    }
    const newEntries = state.log.slice(prevLogLenRef.current)
    prevLogLenRef.current = state.log.length
    for (const entry of newEntries) {
      if (entry.type !== 'snap-fail') continue
      const payload = entry.payload as { penaltyRank?: Rank } | undefined
      if (!payload?.penaltyRank) continue
      const actor = state.players.find(p => p.id === entry.actorId)
      counterRef.current += 1
      setPreview({ id: counterRef.current, rank: payload.penaltyRank, player: actor?.name ?? 'alguém' })
    }
  }, [state.log, state.players])

  useEffect(() => {
    if (!preview) return
    const t = setTimeout(() => {
      setPreview(prev => (prev?.id === preview.id ? null : prev))
    }, PREVIEW_MS)
    return () => clearTimeout(t)
  }, [preview])

  const meta = preview ? CARD_META[preview.rank] : null

  return (
    <AnimatePresence>
      {preview && meta && (
        <motion.div
          key={preview.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[58] bg-black/45 backdrop-blur-sm flex items-center justify-center pointer-events-none px-4"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10, y: -20 }}
            animate={{ scale: 1, rotate: -2, y: 0 }}
            exit={{ scale: 0.75, opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className="text-center"
          >
            <div className="font-display text-bate-paper text-xs sm:text-sm tracking-[0.2em] uppercase mb-3">
              💀 Penalidade pra {preview.player}
            </div>
            <div className="w-40 h-56 sm:w-48 sm:h-64 rounded-2xl border-[4px] border-bate-ink overflow-hidden shadow-hard-lg mx-auto bg-bate-paper">
              <img
                src={meta.image}
                alt={meta.displayName ?? preview.rank}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <div className="font-display text-bate-gold text-base sm:text-lg mt-3">
              {meta.displayName ?? preview.rank} ({formatPoints(meta.pointValue)} pts)
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
