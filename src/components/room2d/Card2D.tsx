'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { Eye, ArrowLeftRight } from 'lucide-react'
import type { RedactedCard, Rank, Suit } from '@/types/shared'
import { CardBack } from './CardBack'
import { CARD_META, formatPoints, getCardImage } from '@/lib/card-meta'
import { EASE_OUT } from '@/lib/easings'

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
  snapHint?: boolean
  size?: 'sm' | 'md' | 'lg'
  draggable?: boolean
  deckId?: string | null
  // `selected`: a carta foi escolhida pelo jogador num fluxo de seleção (swap,
  // peek). Vira up + scale + glow dourado pra dar destaque visual.
  selected?: boolean
} & Omit<HTMLMotionProps<'button'>, 'onClick' | 'children'>

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-11 h-14 sm:w-14 sm:h-20',
  md: 'w-14 h-20 sm:w-20 sm:h-28',
  lg: 'w-20 h-28 sm:w-28 sm:h-40',
}

const VICTIM_SHADOW: Record<VictimEffect, string> = {
  peeked: '0 0 28px 8px rgba(255, 184, 28, 0.85), 5px 5px 0 #1a0e08',
  swapped: '0 0 28px 8px rgba(214, 50, 50, 0.85), 5px 5px 0 #1a0e08',
}

export function Card2D({ card, tempRevealedAs = null, onClick, highlighted = false, victimEffect = null, snapHint = false, size = 'md', deckId = null, selected = false, ...rest }: Props) {
  const isHidden = 'hidden' in card
  const effectiveRank: Rank | null = tempRevealedAs?.rank ?? (!isHidden ? card.rank : null)
  const showFace = !!effectiveRank
  const imageSrc = effectiveRank ? getCardImage(effectiveRank, deckId) : null
  const tooltip = effectiveRank ? tooltipFor(effectiveRank) : undefined

  return (
    <motion.button
      type="button"
      data-card-id={card.id}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.08, y: -8 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      animate={{
        y: selected ? -12 : 0,
        scale: selected ? 1.06 : 1,
      }}
      transition={{
        y: { type: 'spring', stiffness: 320, damping: 22 },
        scale: { type: 'spring', stiffness: 320, damping: 22 },
      }}
      className={`relative ${SIZE_CLASSES[size]} select-none ${onClick ? 'cursor-pointer' : 'cursor-default'} disabled:cursor-default`}
      disabled={!onClick}
      title={tooltip}
      {...rest}
    >
      <motion.div
        animate={{
          rotateY: showFace ? 0 : 180,
          boxShadow: victimEffect
            ? VICTIM_SHADOW[victimEffect]
            : selected
              ? '0 14px 28px rgba(255, 184, 28, 0.55), 0 0 22px 6px rgba(255, 184, 28, 0.85), 5px 5px 0 #1a0e08'
              : snapHint
                ? '0 0 22px 7px rgba(214, 50, 50, 0.85), 5px 5px 0 #1a0e08'
                : highlighted
                  ? '0 0 18px 4px rgba(255, 184, 28, 0.7), 5px 5px 0 #1a0e08'
                  : '5px 5px 0 #1a0e08',
        }}
        transition={{ rotateY: { duration: 0.3, ease: EASE_OUT }, boxShadow: { duration: 0.25 } }}
        style={{ transformStyle: 'preserve-3d' }}
        className={`absolute inset-0 rounded-xl border-[3px] border-bate-ink bg-bate-paper ${victimEffect ? 'animate-pulse' : ''}`}
      >
        <div
          className="absolute inset-0 rounded-[9px] overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
        >
          {showFace && imageSrc ? (
            <img
              src={imageSrc}
              alt={effectiveRank ?? ''}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <CardBack deckId={deckId} />
          )}
        </div>
        <div
          className="absolute inset-0 rounded-[9px] overflow-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <CardBack deckId={deckId} />
        </div>
      </motion.div>
      {victimEffect && (
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.3, 1], opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-hard-sm border-[3px] border-bate-ink z-10 ${victimEffect === 'peeked' ? 'bg-bate-gold text-bate-ink' : 'bg-bate-red text-white'}`}
        >
          {victimEffect === 'peeked' ? <Eye size={18} strokeWidth={3} /> : <ArrowLeftRight size={18} strokeWidth={3} />}
        </motion.div>
      )}
      {snapHint && !victimEffect && (
        <motion.div
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: [-4, -8, -4], opacity: 1, scale: [1, 1.05, 1] }}
          transition={{ y: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.3 } }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-bate-red text-bate-paper font-display text-[10px] tracking-wider whitespace-nowrap shadow-hard-sm border-[2px] border-bate-ink z-10"
        >
          CORTA!!!
        </motion.div>
      )}
    </motion.button>
  )
}
