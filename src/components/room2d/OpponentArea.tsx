'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { RedactedPlayer, Rank, Suit } from '@/types/shared'
import { Card2D } from './Card2D'
import { CardBack } from './CardBack'
import { Nameplate } from './Nameplate'

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
}

export function OpponentArea({ player, isCurrent, isHost = false, isLeader = false, onCardClick, tempReveals, highlightedIds, victimEffects, holdingDrawn = false }: Props) {
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
      translateY: [0, -6, 0],
      duration: 2200,
      loop: true,
      ease: 'inOutSine',
      delay: 800,
    })
    return () => { bob.pause?.() }
  }, [holdingDrawn])

  return (
    <div className="flex flex-col items-center gap-2">
      <Nameplate
        name={player.name}
        score={player.score}
        isCurrent={isCurrent}
        connected={player.connected}
        isHost={isHost}
        isLeader={isLeader}
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
        {holdingDrawn && (
          <div
            ref={flyingRef}
            className="w-20 h-28 rounded-xl overflow-hidden border-[3px] border-bate-ink shadow-hard"
            style={{ willChange: 'transform, opacity' }}
          >
            <CardBack />
          </div>
        )}
      </div>
    </div>
  )
}
