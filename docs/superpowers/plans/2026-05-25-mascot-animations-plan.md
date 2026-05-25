# Mascot Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 6 animações de mascote (olhadinha, espiadinha, snap ok/err, troca, tempo acabando) plugadas em eventos existentes do GameArea, usando anime.js + overlay com DOM measurement.

**Architecture:** 1 overlay root component em `<GameArea>` + 4 primitivas puras em `lib/mascot-overlay/controller.ts` + 5 hooks de trigger desacoplados em `lib/mascot-overlay/triggers/`. Cada trigger escuta um sinal do estado do jogo (resposta de socket ou entrada nova em `state.log`) e dispara uma primitiva do controller. Nenhuma mudança no servidor.

**Tech Stack:** Next.js 15 + React 19 + TypeScript strict + anime.js v4 + Tailwind. Sem framework de testes — verificação manual via `/test-mascot-overlay` (já existe) e sessão real de jogo 2+ jogadores.

**Spec:** `docs/superpowers/specs/2026-05-25-peek-mascot-animation-design.md`

**Prototipo de referência:** `src/app/test-mascot-overlay/page.tsx` (já tem todas as primitivas funcionando — esse plan extrai elas pra `lib/mascot-overlay/` e pluga no jogo real).

---

## Phase 0 — Foundation

Extrai as primitivas do prototype pra módulos reutilizáveis, adiciona os `data-*` attrs nos componentes do tabuleiro, e monta o overlay vazio em GameArea (zero animação ligada ainda).

### Task 0.1: Script de conversão de assets PNG → WebP com alpha

**Files:**
- Create: `scripts/optimize-mascot.mjs`

- [ ] **Step 1: Criar o script**

```js
// scripts/optimize-mascot.mjs
// Usage: node scripts/optimize-mascot.mjs <input.png> <output.webp> [width=1024]
// Faz flood-fill de borda removendo pixels gray-ish (light 130-250, sat <25) e
// exporta WebP com alpha. Usado pra converter PNGs de batinhos que vêm com
// checkerboard baked no fundo.

import sharp from 'sharp'

const [, , input, output, widthArg] = process.argv
if (!input || !output) {
  console.error('Usage: node scripts/optimize-mascot.mjs <input.png> <output.webp> [width=1024]')
  process.exit(1)
}
const width = Number(widthArg) || 1024

const meta = await sharp(input).metadata()
console.log(`source: ${meta.width}x${meta.height} channels=${meta.channels} hasAlpha=${meta.hasAlpha}`)

const { data, info } = await sharp(input).resize({ width }).raw().toBuffer({ resolveWithObject: true })
const w = info.width
const h = info.height

const isBg = (r, g, b) => {
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  const light = (r + g + b) / 3
  return light > 130 && light < 250 && sat < 25
}

const mask = new Uint8Array(w * h)
const queue = []
const seed = (i) => {
  const r = data[i * 3]
  const g = data[i * 3 + 1]
  const b = data[i * 3 + 2]
  if (isBg(r, g, b) && !mask[i]) {
    mask[i] = 1
    queue.push(i)
  }
}

for (let x = 0; x < w; x++) {
  seed(x)
  seed((h - 1) * w + x)
}
for (let y = 0; y < h; y++) {
  seed(y * w)
  seed(y * w + w - 1)
}

while (queue.length) {
  const i = queue.shift()
  const x = i % w
  const y = (i - x) / w
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
    const ni = ny * w + nx
    if (mask[ni]) continue
    const r = data[ni * 3]
    const g = data[ni * 3 + 1]
    const b = data[ni * 3 + 2]
    if (isBg(r, g, b)) {
      mask[ni] = 1
      queue.push(ni)
    }
  }
}

const out = Buffer.alloc(w * h * 4)
let bgCount = 0
for (let i = 0; i < w * h; i++) {
  out[i * 4] = data[i * 3]
  out[i * 4 + 1] = data[i * 3 + 1]
  out[i * 4 + 2] = data[i * 3 + 2]
  out[i * 4 + 3] = mask[i] ? 0 : 255
  if (mask[i]) bgCount++
}

await sharp(out, { raw: { width: w, height: h, channels: 4 } })
  .webp({ quality: 92, alphaQuality: 100, effort: 6 })
  .toFile(output)

const final = await sharp(output).metadata()
const pct = ((bgCount / (w * h)) * 100).toFixed(1)
console.log(`done → ${output} ${final.width}x${final.height} bgRemoved=${pct}%`)
```

- [ ] **Step 2: Testar o script numa cópia**

Run:
```bash
node scripts/optimize-mascot.mjs /tmp/test.png /tmp/test.webp 2>&1 | head -5 || echo "expected error sem input válido — testar com PNG real se disponível"
```

Expected: erro de input (sem arquivo /tmp/test.png) OU se rodar com um PNG real, output tipo `done → ...webp 1024x... bgRemoved=XX%`.

- [ ] **Step 3: Commit**

```bash
git add scripts/optimize-mascot.mjs
git commit -m "add mascot PNG-to-WebP conversion script with chroma-key"
```

---

### Task 0.2: Criar módulo de assets

**Files:**
- Create: `src/lib/mascot-overlay/assets.ts`

- [ ] **Step 1: Criar o arquivo**

```ts
// src/lib/mascot-overlay/assets.ts
// Paths e aspect ratios dos sprites de mascote usados nas animações.
// Aspect = width / height da WebP. Usado por boxFor() pra calcular bounding box
// do wrapper sem distorcer quando img muda de src no meio da timeline.

export const FELIZ = '/batinho/batinho-feliz.webp'
export const LUPA = '/batinho/batinho-lupa.webp'
export const ESPIADINHA = '/batinho/batinho-espiadinha.webp'
export const TROCA = '/batinho/batinho-troca-de-cartas.webp'
export const ASSUSTADO = '/batinho/batinho-assustado.webp'
export const TEMPO = '/batinho/batinho-tempo-acabando.webp'

export const ASPECTS: Record<string, number> = {
  [FELIZ]: 720 / 402,
  [LUPA]: 720 / 402,
  [ESPIADINHA]: 1024 / 572,
  [TROCA]: 1024 / 572,
  [ASSUSTADO]: 720 / 402,
  [TEMPO]: 720 / 402,
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 0.3: Criar módulo de geometria

**Files:**
- Create: `src/lib/mascot-overlay/geometry.ts`

- [ ] **Step 1: Criar o arquivo**

```ts
// src/lib/mascot-overlay/geometry.ts
// Helpers de medição e dimensionamento usados pelo controller.

import { ASPECTS } from './assets'

export type Box = { width: number; height: number }

/**
 * Calcula a bounding box (wrapper) que acomoda TODOS os assets passados,
 * respeitando o aspect mais "alto" (menor ratio). Image dentro usa
 * object-fit:contain — sprite mais wide aparece menor que a box, sem distorção.
 */
export function boxFor(width: number, assets: string[]): Box {
  const ratios = assets.map((a) => ASPECTS[a] ?? 720 / 402)
  const minAspect = Math.min(...ratios)
  return { width, height: Math.round(width / minAspect) }
}

/**
 * Lookup DOM rect via atributo data-*. Retorna null se elemento não existe
 * (ex: card desmontou no meio da animação).
 */
