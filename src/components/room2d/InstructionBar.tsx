'use client'

import { AnimatePresence, motion } from 'framer-motion'

export function InstructionBar({ text }: { text: string | null }) {
  return (
    <div className="fixed bottom-[10.5rem] sm:bottom-32 left-1/2 -translate-x-1/2 z-40 pointer-events-none max-w-[calc(100vw-1rem)] sm:max-w-[420px]">
      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-bate-paper px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-bate-ink font-display text-[11px] sm:text-xs shadow-hard border-[2px] sm:border-[3px] border-bate-ink text-center whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
