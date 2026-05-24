'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { animate, utils } from 'animejs'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import type { RedactedState } from '@/types/shared'

type Stage = 'counting' | 'reveal'

export function RoundEndScreen({ state }: { state: RedactedState }) {
  const myId = getPlayerId()
  const isHost = state.hostId === myId
  const [stage, setStage] = useState<Stage>('counting')
  const sorted = [...state.players].sort((a, b) => a.score - b.score)

  useEffect(() => {
    const t = setTimeout(() => setStage('reveal'), 2400)
    return () => clearTimeout(t)
  }, [])

  function next() {
    getSocket().emit('game:next-round', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string }) => {
      if (res?.error) alert(res.error)
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-cabo-bg via-cabo-surface to-black">
      <AnimatePresence mode="wait">
        {stage === 'counting' ? (
          <CountingPhase key="counting" />
        ) : (
          <RevealPhase key="reveal" players={sorted} isHost={isHost} onNext={next} />
        )}
      </AnimatePresence>
    </main>
  )
}

function CountingPhase() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!wrapRef.current) return
    animate(wrapRef.current.querySelectorAll('.counting-card'), {
      rotateY: [0, 360],
      translateY: [0, -18, 0],
      scale: [1, 1.1, 1],
      duration: 900,
      loop: true,
      ease: 'inOutQuad',
      delay: utils.stagger(140),
    })
    animate(wrapRef.current.querySelectorAll('.counting-dot'), {
      opacity: [0.2, 1, 0.2],
      scale: [0.8, 1.2, 0.8],
      duration: 700,
      loop: true,
      delay: utils.stagger(140),
    })
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.3 }}
      className="text-center"
      ref={wrapRef}
    >
      <div className="flex gap-3 justify-center mb-8">
        <div className="counting-card w-14 h-20 rounded-xl bg-gradient-to-br from-cabo-red to-red-700 border-2 border-cabo-cream shadow-2xl flex items-center justify-center">
          <span className="text-cabo-cream font-extrabold text-lg">A</span>
        </div>
        <div className="counting-card w-14 h-20 rounded-xl bg-gradient-to-br from-cabo-red to-red-700 border-2 border-cabo-cream shadow-2xl flex items-center justify-center">
          <span className="text-cabo-cream font-extrabold text-lg">K</span>
        </div>
        <div className="counting-card w-14 h-20 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-cabo-cream shadow-2xl flex items-center justify-center">
          <span className="text-cabo-bg font-extrabold text-lg">★</span>
        </div>
      </div>
      <div className="text-3xl font-extrabold text-cabo-gold tracking-wide drop-shadow-[0_4px_12px_rgba(255,210,63,0.5)]">
        Contando pontos
        <span className="counting-dot">.</span>
        <span className="counting-dot">.</span>
        <span className="counting-dot">.</span>
      </div>
    </motion.div>
  )
}

function RevealPhase({ players, isHost, onNext }: { players: RedactedState['players']; isHost: boolean; onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-cabo-surface/90 backdrop-blur p-8 rounded-3xl max-w-md w-full shadow-2xl border border-cabo-purple/30"
    >
      <motion.h2
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 15 }}
        className="text-4xl font-extrabold text-cabo-gold mb-6 text-center"
      >
        🎉 Fim da rodada
      </motion.h2>
      <ul className="space-y-2 mb-8">
        {players.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + i * 0.18, ease: 'easeOut' }}
            className={`flex justify-between items-center rounded-xl px-5 py-4 ${
              i === 0
                ? 'bg-gradient-to-br from-cabo-gold via-amber-400 to-amber-600 text-cabo-bg shadow-[0_0_24px_rgba(255,210,63,0.5)]'
                : 'bg-cabo-bg/60'
            }`}
          >
            <span className="font-extrabold text-lg flex items-center gap-2">
              <span className="text-2xl">{i === 0 ? '🏆' : `${i + 1}º`}</span>
              {p.name}
            </span>
            <span className="font-extrabold text-3xl">
              <AnimatedScore target={p.score} delay={600 + i * 180} />
            </span>
          </motion.li>
        ))}
      </ul>
      {isHost ? (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + players.length * 0.18 + 0.5 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-cabo-accent via-orange-500 to-red-600 font-extrabold text-lg text-white shadow-[0_0_20px_rgba(255,107,53,0.5)]"
        >
          Próxima rodada →
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + players.length * 0.18 + 0.5 }}
          className="text-center text-cabo-purple py-4"
        >
          Aguardando host…
        </motion.div>
      )}
    </motion.div>
  )
}

function AnimatedScore({ target, delay = 0 }: { target: number; delay?: number }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let raf = 0
    const startAt = performance.now() + delay
    const duration = 900
    const tick = (now: number) => {
      const elapsed = now - startAt
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, delay])
  return <span>{value}</span>
}
