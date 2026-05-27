'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { RedactedPlayer, Rank, Suit } from '@/types/shared'
import { Card2D } from './Card2D'
import { CardBack } from './CardBack'
import { Nameplate } from './Nameplate'
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
  selectedCardIds?: readonly string[]
  emote?: { id: number; key: string } | null
  // seat controla o agrupamento das cartas na desktop view:
  // - 'top' (default): cards em linha (flex-row)
  // - 'left' / 'right': cards em coluna (flex-col), tipo UNO mas sem rotação
  //   pra manter cartas legíveis
  seat?: 'top' | 'left' | 'right'
}

export function OpponentArea({ player, isCurrent, isHost = false, isLeader = false, onCardClick, tempReveals, highlightedIds, victimEffects, holdingDrawn = false, selectedCardIds, emote = null, seat = 'top' }: Props) {
  const isLateral = seat === 'left' || seat === 'right'
  const desktopFlyingRef = useRef<HTMLDivElement | null>(null)
  const mobileFlyingRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!holdingDrawn) return
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
    const el = isDesktop ? desktopFlyingRef.current : mobileFlyingRef.current
    if (!el) return
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
    if (!holdingDrawn) return
    const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches
    const el = isDesktop ? desktopFlyingRef.current : mobileFlyingRef.current
    if (!el) return
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

      {/* Mobile: compact horizontal pill */}
      <div className="sm:hidden">
        <div
          className={`relative flex items-center gap-1.5 px-1.5 py-1 rounded-2xl border-[2px] border-bate-ink ${
            isCurrent ? 'bg-bate-gold' : 'bg-bate-paper'
          } ${!player.connected ? 'opacity-60' : ''} shadow-hard-sm transition-colors`}
        >
          <div className="flex items-center gap-1 min-w-0">
            <Avatar name={player.name} size={28} />
            <div className="flex flex-col leading-tight min-w-0">
              <div className="font-display text-[11px] flex items-center gap-1 truncate max-w-[80px]">
                {isLeader && <span title="Em primeiro" className="text-[11px]">🏆</span>}
                <span className="truncate">{player.name}</span>
                {isHost && <span title="Host" className="text-[10px]">👑</span>}
              </div>
              <div className="font-body text-[9px] uppercase tracking-wider text-bate-ink/70 leading-none">{player.score}p</div>
            </div>
          </div>
          <div className="flex gap-0.5 items-center">
            {player.hand.map((c, i) => (
              <Card2D
                key={c.id}
                card={c}
                size="sm"
                onClick={onCardClick ? () => onCardClick(i) : undefined}
                tempRevealedAs={tempReveals?.get(c.id) ?? null}
                highlighted={highlightedIds?.has(c.id) ?? false}
                victimEffect={victimEffects?.get(c.id) ?? null}
                selected={selectedCardIds?.includes(c.id) ?? false}
                deckId={player.deck}
              />
            ))}
            {holdingDrawn && (
              <div
                ref={mobileFlyingRef}
                className="w-8 h-12 rounded-md overflow-hidden border-[2px] border-bate-ink shadow-hard-sm ml-1"
                style={{ willChange: 'transform, opacity' }}
              >
                <CardBack deckId={player.deck} />
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

      {/* Desktop: nameplate on top, cards below */}
      <div className="hidden sm:flex sm:flex-col sm:items-center sm:gap-2">
        <Nameplate
          name={player.name}
          score={player.score}
          isCurrent={isCurrent}
          connected={player.connected}
          isHost={isHost}
          isLeader={isLeader}
          dataAttribute={{ key: 'data-opponent-nameplate', value: player.id }}
        />
        <div className={`flex gap-3 ${isLateral ? 'flex-col items-center' : 'items-center'}`}>
          <div className={`flex gap-2 ${isLateral ? 'flex-col' : ''}`}>
            {player.hand.map((c, i) => (
              <Card2D
                key={c.id}
                card={c}
                size="md"
                onClick={onCardClick ? () => onCardClick(i) : undefined}
                tempRevealedAs={tempReveals?.get(c.id) ?? null}
                highlighted={highlightedIds?.has(c.id) ?? false}
                victimEffect={victimEffects?.get(c.id) ?? null}
                selected={selectedCardIds?.includes(c.id) ?? false}
                deckId={player.deck}
              />
            ))}
          </div>
          {holdingDrawn && (
            <div
              ref={desktopFlyingRef}
              className="w-20 h-28 rounded-xl overflow-hidden border-[3px] border-bate-ink shadow-hard"
              style={{ willChange: 'transform, opacity' }}
            >
              <CardBack deckId={player.deck} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
