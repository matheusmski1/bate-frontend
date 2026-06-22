'use client'
import { toast } from '@/lib/ui-store'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { animate, utils } from 'animejs'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import { CARD_META, formatPoints } from '@/lib/card-meta'
import { getMascot } from '@/lib/mascot'
import { Card2D } from '@/components/room2d/Card2D'
import { EASE_OUT } from '@/lib/easings'
import type { RedactedState, RedactedPlayer, Rank } from '@/types/shared'

type Stage = 'splash' | 'analyzing' | 'reveal'

type Breakdown = {
  player: RedactedPlayer
  roundScore: number
  parts: Array<{ rank: Rank; pts: number }>
}

function computeBreakdown(player: RedactedPlayer): Breakdown {
  const parts: Array<{ rank: Rank; pts: number }> = []
  for (const c of player.hand) {
    if ('hidden' in c) continue
    parts.push({ rank: c.rank, pts: CARD_META[c.rank].pointValue })
  }
  const roundScore = parts.reduce((sum, p) => sum + p.pts, 0)
  return { player, roundScore, parts }
}

export function RoundEndScreen({ state }: { state: RedactedState }) {
  const myId = getPlayerId()
  const isHost = state.hostId === myId
  const arenaId = state.players.find(p => p.id === myId)?.arena ?? 'default'
  const [stage, setStage] = useState<Stage>('splash')
  const breakdowns = state.players.map(computeBreakdown).sort((a, b) => a.roundScore - b.roundScore)

  useEffect(() => {
    const t1 = setTimeout(() => setStage('analyzing'), 1800)
    const t2 = setTimeout(() => setStage('reveal'), 1800 + 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  function next() {
    getSocket().emit('game:next-round', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string }) => {
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-bate-cream">
      <AnimatePresence mode="wait">
        {stage === 'splash' && <SplashPhase key="splash" arenaId={arenaId} />}
        {stage === 'analyzing' && <AnalyzingPhase key="analyzing" />}
        {stage === 'reveal' && (
          <RevealPhase key="reveal" breakdowns={breakdowns} bateCallerId={state.bateCallerId} isHost={isHost} onNext={next} arenaId={arenaId} />
        )}
      </AnimatePresence>
    </main>
  )
}

function SplashPhase({ arenaId }: { arenaId: string }) {
  const textRef = useRef<HTMLDivElement | null>(null)
  const batinhoRef = useRef<HTMLImageElement | null>(null)
  const burstRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (textRef.current) {
      animate(textRef.current, {
        scale: [0.2, 1.25, 1],
        rotate: [-15, 5, 0],
        opacity: [0, 1],
        duration: 700,
        ease: 'outBack',
      })
      animate(textRef.current, {
        translateX: [0, -10, 8, -5, 0],
        delay: 700,
        duration: 400,
        ease: 'inOutSine',
      })
    }
    if (batinhoRef.current) {
      animate(batinhoRef.current, {
        scale: [0, 1.2, 1],
        rotate: [-360, 12, 0],
        opacity: [0, 1],
        delay: 250,
        duration: 900,
        ease: 'outBack',
      })
      animate(batinhoRef.current, {
        translateY: [0, -14, 0],
        delay: 1150,
        duration: 800,
        loop: true,
        ease: 'inOutSine',
      })
    }
    if (burstRef.current) {
      const sparks = burstRef.current.querySelectorAll<HTMLElement>('.spark')
      sparks.forEach(s => {
        const angle = Math.random() * Math.PI * 2
        const dist = 120 + Math.random() * 80
        s.style.setProperty('--dx', `${Math.cos(angle) * dist}px`)
        s.style.setProperty('--dy', `${Math.sin(angle) * dist}px`)
      })
      animate(sparks, {
        translateX: (el: HTMLElement) => parseFloat(getComputedStyle(el).getPropertyValue('--dx')),
        translateY: (el: HTMLElement) => parseFloat(getComputedStyle(el).getPropertyValue('--dy')),
        scale: [0, 1, 0],
        opacity: [1, 0],
        rotate: () => Math.random() * 720 - 360,
        duration: 1400,
        delay: utils.stagger(40, { start: 350 }),
        ease: 'outExpo',
      })
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="text-center relative"
    >
      <div ref={burstRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="spark absolute left-0 top-0 w-3 h-3 rounded-full"
            style={{
              background: i % 3 === 0 ? '#ffb81c' : i % 3 === 1 ? '#e23744' : '#3a8e5e',
              opacity: 0,
            }}
          />
        ))}
      </div>
      <img
        ref={batinhoRef}
        src={getMascot('feliz', arenaId)}
        alt=""
        aria-hidden
        className="w-40 sm:w-56 mx-auto mb-4 opacity-0 select-none"
        style={{ filter: 'drop-shadow(0 16px 28px rgba(0,0,0,0.45))' }}
      />
      <div
        ref={textRef}
        className="font-display text-5xl sm:text-7xl text-bate-red opacity-0"
        style={{
          WebkitTextStroke: '3px #1a0e08',
          textShadow: '6px 6px 0 #1a0e08, 6px 6px 0 #ffb81c, 8px 8px 0 #1a0e08',
          letterSpacing: '-0.02em',
        }}
      >
        FIM DA RODADA!
      </div>
    </motion.div>
  )
}

function AnalyzingPhase() {
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
        <div className="counting-card w-14 h-20 rounded-xl bg-gradient-to-br from-bate-red-deep to-red-700 border-[3px] border-bate-ink shadow-hard flex items-center justify-center">
          <span className="text-bate-paper font-extrabold text-lg">A</span>
        </div>
        <div className="counting-card w-14 h-20 rounded-xl bg-gradient-to-br from-bate-red-deep to-red-700 border-[3px] border-bate-ink shadow-hard flex items-center justify-center">
          <span className="text-bate-paper font-extrabold text-lg">K</span>
        </div>
        <div className="counting-card w-14 h-20 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 border-[3px] border-bate-ink shadow-hard flex items-center justify-center">
          <span className="text-bate-ink font-extrabold text-lg">★</span>
        </div>
      </div>
      <div className="font-display text-2xl sm:text-3xl text-bate-red" style={{ WebkitTextStroke: '2px #1a0e08', textShadow: '4px 4px 0 #1a0e08' }}>
        ANALISANDO RESULTADOS
        <span className="counting-dot">.</span>
        <span className="counting-dot">.</span>
        <span className="counting-dot">.</span>
      </div>
    </motion.div>
  )
}