export function getRect(selector: string): DOMRect | null {
  if (typeof document === 'undefined') return null
  const el = document.querySelector(selector)
  return el ? el.getBoundingClientRect() : null
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 0.4: Criar controller com primitiva `runFlight`

**Files:**
- Create: `src/lib/mascot-overlay/controller.ts`

- [ ] **Step 1: Criar o controller inicial (só runFlight, makeMascot interno, queue básico)**

```ts
// src/lib/mascot-overlay/controller.ts
// Primitivas de animação de mascote. Cada primitiva é uma função pura que
// monta um elemento DOM no overlay, roda anime.js timeline, e limpa.
// Retorna { cancel } pra interrupção externa.

import { createTimeline } from 'animejs'
import type { Box } from './geometry'

type Handle = { cancel: () => void }

const NOOP: Handle = { cancel: () => {} }

function reducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function makeMascot(src: string, x: number, y: number, box: Box): { wrap: HTMLDivElement; img: HTMLImageElement } {
  const wrap = document.createElement('div')
  wrap.style.position = 'fixed'
  wrap.style.left = `${x}px`
  wrap.style.top = `${y}px`
  wrap.style.width = `${box.width}px`
  wrap.style.height = `${box.height}px`
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
  return { wrap, img }
}

export type Controller = {
  runFlight(opts: FlightOpts): Handle
  // próximas primitivas adicionadas em tasks seguintes
}

export type FlightOpts = {
  overlay: HTMLElement
  fromRect: DOMRect | null
  toRect: DOMRect | null
  travelAsset: string
  arrivalAsset: string
  box: Box
  onArrived?: () => void
  onComplete?: () => void
}

let runningCount = 0

export function createController(): Controller {
  return {
    runFlight(opts) {
      if (runningCount > 0) {
        opts.onArrived?.()
        opts.onComplete?.()
        return NOOP
      }
      if (!opts.fromRect || !opts.toRect) {
        opts.onArrived?.()
        opts.onComplete?.()
        return NOOP
      }
      if (reducedMotionPreferred()) {
        setTimeout(() => opts.onArrived?.(), 50)
        setTimeout(() => opts.onComplete?.(), 100)
        return NOOP
      }

      runningCount++
      const { fromRect, toRect, box, travelAsset, arrivalAsset, overlay } = opts
      const fromX = fromRect.left + fromRect.width / 2 - box.width / 2
      const fromY = fromRect.top + fromRect.height / 2 - box.height / 2
      const toX = toRect.left + toRect.width / 2 - box.width / 2
      const toY = toRect.top - box.height * 0.85
      const dx = toX - fromX
      const dy = toY - fromY
      const midY = -Math.abs(dx) * 0.18 - 30

      const { wrap, img } = makeMascot(travelAsset, fromX, fromY, box)
      overlay.appendChild(wrap)

      let cancelled = false
      const cleanup = () => {
        try {
          overlay.removeChild(wrap)
        } catch {
          // already removed
        }
        runningCount = Math.max(0, runningCount - 1)
      }

      try {
        const tl = createTimeline({
          defaults: { ease: 'outQuad' },
          onComplete: () => {
            if (cancelled) return
            cleanup()
            opts.onComplete?.()
          },
        })
        tl.add(wrap, { opacity: [0, 1], scale: [0, 1], rotate: [-18, 0], duration: 220, ease: 'outBack' })
        tl.add(wrap, {
          translateX: [0, dx * 0.5, dx],
          translateY: [0, midY + dy * 0.5, dy],
          rotate: [0, 6, 0],
          duration: 580,
          ease: 'inOutQuad',
        })
        tl.call(() => {
          img.src = arrivalAsset
        })
        tl.add(wrap, {
          translateX: dx,
          translateY: [dy, dy - 14, dy],
          scale: [1, 1.22, 1.08],
          rotate: [0, -14, 6],
          duration: 280,
          ease: 'outBack',
          onComplete: () => {
            if (!cancelled) opts.onArrived?.()
          },
        })
        tl.add(wrap, {
          translateX: [dx, dx + 4, dx - 3, dx],
          translateY: dy,
          scale: 1.08,
          rotate: [6, -3, 3, 0],
          duration: 260,
          ease: 'inOutSine',
        })
        tl.add(wrap, {
          translateX: dx,
          translateY: dy,
          scale: [1.08, 0],
          opacity: [1, 0],
          rotate: [0, -15],
          duration: 280,
          ease: 'inQuad',
        })

        return {
          cancel: () => {
            if (cancelled) return
            cancelled = true
            try {
              tl.pause()
            } catch {
              // ignore
            }
            cleanup()
          },
        }
      } catch {
        cleanup()
        opts.onArrived?.()
        opts.onComplete?.()
        return NOOP
      }
    },
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 0.5: Adicionar primitiva `runSwapDelivery` ao controller

**Files:**
- Modify: `src/lib/mascot-overlay/controller.ts`

- [ ] **Step 1: Adicionar tipo SwapOpts ao Controller**

Localizar bloco `export type Controller = { ... }` e modificar pra:

```ts
export type Controller = {
  runFlight(opts: FlightOpts): Handle
  runSwapDelivery(opts: SwapOpts): Handle
}

export type SwapOpts = {
  overlay: HTMLElement
  fromRect: DOMRect | null
  midRect: DOMRect | null  // minha carta
  toRect: DOMRect | null   // carta do oponente
  travelAsset: string
  carryAsset: string
  box: Box
  onSwapped?: () => void
  onComplete?: () => void
}
```

- [ ] **Step 2: Adicionar implementação dentro de createController()**

Localizar `return { runFlight(opts) { ... } }` e adicionar uma segunda propriedade depois do `runFlight`:

```ts
    runSwapDelivery(opts) {
      if (runningCount > 0) {
        opts.onSwapped?.()
        opts.onComplete?.()
        return NOOP
      }
      if (!opts.fromRect || !opts.midRect || !opts.toRect) {
        opts.onSwapped?.()
        opts.onComplete?.()
        return NOOP
      }
      if (reducedMotionPreferred()) {
        setTimeout(() => opts.onSwapped?.(), 50)
        setTimeout(() => opts.onComplete?.(), 100)
        return NOOP
      }

      runningCount++
      const { fromRect, midRect, toRect, box, travelAsset, carryAsset, overlay } = opts
      const fromX = fromRect.left + fromRect.width / 2 - box.width / 2
      const fromY = fromRect.top + fromRect.height / 2 - box.height / 2
      const mineX = midRect.left + midRect.width / 2 - box.width / 2
      const mineY = midRect.top - box.height * 0.85
      const oppX = toRect.left + toRect.width / 2 - box.width / 2
      const oppY = toRect.top - box.height * 0.85

      const dxA = mineX - fromX
      const dyA = mineY - fromY
      const dxB = oppX - fromX
      const dyB = oppY - fromY
      const midYA = -Math.abs(dxA) * 0.16 - 20
      const midYB = -Math.abs(dxB - dxA) * 0.16 - 20

      const { wrap, img } = makeMascot(travelAsset, fromX, fromY, box)
      overlay.appendChild(wrap)

      let cancelled = false
      const cleanup = () => {
        try {
          overlay.removeChild(wrap)
        } catch {
          // ignore
        }
        runningCount = Math.max(0, runningCount - 1)
      }

      try {
        const tl = createTimeline({
          defaults: { ease: 'outQuad' },
          onComplete: () => {
            if (cancelled) return
            cleanup()
            opts.onComplete?.()
          },
        })
        tl.add(wrap, { opacity: [0, 1], scale: [0, 1], rotate: [-18, 0], duration: 220, ease: 'outBack' })
        tl.add(wrap, {
          translateX: [0, dxA * 0.5, dxA],
          translateY: [0, midYA + dyA * 0.5, dyA],
          rotate: [0, 5, 0],
          duration: 480,
          ease: 'inOutQuad',
        })
        tl.call(() => {
          img.src = carryAsset
        })
        tl.add(wrap, {
          translateX: dxA,
          translateY: [dyA, dyA - 10, dyA],
          scale: [1, 1.15, 1.05],
          rotate: [0, -8, 0],
          duration: 260,
          ease: 'outBack',
        })
        tl.add(wrap, {
          translateX: [dxA, (dxA + dxB) / 2, dxB],
          translateY: [dyA, dyA + midYB, dyB],
          rotate: [0, 4, 0],
          duration: 560,
          ease: 'inOutQuad',
        })
        tl.add(wrap, {
          translateX: dxB,
          translateY: [dyB, dyB - 8, dyB],
          scale: [1.05, 1.18, 1.05],
          rotate: [0, 8, 0],
          duration: 240,
          ease: 'outBack',
          onComplete: () => {
            if (!cancelled) opts.onSwapped?.()
          },
        })
        tl.add(wrap, {
          translateX: dxB,
          translateY: dyB,
          scale: [1.05, 0],
          opacity: [1, 0],
          rotate: [0, 15],
          duration: 260,
          ease: 'inQuad',
        })

        return {
          cancel: () => {
            if (cancelled) return
            cancelled = true
            try {
              tl.pause()
            } catch {
              // ignore
            }
            cleanup()
          },
        }
      } catch {
        cleanup()
        opts.onSwapped?.()
        opts.onComplete?.()
        return NOOP
      }
    },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 0.6: Adicionar primitiva `popOnCard` ao controller

**Files:**
- Modify: `src/lib/mascot-overlay/controller.ts`

- [ ] **Step 1: Adicionar tipo PopOpts ao Controller**

Atualizar `export type Controller`:

```ts
export type Controller = {
  runFlight(opts: FlightOpts): Handle
  runSwapDelivery(opts: SwapOpts): Handle
  popOnCard(opts: PopOpts): Handle
}

export type PopOpts = {
  overlay: HTMLElement
  targetRect: DOMRect | null
  asset: string
  variant: 'success' | 'shake'
  box: Box
  onComplete?: () => void
}
```

- [ ] **Step 2: Adicionar implementação no `createController()`**

Adicionar terceira propriedade depois de `runSwapDelivery`:

```ts
    popOnCard(opts) {
      if (runningCount > 0) {
        opts.onComplete?.()
        return NOOP
      }
      if (!opts.targetRect) {
        opts.onComplete?.()
        return NOOP
      }
      if (reducedMotionPreferred()) {
        setTimeout(() => opts.onComplete?.(), 100)
        return NOOP
      }

      runningCount++
      const { targetRect, box, asset, variant, overlay } = opts
      const x = targetRect.left + targetRect.width / 2 - box.width / 2
      const y = targetRect.top - box.height * 0.65

      const { wrap } = makeMascot(asset, x, y, box)
      overlay.appendChild(wrap)

      let cancelled = false
      const cleanup = () => {
        try {
          overlay.removeChild(wrap)
        } catch {
          // ignore
        }
        runningCount = Math.max(0, runningCount - 1)
      }

      try {
        const tl = createTimeline({
          defaults: { ease: 'outQuad' },
          onComplete: () => {
            if (cancelled) return
            cleanup()
            opts.onComplete?.()
          },
        })
        tl.add(wrap, {
          opacity: [0, 1],
          scale: [0, 1.25, 1.05],
          rotate: variant === 'shake' ? [-12, 8, -4] : [-18, 8, 0],
          duration: 320,
          ease: 'outBack',
        })
        if (variant === 'shake') {
          tl.add(wrap, {
            translateX: [0, -8, 7, -5, 4, 0],
            translateY: [0, 2, -2, 1, 0],
            rotate: [-4, 5, -3, 2, 0],
            duration: 420,
            ease: 'inOutSine',
          })
        } else {
          tl.add(wrap, {
            scale: [1.05, 1.12, 1.05],
            rotate: [0, 4, -3, 0],
            duration: 380,
            ease: 'inOutSine',
          })
        }
        tl.add(wrap, { scale: 1.05, duration: 250 })
        tl.add(wrap, {
          scale: [1.05, 0],
          opacity: [1, 0],
          translateY: [0, -10],
          duration: 240,
          ease: 'inQuad',
        })

        return {
          cancel: () => {
            if (cancelled) return
            cancelled = true
            try {
              tl.pause()
            } catch {
              // ignore
            }
            cleanup()
          },
        }
      } catch {
        cleanup()
        opts.onComplete?.()
        return NOOP
      }
    },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 0.7: Adicionar primitiva `attachLoop` ao controller

**Files:**
- Modify: `src/lib/mascot-overlay/controller.ts`

- [ ] **Step 1: Adicionar AttachOpts e implementação**

Atualizar `Controller` type:

```ts
export type Controller = {
  runFlight(opts: FlightOpts): Handle
  runSwapDelivery(opts: SwapOpts): Handle
  popOnCard(opts: PopOpts): Handle
  attachLoop(opts: AttachOpts): Handle
}

export type AttachOpts = {
  overlay: HTMLElement
  anchorRect: DOMRect | null
  asset: string
  box: Box
  position?: 'top-right' | 'top-center'
}
```

E adicionar implementação no return de `createController()`:

```ts
    attachLoop(opts) {
      if (!opts.anchorRect) return NOOP
      if (reducedMotionPreferred()) return NOOP

      const { anchorRect, asset, box, overlay } = opts
      const pos = opts.position ?? 'top-right'
      const x = pos === 'top-right'
        ? anchorRect.right - box.width * 0.3
        : anchorRect.left + anchorRect.width / 2 - box.width / 2
      const y = anchorRect.top - box.height * 0.6

      const { wrap } = makeMascot(asset, x, y, box)
      overlay.appendChild(wrap)

      let loop: { pause: () => void } | null = null
      let cancelled = false

      try {
        const entry = createTimeline({
          onComplete: () => {
            if (cancelled) return
            loop = createTimeline({ loop: true, defaults: { ease: 'inOutSine' } })
            ;(loop as ReturnType<typeof createTimeline>).add(wrap, {
              translateY: [0, -10, 0],
              rotate: [-6, 6, -6],
              duration: 1200,
            })
          },
        })
        entry.add(wrap, {
          opacity: [0, 1],
          scale: [0, 1.1, 1],
          rotate: [-30, 8, 0],
          duration: 360,
          ease: 'outBack',
        })

        return {
          cancel: () => {
            if (cancelled) return
            cancelled = true
            try {
              entry.pause()
            } catch {
              // ignore
            }
            try {
              loop?.pause()
            } catch {
              // ignore
            }
            try {
              overlay.removeChild(wrap)
            } catch {
              // ignore
            }
          },
        }
      } catch {
        try {
          overlay.removeChild(wrap)
        } catch {
          // ignore
        }
        return NOOP
      }
    },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 0.8: Criar index do módulo

**Files:**
- Create: `src/lib/mascot-overlay/index.ts`

- [ ] **Step 1: Re-exportar API pública**

```ts
// src/lib/mascot-overlay/index.ts
export { createController } from './controller'
export type { Controller, FlightOpts, SwapOpts, PopOpts, AttachOpts } from './controller'
export { boxFor, getRect } from './geometry'
export type { Box } from './geometry'
export * from './assets'
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 3: Commit foundation lib**

```bash
git add src/lib/mascot-overlay/
git commit -m "add mascot-overlay lib: controller primitives + assets + geometry"
```

---

### Task 0.9: Adicionar `data-card-id` no Card2D

**Files:**
- Modify: `src/components/room2d/Card2D.tsx`

- [ ] **Step 1: Ler arquivo pra encontrar o wrapper externo**

Run: `head -50 src/components/room2d/Card2D.tsx`

Encontrar o `<motion.div>` ou `<div>` mais externo do componente (o que renderiza a carta inteira).

- [ ] **Step 2: Adicionar atributo**

No wrapper externo, adicionar `data-card-id={card.id}` (substituir com a prop correta — provavelmente `card` é a prop do componente).

Exemplo:
```tsx
<motion.div
  data-card-id={card.id}
  className={...existing...}
  ...
>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 0.10: Adicionar `data-discard-pile` no DiscardPile2D

**Files:**
- Modify: `src/components/room2d/DiscardPile2D.tsx`

- [ ] **Step 1: Adicionar atributo no container da carta do topo**

Encontrar o wrapper externo do componente e adicionar `data-discard-pile`:

```tsx
<div data-discard-pile className={...existing...}>
```

Se o componente tem múltiplos divs (ex: empilhamento visual), pôr no que representa a posição do topo (último da pilha — onde o mascote deve "surgir").

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 0.11: Adicionar `data-opponent-nameplate` e `data-player-nameplate`

**Files:**
- Modify: `src/components/room2d/OpponentArea.tsx`
- Modify: `src/components/room2d/PlayerHand2D.tsx`

- [ ] **Step 1: Adicionar atributo no nameplate do oponente**

Em `OpponentArea.tsx`, encontrar o div/badge do nome do jogador e adicionar:

```tsx
<div data-opponent-nameplate={player.id} className={...existing...}>
```

- [ ] **Step 2: Adicionar atributo no nameplate do próprio jogador**

Em `PlayerHand2D.tsx`, fazer o mesmo:

```tsx
<div data-player-nameplate={player.id} className={...existing...}>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 4: Commit data attributes**

```bash
git add src/components/room2d/Card2D.tsx src/components/room2d/DiscardPile2D.tsx src/components/room2d/OpponentArea.tsx src/components/room2d/PlayerHand2D.tsx
git commit -m "add data-* attrs on game elements for mascot overlay measurement"
```

---

### Task 0.12: Criar MascotOverlay component vazio + montar em GameArea

**Files:**
- Create: `src/components/room2d/MascotOverlay.tsx`
- Modify: `src/components/room2d/GameArea.tsx`

- [ ] **Step 1: Criar componente raiz**

```tsx
// src/components/room2d/MascotOverlay.tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import { createController } from '@/lib/mascot-overlay'

export type LocalMascotActions = {
  peekRevealed: { cardId: string; reveal: { rank: Rank; suit: Suit | null } } | null
  snapResult: { handIndex: number; ok: boolean } | null
  swapResolved: { myCardId: string; opponentCardId: string } | null
}

export type MascotOverlayProps = {
  state: RedactedState
  myId: string
  localActions: LocalMascotActions
  onPeekArrived?: (reveal: { rank: Rank; suit: Suit | null }) => void
}

export function MascotOverlay({ state, myId, localActions, onPeekArrived }: MascotOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const controller = useMemo(() => createController(), [])

  // suprimir lint de "unused" — vão ser usados quando os triggers forem ligados
  void state
  void myId
  void localActions
  void onPeekArrived
  void controller

  useEffect(() => {
    // triggers serão registrados aqui em phases seguintes
  }, [])

  return <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden />
}
```

- [ ] **Step 2: Adicionar import + state + mount em GameArea.tsx**

No topo do `GameArea.tsx`, adicionar import:

```tsx
import { MascotOverlay, type LocalMascotActions } from './MascotOverlay'
```

Dentro do componente, depois das outras declarações de useState, adicionar:

```tsx
const [localActions, setLocalActions] = useState<LocalMascotActions>({
  peekRevealed: null,
  snapResult: null,
  swapResolved: null,
})
```

No JSX, perto de `<PeekModal ... />`, adicionar:

```tsx
<MascotOverlay
  state={state}
  myId={myId}
  localActions={localActions}
  onPeekArrived={(reveal) => setRevealModal(reveal)}
/>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 4: Verificar em runtime**

Rodar `pnpm dev`, abrir `/` em 2 abas, criar/joinar uma sala, começar partida. Esperado: nada visual muda (overlay vazio). Console não deve ter warning/erro novo.

- [ ] **Step 5: Commit**

```bash
git add src/components/room2d/MascotOverlay.tsx src/components/room2d/GameArea.tsx
git commit -m "mount empty MascotOverlay in GameArea (no triggers yet)"
```

---

## Phase 1 — Olhadinha (peek-own)

Primeira animação ligada de verdade. Refatora `tempReveal` em GameArea pra usar `localActions.peekRevealed` (modal abre via callback do overlay).

### Task 1.1: Criar trigger de peek-own

**Files:**
- Create: `src/lib/mascot-overlay/triggers/peek-own.ts`

- [ ] **Step 1: Criar o hook**

```ts
// src/lib/mascot-overlay/triggers/peek-own.ts
// Dispara animação de olhadinha quando:
// - EU disparei: localActions.peekRevealed muda (set pelo GameArea no socket callback)
// - OUTRO disparou: state.log ganha entrada nova { type: 'peek', actorId !== myId }
//   E o targetPlayerId é o próprio actor (peek-own dele).

import { useEffect, useRef } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, LUPA } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlay: HTMLElement | null
  controller: Controller
  localPeek: { cardId: string; reveal: { rank: Rank; suit: Suit | null } } | null
  onArrived: (reveal: { rank: Rank; suit: Suit | null }) => void
}

export function usePeekOwnTrigger({ state, myId, overlay, controller, localPeek, onArrived }: Args) {
  // ---- caso A: EU sou o ator ----
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!overlay || !localPeek) return
    const key = `${localPeek.cardId}:${localPeek.reveal.rank}:${localPeek.reveal.suit ?? ''}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    const fromRect = getRect('[data-discard-pile]')
    const toRect = getRect(`[data-card-id="${CSS.escape(localPeek.cardId)}"]`)
    controller.runFlight({
      overlay,
      fromRect,
      toRect,
      travelAsset: FELIZ,
      arrivalAsset: LUPA,
      box: boxFor(140, [FELIZ, LUPA]),
      onArrived: () => onArrived(localPeek.reveal),
    })
  }, [overlay, controller, localPeek, onArrived])

  // ---- caso B: OUTRO é o ator ----
  const prevLogLenRef = useRef<number | null>(null)
  useEffect(() => {
    if (!overlay) return
    if (prevLogLenRef.current === null) {
      prevLogLenRef.current = state.log.length
      return
    }
    if (state.log.length <= prevLogLenRef.current) {
      prevLogLenRef.current = state.log.length
      return
    }
    const newEntries = state.log.slice(prevLogLenRef.current)
    prevLogLenRef.current = state.log.length

    for (const entry of newEntries) {
      if (entry.type !== 'peek') continue
      if (entry.actorId === myId) continue
      const p = entry.payload as { targetPlayerId?: string; cardIndex?: number; skipped?: boolean } | undefined
      if (!p || p.skipped) continue
      // peek-own significa actor === targetPlayer
      if (p.targetPlayerId !== entry.actorId) continue
      if (p.cardIndex === undefined) continue

      const targetPlayer = state.players.find((pl) => pl.id === p.targetPlayerId)
      const card = targetPlayer?.hand[p.cardIndex]
      if (!card) continue

      const fromRect = getRect('[data-discard-pile]')
      const toRect = getRect(`[data-card-id="${CSS.escape(card.id)}"]`)
      controller.runFlight({
        overlay,
        fromRect,
        toRect,
        travelAsset: FELIZ,
        arrivalAsset: LUPA,
        box: boxFor(140, [FELIZ, LUPA]),
      })
    }
  }, [overlay, controller, state.log, state.players, myId])
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 1.2: Ligar o trigger no MascotOverlay

