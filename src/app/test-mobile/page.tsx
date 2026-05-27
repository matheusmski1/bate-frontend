'use client'

import { useRef, useState } from 'react'

// Test page que renderiza o /test-layout dentro de um iframe com dimensões
// de mobile (375×812 — iPhone 12/13 viewport). Como o iframe tem seu próprio
// viewport, todas as media queries `sm:` do Tailwind respondem como em mobile
// real — diferente de constrainer o tamanho via CSS que não dispara as queries.

const DEVICES = [
  { id: 'iphone-mini', name: 'iPhone 13 mini', w: 375, h: 812 },
  { id: 'iphone-14', name: 'iPhone 14 Pro', w: 393, h: 852 },
  { id: 'pixel', name: 'Pixel 5', w: 393, h: 851 },
  { id: 'galaxy-fold', name: 'Galaxy Fold', w: 280, h: 653 },
  { id: 'ipad-mini', name: 'iPad mini', w: 768, h: 1024 },
] as const

type DeviceId = (typeof DEVICES)[number]['id']

export default function TestMobilePage() {
  const [deviceId, setDeviceId] = useState<DeviceId>('iphone-mini')
  const [reloadKey, setReloadKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const device = DEVICES.find(d => d.id === deviceId) ?? DEVICES[0]

  const reload = () => setReloadKey(k => k + 1)

  return (
    <main className="min-h-screen bg-bate-ink/90 text-bate-paper flex">
      {/* Sidebar com info e device selector */}
      <aside className="w-72 shrink-0 p-4 flex flex-col gap-4 bg-bate-ink border-r-[3px] border-bate-paper/20">
        <header>
          <h1 className="font-display text-xl text-bate-gold">📱 Mobile Preview</h1>
          <p className="text-xs text-bate-paper/60 mt-1 leading-relaxed">
            Renderiza <code className="font-mono">/test-layout</code> num iframe com viewport real de mobile — as media queries <code className="font-mono">sm:</code> respondem como num device de verdade.
          </p>
        </header>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-xs uppercase tracking-widest text-bate-paper/60">Device</h2>
          {DEVICES.map(d => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDeviceId(d.id)}
              className={`px-3 py-2 rounded-lg font-display text-xs text-left border-2 ${
                deviceId === d.id
                  ? 'bg-bate-gold text-bate-ink border-bate-gold'
                  : 'bg-bate-ink text-bate-paper border-bate-paper/30 hover:border-bate-gold'
              }`}
            >
              <div className="flex justify-between items-baseline">
                <span>{d.name}</span>
                <span className="text-[10px] opacity-70">{d.w}×{d.h}</span>
              </div>
            </button>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-display text-xs uppercase tracking-widest text-bate-paper/60">Ações</h2>
          <button
            type="button"
            onClick={reload}
            className="px-3 py-2 rounded-lg font-display text-xs border-2 border-bate-paper/30 hover:border-bate-gold"
          >
            🔄 reload iframe
          </button>
        </section>

        <section className="mt-auto text-[10px] text-bate-paper/40 font-body leading-relaxed">
          Os controles (Oponentes, Eu sou, Comprar, Outras, Animações) ficam DENTRO do iframe — usa a toolbar do <code className="font-mono">/test-layout</code> normalmente. Esta página só serve pra visualizar o layout em viewports mobile reais.
        </section>
      </aside>

      {/* Center: phone frame com iframe */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className="relative bg-bate-paper rounded-[40px] border-[10px] border-bate-paper shadow-2xl overflow-hidden"
          style={{
            width: device.w + 'px',
            height: device.h + 'px',
            maxHeight: 'calc(100vh - 48px)',
          }}
        >
          {/* Notch decorativo do iPhone */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-bate-ink rounded-b-2xl z-50 pointer-events-none" />
          <iframe
            ref={iframeRef}
            key={`${device.id}-${reloadKey}`}
            src="/test-layout"
            width={device.w}
            height={device.h}
            className="w-full h-full border-0 bg-bate-cream"
            title={`Mobile preview ${device.name}`}
          />
        </div>
      </div>
    </main>
  )
}
