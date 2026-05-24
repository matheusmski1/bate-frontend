import type { Rank } from '@/types/shared'

export type CardKind = 'numeric' | 'action' | 'silver' | 'gold'

export type CardMeta = {
  pointValue: number
  kind: CardKind
  image: string
  displayName?: string
  abilityText?: string
  iconName?: 'Eye' | 'Search' | 'ArrowLeftRight' | 'Award' | 'Trophy'
}

export const CARD_BACK_IMAGE = '/cards/back.webp'

export const CARD_META: Record<Rank, CardMeta> = {
  'A': { pointValue: 1, kind: 'numeric', image: '/cards/batinho-as.webp' },
  '2': { pointValue: 2, kind: 'numeric', image: '/cards/batinho-2.webp' },
  '3': { pointValue: 3, kind: 'numeric', image: '/cards/batinho-3.webp' },
  '4': { pointValue: 4, kind: 'numeric', image: '/cards/batinho-4.webp' },
  '5': { pointValue: 5, kind: 'numeric', image: '/cards/batinho-5.webp' },
  '6': { pointValue: 6, kind: 'numeric', image: '/cards/batinho-6.webp' },
  '7': { pointValue: 7, kind: 'numeric', image: '/cards/batinho-7.webp' },
  '8': { pointValue: 8, kind: 'numeric', image: '/cards/batinho-8.webp' },
  '9': { pointValue: 9, kind: 'numeric', image: '/cards/batinho-9.webp' },
  '10': {
    pointValue: 10,
    kind: 'action',
    image: '/cards/batinho-olhadinha.webp',
    displayName: 'OLHADINHA',
    abilityText: 'Espia 1 carta SUA',
    iconName: 'Eye',
  },
  'J': {
    pointValue: 11,
    kind: 'action',
    image: '/cards/batinho-espiadinha.webp',
    displayName: 'ESPIADINHA',
    abilityText: 'Espia 1 carta de OUTRO',
    iconName: 'Search',
  },
  'Q': {
    pointValue: 12,
    kind: 'action',
    image: '/cards/batinho-troca.webp',
    displayName: 'TROCA',
    abilityText: 'Troca carta com outro jogador',
    iconName: 'ArrowLeftRight',
  },
  'K': {
    pointValue: -3,
    kind: 'silver',
    image: '/cards/batinho-k.webp',
    displayName: 'PRATA',
    abilityText: 'Vale −3 pontos',
    iconName: 'Award',
  },
  'JOKER': {
    pointValue: -6,
    kind: 'gold',
    image: '/cards/batinho-joker.webp',
    displayName: 'OURO',
    abilityText: 'Vale −6 pontos',
    iconName: 'Trophy',
  },
}

export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`
}
