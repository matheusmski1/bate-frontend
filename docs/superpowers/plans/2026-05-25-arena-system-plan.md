# Arena System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o sistema de arenas cosméticas (DB + endpoints + picker + integração no GameArea), entregando `default` (mantém background atual) + `boteco` (primeira arena temática com kit completo).

**Architecture:** Mirror estrito do padrão Skin/Deck já existente. Backend ganha entidades `Arena` + `UserArena`, coluna `equippedArena` em `users`, endpoints `/me/arenas` + `/me/equip-arena`, e thread de `arena` por `Player`. Frontend ganha multiplexer de Background, ArenaDecorationsLayer, getMascot temático, ArenaPicker modal — tudo idêntico em forma ao que existe pra Decks.

**Tech Stack:** Backend Node.js + Socket.io + TypeORM + PostgreSQL + zod + JWT. Frontend Next.js 15 + React 19 + TypeScript strict + Tailwind + framer-motion. Sem testes automatizados nesses módulos — validação por type-check (`npx tsc --noEmit`) + checklist manual.

**Working dirs:** Backend em `/Users/matheusdev/projects/bate-backend`, frontend em `/Users/matheusdev/projects/bate-frontend`. Branch atual: `feat/mascot-animations`.

---

## File structure overview

### Backend (`/Users/matheusdev/projects/bate-backend`)

**Created:**
- `src/server/db/entities/Arena.ts` — entity Arena (mirror Deck)
- `src/server/db/entities/UserArena.ts` — entity UserArena (mirror UserDeck)
- `src/server/db/arenas.ts` — listArenasForUser + equipArenaForUser + getEquippedArena (mirror decks.ts)
- `src/server/db/seed-arenas.ts` — seedDefaultArenas + backfillDefaultArenasToAllUsers (mirror seed-decks.ts)
- `src/server/db/migrations/1748180000000-AddArenas.ts` — DDL pra criar tabelas e adicionar coluna em users

**Modified:**
- `src/server/db/entities/User.ts` — adiciona `equippedArena` column
- `src/server/db/data-source.ts` — registra entities Arena + UserArena
- `src/server/db/users.ts` — `ensureUser` grant defaults arenas
- `src/server/index.ts` — endpoints `/me/arenas` + `/me/equip-arena` e boot seed/backfill
- `src/server/handlers/lobby-handlers.ts` — `lookupArena` + thread arena no `room:create` e `room:join`
- `src/server/storage/types.ts` — `CreateRoomInput.arena?` + `JoinInput.arena?`
- `src/server/storage/memory.ts` — popular `player.arena` no joinRoom
- `src/types/shared.ts` — `Player.arena: string`

### Frontend (`/Users/matheusdev/projects/bate-frontend`)

**Created:**
- `src/lib/arenas-api.ts` — listArenas + equipArena + ArenaView (mirror decks-api.ts)
- `src/lib/arena-decorations.ts` — config das decorações por arena
- `src/components/room2d/backgrounds/BackgroundDefault.tsx` — JSX atual extraído
- `src/components/room2d/backgrounds/BackgroundBoteco.tsx` — nova arte
- `src/components/room2d/ArenaDecorationsLayer.tsx` — renderiza decorações posicionadas
- `src/components/lobby/ArenaPicker.tsx` — modal picker (mirror DeckPicker)
- `public/arenas/default/thumb.webp` — placeholder (gerado por script)
- `public/arenas/boteco/thumb.webp` — placeholder
- `public/arenas/boteco/README.md` — lista os assets de arte esperados

**Modified:**
- `src/types/shared.ts` — mirror do Player.arena
- `src/components/room2d/Background.tsx` — vira multiplexer
- `src/components/room2d/GameArea.tsx` — passa arenaId pro Background + monta ArenaDecorationsLayer + table surface class
- `src/lib/mascot.ts` — adiciona getMascot(state, arenaId)
- `src/components/room2d/BateAnnouncement.tsx` — usa getMascot
- `src/components/effects/BatinhoOlhadinha.tsx` — usa getMascot
- `src/components/room/RoundEndScreen.tsx` — usa getMascot
- `src/components/room/MatchEndScreen.tsx` — usa getMascot
- `src/app/globals.css` — keyframes sway-slow, pulse + prefers-reduced-motion
- `src/app/page.tsx` — adiciona showArenas state + botão chrome + `<ArenaPicker />`

---

# Backend Tasks

## Task B1: Arena + UserArena entities + DataSource registration

**Files:**
- Create: `/Users/matheusdev/projects/bate-backend/src/server/db/entities/Arena.ts`
- Create: `/Users/matheusdev/projects/bate-backend/src/server/db/entities/UserArena.ts`
- Modify: `/Users/matheusdev/projects/bate-backend/src/server/db/data-source.ts`

- [ ] **Step 1: Create `Arena.ts` entity**

Arquivo: `src/server/db/entities/Arena.ts`

```ts
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'

export type ArenaUnlockType = 'default' | 'earned' | 'paid'

@Entity({ name: 'arenas' })
export class Arena {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id!: string

  @Column({ type: 'varchar', length: 64 })
  name!: string

  @Column({ type: 'varchar', length: 16, default: 'default' })
  unlockType!: ArenaUnlockType

  @Column({ type: 'int', default: 0 })
  priceCoins!: number

  @Column({ type: 'varchar', length: 255 })
  previewPath!: string

  @CreateDateColumn()
  createdAt!: Date
}
```

- [ ] **Step 2: Create `UserArena.ts` entity**

Arquivo: `src/server/db/entities/UserArena.ts`

```ts
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export type ArenaAcquisitionVia = 'default' | 'earned' | 'purchased'

@Entity({ name: 'user_arenas' })
@Index(['userId', 'arenaId'], { unique: true })
export class UserArena {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  userId!: string

  @Column({ type: 'varchar', length: 64 })
  arenaId!: string

  @Column({ type: 'varchar', length: 16, default: 'default' })
  acquiredVia!: ArenaAcquisitionVia

  @CreateDateColumn()
  acquiredAt!: Date
}
```

- [ ] **Step 3: Register entities in `data-source.ts`**

Modificar `src/server/db/data-source.ts`. Adicionar imports + entries no array `entities`:

```ts
import { Arena } from './entities/Arena'
import { UserArena } from './entities/UserArena'
```

E mudar:

```ts
entities: [User, Skin, UserSkin, Deck, UserDeck, Arena, UserArena],
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/matheusdev/projects/bate-backend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 5: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/db/entities/Arena.ts src/server/db/entities/UserArena.ts src/server/db/data-source.ts
git commit -m "add Arena and UserArena entities"
```

---

## Task B2: Migration AddArenas

**Files:**
- Create: `/Users/matheusdev/projects/bate-backend/src/server/db/migrations/1748180000000-AddArenas.ts`
- Modify: `/Users/matheusdev/projects/bate-backend/src/server/db/entities/User.ts`

- [ ] **Step 1: Add `equippedArena` column to User entity**

Modificar `src/server/db/entities/User.ts`. Adicionar coluna após `equippedDeck`:

```ts
  @Column({ type: 'varchar', length: 64, default: 'default' })
  equippedDeck!: string

  @Column({ type: 'varchar', length: 64, default: 'default' })
  equippedArena!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
```

- [ ] **Step 2: Create migration file**

Arquivo: `src/server/db/migrations/1748180000000-AddArenas.ts`

