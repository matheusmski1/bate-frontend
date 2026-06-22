'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '@/lib/ui-store'

export function ToastHost() {
  const toasts = useUIStore(s => s.toasts)
  const dismiss = useUIStore(s => s.dismissToast)

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-global-toast flex flex-col gap-2 pointer-events-none max-w-[90vw]">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ y: -20, opacity: 0, scale: 0.85 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            onClick={() => dismiss(t.id)}
            className={`pointer-events-auto cursor-pointer px-4 py-2 rounded-2xl font-display text-xs sm:text-sm border-[3px] border-bate-ink shadow-hard text-bate-paper text-center select-none ${
              t.kind === 'error' ? 'bg-bate-red' : t.kind === 'success' ? 'bg-bate-green' : 'bg-bate-ink'
            }`}
          >
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
