'use client'

import { AnimatePresence, motion } from 'framer-motion'

export function InstructionBar({ text }: { text: string | null }) {
  return (
    <>
      {/* Mobile: entre oponente e mesa */}
      <div className="sm:hidden absolute top-[30%] left-4 right-4 z-30 pointer-events-none">
        <AnimatePresence>
          {text && (
            <motion.div
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-bate-paper/90 backdrop-blur-sm px-2.5 py-1.5 rounded-xl text-bate-ink font-display text-[10px] leading-tight text-center shadow-hard-sm border-[2px] border-bate-ink"
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Desktop: canto inferior esquerdo */}
      <div className="hidden sm:block fixed sm:bottom-4 sm:left-[7.5rem] z-30 pointer-events-none sm:max-w-[360px]">
        <AnimatePresence>
          {text && (
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-bate-paper/90 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-bate-ink font-display text-[10px] sm:text-xs shadow-hard-sm border-[2px] border-bate-ink truncate"
            >
              {text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
