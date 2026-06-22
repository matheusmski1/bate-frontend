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
  '10': { pointValue: 10, kind: 'action', displayName: 'OLHADINHA', abilityText: 'Espia 1 carta SUA', iconName: 'Eye' },
  'J': { pointValue: 11, kind: 'action', displayName: 'ESPIADINHA', abilityText: 'Espia 1 carta de OUTRO', iconName: 'Search' },
  'Q': { pointValue: 12, kind: 'action', displayName: 'TROCA', abilityText: 'Troca carta com outro jogador', iconName: 'ArrowLeftRight' },
  'K': { pointValue: -3, kind: 'silver', displayName: 'PRATA', abilityText: 'Vale −3 pontos', iconName: 'Award' },
  'JOKER': { pointValue: -6, kind: 'gold', displayName: 'OURO', abilityText: 'Vale −6 pontos', iconName: 'Trophy' },
}

const DEFAULT_RANK_FILE: Record<Rank, string> = {
  'A': 'batinho-as',
  '2': 'batinho-2',
  '3': 'batinho-3',
  '4': 'batinho-4',
  '5': 'batinho-5',
  '6': 'batinho-6',
  '7': 'batinho-7',
  '8': 'batinho-8',
  '9': 'batinho-9',
  '10': 'batinho-olhadinha',
  'J': 'batinho-espiadinha',
  'Q': 'batinho-troca',
  'K': 'batinho-k',
  'JOKER': 'batinho-joker',
}

const RANK_FILE_BY_DECK: Record<Rank, string> = {
  'A': 'as', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  '10': '10', 'J': 'j', 'Q': 'q', 'K': 'k', 'JOKER': 'joker',
}

export function getCardImage(rank: Rank, deckId: string | null | undefined = 'default'): string {
  const id = deckId || 'default'
  if (id === 'default') return `/cards/${DEFAULT_RANK_FILE[rank]}.webp`
  return `/cards/${id}/${RANK_FILE_BY_DECK[rank]}.webp`
}

export function getCardBack(deckId: string | null | undefined = 'default'): string {
  const id = deckId || 'default'
  if (id === 'default') return '/cards/back.webp?v=3'
  return `/cards/${id}/back.webp`
}

export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`
}
