'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'

type Props = {
  currentSeat: 'me' | 'top' | 'left' | 'right' | 'top-left' | 'top-right'
}

const ANGLE: Record<Props['currentSeat'], number> = {
  me: 90,
  top: -90,
  left: 180,
  right: 0,
  'top-left': -135,
  'top-right': -45,
}

export function TurnArrow({ currentSeat }: Props) {
  const ref = useRef<SVGSVGElement | null>(null)
  const lastAngle = useRef<number>(ANGLE[currentSeat])

  useEffect(() => {
    if (!ref.current) return
    const target = ANGLE[currentSeat]
    let next = target
    const diff = ((target - lastAngle.current + 540) % 360) - 180
    next = lastAngle.current + diff
    animate(ref.current, {
      rotate: [lastAngle.current, next],
      duration: 600,
      ease: 'outBack',
    })
    lastAngle.current = next
  }, [currentSeat])

  return (
    <svg
      ref={ref}
      width="44"
      height="44"
      viewBox="0 0 44 44"
      style={{ transform: `rotate(${ANGLE[currentSeat]}deg)` }}
      className="pointer-events-none"
    >
      <circle cx="22" cy="22" r="20" fill="#1a0e08" />
      <circle cx="22" cy="22" r="17" fill="#ffb81c" />
      <path
        d="M 22 8 L 30 24 L 24 22 L 24 36 L 20 36 L 20 22 L 14 24 Z"
        fill="#1a0e08"
        stroke="#1a0e08"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
