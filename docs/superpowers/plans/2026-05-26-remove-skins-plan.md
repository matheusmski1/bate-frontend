# Remove Skins System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover completamente o sistema de skins (UI, API, DB schema, runtime state) dos dois repos `bate-frontend` e `bate-backend`, conforme spec `docs/superpowers/specs/2026-05-26-remove-skins-design.md`.

**Architecture:** Trabalho dividido em dois PRs sequenciais — frontend primeiro (pra parar de chamar os endpoints), depois backend (que dropa endpoints + schema). Cada PR tem múltiplos commits atômicos pra manter typecheck verde em cada etapa. Ordem dentro de cada PR: remover CONSUMERS antes do TYPE (porque `skin` é campo obrigatório do `Player`; remover o type primeiro quebraria typecheck nos consumers).

**Tech Stack:** Next.js 15 + React 19 (frontend), Node + Socket.io + TypeORM + Postgres (backend), TypeScript strict em ambos.

---

## Pré-requisitos

- `bate-frontend` em `/Users/matheusdev/projects/bate-frontend`, branch atual qualquer
- `bate-backend` em `/Users/matheusdev/projects/bate-backend`, branch atual qualquer (será trocada)
- Spec doc commitado: `docs/superpowers/specs/2026-05-26-remove-skins-design.md` (commit `c23ef12` no branch `spec/remove-skins` do frontend)
- Acesso ao Railway dashboard pra tirar snapshot do Postgres antes do deploy backend
- `gh` CLI autenticado pra criar PRs

---

# FASE 1 — Frontend

### Task 1: Setup branch frontend

**Files:** nenhum modificado.

- [ ] **Step 1: Garantir working tree limpo no frontend**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git status
```

Expected: untracked files OK (`.serena/`, `public/animations/`, `src/app/test-lottie/`), mas nada modificado ou em staging.

- [ ] **Step 2: Atualizar main e criar branch de feature**

Run:
```bash
git checkout main
git pull origin main
git checkout -b feat/remove-skins
```

Expected: switched to new branch `feat/remove-skins` baseado em `origin/main`.

---

### Task 2: Remover display de skin nos componentes de UI da partida

**Files:**
- Modify: `src/components/room2d/Nameplate.tsx`
- Modify: `src/components/room2d/OpponentArea.tsx`
- Modify: `src/components/room2d/PlayerHand2D.tsx`
- Modify: `src/components/room/WaitingRoom.tsx`

Os 4 arquivos têm que ir num commit só porque todos referenciam `Nameplate.skin` ou `skinImage(player.skin)` — separar quebraria typecheck no meio.

- [ ] **Step 1: Confirmar estado atual**

Run:
```bash
grep -nE "skinImage|skin\?:" src/components/room2d/Nameplate.tsx src/components/room2d/OpponentArea.tsx src/components/room2d/PlayerHand2D.tsx src/components/room/WaitingRoom.tsx
```

Expected: matches em todos os 4 arquivos confirmando que ainda têm referências a `skinImage` ou prop `skin`.

- [ ] **Step 2: Edit Nameplate.tsx — remover prop skin, sempre usar Avatar**

old_string:
```tsx
import { motion } from 'framer-motion'
import { Avatar } from '@/components/lobby/Avatar'
import { skinImage } from '@/lib/mascot'

type Props = {
  name: string
  score: number
  isCurrent: boolean
  connected?: boolean
  isHost?: boolean
  isLeader?: boolean
  isMe?: boolean
  skin?: string | null
  dataAttribute?: { key: string; value: string }
}
```

new_string:
```tsx
import { motion } from 'framer-motion'
import { Avatar } from '@/components/lobby/Avatar'