```ts
import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddArenas1748180000000 implements MigrationInterface {
  name = 'AddArenas1748180000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "equippedArena" varchar(64) NOT NULL DEFAULT 'default'`)

    await queryRunner.query(`
      CREATE TABLE "arenas" (
        "id" varchar(64) NOT NULL,
        "name" varchar(64) NOT NULL,
        "unlockType" varchar(16) NOT NULL DEFAULT 'default',
        "priceCoins" int NOT NULL DEFAULT 0,
        "previewPath" varchar(255) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_arenas_id" PRIMARY KEY ("id")
      )
    `)

    await queryRunner.query(`
      CREATE TABLE "user_arenas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "arenaId" varchar(64) NOT NULL,
        "acquiredVia" varchar(16) NOT NULL DEFAULT 'default',
        "acquiredAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_arenas_id" PRIMARY KEY ("id")
      )
    `)
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_arenas_unique" ON "user_arenas" ("userId", "arenaId")`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_arenas_unique"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_arenas"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "arenas"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "equippedArena"`)
  }
}
```

- [ ] **Step 3: Run migration locally**

```bash
cd /Users/matheusdev/projects/bate-backend && npm run migration:run
```

Expected: log mostra `AddArenas1748180000000 migrated successfully`. Se o comando `migration:run` não existir, rodar via `npx ts-node-esm src/server/db/run-migrations.ts` ou equivalente do projeto (checar `package.json` scripts).

- [ ] **Step 4: Verify schema via psql**

```bash
psql "$DATABASE_URL" -c "\dt arenas user_arenas" -c "\d users" | head -30
```

Expected: vê tabelas `arenas` e `user_arenas` listadas; coluna `equippedArena` em `users` com default `'default'`.

- [ ] **Step 5: Type-check**

```bash
cd /Users/matheusdev/projects/bate-backend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/db/migrations/1748180000000-AddArenas.ts src/server/db/entities/User.ts
git commit -m "add arenas migration with users.equippedArena column"
```

---

## Task B3: Arena queries (list / equip / getEquipped)

**Files:**
- Create: `/Users/matheusdev/projects/bate-backend/src/server/db/arenas.ts`

- [ ] **Step 1: Create `arenas.ts`**

Arquivo: `src/server/db/arenas.ts`

```ts
import { AppDataSource } from './data-source'
import { Arena } from './entities/Arena'
import { User } from './entities/User'
import { UserArena } from './entities/UserArena'

export type ArenaView = {
  id: string
  name: string
  unlockType: 'default' | 'earned' | 'paid'
  priceCoins: number
  previewPath: string
  owned: boolean
  equipped: boolean
}

export async function listArenasForUser(userId: string): Promise<ArenaView[]> {
  const [all, owned, user] = await Promise.all([
    AppDataSource.getRepository(Arena).find({ order: { unlockType: 'ASC', priceCoins: 'ASC' } }),
    AppDataSource.getRepository(UserArena).find({ where: { userId } }),
    AppDataSource.getRepository(User).findOne({ where: { id: userId } }),
  ])
  const ownedSet = new Set(owned.map(o => o.arenaId))
  const equipped = user?.equippedArena ?? 'default'
  return all.map(a => ({
    id: a.id,
    name: a.name,
    unlockType: a.unlockType,
    priceCoins: a.priceCoins,
    previewPath: a.previewPath,
    owned: ownedSet.has(a.id),
    equipped: equipped === a.id && ownedSet.has(a.id),
  }))
}

export async function equipArenaForUser(userId: string, arenaId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const owned = await AppDataSource.getRepository(UserArena).findOne({ where: { userId, arenaId } })
  if (!owned) return { ok: false, error: 'ARENA_NOT_OWNED' }
  await AppDataSource.getRepository(User).update({ id: userId }, { equippedArena: arenaId })
  return { ok: true }
}

export async function getEquippedArena(userId: string): Promise<string> {
  const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } })
  return user?.equippedArena ?? 'default'
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/matheusdev/projects/bate-backend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/db/arenas.ts
git commit -m "add arena DB queries (list, equip, getEquipped)"
```

---

## Task B4: Seed + backfill + grant on user creation

**Files:**
- Create: `/Users/matheusdev/projects/bate-backend/src/server/db/seed-arenas.ts`
- Modify: `/Users/matheusdev/projects/bate-backend/src/server/db/users.ts`

- [ ] **Step 1: Create `seed-arenas.ts`**

Arquivo: `src/server/db/seed-arenas.ts`

```ts
import { AppDataSource } from './data-source'
import { Arena } from './entities/Arena'
import { User } from './entities/User'
import { UserArena } from './entities/UserArena'

const DEFAULT_ARENAS: Array<Pick<Arena, 'id' | 'name' | 'unlockType' | 'priceCoins' | 'previewPath'>> = [
  { id: 'default', name: 'Padrão', unlockType: 'default', priceCoins: 0, previewPath: '/arenas/default/thumb.webp' },
  { id: 'boteco', name: 'Boteco do Batinho', unlockType: 'default', priceCoins: 0, previewPath: '/arenas/boteco/thumb.webp' },
]

export async function seedDefaultArenas(): Promise<{ inserted: number; updated: number }> {
  const repo = AppDataSource.getRepository(Arena)
  let inserted = 0
  let updated = 0
  for (const arena of DEFAULT_ARENAS) {
    const existing = await repo.findOne({ where: { id: arena.id } })
    if (existing) {
      await repo.update({ id: arena.id }, arena)
      updated += 1
    } else {
      await repo.insert(arena)
      inserted += 1
    }
  }
  return { inserted, updated }
}

export async function backfillDefaultArenasToAllUsers(): Promise<{ granted: number }> {
  const defaultArenaIds = (await AppDataSource.getRepository(Arena).find({ where: { unlockType: 'default' } })).map(a => a.id)
  if (defaultArenaIds.length === 0) return { granted: 0 }
  const users = await AppDataSource.getRepository(User).find({ select: ['id'] })
  const userArenaRepo = AppDataSource.getRepository(UserArena)
  let granted = 0
  for (const user of users) {
    for (const arenaId of defaultArenaIds) {
      const existing = await userArenaRepo.findOne({ where: { userId: user.id, arenaId } })
      if (existing) continue
      await userArenaRepo.insert({ userId: user.id, arenaId, acquiredVia: 'default' })
      granted += 1
    }
  }
  return { granted }
}
```

- [ ] **Step 2: Update `ensureUser` in `users.ts` to grant default arenas**

Modificar `src/server/db/users.ts`. Atualizar a função `ensureUser`:

```ts
import { AppDataSource } from './data-source'
import { User } from './entities/User'
import { Skin } from './entities/Skin'
import { Deck } from './entities/Deck'
import { Arena } from './entities/Arena'
import { UserSkin } from './entities/UserSkin'
import { UserDeck } from './entities/UserDeck'
import { UserArena } from './entities/UserArena'

export async function ensureUser(playerId: string, displayName = ''): Promise<User> {
  const repo = AppDataSource.getRepository(User)
  const existing = await repo.findOne({ where: { id: playerId } })
  if (existing) {
    existing.lastSeenAt = new Date()
    if (displayName && displayName !== existing.displayName) existing.displayName = displayName
    await repo.save(existing)
    return existing
  }
  const user = repo.create({ id: playerId, displayName, equippedSkin: 'default', equippedDeck: 'default', equippedArena: 'default' })
  await repo.save(user)
  const [defaultSkins, defaultDecks, defaultArenas] = await Promise.all([
    AppDataSource.getRepository(Skin).find({ where: { unlockType: 'default' } }),
    AppDataSource.getRepository(Deck).find({ where: { unlockType: 'default' } }),
    AppDataSource.getRepository(Arena).find({ where: { unlockType: 'default' } }),
  ])
  for (const skin of defaultSkins) await grantSkin(playerId, skin.id, 'default')
  for (const deck of defaultDecks) await grantDeck(playerId, deck.id, 'default')
  for (const arena of defaultArenas) await grantArena(playerId, arena.id, 'default')
  return user
}
```

Adicionar `grantArena` no fim do arquivo (depois de `grantSkin`):

```ts
export async function grantArena(userId: string, arenaId: string, via: 'default' | 'earned' | 'purchased' = 'default'): Promise<void> {
  const repo = AppDataSource.getRepository(UserArena)
  const existing = await repo.findOne({ where: { userId, arenaId } })
  if (existing) return
  await repo.insert({ userId, arenaId, acquiredVia: via })
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/matheusdev/projects/bate-backend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 4: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/db/seed-arenas.ts src/server/db/users.ts
git commit -m "seed default arenas and grant to users on creation"
```

---

## Task B5: Boot sequence in index.ts

**Files:**
- Modify: `/Users/matheusdev/projects/bate-backend/src/server/index.ts`

- [ ] **Step 1: Add seed/backfill arenas to boot**

Modificar `src/server/index.ts`. Adicionar import (próximo aos outros seeds):

```ts
import { seedDefaultArenas, backfillDefaultArenasToAllUsers } from './db/seed-arenas'
```

Adicionar bloco de seed/backfill após o de decks (linha ~234, depois do `} catch (err) { console.error('[db] seed/backfill decks failed:', err) }`):

```ts
    try {
      const seed = await seedDefaultArenas()
      console.log(`[db] seed arenas inserted=${seed.inserted} updated=${seed.updated}`)
      const backfill = await backfillDefaultArenasToAllUsers()
      console.log(`[db] backfill arenas granted=${backfill.granted}`)
    } catch (err) {
      console.error('[db] seed/backfill arenas failed:', err)
    }
