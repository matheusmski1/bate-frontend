'use client'

import { useEffect, useRef, useState } from 'react'
import { createTimeline } from 'animejs'
import { AnimatePresence, motion } from 'framer-motion'
import type { RedactedState } from '@/types/shared'

type Stage = 'announce' | 'message' | null

export function BateAnnouncement({ state }: { state: RedactedState }) {
  const [stage, setStage] = useState<Stage>(null)
  const [callerName, setCallerName] = useState('')
  const slamRef = useRef<HTMLDivElement | null>(null)
  const prevCaller = useRef<string | null>(null)

  useEffect(() => {
    if (!state.caboCallerId) return
    if (state.caboCallerId === prevCaller.current) return
    prevCaller.current = state.caboCallerId
    const caller = state.players.find(p => p.id === state.caboCallerId)
    if (!caller) return
    setCallerName(caller.name)
    setStage('announce')
    const t1 = setTimeout(() => setStage('message'), 1700)
    const t2 = setTimeout(() => setStage(null), 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.caboCallerId])

  useEffect(() => {
    if (stage !== 'announce' || !slamRef.current) return
    const tl = createTimeline({ defaults: { ease: 'outExpo' } })
    tl.add(slamRef.current, {
      scale: [0.3, 1.25, 1],
      rotate: [-18, 6, 0],
      opacity: [0, 1],
      duration: 700,
    })
    tl.add(slamRef.current, {
      translateX: [0, -14, 12, -8, 4, 0],
      duration: 500,
      ease: 'inOutSine',
    }, '-=150')
    return () => { tl.pause() }
  }, [stage])

  return (
    <AnimatePresence>
      {stage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none"
        >
          {stage === 'announce' ? (
            <div ref={slamRef} className="text-center" style={{ transformOrigin: 'center' }}>
              <div
                className="text-[10rem] font-display leading-none text-bate-red"
                style={{
                  WebkitTextStroke: '4px #1a0e08',
                  textShadow: '8px 8px 0 #1a0e08, 8px 8px 0 #ffb81c, 10px 10px 0 #1a0e08',
                  letterSpacing: '-0.04em',
                }}
              >
                BATE!
              </div>
              <div className="font-display text-4xl text-bate-paper mt-6 tracking-widest uppercase">
                🎯 {callerName} chamou
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="font-display text-6xl text-bate-paper" style={{ WebkitTextStroke: '3px #1a0e08', textShadow: '6px 6px 0 #1a0e08' }}>
                ⏳ Última volta!
              </div>
              <div className="font-display text-2xl text-bate-gold mt-4">
                Cada player joga mais 1 turno, aí conta os pontos
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
