'use client'

import { useEffect, useRef } from 'react'
import { createTimeline } from 'animejs'
import { getMascot } from '@/lib/mascot'

type Props = {
  size?: number
  onComplete?: () => void
  arenaId?: string
}

export function BatinhoOlhadinha({ size = 400, onComplete, arenaId = 'default' }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    const peekX = size * 0.55
    const peekY = -size * 0.45

    const tl = createTimeline({
      defaults: { ease: 'outQuad' },
      onComplete: () => onCompleteRef.current?.(),
    })

    tl.add(el, {
      opacity: [0, 1],
      scale: [0, 1],
      rotate: [-15, 0],
      duration: 350,
      ease: 'outBack',
    })

    tl.add(el, {
      translateX: [0, peekX * 0.5, peekX],
      translateY: [0, peekY * 1.1, peekY],
      rotate: [0, 6, 0],
      duration: 700,
      ease: 'inOutQuad',
    })

    tl.add(el, {
      translateX: [peekX, peekX + 6, peekX - 4, peekX + 5, peekX - 3, peekX],
      rotate: [0, 3, -2, 2, -1, 0],
      duration: 900,
      ease: 'inOutSine',
    })

    tl.add(el, {
      scale: [1, 1.08, 1],
      rotate: [0, 8, -2, 0],
      duration: 350,
      ease: 'outElastic(1, .6)',
    })

    tl.add(el, {
      duration: 400,
    })

    tl.add(el, {
      translateX: [peekX, 0],
      translateY: [peekY, 0],
      scale: [1, 0],
      opacity: [1, 0],
      rotate: [0, -15],
      duration: 500,
      ease: 'inQuad',
    })

    return () => {
      tl.pause()
    }
  }, [size])

  const imgSize = size * 0.32

  return (
    <div className="pointer-events-none relative overflow-hidden" style={{ width: size, height: size }}>
      <img
        ref={imgRef}
        src={getMascot('lupa', arenaId)}
        alt=""
        aria-hidden
        className="absolute select-none"
        style={{
          left: 12,
          bottom: 12,
          width: imgSize,
          height: imgSize,
          opacity: 0,
          willChange: 'transform, opacity',
          transformOrigin: 'center',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.25))',
        }}
      />
    </div>
  )
}
