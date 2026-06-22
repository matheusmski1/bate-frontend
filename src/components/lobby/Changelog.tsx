'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CHANGELOG } from '@/lib/changelog'

export function Changelog({
  open,
  onClose,
  onOpen,
}: {
  open: boolean
  onClose: () => void
  onOpen: () => void
}) {
  useEffect(() => {
    if (open) onOpen()
  }, [open, onOpen])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-modal bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onClick={e => e.stopPropagation()}
            className="bg-bate-paper rounded-3xl p-6 max-w-md w-full border-[4px] border-bate-ink shadow-hard-lg relative"
          >
            <button
              type="button"
              onClick={onClose}
              title="Fechar"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm flex items-center justify-center hover:bg-bate-cream"
            >
              <X size={16} strokeWidth={3} />
            </button>

            <h2 className="font-display text-2xl text-bate-red text-center mb-5 pt-2">
              NOVIDADES
            </h2>

            {CHANGELOG.length === 0 ? (
              <p className="font-body text-sm text-bate-ink/70 text-center py-6">
                Sem novidades por aqui ainda.
              </p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
                {CHANGELOG.map(entry => (
                  <div
                    key={entry.id}
                    className="bg-bate-cream border-[3px] border-bate-ink shadow-hard-sm rounded-xl p-4"
                  >
                    <div className="font-display text-sm text-bate-ink/60 mb-2">
                      {entry.date}
                    </div>
                    <ul className="space-y-1">
                      {entry.items.map((item, i) => (
                        <li
                          key={`${entry.id}-${i}`}
                          className="font-body text-sm text-bate-ink leading-snug flex gap-2"
                        >
                          <span className="text-bate-red font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
