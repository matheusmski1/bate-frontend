'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { MASCOT } from '@/lib/mascot'

export function Hero() {
  const mascotRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!mascotRef.current) return
    const el = mascotRef.current
    animate(el, {
      scale: [0, 1.1, 1],
      rotate: [-25, 8, 0],
      opacity: [0, 1],
      duration: 900,
      ease: 'outBack',
    })
    animate(el, {
      translateY: [0, -10, 0],
      rotate: [0, -4, 4, 0],
      duration: 2800,
      delay: 900,
      loop: true,
      ease: 'inOutSine',
    })
  }, [])

  return (
    <header className="relative z-mid w-full max-w-5xl mx-auto px-4 pt-10 md:pt-16 flex flex-col items-center text-center">
      <div className="relative w-full flex items-center justify-center">
        <h1 className="font-display text-[56px] sm:text-[84px] md:text-[120px] lg:text-[160px] text-bate-red uppercase leading-none tracking-tighter text-stamped select-none relative z-card">
          BATINHO
        </h1>
        <img
          ref={mascotRef}
          src={MASCOT.bate}
          alt="Batinho"
          className="absolute right-full top-1/2 -translate-y-1/2 mr-2 sm:mr-4 md:mr-6 w-16 sm:w-24 md:w-36 lg:w-48 opacity-0 select-none pointer-events-none"
          style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))', willChange: 'transform, opacity' }}
          draggable={false}
        />
      </div>
      <p className="font-body text-sm sm:text-base md:text-lg text-bate-ink/80 mt-3 sm:mt-4 max-w-lg font-medium leading-snug">
        <span className="font-bold text-bate-red">Memorize</span> as suas, <span className="font-bold text-bate-red">espie</span> as deles, <span className="font-bold text-bate-red">troque</span> o que precisa e <span className="font-bold text-bate-red">corte</span> na hora exata.
        <br className="hidden sm:block" />
        Menor placar leva. Tu cai nessa?
      </p>
    </header>
  )
}
