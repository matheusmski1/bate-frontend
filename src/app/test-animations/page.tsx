'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import { Eye, Play, Pause, RotateCcw } from 'lucide-react'
import { EASE_OUT } from '@/lib/easings'
import { Card2D } from '@/components/room2d/Card2D'
import { CARD_META } from '@/lib/card-meta'
import type { Rank } from '@/types/shared'

const LOOP_INTERVAL_MS = 1700

const ACTION_CARDS: { rank: Rank; tip: string }[] = [
  { rank: '10', tip: 'olha 1 carta SUA' },
  { rank: 'J', tip: 'espia 1 carta de OUTRO' },
  { rank: 'Q', tip: 'troca carta com alguém' },
  { rank: 'K', tip: 'vale −3 pontos' },
  { rank: 'JOKER', tip: 'vale −6 pontos' },
]

const FRAMER_DEFAULT_EASE = 'easeOut'
const FLIP_DURATION = 0.5
const TRAVEL_DISTANCE = 220

function Column({ tone, label, children }: { tone: 'before' | 'after'; label: string; children: ReactNode }) {
  const accent = tone === 'before' ? 'border-bate-red' : 'border-bate-green'
  const badge = tone === 'before' ? 'bg-bate-red text-bate-paper' : 'bg-bate-green text-bate-paper'
  return (
    <div className={`flex-1 rounded-2xl border-[3px] ${accent} bg-bate-paper p-4 shadow-hard-sm`}>
      <span className={`inline-block mb-3 px-2 py-0.5 rounded-md font-display text-[11px] uppercase tracking-wide ${badge}`}>
        {label}
      </span>
      <div className="relative h-44 flex items-center justify-center overflow-hidden rounded-xl bg-bate-cream border-[2px] border-bate-ink/15">
        {children}
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="w-full max-w-3xl">
      <h2 className="font-display text-xl text-bate-ink">{title}</h2>
      <p className="font-body text-sm text-bate-ink/70 mb-3">{subtitle}</p>
      <div className="flex flex-col sm:flex-row gap-4">{children}</div>
    </section>
  )
}

function TravelBar({ replayKey, strong }: { replayKey: number; strong: boolean }) {
  return (
    <div className="relative w-[260px]">
      <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 bg-bate-ink/10 rounded-full" />
      <motion.div
        key={replayKey}
        initial={{ x: 0 }}
        animate={{ x: TRAVEL_DISTANCE }}
        transition={{ duration: 0.9, ease: strong ? EASE_OUT : FRAMER_DEFAULT_EASE }}
        className="w-10 h-10 rounded-lg bg-bate-gold border-[3px] border-bate-ink shadow-hard-sm"
      />
    </div>
  )
}

function FlipCard({ replayKey, strong, duration = FLIP_DURATION }: { replayKey: number; strong: boolean; duration?: number }) {
  return (
    <motion.div
      key={replayKey}
      initial={{ rotateY: 180 }}
      animate={{ rotateY: 0 }}
      transition={{ duration, ease: strong ? EASE_OUT : FRAMER_DEFAULT_EASE }}
      style={{ transformStyle: 'preserve-3d' }}
      className="w-20 h-28 rounded-xl border-[3px] border-bate-ink bg-bate-gold flex items-center justify-center font-display text-3xl text-bate-ink"
    >
      A
    </motion.div>
  )
}