function RevealPhase({ breakdowns, bateCallerId, isHost, onNext, arenaId }: { breakdowns: Breakdown[]; bateCallerId: string | null; isHost: boolean; onNext: () => void; arenaId: string }) {
  const callerName = bateCallerId ? breakdowns.find(b => b.player.id === bateCallerId)?.player.name : null
  const callerIsWinner = bateCallerId && breakdowns[0]?.player.id === bateCallerId
  const winnerBatinhoRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!winnerBatinhoRef.current) return
    const el = winnerBatinhoRef.current
    const enterDelay = 600 + 180
    animate(el, {
      scale: [0, 1.2, 1],
      rotate: [-220, 14, 0],
      opacity: [0, 1],
      duration: 800,
      delay: enterDelay,
      ease: 'outBack',
    })
    animate(el, {
      translateY: [0, -10, 0, -6, 0],
      rotate: [0, -8, 6, -4, 0],
      duration: 1400,
      delay: enterDelay + 800,
      loop: true,
      ease: 'inOutSine',
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-bate-paper p-6 sm:p-8 rounded-3xl max-w-2xl w-full shadow-hard-lg border-[4px] border-bate-ink max-h-[90vh] overflow-y-auto"
    >
      <img
        ref={winnerBatinhoRef}
        src={getMascot('trofeu', arenaId)}
        alt=""
        aria-hidden
        className="absolute -top-2 sm:-top-4 -right-2 sm:-right-6 w-20 sm:w-28 opacity-0 pointer-events-none select-none z-card"
        style={{ filter: 'drop-shadow(0 12px 18px rgba(0,0,0,0.35))', willChange: 'transform, opacity' }}
      />
      <motion.h2
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 15 }}
        className="font-display text-3xl sm:text-4xl text-bate-red mb-2 text-center"
        style={{ WebkitTextStroke: '2px #1a0e08', textShadow: '4px 4px 0 #1a0e08, 4px 4px 0 #ffb81c, 6px 6px 0 #1a0e08' }}
      >
        🎉 FIM DA RODADA
      </motion.h2>
      {callerName && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className={`text-center mb-6 text-sm font-bold ${callerIsWinner ? 'text-bate-red' : 'text-bate-red'}`}
        >
          👑 {callerName} chamou BATE
          {callerIsWinner ? ' e venceu a rodada!' : ' mas não fez o menor placar 🔥'}
        </motion.p>
      )}
      <ul className="space-y-3 mb-6">
        {breakdowns.map((b, i) => {
          const isCaller = b.player.id === bateCallerId
          const isWinner = i === 0
          return (
            <motion.li
              key={b.player.id}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.18, ease: EASE_OUT }}
              className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-4 border-[3px] ${
                isWinner
                  ? 'bg-bate-gold/30 border-bate-gold shadow-hard'
                  : 'bg-bate-cream border-bate-ink/30 shadow-hard-sm'
              }`}
            >
              <div className="flex justify-between items-center mb-2 gap-2">
                <span className="font-display text-base sm:text-lg flex items-center gap-2 text-bate-ink">
                  <span className="text-xl sm:text-2xl">{isWinner ? '🏆' : `${i + 1}º`}</span>
                  {b.player.name}
                  {isCaller && <span title="Chamou BATE">👑</span>}
                </span>
                <div className="flex flex-col items-end">
                  <span className={`font-display text-2xl sm:text-3xl ${isWinner ? 'text-bate-red' : 'text-bate-ink'}`}>
                    <AnimatedScore target={b.roundScore} delay={600 + i * 180} />
                    <span className="text-xs sm:text-sm font-body font-normal opacity-70 ml-1">pts</span>
                  </span>
                  <span className="text-[10px] sm:text-xs text-bate-ink/70 font-body">
                    Total: <AnimatedScore target={b.player.score} delay={600 + i * 180} />
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 sm:gap-2 items-end mb-1.5 flex-wrap">
                {b.player.hand.map(card => (
                  <Card2D key={card.id} card={card} size="sm" deckId={b.player.deck} />
                ))}
              </div>
              <div className="text-xs sm:text-sm font-mono text-bate-ink/80">
                {b.parts.map((p, idx) => {
                  const meta = CARD_META[p.rank]
                  const label = meta.displayName ?? p.rank
                  return (
                    <span key={idx}>
                      {idx > 0 && ' + '}
                      <span className={p.pts < 0 ? 'text-bate-red font-bold' : ''}>
                        {label}({formatPoints(p.pts)})
                      </span>
                    </span>
                  )
                })}
                <span className="text-bate-ink font-bold"> = {formatPoints(b.roundScore)}</span>
              </div>
            </motion.li>
          )
        })}
      </ul>
      {isHost ? (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + breakdowns.length * 0.18 + 0.5 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-bate-red text-bate-paper font-display text-lg border-[4px] border-bate-ink shadow-hard"
        >
          PRÓXIMA RODADA →
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + breakdowns.length * 0.18 + 0.5 }}
          className="text-center text-bate-ink py-4"
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
