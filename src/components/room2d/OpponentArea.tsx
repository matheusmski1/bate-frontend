'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { RedactedPlayer, Rank, Suit } from '@/types/shared'
import { Card2D } from './Card2D'
import { CardBack } from './CardBack'
import { Nameplate } from './Nameplate'

type Props = {
  player: RedactedPlayer
  isCurrent: boolean
  isHost?: boolean
  onCardClick?: (handIndex: number) => void
  tempReveals?: Map<string, { rank: Rank; suit: Suit | null }>
  highlightedIds?: Set<string>
  victimEffects?: Map<string, 'peeked' | 'swapped'>
  holdingDrawn?: boolean
}

export function OpponentArea({ player, isCurrent, isHost = false, onCardClick, tempReveals, highlightedIds, victimEffects, holdingDrawn = false }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Nameplate
        name={player.name}
        score={player.score}
        isCurrent={isCurrent}
        connected={player.connected}
        isHost={isHost}
      />
      <div className="flex gap-3 items-center">
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
        <AnimatePresence>
          {holdingDrawn && (
            <motion.div
              key="drawn"
              initial={{ opacity: 0, y: 80, scale: 0.6, rotate: -15 }}
              animate={{
                opacity: 1,
                y: [0, -6, 0],
                scale: 1.05,
                rotate: 0,
                boxShadow: '0 0 22px 4px rgba(255,210,63,0.55), 0 8px 18px rgba(0,0,0,0.55)',
              }}
              exit={{ opacity: 0, y: 120, scale: 0.7, rotate: 8, transition: { duration: 0.35 } }}
              transition={{ y: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.3 }, scale: { duration: 0.3 } }}
              className="w-20 h-28 rounded-xl overflow-hidden"
            >
              <CardBack />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
