# Festa BR Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a UI atual do Bate pela identidade "Festa BR" (paleta cream/red/gold, fontes Bowlby+Fredoka, bordas pretas grossas com hard-shadow offset) e trocar todo o baralho pelos 15 PNGs do mascote Batinho.

**Architecture:** Refactor incremental do tema. Camadas: (1) assets otimizados em `public/cards/`, (2) tokens Tailwind + fontes globais, (3) Card2D virou `<img>` simples, (4) cada componente restilizado isoladamente substituindo `cabo-*` por `bate-*`. Sem mudanças em game logic, types ou backend.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind 3 + framer-motion + anime.js + Zustand + sharp (build-time pra otimização).

**Working dir:** `/Users/matheusdev/projects/bate-frontend`

---

## Spec referência

`docs/superpowers/specs/2026-05-24-festa-br-redesign-design.md`

## File map

**Criar:**
- `public/cards/raw/batinho-*.png` (15 arquivos, copiados de Downloads)
- `public/cards/*.webp` (15 arquivos, output do script)
- `scripts/optimize-cards.mjs` (script de otimização sharp)

**Modificar:**
- `tailwind.config.ts` — paleta + fontFamily
- `src/app/globals.css` — imports de fontes + body bg
- `src/app/layout.tsx` — fontes Next.js (Fredoka + Bowlby One + Caveat)
- `src/lib/card-meta.ts` — campo `image` por rank + constante `CARD_BACK_IMAGE`
- `src/components/room2d/Card2D.tsx` — refactor: usar `<img>` em vez de CardFace
- `src/components/room2d/CardBack.tsx` — refactor: usar `<img>` do verso
- 24 outros componentes — substituir `cabo-*` por `bate-*` + aplicar bordas/sombras Festa BR

**Deletar:**
- `src/components/room2d/CardFace.tsx`

**Não tocar:**
- `src/lib/sounds.ts` (usa "cabo-called" como nome de evento de jogo, não cor)
- `src/types/shared.ts`
- `src/lib/store.ts`, `src/lib/socket-client.ts`, `src/lib/player-id.ts`

## Testing strategy

Frontend não tem testes automatizados. Validação em cada tarefa:
1. **`npx tsc --noEmit`** — typecheck precisa passar
2. **`pnpm dev`** + visual check no browser quando muda algo renderizável
3. **`pnpm build`** apenas na última tarefa antes do commit final

## Token mapping (find/replace reference)

Tabela de tradução. Usada várias vezes ao longo do plano:

| `cabo-*` antigo | `bate-*` novo | Quando usar |
|---|---|---|
| `cabo-bg` | `bate-cream` | Fundos principais |
| `cabo-surface` | `bate-paper` | Superfícies elevadas (cards, inputs, modais) |
| `cabo-cream` | `bate-paper` | (eram quase iguais antes; agora paper é o mais claro) |
| `cabo-purple` | `bate-ink` | Era usado como cor secundária de texto — vira marrom-tinta |
| `cabo-accent` | `bate-red` | CTAs urgentes, "BATE", autor de ação |
| `cabo-gold` | `bate-gold` | Cartas OURO, botão principal, vitória |
| `cabo-felt` | `bate-green` | Feedback positivo (snap-success) |
| `cabo-red` | `bate-red-deep` | Sombras de vermelho |
| `cabo-success` | `bate-green` | Sucesso |
| `cabo-danger` | `bate-red` | Erros (consolidado em red) |

---

## Phase 1 — Assets

### Task 1: Copy raw Batinho PNGs into the project

**Files:**
- Create: `public/cards/raw/batinho-as.png`
- Create: `public/cards/raw/batinho-2.png` … `public/cards/raw/batinho-9.png`
- Create: `public/cards/raw/batinho-olhadinha.png`
- Create: `public/cards/raw/batinho-espiadinha.png`
- Create: `public/cards/raw/batinho-troca.png`
- Create: `public/cards/raw/batinho-k-3.png`
- Create: `public/cards/raw/batinho-joker.png`
- Create: `public/cards/raw/bate-verso-de-carta.png`

- [ ] **Step 1: Create the target directory**

Run:
```bash
mkdir -p /Users/matheusdev/projects/bate-frontend/public/cards/raw
```

- [ ] **Step 2: Copy all PNGs**

Run:
```bash
cp /Users/matheusdev/Downloads/batinho-cartas/*.png /Users/matheusdev/projects/bate-frontend/public/cards/raw/
```

- [ ] **Step 3: Verify all 15 files copied**

Run:
```bash
ls /Users/matheusdev/projects/bate-frontend/public/cards/raw/ | wc -l
```

Expected: `15`

- [ ] **Step 4: Commit**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git add public/cards/raw/
git commit -m "chore: add raw Batinho card art (PNGs from designer)"
```

---

### Task 2: Install sharp and create optimization script

**Files:**
- Create: `scripts/optimize-cards.mjs`
- Modify: `package.json` (add sharp dependency and script)

- [ ] **Step 1: Install sharp as dev dependency**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
pnpm add -D sharp
```

- [ ] **Step 2: Create the optimization script**

Write to `/Users/matheusdev/projects/bate-frontend/scripts/optimize-cards.mjs`:

