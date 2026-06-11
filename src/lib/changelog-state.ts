'use client'

import { useCallback, useEffect, useState } from 'react'
import { CHANGELOG } from './changelog'

const STORAGE_KEY = 'bate:changelog-last-seen'

export function useUnreadChangelog(): {
  hasUnread: boolean
  markAsSeen: () => void
} {
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      setLastSeen(window.localStorage.getItem(STORAGE_KEY))
    } catch {
      setLastSeen(null)
    }
  }, [])

  const markAsSeen = useCallback(() => {
    const latest = CHANGELOG[0]?.id
    if (!latest) return
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, latest)
    } catch {}
    setLastSeen(latest)
  }, [])

  const latestId = CHANGELOG[0]?.id
  const hasUnread = Boolean(latestId) && latestId !== lastSeen

  return { hasUnread, markAsSeen }
}
