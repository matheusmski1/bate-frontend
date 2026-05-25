'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { animate } from 'animejs'
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

  const particleRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!toast || toast.kind !== 'snap' || !particleRef.current) return
    const parent = particleRef.current
    parent.innerHTML = ''
    const colors = ['#ffb81c', '#4a7c4f', '#d63232', '#fff5d1', '#2c8a9c']
    const pieces: HTMLDivElement[] = []
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div')
      p.style.position = 'absolute'
      p.style.left = '50%'
      p.style.top = '50%'
      p.style.width = '10px'
      p.style.height = '14px'
      p.style.borderRadius = '2px'
      p.style.background = colors[i % colors.length]!
      p.style.border = '2px solid #1a0e08'
      p.style.transform = 'translate(-50%, -50%) scale(0)'
      p.style.pointerEvents = 'none'
      parent.appendChild(p)
      pieces.push(p)
    }
    pieces.forEach((p, i) => {
      const angle = (Math.PI * 2 * i) / pieces.length + (Math.random() - 0.5) * 0.5
      const distance = 60 + Math.random() * 60
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance
      animate(p, {
        translateX: [`-50%`, `calc(-50% + ${dx}px)`],
        translateY: [`-50%`, `calc(-50% + ${dy}px)`],
        rotate: [0, (Math.random() - 0.5) * 720],
        scale: [0, 1, 0],
        opacity: [1, 1, 0],
        duration: 700 + Math.random() * 300,
        ease: 'outCubic',
      })
    })
    const t = setTimeout(() => { parent.innerHTML = '' }, 1200)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[55] pointer-events-none">
      <div ref={particleRef} className="absolute top-1/2 left-1/2 w-0 h-0 pointer-events-none" />
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
              <span>😬 {toast.name} CORTOU ERRADO (+1 carta)</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
