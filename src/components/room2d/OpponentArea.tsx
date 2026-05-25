'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { RedactedPlayer, Rank, Suit } from '@/types/shared'
import { Card2D } from './Card2D'
import { CardBack } from './CardBack'
import { Avatar } from '@/components/lobby/Avatar'
import { EmoteBubble } from './EmoteBubble'
import { playSound } from '@/lib/sounds'

type Props = {
  player: RedactedPlayer
  isCurrent: boolean
  isHost?: boolean
  isLeader?: boolean
  onCardClick?: (handIndex: number) => void
  tempReveals?: Map<string, { rank: Rank; suit: Suit | null }>
  highlightedIds?: Set<string>
  victimEffects?: Map<string, 'peeked' | 'swapped'>
  holdingDrawn?: boolean
  emote?: { id: number; key: string } | null
}

export function OpponentArea({ player, isCurrent, isHost = false, isLeader = false, onCardClick, tempReveals, highlightedIds, victimEffects, holdingDrawn = false, emote = null }: Props) {
  const flyingRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!holdingDrawn || !flyingRef.current) return
    const el = flyingRef.current
    const rect = el.getBoundingClientRect()
    const targetCx = rect.left + rect.width / 2
    const targetCy = rect.top + rect.height / 2
    const startX = window.innerWidth / 2 - targetCx
    const startY = window.innerHeight / 2 - targetCy
    el.style.opacity = '0'
    el.style.transform = `translate(${startX}px, ${startY}px) rotate(-30deg) scale(0.55)`
    playSound('card-fly')
    const tl = animate(el, {
      translateX: [startX, 0],
      translateY: [startY, 0],
      rotate: [-30, 6, 0],
      scale: [0.55, 1.08, 1],
      opacity: [0, 1],
      duration: 700,
      ease: 'outBack',
    })
    return () => { tl.pause?.() }
  }, [holdingDrawn])

  useEffect(() => {
    if (!holdingDrawn || !flyingRef.current) return
    const el = flyingRef.current
    const bob = animate(el, {
      translateY: [0, -4, 0],
      duration: 2200,
      loop: true,
      ease: 'inOutSine',
      delay: 800,
    })
    return () => { bob.pause?.() }
  }, [holdingDrawn])

  return (
    <div className="relative">
      <EmoteBubble emote={emote?.key ?? null} id={emote?.id ?? 0} />
      <div
        className={`flex items-center gap-1.5 sm:gap-2 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-2xl border-[2px] sm:border-[3px] border-bate-ink ${
          isCurrent ? 'bg-bate-gold' : 'bg-bate-paper'
        } ${!player.connected ? 'opacity-60' : ''} shadow-hard-sm transition-colors`}
      >
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <Avatar name={player.name} size={22} />
          <div className="flex flex-col leading-tight min-w-0">
            <div className="font-display text-[11px] sm:text-xs flex items-center gap-1 truncate max-w-[80px] sm:max-w-[120px]">
              {isLeader && <span title="Em primeiro" className="text-[11px]">🏆</span>}
              <span className="truncate">{player.name}</span>
              {isHost && <span title="Host" className="text-[10px]">👑</span>}
            </div>
            <div className="font-body text-[9px] uppercase tracking-wider text-bate-ink/70 leading-none">{player.score}p</div>
          </div>
        </div>
        <div className="flex gap-0.5 sm:gap-1 items-center">
          {player.hand.map((c, i) => (
            <Card2D
              key={c.id}
              card={c}
              size="sm"
              onClick={onCardClick ? () => onCardClick(i) : undefined}
              tempRevealedAs={tempReveals?.get(c.id) ?? null}
              highlighted={highlightedIds?.has(c.id) ?? false}
              victimEffect={victimEffects?.get(c.id) ?? null}
            />
          ))}
          {holdingDrawn && (
            <div
              ref={flyingRef}
              className="w-8 h-12 sm:w-10 sm:h-14 rounded-md overflow-hidden border-[2px] border-bate-ink shadow-hard-sm ml-1"
              style={{ willChange: 'transform, opacity' }}
            >
              <CardBack />
            </div>
          )}
        </div>
        {isCurrent && (
          <span className="absolute -top-1.5 -right-1.5 bg-bate-red text-bate-paper text-[8px] font-display px-1.5 py-0.5 rounded-full border-[2px] border-bate-ink shadow-hard-sm tracking-wider">
            VEZ
          </span>
        )}
      </div>
    </div>
  )
}
