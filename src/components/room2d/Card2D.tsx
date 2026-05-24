'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import type { RedactedCard, Rank, Suit } from '@/types/shared'
import { CardFace } from './CardFace'
import { CardBack } from './CardBack'
import { CARD_META, formatPoints } from '@/lib/card-meta'

function tooltipFor(rank: Rank): string {
  const meta = CARD_META[rank]
  const points = formatPoints(meta.pointValue)
  if (meta.displayName) return `${meta.displayName} (${points} pts) — ${meta.abilityText ?? ''}`
  return `${rank} (${points} pts)`
}

type Props = {
  card: RedactedCard
  tempRevealedAs?: { rank: Rank; suit: Suit | null } | null
  onClick?: () => void
  highlighted?: boolean
  size?: 'sm' | 'md' | 'lg'
  draggable?: boolean
} & Omit<HTMLMotionProps<'button'>, 'onClick' | 'children'>

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-14 h-20',
  md: 'w-20 h-28',
  lg: 'w-28 h-40',
}

export function Card2D({ card, tempRevealedAs = null, onClick, highlighted = false, size = 'md', ...rest }: Props) {
  const isHidden = 'hidden' in card
  const effectiveRank = tempRevealedAs?.rank ?? (!isHidden ? card.rank : null)
  const effectiveSuit = tempRevealedAs ? tempRevealedAs.suit : (!isHidden ? card.suit : null)
  const showFace = !!effectiveRank
  const meta = effectiveRank ? CARD_META[effectiveRank] : null
  const isSpecial = !!meta && meta.kind !== 'numeric'
  const tooltip = effectiveRank ? tooltipFor(effectiveRank) : undefined

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={onClick ? { scale: 1.12, y: -10 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      animate={{
        rotateY: showFace ? 0 : 180,
        boxShadow: highlighted
          ? '0 0 22px 6px rgba(255, 210, 63, 0.65), 0 10px 22px rgba(0,0,0,0.55)'
          : isSpecial
            ? '0 0 12px 1px rgba(255, 210, 63, 0.35), 0 8px 18px rgba(0,0,0,0.55)'
            : '0 6px 16px rgba(0,0,0,0.55)',
      }}
      transition={{ rotateY: { duration: 0.45, ease: 'easeOut' }, boxShadow: { duration: 0.25 } }}
      style={{ transformStyle: 'preserve-3d' }}
      className={`relative ${SIZE_CLASSES[size]} rounded-xl select-none ${onClick ? 'cursor-pointer' : 'cursor-default'} disabled:cursor-default`}
      disabled={!onClick}
      title={tooltip}
      {...rest}
    >
      <div
        className="absolute inset-0 backface-hidden"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
      >
        {showFace && effectiveRank ? (
          <CardFace rank={effectiveRank} suit={effectiveSuit} />
        ) : (
          <CardBack />
        )}
      </div>
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        <CardBack />
      </div>
    </motion.button>
  )
}
