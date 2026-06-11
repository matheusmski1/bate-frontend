'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { getVolumeNow, setVolume } from '@/lib/sounds'

const DEFAULT_VOL = 0.5

export function MuteToggle() {
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    setMuted(getVolumeNow() === 0)
  }, [])

  function toggle() {
    const nextMuted = !muted
    setVolume(nextMuted ? 0 : DEFAULT_VOL)
    setMuted(nextMuted)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Ativar som' : 'Desativar som'}
      title={muted ? 'Ativar som' : 'Desativar som'}
      className="w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold hover:scale-110 transition-[transform,background-color]"
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  )
}