```javascript
import { readdir } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import sharp from 'sharp'

const RAW_DIR = 'public/cards/raw'
const OUT_DIR = 'public/cards'
const WIDTH = 320
const HEIGHT = 448
const QUALITY = 85

const NAME_MAP = {
  'batinho-as': 'batinho-as',
  'batinho-2': 'batinho-2',
  'batinho-3': 'batinho-3',
  'batinho-4': 'batinho-4',
  'batinho-5': 'batinho-5',
  'batinho-6': 'batinho-6',
  'batinho-7': 'batinho-7',
  'batinho-8': 'batinho-8',
  'batinho-9': 'batinho-9',
  'batinho-olhadinha': 'batinho-olhadinha',
  'batinho-espiadinha': 'batinho-espiadinha',
  'batinho-troca': 'batinho-troca',
  'batinho-k-3': 'batinho-k',
  'batinho-joker': 'batinho-joker',
  'bate-verso-de-carta': 'back',
}

const files = await readdir(RAW_DIR)
const pngs = files.filter(f => extname(f).toLowerCase() === '.png')

if (pngs.length === 0) {
  console.error('No PNGs found in', RAW_DIR)
  process.exit(1)
}

let totalRaw = 0
let totalOut = 0

for (const file of pngs) {
  const stem = basename(file, '.png')
  const outName = NAME_MAP[stem]
  if (!outName) {
    console.warn(`Skipping unmapped file: ${file}`)
    continue
  }
  const inPath = join(RAW_DIR, file)
  const outPath = join(OUT_DIR, `${outName}.webp`)
  const result = await sharp(inPath)
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .webp({ quality: QUALITY })
    .toFile(outPath)
  const rawSize = (await sharp(inPath).metadata()).size ?? 0
  totalRaw += rawSize
  totalOut += result.size
  const ratio = rawSize > 0 ? ((1 - result.size / rawSize) * 100).toFixed(0) : '?'
  console.log(`${file} -> ${outName}.webp  ${(result.size / 1024).toFixed(0)}KB (-${ratio}%)`)
}

console.log(`\nTotal: ${(totalRaw / 1024 / 1024).toFixed(1)}MB -> ${(totalOut / 1024).toFixed(0)}KB`)
```

- [ ] **Step 3: Add npm script for convenience**

Modify `/Users/matheusdev/projects/bate-frontend/package.json` — add to the `scripts` object:

```json
"optimize-cards": "node scripts/optimize-cards.mjs"
```

So the scripts block ends up like:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start -p ${PORT:-3000}",
  "typecheck": "tsc --noEmit",
  "optimize-cards": "node scripts/optimize-cards.mjs"
},
```

- [ ] **Step 4: Run the script to produce optimized WebPs**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
pnpm optimize-cards
```

Expected output: 15 lines like `batinho-as.png -> batinho-as.webp  42KB (-96%)`, ending with `Total: 15.4MB -> 700KB` (approximate).

- [ ] **Step 5: Verify output files**

Run:
```bash
ls /Users/matheusdev/projects/bate-frontend/public/cards/*.webp | wc -l
```

Expected: `15`

