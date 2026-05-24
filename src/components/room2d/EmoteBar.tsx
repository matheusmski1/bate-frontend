'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'

const EMOTES = [
  { key: 'clap', char: '👏', label: 'Boa!' },
  { key: 'shock', char: '🤯', label: 'Que isso!' },
  { key: 'cry', char: '😭', label: 'Nooo' },
  { key: 'fire', char: '🔥', label: 'Brabo!' },
  { key: 'clock', char: '⏰', label: 'Vai' },
  { key: 'brain', char: '🧠', label: 'Lembrei' },
] as const

const COOLDOWN_MS = 2600

export function EmoteBar({ roomId }: { roomId: string }) {
  const myId = getPlayerId()
  const [lastSentAt, setLastSentAt] = useState(0)

  function send(emote: string) {
    const now = Date.now()
    if (now - lastSentAt < COOLDOWN_MS) return
    setLastSentAt(now)
    getSocket().emit('room:emote', { roomId, playerId: myId, emote })
  }

  const onCooldown = Date.now() - lastSentAt < COOLDOWN_MS

  return (
    <div className="fixed bottom-2 right-1/2 translate-x-1/2 sm:translate-x-0 sm:bottom-6 sm:right-4 z-40 flex flex-row sm:flex-col gap-1 sm:gap-1.5 bg-bate-paper/80 backdrop-blur p-1.5 sm:p-2 rounded-2xl border-[3px] border-bate-ink shadow-hard-sm">
      {EMOTES.map(e => (
        <motion.button
          key={e.key}
          type="button"
          onClick={() => send(e.key)}
          disabled={onCooldown}
          whileHover={!onCooldown ? { scale: 1.15 } : undefined}
          whileTap={!onCooldown ? { scale: 0.9 } : undefined}
          title={e.label}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border-[2px] border-bate-ink bg-bate-cream flex items-center justify-center text-base sm:text-xl ${onCooldown ? 'opacity-40 cursor-not-allowed' : 'hover:bg-bate-gold cursor-pointer'}`}
        >
          {e.char}
        </motion.button>
      ))}
    </div>
  )
}
