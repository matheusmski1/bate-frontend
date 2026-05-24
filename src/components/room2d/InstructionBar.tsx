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
            className="bg-cabo-bg/90 backdrop-blur px-6 py-3 rounded-2xl text-cabo-gold font-bold text-sm shadow-2xl border border-cabo-purple/30 whitespace-nowrap"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
