'use client'

import type { Card as CardType } from '@/types/shared'
import { Card2D } from './Card2D'

export function DiscardPile2D({ discard }: { discard: CardType[] }) {
  const top = discard[discard.length - 1]
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-36">
        {!top ? (
          <div className="absolute inset-0 rounded-xl border-2 border-dashed border-bate-ink/40 flex items-center justify-center">
            <span className="text-bate-ink/60 text-xs">vazio</span>
          </div>
        ) : (
          <Card2D card={{ id: top.id, rank: top.rank, suit: top.suit }} size="lg" />
        )}
      </div>
      <span className="text-xs font-bold text-bate-ink mt-1">Descarte</span>
    </div>
  )
}
