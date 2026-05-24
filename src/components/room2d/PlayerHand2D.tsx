'use client'

import type { RedactedPlayer, Rank, Suit } from '@/types/shared'
import { Card2D } from './Card2D'
import { Nameplate } from './Nameplate'
import { EmoteBubble } from './EmoteBubble'

type Props = {
  player: RedactedPlayer
  isCurrent: boolean
  isHost?: boolean
  isLeader?: boolean
  onCardClick?: (handIndex: number) => void
  tempReveals?: Map<string, { rank: Rank; suit: Suit | null }>
  highlightedIds?: Set<string>
  victimEffects?: Map<string, 'peeked' | 'swapped'>
  snapHintIds?: Set<string>
  emote?: { id: number; key: string } | null
}

export function PlayerHand2D({ player, isCurrent, isHost = false, isLeader = false, onCardClick, tempReveals, highlightedIds, victimEffects, snapHintIds, emote = null }: Props) {
  return (
    <div className="relative flex flex-col items-center gap-3">
      <EmoteBubble emote={emote?.key ?? null} id={emote?.id ?? 0} />
      <Nameplate
        name={player.name}
        score={player.score}
        isCurrent={isCurrent}
        connected={player.connected}
        isHost={isHost}
        isLeader={isLeader}
        isMe
      />
      <div className="flex gap-3 items-end">
        {player.hand.map((c, i) => (
          <Card2D
            key={c.id}
            card={c}
            size="lg"
            onClick={onCardClick ? () => onCardClick(i) : undefined}
            tempRevealedAs={tempReveals?.get(c.id) ?? null}
            highlighted={highlightedIds?.has(c.id) ?? false}
            victimEffect={victimEffects?.get(c.id) ?? null}
            snapHint={snapHintIds?.has(c.id) ?? false}
          />
        ))}
      </div>
    </div>
  )
}
