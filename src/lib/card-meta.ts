import type { Rank } from '@/types/shared'

export type CardKind = 'numeric' | 'action' | 'silver' | 'gold'

export type CardMeta = {
  pointValue: number
  kind: CardKind
  displayName?: string
  abilityText?: string
  iconName?: 'Eye' | 'Search' | 'ArrowLeftRight' | 'Award' | 'Trophy'
}

export const CARD_META: Record<Rank, CardMeta> = {
  'A': { pointValue: 1, kind: 'numeric' },
  '2': { pointValue: 2, kind: 'numeric' },
  '3': { pointValue: 3, kind: 'numeric' },
  '4': { pointValue: 4, kind: 'numeric' },
  '5': { pointValue: 5, kind: 'numeric' },
  '6': { pointValue: 6, kind: 'numeric' },
  '7': { pointValue: 7, kind: 'numeric' },
  '8': { pointValue: 8, kind: 'numeric' },
  '9': { pointValue: 9, kind: 'numeric' },
  '10': {
    pointValue: 10,
    kind: 'action',
    displayName: 'OLHADINHA',
    abilityText: 'Espia 1 carta SUA',
    iconName: 'Eye',
  },
  'J': {
    pointValue: 11,
    kind: 'action',
    displayName: 'ESPIADINHA',
    abilityText: 'Espia 1 carta de OUTRO',
    iconName: 'Search',
  },
  'Q': {
    pointValue: 12,
    kind: 'action',
    displayName: 'TROCA',
    abilityText: 'Troca carta com outro jogador',
    iconName: 'ArrowLeftRight',
  },
  'K': {
    pointValue: -3,
    kind: 'silver',
    displayName: 'PRATA',
    abilityText: 'Vale −3 pontos',
    iconName: 'Award',
  },
  'JOKER': {
    pointValue: -6,
    kind: 'gold',
    displayName: 'OURO',
    abilityText: 'Vale −6 pontos',
    iconName: 'Trophy',
  },
}

export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`
}
