const STORAGE_KEY = 'bate:player-id'
const NAME_KEY = 'bate:player-name'
const LEGACY_STORAGE_KEY = 'cabo:player-id'
const LEGACY_NAME_KEY = 'cabo:player-name'

function migrateLegacyKey(legacyKey: string, newKey: string): void {
  if (typeof window === 'undefined') return
  const legacy = window.localStorage.getItem(legacyKey)
  if (!legacy) return
  if (!window.localStorage.getItem(newKey)) {
    window.localStorage.setItem(newKey, legacy)
  }
  window.localStorage.removeItem(legacyKey)
}

export function getPlayerId(): string {
  if (typeof window === 'undefined') return ''
  migrateLegacyKey(LEGACY_STORAGE_KEY, STORAGE_KEY)
  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) return existing
  return ''
}

export function getStoredName(): string {
  if (typeof window === 'undefined') return ''
  migrateLegacyKey(LEGACY_NAME_KEY, NAME_KEY)
  return window.localStorage.getItem(NAME_KEY) ?? ''
}

export function setStoredName(name: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(NAME_KEY, name)
}
