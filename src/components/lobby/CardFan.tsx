'use client'

import { CARD_META } from '@/lib/card-meta'
import type { Rank } from '@/types/shared'

type FanItem = { rank: Rank; transform: string; z: number; shadow: string }

const FAN: FanItem[] = [
  { rank: 'JOKER', transform: '-translate-x-[110%] md:-translate-x-[120%] rotate-[-22deg] translate-y-[20%]', z: 10, shadow: 'shadow-hard' },
  { rank: '10',    transform: '-translate-x-[55%] md:-translate-x-[60%] rotate-[-11deg] translate-y-[5%]',     z: 20, shadow: 'shadow-hard' },
  { rank: 'K',     transform: 'scale-110 md:scale-125',                                                        z: 30, shadow: 'shadow-hard-lg' },
  { rank: 'J',     transform: 'translate-x-[55%] md:translate-x-[60%] rotate-[11deg] translate-y-[5%]',        z: 20, shadow: 'shadow-hard' },
  { rank: 'Q',     transform: 'translate-x-[110%] md:translate-x-[120%] rotate-[22deg] translate-y-[20%]',     z: 10, shadow: 'shadow-hard' },
]

export function CardFan() {
  return (
    <section className="relative z-30 w-full max-w-[1200px] mx-auto mt-6 md:mt-10 mb-10 md:mb-16 flex justify-center items-center h-[200px] sm:h-[280px] md:h-[380px] lg:h-[450px]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-full bg-bate-gold/10 blur-[100px] rounded-full z-0 pointer-events-none" />
      <div className="relative w-[110px] sm:w-[150px] md:w-[200px] lg:w-[256px] h-[154px] sm:h-[210px] md:h-[280px] lg:h-[360px] flex justify-center items-center">
        {FAN.map((item) => (
          <div
            key={item.rank}
            style={{ zIndex: item.z }}
            className={`card-fan-item absolute inset-0 bg-bate-cream border-[3px] md:border-[4px] border-bate-ink rounded-xl md:rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden transform ${item.transform} ${item.shadow}`}
          >
            <img
              src={CARD_META[item.rank].image}
              alt={CARD_META[item.rank].displayName ?? item.rank}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
