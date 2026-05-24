'use client'

import { Spade, Heart, Diamond, Club } from 'lucide-react'

export function SuitBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.05] text-bate-ink">
      <Spade
        size={500}
        strokeWidth={1.2}
        className="absolute -top-20 -left-20"
        style={{ transform: 'rotate(-25deg)' }}
      />
      <Heart
        size={400}
        strokeWidth={1.2}
        className="absolute top-1/4 -right-24"
        style={{ transform: 'rotate(15deg)' }}
      />
      <Diamond
        size={400}
        strokeWidth={1.2}
        className="absolute bottom-0 -left-20"
        style={{ transform: 'rotate(-10deg)' }}
      />
      <Club
        size={500}
        strokeWidth={1.2}
        className="absolute -bottom-24 right-0"
        style={{ transform: 'rotate(35deg)' }}
      />
    </div>
  )
}
