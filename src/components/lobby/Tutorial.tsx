'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { MASCOT } from '@/lib/mascot'

type Step = {
  title: string
  body: string
  mascot: string
}

const STEPS: Step[] = [
  {
    title: 'Bem-vindo ao Batinho!',
    body: 'No Batinho cada um recebe 4 cartas viradas. Memorize 2 logo no início — o resto é dedução pura.',
    mascot: MASCOT.feliz,
  },
  {
    title: 'Sua vez: comprar',
    body: 'Na sua vez, clique no baralho pra comprar uma carta. Aí decide: usar (se tiver ação), trocar com uma sua, ou descartar.',
    mascot: MASCOT.lupa,
  },
  {
    title: 'Cortar (snap)',
    body: 'Sabe o valor de uma carta sua e a do descarte é igual? CORTA! Clica nela e ela vai pro descarte. Errou? Penalidade de +1 carta.',
    mascot: MASCOT.assustado,
  },
  {
    title: 'Cartas de ação',
    body: 'Q troca cartas, J espia adversário, 10 espia uma sua. Use bem — pode virar o jogo na última volta.',
    mascot: MASCOT.confuso,
  },
  {
    title: 'Chamar BATE',
    body: 'Achou que tem o menor placar? Aperta BATE. Cada outro player joga 1 vez, vira as cartas, conta os pontos. Menor placar leva!',
    mascot: MASCOT.bate,
  },
  {
    title: 'Bora?',
    body: 'Menor pontuação total leva a partida. Cria uma sala ou entra numa aberta. Boa sorte!',
    mascot: MASCOT.trofeu,
  },
]

const STORAGE_KEY = 'bate:tutorial-seen'

export function hasSeenTutorial(): boolean {
  if (typeof window === 'undefined') return true
  return window.localStorage.getItem(STORAGE_KEY) === '1'
}

export function markTutorialSeen(): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, '1')
}

export function Tutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]!

  function close() {
    markTutorialSeen()
    setStep(0)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-modal bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
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
              onClick={close}
              title="Pular tutorial"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm flex items-center justify-center hover:bg-bate-cream"
            >
              <X size={16} strokeWidth={3} />
            </button>
            <motion.div
              key={step}
              initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="w-36 h-36 mx-auto mb-3 flex items-center justify-center bg-bate-cream rounded-full border-[3px] border-bate-ink shadow-hard-sm overflow-hidden"
            >
              <img
                src={current.mascot}
                alt=""
                className="w-full h-full object-contain select-none p-2"
                draggable={false}
              />
            </motion.div>
            <h2 className="font-display text-xl sm:text-2xl text-bate-red text-center mb-2">{current.title}</h2>
            <p className="font-body text-sm sm:text-base text-bate-ink/85 text-center leading-snug mb-5 min-h-[60px]">{current.body}</p>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="w-10 h-10 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-bate-cream"
              >
                <ChevronLeft size={16} strokeWidth={3} />
              </button>
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === step ? 'bg-bate-red' : 'bg-bate-ink/25'}`}
                  />
                ))}
              </div>
              {isLast ? (
                <button
                  type="button"
                  onClick={close}
                  className="px-4 h-10 rounded-full bg-bate-red text-bate-paper font-display text-sm border-[3px] border-bate-ink shadow-hard-sm hover:scale-105 transition-transform"
                >
                  BORA
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
                  className="w-10 h-10 rounded-full bg-bate-gold border-[2px] border-bate-ink shadow-hard-sm flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