**Files:**
- Modify: `src/components/room2d/MascotOverlay.tsx`

- [ ] **Step 1: Atualizar o componente pra usar o trigger**

Substituir o conteúdo de `MascotOverlay.tsx` por:

```tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import { createController, type Controller } from '@/lib/mascot-overlay'
import { usePeekOwnTrigger } from '@/lib/mascot-overlay/triggers/peek-own'

export type LocalMascotActions = {
  peekRevealed: { cardId: string; reveal: { rank: Rank; suit: Suit | null } } | null
  snapResult: { handIndex: number; ok: boolean } | null
  swapResolved: { myCardId: string; opponentCardId: string } | null
}

export type MascotOverlayProps = {
  state: RedactedState
  myId: string
  localActions: LocalMascotActions
  onPeekArrived?: (reveal: { rank: Rank; suit: Suit | null }) => void
}

export function MascotOverlay({ state, myId, localActions, onPeekArrived }: MascotOverlayProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [overlay, setOverlay] = useState<HTMLElement | null>(null)
  const controller = useMemo<Controller>(() => createController(), [])

  useEffect(() => {
    setOverlay(overlayRef.current)
  }, [])

  usePeekOwnTrigger({
    state,
    myId,
    overlay,
    controller,
    localPeek: localActions.peekRevealed,
    onArrived: onPeekArrived ?? (() => {}),
  })

  return <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden />
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 1.3: Refatorar `tempReveal` em GameArea pra usar localActions

**Files:**
- Modify: `src/components/room2d/GameArea.tsx`

- [ ] **Step 1: Mudar `tempReveal` pra setar peekRevealed em vez de revealModal direto**

Localizar a função `tempReveal` em GameArea (em torno da linha 183):

```ts
const tempReveal = useCallback((cardId: string, value: RevealValue) => {
  setTempReveals(prev => new Map(prev).set(cardId, value))
  setKnownCards(prev => new Map(prev).set(cardId, value))
  setRevealModal(value)
  setTimeout(() => {
    setTempReveals(prev => {
      const next = new Map(prev)
      next.delete(cardId)
      return next
    })
  }, TEMP_REVEAL_MS)
}, [])
```

Substituir por:

```ts
const tempReveal = useCallback((cardId: string, value: RevealValue) => {
  setTempReveals(prev => new Map(prev).set(cardId, value))
  setKnownCards(prev => new Map(prev).set(cardId, value))
  // Em vez de abrir o modal direto, dispara o overlay; o overlay chama onPeekArrived
  // que chama setRevealModal quando o mascote chega na carta (~900ms depois).
  setLocalActions(prev => ({ ...prev, peekRevealed: { cardId, reveal: value } }))
  setTimeout(() => {
    setTempReveals(prev => {
      const next = new Map(prev)
      next.delete(cardId)
      return next
    })
  }, TEMP_REVEAL_MS)
}, [])
```

- [ ] **Step 2: Limpar peekRevealed depois da animação consumir**

No JSX onde montou o MascotOverlay, atualizar o `onPeekArrived`:

```tsx
<MascotOverlay
  state={state}
  myId={myId}
  localActions={localActions}
  onPeekArrived={(reveal) => {
    setRevealModal(reveal)
    setLocalActions(prev => ({ ...prev, peekRevealed: null }))
  }}
