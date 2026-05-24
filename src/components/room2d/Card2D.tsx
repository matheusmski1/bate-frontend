'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { Eye, ArrowLeftRight } from 'lucide-react'
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

type VictimEffect = 'peeked' | 'swapped'

type Props = {
  card: RedactedCard
  tempRevealedAs?: { rank: Rank; suit: Suit | null } | null
  onClick?: () => void
  highlighted?: boolean
  victimEffect?: VictimEffect | null
  size?: 'sm' | 'md' | 'lg'
  draggable?: boolean
} & Omit<HTMLMotionProps<'button'>, 'onClick' | 'children'>

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-14 h-20',
  md: 'w-20 h-28',
  lg: 'w-28 h-40',
}

const VICTIM_SHADOW: Record<VictimEffect, string> = {
  peeked: '0 0 28px 8px rgba(255, 210, 63, 0.85), 0 10px 22px rgba(0,0,0,0.55)',
  swapped: '0 0 28px 8px rgba(239, 68, 68, 0.85), 0 10px 22px rgba(0,0,0,0.55)',
}

export function Card2D({ card, tempRevealedAs = null, onClick, highlighted = false, victimEffect = null, size = 'md', ...rest }: Props) {
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
        boxShadow: victimEffect
          ? VICTIM_SHADOW[victimEffect]
          : highlighted
            ? '0 0 22px 6px rgba(255, 210, 63, 0.65), 0 10px 22px rgba(0,0,0,0.55)'
            : isSpecial
              ? '0 0 12px 1px rgba(255, 210, 63, 0.35), 0 8px 18px rgba(0,0,0,0.55)'
              : '0 6px 16px rgba(0,0,0,0.55)',
      }}
      transition={{ rotateY: { duration: 0.45, ease: 'easeOut' }, boxShadow: { duration: 0.25 } }}
      style={{ transformStyle: 'preserve-3d' }}
      className={`relative ${SIZE_CLASSES[size]} rounded-xl select-none ${onClick ? 'cursor-pointer' : 'cursor-default'} disabled:cursor-default ${victimEffect ? 'animate-pulse' : ''}`}
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
      {victimEffect && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1], opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-xl z-10 ${victimEffect === 'peeked' ? 'bg-cabo-gold text-cabo-bg' : 'bg-red-500 text-white'}`}
        >
          {victimEffect === 'peeked' ? <Eye size={20} strokeWidth={3} /> : <ArrowLeftRight size={20} strokeWidth={3} />}
        </motion.div>
      )}
    </motion.button>
  )
}
