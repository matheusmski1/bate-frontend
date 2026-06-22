'use client'

import { getCardBack } from '@/lib/card-meta'

export function CardBack({ deckId = null }: { deckId?: string | null }) {
  return (
    <img
      src={getCardBack(deckId)}
      alt=""
      className="w-full h-full object-cover"
      style={{ transform: 'scaleX(-1)' }}
      draggable={false}
    />
  )
}
