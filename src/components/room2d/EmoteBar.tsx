'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, X } from 'lucide-react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'

const EMOTES: ReadonlyArray<{ key: string; char: ReactNode; label: string }> = [
  { key: 'clap', char: '👏', label: 'Boa!' },
  { key: 'shock', char: '🤯', label: 'Que isso!' },
  { key: 'cry', char: '😭', label: 'Nooo' },
  { key: 'fire', char: '🔥', label: 'Brabo!' },
  { key: 'clock', char: <Clock size={20} strokeWidth={3} className="inline" />, label: 'Vai' },
  { key: 'brain', char: '🧠', label: 'Lembrei' },
]

const COOLDOWN_MS = 2600

export function EmoteBar({ roomId }: { roomId: string }) {
  const myId = getPlayerId()
  const [lastSentAt, setLastSentAt] = useState(0)
  const [expanded, setExpanded] = useState(false)

  function send(emote: string) {
    const now = Date.now()
    if (now - lastSentAt < COOLDOWN_MS) return
    setLastSentAt(now)
    getSocket().emit('room:emote', { roomId, playerId: myId, emote })
  }

  const onCooldown = Date.now() - lastSentAt < COOLDOWN_MS

  return (
    <div className="fixed bottom-2 right-1/2 translate-x-1/2 sm:translate-x-0 sm:bottom-6 sm:right-4 z-hud">
      <div className="hidden sm:block">
        {!expanded ? (
          <motion.button
            type="button"
            onClick={() => setExpanded(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl border-[3px] border-bate-ink bg-bate-paper/80 backdrop-blur shadow-hard-sm flex items-center justify-center text-xl cursor-pointer"
            title="Emojis"
          >
            😀
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col gap-1.5 bg-bate-paper/80 backdrop-blur p-2 rounded-2xl border-[3px] border-bate-ink shadow-hard-sm"
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="w-10 h-10 rounded-xl border-[2px] border-bate-ink bg-bate-cream flex items-center justify-center text-sm text-bate-ink/60 hover:bg-bate-paper cursor-pointer"
              title="Fechar"
            >
              <X size={16} strokeWidth={3} />
            </button>
            {EMOTES.map(e => (
              <motion.button
                key={e.key}
                type="button"
                onClick={() => send(e.key)}
                disabled={onCooldown}
                whileHover={!onCooldown ? { scale: 1.15 } : undefined}
                whileTap={!onCooldown ? { scale: 0.9 } : undefined}
                title={e.label}
                className={`w-10 h-10 rounded-xl border-[2px] border-bate-ink bg-bate-cream flex items-center justify-center text-xl ${onCooldown ? 'opacity-40 cursor-not-allowed' : 'hover:bg-bate-gold cursor-pointer'}`}
              >
                {e.char}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
      <div className="sm:hidden">
        {!expanded ? (
          <motion.button
            type="button"
            onClick={() => setExpanded(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl border-[3px] border-bate-ink bg-bate-paper/80 backdrop-blur shadow-hard-sm flex items-center justify-center text-xl cursor-pointer"
            title="Emojis"
          >
            😀
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-row gap-1 bg-bate-paper/80 backdrop-blur p-1.5 rounded-2xl border-[3px] border-bate-ink shadow-hard-sm"
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="w-8 h-8 rounded-lg border-[2px] border-bate-ink bg-bate-cream flex items-center justify-center text-sm text-bate-ink/60 hover:bg-bate-paper cursor-pointer"
              title="Fechar"
            >
              <X size={14} strokeWidth={3} />
            </button>
            {EMOTES.map(e => (
              <motion.button
                key={e.key}
                type="button"
                onClick={() => send(e.key)}
                disabled={onCooldown}
                whileHover={!onCooldown ? { scale: 1.15 } : undefined}
                whileTap={!onCooldown ? { scale: 0.9 } : undefined}
                title={e.label}
                className={`w-8 h-8 rounded-lg border-[2px] border-bate-ink bg-bate-cream flex items-center justify-center text-base ${onCooldown ? 'opacity-40 cursor-not-allowed' : 'hover:bg-bate-gold cursor-pointer'}`}
              >
                {e.char}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