```

- [ ] **Step 2: Start backend locally and check log**

```bash
cd /Users/matheusdev/projects/bate-backend && npm run dev
```

Expected stdout inclui:
```
[db] seed arenas inserted=2 updated=0
[db] backfill arenas granted=N    # N = quantidade de pares (user, arena) ainda não concedidos
```

Parar com Ctrl+C.

- [ ] **Step 3: Verify via psql**

```bash
psql "$DATABASE_URL" -c "SELECT id, name, \"unlockType\" FROM arenas"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM user_arenas"
```

Expected: 2 arenas listadas (`default`, `boteco`); user_arenas count = 2 * número de users.

- [ ] **Step 4: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/index.ts
git commit -m "seed and backfill arenas on boot"
```

---

## Task B6: HTTP endpoints (/me/arenas, /me/equip-arena)

**Files:**
- Modify: `/Users/matheusdev/projects/bate-backend/src/server/index.ts`

- [ ] **Step 1: Add import for arena queries**

No topo de `src/server/index.ts`, junto dos outros imports de db (próximo a `listDecksForUser, equipDeckForUser`):

```ts
import { listArenasForUser, equipArenaForUser } from './db/arenas'
```

- [ ] **Step 2: Add `/me/arenas` GET endpoint**

Adicionar bloco após o handler de `/me/decks` GET (procurar pelo bloco que começa com `if (req.url === '/me/decks' && req.method === 'GET')` e adicionar logo após o `return` final daquele bloco):

```ts
  if (req.url === '/me/arenas' && req.method === 'GET') {
    const token = readSessionCookie(req.headers.cookie)
    const claims = token ? verifyToken(token) : null
    if (!claims) { sendJson(req, res, 401, { error: 'UNAUTHORIZED' }); return }
    if (!AppDataSource.isInitialized) { sendJson(req, res, 503, { error: 'DB_UNAVAILABLE' }); return }
    listArenasForUser(claims.sub)
      .then(arenas => sendJson(req, res, 200, { arenas }))
      .catch(err => {
        console.error('[me/arenas] failed:', err)
        sendJson(req, res, 500, { error: 'SERVER_ERROR' })
      })
    return
  }
```

- [ ] **Step 3: Add `/me/equip-arena` POST endpoint**

Adicionar logo após o handler `/me/equip-deck` POST:

