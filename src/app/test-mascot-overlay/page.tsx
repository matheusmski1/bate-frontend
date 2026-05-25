'use client'

import { useEffect, useRef, useState } from 'react'
import { createTimeline } from 'animejs'

type Phase = 'idle' | 'running'

const FELIZ = '/batinho/batinho-feliz.webp'
const LUPA = '/batinho/batinho-lupa.webp'
const ESPIADINHA = '/batinho/batinho-espiadinha.webp'
const TROCA = '/batinho/batinho-troca-de-cartas.webp'
const ASSUSTADO = '/batinho/batinho-assustado.webp'
const TEMPO = '/batinho/batinho-tempo-acabando.webp'

const ASPECTS: Record<string, number> = {
  [FELIZ]: 720 / 402,
  [LUPA]: 720 / 402,
  [ESPIADINHA]: 1024 / 572,
  [TROCA]: 1024 / 572,
  [ASSUSTADO]: 720 / 402,
  [TEMPO]: 720 / 402,
}

function boxFor(width: number, assets: string[]): { width: number; height: number } {
  const minAspect = Math.min(...assets.map(a => ASPECTS[a] ?? 720 / 402))
  return { width, height: Math.round(width / minAspect) }
}

export default function TestMascotOverlay() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [logs, setLogs] = useState<string[]>([])
  const [respectReducedMotion, setRespectReducedMotion] = useState(false)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const discardRef = useRef<HTMLDivElement | null>(null)
  const cardARef = useRef<HTMLDivElement | null>(null)
  const cardBRef = useRef<HTMLDivElement | null>(null)
  const cardCRef = useRef<HTMLDivElement | null>(null)
  const oppNameRef = useRef<HTMLDivElement | null>(null)
  const tempoCleanupRef = useRef<(() => void) | null>(null)

  const log = (msg: string) =>
    setLogs(prev => [...prev.slice(-12), `${new Date().toISOString().slice(11, 23)} ${msg}`])

  function isReduced() {
    return respectReducedMotion && typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function ensureFree(label: string): boolean {
    if (phase === 'running') {
      log(`SKIP ${label} — animação já rodando`)
      return false
    }
    return true
  }

  function makeMascot(src: string, x: number, y: number, width: number, height: number) {
    const wrap = document.createElement('div')
    wrap.style.position = 'fixed'
    wrap.style.left = `${x}px`
    wrap.style.top = `${y}px`
    wrap.style.width = `${width}px`
    wrap.style.height = `${height}px`
    wrap.style.pointerEvents = 'none'
    wrap.style.zIndex = '60'
    wrap.style.willChange = 'transform, opacity'
    wrap.style.transformOrigin = 'center'
    wrap.style.opacity = '0'

    const img = document.createElement('img')
    img.src = src
    img.alt = ''
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'contain'
    img.style.objectPosition = 'center bottom'
    img.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))'

    wrap.appendChild(img)
    return { wrap, img, height }
  }

  // ---------- PEEK (olhadinha/espiadinha): descarte → carta → examine → exit ----------
  function runPeek(target: React.RefObject<HTMLDivElement | null>, arrivalAsset: string, label: string) {
    if (!ensureFree(label)) return
    const overlay = overlayRef.current
    const from = discardRef.current?.getBoundingClientRect()
    const to = target.current?.getBoundingClientRect()
    if (!overlay || !from || !to) { log(`SKIP ${label} — refs ausentes`); return }
    setPhase('running')
    log(`▶ ${label}`)

    if (isReduced()) {
      setTimeout(() => log('✓ onArrived (skip)'), 50)
      setTimeout(() => { setPhase('idle'); log('✓ onComplete (skip)') }, 100)
      return
    }

    const box = boxFor(140, [FELIZ, arrivalAsset])
    const { wrap, img } = makeMascot(FELIZ, 0, 0, box.width, box.height)
    const fromX = from.left + from.width / 2 - box.width / 2
    const fromY = from.top + from.height / 2 - box.height / 2
    const toX = to.left + to.width / 2 - box.width / 2
    const toY = to.top - box.height * 0.85
    wrap.style.left = `${fromX}px`
    wrap.style.top = `${fromY}px`
    overlay.appendChild(wrap)

    const dx = toX - fromX
    const dy = toY - fromY
    const midY = -Math.abs(dx) * 0.18 - 30

    const cleanup = () => { try { overlay.removeChild(wrap) } catch {}; setPhase('idle') }

    try {
      const tl = createTimeline({ defaults: { ease: 'outQuad' }, onComplete: () => { cleanup(); log('✓ onComplete') } })
      tl.add(wrap, { opacity: [0, 1], scale: [0, 1], rotate: [-18, 0], duration: 220, ease: 'outBack' })
      tl.add(wrap, { translateX: [0, dx * 0.5, dx], translateY: [0, midY + dy * 0.5, dy], rotate: [0, 6, 0], duration: 580, ease: 'inOutQuad' })
      tl.call(() => { img.src = arrivalAsset; log(`frame → ${arrivalAsset.split('/').pop()}`) })
      tl.add(wrap, { translateX: dx, translateY: [dy, dy - 14, dy], scale: [1, 1.22, 1.08], rotate: [0, -14, 6], duration: 280, ease: 'outBack', onComplete: () => log('✓ onArrived') })
      tl.add(wrap, { translateX: [dx, dx + 4, dx - 3, dx], translateY: dy, scale: 1.08, rotate: [6, -3, 3, 0], duration: 260, ease: 'inOutSine' })
      tl.add(wrap, { translateX: dx, translateY: dy, scale: [1.08, 0], opacity: [1, 0], rotate: [0, -15], duration: 280, ease: 'inQuad' })
    } catch (err) {
      log(`ERR: ${err instanceof Error ? err.message : String(err)}`)
      cleanup()
    }
  }

  // ---------- SWAP: descarte → minha carta (pickup) → carta oponente (drop) → exit ----------
  function runSwap(myCard: React.RefObject<HTMLDivElement | null>, oppCard: React.RefObject<HTMLDivElement | null>, label: string) {
    if (!ensureFree(label)) return
    const overlay = overlayRef.current
    const from = discardRef.current?.getBoundingClientRect()
    const mine = myCard.current?.getBoundingClientRect()
    const opp = oppCard.current?.getBoundingClientRect()
    if (!overlay || !from || !mine || !opp) { log(`SKIP ${label} — refs ausentes`); return }
    setPhase('running')
    log(`▶ ${label}`)

    if (isReduced()) {
      setTimeout(() => { setPhase('idle'); log('✓ onComplete (skip)') }, 100)
      return
    }

    const box = boxFor(140, [FELIZ, TROCA])
    const { wrap, img } = makeMascot(FELIZ, 0, 0, box.width, box.height)
    const fromX = from.left + from.width / 2 - box.width / 2
    const fromY = from.top + from.height / 2 - box.height / 2
    const mineX = mine.left + mine.width / 2 - box.width / 2
    const mineY = mine.top - box.height * 0.85
    const oppX = opp.left + opp.width / 2 - box.width / 2
    const oppY = opp.top - box.height * 0.85
    wrap.style.left = `${fromX}px`
    wrap.style.top = `${fromY}px`
    overlay.appendChild(wrap)

    const dxA = mineX - fromX
    const dyA = mineY - fromY
    const dxB = oppX - fromX
    const dyB = oppY - fromY
    const midYA = -Math.abs(dxA) * 0.16 - 20
    const midYB = -Math.abs(dxB - dxA) * 0.16 - 20

    const cleanup = () => { try { overlay.removeChild(wrap) } catch {}; setPhase('idle') }

    try {
      const tl = createTimeline({ defaults: { ease: 'outQuad' }, onComplete: () => { cleanup(); log('✓ onComplete') } })
      // pop out
      tl.add(wrap, { opacity: [0, 1], scale: [0, 1], rotate: [-18, 0], duration: 220, ease: 'outBack' })
      // leg 1: descarte → minha carta
      tl.add(wrap, { translateX: [0, dxA * 0.5, dxA], translateY: [0, midYA + dyA * 0.5, dyA], rotate: [0, 5, 0], duration: 480, ease: 'inOutQuad' })
      // swap pra "troca" e pickup
      tl.call(() => { img.src = TROCA; log('frame → troca (pickup)') })
      tl.add(wrap, { translateX: dxA, translateY: [dyA, dyA - 10, dyA], scale: [1, 1.15, 1.05], rotate: [0, -8, 0], duration: 260, ease: 'outBack' })
      // leg 2: minha carta → oponente carta (mascote carrega)
      tl.add(wrap, { translateX: [dxA, (dxA + dxB) / 2, dxB], translateY: [dyA, dyA + midYB, dyB], rotate: [0, 4, 0], duration: 560, ease: 'inOutQuad' })
      // drop
      tl.add(wrap, { translateX: dxB, translateY: [dyB, dyB - 8, dyB], scale: [1.05, 1.18, 1.05], rotate: [0, 8, 0], duration: 240, ease: 'outBack', onComplete: () => log('✓ onSwapped') })
      // exit
      tl.add(wrap, { translateX: dxB, translateY: dyB, scale: [1.05, 0], opacity: [1, 0], rotate: [0, 15], duration: 260, ease: 'inQuad' })
    } catch (err) {
      log(`ERR: ${err instanceof Error ? err.message : String(err)}`)
      cleanup()
    }
  }

  // ---------- POP ON CARD: snap acertou / errou (sem trajetória, só pop in/out) ----------
  function runPopOnCard(target: React.RefObject<HTMLDivElement | null>, asset: string, label: string, opts?: { shake?: boolean }) {
    if (!ensureFree(label)) return
    const overlay = overlayRef.current
    const to = target.current?.getBoundingClientRect()
    if (!overlay || !to) { log(`SKIP ${label} — refs ausentes`); return }
    setPhase('running')
    log(`▶ ${label}`)

    if (isReduced()) {
      setTimeout(() => { setPhase('idle'); log('✓ onComplete (skip)') }, 100)
      return
    }

    const box = boxFor(130, [asset])
    const { wrap } = makeMascot(asset, 0, 0, box.width, box.height)
    const x = to.left + to.width / 2 - box.width / 2
    const y = to.top - box.height * 0.65
    wrap.style.left = `${x}px`
    wrap.style.top = `${y}px`
    overlay.appendChild(wrap)

    const cleanup = () => { try { overlay.removeChild(wrap) } catch {}; setPhase('idle') }

    try {
      const tl = createTimeline({ defaults: { ease: 'outQuad' }, onComplete: () => { cleanup(); log('✓ onComplete') } })
      // pop in
      tl.add(wrap, { opacity: [0, 1], scale: [0, 1.25, 1.05], rotate: opts?.shake ? [-12, 8, -4] : [-18, 8, 0], duration: 320, ease: 'outBack' })
      // shake (if errou) ou hold (se acertou)
      if (opts?.shake) {
        tl.add(wrap, { translateX: [0, -8, 7, -5, 4, 0], translateY: [0, 2, -2, 1, 0], rotate: [-4, 5, -3, 2, 0], duration: 420, ease: 'inOutSine' })
      } else {
        tl.add(wrap, { scale: [1.05, 1.12, 1.05], rotate: [0, 4, -3, 0], duration: 380, ease: 'inOutSine' })
      }
      // hold
      tl.add(wrap, { scale: 1.05, duration: 250 })
      // exit
      tl.add(wrap, { scale: [1.05, 0], opacity: [1, 0], translateY: [0, -10], duration: 240, ease: 'inQuad' })
    } catch (err) {
      log(`ERR: ${err instanceof Error ? err.message : String(err)}`)
      cleanup()
    }
  }

  // ---------- ATTACH LOOP: tempo acabando flutua no avatar ----------
  function startTempoAcabando(target: React.RefObject<HTMLDivElement | null>) {
    if (tempoCleanupRef.current) { log('SKIP tempo — já tem ativo'); return }
    const overlay = overlayRef.current
    const rect = target.current?.getBoundingClientRect()
    if (!overlay || !rect) { log('SKIP tempo — refs ausentes'); return }
    log('▶ tempo acabando ATTACH')

    const box = boxFor(110, [TEMPO])
    const { wrap } = makeMascot(TEMPO, 0, 0, box.width, box.height)
    const x = rect.right - box.width * 0.3
    const y = rect.top - box.height * 0.6
    wrap.style.left = `${x}px`
    wrap.style.top = `${y}px`
    overlay.appendChild(wrap)

    let tl: { pause: () => void } | null = null

    try {
      // entry
      const entry = createTimeline({
        onComplete: () => {
          // loop bobbing
          tl = createTimeline({ loop: true, defaults: { ease: 'inOutSine' } })
          ;(tl as ReturnType<typeof createTimeline>)
            .add(wrap, { translateY: [0, -10, 0], rotate: [-6, 6, -6], duration: 1200 })
        },
      })
      entry.add(wrap, { opacity: [0, 1], scale: [0, 1.1, 1], rotate: [-30, 8, 0], duration: 360, ease: 'outBack' })

      tempoCleanupRef.current = () => {
        try { entry.pause() } catch {}
        try { tl?.pause() } catch {}
        try { overlay.removeChild(wrap) } catch {}
        tempoCleanupRef.current = null
        log('✓ tempo DETACH')
      }
    } catch (err) {
      log(`ERR tempo: ${err instanceof Error ? err.message : String(err)}`)
      try { overlay.removeChild(wrap) } catch {}
    }
  }

  function stopTempoAcabando() {
    if (!tempoCleanupRef.current) { log('SKIP tempo — nada pra parar'); return }
    tempoCleanupRef.current()
  }

  useEffect(() => {
    log('mount')
    return () => { tempoCleanupRef.current?.() }
  }, [])

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
          <button type="button" onClick={() => runPopOnCard(cardBRef, FELIZ, 'snap OK B')} className={btnGold}>OK B</button>
          <button type="button" onClick={() => runPopOnCard(cardARef, ASSUSTADO, 'snap ERR A', { shake: true })} className={btnRed}>ERR A</button>
        </div>

        <div className="flex gap-1 items-center px-2 py-1 bg-bate-paper border-2 border-bate-ink rounded-xl">
          <span className="text-[10px] font-display text-bate-ink/60 px-1">SWAP</span>
          <button type="button" onClick={() => runSwap(cardARef, cardCRef, 'swap A ↔ C')} className={btn}>A ↔ C</button>
          <button type="button" onClick={() => runSwap(cardBRef, cardCRef, 'swap B ↔ C')} className={btn}>B ↔ C</button>
        </div>

        <div className="flex gap-1 items-center px-2 py-1 bg-bate-paper border-2 border-bate-ink rounded-xl">
          <span className="text-[10px] font-display text-bate-ink/60 px-1">TEMPO</span>
          <button type="button" onClick={() => startTempoAcabando(oppNameRef)} className={btn}>start em oponente</button>
          <button type="button" onClick={stopTempoAcabando} className={btn}>stop</button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs font-display text-bate-ink">
        <input type="checkbox" checked={respectReducedMotion} onChange={e => setRespectReducedMotion(e.target.checked)} />
        respeitar <code>prefers-reduced-motion</code>
      </label>

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
        className="fixed inset-0 pointer-events-none z-50"
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
