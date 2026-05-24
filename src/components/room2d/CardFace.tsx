'use client'

import { Eye, Search, ArrowLeftRight, Award, Trophy } from 'lucide-react'
import type { Rank, Suit } from '@/types/shared'
import { CARD_META, formatPoints } from '@/lib/card-meta'

const SUIT_GLYPH: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }

const ICON_COMPONENTS = {
  Eye, Search, ArrowLeftRight, Award, Trophy,
} as const

function isRed(suit: Suit | null): boolean {
  return suit === 'hearts' || suit === 'diamonds'
}

function badgeStyle(points: number, kind: string) {
  if (kind === 'gold') return 'bg-amber-400 text-amber-950 border-amber-300'
  if (kind === 'silver') return 'bg-emerald-500 text-white border-emerald-300'
  if (points >= 10) return 'bg-red-500 text-white border-red-300'
  if (points >= 5) return 'bg-orange-400 text-white border-orange-200'
  return 'bg-amber-200 text-amber-900 border-amber-100'
}

function cardBgStyle(kind: string) {
  if (kind === 'gold') return 'bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100'
  if (kind === 'silver') return 'bg-gradient-to-br from-slate-50 via-white to-slate-100'
  return 'bg-gradient-to-br from-amber-50 via-white to-amber-50'
}

function cardBorderStyle(kind: string) {
  if (kind === 'gold') return 'border-amber-400 shadow-[inset_0_0_18px_rgba(212,175,55,0.35)]'
  if (kind === 'silver') return 'border-slate-300 shadow-[inset_0_0_14px_rgba(148,163,184,0.3)]'
  return 'border-gray-300'
}

export function CardFace({ rank, suit }: { rank: Rank; suit: Suit | null }) {
  const meta = CARD_META[rank]
  const IconComponent = meta.iconName ? ICON_COMPONENTS[meta.iconName] : null
  const glyph = suit ? SUIT_GLYPH[suit] ?? '?' : '?'
  const suitColor = isRed(suit) ? '#c8102e' : '#0d1b2a'
  const accentColor = meta.kind === 'gold' ? '#b8941f' : meta.kind === 'silver' ? '#475569' : suitColor
  const isNumeric = meta.kind === 'numeric'
  const showSuit = suit !== null

  return (
    <div
      className={`absolute inset-0 rounded-xl overflow-hidden border ${cardBgStyle(meta.kind)} ${cardBorderStyle(meta.kind)}`}
      style={{ containerType: 'size' }}
    >
      <div
        className={`absolute font-extrabold rounded-full border ${badgeStyle(meta.pointValue, meta.kind)}`}
        style={{
          top: '5cqh',
          left: '5cqw',
          paddingLeft: '6cqw',
          paddingRight: '6cqw',
          paddingTop: '0.5cqh',
          paddingBottom: '0.5cqh',
          fontSize: '11cqh',
          lineHeight: 1,
        }}
      >
        {formatPoints(meta.pointValue)}
      </div>

      {showSuit && (
        <div
          className="absolute leading-none font-bold"
          style={{ top: '5cqh', right: '6cqw', fontSize: '14cqh', color: suitColor }}
        >
          {glyph}
        </div>
      )}

      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        style={{ color: accentColor }}
      >
        {isNumeric ? (
          <>
            <div className="leading-none font-serif" style={{ fontSize: '50cqh', fontWeight: 900 }}>{rank}</div>
            {showSuit && (
              <div className="leading-none" style={{ fontSize: '20cqh', marginTop: '2cqh' }}>{glyph}</div>
            )}
          </>
        ) : (
          <>
            {IconComponent && (
              <div
                style={{
                  width: meta.kind === 'gold' || meta.kind === 'silver' ? '40cqh' : '34cqh',
                  height: meta.kind === 'gold' || meta.kind === 'silver' ? '40cqh' : '34cqh',
                  filter:
                    meta.kind === 'gold'
                      ? 'drop-shadow(0 2cqh 6cqh rgba(212,175,55,0.55))'
                      : meta.kind === 'silver'
                        ? 'drop-shadow(0 2cqh 4cqh rgba(148,163,184,0.5))'
                        : 'none',
                }}
              >
                <IconComponent className="w-full h-full" strokeWidth={2.2} />
              </div>
            )}
            <div
              className="font-extrabold mt-1 tracking-tight whitespace-nowrap"
              style={{ fontSize: meta.kind === 'gold' || meta.kind === 'silver' ? '13cqh' : '11cqh' }}
            >
              {meta.displayName}
            </div>
          </>
        )}
      </div>

      {showSuit && (
        <div
          className="absolute leading-none font-bold rotate-180 flex flex-col items-center"
          style={{ bottom: '5cqh', right: '5cqw', color: suitColor }}
        >
          {isNumeric && <span style={{ fontSize: '14cqh', fontWeight: 900 }}>{rank}</span>}
          <span style={{ fontSize: '12cqh', marginTop: '0.5cqh' }}>{glyph}</span>
        </div>
      )}
    </div>
  )
}