/>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 4: Verificação manual**

Rodar `pnpm dev`. Em 2 abas, criar uma sala (2 jogadores). Jogar até alguém comprar uma carta com efeito de **olhadinha** (rank 7 ou 8, depende da regra). Disparar a olhadinha clicando numa carta sua.

Esperado:
- Mascote sai do descarte (centro da mesa)
- Voa até a carta clicada (sua mão)
- Faz pulse "aha"
- PeekModal abre logo depois (~900ms)

Na outra aba (oponente): vê o mascote chegando na carta do outro jogador também, mas sem modal abrindo.

Se algo estiver fora do lugar, pode ser DOM measurement (verificar `data-card-id` no Card2D, `data-discard-pile` no DiscardPile2D).

- [ ] **Step 5: Commit**

```bash
git add src/components/room2d/GameArea.tsx src/components/room2d/MascotOverlay.tsx src/lib/mascot-overlay/triggers/peek-own.ts
git commit -m "wire olhadinha (peek-own) animation through MascotOverlay"
```

---

## Phase 2 — Espiadinha (peek-other)

Praticamente um clone do peek-own, diferenças mínimas:
- Trigger escuta `peek` log entries onde `targetPlayerId !== actorId` (peek em carta de outro)
- Asset de chegada = ESPIADINHA em vez de LUPA
- Pra animação do EU como ator, o local action precisa carregar a info da carta-alvo (que não é minha)

