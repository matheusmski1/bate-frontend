'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import type { Card as CardType } from '@/types/shared'
import { Card2D } from './Card2D'
import { CARD_META } from '@/lib/card-meta'
import { playSound } from '@/lib/sounds'

export function DrawnCard2D({
  card,
  onUseAction,
  onDiscard,
  deckId = null,
}: {
  card: CardType
  onUseAction: () => void
  onDiscard: () => void
  deckId?: string | null
}) {
  const meta = CARD_META[card.rank]
  const isAction = meta.kind === 'action'
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!wrapRef.current) return
    playSound('card-fly')
    const cardEl = wrapRef.current.querySelector('.drawn-card-inner') as HTMLElement | null
    if (cardEl) {
      animate(cardEl, {
        translateX: [-160, 0],
        translateY: [-40, -6, 0],
        rotate: [-25, 8, 0],
        scale: [0.6, 1.1, 1],
        opacity: [0, 1],
        duration: 650,
        ease: 'outBack',
      })
    }
    const buttons = wrapRef.current.querySelectorAll('.drawn-card-btn')
    if (buttons.length > 0) {
      animate(buttons, {
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.85, 1],
        duration: 360,
        delay: 380,
        ease: 'outBack',
      })
    }
  }, [card.id])

  return (
    <div ref={wrapRef} className="flex flex-col items-center gap-3">
      <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-4">
        {isAction && (
          <button
            type="button"
            onClick={onUseAction}
            className="drawn-card-btn opacity-0 order-2 sm:order-1 px-2 py-1.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-bate-gold border-[2px] sm:border-[3px] border-bate-ink shadow-hard sm:shadow-hard-lg text-bate-ink font-display uppercase whitespace-nowrap text-center leading-tight hover:scale-105 hover:-translate-y-1 active:scale-95 transition-transform"
          >
            <div className="text-[11px] sm:text-sm">🎯 USAR {meta.displayName}</div>
          </button>
        )}

        <div className="drawn-card-inner relative order-1 sm:order-2" style={{ willChange: 'transform, opacity' }}>
          <div className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-bate-gold text-bate-ink text-[10px] sm:text-xs font-extrabold whitespace-nowrap shadow-lg">
            Comprou
          </div>
          <Card2D
            card={{ id: card.id, rank: card.rank, suit: card.suit }}
            size="lg"
            deckId={deckId}
            onClick={isAction ? undefined : onDiscard}
            highlighted
          />
        </div>

        <button
          type="button"
          onClick={onDiscard}
          className="drawn-card-btn opacity-0 order-3 sm:order-3 px-2 py-1.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-bate-paper border-[2px] sm:border-[3px] border-bate-ink shadow-hard-sm sm:shadow-hard text-bate-ink font-display uppercase whitespace-nowrap text-center leading-tight hover:scale-105 hover:-translate-y-1 active:scale-95 transition-transform"
        >
          <div className="text-[11px] sm:text-sm">🗑️ DESCARTAR{isAction && <span className="font-normal text-bate-ink/60"> sem ação</span>}</div>
        </button>
      </div>

      <div className="drawn-card-btn opacity-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm font-display text-[9px] sm:text-[11px] text-bate-ink uppercase text-center max-w-[280px] sm:max-w-none sm:whitespace-nowrap">
        🔄 OU TROCA: clica uma carta SUA pra colocar esta no lugar
      </div>
    </div>
  )
}
