'use client'

import { useEffect, useRef, useState } from 'react'

// Test page que renderiza o /test-layout dentro de um iframe com dimensões
// de mobile. Iframe tem viewport próprio, então as media queries `sm:` do
// Tailwind respondem como num device real. Controles ficam DESSE lado
// (sidebar) e comunicam com o iframe via postMessage.

const DEVICES = [
  { id: 'iphone-mini', name: 'iPhone 13 mini', w: 375, h: 812 },
  { id: 'iphone-14', name: 'iPhone 14 Pro', w: 393, h: 852 },
  { id: 'pixel', name: 'Pixel 5', w: 393, h: 851 },
  { id: 'galaxy-fold', name: 'Galaxy Fold', w: 280, h: 653 },
  { id: 'ipad-mini', name: 'iPad mini', w: 768, h: 1024 },
] as const

type DeviceId = (typeof DEVICES)[number]['id']

const PLAYER_NAMES = ['Matheus', 'André', 'Bruna', 'Caio'] as const

export default function TestMobilePage() {
  const [deviceId, setDeviceId] = useState<DeviceId>('iphone-mini')
  const [opponentCount, setOpponentCount] = useState<1 | 2 | 3>(3)
  const [meIndex, setMeIndex] = useState(0)
  const [showRealUI, setShowRealUI] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const device = DEVICES.find(d => d.id === deviceId) ?? DEVICES[0]
  const allPlayers = PLAYER_NAMES.slice(0, opponentCount + 1)

  const post = (msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*')
  }

  // Sincroniza state inicial assim que o iframe carrega
  const onIframeLoad = () => {
    post({ type: 'set-opp-count', value: opponentCount })
    post({ type: 'set-me-index', value: meIndex })
    post({ type: 'set-hud', value: showRealUI })
  }

  // Re-sincroniza quando state muda (no parent)
  useEffect(() => { post({ type: 'set-opp-count', value: opponentCount }) }, [opponentCount])
  useEffect(() => { post({ type: 'set-me-index', value: meIndex }) }, [meIndex])
  useEffect(() => { post({ type: 'set-hud', value: showRealUI }) }, [showRealUI])

  const btnBase = 'px-2 py-1.5 rounded-md font-display text-xs border-2 border-bate-paper/30'

  return (
    <main className="min-h-screen bg-bate-ink/95 text-bate-paper flex">
      {/* Sidebar com TODOS os controles do test-layout */}
      <aside className="w-72 shrink-0 p-4 flex flex-col gap-3 bg-bate-ink border-r-[3px] border-bate-paper/20 overflow-y-auto max-h-screen">
        <header>
          <h1 className="font-display text-xl text-bate-gold">📱 Mobile Preview</h1>
          <p className="text-[10px] text-bate-paper/60 mt-1 leading-relaxed">
            <code className="font-mono">/test-layout?bare=1</code> dentro de iframe com viewport mobile real. Controles comunicam via postMessage.
          </p>
        </header>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-[10px] uppercase tracking-widest text-bate-paper/60">Device</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {DEVICES.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDeviceId(d.id)}
                className={`px-2 py-1.5 rounded-md font-display text-[10px] text-left border-2 ${
                  deviceId === d.id
                    ? 'bg-bate-gold text-bate-ink border-bate-gold'
                    : 'bg-bate-ink text-bate-paper border-bate-paper/30 hover:border-bate-gold'
                }`}
              >
                <div className="leading-tight">{d.name}</div>
                <div className="text-[9px] opacity-70">{d.w}×{d.h}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-[10px] uppercase tracking-widest text-bate-paper/60">Oponentes</h2>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setOpponentCount(n as 1 | 2 | 3)
                  if (meIndex > n) setMeIndex(0)
                }}
                className={`${btnBase} flex-1 ${opponentCount === n ? 'bg-bate-gold text-bate-ink border-bate-gold' : 'hover:border-bate-gold'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-[10px] uppercase tracking-widest text-bate-paper/60">Eu sou</h2>
          <div className="grid grid-cols-2 gap-1.5">
            {allPlayers.map((name, idx) => (
              <button
                key={name}
                type="button"
                onClick={() => setMeIndex(idx)}
                className={`${btnBase} ${meIndex === idx ? 'bg-bate-red text-bate-paper border-bate-red' : 'hover:border-bate-gold'}`}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-[10px] uppercase tracking-widest text-bate-paper/60">Comprar carta</h2>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => post({ type: 'draw-card', rank: '10' })} className={`${btnBase} hover:border-bate-gold`}>10 (olha)</button>
            <button type="button" onClick={() => post({ type: 'draw-card', rank: 'J' })} className={`${btnBase} hover:border-bate-gold`}>J (espia)</button>
            <button type="button" onClick={() => post({ type: 'draw-card', rank: 'Q' })} className={`${btnBase} hover:border-bate-gold`}>Q (troca)</button>
            <button type="button" onClick={() => post({ type: 'draw-card', rank: '5' })} className={`${btnBase} hover:border-bate-gold`}>5 (num)</button>
            <button type="button" onClick={() => post({ type: 'draw-card', rank: 'K' })} className={`${btnBase} hover:border-bate-gold col-span-2`}>K (prata)</button>
          </div>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-display text-[10px] uppercase tracking-widest text-bate-paper/60">Outras</h2>
          <div className="grid grid-cols-2 gap-1.5">
            <button type="button" onClick={() => post({ type: 'run-snap', ok: true })} className={`${btnBase} hover:border-bate-gold`}>snap OK</button>
            <button type="button" onClick={() => post({ type: 'run-snap', ok: false })} className={`${btnBase} bg-bate-red/80 text-bate-paper border-bate-red hover:bg-bate-red`}>snap ERR</button>
            <button type="button" onClick={() => post({ type: 'run-tempo' })} className={`${btnBase} col-span-2 hover:border-bate-gold`}>tempo (toggle)</button>
          </div>
        </section>

        <section className="flex items-center justify-between">
          <h2 className="font-display text-[10px] uppercase tracking-widest text-bate-paper/60">HUD real</h2>
          <button
            type="button"
            onClick={() => setShowRealUI(v => !v)}
            className={`${btnBase} ${showRealUI ? 'bg-bate-gold text-bate-ink border-bate-gold' : 'hover:border-bate-gold'}`}
          >
            {showRealUI ? 'ON' : 'OFF'}
          </button>
        </section>

        <section className="flex flex-col gap-1.5 pt-2 border-t border-bate-paper/20">
          <button
            type="button"
            onClick={() => setReloadKey(k => k + 1)}
            className={`${btnBase} hover:border-bate-gold`}
          >
            🔄 reload iframe
          </button>
        </section>
      </aside>

      {/* Center: phone frame com iframe sem toolbar interna */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className="relative bg-bate-paper rounded-[40px] border-[10px] border-bate-paper shadow-2xl overflow-hidden"
          style={{
            width: device.w + 'px',
            height: device.h + 'px',
            maxHeight: 'calc(100vh - 48px)',
          }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-bate-ink rounded-b-2xl z-float pointer-events-none" />
          <iframe
            ref={iframeRef}
            key={`${device.id}-${reloadKey}`}
            src="/test-layout?bare=1"
            width={device.w}
            height={device.h}
            onLoad={onIframeLoad}
            className="w-full h-full border-0 bg-bate-cream"
            title={`Mobile preview ${device.name}`}
          />
        </div>
      </div>
    </main>
  )
}
