const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? ''
const STORAGE_KEY = 'cabo:player-id'

export type GuestSession = {
  playerId: string
  kind: 'guest'
  expiresAt: number
}

let inflight: Promise<GuestSession> | null = null

function authUrl(path: string): string {
  if (!SOCKET_URL) return path
  const base = SOCKET_URL.replace(/\/$/, '')
  return `${base}${path}`
}

export async function ensureGuestSession(): Promise<GuestSession> {
  if (inflight) return inflight
  inflight = (async () => {
    const res = await fetch(authUrl('/auth/guest'), {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`auth/guest failed: ${res.status}`)
    const data = (await res.json()) as GuestSession
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, data.playerId)
    } catch { /* ignore */ }
    return data
  })()
  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export function cachedPlayerId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEY)
}
