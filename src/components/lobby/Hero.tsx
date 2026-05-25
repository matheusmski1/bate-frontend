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
    <header className="relative z-20 w-full max-w-4xl mx-auto px-4 pt-10 md:pt-16 flex flex-col items-center text-center">
      <img
        ref={mascotRef}
        src={MASCOT.bate}
        alt="Batinho"
        className="w-32 sm:w-40 md:w-52 lg:w-64 mb-2 opacity-0 select-none pointer-events-none"
        style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))', willChange: 'transform, opacity' }}
        draggable={false}
      />
      <h1 className="font-display text-[68px] sm:text-[92px] md:text-[128px] lg:text-[164px] text-bate-red uppercase leading-none tracking-tighter text-stamped select-none relative z-10">
        BATINHO
      </h1>
      <p className="font-body text-sm sm:text-base md:text-lg text-bate-ink/80 mt-3 sm:mt-4 max-w-md font-medium leading-snug">
        Os Batinhos são malandros — <span className="font-bold text-bate-red">memorizam</span>, <span className="font-bold text-bate-red">espiam</span>, <span className="font-bold text-bate-red">trocam</span> e <span className="font-bold text-bate-red">cortam</span> no momento certo.
        <br className="hidden sm:block" />
        Menor placar leva. Bora?
      </p>
    </header>
  )
}
