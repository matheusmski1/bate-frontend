'use client'

import { motion, AnimatePresence } from 'framer-motion'

const EMOTE_CHAR: Record<string, string> = {
  clap: '👏', shock: '🤯', cry: '😭', fire: '🔥', clock: '⏰', brain: '🧠',
}

export function EmoteBubble({ emote, id }: { emote: string | null; id: number }) {
  return (
    <AnimatePresence>
      {emote && (
        <motion.div
          key={id}
          initial={{ opacity: 0, scale: 0.4, y: 10 }}
          animate={{ opacity: 1, scale: [0.4, 1.3, 1], y: -6 }}
          exit={{ opacity: 0, y: -30, scale: 0.7 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 bg-bate-paper border-[3px] border-bate-ink rounded-2xl shadow-hard-sm px-3 py-1 text-2xl pointer-events-none whitespace-nowrap"
        >
          {EMOTE_CHAR[emote] ?? '👍'}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