function VictimBadge({ replayKey, fromZero }: { replayKey: number; fromZero: boolean }) {
  return (
    <motion.div
      key={replayKey}
      initial={{ scale: fromZero ? 0 : 0.3, opacity: 0 }}
      animate={{ scale: fromZero ? [0, 1.3, 1] : [0.3, 1.3, 1], opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-14 h-14 rounded-full bg-bate-gold border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink"
    >
      <Eye size={22} strokeWidth={3} />
    </motion.div>
  )
}

function BateButtonDemo({ replayKey, fromZero }: { replayKey: number; fromZero: boolean }) {
  return (
    <motion.div
      key={replayKey}
      initial={{ scale: fromZero ? 0 : 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      className="px-5 py-2.5 rounded-xl bg-bate-red text-bate-paper border-[3px] border-bate-ink shadow-hard font-display"
    >
      🎯 BATE!
    </motion.div>
  )
}

function ReducedPanel({ replayKey, respectsReduced, simulateReduced }: { replayKey: number; respectsReduced: boolean; simulateReduced: boolean }) {
  return (
    <MotionConfig reducedMotion={respectsReduced && simulateReduced ? 'always' : 'never'}>
      <motion.div
        key={replayKey}
        initial={{ scale: 0.8, y: 32, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="px-6 py-4 rounded-2xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-lg font-display text-bate-ink"
      >
        MODAL
      </motion.div>
    </MotionConfig>
  )
}

function InfoCard({ title, before, after, note }: { title: string; before: string; after: string; note: string }) {
  return (
    <section className="w-full max-w-3xl rounded-2xl border-[3px] border-bate-ink/30 bg-bate-paper p-4 shadow-hard-sm">
      <h2 className="font-display text-lg text-bate-ink mb-2">{title}</h2>
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
        <code className="flex-1 text-xs bg-bate-red/10 border border-bate-red/40 rounded-lg p-2 text-bate-red-deep break-all">{before}</code>
        <code className="flex-1 text-xs bg-bate-green/10 border border-bate-green/40 rounded-lg p-2 text-bate-green break-all">{after}</code>
      </div>
      <p className="font-body text-sm text-bate-ink/70">{note}</p>
    </section>
  )
}

function ShowcaseCell({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 w-28">
      <div className="h-32 flex items-center justify-center">{children}</div>
      <span className="font-body text-[11px] text-center text-bate-ink/70 leading-tight">{caption}</span>
    </div>
  )
}

export default function TestAnimationsPage() {
  const [run, setRun] = useState(0)
  const [simulateReduced, setSimulateReduced] = useState(true)
  const [looping, setLooping] = useState(true)
  const replay = () => setRun(r => r + 1)

  useEffect(() => {
    if (!looping) return
    const id = setInterval(() => setRun(r => r + 1), LOOP_INTERVAL_MS)
    return () => clearInterval(id)
  }, [looping])

  return (
    <main className="min-h-screen bg-bate-cream text-bate-ink flex flex-col items-center gap-8 py-10 px-4">
      <header className="w-full max-w-3xl flex flex-col gap-4">
        <h1 className="font-display text-3xl text-bate-ink">Lab de Animações — Antes / Depois</h1>
        <p className="font-body text-sm text-bate-ink/70">
          Cada bloco compara o comportamento antigo (vermelho) com o novo polido (verde). Aperta replay pra rodar de novo.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setLooping(l => !l)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-bate-gold border-[3px] border-bate-ink shadow-hard-sm font-display uppercase text-sm hover:-translate-y-0.5 hover:shadow-hard active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow]"
          >
            {looping ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {looping ? 'Loop ligado' : 'Loop desligado'}
          </button>
          <button
            type="button"
            onClick={replay}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm font-display uppercase text-xs hover:-translate-y-0.5 transition-transform"
          >
            <RotateCcw size={14} /> Replay 1x
          </button>
          <button
            type="button"
            onClick={() => setSimulateReduced(s => !s)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm font-display text-xs hover:-translate-y-0.5 transition-transform"
          >
            <RotateCcw size={14} /> reduced-motion do sistema: {simulateReduced ? 'LIGADO' : 'DESLIGADO'}
          </button>
        </div>
      </header>

      <Section title="Fase 1 — Easing" subtitle="Mesma duração (0.9s). Antes usa o ease nativo (fraco); depois a curva forte EASE_OUT — dispara mais rápido e assenta com intenção.">
        <Column tone="before" label="Antes — easeOut nativo">
          <TravelBar replayKey={run} strong={false} />
        </Column>
        <Column tone="after" label="Depois — EASE_OUT custom">
          <TravelBar replayKey={run} strong />
        </Column>
      </Section>

      <Section title="Fase 1b — Flip da carta" subtitle="O mesmo flip 3D (rotateY) com easing fraco vs forte.">
        <Column tone="before" label="Antes — easeOut nativo">
          <FlipCard replayKey={run} strong={false} />
        </Column>
        <Column tone="after" label="Depois — EASE_OUT custom">
          <FlipCard replayKey={run} strong />
        </Column>
      </Section>

      <Section title="Fase 4 — Entrada do badge (espiada)" subtitle="Antes nasce do scale(0) — surge do nada. Depois começa visível em scale(0.3) e cresce.">
        <Column tone="before" label="Antes — scale(0)">
          <VictimBadge replayKey={run} fromZero />
        </Column>
        <Column tone="after" label="Depois — scale(0.3)">
          <VictimBadge replayKey={run} fromZero={false} />
        </Column>
      </Section>

      <Section title="Fase 4b — Botão BATE!" subtitle="Botão persistente que aparece pop do nada (errado) vs do scale(0.9) (natural).">
        <Column tone="before" label="Antes — scale(0)">
          <BateButtonDemo replayKey={run} fromZero />
        </Column>
        <Column tone="after" label="Depois — scale(0.9)">
          <BateButtonDemo replayKey={run} fromZero={false} />
        </Column>
      </Section>

      <Section title="Fase 5 — reduced-motion" subtitle="Com a preferência LIGADA: antes ignora e desliza/escala mesmo assim; depois respeita e só faz fade (sem transform).">
        <Column tone="before" label="Antes — ignora a preferência">
          <ReducedPanel replayKey={run} respectsReduced={false} simulateReduced={simulateReduced} />
        </Column>
        <Column tone="after" label="Depois — respeita (MotionConfig)">
          <ReducedPanel replayKey={run} respectsReduced simulateReduced={simulateReduced} />
        </Column>
      </Section>

      <Section title="Fase 6 — Flip mais rápido" subtitle="Mesma curva, só a duração: 0.45s (antes) vs 0.30s (depois). Cartas viram dezenas de vezes por partida — mais curto parece mais responsivo.">
        <Column tone="before" label="Antes — 0.45s">
          <FlipCard replayKey={run} strong duration={0.45} />
        </Column>
        <Column tone="after" label="Depois — 0.30s">
          <FlipCard replayKey={run} strong duration={0.3} />
        </Column>
      </Section>

      <section className="w-full max-w-3xl">
        <h2 className="font-display text-xl text-bate-ink">Ações das cartas</h2>
        <p className="font-body text-sm text-bate-ink/70 mb-3">As cartas especiais e o que cada uma faz (Card2D real).</p>
        <div className="flex flex-wrap gap-4 justify-center bg-bate-paper border-[3px] border-bate-ink/30 rounded-2xl p-5 shadow-hard-sm">
          {ACTION_CARDS.map(a => (
            <ShowcaseCell key={a.rank} caption={`${CARD_META[a.rank].displayName} · ${a.tip}`}>
              <Card2D card={{ id: a.rank, rank: a.rank, suit: null }} size="md" />
            </ShowcaseCell>
          ))}
        </div>
      </section>

      <section className="w-full max-w-3xl">
        <h2 className="font-display text-xl text-bate-ink">Efeitos na carta</h2>
        <p className="font-body text-sm text-bate-ink/70 mb-3">Os destaques visuais durante a jogada (em loop).</p>
        <div className="flex flex-wrap gap-5 justify-center bg-bate-paper border-[3px] border-bate-ink/30 rounded-2xl p-6 shadow-hard-sm">
          <ShowcaseCell caption="Vira (flip)">
            <Card2D card={{ id: 'flip', hidden: true }} tempRevealedAs={run % 2 === 0 ? { rank: 'J', suit: null } : null} size="md" />
          </ShowcaseCell>
          <ShowcaseCell caption="Hover / clique">
            <Card2D card={{ id: 'hover', rank: '7', suit: null }} size="md" onClick={() => {}} />
          </ShowcaseCell>
          <ShowcaseCell caption="Espiada (peek)">
            <Card2D key={`peek-${run}`} card={{ id: 'peek', rank: '10', suit: null }} victimEffect="peeked" size="md" />
          </ShowcaseCell>
          <ShowcaseCell caption="Troca (swap)">
            <Card2D key={`swap-${run}`} card={{ id: 'swap', rank: 'Q', suit: null }} victimEffect="swapped" size="md" />
          </ShowcaseCell>
          <ShowcaseCell caption="Corta (snap)">
            <Card2D card={{ id: 'snap', hidden: true }} snapHint size="md" />
          </ShowcaseCell>
          <ShowcaseCell caption="Destacada">
            <Card2D key={`hl-${run}`} card={{ id: 'hl', rank: 'JOKER', suit: null }} highlighted size="md" />
          </ShowcaseCell>
        </div>
      </section>

      <InfoCard
        title="Fase 2 — transition-all → propriedades explícitas"
        before="transition-all duration-200"
        after="transition-[transform,box-shadow] duration-200"
        note="Visualmente igual no hover — o ganho é não animar props de layout caras e ter controle. Passa o mouse no botão 'Replay tudo' acima (ele já usa a versão nova)."
      />

      <InfoCard
        title="Fase 3 — gate de hover pro touch"
        before=".hover\:scale-110:hover { ... }"
        after="@media (hover:hover) and (pointer:fine) { .hover\:scale-110:hover { ... } }"
        note="Só visível no celular: antes o hover grudava no tap; depois não dispara em telas de toque. Abre esta página no DevTools em modo mobile pra sentir."
      />
    </main>
  )
}