```ts
  if (req.url === '/me/equip-arena' && req.method === 'POST') {
    const token = readSessionCookie(req.headers.cookie)
    const claims = token ? verifyToken(token) : null
    if (!claims) { sendJson(req, res, 401, { error: 'UNAUTHORIZED' }); return }
    if (!AppDataSource.isInitialized) { sendJson(req, res, 503, { error: 'DB_UNAVAILABLE' }); return }
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => {
      let arenaId: string | null = null
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as { arenaId?: unknown }
        if (typeof body.arenaId === 'string' && /^[a-z0-9_-]{1,64}$/.test(body.arenaId)) arenaId = body.arenaId
      } catch { /* invalid json */ }
      if (!arenaId) { sendJson(req, res, 400, { error: 'INVALID_ARENA_ID' }); return }
      equipArenaForUser(claims.sub, arenaId)
        .then(result => {
          if (!result.ok) { sendJson(req, res, 403, { error: result.error }); return }
          sendJson(req, res, 200, { ok: true, equippedArena: arenaId })
        })
        .catch(err => {
          console.error('[me/equip-arena] failed:', err)
          sendJson(req, res, 500, { error: 'SERVER_ERROR' })
        })
    })
    return
  }
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/matheusdev/projects/bate-backend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 5: Validate endpoints via curl**

Start backend (`npm run dev`), get a guest session cookie:

```bash
COOKIE=$(curl -sI -X POST http://localhost:8787/auth/guest -H 'Content-Type: application/json' -d '{}' | grep -i set-cookie | cut -d':' -f2- | cut -d';' -f1 | xargs)

# List arenas
curl -s http://localhost:8787/me/arenas -H "Cookie: $COOKIE" | jq .
# Expected: { "arenas": [ { "id":"default", "owned":true, ... }, { "id":"boteco", "owned":true, ... } ] }

# Equip boteco
curl -s -X POST http://localhost:8787/me/equip-arena -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"arenaId":"boteco"}' | jq .
# Expected: { "ok": true, "equippedArena": "boteco" }

# Equip inexistente
curl -s -X POST http://localhost:8787/me/equip-arena -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"arenaId":"inexistente"}' | jq .
# Expected: { "error": "ARENA_NOT_OWNED" } com status 403
```

Substitua `localhost:8787` pela porta usada pelo backend (verificar em `src/server/index.ts` ou env `PORT`).

- [ ] **Step 6: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/index.ts
git commit -m "add /me/arenas and /me/equip-arena endpoints"
```

---

## Task B7: Player.arena in shared types + storage threading

**Files:**
- Modify: `/Users/matheusdev/projects/bate-backend/src/types/shared.ts`
- Modify: `/Users/matheusdev/projects/bate-backend/src/server/storage/types.ts`
- Modify: `/Users/matheusdev/projects/bate-backend/src/server/storage/memory.ts`

- [ ] **Step 1: Add `arena` field to `Player` in backend shared types**

Modificar `src/types/shared.ts`. Adicionar campo `arena` no tipo `Player`:

```ts
export type Player = {
  id: string
  socketId: string | null
  name: string
  hand: Card[]
  score: number
  connected: boolean
  disconnectedAt: number | null
  revealedToSelf: string[]
  skin: string
  deck: string
  arena: string
}
```

- [ ] **Step 2: Add `arena?` to CreateRoomInput and JoinInput in storage types**

Modificar `src/server/storage/types.ts`:

```ts
export type CreateRoomInput = {
  name: string
  hostId: string
  hostName: string
  maxPlayers: 2 | 3 | 4
  turnTimeLimitSec?: number | null
  skin?: string
  deck?: string
  arena?: string
}

export type JoinInput = { playerId: string; playerName: string; skin?: string; deck?: string; arena?: string }
```

- [ ] **Step 3: Populate `player.arena` in `memory.ts` joinRoom**

Modificar `src/server/storage/memory.ts`. No bloco que constrói o novo `Player` (próximo às linhas 51-62), adicionar `arena`:

```ts
    const player: Player = {
      id: input.playerId,
      socketId: null,
      name: input.playerName,
      hand: [],
      score: 0,
      connected: true,
      disconnectedAt: null,
      revealedToSelf: [],
      skin: input.skin ?? 'default',
      deck: input.deck ?? 'default',
      arena: input.arena ?? 'default',
    }
```

Verificar se há outros lugares em `memory.ts` que constroem `Player` (ex: na função `createRoom` pro host). Se sim, adicionar `arena: input.arena ?? 'default'` em todos os pontos. Buscar com:

```bash
grep -n "skin:" /Users/matheusdev/projects/bate-backend/src/server/storage/memory.ts
```

Em cada ocorrência, adicionar `arena: input.arena ?? 'default'` na linha seguinte ao `deck:`.

- [ ] **Step 4: Repeat for `redis.ts` storage if it also constructs Player**

```bash
grep -n "skin:\|deck:" /Users/matheusdev/projects/bate-backend/src/server/storage/redis.ts
```

Se aparecer ocorrência, adicionar `arena: input.arena ?? 'default'` no mesmo padrão. Se não aparecer (porque o redis storage compartilha código com memory), nada a fazer.

- [ ] **Step 5: Type-check**

```bash
cd /Users/matheusdev/projects/bate-backend && npx tsc --noEmit
```

Expected: `0 errors`. Se houver erros do tipo "Property 'arena' is missing", procurar todos os lugares que constroem `Player` literalmente e adicionar `arena: 'default'` (ex: `src/server/game/engine.ts`, redact, etc):

```bash
grep -rn "revealedToSelf:" /Users/matheusdev/projects/bate-backend/src
```

Cada literal de Player precisa de `arena`.

- [ ] **Step 6: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/types/shared.ts src/server/storage/types.ts src/server/storage/memory.ts src/server/storage/redis.ts src/server/game/
git commit -m "add arena field to Player type and storage inputs"
```

---

## Task B8: lobby-handlers lookupArena + thread through

**Files:**
- Modify: `/Users/matheusdev/projects/bate-backend/src/server/handlers/lobby-handlers.ts`

- [ ] **Step 1: Add import + lookupArena helper**

Modificar `src/server/handlers/lobby-handlers.ts`. Adicionar import junto aos outros (linha 7):

```ts
import { getEquippedArena } from '../db/arenas'
```

Adicionar helper logo após `lookupDeck` (linha ~25):

```ts
async function lookupArena(playerId: string): Promise<string> {
  if (!AppDataSource.isInitialized) return 'default'
  try {
    return await getEquippedArena(playerId)
  } catch {
    return 'default'
  }
}
```

- [ ] **Step 2: Thread arena through `room:create` handler**

No handler `room:create` (~linha 50), atualizar a chamada `Promise.all`:

```ts
  socket.on('room:create', async (raw: unknown, ack: (res: { roomId?: string; error?: string }) => void) => {
    const payload = parseAndAuth(RoomCreateSchema, raw, ack, socket)
    if (!payload) return
    try {
      const [skin, deck, arena] = await Promise.all([lookupSkin(payload.hostId), lookupDeck(payload.hostId), lookupArena(payload.hostId)])
      const state = await lobby.createRoom({ ...payload, skin, deck, arena })
      ack({ roomId: state.roomId })
      io.to('lobby').emit('lobby:update', { rooms: await lobby.listRooms() })
    } catch (err) {
      ack({ error: err instanceof Error ? err.message : 'UNKNOWN' })
    }
  })
```

- [ ] **Step 3: Thread arena through `room:join` handler**

No handler `room:join` (~linha 104), atualizar o `Promise.all` e o `player.X` assignment:

```ts
  socket.on('room:join', async (raw: unknown, ack: (res: { ok?: true; error?: string }) => void) => {
    const payload = parseAndAuth(RoomJoinSchema, raw, ack, socket)
    if (!payload) return
    try {
      const [skin, deck, arena] = await Promise.all([lookupSkin(payload.playerId), lookupDeck(payload.playerId), lookupArena(payload.playerId)])
      const state = await lobby.withRoomLock(payload.roomId, async () => {
        const next = await lobby.joinRoom(payload.roomId, { ...payload, skin, deck, arena })
        const player = next.players.find(p => p.id === payload.playerId)
        if (player) {
          player.socketId = socket.id
          player.skin = skin
          player.deck = deck
          player.arena = arena
        }
        await lobby.setRoom(next)
        return next
      })
      socket.join(payload.roomId)
      await lobby.bindSocket(socket.id, payload.roomId, payload.playerId)
      console.log(`[room:join] socket=${socket.id} player=${payload.playerId} room=${payload.roomId} totalPlayers=${state.players.length}`)
      ack({ ok: true })
      broadcastRoom(io, state)
      io.to('lobby').emit('lobby:update', { rooms: await lobby.listRooms() })
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/matheusdev/projects/bate-backend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 5: Smoke test backend integration**

Start backend, abrir 2 abas do frontend, criar sala em uma, entrar com outra. Conferir logs do backend não geram erro. Apos `room:join`, fazer:

```bash
curl -s http://localhost:8787/health | jq .
```

(só pra confirmar processo vivo). Os players agora devem ter `arena: 'default'` no state.

- [ ] **Step 6: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/handlers/lobby-handlers.ts
git commit -m "thread arena through room:create and room:join"
```

---

# Frontend Tasks

## Task F1: Mirror Player.arena in frontend types

**Files:**
- Modify: `/Users/matheusdev/projects/bate-frontend/src/types/shared.ts`

- [ ] **Step 1: Add `arena` field to Player**

Modificar `src/types/shared.ts`. No tipo Player (linha 36):

```ts
export type Player = {
  id: string
  socketId: string | null
  name: string
  hand: Card[]
  score: number
  connected: boolean
  disconnectedAt: number | null
  revealedToSelf: string[]
  skin: string
  deck: string
  arena: string
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/matheusdev/projects/bate-frontend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/types/shared.ts
git commit -m "add arena field to Player type"
```

---

## Task F2: arenas-api.ts client

**Files:**
- Create: `/Users/matheusdev/projects/bate-frontend/src/lib/arenas-api.ts`

- [ ] **Step 1: Create `arenas-api.ts`**

Arquivo: `src/lib/arenas-api.ts`

```ts
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? ''

export type ArenaView = {
  id: string
  name: string
  unlockType: 'default' | 'earned' | 'paid'
  priceCoins: number
  previewPath: string
  owned: boolean
  equipped: boolean
}

function url(path: string): string {
  if (!SOCKET_URL) return path
  return SOCKET_URL.replace(/\/$/, '') + path
}

export async function listArenas(): Promise<ArenaView[]> {
  const res = await fetch(url('/me/arenas'), { credentials: 'include' })
  if (!res.ok) throw new Error(`listArenas ${res.status}`)
  const data = (await res.json()) as { arenas: ArenaView[] }
  return data.arenas
}

export async function equipArena(arenaId: string): Promise<{ ok: true; equippedArena: string } | { ok: false; error: string }> {
  const res = await fetch(url('/me/equip-arena'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arenaId }),
  })
  const data = (await res.json()) as { ok?: true; equippedArena?: string; error?: string }
  if (data.ok && data.equippedArena) return { ok: true, equippedArena: data.equippedArena }
  return { ok: false, error: data.error ?? 'UNKNOWN' }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/matheusdev/projects/bate-frontend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/lib/arenas-api.ts
git commit -m "add arenas-api client"
```

---

## Task F3: Refactor Background.tsx into multiplexer + BackgroundDefault

**Files:**
- Create: `/Users/matheusdev/projects/bate-frontend/src/components/room2d/backgrounds/BackgroundDefault.tsx`
- Modify: `/Users/matheusdev/projects/bate-frontend/src/components/room2d/Background.tsx`

- [ ] **Step 1: Create directory and `BackgroundDefault.tsx`**

```bash
mkdir -p /Users/matheusdev/projects/bate-frontend/src/components/room2d/backgrounds
```

Arquivo: `src/components/room2d/backgrounds/BackgroundDefault.tsx`

```tsx
'use client'

import { Spade, Heart, Diamond, Club } from 'lucide-react'

export function BackgroundDefault() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-bate-cream">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255, 184, 28, 0.18) 0%, rgba(74, 124, 79, 0.10) 45%, transparent 75%),
            repeating-linear-gradient(45deg, rgba(26, 14, 8, 0.025) 0px, rgba(26, 14, 8, 0.025) 1px, transparent 1px, transparent 6px)
          `,
        }}
      />

      <div className="absolute inset-0 pointer-events-none opacity-[0.06] text-bate-ink">
        <Spade size={420} strokeWidth={1.2} className="absolute -top-16 -left-10" style={{ transform: 'rotate(-22deg)' }} />
        <Heart size={360} strokeWidth={1.2} className="absolute top-1/3 -right-16" style={{ transform: 'rotate(14deg)' }} />
        <Diamond size={360} strokeWidth={1.2} className="absolute -bottom-12 -left-16" style={{ transform: 'rotate(-10deg)' }} />
        <Club size={420} strokeWidth={1.2} className="absolute -bottom-20 -right-10" style={{ transform: 'rotate(28deg)' }} />
      </div>

      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Refactor `Background.tsx` to multiplexer**

Sobrescrever `src/components/room2d/Background.tsx`:

```tsx
'use client'

import { BackgroundDefault } from './backgrounds/BackgroundDefault'
import { BackgroundBoteco } from './backgrounds/BackgroundBoteco'

export function Background({ arenaId = 'default' }: { arenaId?: string }) {
  switch (arenaId) {
    case 'boteco':
      return <BackgroundBoteco />
    case 'default':
    default:
      return <BackgroundDefault />
  }
}
```

Note: `BackgroundBoteco` ainda não existe — vai ser criado em F4. Type-check vai falhar até lá (esperado).

- [ ] **Step 3: Commit (mesmo com type error temporário esperado, F4 resolve)**

Não fazer commit ainda — segurar até F4 estar OK pra commit unificado.

---

## Task F4: BackgroundBoteco component (CSS-art)

**Files:**
- Create: `/Users/matheusdev/projects/bate-frontend/src/components/room2d/backgrounds/BackgroundBoteco.tsx`

- [ ] **Step 1: Create `BackgroundBoteco.tsx`**

Arquivo: `src/components/room2d/backgrounds/BackgroundBoteco.tsx`

```tsx
'use client'

export function BackgroundBoteco() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor: '#5a3a1f' }}>
      {/* parede de tijolinho */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 22px),
            repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 40px)
          `,
        }}
      />

      {/* luz quente da janela à direita */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 50% at 95% 30%, rgba(255,184,28,0.35) 0%, transparent 70%)',
        }}
      />

      {/* chão de madeira escura na base */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '30%',
          background: 'linear-gradient(180deg, transparent 0%, #2d1810 40%, #1a0e08 100%)',
        }}
      />

      {/* neon hero (asset opcional — se não existir, dica visual fica no background) */}
      <img
        src="/arenas/boteco/neon-bar-do-batinho.webp"
        alt=""
        aria-hidden
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        className="absolute top-6 left-6 w-48 opacity-90 pointer-events-none select-none"
        style={{ filter: 'drop-shadow(0 0 12px rgba(255,184,28,0.6))' }}
      />
    </div>
  )
}
```

O `onError` esconde a `<img>` se o asset ainda não existir (durante MVP, antes da arte chegar).

- [ ] **Step 2: Type-check**

```bash
cd /Users/matheusdev/projects/bate-frontend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 3: Commit F3 + F4 juntos**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/components/room2d/Background.tsx src/components/room2d/backgrounds/
git commit -m "refactor Background into multiplexer with default and boteco variants"
```

---

## Task F5: ArenaDecorationsLayer + config + CSS animations

**Files:**
- Create: `/Users/matheusdev/projects/bate-frontend/src/lib/arena-decorations.ts`
- Create: `/Users/matheusdev/projects/bate-frontend/src/components/room2d/ArenaDecorationsLayer.tsx`
- Modify: `/Users/matheusdev/projects/bate-frontend/src/app/globals.css`

- [ ] **Step 1: Create `arena-decorations.ts` config**

Arquivo: `src/lib/arena-decorations.ts`

```ts
export type DecorationAnimation = 'sway-slow' | 'sway-fast' | 'pulse' | 'none'

export type ArenaDecoration = {
  asset: string
  position: { left?: string; right?: string; top?: string; bottom?: string }
  size: { width: number; height: number }
  animation: DecorationAnimation
}

export const ARENA_DECORATIONS: Record<string, ArenaDecoration[]> = {
  default: [],
  boteco: [
    { asset: 'copo-chope',    position: { right: '24px', bottom: '120px' },         size: { width: 80, height: 100 }, animation: 'sway-slow' },
    { asset: 'amendoim',      position: { left: '20px',  bottom: '110px' },         size: { width: 70, height: 50  }, animation: 'none' },
    { asset: 'pendente-luz',  position: { left: 'calc(50% - 30px)', top: '40px' },  size: { width: 60, height: 80  }, animation: 'pulse' },
  ],
}
```

- [ ] **Step 2: Create `ArenaDecorationsLayer.tsx`**

Arquivo: `src/components/room2d/ArenaDecorationsLayer.tsx`

```tsx
'use client'

import { ARENA_DECORATIONS } from '@/lib/arena-decorations'

export function ArenaDecorationsLayer({ arenaId = 'default' }: { arenaId?: string }) {
  const decorations = ARENA_DECORATIONS[arenaId] ?? []
  if (decorations.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none -z-[5] overflow-hidden" aria-hidden>
      {decorations.map((d, i) => (
        <img
          key={`${d.asset}-${i}`}
          src={`/arenas/${arenaId}/decorations/${d.asset}.webp`}
          alt=""
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          className={`absolute select-none deco-anim-${d.animation}`}
          style={{
            ...d.position,
            width: d.size.width,
            height: d.size.height,
            willChange: d.animation === 'none' ? 'auto' : 'transform, filter',
          }}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Add keyframes to `globals.css`**

Modificar `src/app/globals.css`. Adicionar no final do arquivo:

```css
@keyframes deco-sway-slow {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}
@keyframes deco-sway-fast {
  0%, 100% { transform: rotate(-2deg) translateY(0); }
  50%      { transform: rotate(2deg) translateY(-2px); }
}
@keyframes deco-pulse {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(255,184,28,0.6)); }
  50%      { filter: drop-shadow(0 0 18px rgba(255,184,28,1)); }
}