### Task 2.1: Criar trigger de peek-other

**Files:**
- Create: `src/lib/mascot-overlay/triggers/peek-other.ts`

- [ ] **Step 1: Criar o hook**

```ts
// src/lib/mascot-overlay/triggers/peek-other.ts
// Dispara animação de espiadinha (peek-other). Quase idêntico a peek-own mas:
// - Alvo é carta do OPONENTE (não do actor)
// - Asset de chegada = ESPIADINHA

import { useEffect, useRef } from 'react'
import type { RedactedState, Rank, Suit } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, ESPIADINHA } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlay: HTMLElement | null
  controller: Controller
  localPeek: { cardId: string; reveal: { rank: Rank; suit: Suit | null } } | null
  onArrived: (reveal: { rank: Rank; suit: Suit | null }) => void
}

export function usePeekOtherTrigger({ state, myId, overlay, controller, localPeek, onArrived }: Args) {
  // EU como ator (mesma estrutura do peek-own — distinção é por chamada do GameArea)
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!overlay || !localPeek) return
    const key = `${localPeek.cardId}:${localPeek.reveal.rank}:${localPeek.reveal.suit ?? ''}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    const fromRect = getRect('[data-discard-pile]')
    const toRect = getRect(`[data-card-id="${CSS.escape(localPeek.cardId)}"]`)
    controller.runFlight({
      overlay,
      fromRect,
      toRect,
      travelAsset: FELIZ,
      arrivalAsset: ESPIADINHA,
      box: boxFor(140, [FELIZ, ESPIADINHA]),
      onArrived: () => onArrived(localPeek.reveal),
    })
  }, [overlay, controller, localPeek, onArrived])

  // OUTRO como ator
  const prevLogLenRef = useRef<number | null>(null)
  useEffect(() => {
    if (!overlay) return
    if (prevLogLenRef.current === null) {
      prevLogLenRef.current = state.log.length
      return
    }
    if (state.log.length <= prevLogLenRef.current) {
      prevLogLenRef.current = state.log.length
      return
    }
    const newEntries = state.log.slice(prevLogLenRef.current)
    prevLogLenRef.current = state.log.length

    for (const entry of newEntries) {
      if (entry.type !== 'peek') continue
      if (entry.actorId === myId) continue
      const p = entry.payload as { targetPlayerId?: string; cardIndex?: number; skipped?: boolean } | undefined
      if (!p || p.skipped) continue
      // peek-other: targetPlayer DIFERENTE do actor
      if (p.targetPlayerId === undefined || p.targetPlayerId === entry.actorId) continue
      if (p.cardIndex === undefined) continue

      const targetPlayer = state.players.find((pl) => pl.id === p.targetPlayerId)
      const card = targetPlayer?.hand[p.cardIndex]
      if (!card) continue

      const fromRect = getRect('[data-discard-pile]')
      const toRect = getRect(`[data-card-id="${CSS.escape(card.id)}"]`)
      controller.runFlight({
        overlay,
        fromRect,
        toRect,
        travelAsset: FELIZ,
        arrivalAsset: ESPIADINHA,
        box: boxFor(140, [FELIZ, ESPIADINHA]),
      })
    }
  }, [overlay, controller, state.log, state.players, myId])
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 2.2: Distinguir peek-own vs peek-other no GameArea

**Files:**
- Modify: `src/components/room2d/GameArea.tsx`
- Modify: `src/components/room2d/MascotOverlay.tsx`

Os dois triggers escutam o MESMO `localActions.peekRevealed`. Precisamos saber se foi peek-own ou peek-other. Vou adicionar um campo discriminante.

- [ ] **Step 1: Adicionar `kind` ao tipo LocalMascotActions**

Em `MascotOverlay.tsx`, mudar:

