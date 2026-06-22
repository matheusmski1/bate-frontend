'use client'
import { useEffect, useState } from 'react'
import type { RedactedState } from '@/types/shared'

export function FinalSnapBanner({ state }: { state: RedactedState }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(t)
  }, [])
  if (state.phase !== 'final-snap' || !state.snapWindow) return null
  const remaining = Math.max(0, state.snapWindow.openedAt + state.snapWindow.durationMs - now)
  const secs = (remaining / 1000).toFixed(1)
  return (
    <div className="fixed top-0 left-0 right-0 z-banner bg-bate-red text-bate-paper text-center py-1.5 text-xs sm:text-sm font-display tracking-wider shadow-hard-sm">
      ⚡ ÚLTIMO CORTE! {secs}s
    </div>
  )
}
