'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Scissors, X } from 'lucide-react'
import type { RedactedState, Rank } from '@/types/shared'
import { CARD_META } from '@/lib/card-meta'

type ToastKind = 'snap' | 'snap-fail'
type Toast = { id: number; kind: ToastKind; name: string; rank?: Rank }

const DURATION_MS = 2400

export function SnapToast({ state }: { state: RedactedState }) {
  const [toast, setToast] = useState<Toast | null>(null)
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
      if (entry.type !== 'snap' && entry.type !== 'snap-fail') continue
      const actor = state.players.find(p => p.id === entry.actorId)
      const name = actor?.name ?? 'alguém'
      const payload = entry.payload as { rank?: Rank; attemptedRank?: Rank } | undefined
      const rank = payload?.rank ?? payload?.attemptedRank
      counterRef.current += 1
      setToast({ id: counterRef.current, kind: entry.type, name, rank })
    }
  }, [state.log, state.players])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => {
      setToast(prev => (prev?.id === toast.id ? null : prev))
    }, DURATION_MS)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[55] pointer-events-none">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: -40, opacity: 0, scale: 0.85, rotate: -3 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: -1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-[4px] border-bate-ink shadow-hard-lg font-display text-base sm:text-lg ${
              toast.kind === 'snap'
                ? 'bg-bate-green text-bate-paper'
                : 'bg-bate-red text-bate-paper'
            }`}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-bate-paper/20 border-[2px] border-bate-paper/70">
              {toast.kind === 'snap' ? <Scissors size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
            </span>
            {toast.kind === 'snap' ? (
              <span>
                {toast.name} CORTOU
                {toast.rank ? <> <span className="ml-1">{CARD_META[toast.rank].displayName ?? toast.rank}</span></> : ''}!
              </span>
            ) : (
              <span>{toast.name} ERROU O SNAP (+1 carta)</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