```ts
peekRevealed: { cardId: string; reveal: { rank: Rank; suit: Suit | null }; kind: 'own' | 'other' } | null
```

E refatorar o componente pra passar o trigger correto:

```tsx
import { usePeekOtherTrigger } from '@/lib/mascot-overlay/triggers/peek-other'

// dentro do MascotOverlay:
const peekOwnLocal = localActions.peekRevealed?.kind === 'own' ? localActions.peekRevealed : null
const peekOtherLocal = localActions.peekRevealed?.kind === 'other' ? localActions.peekRevealed : null

usePeekOwnTrigger({ state, myId, overlay, controller, localPeek: peekOwnLocal, onArrived: onPeekArrived ?? (() => {}) })
usePeekOtherTrigger({ state, myId, overlay, controller, localPeek: peekOtherLocal, onArrived: onPeekArrived ?? (() => {}) })
```

- [ ] **Step 2: Atualizar chamadas em GameArea pra passar `kind`**

Em `GameArea.tsx`, dentro de `handlePlayerCardClick` (caso `peek-own`):

```ts
if (pendingEffect.type === 'peek-own') {
  getSocket().emit('game:effect-target', { ... }, (res) => {
    // ...
    const r = res.payload?.revealed?.[0]
    if (r) tempReveal(r.card.id, { rank: r.card.rank, suit: r.card.suit })
  })
}
```

`tempReveal` precisa receber o kind. Atualizar assinatura:

```ts
const tempReveal = useCallback((cardId: string, value: RevealValue, kind: 'own' | 'other') => {
  setTempReveals(prev => new Map(prev).set(cardId, value))
  setKnownCards(prev => new Map(prev).set(cardId, value))
  setLocalActions(prev => ({ ...prev, peekRevealed: { cardId, reveal: value, kind } }))
  setTimeout(() => {
    setTempReveals(prev => {
      const next = new Map(prev)
      next.delete(cardId)
      return next
    })
  }, TEMP_REVEAL_MS)
}, [])
```

E nos call sites de `tempReveal`, passar o kind:

- Em `handlePlayerCardClick`: `tempReveal(r.card.id, { ... }, 'own')`
- Em `handleOpponentCardClick`: `tempReveal(r.card.id, { ... }, 'other')`

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 4: Verificação manual**

Em sessão de 2 jogadores, comprar uma carta com efeito de **espiadinha** (rank 9, depende da regra) e clicar numa carta do oponente. Esperado: mascote sai do descarte e voa até a carta do oponente com asset de espiadinha (detetive com lupa e chapéu).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mascot-overlay/triggers/peek-other.ts src/components/room2d/MascotOverlay.tsx src/components/room2d/GameArea.tsx
git commit -m "wire espiadinha (peek-other) animation"
```

---

## Phase 3 — Snap (acertou + errou)

### Task 3.1: Criar trigger de snap

**Files:**
- Create: `src/lib/mascot-overlay/triggers/snap.ts`

- [ ] **Step 1: Criar o hook**

```ts
// src/lib/mascot-overlay/triggers/snap.ts
// Dispara pop-on-card quando:
// - EU dei snap: localActions.snapResult set pelo GameArea no callback
//   (variant 'success' ou 'shake' baseado em ok)
// - OUTRO deu snap: state.log ganha entrada nova { type: 'snap' } ou 'snap-fail'
//   Pra outros, animamos no NAMEPLATE do actor (sem handIndex confiável)

import { useEffect, useRef } from 'react'
import type { RedactedState } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, ASSUSTADO } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlay: HTMLElement | null
  controller: Controller
  localSnap: { handIndex: number; ok: boolean } | null
  onConsumed: () => void
}

export function useSnapTrigger({ state, myId, overlay, controller, localSnap, onConsumed }: Args) {
  // EU como ator
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!overlay || !localSnap) return
    const key = `${localSnap.handIndex}:${localSnap.ok}:${Date.now()}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    // pra mim: animação na minha carta no handIndex
    const me = state.players.find((p) => p.id === myId)
    const card = me?.hand[localSnap.handIndex]
    const targetRect = card
      ? getRect(`[data-card-id="${CSS.escape(card.id)}"]`)
      : getRect(`[data-player-nameplate="${CSS.escape(myId)}"]`)

    controller.popOnCard({
      overlay,
      targetRect,
      asset: localSnap.ok ? FELIZ : ASSUSTADO,
      variant: localSnap.ok ? 'success' : 'shake',
      box: boxFor(130, [localSnap.ok ? FELIZ : ASSUSTADO]),
      onComplete: onConsumed,
    })
  }, [overlay, controller, localSnap, state.players, myId, onConsumed])

  // OUTRO como ator
  const prevLogLenRef = useRef<number | null>(null)
  useEffect(() => {
    if (!overlay) return
    if (prevLogLenRef.current === null) {
      prevLogLenRef.current = state.log.length
      return
    }
    if (state.log.length <= prevLogLenRef.current) {
      prevLogLenRef.current = state.log.length
      return
    }
    const newEntries = state.log.slice(prevLogLenRef.current)
    prevLogLenRef.current = state.log.length

    for (const entry of newEntries) {
      if (entry.type !== 'snap' && entry.type !== 'snap-fail') continue
      if (entry.actorId === myId) continue
      // Anima no nameplate do actor (não temos handIndex confiável aqui)
      const targetRect =
        getRect(`[data-opponent-nameplate="${CSS.escape(entry.actorId)}"]`) ??
        getRect(`[data-player-nameplate="${CSS.escape(entry.actorId)}"]`)
      const ok = entry.type === 'snap'
      controller.popOnCard({
        overlay,
        targetRect,
        asset: ok ? FELIZ : ASSUSTADO,
        variant: ok ? 'success' : 'shake',
        box: boxFor(130, [ok ? FELIZ : ASSUSTADO]),
      })
    }
  }, [overlay, controller, state.log, myId])
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 3.2: Ligar snap em MascotOverlay e GameArea

**Files:**
- Modify: `src/components/room2d/MascotOverlay.tsx`
- Modify: `src/components/room2d/GameArea.tsx`

- [ ] **Step 1: Adicionar `useSnapTrigger` no MascotOverlay**

Em `MascotOverlay.tsx`, adicionar:

```tsx
import { useSnapTrigger } from '@/lib/mascot-overlay/triggers/snap'

// dentro do componente, depois dos peek triggers:
useSnapTrigger({
  state,
  myId,
  overlay,
  controller,
  localSnap: localActions.snapResult,
  onConsumed: () => onSnapConsumed?.(),
})
```

Adicionar prop `onSnapConsumed`:

```ts
export type MascotOverlayProps = {
  state: RedactedState
  myId: string
  localActions: LocalMascotActions
  onPeekArrived?: (reveal: { rank: Rank; suit: Suit | null }) => void
  onSnapConsumed?: () => void
}
```

- [ ] **Step 2: Atualizar GameArea pra setar snapResult**

Em `handlePlayerCardClick`, dentro do bloco `if (canSnap)`:

```ts
if (canSnap) {
  if (handIndex >= me.hand.length) return
  const now = Date.now()
  if (now - lastSnapAt.current < 500) return
  lastSnapAt.current = now
  getSocket().emit('game:snap', { roomId: state.roomId, playerId: myId, handIndex }, (res: { ok?: true; error?: string }) => {
    if (res?.error && res.error !== 'INVALID_HAND_INDEX') toast.error(res.error)
    setLocalActions(prev => ({
      ...prev,
      snapResult: { handIndex, ok: !res?.error },
    }))
  })
}
```

Atualizar a chamada do MascotOverlay no JSX:

```tsx
<MascotOverlay
  state={state}
  myId={myId}
  localActions={localActions}
  onPeekArrived={(reveal) => {
    setRevealModal(reveal)
    setLocalActions(prev => ({ ...prev, peekRevealed: null }))
  }}
  onSnapConsumed={() => setLocalActions(prev => ({ ...prev, snapResult: null }))}
