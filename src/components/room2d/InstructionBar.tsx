'use client'

import { AnimatePresence, motion } from 'framer-motion'

export function InstructionBar({ text }: { text: string | null }) {
  return (
    <div className="fixed top-32 left-4 z-40 pointer-events-none max-w-[260px]">
      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-bate-paper px-4 py-2 rounded-2xl text-bate-ink font-display text-xs shadow-hard border-[3px] border-bate-ink"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
