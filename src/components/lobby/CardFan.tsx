'use client'

import { useEffect, useRef } from 'react'
import { animate, utils } from 'animejs'
import { CARD_META } from '@/lib/card-meta'
import type { Rank } from '@/types/shared'

type FanSlot = { rank: Rank; x: number; y: number; rotate: number; scale: number; z: number; shadow: string }

const FAN: FanSlot[] = [
  { rank: 'K',     x: -120, y: 20, rotate: -22, scale: 1,    z: 10, shadow: 'shadow-hard' },
  { rank: '10',    x: -60,  y: 5,  rotate: -11, scale: 1,    z: 20, shadow: 'shadow-hard' },
  { rank: 'JOKER', x: 0,    y: 0,  rotate: 0,   scale: 1.2,  z: 30, shadow: 'shadow-hard-lg' },
  { rank: 'J',     x: 60,   y: 5,  rotate: 11,  scale: 1,    z: 20, shadow: 'shadow-hard' },
  { rank: 'Q',     x: 120,  y: 20, rotate: 22,  scale: 1,    z: 10, shadow: 'shadow-hard' },
]

export function CardFan() {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const cards = containerRef.current.querySelectorAll<HTMLDivElement>('.fan-card')

    cards.forEach(card => {
      card.style.opacity = '0'
      card.style.transform = 'translateY(60px)'
    })

    const entrance = animate(cards, {
      translateY: 0,
      opacity: 1,
      duration: 700,
      delay: utils.stagger(110, { start: 150 }),
      ease: 'outBack',
    })

    let idle: ReturnType<typeof animate> | null = null
    entrance.then?.(() => {
      idle = animate(cards, {
        translateY: [
          { to: -5, duration: 2200, ease: 'inOutSine' },
          { to: 0,  duration: 2200, ease: 'inOutSine' },
        ],
        loop: true,
        delay: utils.stagger(180),
      })
    })

    return () => {
      entrance.pause?.()
      idle?.pause?.()
    }
  }, [])

  return (
    <section className="relative z-30 w-full max-w-[900px] mx-auto mt-2 md:mt-4 mb-6 md:mb-10 flex justify-center items-center h-[180px] sm:h-[230px] md:h-[280px] lg:h-[320px]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-full bg-bate-gold/10 blur-[100px] rounded-full z-0 pointer-events-none" />
      <div ref={containerRef} className="relative w-[78px] sm:w-[110px] md:w-[140px] lg:w-[170px] h-[110px] sm:h-[154px] md:h-[196px] lg:h-[238px] flex justify-center items-center">
        {FAN.map((slot) => (
          <div
            key={slot.rank}
            className="fan-slot absolute inset-0"
            style={{
              transform: `translate(${slot.x}%, ${slot.y}%) rotate(${slot.rotate}deg) scale(${slot.scale})`,
              zIndex: slot.z,
            }}
          >
            <div
              className={`fan-card w-full h-full bg-bate-cream border-[3px] md:border-[4px] border-bate-ink rounded-xl md:rounded-2xl overflow-hidden ${slot.shadow}`}
              style={{ willChange: 'transform, opacity' }}
            >
              <img
                src={CARD_META[slot.rank].image}
                alt={CARD_META[slot.rank].displayName ?? slot.rank}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