/>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 4: Verificação manual**

Em sessão real: dar **snap acertado** (cortar carta com mesmo rank do topo do descarte) → batinho-feliz pop na carta. Dar **snap errado** → batinho-assustado pop com shake na carta. Em outra aba, observar quando o oponente dá snap → batinho-feliz/assustado pop no nameplate do oponente.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mascot-overlay/triggers/snap.ts src/components/room2d/MascotOverlay.tsx src/components/room2d/GameArea.tsx
git commit -m "wire snap (success/fail) animations"
```

---

## Phase 4 — Troca (swap)

### Task 4.1: Criar trigger de swap

**Files:**
- Create: `src/lib/mascot-overlay/triggers/swap.ts`

- [ ] **Step 1: Criar o hook**

```ts
// src/lib/mascot-overlay/triggers/swap.ts
// Dispara runSwapDelivery quando:
// - EU dei swap: localActions.swapResolved set pelo GameArea no callback
// - OUTRO deu swap: state.log ganha { type: 'swap', actorId } com payload contendo
//   targetPlayerId/targetCardIndex/myCardIndex

import { useEffect, useRef } from 'react'
import type { RedactedState } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, FELIZ, TROCA } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlay: HTMLElement | null
  controller: Controller
  localSwap: { myCardId: string; opponentCardId: string } | null
  onConsumed: () => void
}

export function useSwapTrigger({ state, myId, overlay, controller, localSwap, onConsumed }: Args) {
  // EU como ator
  const lastLocalKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!overlay || !localSwap) return
    const key = `${localSwap.myCardId}:${localSwap.opponentCardId}`
    if (lastLocalKeyRef.current === key) return
    lastLocalKeyRef.current = key

    const fromRect = getRect('[data-discard-pile]')
    const midRect = getRect(`[data-card-id="${CSS.escape(localSwap.myCardId)}"]`)
    const toRect = getRect(`[data-card-id="${CSS.escape(localSwap.opponentCardId)}"]`)
    controller.runSwapDelivery({
      overlay,
      fromRect,
      midRect,
      toRect,
      travelAsset: FELIZ,
      carryAsset: TROCA,
      box: boxFor(140, [FELIZ, TROCA]),
      onComplete: onConsumed,
    })
  }, [overlay, controller, localSwap, onConsumed])

  // OUTRO como ator
  const prevLogLenRef = useRef<number | null>(null)
  useEffect(() => {
    if (!overlay) return
    if (prevLogLenRef.current === null) {
      prevLogLenRef.current = state.log.length
      return
    }
    if (state.log.length <= prevLogLenRef.current) {
      prevLogLenRef.current = state.log.length
      return
    }
    const newEntries = state.log.slice(prevLogLenRef.current)
    prevLogLenRef.current = state.log.length

    for (const entry of newEntries) {
      if (entry.type !== 'swap') continue
      if (entry.actorId === myId) continue
      const p = entry.payload as { targetPlayerId?: string; targetCardIndex?: number; myCardIndex?: number } | undefined
      if (!p || p.targetPlayerId === undefined || p.targetCardIndex === undefined || p.myCardIndex === undefined) continue

      const actorPlayer = state.players.find((pl) => pl.id === entry.actorId)
      const targetPlayer = state.players.find((pl) => pl.id === p.targetPlayerId)
      const actorCard = actorPlayer?.hand[p.myCardIndex]
      const targetCard = targetPlayer?.hand[p.targetCardIndex]
      if (!actorCard || !targetCard) continue

      const fromRect = getRect('[data-discard-pile]')
      const midRect = getRect(`[data-card-id="${CSS.escape(actorCard.id)}"]`)
      const toRect = getRect(`[data-card-id="${CSS.escape(targetCard.id)}"]`)
      controller.runSwapDelivery({
        overlay,
        fromRect,
        midRect,
        toRect,
        travelAsset: FELIZ,
        carryAsset: TROCA,
        box: boxFor(140, [FELIZ, TROCA]),
      })
    }
  }, [overlay, controller, state.log, state.players, myId])
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 4.2: Ligar swap em MascotOverlay e GameArea

**Files:**
- Modify: `src/components/room2d/MascotOverlay.tsx`
- Modify: `src/components/room2d/GameArea.tsx`

- [ ] **Step 1: Adicionar trigger no MascotOverlay**

```tsx
import { useSwapTrigger } from '@/lib/mascot-overlay/triggers/swap'

// dentro do componente:
useSwapTrigger({
  state,
  myId,
  overlay,
  controller,
  localSwap: localActions.swapResolved,
  onConsumed: () => onSwapConsumed?.(),
})
```

E adicionar prop:

```ts
export type MascotOverlayProps = {
  // ...existing
  onSwapConsumed?: () => void
}
```

- [ ] **Step 2: Setar swapResolved no GameArea**

Em `handleOpponentCardClick`, dentro do bloco `if (pendingEffect.type === 'swap' && mySwapPickIndex !== null)`:

```ts
if (pendingEffect.type === 'swap' && mySwapPickIndex !== null) {
  const myCard = me?.hand[mySwapPickIndex]
  const targetPlayer = state.players.find(p => p.id === opponentId)
  const targetCard = targetPlayer?.hand[handIndex]
  getSocket().emit('game:effect-target',
    { roomId: state.roomId, playerId: myId, targetPlayerId: opponentId, targetCardIndex: handIndex, myCardIndex: mySwapPickIndex },
    (res: { ok?: true; error?: string }) => {
      if (res?.error) { toast.error(res.error); return }
      setMySwapPickIndex(null)
      if (myCard && targetCard) {
        setLocalActions(prev => ({
          ...prev,
          swapResolved: { myCardId: myCard.id, opponentCardId: targetCard.id },
        }))
      }
    })
}
```

Atualizar JSX do MascotOverlay:

```tsx
<MascotOverlay
  state={state}
  myId={myId}
  localActions={localActions}
  onPeekArrived={(reveal) => {
    setRevealModal(reveal)
    setLocalActions(prev => ({ ...prev, peekRevealed: null }))
  }}
  onSnapConsumed={() => setLocalActions(prev => ({ ...prev, snapResult: null }))}
  onSwapConsumed={() => setLocalActions(prev => ({ ...prev, swapResolved: null }))}
/>
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 4: Verificação manual**

Em sessão de 2 jogadores: disparar efeito de **troca** (rank 10 ou J, depende da regra). Selecionar carta sua → carta do oponente. Esperado: mascote sai do descarte, vai até sua carta, swap de asset pra troca-de-cartas, segue até a carta do oponente, "drop" no alvo, sai. Visível em ambas as abas.

- [ ] **Step 5: Commit**

```bash
git add src/lib/mascot-overlay/triggers/swap.ts src/components/room2d/MascotOverlay.tsx src/components/room2d/GameArea.tsx
git commit -m "wire swap (troca) 2-leg animation"
```

---

## Phase 5 — Tempo Acabando

### Task 5.1: Criar trigger de tempo acabando

**Files:**
- Create: `src/lib/mascot-overlay/triggers/tempo-acabando.ts`

- [ ] **Step 1: Criar o hook**

```ts
// src/lib/mascot-overlay/triggers/tempo-acabando.ts
// 100% client-side. Cada cliente conta seu próprio "tempo desde última ação".
// Se passar threshold sem state.log/turn mudar, ancora batinho-tempo-acabando
// no nameplate do jogador atual. Some quando turno muda ou alguém age.

import { useEffect, useRef } from 'react'
import type { RedactedState } from '@/types/shared'
import type { Controller } from '@/lib/mascot-overlay'
import { boxFor, getRect, TEMPO } from '@/lib/mascot-overlay'