- [ ] **Step 6: Commit**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git add scripts/optimize-cards.mjs package.json pnpm-lock.yaml public/cards/*.webp
git commit -m "build: add sharp-based card optimizer producing 320x448 WebPs"
```

---

## Phase 2 — Theme foundation

### Task 3: Replace Tailwind palette with bate-* tokens

**Files:**
- Modify: `tailwind.config.ts` (full rewrite of `colors` and `fontFamily` blocks)

- [ ] **Step 1: Rewrite tailwind.config.ts**

Write to `/Users/matheusdev/projects/bate-frontend/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bate: {
          cream: '#f5e9c9',
          paper: '#fff5d1',
          ink: '#1a0e08',
          red: '#d63232',
          'red-deep': '#8b1a1a',
          gold: '#ffb81c',
          green: '#4a7c4f',
          teal: '#2c8a9c',
          silver: '#d3d3d3',
        },
      },
      fontFamily: {
        display: ['var(--font-bowlby)', 'system-ui', 'sans-serif'],
        body: ['var(--font-fredoka)', 'system-ui', 'sans-serif'],
        hand: ['var(--font-caveat)', 'cursive'],
      },
      boxShadow: {
        'hard-sm': '3px 3px 0 #1a0e08',
        'hard': '5px 5px 0 #1a0e08',
        'hard-lg': '6px 7px 0 #1a0e08',
        'hard-red': '5px 5px 0 #d63232',
      },
    },
  },
  plugins: [],
}

export default config
```

- [ ] **Step 2: Verify typecheck still passes (existing cabo-* refs will break runtime visuals but TS shouldn't care because Tailwind classes are strings)**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
npx tsc --noEmit
```

Expected: `TypeScript compilation completed` with no errors.

- [ ] **Step 3: DO NOT commit yet — palette swap will be committed in Task 7 together with all `cabo-*` → `bate-*` replacements (one atomic visual change)**

---

### Task 4: Load Bowlby One + Fredoka + Caveat fonts in layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

Write to `/Users/matheusdev/projects/bate-frontend/src/app/layout.tsx`:

```tsx
import './globals.css'
import type { Metadata } from 'next'
import { Fredoka, Bowlby_One, Caveat } from 'next/font/google'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

const bowlby = Bowlby_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bowlby',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bate — Cabo brasileiro multiplayer',
  description: 'Cabo brasileiro online: rápido, gratuito, 2-4 jogadores.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${bowlby.variable} ${caveat.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Update globals.css to use new palette token**

Write to `/Users/matheusdev/projects/bate-frontend/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body {
  background: theme('colors.bate.cream');
  color: theme('colors.bate.ink');
  min-height: 100vh;
}
```

- [ ] **Step 3: Typecheck**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
npx tsc --noEmit
```

Expected: `TypeScript compilation completed`.

- [ ] **Step 4: DO NOT commit yet — bundled with Task 7**

---

## Phase 3 — Card layer

### Task 5: Add `image` field to card-meta.ts and `CARD_BACK_IMAGE` constant

**Files:**
- Modify: `src/lib/card-meta.ts`

- [ ] **Step 1: Rewrite card-meta.ts**

Write to `/Users/matheusdev/projects/bate-frontend/src/lib/card-meta.ts`:

```typescript
import type { Rank } from '@/types/shared'

export type CardKind = 'numeric' | 'action' | 'silver' | 'gold'

export type CardMeta = {
  pointValue: number
  kind: CardKind
  image: string
  displayName?: string
  abilityText?: string
  iconName?: 'Eye' | 'Search' | 'ArrowLeftRight' | 'Award' | 'Trophy'
}

export const CARD_BACK_IMAGE = '/cards/back.webp'

export const CARD_META: Record<Rank, CardMeta> = {
  'A': { pointValue: 1, kind: 'numeric', image: '/cards/batinho-as.webp' },
  '2': { pointValue: 2, kind: 'numeric', image: '/cards/batinho-2.webp' },
  '3': { pointValue: 3, kind: 'numeric', image: '/cards/batinho-3.webp' },
  '4': { pointValue: 4, kind: 'numeric', image: '/cards/batinho-4.webp' },
  '5': { pointValue: 5, kind: 'numeric', image: '/cards/batinho-5.webp' },
  '6': { pointValue: 6, kind: 'numeric', image: '/cards/batinho-6.webp' },
  '7': { pointValue: 7, kind: 'numeric', image: '/cards/batinho-7.webp' },
  '8': { pointValue: 8, kind: 'numeric', image: '/cards/batinho-8.webp' },
  '9': { pointValue: 9, kind: 'numeric', image: '/cards/batinho-9.webp' },
  '10': {
    pointValue: 10,
    kind: 'action',
    image: '/cards/batinho-olhadinha.webp',
    displayName: 'OLHADINHA',
    abilityText: 'Espia 1 carta SUA',
    iconName: 'Eye',
  },
  'J': {
    pointValue: 11,
    kind: 'action',
    image: '/cards/batinho-espiadinha.webp',
    displayName: 'ESPIADINHA',
    abilityText: 'Espia 1 carta de OUTRO',
    iconName: 'Search',
  },
  'Q': {
    pointValue: 12,
    kind: 'action',
    image: '/cards/batinho-troca.webp',
    displayName: 'TROCA',
    abilityText: 'Troca carta com outro jogador',
    iconName: 'ArrowLeftRight',
  },
  'K': {
    pointValue: -3,
    kind: 'silver',
    image: '/cards/batinho-k.webp',
    displayName: 'PRATA',
    abilityText: 'Vale −3 pontos',
    iconName: 'Award',
  },
  'JOKER': {
    pointValue: -6,
    kind: 'gold',
    image: '/cards/batinho-joker.webp',
    displayName: 'OURO',
    abilityText: 'Vale −6 pontos',
    iconName: 'Trophy',
  },
}

export function formatPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
npx tsc --noEmit
```

Expected: `TypeScript compilation completed`.

- [ ] **Step 3: Commit**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/lib/card-meta.ts
git commit -m "feat(cards): add image field per rank pointing to optimized WebPs"
```

---

### Task 6: Refactor Card2D to render `<img>` and rewrite CardBack; delete CardFace

**Files:**
- Modify: `src/components/room2d/Card2D.tsx` (full rewrite)
- Modify: `src/components/room2d/CardBack.tsx` (full rewrite)
- Delete: `src/components/room2d/CardFace.tsx`

- [ ] **Step 1: Rewrite Card2D.tsx**

Write to `/Users/matheusdev/projects/bate-frontend/src/components/room2d/Card2D.tsx`:

```tsx
'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { Eye, ArrowLeftRight } from 'lucide-react'
import type { RedactedCard, Rank, Suit } from '@/types/shared'
import { CardBack } from './CardBack'
import { CARD_META, formatPoints } from '@/lib/card-meta'

function tooltipFor(rank: Rank): string {
  const meta = CARD_META[rank]
  const points = formatPoints(meta.pointValue)
  if (meta.displayName) return `${meta.displayName} (${points} pts) — ${meta.abilityText ?? ''}`
  return `${rank} (${points} pts)`
}

type VictimEffect = 'peeked' | 'swapped'

type Props = {
  card: RedactedCard
  tempRevealedAs?: { rank: Rank; suit: Suit | null } | null
  onClick?: () => void
  highlighted?: boolean
  victimEffect?: VictimEffect | null
  size?: 'sm' | 'md' | 'lg'
  draggable?: boolean
} & Omit<HTMLMotionProps<'button'>, 'onClick' | 'children'>

const SIZE_CLASSES: Record<NonNullable<Props['size']>, string> = {
  sm: 'w-14 h-20',
  md: 'w-20 h-28',
  lg: 'w-28 h-40',
}

const VICTIM_SHADOW: Record<VictimEffect, string> = {
  peeked: '0 0 28px 8px rgba(255, 184, 28, 0.85), 5px 5px 0 #1a0e08',
  swapped: '0 0 28px 8px rgba(214, 50, 50, 0.85), 5px 5px 0 #1a0e08',
}

export function Card2D({ card, tempRevealedAs = null, onClick, highlighted = false, victimEffect = null, size = 'md', ...rest }: Props) {
  const isHidden = 'hidden' in card
  const effectiveRank: Rank | null = tempRevealedAs?.rank ?? (!isHidden ? card.rank : null)
  const showFace = !!effectiveRank
  const imageSrc = effectiveRank ? CARD_META[effectiveRank].image : null
  const tooltip = effectiveRank ? tooltipFor(effectiveRank) : undefined

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={onClick ? { scale: 1.08, y: -8 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      animate={{
        rotateY: showFace ? 0 : 180,
        boxShadow: victimEffect
          ? VICTIM_SHADOW[victimEffect]
          : highlighted
            ? '0 0 18px 4px rgba(255, 184, 28, 0.7), 5px 5px 0 #1a0e08'
            : '5px 5px 0 #1a0e08',
      }}
      transition={{ rotateY: { duration: 0.45, ease: 'easeOut' }, boxShadow: { duration: 0.25 } }}
      style={{ transformStyle: 'preserve-3d' }}
      className={`relative ${SIZE_CLASSES[size]} rounded-xl select-none border-[3px] border-bate-ink bg-bate-paper overflow-hidden ${onClick ? 'cursor-pointer' : 'cursor-default'} disabled:cursor-default ${victimEffect ? 'animate-pulse' : ''}`}
      disabled={!onClick}
      title={tooltip}
      {...rest}
    >
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
      >
        {showFace && imageSrc ? (
          <img
            src={imageSrc}
            alt={effectiveRank ?? ''}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <CardBack />
        )}
      </div>
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        <CardBack />
      </div>
      {victimEffect && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.3, 1], opacity: 1 }}
          transition={{ duration: 0.4 }}
          className={`absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-hard-sm border-[3px] border-bate-ink z-10 ${victimEffect === 'peeked' ? 'bg-bate-gold text-bate-ink' : 'bg-bate-red text-white'}`}
        >
          {victimEffect === 'peeked' ? <Eye size={18} strokeWidth={3} /> : <ArrowLeftRight size={18} strokeWidth={3} />}
        </motion.div>
      )}
    </motion.button>
  )
}
```

- [ ] **Step 2: Rewrite CardBack.tsx**

Write to `/Users/matheusdev/projects/bate-frontend/src/components/room2d/CardBack.tsx`:

```tsx
'use client'

import { CARD_BACK_IMAGE } from '@/lib/card-meta'

export function CardBack() {
  return (
    <img
      src={CARD_BACK_IMAGE}
      alt=""
      className="w-full h-full object-cover"
      draggable={false}
    />
  )
}
```

- [ ] **Step 3: Delete CardFace.tsx**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
rm src/components/room2d/CardFace.tsx
```

- [ ] **Step 4: Typecheck**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
npx tsc --noEmit
```

Expected: `TypeScript compilation completed`. If error about unused imports anywhere referring to CardFace, fix those imports.

- [ ] **Step 5: Smoke test in browser**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 pnpm dev
```

Open `http://localhost:3000`. (Lobby ainda usa cores antigas — esperado.) Crie sala e entre. Cards na mesa devem renderizar como as imagens do Batinho. Verso (cartas dos oponentes) deve mostrar o `bate-verso-de-carta`. Animações flip ao virar carta devem funcionar.

Pare o dev server com Ctrl+C antes de seguir.

- [ ] **Step 6: Commit**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/components/room2d/Card2D.tsx src/components/room2d/CardBack.tsx src/components/room2d/CardFace.tsx
git commit -m "feat(cards): replace internal CardFace layout with Batinho artwork"
```

---

## Phase 4 — Lobby restyle

### Task 7: Rewrite page.tsx + lobby components with Festa BR identity

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/lobby/Hero.tsx`
- Modify: `src/components/lobby/QuickRules.tsx`
- Modify: `src/components/lobby/Avatar.tsx` (no token usage, only label colors — minor)
- Modify: `src/components/lobby/MuteToggle.tsx`
- Modify: `src/components/lobby/Footer.tsx`
- Modify: `src/components/lobby/RoomList.tsx`
- Modify: `src/components/lobby/CreateRoomDialog.tsx`

This is the atomic palette-swap commit. After this commit Lobby reflects the new identity end-to-end.

- [ ] **Step 1: Rewrite Hero.tsx to float real Batinho cards**

Write to `/Users/matheusdev/projects/bate-frontend/src/components/lobby/Hero.tsx`:

```tsx
'use client'

import { motion } from 'framer-motion'
import { CARD_META } from '@/lib/card-meta'
import type { Rank } from '@/types/shared'

type FloatingCard = { rank: Rank; left: string; top: string; delay: number; rotate: number }

const FLOATERS: FloatingCard[] = [
  { rank: 'JOKER', left: '6%', top: '10%', delay: 0, rotate: -14 },
  { rank: 'K', left: '82%', top: '6%', delay: 0.4, rotate: 12 },
  { rank: 'Q', left: '12%', top: '64%', delay: 0.8, rotate: 8 },
  { rank: '10', left: '84%', top: '60%', delay: 1.2, rotate: -10 },
]

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-bate-cream border-[4px] border-bate-ink px-6 py-12 sm:py-16 mb-10 shadow-hard-lg">
      <div className="absolute inset-0 pointer-events-none">
        {FLOATERS.map((f, i) => (
          <motion.div
            key={f.rank}
            initial={{ y: 0, rotate: f.rotate, opacity: 0 }}
            animate={{ y: [0, -14, 0], rotate: [f.rotate, f.rotate + 4, f.rotate], opacity: 1 }}
            transition={{
              y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: f.delay },
              rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: f.delay },
              opacity: { duration: 0.6, delay: f.delay },
            }}
            style={{ position: 'absolute', left: f.left, top: f.top }}
            className="hidden sm:block w-20 h-28 rounded-xl border-[3px] border-bate-ink shadow-hard overflow-hidden"
          >
            <img src={CARD_META[f.rank].image} alt="" className="w-full h-full object-cover" draggable={false} />
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <motion.h1
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 240, damping: 16 }}
          className="font-display text-7xl sm:text-8xl text-bate-red mb-3 tracking-tight"
          style={{
            WebkitTextStroke: '3px #1a0e08',
            textShadow: '6px 6px 0 #1a0e08, 6px 6px 0 #ffb81c, 8px 8px 0 #1a0e08',
            transform: 'rotate(-2deg)',
            display: 'inline-block',
          }}
        >
          BATE!
        </motion.h1>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <span className="inline-block font-display text-bate-gold bg-bate-ink px-3 py-1 rounded shadow-hard-red rotate-1 text-xs tracking-[0.2em]">
            CABO BRASILEIRO MULTIPLAYER
          </span>
        </motion.div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="font-body text-bate-ink/70 text-sm sm:text-base mt-3"
        >
          2 a 4 jogadores • sem cadastro • partida em 5 minutos
        </motion.p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Rewrite QuickRules.tsx**

Write to `/Users/matheusdev/projects/bate-frontend/src/components/lobby/QuickRules.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Eye, Search, ArrowLeftRight, Award, Trophy } from 'lucide-react'
import { CARD_META, formatPoints } from '@/lib/card-meta'
import type { Rank } from '@/types/shared'

const ICONS = { Eye, Search, ArrowLeftRight, Award, Trophy } as const
const SPECIAL_RANKS: Rank[] = ['10', 'J', 'Q', 'K', 'JOKER']

export function QuickRules() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border-[3px] border-bate-ink bg-bate-paper overflow-hidden mb-8 shadow-hard">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-bate-cream transition-colors"
      >
        <span className="font-display text-bate-ink flex items-center gap-2">
          📖 COMO JOGAR?
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-bate-ink" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 text-sm text-bate-ink border-t-[3px] border-bate-ink/20 pt-4">
              <section>
                <h4 className="font-display text-bate-red mb-2">🎯 OBJETIVO</h4>
                <p>
                  Ter a <strong>menor pontuação</strong> ao chamar BATE. Cartas valem o número impresso; <span className="font-bold text-bate-red">PRATA vale −3</span> e <span className="font-bold text-bate-red">OURO vale −6</span>.
                </p>
              </section>

              <section>
                <h4 className="font-display text-bate-red mb-2">🃏 CARTAS ESPECIAIS</h4>
                <ul className="space-y-2">
                  {SPECIAL_RANKS.map(rank => {
                    const meta = CARD_META[rank]
                    const Icon = meta.iconName ? ICONS[meta.iconName] : null
                    const isNegative = meta.pointValue < 0
                    return (
                      <li key={rank} className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border-[2px] border-bate-ink ${isNegative ? 'bg-bate-gold' : 'bg-bate-teal text-bate-paper'}`}>
                          {Icon ? <Icon size={18} strokeWidth={2.5} /> : <span className="font-display text-xs">{rank}</span>}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-sm">
                            {meta.displayName} <span className={`font-body text-xs ml-1 ${isNegative ? 'text-bate-red font-bold' : 'text-bate-ink/60'}`}>({formatPoints(meta.pointValue)} pts)</span>
                          </div>
                          <div className="text-xs text-bate-ink/60">{meta.abilityText}</div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section>
                <h4 className="font-display text-bate-red mb-2">🔄 SEU TURNO</h4>
                <ol className="space-y-1 list-decimal list-inside text-bate-ink/80">
                  <li><strong>Compra</strong> uma carta do baralho</li>
                  <li><strong>Decide</strong>: descartar (usando o efeito se for especial) ou trocar com uma das suas 4</li>
                  <li><strong>Ou</strong> chama BATE se achar que tá com menos pontos</li>
                </ol>
                <p className="text-xs text-bate-ink/60 mt-2">Depois de chamar BATE, cada adversário tem 1 último turno antes da contagem.</p>
              </section>

              <a
                href="https://github.com/matheusmski1/bate-backend/blob/main/RULES.md"
                target="_blank"
                rel="noreferrer"
                className="block text-center text-bate-red hover:text-bate-red-deep underline text-xs font-body"
              >
                Ver regras completas →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite MuteToggle.tsx**

Write to `/Users/matheusdev/projects/bate-frontend/src/components/lobby/MuteToggle.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { getVolumeNow, setVolume } from '@/lib/sounds'

const DEFAULT_VOL = 0.5

export function MuteToggle() {
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    setMuted(getVolumeNow() === 0)
  }, [])

  function toggle() {
    const nextMuted = !muted
    setVolume(nextMuted ? 0 : DEFAULT_VOL)
    setMuted(nextMuted)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={muted ? 'Ativar som' : 'Desativar som'}
      title={muted ? 'Ativar som' : 'Desativar som'}
      className="w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold hover:scale-110 transition-all"
    >
      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  )
}
```

- [ ] **Step 4: Rewrite Footer.tsx**

Write to `/Users/matheusdev/projects/bate-frontend/src/components/lobby/Footer.tsx`:

```tsx
'use client'

import { Code2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-16 text-center text-xs text-bate-ink/60 space-y-2 font-body">
      <div className="flex justify-center items-center gap-4">
        <a
          href="https://github.com/matheusmski1/bate-backend/blob/main/RULES.md"
          target="_blank"
          rel="noreferrer"
          className="hover:text-bate-red transition-colors"
        >
          Regras completas
        </a>
        <span>•</span>
        <a
          href="https://github.com/matheusmski1/bate-frontend"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-bate-red transition-colors"
        >
          <Code2 size={12} /> Código
        </a>
        <span>•</span>
        <a
          href="mailto:matheusmski1@gmail.com?subject=Bate%20-%20feedback"
          className="hover:text-bate-red transition-colors"
        >
          Feedback
        </a>
      </div>
      <div>Beta • feito com ☕ em SC</div>
    </footer>
  )
}
```

- [ ] **Step 5: Rewrite RoomList.tsx**

Write to `/Users/matheusdev/projects/bate-frontend/src/components/lobby/RoomList.tsx`:

```tsx
'use client'

import { Users } from 'lucide-react'
import type { RoomSummary } from '@/types/shared'

export function RoomList({ rooms, onJoin, onCreate }: { rooms: RoomSummary[]; onJoin: (id: string) => void; onCreate?: () => void }) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 bg-bate-paper rounded-2xl border-[3px] border-dashed border-bate-ink/40 shadow-hard">
        <div className="text-5xl mb-3">🃏</div>
        <p className="font-display text-bate-ink mb-1">NENHUMA SALA ABERTA</p>
        <p className="text-bate-ink/60 text-sm mb-5 font-body">Seja o primeiro a abrir uma mesa!</p>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="px-5 py-3 rounded-xl bg-bate-gold border-[3px] border-bate-ink shadow-hard-sm font-display text-bate-ink hover:scale-105 transition-transform"
          >
            + CRIAR A PRIMEIRA SALA
          </button>
        )}
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {rooms.map(room => {
        const isFull = room.playerCount >= room.maxPlayers
        const inGame = room.phase !== 'waiting'
        const disabled = isFull || inGame
        return (
          <li key={room.roomId} className="flex justify-between items-center bg-bate-paper rounded-xl px-5 py-4 border-[3px] border-bate-ink shadow-hard-sm">
            <div>
              <div className="font-display text-bate-ink text-lg">{room.name}</div>
              <div className="text-sm text-bate-ink/70 flex items-center gap-2 font-body">
                <Users size={14} /> {room.playerCount}/{room.maxPlayers}
                <span>•</span>
                <span className={inGame ? 'text-bate-red font-bold' : 'text-bate-green font-bold'}>
                  {inGame ? 'em jogo' : 'aguardando'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onJoin(room.roomId)}
              disabled={disabled}
              className="px-5 py-2 rounded-lg bg-bate-green text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-bate-ink/30"
            >
              {isFull ? 'CHEIA' : inGame ? 'EM JOGO' : 'ENTRAR'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 6: Rewrite CreateRoomDialog.tsx**

Write to `/Users/matheusdev/projects/bate-frontend/src/components/lobby/CreateRoomDialog.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'

export function CreateRoomDialog({ hostName, onCreated, onClose }: { hostName: string; onCreated: (roomId: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4)
  const [submitting, setSubmitting] = useState(false)

  function submit() {
    if (!name.trim()) return
    setSubmitting(true)
    getSocket().emit(
      'room:create',
      { name: name.trim(), hostId: getPlayerId(), hostName, maxPlayers },
      (res: { roomId?: string; error?: string }) => {
        setSubmitting(false)
        if (res.error) {
          alert(`Erro: ${res.error}`)
          return
        }
        if (res.roomId) onCreated(res.roomId)
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bate-cream rounded-2xl p-7 w-full max-w-md border-[4px] border-bate-ink shadow-hard-lg" onClick={e => e.stopPropagation()}>
        <h3 className="font-display text-2xl text-bate-red mb-6">CRIAR SALA</h3>
        <label className="block mb-2 text-sm font-display text-bate-ink">NOME DA SALA</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 mb-4 rounded-xl bg-bate-paper text-bate-ink border-[3px] border-bate-ink shadow-hard-sm font-body font-semibold focus:outline-none focus:bg-white"
          maxLength={30}
          autoFocus
        />
        <label className="block mb-2 text-sm font-display text-bate-ink">MÁXIMO DE JOGADORES</label>
        <div className="flex gap-2 mb-6">
          {([2, 3, 4] as const).map(n => (
            <button
              key={n}
              onClick={() => setMaxPlayers(n)}
              className={`flex-1 py-3 rounded-xl font-display border-[3px] border-bate-ink ${maxPlayers === n ? 'bg-bate-gold text-bate-ink shadow-hard-sm' : 'bg-bate-paper text-bate-ink/60'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-bate-paper border-[3px] border-bate-ink text-bate-ink font-display shadow-hard-sm hover:scale-[1.02] transition-transform"
          >
            CANCELAR
          </button>
          <button
            onClick={submit}
            disabled={submitting || !name.trim()}
            className="flex-1 py-3 rounded-xl bg-bate-red text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {submitting ? 'CRIANDO…' : 'CRIAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Rewrite page.tsx with Festa BR shell**

Write to `/Users/matheusdev/projects/bate-frontend/src/app/page.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Zap } from 'lucide-react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId, getStoredName, setStoredName } from '@/lib/player-id'
import { useGameStore } from '@/lib/store'
import { RoomList } from '@/components/lobby/RoomList'
import { CreateRoomDialog } from '@/components/lobby/CreateRoomDialog'
import { Hero } from '@/components/lobby/Hero'
import { QuickRules } from '@/components/lobby/QuickRules'
import { Avatar } from '@/components/lobby/Avatar'
import { MuteToggle } from '@/components/lobby/MuteToggle'
import { Footer } from '@/components/lobby/Footer'

const QUICK_ROOM_NAMES = ['Mesa do Maizão', 'Cabo Rápido', 'Sala do Zé', 'Bate Express', 'Mesa relâmpago']

export default function Home() {
  const router = useRouter()
  const rooms = useGameStore(s => s.rooms)
  const setRooms = useGameStore(s => s.setRooms)
  const [name, setName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setName(getStoredName())
    const socket = getSocket()
    socket.emit('lobby:subscribe')
    socket.on('lobby:update', ({ rooms }: { rooms: import('@/types/shared').RoomSummary[] }) => {
      setRooms(rooms)
    })
    return () => {
      socket.emit('lobby:unsubscribe')
      socket.off('lobby:update')
    }
  }, [setRooms])

  useEffect(() => {
    if (!getStoredName()) inputRef.current?.focus()
  }, [])

  function requireName(): boolean {
    if (!name.trim()) {
      inputRef.current?.focus()
      alert('Coloca um nome primeiro')
      return false
    }
    return true
  }

  function handleJoin(roomId: string) {
    if (!requireName()) return
    setStoredName(name)
    const socket = getSocket()
    socket.emit('room:join', { roomId, playerId: getPlayerId(), playerName: name }, (res: { ok?: true; error?: string }) => {
      if (res.error) {
        alert(`Erro: ${res.error}`)
        return
      }
      router.push(`/room/${roomId}`)
    })
  }

  function handleCreated(roomId: string) {
    setShowCreate(false)
    handleJoin(roomId)
  }

  function openCreate() {
    if (!requireName()) return
    setShowCreate(true)
  }

  function handleQuickPlay() {
    if (!requireName()) return
    const available = rooms.find(r => r.phase === 'waiting' && r.playerCount < r.maxPlayers)
    if (available) {
      handleJoin(available.roomId)
      return
    }
    setStoredName(name)
    const randomName = QUICK_ROOM_NAMES[Math.floor(Math.random() * QUICK_ROOM_NAMES.length)]!
    getSocket().emit(
      'room:create',
      { name: randomName, hostId: getPlayerId(), hostName: name, maxPlayers: 4 },
      (res: { roomId?: string; error?: string }) => {
        if (res.error) {
          alert(`Erro: ${res.error}`)
          return
        }
        if (res.roomId) handleJoin(res.roomId)
      },
    )
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="fixed top-4 right-4 z-50">
        <MuteToggle />
      </div>

      <Hero />

      <div className="mb-6">
        <label className="block text-sm font-display text-bate-ink mb-2">SEU NOME</label>
        <div className="flex items-center gap-3">
          <Avatar name={name} size={52} />
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim()) openCreate()
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-bate-paper text-bate-ink text-lg border-[3px] border-bate-ink shadow-hard-sm font-body font-semibold focus:outline-none focus:bg-white transition-colors"
            placeholder="Como te chamam?"
            maxLength={20}
            autoComplete="off"
          />
        </div>
      </div>

      <QuickRules />

      <button
        type="button"
        onClick={handleQuickPlay}
        className="w-full mb-6 py-4 rounded-2xl bg-bate-red text-bate-paper border-[4px] border-bate-ink shadow-hard-lg font-display text-lg hover:scale-[1.02] active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
      >
        <Zap size={20} fill="currentColor" /> JOGAR AGORA
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl text-bate-ink">SALAS ABERTAS</h2>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm font-display text-bate-ink hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Plus size={16} /> CRIAR
        </button>
      </div>

      <RoomList rooms={rooms} onJoin={handleJoin} onCreate={openCreate} />

      <Footer />

      {showCreate && (
        <CreateRoomDialog
          hostName={name}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 8: Typecheck**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
npx tsc --noEmit
```

Expected: `TypeScript compilation completed`.

- [ ] **Step 9: Smoke test in browser**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 pnpm dev
```

Open `http://localhost:3000`. Check:
- Hero tem fundo cream + borda preta grossa + sombra offset + "BATE!" vermelho com sombra dourada
- 4 cartas Batinho flutuam (JOKER, K, Q, OLHADINHA)
- Quick rules abre/fecha com cores nova paleta
- Input com avatar à esquerda
- Botão "JOGAR AGORA" vermelho com sombra ink
- Lista de salas ou empty state visíveis
- Footer

Pare o dev server.

- [ ] **Step 10: Commit (this is the atomic palette + lobby commit)**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git add tailwind.config.ts src/app/globals.css src/app/layout.tsx src/app/page.tsx src/components/lobby/
git commit -m "feat(theme): apply Festa BR palette + Bowlby/Fredoka fonts to lobby

Replaces cabo-* palette with bate-* (cream/paper/ink/red/gold/green/teal/silver).
Adds Bowlby One (display) and Caveat (handwritten) fonts; keeps Fredoka (body).
Hero uses real Batinho card images instead of CSS-fabricated mockups.
All lobby components use thick black borders + hard-shadow offset."
```

---

## Phase 5 — In-game chrome restyle

### Task 8: Restyle the in-game frame components

**Files:**
- Modify: `src/components/room2d/Background.tsx`
- Modify: `src/components/room2d/TurnBanner.tsx`
- Modify: `src/components/room2d/CaboButton.tsx`
- Modify: `src/components/room2d/InstructionBar.tsx`
- Modify: `src/components/room2d/PeekModal.tsx`
- Modify: `src/components/room2d/InitialPeekConfirm.tsx`
- Modify: `src/components/room2d/BateAnnouncement.tsx`
- Modify: `src/components/room2d/DiscardPile2D.tsx`
- Modify: `src/components/room2d/DeckPile2D.tsx`
- Modify: `src/components/room2d/DrawnCard2D.tsx`
- Modify: `src/components/room2d/ActionLog.tsx`
- Modify: `src/components/room2d/PlayerHand2D.tsx`
- Modify: `src/components/room2d/OpponentArea.tsx`
- Modify: `src/components/room2d/GameArea.tsx`

This task is a mechanical sweep replacing `cabo-*` tokens with `bate-*` equivalents inside the room2d directory. Use the **token mapping table** at the top of this plan. Where a component uses `font-bold` for headings, add `font-display` (Bowlby) for major labels; keep `font-body` (Fredoka, default) for normal text.

- [ ] **Step 1: List all `cabo-` references in room2d**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
grep -n "cabo-" src/components/room2d/*.tsx
```

Note the lines as a checklist.

- [ ] **Step 2: For each file in the list, replace tokens per the mapping table**

Edit each file using the mapping (use the Edit tool with the literal strings):

| Find | Replace with |
|---|---|
| `bg-cabo-bg` | `bg-bate-cream` |
| `bg-cabo-surface` | `bg-bate-paper` |
| `bg-cabo-cream` | `bg-bate-paper` |
| `bg-cabo-accent` | `bg-bate-red` |
| `bg-cabo-gold` | `bg-bate-gold` |
| `bg-cabo-purple` | `bg-bate-ink` |
| `bg-cabo-felt` | `bg-bate-green` |
| `bg-cabo-red` | `bg-bate-red-deep` |
| `bg-cabo-success` | `bg-bate-green` |
| `bg-cabo-danger` | `bg-bate-red` |
| `text-cabo-bg` | `text-bate-ink` |
| `text-cabo-purple` | `text-bate-ink` |
| `text-cabo-gold` | `text-bate-red` |
| `text-cabo-accent` | `text-bate-red` |
| `text-cabo-cream` | `text-bate-paper` |
| `text-cabo-success` | `text-bate-green` |
| `text-cabo-danger` | `text-bate-red` |
| `text-cabo-red` | `text-bate-red-deep` |
| `border-cabo-purple` | `border-bate-ink` |
| `border-cabo-gold` | `border-bate-gold` |
| `border-cabo-accent` | `border-bate-red` |

Apply with `replace_all: true` per token per file. Iterate per file:

```
Edit src/components/room2d/Background.tsx — apply find/replace for any cabo-* tokens it has
Edit src/components/room2d/TurnBanner.tsx — same
Edit src/components/room2d/CaboButton.tsx — same
... and so on for the 14 files listed above.
```

For tokens that appear in tailwind opacity utilities (e.g., `bg-cabo-purple/30`, `text-cabo-purple/60`), preserve the `/N` suffix when swapping (e.g., `bg-bate-ink/30`).

- [ ] **Step 3: Add Festa BR shadow/border touches on the key visible chrome**

After token swap, edit these specific elements:

In `src/components/room2d/InstructionBar.tsx`, change the inner `div` className from any existing variant to:
```
className="bg-bate-paper px-6 py-3 rounded-2xl text-bate-ink font-display text-sm shadow-hard border-[3px] border-bate-ink whitespace-nowrap"
```

In `src/components/room2d/CaboButton.tsx`, the primary button className should be:
```
className="px-7 py-4 rounded-2xl bg-bate-red text-bate-paper border-[4px] border-bate-ink shadow-hard-lg font-display text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-transform hover:scale-[1.04]"
```

(Adjust to match the actual JSX structure; keep all existing logic.)

In `src/components/room2d/Background.tsx`, replace the entire background gradient with:
```
className="absolute inset-0 -z-10 bg-bate-cream"
style={{
  backgroundImage: `
    radial-gradient(circle at 50% 50%, rgba(74, 124, 79, 0.15) 0%, transparent 60%),
    repeating-linear-gradient(45deg, rgba(26, 14, 8, 0.02) 0, rgba(26, 14, 8, 0.02) 1px, transparent 1px, transparent 6px)
  `,
}}
```

(Keep the component's existing structure; just swap the visual styles.)

In `src/components/room2d/BateAnnouncement.tsx`, find the element rendering the "BATE!" text and set its className to use `font-display text-bate-red` and inline style:
```
style={{
  WebkitTextStroke: '4px #1a0e08',
  textShadow: '8px 8px 0 #1a0e08, 8px 8px 0 #ffb81c, 10px 10px 0 #1a0e08',
}}
```

(Preserve existing anime.js timeline; only update className/style on the visible text element.)

- [ ] **Step 4: Typecheck**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
npx tsc --noEmit
```

Expected: `TypeScript compilation completed`.

- [ ] **Step 5: Smoke test**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 pnpm dev
```

Open two browser tabs. Crie sala numa, entre na outra. Confirme:
- Fundo da mesa creme
- TurnBanner com cores nova paleta
- CaboButton vermelho chunky
- InstructionBar branca com borda preta
- Discard/Deck/DrawnCard com bordas grossas
- BATE! anuncio com tipografia carimbada
- Sem regressões nas animações (flip, snap, peek, swap)

Pare o dev server.

- [ ] **Step 6: Commit**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/components/room2d/
git commit -m "feat(game): apply Festa BR palette to in-game chrome and overlays"
```

---

## Phase 6 — Room screens restyle

### Task 9: Restyle WaitingRoom, RoundEndScreen, MatchEndScreen, and the room page loading state

**Files:**
- Modify: `src/components/room/WaitingRoom.tsx`
- Modify: `src/components/room/RoundEndScreen.tsx`
- Modify: `src/components/room/MatchEndScreen.tsx`
- Modify: `src/app/room/[roomId]/page.tsx`

- [ ] **Step 1: List remaining `cabo-` references in room and room page**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
grep -n "cabo-" src/components/room/*.tsx src/app/room/'[roomId]'/page.tsx
```

- [ ] **Step 2: Apply token mapping to each file**

Use the same token mapping table from Task 8 Step 2. Apply per file with the Edit tool. Preserve all logic and existing animations.

- [ ] **Step 3: Update font usage**

In `src/components/room/RoundEndScreen.tsx`:
- Title "🎉 Fim da rodada" → add `font-display` to its className
- Player names in the breakdown rows → add `font-display`
- Position badges (🏆/2º/3º/4º) → add `font-display`
- Math breakdown text (`A(+1) + 2(+2) ...`) → keep `font-mono`
- "Próxima rodada →" button → add `font-display text-lg`

In `src/components/room/MatchEndScreen.tsx`:
- Winner heading → add `font-display`

In `src/components/room/WaitingRoom.tsx`:
- Room name heading → add `font-display`
- "Aguardando jogadores" → add `font-display`
- Start game button → add `font-display`

In `src/app/room/[roomId]/page.tsx`:
- Loading state "Carregando sala…" → add `font-display`

- [ ] **Step 4: Add Festa BR borders + shadows to the cards in these screens**

In `RoundEndScreen.tsx`, the `motion.li` per breakdown row className becomes:
```
className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-4 border-[3px] ${
  isWinner
    ? 'bg-bate-gold/30 border-bate-gold shadow-hard'
    : 'bg-bate-paper border-bate-ink/30 shadow-hard-sm'
}`}
```

The container `motion.div` becomes:
```
className="bg-bate-paper p-6 sm:p-8 rounded-3xl max-w-2xl w-full shadow-hard-lg border-[4px] border-bate-ink max-h-[90vh] overflow-y-auto"
```

The "Próxima rodada" button becomes:
```
className="w-full py-4 rounded-2xl bg-bate-red text-bate-paper font-display text-lg border-[4px] border-bate-ink shadow-hard"
```

In `MatchEndScreen.tsx` and `WaitingRoom.tsx`, follow the same patterns: borders `border-[3px] border-bate-ink`, shadows `shadow-hard` or `shadow-hard-sm`, paper-on-cream surfaces, display font for headings.

- [ ] **Step 5: Typecheck**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
npx tsc --noEmit
```

Expected: `TypeScript compilation completed`.

- [ ] **Step 6: Smoke test the full flow**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 pnpm dev
```

Joga uma rodada completa: lobby → criar sala → waiting room → começar → jogar → BATE! → round-end → next round → match-end (se chegar a 100 pts). Verifica que TODA tela está com identidade Festa BR e nenhuma referência ao tema antigo escapou.

- [ ] **Step 7: Final scan — confirm no `cabo-` color tokens remain**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
grep -rn "cabo-" src/ | grep -v "cabo-called"
```

Expected: empty output (only `cabo-called` remains, which is a sound event name in `lib/sounds.ts` — not a color token).

If anything appears, fix it inline and re-grep.

- [ ] **Step 8: Commit**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/components/room/ src/app/room/'[roomId]'/page.tsx
git commit -m "feat(room): apply Festa BR identity to waiting/round-end/match-end screens"
```

---

## Phase 7 — Wrap-up

### Task 10: Production build verification and push

**Files:**
- None (verification only)

- [ ] **Step 1: Run production build**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
pnpm build
```

Expected: build completes successfully. Note total bundle size from output. Watch for unused-import warnings related to deleted CardFace.

- [ ] **Step 2: Verify assets are present in build**

Run:
```bash
ls /Users/matheusdev/projects/bate-frontend/.next/static 2>/dev/null && ls /Users/matheusdev/projects/bate-frontend/public/cards/*.webp | wc -l
```

Expected: 15 webps, build output exists.

- [ ] **Step 3: Push to remote**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git push origin main
```

Expected: 5 commits pushed (one per task that committed).

- [ ] **Step 4: Verify deploy on Vercel/Railway**

The user will check the live URL after auto-deploy completes. Report back the URL for visual confirmation.

---

## Summary

| Phase | Task | What it ships |
|---|---|---|
| 1 | 1 | Raw card PNGs in repo |
| 1 | 2 | Sharp optimizer + 15 WebPs (~700KB total) |
| 2 | 3 | Tailwind `bate-*` palette + shadows |
| 2 | 4 | Bowlby/Fredoka/Caveat fonts loaded |
| 3 | 5 | `card-meta.ts` with image paths |
| 3 | 6 | `Card2D` shows Batinho art, CardBack rewritten, CardFace deleted |
| 4 | 7 | Lobby end-to-end with Festa BR identity |
| 5 | 8 | In-game chrome (TurnBanner, CaboButton, BateAnnouncement, etc) |
| 6 | 9 | Waiting/round-end/match-end screens |
| 7 | 10 | Production build verified + push |

Total estimated commits: 7 (assets, optimizer, card-meta, Card2D, lobby+theme, game chrome, room screens) + 1 push.
