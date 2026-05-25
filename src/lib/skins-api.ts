const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? ''

export type SkinView = {
  id: string
  name: string
  unlockType: 'default' | 'earned' | 'paid'
  priceCoins: number
  imagePath: string
  owned: boolean
  equipped: boolean
}

function url(path: string): string {
  if (!SOCKET_URL) return path
  return SOCKET_URL.replace(/\/$/, '') + path
}

export async function listSkins(): Promise<SkinView[]> {
  const res = await fetch(url('/me/skins'), { credentials: 'include' })
  if (!res.ok) throw new Error(`listSkins ${res.status}`)
  const data = (await res.json()) as { skins: SkinView[] }
  return data.skins
}

export async function equipSkin(skinId: string): Promise<{ ok: true; equippedSkin: string } | { ok: false; error: string }> {
  const res = await fetch(url('/me/equip-skin'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skinId }),
  })
  const data = (await res.json()) as { ok?: true; equippedSkin?: string; error?: string }
  if (data.ok && data.equippedSkin) return { ok: true, equippedSkin: data.equippedSkin }
  return { ok: false, error: data.error ?? 'UNKNOWN' }
}