.deco-anim-sway-slow { animation: deco-sway-slow 4s ease-in-out infinite; transform-origin: top center; }
.deco-anim-sway-fast { animation: deco-sway-fast 2.4s ease-in-out infinite; transform-origin: top center; }
.deco-anim-pulse     { animation: deco-pulse 2s ease-in-out infinite; }
.deco-anim-none      { animation: none; }

@media (prefers-reduced-motion: reduce) {
  .deco-anim-sway-slow, .deco-anim-sway-fast, .deco-anim-pulse {
    animation: none;
  }
}
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/matheusdev/projects/bate-frontend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 5: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/lib/arena-decorations.ts src/components/room2d/ArenaDecorationsLayer.tsx src/app/globals.css
git commit -m "add arena decorations layer with css animations"
```

---

## Task F6: Refactor mascot.ts — add getMascot(state, arenaId)

**Files:**
- Modify: `/Users/matheusdev/projects/bate-frontend/src/lib/mascot.ts`

- [ ] **Step 1: Add `getMascot` function and config**

Modificar `src/lib/mascot.ts`. Adicionar no fim do arquivo (mantendo `MASCOT` const e `skinImage` intactos):

```ts
const ARENA_MASCOT_STATES: Record<string, Set<MascotKey>> = {
  boteco: new Set<MascotKey>(['bate', 'lupa', 'feliz', 'chorando', 'trofeu', 'confuso', 'tempoAcabando']),
}

