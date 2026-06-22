'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/lib/ui-store'

export function ConfirmHost() {
  const pending = useUIStore(s => s.pendingConfirm)
  const resolve = useUIStore(s => s.resolveConfirm)

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-confirm bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            className="bg-bate-paper rounded-3xl p-6 max-w-sm w-full border-[4px] border-bate-ink shadow-hard-lg text-center"
          >
            <p className="font-display text-sm sm:text-base text-bate-ink mb-5 leading-snug">{pending.question}</p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => resolve(false)}
                className="px-5 py-2 rounded-2xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm font-display text-bate-ink hover:bg-bate-cream active:scale-95 transition-transform"
              >
                NÃO
              </button>
              <button
                type="button"
                onClick={() => resolve(true)}
                className="px-5 py-2 rounded-2xl bg-bate-red border-[3px] border-bate-ink shadow-hard-sm font-display text-bate-paper hover:scale-105 active:scale-95 transition-transform"
              >
                SIM
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