type Args = {
  state: RedactedState
  myId: string
  overlay: HTMLElement | null
  controller: Controller
}

const IDLE_THRESHOLD_MS = 15000

export function useTempoAcabandoTrigger({ state, myId, overlay, controller }: Args) {
  // refs pra acessar estado atual de dentro do interval sem recriar o setInterval
  // a cada socket update (state é objeto novo toda vez)
  const stateRef = useRef(state)
  const myIdRef = useRef(myId)
  stateRef.current = state
  myIdRef.current = myId

  const attachedRef = useRef<{ cancel: () => void } | null>(null)
  const turnStartRef = useRef<number>(Date.now())
  const lastTurnRef = useRef<number>(-1)
  const lastLogLenRef = useRef<number>(0)

  // Reset timer quando turno muda OU log cresce (alguém agiu)
  useEffect(() => {
    let dirty = false
    if (state.turn !== lastTurnRef.current) {
      lastTurnRef.current = state.turn
      dirty = true
    }
    if (state.log.length !== lastLogLenRef.current) {
      lastLogLenRef.current = state.log.length
      dirty = true
    }
    if (dirty) {
      turnStartRef.current = Date.now()
      attachedRef.current?.cancel()
      attachedRef.current = null
    }
  }, [state.turn, state.log.length])

  // Polling 1s pra ver se passou do threshold. Deps reduzidas pra não recriar
  // interval — estado lido via refs.
  useEffect(() => {
    if (!overlay) return
    const interval = setInterval(() => {
      const s = stateRef.current
      const me = myIdRef.current
      const currentPlayerId = s.players[s.turn]?.id
      if (!currentPlayerId) return
      if (attachedRef.current) return
      const elapsed = Date.now() - turnStartRef.current
      if (elapsed < IDLE_THRESHOLD_MS) return

      const selector =
        currentPlayerId === me
          ? `[data-player-nameplate="${CSS.escape(currentPlayerId)}"]`
          : `[data-opponent-nameplate="${CSS.escape(currentPlayerId)}"]`

      const anchorRect = getRect(selector)
      if (!anchorRect) return

      attachedRef.current = controller.attachLoop({
        overlay,
        anchorRect,
        asset: TEMPO,
        box: boxFor(110, [TEMPO]),
        position: 'top-right',
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [overlay, controller])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      attachedRef.current?.cancel()
      attachedRef.current = null
    }
  }, [])
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

---

### Task 5.2: Ligar tempo no MascotOverlay

**Files:**
- Modify: `src/components/room2d/MascotOverlay.tsx`

- [ ] **Step 1: Adicionar import + chamada do hook**

```tsx
import { useTempoAcabandoTrigger } from '@/lib/mascot-overlay/triggers/tempo-acabando'

// dentro do componente, junto com os outros triggers:
useTempoAcabandoTrigger({ state, myId, overlay, controller })
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 3: Verificação manual**

Em sessão: deixar o jogador atual sem agir por **15 segundos** (não comprar carta, não dar snap, etc). Esperado: batinho-tempo-acabando aparece flutuando no canto superior direito do nameplate dele, com bobbing loop. Quando ele age (ou turno muda), o batinho some.

- [ ] **Step 4: Commit**

```bash
git add src/lib/mascot-overlay/triggers/tempo-acabando.ts src/components/room2d/MascotOverlay.tsx
git commit -m "wire tempo-acabando attach-loop animation"
```

---

## Phase 6 — Cleanup

### Task 6.1: Refatorar test page pra usar a lib

**Files:**
- Modify: `src/app/test-mascot-overlay/page.tsx`

- [ ] **Step 1: Substituir as funções inline pelos imports da lib**

Substituir o conteúdo do `page.tsx` por uma versão que usa `createController()` da lib + `boxFor`/`getRect`. As 4 primitivas devem vir de `@/lib/mascot-overlay` em vez de estar inline.

Estrutura:

```tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createController,
  boxFor,
  FELIZ, LUPA, ESPIADINHA, TROCA, ASSUSTADO, TEMPO,
} from '@/lib/mascot-overlay'

export default function TestMascotOverlay() {
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const [overlay, setOverlay] = useState<HTMLElement | null>(null)
  const controller = useMemo(() => createController(), [])
  const [logs, setLogs] = useState<string[]>([])
  const discardRef = useRef<HTMLDivElement>(null)
  const cardARef = useRef<HTMLDivElement>(null)
  const cardBRef = useRef<HTMLDivElement>(null)
  const cardCRef = useRef<HTMLDivElement>(null)
  const oppNameRef = useRef<HTMLDivElement>(null)
  const tempoCancelRef = useRef<{ cancel: () => void } | null>(null)

  useEffect(() => { setOverlay(overlayRef.current) }, [])

  const log = (msg: string) => setLogs(prev => [...prev.slice(-12), `${new Date().toISOString().slice(11, 23)} ${msg}`])

  function runPeek(target: React.RefObject<HTMLDivElement | null>, arrivalAsset: string, label: string) {
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

  // [resto do JSX da página igual ao atual — só os refs e botões]
  return (
    <main>...</main>
  )
}
```

(O JSX dos botões e do tabuleiro mock fica igual ao da versão atual, só remova as funções inline.)

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 3: Verificação manual**

Recarregar `/test-mascot-overlay`. Todas as 4 categorias de botão (PEEK, SNAP, SWAP, TEMPO) devem continuar funcionando idênticas à versão pré-refactor.

- [ ] **Step 4: Commit**

```bash
git add src/app/test-mascot-overlay/page.tsx
git commit -m "test page: use shared mascot-overlay lib instead of inline impl"
```

---

### Task 6.2: Documentar script de assets em scripts/README

**Files:**
- Create or Modify: `scripts/README.md`

- [ ] **Step 1: Adicionar ou criar seção do mascot script**

Se `scripts/README.md` existe, append. Se não, criar com:

```markdown
# Scripts

## optimize-mascot.mjs

Converte PNG de mascote (com checkerboard de fundo baked) em WebP com alpha limpo. Usa flood-fill de borda pra remover pixels gray-ish.

Uso:

```bash
node scripts/optimize-mascot.mjs <input.png> <output.webp> [width=1024]
```

Exemplo:

```bash
node scripts/optimize-mascot.mjs ~/Downloads/batinho-cartas/batinho-novo.png public/batinho/batinho-novo.webp
```

Após gerar, adicionar o caminho ao `src/lib/mascot.ts` (se for skin/avatar) ou ao `src/lib/mascot-overlay/assets.ts` (se for usado em animação).
```

- [ ] **Step 2: Commit**

```bash
git add scripts/README.md
git commit -m "docs: explain optimize-mascot.mjs script"
```

---

## Verificação final

- [ ] **Step 1: Typecheck completo**

Run: `pnpm typecheck`
Expected: zero erros.

- [ ] **Step 2: Smoke test em sessão real**

Rodar `pnpm dev`. Em 2 abas, criar sala, jogar uma partida completa. Verificar:
- Olhadinha (peek-own) anima corretamente, modal abre depois
- Espiadinha (peek-other) anima corretamente, modal abre depois
- Snap acertado → batinho-feliz pop na carta
- Snap errado → batinho-assustado pop com shake
- Troca → 2-leg flight com swap de asset no meio
- Tempo acabando → aparece após 15s de inatividade, some quando age/turno muda

- [ ] **Step 3: Verificar com `prefers-reduced-motion`**

Ligar "Reduzir movimento" no macOS (Sistema > Acessibilidade > Vídeo). Recarregar `/test-mascot-overlay` ou jogo. Esperado: nenhuma animação visível, mas modais/callbacks continuam funcionando.

- [ ] **Step 4: Push pra remote**

```bash
git push origin main
```

(Confirmar com o user antes de push se houver dúvida.)
