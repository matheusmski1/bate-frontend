'use client'

import { CARD_BACK_IMAGE } from '@/lib/card-meta'

export function CardBack() {
  return (
    <img
      src={CARD_BACK_IMAGE}
      alt=""
      className="w-full h-full object-cover"
      draggable={false}
    />
  )
}