export function getMascot(state: MascotKey, arenaId: string = 'default'): string {
  const states = ARENA_MASCOT_STATES[arenaId]
  if (states?.has(state)) {
    const fileName = state === 'tempoAcabando' ? 'tempo-acabando' : state
    return `/arenas/${arenaId}/batinho/${fileName}.webp`
  }
  return MASCOT[state]
}
```

`MascotKey` é o keyof typeof MASCOT já existente. `tempoAcabando` (camelCase no const) é mapeado pra `tempo-acabando.webp` (kebab no asset path) pra bater com convenção dos batinhos default.

- [ ] **Step 2: Type-check**

```bash
cd /Users/matheusdev/projects/bate-frontend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 3: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/lib/mascot.ts
git commit -m "add getMascot function with arena-aware mascot variants"
```

---

## Task F7: GameArea consumes arena + mounts decorations + table surface class

**Files:**
- Modify: `/Users/matheusdev/projects/bate-frontend/src/components/room2d/GameArea.tsx`
- Modify: `/Users/matheusdev/projects/bate-frontend/src/app/globals.css`

- [ ] **Step 1: Identify current Background usage in GameArea**

```bash
grep -n "Background\|<table\|table-surface\|deck.*discard\|DeckPile2D.*DiscardPile2D" /Users/matheusdev/projects/bate-frontend/src/components/room2d/GameArea.tsx
```

Anotar o número da linha onde aparece `<Background />`.

- [ ] **Step 2: Import ArenaDecorationsLayer + extract arenaId from `me`**

Modificar `src/components/room2d/GameArea.tsx`. Adicionar import junto aos outros (próximo a `import { Background } from './Background'`):

```ts
import { ArenaDecorationsLayer } from './ArenaDecorationsLayer'
```

Logo após o cálculo de `me` (próximo à linha 34 `const me = state.players.find(...)`), adicionar:

```ts
const arenaId = me?.arena ?? 'default'
```

- [ ] **Step 3: Replace `<Background />` and mount decorations**

Onde aparece `<Background />`, substituir por:

```tsx
<Background arenaId={arenaId} />
<ArenaDecorationsLayer arenaId={arenaId} />
```

- [ ] **Step 4: Apply table-surface class to deck/discard container**

Procurar no JSX o container que agrupa DeckPile2D + DiscardPile2D (geralmente um `<div>` com flex/grid):

```bash
grep -n "DeckPile2D\|DiscardPile2D" /Users/matheusdev/projects/bate-frontend/src/components/room2d/GameArea.tsx
```

Identificar o `<div>` pai imediato dos dois. Adicionar a classe `table-surface table-surface-${arenaId}` ao className existente:

```tsx
<div className={`... existing classes ... table-surface table-surface-${arenaId}`}>
  <DeckPile2D ... />
  <DiscardPile2D ... />
