'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createController,
  boxFor,
  FELIZ,
  LUPA,
  ESPIADINHA,
  TROCA,
  ASSUSTADO,
  TEMPO,
} from '@/lib/mascot-overlay'

export default function TestMascotOverlay() {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const controller = useMemo(() => createController(), [])
  const [logs, setLogs] = useState<string[]>([])
  const discardRef = useRef<HTMLDivElement>(null)
  const cardARef = useRef<HTMLDivElement>(null)
  const cardBRef = useRef<HTMLDivElement>(null)
  const cardCRef = useRef<HTMLDivElement>(null)
  const oppNameRef = useRef<HTMLDivElement>(null)
  const tempoCancelRef = useRef<{ cancel: () => void } | null>(null)

  const log = (msg: string) =>
    setLogs(prev => [...prev.slice(-12), `${new Date().toISOString().slice(11, 23)} ${msg}`])

  useEffect(() => {
    log('mount')
    return () => { tempoCancelRef.current?.cancel() }
  }, [])

  function runPeek(target: React.RefObject<HTMLDivElement | null>, arrivalAsset: string, label: string) {
    const overlay = overlayRef.current
    if (!overlay) return
    log(`▶ ${label}`)
    controller.runFlight({
      overlay,
      fromRect: discardRef.current?.getBoundingClientRect() ?? null,
      toRect: target.current?.getBoundingClientRect() ?? null,
      travelAsset: FELIZ,
      arrivalAsset,
      box: boxFor(140, [FELIZ, arrivalAsset]),
      onArrived: () => log('✓ onArrived'),
      onComplete: () => log('✓ onComplete'),
    })
  }

  function runSwap(myCard: React.RefObject<HTMLDivElement | null>, oppCard: React.RefObject<HTMLDivElement | null>, label: string) {
    const overlay = overlayRef.current
    if (!overlay) return
    log(`▶ ${label}`)
    controller.runSwapDelivery({
      overlay,
      fromRect: discardRef.current?.getBoundingClientRect() ?? null,
      midRect: myCard.current?.getBoundingClientRect() ?? null,
      toRect: oppCard.current?.getBoundingClientRect() ?? null,
      travelAsset: FELIZ,
      carryAsset: TROCA,
      box: boxFor(140, [FELIZ, TROCA]),
      onSwapped: () => log('✓ onSwapped'),
      onComplete: () => log('✓ onComplete'),
    })
  }

  function runPop(target: React.RefObject<HTMLDivElement | null>, asset: string, variant: 'success' | 'shake', label: string) {
    const overlay = overlayRef.current
    if (!overlay) return
    log(`▶ ${label}`)
    controller.popOnCard({
      overlay,
      targetRect: target.current?.getBoundingClientRect() ?? null,
      asset,
      variant,
      box: boxFor(130, [asset]),
      onComplete: () => log('✓ onComplete'),
    })
  }

  function startTempo() {
    const overlay = overlayRef.current
    if (!overlay || tempoCancelRef.current) return
    log('▶ tempo ATTACH')
    tempoCancelRef.current = controller.attachLoop({
      overlay,
      anchorRect: oppNameRef.current?.getBoundingClientRect() ?? null,
      asset: TEMPO,
      box: boxFor(110, [TEMPO]),
      position: 'top-right',
    })
  }

  function stopTempo() {
    tempoCancelRef.current?.cancel()
    tempoCancelRef.current = null
    log('✓ tempo DETACH')
  }

  const btn = 'px-3 py-2 rounded-xl font-display text-xs border-[3px] border-bate-ink shadow-hard-sm bg-bate-paper hover:bg-bate-gold whitespace-nowrap'
  const btnRed = `${btn} bg-bate-red text-bate-paper hover:bg-bate-red/90`
  const btnGold = `${btn} bg-bate-gold text-bate-ink hover:bg-bate-gold/90`

  return (
    <main className="min-h-screen bg-bate-cream p-8 flex flex-col items-center gap-4">
      <h1 className="font-display text-3xl text-bate-red">Teste — Mascot Animations (anime.js)</h1>

      <div className="flex flex-wrap gap-2 max-w-5xl justify-center">
        <div className="flex gap-1 items-center px-2 py-1 bg-bate-paper border-2 border-bate-ink rounded-xl">
          <span className="text-[10px] font-display text-bate-ink/60 px-1">PEEK</span>
          <button type="button" onClick={() => runPeek(cardARef, LUPA, 'olhadinha A')} className={btn}>olhadinha A</button>
          <button type="button" onClick={() => runPeek(cardBRef, LUPA, 'olhadinha B')} className={btn}>olhadinha B</button>
          <button type="button" onClick={() => runPeek(cardCRef, ESPIADINHA, 'espiadinha C')} className={btn}>espiadinha C</button>
        </div>

        <div className="flex gap-1 items-center px-2 py-1 bg-bate-paper border-2 border-bate-ink rounded-xl">
          <span className="text-[10px] font-display text-bate-ink/60 px-1">SNAP</span>
          <button type="button" onClick={() => runPop(cardBRef, FELIZ, 'success', 'snap OK B')} className={btnGold}>OK B</button>
          <button type="button" onClick={() => runPop(cardARef, ASSUSTADO, 'shake', 'snap ERR A')} className={btnRed}>ERR A</button>
        </div>

        <div className="flex gap-1 items-center px-2 py-1 bg-bate-paper border-2 border-bate-ink rounded-xl">
          <span className="text-[10px] font-display text-bate-ink/60 px-1">SWAP</span>
          <button type="button" onClick={() => runSwap(cardARef, cardCRef, 'swap A ↔ C')} className={btn}>A ↔ C</button>
          <button type="button" onClick={() => runSwap(cardBRef, cardCRef, 'swap B ↔ C')} className={btn}>B ↔ C</button>
        </div>

        <div className="flex gap-1 items-center px-2 py-1 bg-bate-paper border-2 border-bate-ink rounded-xl">
          <span className="text-[10px] font-display text-bate-ink/60 px-1">TEMPO</span>
          <button type="button" onClick={startTempo} className={btn}>start em oponente</button>
          <button type="button" onClick={stopTempo} className={btn}>stop</button>
        </div>
      </div>

      <div className="relative bg-bate-paper border-[3px] border-bate-ink rounded-2xl p-6 w-full max-w-4xl min-h-[520px]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div
            ref={oppNameRef}
            className="px-3 py-1 bg-bate-ink text-bate-paper text-xs font-display rounded-md"
          >
            oponente
          </div>
          <div
            ref={cardCRef}
            data-card-id="mock-card-C"
            className="w-16 h-24 bg-bate-red border-[2px] border-bate-ink rounded-md flex items-center justify-center text-bate-paper text-xs font-display"
          >
            C
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4">
          <div className="w-14 h-20 bg-bate-ink border-[2px] border-bate-ink rounded-md flex items-center justify-center text-bate-gold text-xs font-display">
            DECK
          </div>
          <div
            ref={discardRef}
            data-discard-pile
            className="w-14 h-20 bg-bate-paper border-[3px] border-dashed border-bate-red rounded-md flex items-center justify-center text-bate-red text-[10px] font-display"
          >
            DESCARTE
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="flex gap-3">
            <div
              ref={cardARef}
              data-card-id="mock-card-A"
              className="w-16 h-24 bg-bate-red border-[2px] border-bate-ink rounded-md flex items-center justify-center text-bate-paper text-xs font-display"
            >
              A
            </div>
            <div
              ref={cardBRef}
              data-card-id="mock-card-B"
              className="w-16 h-24 bg-bate-red border-[2px] border-bate-ink rounded-md flex items-center justify-center text-bate-paper text-xs font-display"
            >
              B
            </div>
          </div>
          <div className="px-3 py-1 bg-bate-ink text-bate-paper text-xs font-display rounded-md">
            eu
          </div>
        </div>
      </div>

      <div
        ref={overlayRef}
        className="fixed inset-0 pointer-events-none z-float"
        aria-hidden
      />

      <div className="w-full max-w-3xl bg-bate-paper border-[2px] border-bate-ink rounded-xl p-3 font-mono text-xs max-h-48 overflow-y-auto">
        <div className="font-display mb-1">EVENTOS:</div>
        {logs.length === 0 ? (
          <div className="text-bate-ink/60">(nenhum ainda)</div>
        ) : (
          logs.map((e, i) => <div key={i}>{e}</div>)
        )}
      </div>
    </main>
  )
}
