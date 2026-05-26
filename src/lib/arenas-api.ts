const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? ''

export type ArenaView = {
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

export async function listArenas(): Promise<ArenaView[]> {
  const res = await fetch(url('/me/arenas'), { credentials: 'include' })
  if (!res.ok) throw new Error(`listArenas ${res.status}`)
  const data = (await res.json()) as { arenas: ArenaView[] }
  return data.arenas
}

export async function equipArena(arenaId: string): Promise<{ ok: true; equippedArena: string } | { ok: false; error: string }> {
  const res = await fetch(url('/me/equip-arena'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arenaId }),
  })
  const data = (await res.json()) as { ok?: true; equippedArena?: string; error?: string }
  if (data.ok && data.equippedArena) return { ok: true, equippedArena: data.equippedArena }
  return { ok: false, error: data.error ?? 'UNKNOWN' }
}