</div>
```

- [ ] **Step 5: Add table-surface CSS classes to `globals.css`**

Modificar `src/app/globals.css`. Adicionar no final:

```css
.table-surface {
  position: relative;
}
.table-surface-default {
  /* mantém visual atual sem mudança */
}
.table-surface-boteco {
  background: repeating-linear-gradient(45deg, #c83737 0 18px, #faf3e0 18px 36px);
  border: 3px solid #5a3a1f;
  box-shadow: inset 0 0 24px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 8px;
}
```

- [ ] **Step 6: Type-check**

```bash
cd /Users/matheusdev/projects/bate-frontend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 7: Visual smoke test**

Subir backend + frontend (`npm run dev` em cada). Equipar boteco via curl ou após task F10 via UI. Entrar em sala. Esperado:
- Background com parede de tijolinho marrom e luz quente à direita
- Mesa com toalha xadrez vermelho/cream
- Decorações nos cantos (mesmo sem assets — placeholder não renderiza, mas layout não quebra)

- [ ] **Step 8: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/components/room2d/GameArea.tsx src/app/globals.css
git commit -m "wire GameArea to arena: background, decorations, table surface"
```

---

## Task F8: Update mascot consumers to use getMascot(state, arenaId)

**Files:**
- Modify: `/Users/matheusdev/projects/bate-frontend/src/components/room2d/BateAnnouncement.tsx`
- Modify: `/Users/matheusdev/projects/bate-frontend/src/components/effects/BatinhoOlhadinha.tsx`
- Modify: `/Users/matheusdev/projects/bate-frontend/src/components/room/RoundEndScreen.tsx`
- Modify: `/Users/matheusdev/projects/bate-frontend/src/components/room/MatchEndScreen.tsx`

- [ ] **Step 1: Find all MASCOT.xxx usages**

```bash
grep -rn "MASCOT\." /Users/matheusdev/projects/bate-frontend/src --include="*.tsx" --include="*.ts"
```

Listar os arquivos e linhas. Tipicamente:
- `BateAnnouncement.tsx`: `MASCOT.bate`
- `BatinhoOlhadinha.tsx`: `MASCOT.lupa` (ou hardcoded path `/batinho/batinho-lupa.webp`)
- `RoundEndScreen.tsx`: `MASCOT.trofeu`, `MASCOT.chorando`
- `MatchEndScreen.tsx`: `MASCOT.trofeu`

- [ ] **Step 2: Refactor `BateAnnouncement.tsx`**

Modificar `src/components/room2d/BateAnnouncement.tsx`:

Trocar import:
```ts
import { getMascot } from '@/lib/mascot'
```
(remover `import { MASCOT } from '@/lib/mascot'` se for o único uso)

Trocar a leitura de `state.players.find(...)` pra também extrair arena do "me" — adicionar próximo ao topo do componente:
```ts
const myId = getPlayerId()
const me = state.players.find(p => p.id === myId)
const arenaId = me?.arena ?? 'default'
```

Se `getPlayerId` não estiver importado, adicionar:
```ts
import { getPlayerId } from '@/lib/player-id'
```

E trocar `src={MASCOT.bate}` por:
```tsx
src={getMascot('bate', arenaId)}
```

- [ ] **Step 3: Refactor `BatinhoOlhadinha.tsx`**

Modificar `src/components/effects/BatinhoOlhadinha.tsx`. Hoje o componente recebe `src` opcional default `/batinho/batinho-lupa.webp`. Trocar pra:

Add prop `arenaId`:
```ts
type Props = {
  size?: number
  onComplete?: () => void
  arenaId?: string
}

export function BatinhoOlhadinha({ size = 400, onComplete, arenaId = 'default' }: Props) {
```

Trocar o `src={src}` no `<img>` por:
```tsx
src={getMascot('lupa', arenaId)}
```

E import:
```ts
import { getMascot } from '@/lib/mascot'
```

Quem usa `<BatinhoOlhadinha />` (procurar com grep) precisa passar `arenaId={arenaId}` se quer respeitar o tema. Em GameArea ou MascotOverlay, adicionar a prop.

```bash
grep -rn "BatinhoOlhadinha" /Users/matheusdev/projects/bate-frontend/src
```

- [ ] **Step 4: Refactor `RoundEndScreen.tsx` and `MatchEndScreen.tsx`**

Modificar `src/components/room/RoundEndScreen.tsx` e `MatchEndScreen.tsx`. Em cada um:

Adicionar import:
```ts
import { getMascot } from '@/lib/mascot'
```

Identificar arenaId — buscar como o componente recebe `state` ou `me`. Se recebe `state: RedactedState`, extrair:
```ts
const myId = getPlayerId()
const arenaId = state.players.find(p => p.id === myId)?.arena ?? 'default'
```

Trocar `MASCOT.trofeu` → `getMascot('trofeu', arenaId)`, `MASCOT.chorando` → `getMascot('chorando', arenaId)`, etc.

- [ ] **Step 5: Type-check**

```bash
cd /Users/matheusdev/projects/bate-frontend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 6: Visual smoke test**

Com arena `default` equipada, jogar até BATE e fim de round. Confirmar que todas as animações continuam mostrando os mascotes default (sem mudança visual).

- [ ] **Step 7: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/components/room2d/BateAnnouncement.tsx src/components/effects/BatinhoOlhadinha.tsx src/components/room/RoundEndScreen.tsx src/components/room/MatchEndScreen.tsx
git commit -m "use getMascot in mascot consumers"
```

---

## Task F9: ArenaPicker component + chrome button

**Files:**
- Create: `/Users/matheusdev/projects/bate-frontend/src/components/lobby/ArenaPicker.tsx`
- Modify: `/Users/matheusdev/projects/bate-frontend/src/app/page.tsx`

- [ ] **Step 1: Create `ArenaPicker.tsx` (mirror DeckPicker)**

Arquivo: `src/components/lobby/ArenaPicker.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Lock } from 'lucide-react'
import { listArenas, equipArena, type ArenaView } from '@/lib/arenas-api'
import { toast } from '@/lib/ui-store'

export function ArenaPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [arenas, setArenas] = useState<ArenaView[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    listArenas().then(setArenas).catch(err => {
      console.error('[arenas] list failed', err)
      toast.error('Não consegui carregar as arenas')
    })
  }, [open])

  async function pick(arena: ArenaView) {
    if (!arena.owned) {
      toast.info(arena.unlockType === 'paid' ? `${arena.name} custa ${arena.priceCoins} moedas` : `${arena.name} ainda bloqueado`)
      return
    }
    if (arena.equipped) return
    setBusy(arena.id)
    const result = await equipArena(arena.id)
    setBusy(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setArenas(prev => prev?.map(a => ({ ...a, equipped: a.id === arena.id && a.owned })) ?? prev)
    toast.success(`Arena ${arena.name} equipada`)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onClick={e => e.stopPropagation()}
            className="bg-bate-paper rounded-3xl p-5 sm:p-6 max-w-2xl w-full border-[4px] border-bate-ink shadow-hard-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl sm:text-3xl text-bate-ink">ARENAS</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm flex items-center justify-center hover:bg-bate-cream"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
            {!arenas ? (
              <div className="py-10 text-center font-display text-bate-ink/60">Carregando…</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {arenas.map(arena => {
                  const dim = !arena.owned
                  return (
                    <button
                      key={arena.id}
                      type="button"
                      onClick={() => pick(arena)}
                      disabled={busy === arena.id}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-[3px] transition-all ${
                        arena.equipped
                          ? 'bg-bate-gold border-bate-ink shadow-hard'
                          : 'bg-bate-cream border-bate-ink shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard'
                      } ${dim ? 'opacity-60' : ''} ${busy === arena.id ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden border-[2px] border-bate-ink bg-bate-paper">
                        <img
                          src={arena.previewPath}
                          alt={arena.name}
                          className="w-full h-full object-cover select-none"
                          draggable={false}
                          onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
                        />
                        {dim && (
                          <div className="absolute inset-0 flex items-center justify-center bg-bate-ink/30">
                            <Lock size={28} className="text-bate-paper" />
                          </div>
                        )}
                        {arena.equipped && (
                          <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-bate-green text-bate-paper border-[2px] border-bate-ink flex items-center justify-center shadow-hard-sm">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="font-display text-[11px] sm:text-xs text-bate-ink text-center leading-tight">{arena.name}</div>
                      {arena.unlockType === 'paid' && !arena.owned && (
                        <div className="font-body text-[10px] text-bate-red-deep">🪙 {arena.priceCoins}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Wire picker into `page.tsx`**

Modificar `src/app/page.tsx`.

Adicionar import:
```ts
import { ArenaPicker } from '@/components/lobby/ArenaPicker'
import { Tent } from 'lucide-react'
```

Adicionar state próximo aos outros showX (linha ~37):
```ts
const [showArenas, setShowArenas] = useState(false)
```

Adicionar botão no chrome de top-right (próximo ao botão de Decks na linha ~194-200). Após o botão de Decks:

```tsx
<button
  type="button"
  onClick={() => setShowArenas(true)}
  title="Arenas"
  className="w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
>
  <Tent size={16} strokeWidth={3} />
</button>
```

Adicionar `<ArenaPicker />` no final do JSX, próximo aos outros pickers (linha ~270):

```tsx
<ArenaPicker open={showArenas} onClose={() => setShowArenas(false)} />
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/matheusdev/projects/bate-frontend && npx tsc --noEmit
```

Expected: `0 errors`.

- [ ] **Step 4: Visual smoke test**

Abrir frontend. No lobby, deve aparecer o novo botão (ícone de tenda) no top-right. Clicar abre modal com 2 arenas (default + boteco). Clicar em Boteco → toast "Arena Boteco do Batinho equipada" → badge check verde aparece no boteco.

Entrar em sala. Background muda pra parede de tijolinho + luz quente + mesa com toalha xadrez.

- [ ] **Step 5: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/components/lobby/ArenaPicker.tsx src/app/page.tsx
git commit -m "add arena picker modal and lobby chrome button"
```

---

## Task F10: Asset placeholders + README documenting expected art

**Files:**
- Create: `/Users/matheusdev/projects/bate-frontend/public/arenas/default/thumb.webp` (placeholder)
- Create: `/Users/matheusdev/projects/bate-frontend/public/arenas/boteco/thumb.webp` (placeholder)
- Create: `/Users/matheusdev/projects/bate-frontend/public/arenas/boteco/README.md`

- [ ] **Step 1: Create directories**

```bash
cd /Users/matheusdev/projects/bate-frontend
mkdir -p public/arenas/default public/arenas/boteco/decorations public/arenas/boteco/batinho
```

- [ ] **Step 2: Generate placeholder thumbnails via sharp**

Sharp já está em dependencies pelo projeto (usado em `scripts/optimize-cards.mjs`). Criar script ad-hoc:

```bash
cd /Users/matheusdev/projects/bate-frontend
node --input-type=module -e "
import sharp from 'sharp'

const defaultThumb = await sharp({
  create: { width: 240, height: 160, channels: 4, background: { r: 250, g: 243, b: 224, alpha: 1 } },
})
  .composite([
    { input: Buffer.from('<svg width=\"240\" height=\"160\"><text x=\"120\" y=\"95\" font-family=\"sans-serif\" font-size=\"36\" font-weight=\"bold\" fill=\"#1a0e08\" text-anchor=\"middle\">PADRÃO</text></svg>'), top: 0, left: 0 },
  ])
  .webp({ quality: 90 })
  .toBuffer()
await sharp(defaultThumb).toFile('public/arenas/default/thumb.webp')

const botecoThumb = await sharp({
  create: { width: 240, height: 160, channels: 4, background: { r: 90, g: 58, b: 31, alpha: 1 } },
})
  .composite([
    { input: Buffer.from('<svg width=\"240\" height=\"160\"><text x=\"120\" y=\"95\" font-family=\"sans-serif\" font-size=\"32\" font-weight=\"bold\" fill=\"#ffb81c\" text-anchor=\"middle\">BOTECO</text></svg>'), top: 0, left: 0 },
  ])
  .webp({ quality: 90 })
  .toBuffer()
await sharp(botecoThumb).toFile('public/arenas/boteco/thumb.webp')

console.log('placeholders criados')
"
```

Expected: stdout `placeholders criados`. Verificar `ls -la public/arenas/default/thumb.webp public/arenas/boteco/thumb.webp`.

- [ ] **Step 3: Create README documenting expected art**

Arquivo: `public/arenas/boteco/README.md`

```markdown
# Boteco Arena — Asset Manifest

Lista de assets necessários pra arena Boteco. Substituir thumb.webp atual (placeholder) e adicionar os outros conforme arte fica pronta.

## Background (1 asset opcional)

| Path | Dimensão | Notas |
|------|----------|-------|
| `neon-bar-do-batinho.webp` | ~240x80 | Neon laranja "Bar do Batinho" no canto superior esquerdo. Transparência. ~30KB |

Se não existir, o BackgroundBoteco.tsx esconde silenciosamente via onError.

## Thumbnail (picker)

| Path | Dimensão | Notas |
|------|----------|-------|
| `thumb.webp` | 240x160 | Screenshot ou render da arena em ação pro picker. Substitui placeholder. ~20KB |

## Decorações (3 assets, animadas via CSS)

| Path | Dimensão | Posição | Animação |
|------|----------|---------|----------|
| `decorations/copo-chope.webp` | 80x100 | canto inferior direito | sway-slow |
| `decorations/amendoim.webp` | 70x50 | canto inferior esquerdo | none |
| `decorations/pendente-luz.webp` | 60x80 | topo centralizado | pulse + glow |

Cada PNG/WebP com transparência alfa pra integrar com background.

## Batinho variants (7 assets)

Outfit swap subtil do Batinho default: mesma pose, mas com camisa do bar + chopp na mão.

| Path | Substitui | Notas |
|------|-----------|-------|
| `batinho/bate.webp` | `/batinho/batinho-bate.webp` | Batinho subindo na mesa gritando "BATE!" com chopp |
| `batinho/lupa.webp` | `/batinho/batinho-lupa.webp` | Batinho com camisa do bar segurando lupa |
| `batinho/feliz.webp` | `/batinho/batinho-feliz.webp` | Batinho brindando |
| `batinho/chorando.webp` | `/batinho/batinho-chorando.webp` | Batinho com chopp derramado |
| `batinho/trofeu.webp` | `/batinho/batinho-trofeu.webp` | Batinho dançando com chopp |
| `batinho/confuso.webp` | `/batinho/batinho-confuso.webp` | Batinho com chopp, expressão de "?" |
| `batinho/tempo-acabando.webp` | `/batinho/batinho-tempo-acabando.webp` | Batinho correndo com chopp |

**Importante:** manter as mesmas dimensões e enquadramento dos batinhos default (~400x400 com personagem centralizado) pra que animações framer-motion / anime.js existentes funcionem sem recálculo.

## Total estimado

~12 assets / ~250KB total. Lazy load — só carrega quando arena equipada (BackgroundBoteco e ArenaDecorationsLayer só montam quando arenaId === 'boteco').
```

- [ ] **Step 4: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add public/arenas/
git commit -m "add arena asset placeholders and Boteco art manifest"
```

---

## Task V1: End-to-end validation per spec checklist

**Files:**
- Modify (notes only): none — task de validação

- [ ] **Step 1: DB schema check**

```bash
cd /Users/matheusdev/projects/bate-backend
psql "$DATABASE_URL" -c "\dt arenas user_arenas"
psql "$DATABASE_URL" -c "\d users" | grep equippedArena
```

Expected:
- Tabelas `arenas` e `user_arenas` listadas
- Coluna `equippedArena` em `users` com default `'default'`

- [ ] **Step 2: Seed + backfill verificação**

Subir backend, conferir log de boot:
```
[db] seed arenas inserted=2 updated=0   (ou 0 inserted / 2 updated se rerun)
[db] backfill arenas granted=N
```

Conferir DB:
```bash
psql "$DATABASE_URL" -c "SELECT id, name FROM arenas"
# 2 rows: default, boteco

psql "$DATABASE_URL" -c "SELECT COUNT(DISTINCT \"userId\") AS users, COUNT(*) AS grants FROM user_arenas"
# grants == users * 2
```

- [ ] **Step 3: HTTP endpoints**

```bash
COOKIE=$(curl -sI -X POST http://localhost:8787/auth/guest -H 'Content-Type: application/json' -d '{}' | grep -i set-cookie | cut -d':' -f2- | cut -d';' -f1 | xargs)

# GET arenas
curl -s http://localhost:8787/me/arenas -H "Cookie: $COOKIE" | jq .
# Esperado: { "arenas": [ {id:"default", owned:true, equipped:true, ...}, {id:"boteco", owned:true, equipped:false, ...} ] }

# Equip boteco
curl -s -X POST http://localhost:8787/me/equip-arena -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"arenaId":"boteco"}' | jq .
# Esperado: { ok:true, equippedArena:"boteco" }

# Equip inexistente
curl -sw "\n%{http_code}\n" -X POST http://localhost:8787/me/equip-arena -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"arenaId":"inexistente"}'
# Esperado: 403 com { error:"ARENA_NOT_OWNED" }

# ID inválido (regex falha)
curl -sw "\n%{http_code}\n" -X POST http://localhost:8787/me/equip-arena -H "Cookie: $COOKIE" -H 'Content-Type: application/json' -d '{"arenaId":"INVALID UPPERCASE"}'
# Esperado: 400 com { error:"INVALID_ARENA_ID" }
```

- [ ] **Step 4: Frontend UI flow**

Subir frontend (`npm run dev`), abrir browser:
1. Lobby — ver botão de tenda (Arenas) no top-right
2. Clicar botão → modal abre com 2 arenas (Padrão + Boteco do Batinho), default marcado como equipped
3. Clicar Boteco → toast "Arena Boteco do Batinho equipada", check badge muda
4. Criar sala, entrar
5. Esperado: background com parede de tijolinho marrom, luz quente à direita, mesa com toalha xadrez vermelho/cream, decorações nos cantos (ou ocultas se assets não existem ainda — layout não quebra)
6. Esperar uma chamada de BATE durante o jogo — esperado: Batinho com variante boteco (se asset existir) ou default (se não)

- [ ] **Step 5: Player isolation test**

Abrir uma segunda aba em modo anônimo (sessão diferente). Equipar arena default na segunda aba. Entrar na mesma sala. Esperado:
- Aba 1 (Boteco) vê o background Boteco
- Aba 2 (Default) vê o background Default
- Cada um vê a sua arena, não a do outro

- [ ] **Step 6: Reduced motion test**

DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce". Esperado: decorações que tinham animação (sway-slow, pulse) ficam estáticas.

- [ ] **Step 7: Persist test**

Recarregar página com boteco equipado. Esperado: arena permanece equipada (vem do banco via /me/arenas).

- [ ] **Step 8: Document any gaps in commit message and commit empty (anchoring closure)**

Se todos os steps passaram:

```bash
cd /Users/matheusdev/projects/bate-frontend
git commit --allow-empty -m "validate arena system end-to-end"
```

Se algum step falhou: anotar e voltar pra task específica.

---

# Self-review notes

Antes de fechar o plano, conferi:

**Spec coverage:**
- ✅ Entidades Arena + UserArena: Task B1
- ✅ Coluna equippedArena em users: Task B2 (entity) + migration
- ✅ Endpoints /me/arenas + /me/equip-arena: Task B6
- ✅ Hook lookupArena no room:join/create: Task B8
- ✅ Background multiplexer + BackgroundDefault + BackgroundBoteco: Tasks F3 + F4
- ✅ ArenaDecorationsLayer: Task F5
- ✅ getMascot(state, arenaId): Task F6
- ✅ 12 assets do Boteco listados como expected paths: Task F10
- ✅ Picker UI: Task F9
- ✅ Migration AddArenas + seed-arenas.ts + backfill: Tasks B2 + B4 + B5
- ✅ Validação manual via checklist: Task V1

**Type consistency:**
- Arena.unlockType: `'default' | 'earned' | 'paid'` — bate com Deck (codebase real, não com spec que dizia 'purchased')
- UserArena.acquiredVia: `'default' | 'earned' | 'purchased'` — bate com UserDeck
- previewPath (não `thumbnail`) — bate com Deck
- Field `arena` em Player, `equippedArena` em User, `arenaId` em UserArena — consistente em todos os tasks
- ArenaView mirror exato de DeckView

**Placeholder scan:**
- Nenhum TBD/TODO. Tarefas têm código completo. Apenas referências legítimas a "se o asset não existir" (graceful onError) — explicitamente documentado.

---

# Plan complete

Plan salvo em `docs/superpowers/plans/2026-05-25-arena-system-plan.md`.

Duas opções de execução:

**1. Subagent-Driven (recomendado)** — dispatch fresh subagent por task, review de spec compliance + code quality entre cada uma, iteração rápida. Cada commit é validado isoladamente.

**2. Inline Execution** — executar tasks nessa sessão com checkpoints. Mais controle, mas seu contexto enche.

Qual abordagem?
