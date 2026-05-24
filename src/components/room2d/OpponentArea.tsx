'use client'

import type { RedactedPlayer, Rank, Suit } from '@/types/shared'
import { Card2D } from './Card2D'

type Props = {
  player: RedactedPlayer
  isCurrent: boolean
  onCardClick?: (handIndex: number) => void
  tempReveals?: Map<string, { rank: Rank; suit: Suit | null }>
  highlightedIds?: Set<string>
  victimEffects?: Map<string, 'peeked' | 'swapped'>
}

export function OpponentArea({ player, isCurrent, onCardClick, tempReveals, highlightedIds, victimEffects }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`px-4 py-1 rounded-full text-sm font-bold backdrop-blur ${isCurrent ? 'bg-cabo-accent text-white shadow-[0_0_18px_rgba(255,107,53,0.6)]' : 'bg-cabo-surface/80 text-cabo-purple'}`}>
        {player.name} ({player.score}){!player.connected && ' • off'}
      </div>
      <div className="flex gap-2">
        {player.hand.map((c, i) => (
          <Card2D
            key={c.id}
            card={c}
            size="md"
            onClick={onCardClick ? () => onCardClick(i) : undefined}
            tempRevealedAs={tempReveals?.get(c.id) ?? null}
            highlighted={highlightedIds?.has(c.id) ?? false}
            victimEffect={victimEffects?.get(c.id) ?? null}
          />
        ))}
      </div>
    </div>
  )
}
