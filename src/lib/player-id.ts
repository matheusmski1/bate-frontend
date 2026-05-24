const STORAGE_KEY = 'cabo:player-id'

export function getPlayerId(): string {
  if (typeof window === 'undefined') return ''
  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) return existing
  const id = crypto.randomUUID()
  window.localStorage.setItem(STORAGE_KEY, id)
  return id
}

const NAME_KEY = 'cabo:player-name'

export function getStoredName(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(NAME_KEY) ?? ''
}

export function setStoredName(name: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NAME_KEY, name)
}
