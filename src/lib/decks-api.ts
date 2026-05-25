const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? ''

export type DeckView = {
  id: string
  name: string
  unlockType: 'default' | 'earned' | 'paid'
  priceCoins: number
  previewPath: string
  owned: boolean
  equipped: boolean
}

function url(path: string): string {
  if (!SOCKET_URL) return path
  return SOCKET_URL.replace(/\/$/, '') + path
}

export async function listDecks(): Promise<DeckView[]> {
  const res = await fetch(url('/me/decks'), { credentials: 'include' })
  if (!res.ok) throw new Error(`listDecks ${res.status}`)
  const data = (await res.json()) as { decks: DeckView[] }
  return data.decks
}

export async function equipDeck(deckId: string): Promise<{ ok: true; equippedDeck: string } | { ok: false; error: string }> {
  const res = await fetch(url('/me/equip-deck'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deckId }),
  })
  const data = (await res.json()) as { ok?: true; equippedDeck?: string; error?: string }
  if (data.ok && data.equippedDeck) return { ok: true, equippedDeck: data.equippedDeck }
  return { ok: false, error: data.error ?? 'UNKNOWN' }
}