type Props = {
  name: string
  score: number
  isCurrent: boolean
  connected?: boolean
  isHost?: boolean
  isLeader?: boolean
  isMe?: boolean
  dataAttribute?: { key: string; value: string }
}
```

E na assinatura da função:

old_string:
```tsx
export function Nameplate({ name, score, isCurrent, connected = true, isHost = false, isLeader = false, isMe = false, skin = null, dataAttribute }: Props) {
```

new_string:
```tsx
export function Nameplate({ name, score, isCurrent, connected = true, isHost = false, isLeader = false, isMe = false, dataAttribute }: Props) {
```

E no JSX, substituir o ternário pelo Avatar:

old_string:
```tsx
      {skin ? (
        <img src={skinImage(skin)} alt="" className="w-9 h-9 rounded-full border-[2px] border-bate-ink bg-bate-cream object-cover select-none" draggable={false} />
      ) : (
        <Avatar name={name} size={28} />
      )}
```

new_string:
```tsx
      <Avatar name={name} size={28} />
```

- [ ] **Step 3: Edit OpponentArea.tsx — remover skin display e skin prop no Nameplate**

Primeiro: remover import de `skinImage`.

old_string:
```tsx
import { skinImage } from '@/lib/mascot'
```

new_string: (linha apagada — deletar a linha inteira do import)

Em seguida, no JSX (a linha com `<img src={skinImage(player.skin)}...`):

old_string:
```tsx
            <img src={skinImage(player.skin)} alt="" className="w-7 h-7 rounded-full border-[2px] border-bate-ink bg-bate-cream object-cover select-none" draggable={false} />
```

new_string:
```tsx
            <Avatar name={player.name} size={28} />
```

Garantir que o import de Avatar existe em OpponentArea.tsx. Se não tiver, adicionar:

```tsx
import { Avatar } from '@/components/lobby/Avatar'
```

(Se já tiver, pular esse passo.)

E remover o `skin={player.skin}` da chamada do Nameplate:

old_string:
```tsx
          skin={player.skin}
```

new_string: (linha apagada — deletar)

- [ ] **Step 4: Edit PlayerHand2D.tsx — remover skin prop no Nameplate**

old_string:
```tsx
        skin={player.skin}
```

new_string: (linha apagada — deletar)

- [ ] **Step 5: Edit WaitingRoom.tsx — remover skin display**

old_string:
```tsx
import { skinImage } from '@/lib/mascot'
```

new_string: (linha apagada — deletar)

Em seguida, no JSX:

old_string:
```tsx
                <img src={skinImage(p.skin)} alt="" className="w-7 h-7 rounded-full border-[2px] border-bate-ink bg-bate-paper object-cover" draggable={false} />
```

new_string:
```tsx
                <Avatar name={p.name} size={28} />
```

Garantir que `Avatar` está importado em WaitingRoom.tsx. Se não tiver:

```tsx
import { Avatar } from '@/components/lobby/Avatar'
```

- [ ] **Step 6: Typecheck**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
```

Expected: 0 erros. Se houver erro mencionando `skin`, verificar se restou alguma referência.

- [ ] **Step 7: Commit**

Run:
```bash
git add src/components/room2d/Nameplate.tsx src/components/room2d/OpponentArea.tsx src/components/room2d/PlayerHand2D.tsx src/components/room/WaitingRoom.tsx
git commit -m "$(cat <<'EOF'
replace skin display with Avatar in game UI components

Nameplate no longer takes a skin prop; OpponentArea, PlayerHand2D, and
WaitingRoom stop passing it. All four now show the initials-based Avatar
that was already the fallback when skin was null. Player.skin field
itself is still in the type — removed in a later task once the skinImage
helper and SkinPicker are gone.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Remover SkinPicker UI e botão da chrome

**Files:**
- Delete: `src/components/lobby/SkinPicker.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Deletar SkinPicker.tsx**

Run:
```bash
rm src/components/lobby/SkinPicker.tsx
```

Expected: arquivo removido.

- [ ] **Step 2: Edit page.tsx — remover import**

old_string:
```tsx
import { SkinPicker } from '@/components/lobby/SkinPicker'
```

new_string: (linha apagada)

- [ ] **Step 3: Edit page.tsx — remover state showSkins**

old_string:
```tsx
  const [showSkins, setShowSkins] = useState(false)
```

new_string: (linha apagada)

- [ ] **Step 4: Edit page.tsx — remover botão da chrome**

old_string:
```tsx
        <button
          type="button"
          onClick={() => setShowSkins(true)}
          title="Skins"
          className="w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
        >
          <Shirt size={16} strokeWidth={3} />
        </button>
```

new_string: (bloco apagado — deletar as 8 linhas)

- [ ] **Step 5: Edit page.tsx — remover render do SkinPicker**

old_string:
```tsx
      <SkinPicker open={showSkins} onClose={() => setShowSkins(false)} />
```

new_string: (linha apagada)

- [ ] **Step 6: Edit page.tsx — limpar import do Shirt se órfão**

Run:
```bash
grep -n "Shirt" src/app/page.tsx
```

Se retornar APENAS a linha do import (não o uso), remover do import:

old_string:
```tsx
import { Shirt, HelpCircle, Layers, Tent } from 'lucide-react'
```

new_string:
```tsx
import { HelpCircle, Layers, Tent } from 'lucide-react'
```

Se houver outros usos de `Shirt` no arquivo, deixar o import como está.

- [ ] **Step 7: Typecheck**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
```

Expected: 0 erros.

- [ ] **Step 8: Commit**

Run:
```bash
git add src/components/lobby/SkinPicker.tsx src/app/page.tsx
git commit -m "$(cat <<'EOF'
remove SkinPicker modal and lobby chrome button

Deletes SkinPicker.tsx entirely and unwires it from the lobby:
the chrome button (Shirt icon), the showSkins state, and the modal
render. Tutorial, Decks, Arenas, and Mute remain in the chrome.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Remover skinImage helper e skins-api client

**Files:**
- Modify: `src/lib/mascot.ts`
- Delete: `src/lib/skins-api.ts`

- [ ] **Step 1: Edit mascot.ts — remover SKIN_TO_MASCOT e skinImage**

old_string:
```tsx
const SKIN_TO_MASCOT: Record<string, string> = {
  default: MASCOT.feliz,
  ouro: MASCOT.ouro,
  prata: MASCOT.prata,
  trofeu: MASCOT.trofeu,
  lupa: MASCOT.lupa,
  bate: MASCOT.bate,
}

export function skinImage(skinId: string | null | undefined): string {
  if (!skinId) return MASCOT.feliz
  return SKIN_TO_MASCOT[skinId] ?? MASCOT.feliz
}

```

new_string: (bloco inteiro apagado — substitui por linha em branco se necessário pra manter espaçamento, ou cola direto a próxima função)

Após o edit, `lib/mascot.ts` deve conter apenas: o objeto `MASCOT`, o tipo `MascotKey`, o objeto `ARENA_MASCOT_STATES`, e a função `getMascot()`.

- [ ] **Step 2: Deletar skins-api.ts**

Run:
```bash
rm src/lib/skins-api.ts
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
```

Expected: 0 erros. Se houver erros mencionando `skinImage` ou `skins-api`, alguma referência sobrou — caçar com grep e corrigir.

- [ ] **Step 4: Confirmar zero referências**

Run:
```bash
grep -rE "skinImage|skins-api|SkinPicker" src/
```

Expected: zero matches.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/lib/mascot.ts src/lib/skins-api.ts
git commit -m "$(cat <<'EOF'
remove skinImage helper and skins-api client

Drops SKIN_TO_MASCOT, skinImage(), and the entire skins-api module —
no remaining consumers. MASCOT object and getMascot() remain for the
event-driven MascotOverlay system.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Remover skin do tipo Player (frontend)

**Files:**
- Modify: `src/types/shared.ts`

- [ ] **Step 1: Confirmar localização do campo skin**

Run:
```bash
grep -n "skin" src/types/shared.ts
```

Expected: 2 linhas com `skin: string` (campo em `Player` e possivelmente em `RoomSummary` ou similar — checar o contexto).

- [ ] **Step 2: Edit shared.ts — remover ambas as ocorrências**

Pra cada ocorrência:

old_string (provavelmente em `Player`):
```tsx
  skin: string
```

new_string: (linha apagada)

E a segunda ocorrência (provavelmente em algum tipo de player redacted). Se as duas linhas têm exatamente o mesmo texto, usar `replace_all: true`.

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
```

Expected: 0 erros. (Se algum componente ainda referenciar `player.skin`, vai aparecer aqui — corrigir.)

- [ ] **Step 4: Confirmar zero referências a "skin" em src/**

Run:
```bash
grep -rnE "\bskin\b" src/ --include="*.ts" --include="*.tsx"
```

Expected: zero matches (ou só falsos positivos comentados — analisar manualmente se houver).

- [ ] **Step 5: Commit**

Run:
```bash
git add src/types/shared.ts
git commit -m "$(cat <<'EOF'
drop skin field from shared Player type

Last reference to the skin concept on the frontend. All consumers
were removed in prior commits, so it's safe to remove the type field
without breaking compilation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Push frontend branch e abrir PR

**Files:** nenhum.

- [ ] **Step 1: Build smoke**

Run:
```bash
pnpm build
```

Expected: build completa sem erros.

- [ ] **Step 2: Push branch**

Run:
```bash
git push -u origin feat/remove-skins
```

Expected: branch pushed, message com link pra criar PR.

- [ ] **Step 3: Criar PR no GitHub**

Run:
```bash
gh pr create --title "Remove skins system from frontend" --body "$(cat <<'EOF'
## Summary

Removes the skins system end-to-end from the frontend per the design spec at `docs/superpowers/specs/2026-05-26-remove-skins-design.md`. Backend removal is a separate PR (in `bate-backend` repo) that should land **after** this one merges and deploys.

## Motivation

Skins only rendered as 28-36px avatars in Nameplate/WaitingRoom/OpponentArea. All dramatic mascot moments (BateAnnouncement, MascotOverlay with 5 triggers, RoundEndScreen, MatchEndScreen, Tutorial, Bartender Boteco) use event-driven `MASCOT.X` directly and ignored the player's chosen skin entirely. Feature did not deliver value proportional to its complexity.

## Changes

- **Deleted:** `src/components/lobby/SkinPicker.tsx`, `src/lib/skins-api.ts`
- **Modified:** `src/lib/mascot.ts` (drop `SKIN_TO_MASCOT` + `skinImage()`)
- **Modified:** `src/types/shared.ts` (drop `skin` from `Player`)
- **Modified:** `src/components/room2d/Nameplate.tsx` (drop skin prop, always use Avatar)
- **Modified:** `src/components/room2d/OpponentArea.tsx` (drop skin display)
- **Modified:** `src/components/room2d/PlayerHand2D.tsx` (drop skin prop on Nameplate)
- **Modified:** `src/components/room/WaitingRoom.tsx` (drop skin display)
- **Modified:** `src/app/page.tsx` (drop SkinPicker import/state/button/render)

Kept intact: `MASCOT` object with 16 expressions, all `MascotOverlay` triggers, Bartender Boteco, BateAnnouncement, Tutorial, Hero, the `batinho-*.webp` assets (cards in the deck still use them).

## Test plan

- [ ] `pnpm tsc --noEmit -p tsconfig.json` passes
- [ ] `pnpm build` passes
- [ ] Local dev (`NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 pnpm dev`):
  - Lobby chrome has 4 buttons (Tutorial, Decks, Arenas, Mute) — no Skins button
  - Joining a room shows colorful Avatar initials in Nameplate, not mascot
  - Tutorial still works with mascot expressions
  - BateAnnouncement and MascotOverlay reactions still work
- [ ] `grep -rE "skinImage|SkinPicker|skins-api" src/` returns zero matches

## Deploy order

Merge + deploy this PR first. Wait ~10-30min for CDN/SW propagation. Then merge the corresponding backend PR (which drops endpoints + schema).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR criado, retorna URL.

- [ ] **Step 4: Pausa de deploy**

Reportar pro usuário:
- URL do PR
- Aguardar merge + deploy do frontend (Vercel) antes de prosseguir pra Fase 2
- Janela de propagação ~10-30min após deploy

---

# FASE 2 — Backend

> **Pré-requisitos da Fase 2:**
> - Frontend PR mergeado e Vercel deploy ativo
> - Janela de propagação de ~10-30min após deploy (clientes velhos com bundle cacheado pararam de chamar `/me/skins`)
> - Snapshot do Postgres tirado no Railway dashboard (Database → Snapshot)

### Task 7: Setup branch backend

**Files:** nenhum modificado.

- [ ] **Step 1: Trocar pro repo backend e checar estado**

Run:
```bash
cd /Users/matheusdev/projects/bate-backend
git status
```

Expected: working tree limpo (a branch `feat/bate-batinho-identity` ainda existe localmente da fase de brand identity — tudo bem).

- [ ] **Step 2: Atualizar main e criar branch**

Run:
```bash
git checkout main
git pull origin main
git checkout -b feat/remove-skins
```

Expected: switched to new branch `feat/remove-skins` baseado em `origin/main`.

---

### Task 8: Remover skin do runtime game state

**Files:**
- Modify: `src/server/storage/types.ts`
- Modify: `src/server/game/state.ts`
- Modify: `src/server/storage/memory.ts`
- Modify: `src/server/storage/redis.ts`

Os 4 arquivos vão num commit só pra manter typecheck verde.

- [ ] **Step 1: Confirmar estado atual**

Run:
```bash
grep -nE "skin\??: string" src/server/storage/types.ts src/server/game/state.ts src/server/storage/memory.ts src/server/storage/redis.ts
```

Expected: matches em todos os 4 arquivos.

- [ ] **Step 2: Edit storage/types.ts — remover skin de JoinInput**

old_string:
```ts
export type JoinInput = { playerId: string; playerName: string; skin?: string; deck?: string; arena?: string }
```

new_string:
```ts
export type JoinInput = { playerId: string; playerName: string; deck?: string; arena?: string }
```

- [ ] **Step 3: Edit game/state.ts — remover skin de PlayerState e do construtor**

old_string:
```ts
  skin?: string
```

(esse é o campo do tipo PlayerState)

new_string: (linha apagada)

E em seguida, no construtor que monta o estado:

old_string:
```ts
    skin: input.skin ?? 'default',
```

new_string: (linha apagada)

- [ ] **Step 4: Edit storage/memory.ts — remover do join**

old_string:
```ts
      skin: input.skin ?? 'default',
```

new_string: (linha apagada)

- [ ] **Step 5: Edit storage/redis.ts — remover do join**

old_string:
```ts
      skin: input.skin ?? 'default',
```

new_string: (linha apagada)

- [ ] **Step 6: Typecheck + testes**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
pnpm test:run
```

Expected: typecheck 0 erros, todos os testes do engine passam (esperado: 72 testes, conferir com o output).

- [ ] **Step 7: Commit**

Run:
```bash
git add src/server/storage/types.ts src/server/game/state.ts src/server/storage/memory.ts src/server/storage/redis.ts
git commit -m "$(cat <<'EOF'
drop skin from runtime game state and storage

PlayerState no longer carries skin; JoinInput stops accepting it;
memory and redis storage stop persisting it. In-flight Redis sessions
will have an orphaned skin field — runtime ignores extra fields on
deserialization, so it's safe to deploy without draining state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Remover skin do ciclo de vida do User

**Files:**
- Modify: `src/server/db/users.ts`

- [ ] **Step 1: Confirmar estado atual**

Run:
```bash
grep -nE "Skin|skin|grantSkin|equippedSkin" src/server/db/users.ts | head -20
```

Expected: múltiplas linhas com referências a Skin, UserSkin, grantSkin, equipSkin, getUserSkins, equippedSkin.

- [ ] **Step 2: Edit users.ts — remover imports**

old_string:
```ts
import { Skin } from './entities/Skin'
import { UserSkin } from './entities/UserSkin'
```

new_string: (bloco apagado — deletar ambas as linhas)

- [ ] **Step 3: Edit users.ts — remover equippedSkin do user.create**

old_string:
```ts
  const user = existing ?? repo.create({ id: playerId, displayName, equippedSkin: 'default', equippedDeck: 'default', equippedArena: 'default' })
```

new_string:
```ts
  const user = existing ?? repo.create({ id: playerId, displayName, equippedDeck: 'default', equippedArena: 'default' })
```

- [ ] **Step 4: Edit users.ts — remover bloco de granting de defaults**

Achar e remover o bloco que faz `Promise.all([defaultSkins, ...])` e o `for (const skin of defaultSkins) await grantSkin(...)`. Ler o arquivo pra ver o contexto exato e remover apenas a parte das skins, mantendo decks/arenas intactos.

Pseudocódigo do que remover (exato dependendo da estrutura atual):
- `AppDataSource.getRepository(Skin).find({ where: { unlockType: 'default' } })`
- `defaultSkins` destructuring
- `for (const skin of defaultSkins) await grantSkin(userId, skin.id, 'default')`

- [ ] **Step 5: Edit users.ts — remover funções grantSkin, getUserSkins, equipSkin**

Cada uma dessas funções deve ser removida inteira. Identificar pelo `export async function grantSkin`, `export async function getUserSkins`, `export async function equipSkin` e remover do `export async function` até o `}` final correspondente.

- [ ] **Step 6: Typecheck**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
```

Expected: 0 erros em users.ts. Pode aparecer erros em `db/skins.ts` ou `db/seed-skins.ts` que ainda importam de users.ts — vamos limpar nas próximas tasks; **se acontecer, é esperado**. O erro do typecheck deve apenas mencionar `skins.ts` ou `seed-skins.ts`, não `users.ts` em si.

Se o build falhar de forma bloqueante (não só warning), prosseguir mesmo assim pra Task 10/11 que vão deletar os arquivos com erro.

- [ ] **Step 7: Commit**

Run:
```bash
git add src/server/db/users.ts
git commit -m "$(cat <<'EOF'
remove skin lifecycle from db/users

Drops Skin/UserSkin imports, equippedSkin from user.create defaults,
the default skin granting loop, and the grantSkin/getUserSkins/equipSkin
helpers. Decks and arenas remain (equippedDeck, equippedArena, etc.).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Remover endpoints e seed de skins do server

**Files:**
- Modify: `src/server/index.ts`
- Modify: `src/server/db/seed.ts`

- [ ] **Step 1: Edit seed.ts — remover seedDefaultSkins**

old_string:
```ts
import { seedDefaultSkins } from './seed-skins'
```

new_string: (linha apagada)

E o ponto onde é chamado:

old_string:
```ts
  const result = await seedDefaultSkins()
```

new_string: (linha apagada — e a linha de log subsequente, se for sobre skins)

Ler o arquivo todo pra confirmar que removeu corretamente sem deixar variável `result` órfã.

- [ ] **Step 2: Edit index.ts — remover imports de skins**

old_string:
```ts
import { seedDefaultSkins, backfillDefaultSkinsToAllUsers } from './db/seed-skins'
```

new_string: (linha apagada)

old_string:
```ts
import { listSkinsForUser, equipSkinForUser } from './db/skins'
```

new_string: (linha apagada)

- [ ] **Step 3: Edit index.ts — remover endpoint /me/skins**

Localizar o handler que começa com:
```ts
if (req.url === '/me/skins' && req.method === 'GET') {
```

Remover o bloco inteiro até a chave de fechamento (`}`) correspondente — incluindo o `return`. Ler o arquivo pra identificar o range exato (linhas ~100-110 no spec).

- [ ] **Step 4: Edit index.ts — remover endpoint /me/equip-skin**

Localizar o handler que começa com:
```ts
if (req.url === '/me/equip-skin' && req.method === 'POST') {
```

Remover o bloco inteiro até a chave de fechamento (incluindo o validation do skinId, parsing do body, chamada de equipSkinForUser, e returns). Range estimado: linhas ~191-213 no spec.

- [ ] **Step 5: Edit index.ts — remover seed/backfill skins no startup**

Localizar o bloco que faz `seedDefaultSkins()` e `backfillDefaultSkinsToAllUsers()` no startup. Range estimado: linhas ~261-266 no spec. Remover apenas essas chamadas — manter outros seeds (decks, arenas) intactos.

Também remover qualquer log que mencione skins (ex: `console.log('[db] seed skins inserted=...')`).

E procurar uma mensagem no startup do tipo:
```ts
console.log('[db] DATABASE_URL not set — running without DB (skins/profile disabled)')
```

Atualizar pra não mencionar skins:
```ts
console.log('[db] DATABASE_URL not set — running without DB (profile features disabled)')
```

- [ ] **Step 6: Typecheck + testes**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
pnpm test:run
```

Expected: erros remanescentes só em `db/skins.ts` e `db/seed-skins.ts` (que ainda existem). Vamos deletar esses arquivos na Task 11.

- [ ] **Step 7: Commit**

Run:
```bash
git add src/server/index.ts src/server/db/seed.ts
git commit -m "$(cat <<'EOF'
drop skin endpoints and seed orchestration

Removes /me/skins and /me/equip-skin HTTP handlers from index.ts and
unwires seedDefaultSkins/backfillDefaultSkinsToAllUsers from startup.
Deck and arena seed remain. The skins.ts and seed-skins.ts modules
themselves are deleted in the next commit.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Deletar módulos e entidades de skins

**Files:**
- Delete: `src/server/db/skins.ts`
- Delete: `src/server/db/seed-skins.ts`
- Delete: `src/server/db/entities/Skin.ts`
- Delete: `src/server/db/entities/UserSkin.ts`

- [ ] **Step 1: Deletar os 4 arquivos**

Run:
```bash
rm src/server/db/skins.ts
rm src/server/db/seed-skins.ts
rm src/server/db/entities/Skin.ts
rm src/server/db/entities/UserSkin.ts
```

- [ ] **Step 2: Typecheck + testes**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
pnpm test:run
```

Expected: 0 erros (todas as referências já foram limpas em tasks anteriores).

Se houver erro mencionando `Skin`, `UserSkin`, `skins.ts`, ou `seed-skins.ts`, alguma referência sobrou — caçar com grep e corrigir.

- [ ] **Step 3: Confirmar zero referências**

Run:
```bash
grep -rE "from './skins'|from './seed-skins'|from './entities/Skin'|from './entities/UserSkin'|listSkinsForUser|equipSkinForUser|seedDefaultSkins|backfillDefaultSkinsToAllUsers" src/
```

Expected: zero matches.

- [ ] **Step 4: Commit**

Run:
```bash
git add src/server/db/
git commit -m "$(cat <<'EOF'
delete skin entities and db modules

Removes db/skins.ts, db/seed-skins.ts, db/entities/Skin.ts, and
db/entities/UserSkin.ts. All consumers were removed in prior commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Criar migration RemoveSkins

**Files:**
- Create: `src/server/db/migrations/1779470000000-RemoveSkins.ts`

- [ ] **Step 1: Gerar timestamp atual (opcional, ou usar o do spec)**

Decidir: usar o número do spec `1779470000000`, ou rodar `node -e "console.log(Date.now())"` pra gerar timestamp fresco. Qualquer número maior que `1748160000000` do init migration serve.

Pra esse plano, usar `1779470000000` (mantém consistência com o spec).

- [ ] **Step 2: Criar o arquivo**

Path: `src/server/db/migrations/1779470000000-RemoveSkins.ts`

Conteúdo:
```ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveSkins1779470000000 implements MigrationInterface {
  name = 'RemoveSkins1779470000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_skins_unique"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_skins"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "skins"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "equippedSkin"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error('RemoveSkins migration is not reversible — restore from snapshot to roll back')
  }
}
```

- [ ] **Step 3: Typecheck**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
```

Expected: 0 erros.

- [ ] **Step 4: Build smoke**

Run:
```bash
pnpm build 2>&1 | tail -10
```

Expected: build completa.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/server/db/migrations/1779470000000-RemoveSkins.ts
git commit -m "$(cat <<'EOF'
add RemoveSkins migration to drop skin tables and column

Drops user_skins (and its unique index), skins, and the equippedSkin
column from users. Migration is intentionally non-reversible — to roll
back, restore from a DB snapshot taken before the migration runs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Remover skin do tipo Player (backend)

**Files:**
- Modify: `src/types/shared.ts`

- [ ] **Step 1: Confirmar estado atual**

Run:
```bash
grep -n "skin" src/types/shared.ts
```

Expected: 2 linhas com `skin: string` (ou similar) no Player type.

- [ ] **Step 2: Edit shared.ts — remover ambas as ocorrências**

Igual ao frontend (Task 5). Pra cada ocorrência:

old_string:
```ts
  skin: string
```

new_string: (linha apagada)

- [ ] **Step 3: Typecheck + testes**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
pnpm test:run
```

Expected: 0 erros, todos os testes passam.

- [ ] **Step 4: Confirmar limpeza**

Run:
```bash
grep -rnE "\bskin\b" src/ --include="*.ts"
```

Expected: zero matches significativos.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/types/shared.ts
git commit -m "$(cat <<'EOF'
drop skin field from shared Player type (backend)

Last reference to skin on the backend. Mirrors the frontend change.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Push backend branch e abrir PR

**Files:** nenhum.

- [ ] **Step 1: Lembrar Matheus do snapshot**

Antes de continuar, confirmar com Matheus que **o snapshot do Postgres do Railway foi tirado** (dashboard → Database → Snapshot). Se não foi, pausar aqui.

- [ ] **Step 2: Push branch**

Run:
```bash
git push -u origin feat/remove-skins
```

Expected: branch pushed.

- [ ] **Step 3: Criar PR no GitHub**

Run:
```bash
gh pr create --title "Remove skins system from backend (with migration)" --body "$(cat <<'EOF'
## Summary

Backend half of the skin removal. Depends on the frontend PR (`bate-frontend#<frontend-pr-number>`) having merged and deployed first. Includes an irreversible migration that drops the `skins` table, `user_skins` table, and `equippedSkin` column from `users`.

Spec lives in the frontend repo: `docs/superpowers/specs/2026-05-26-remove-skins-design.md`.

## Motivation

See spec for full reasoning. TL;DR: skins did not impact the visually dramatic moments of the game (BateAnnouncement, MascotOverlay reactions, etc.) and only rendered as 28-36px avatars next to player names. Feature was not delivering value proportional to maintenance burden.

## Changes

- **Deleted:** `src/server/db/skins.ts`, `src/server/db/seed-skins.ts`, `src/server/db/entities/Skin.ts`, `src/server/db/entities/UserSkin.ts`
- **Modified:** `src/server/index.ts` (drop `/me/skins`, `/me/equip-skin` handlers, drop skin seed/backfill on startup)
- **Modified:** `src/server/db/users.ts` (drop `grantSkin`, `getUserSkins`, `equipSkin`, drop `equippedSkin` from user create, drop default-granting loop)
- **Modified:** `src/server/db/seed.ts` (drop `seedDefaultSkins` import and call)
- **Modified:** `src/server/game/state.ts` (drop `skin` from PlayerState)
- **Modified:** `src/server/storage/types.ts` (drop `skin` from JoinInput)
- **Modified:** `src/server/storage/memory.ts`, `src/server/storage/redis.ts` (drop skin from join)
- **Modified:** `src/types/shared.ts` (drop `skin` from Player)
- **Created:** `src/server/db/migrations/1779470000000-RemoveSkins.ts`

## Migration

Irreversible. Drops `IDX_user_skins_unique`, `user_skins`, `skins`, and the `equippedSkin` column from `users`. `down()` throws an error explicitly — to roll back, restore from the Postgres snapshot taken in Railway before deploy.

**Snapshot confirmation:** ☐ Postgres snapshot taken (Railway dashboard → Database → Snapshot)

## Test plan

- [ ] `pnpm tsc --noEmit -p tsconfig.json` passes
- [ ] `pnpm test:run` — all 72 engine tests pass
- [ ] `pnpm build` passes
- [ ] After Railway deploy: confirm migration ran via `psql`:
  - `\d users` does not show `equippedSkin` column
  - `\dt skins` returns "Did not find any relation"
  - `\dt user_skins` returns "Did not find any relation"
- [ ] New player signup does not log `[db] backfill skins granted=N`
- [ ] Joining a game works normally (no skin field needed in PlayerState)

## Deploy order

Merge **only after** the frontend PR (`bate-frontend#<frontend-pr-number>`) has merged AND deployed, AND ~10-30min passed for CDN/SW propagation, AND the Postgres snapshot has been taken.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR criado, retorna URL. (Substituir `<frontend-pr-number>` pelo número real após criar o PR de frontend na Task 6.)

- [ ] **Step 4: Reportar status final**

Reportar pro Matheus:
- Branch frontend: pushed, PR aberto, aguardando merge
- Branch backend: pushed, PR aberto, **bloqueado** até frontend merge + deploy + janela de propagação + snapshot

---

## Resumo de arquivos por commit

**Frontend (`bate-frontend`, branch `feat/remove-skins`):**

| Commit | Tarefa | Arquivos |
|---|---|---|
| 1 | Task 2 | Nameplate.tsx, OpponentArea.tsx, PlayerHand2D.tsx, WaitingRoom.tsx |
| 2 | Task 3 | SkinPicker.tsx (deleted), page.tsx |
| 3 | Task 4 | mascot.ts, skins-api.ts (deleted) |
| 4 | Task 5 | types/shared.ts |

**Backend (`bate-backend`, branch `feat/remove-skins`):**

| Commit | Tarefa | Arquivos |
|---|---|---|
| 5 | Task 8 | storage/types.ts, game/state.ts, storage/memory.ts, storage/redis.ts |
| 6 | Task 9 | db/users.ts |
| 7 | Task 10 | index.ts, db/seed.ts |
| 8 | Task 11 | db/skins.ts, db/seed-skins.ts, db/entities/Skin.ts, db/entities/UserSkin.ts (all deleted) |
| 9 | Task 12 | db/migrations/1779470000000-RemoveSkins.ts (created) |
| 10 | Task 13 | types/shared.ts |

Total: 10 commits, 2 PRs.

## Out of scope

- Push do PR frontend automaticamente (requer confirmação do usuário porque é deploy real)
- Merge dos PRs (decisão do Matheus, não automática)
- Rodar a migration manualmente (Railway roda no boot do novo deploy)
- Sistema de coins, decks, arenas (decisões separadas)
