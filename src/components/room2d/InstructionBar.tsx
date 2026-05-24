'use client'

import { AnimatePresence, motion } from 'framer-motion'

export function InstructionBar({ text }: { text: string | null }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-bate-paper px-6 py-3 rounded-2xl text-bate-ink font-display text-sm shadow-hard border-[3px] border-bate-ink whitespace-nowrap"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
