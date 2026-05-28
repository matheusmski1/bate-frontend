# Join Mid-Game Queue — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que jogadores cliquem "Entrar" em salas com partida em andamento — eles viram espectadores imediatamente e são promovidos a jogadores quando a próxima rodada começar.

**Architecture:**
Adicionar fila `pendingJoins: Player[]` ao `GameState`. Quando alguém pede `room:join` em fase ativa, em vez de rejeitar com `GAME_IN_PROGRESS`, o backend enfileira o player na fila E também adiciona como espectador (assim ele vê o jogo enquanto espera). Na transição pra próxima rodada (`startRound()`), os pendentes viram jogadores reais, recebem mão, e são removidos da fila e da lista de espectadores. Frontend mostra ambos botões em salas com jogo ativo, com label "ENTRAR (próx. rodada)" e roteia para a tela do quarto com badge de "aguardando promoção".

**Tech Stack:**
- Backend: `bate-backend` — Node + Socket.IO + TypeScript strict + Vitest. Storage com 2 impls (memory + redis).
- Frontend: `bate-frontend` — Next.js 15 + React + Zustand + TailwindCSS + Socket.IO client.
- Tipos compartilhados: duplicados em `bate-backend/src/types/shared.ts` e `bate-frontend/src/types/shared.ts` (precisa atualizar os dois).

**Repos (paths absolutos):**
- `/Users/matheusdev/projects/bate-backend`
- `/Users/matheusdev/projects/bate-frontend`

**Decisão de design crítica:** Promoção acontece em `startRound()`, não em `finishRound()`. Motivo: `startRound()` é o único lugar que distribui cartas, então é mais simples promover lá. `finishRound()` só limpa estado e transita pra `waiting`. Promovemos pendentes antes do `players.map(...)` que distribui mãos.

**Caso de sala cheia:** Se promoção excederia `maxPlayers`, promovemos só até preencher; o resto permanece em `pendingJoins` aguardando próxima rodada (jogador continua espectador). Isso é raro mas precisa funcionar.

---

## File Structure

### Backend (`bate-backend`)

**Modificar:**
- `src/types/shared.ts` — adicionar `pendingJoins: Player[]` no `GameState`; adicionar `pendingJoinCount` no `RoomSummary`
- `src/server/game/state.ts` — `createEmptyRoom` inicializa `pendingJoins: []`; `startRound` promove pendingJoins → players (até `maxPlayers`)
- `src/server/storage/memory.ts` — `joinRoom` enfileira em vez de throw quando phase ativa; `summarize` inclui `pendingJoinCount`; nova função `removePendingJoin`
- `src/server/storage/redis.ts` — mesmas mudanças do memory.ts
- `src/server/storage/types.ts` — adicionar `removePendingJoin(roomId, playerId)` à interface `Storage`
- `src/server/lobby.ts` — expor `removePendingJoin`
- `src/server/handlers/lobby-handlers.ts` — `room:join` retorna `{ ok: true, queued: true }` quando enfileira + adiciona como espectador; `room:leave` remove de pendingJoins se presente
- `src/server/handlers/schemas.ts` — atualizar tipo de retorno de `RoomJoinSchema` (se houver schema de ack)

**Criar:**
- `tests/server/game/state-pending.test.ts` — testes de promoção em startRound
- `tests/server/storage-pending.test.ts` — testes de joinRoom enfileirar em fase ativa

### Frontend (`bate-frontend`)

**Modificar:**
- `src/types/shared.ts` — espelhar `pendingJoinCount` em `RoomSummary` (não precisa de `pendingJoins` no estado redactado a menos que queira mostrar nomes — não precisa nessa V1)
- `src/components/lobby/RoomList.tsx` — mostrar AMBOS botões em `inActiveGame`; label "ENTRAR (PRÓX.)" no Entrar, tooltip explicativo
- `src/app/page.tsx` — `handleJoin` trata resposta `{ queued: true }`: roteia pra `/room/${id}?spectate=1&pending=1` e mostra toast "Você entra na próxima rodada"
- `src/app/room/[roomId]/page.tsx` — detectar query param `pending=1` E checar se phase virou `waiting`/`initial-peek`/`round-end` → re-emitir `room:join` automaticamente; mostrar badge "AGUARDANDO PRÓXIMA RODADA" no header quando pendente

---

## Task 1: Adicionar `pendingJoins` ao tipo `GameState` (backend)

**Files:**
- Modify: `bate-backend/src/types/shared.ts` (linhas 66-89 e 100-107)

- [ ] **Step 1: Adicionar campo `pendingJoins` ao GameState e `pendingJoinCount` ao RoomSummary**

Substituir o tipo `GameState` (linhas 66-89) para incluir `pendingJoins`:

```typescript
export type GameState = {
  roomId: string
  name: string
  hostId: string
  maxPlayers: 2 | 3 | 4
  players: Player[]
  pendingJoins: Player[]
  deck: Card[]
  discard: Card[]
  turn: number
  phase: GamePhase
  bateCallerId: string | null
  turnsRemaining: number | null
  pendingEffect: PendingEffect | null
  snapWindow: SnapWindow | null
  log: GameAction[]
  createdAt: number
  turnTimeLimitSec: number | null
  turnDeadlineAt: number | null
  paused: boolean
  pausedRemainingMs: number | null
  roundTurnCount: number
  roundNumber: number
  spectators: Spectator[]
}
```

Substituir `RoomSummary` (linhas 100-107):

```typescript
export type RoomSummary = {
  roomId: string
  name: string
  playerCount: number
  maxPlayers: number
  phase: GamePhase
  spectatorCount: number
  pendingJoinCount: number
}
```

- [ ] **Step 2: Verificar que compila**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm tsc --noEmit`
Expected: erros em `state.ts`, `memory.ts`, `redis.ts` reclamando que `pendingJoins` está faltando ao construir `GameState`. ESPERADO — vamos corrigir nas próximas tasks.

- [ ] **Step 3: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/types/shared.ts
git commit -m "add pendingJoins field to GameState type"
```

---

## Task 2: Inicializar `pendingJoins: []` em `createEmptyRoom`

**Files:**
- Modify: `bate-backend/src/server/game/state.ts` (linhas 28-51)
- Test: `bate-backend/tests/server/game/state.test.ts`

- [ ] **Step 1: Escrever teste que falha — createEmptyRoom inicializa pendingJoins**

Adicionar no final de `tests/server/game/state.test.ts` (antes do `describe('startRound', ...)`):

```typescript
  it('inicia com pendingJoins vazio', () => {
    const state = createEmptyRoom({
      roomId: 'r1',
      name: 'm',
      hostId: 'p1',
      hostName: 'Matheus',
      maxPlayers: 4,
    })
    expect(state.pendingJoins).toEqual([])
  })
```

- [ ] **Step 2: Rodar teste, verificar que falha**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm vitest run tests/server/game/state.test.ts`
Expected: FAIL — "Cannot read properties of undefined (reading 'length')" ou `expected undefined to equal []`

- [ ] **Step 3: Implementar — adicionar `pendingJoins: []` no retorno de `createEmptyRoom`**

Em `src/server/game/state.ts`, dentro do `return {` (linha 28), adicionar a linha:

```typescript
    pendingJoins: [],
```

Posicionar logo após `players: [host],` (linha 33).

- [ ] **Step 4: Rodar teste, verificar PASS**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm vitest run tests/server/game/state.test.ts`
Expected: PASS — todos os testes verdes

- [ ] **Step 5: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/game/state.ts tests/server/game/state.test.ts
git commit -m "init pendingJoins as empty array on room creation"
```

---

## Task 3: Promover pendingJoins em `startRound`

**Files:**
- Modify: `bate-backend/src/server/game/state.ts` (linhas 54-79)
- Create: `bate-backend/tests/server/game/state-pending.test.ts`

- [ ] **Step 1: Criar arquivo de teste com casos de promoção**

Criar `tests/server/game/state-pending.test.ts` com este conteúdo completo:

```typescript
import { describe, it, expect } from 'vitest'
import { createEmptyRoom, startRound } from '@/server/game/state'
import type { Player } from '@/types/shared'

function mkPlayer(id: string, name: string): Player {
  return {
    id, socketId: null, name, hand: [], score: 0,
    connected: true, disconnectedAt: null, revealedToSelf: [], deck: 'default', arena: 'default',
  }
}

describe('startRound — promoção de pendingJoins', () => {
  it('promove pendingJoins para players e esvazia a fila', () => {
    const empty = createEmptyRoom({ roomId: 'r1', name: 'm', hostId: 'p1', hostName: 'a', maxPlayers: 4 })
    empty.players.push(mkPlayer('p2', 'b'))
    empty.pendingJoins.push(mkPlayer('p3', 'c'))
    const state = startRound(empty)
    expect(state.players.map(p => p.id)).toEqual(['p1', 'p2', 'p3'])
    expect(state.pendingJoins).toEqual([])
  })

  it('jogador promovido recebe 4 cartas', () => {
    const empty = createEmptyRoom({ roomId: 'r1', name: 'm', hostId: 'p1', hostName: 'a', maxPlayers: 4 })
    empty.players.push(mkPlayer('p2', 'b'))
    empty.pendingJoins.push(mkPlayer('p3', 'c'))
    const state = startRound(empty)
    const p3 = state.players.find(p => p.id === 'p3')
    expect(p3?.hand).toHaveLength(4)
  })

  it('não promove além de maxPlayers e mantém o resto na fila', () => {
    const empty = createEmptyRoom({ roomId: 'r1', name: 'm', hostId: 'p1', hostName: 'a', maxPlayers: 2 })
    empty.pendingJoins.push(mkPlayer('p2', 'b'))
    empty.pendingJoins.push(mkPlayer('p3', 'c'))
    const state = startRound(empty)
    expect(state.players.map(p => p.id)).toEqual(['p1', 'p2'])
    expect(state.pendingJoins.map(p => p.id)).toEqual(['p3'])
  })

  it('zera score do promovido (não herda score residual)', () => {
    const empty = createEmptyRoom({ roomId: 'r1', name: 'm', hostId: 'p1', hostName: 'a', maxPlayers: 4 })
    empty.players.push(mkPlayer('p2', 'b'))
    const stale = mkPlayer('p3', 'c')
    stale.score = 99
    empty.pendingJoins.push(stale)
    const state = startRound(empty)
    const p3 = state.players.find(p => p.id === 'p3')
    expect(p3?.score).toBe(0)
  })
})
```

- [ ] **Step 2: Rodar teste, verificar que falha**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm vitest run tests/server/game/state-pending.test.ts`
Expected: FAIL — `state.players` não inclui p3 (pendingJoins é ignorado)

- [ ] **Step 3: Implementar promoção em `startRound`**

Substituir o conteúdo INTEIRO de `startRound` em `src/server/game/state.ts` (linhas 54-79) por:

```typescript
export function startRound(state: GameState): GameState {
  const deck = shuffleDeck(createDeck())
  const slotsAvailable = state.maxPlayers - state.players.length
  const toPromote = state.pendingJoins.slice(0, Math.max(0, slotsAvailable))
  const remainingPending = state.pendingJoins.slice(toPromote.length)
  const promoted: Player[] = toPromote.map(p => ({
    ...p,
    hand: [],
    score: 0,
    revealedToSelf: [],
  }))
  const allPlayers = [...state.players, ...promoted]
  const players = allPlayers.map(p => {
    const hand = deck.splice(0, 4)
    const initiallyRevealed = hand.slice(-2).map(c => c.id)
    return { ...p, hand, score: p.score, revealedToSelf: initiallyRevealed }
  })
  const lowestIdx = players.reduce((bestIdx, p, i) => (p.score < players[bestIdx]!.score ? i : bestIdx), 0)
  return {
    ...state,
    players,
    pendingJoins: remainingPending,
    deck,
    discard: [],
    turn: lowestIdx,
    phase: 'initial-peek',
    bateCallerId: null,
    turnsRemaining: null,
    pendingEffect: null,
    snapWindow: null,
    turnDeadlineAt: null,
    paused: false,
    pausedRemainingMs: null,
    roundTurnCount: 1,
    roundNumber: state.roundNumber + 1,
  }
}
```

- [ ] **Step 4: Rodar testes — startRound completo**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm vitest run tests/server/game/state.test.ts tests/server/game/state-pending.test.ts`
Expected: PASS — todos verdes

- [ ] **Step 5: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/game/state.ts tests/server/game/state-pending.test.ts
git commit -m "promote pendingJoins to players on startRound respecting maxPlayers"
```

---

## Task 4: `joinRoom` enfileira em vez de throw quando game in progress (memory storage)

**Files:**
- Modify: `bate-backend/src/server/storage/memory.ts` (linhas 38-66 + linha 11-20 summarize)
- Test: `bate-backend/tests/server/lobby.test.ts`

- [ ] **Step 1: Escrever teste que falha — joinRoom enfileira em fase 'playing'**

Adicionar no final de `tests/server/lobby.test.ts` (antes do `})` que fecha o describe):

```typescript
  it('enfileira em pendingJoins quando jogo está em andamento', async () => {
    const room = await lobby.createRoom({ name: 'A', hostId: 'p1', hostName: 'h', maxPlayers: 4 })
    await lobby.joinRoom(room.roomId, { playerId: 'p2', playerName: 'b' })
    const state = await lobby.getRoom(room.roomId)
    state!.phase = 'playing'
    await lobby.setRoom(state!)
    const after = await lobby.joinRoom(room.roomId, { playerId: 'p3', playerName: 'c' })
    expect(after.players.map(p => p.id)).toEqual(['p1', 'p2'])
    expect(after.pendingJoins.map(p => p.id)).toEqual(['p3'])
  })

  it('reconexão (mesmo playerId) durante jogo não duplica em pendingJoins', async () => {
    const room = await lobby.createRoom({ name: 'A', hostId: 'p1', hostName: 'h', maxPlayers: 4 })
    const s = await lobby.getRoom(room.roomId)
    s!.phase = 'playing'
    s!.pendingJoins.push({
      id: 'p2', socketId: null, name: 'b', hand: [], score: 0,
      connected: true, disconnectedAt: null, revealedToSelf: [], deck: 'default', arena: 'default',
    })
    await lobby.setRoom(s!)
    const after = await lobby.joinRoom(room.roomId, { playerId: 'p2', playerName: 'b' })
    expect(after.pendingJoins).toHaveLength(1)
  })

  it('joinRoom em fase round-end ainda funciona como antes (entra direto)', async () => {
    const room = await lobby.createRoom({ name: 'A', hostId: 'p1', hostName: 'h', maxPlayers: 4 })
    const s = await lobby.getRoom(room.roomId)
    s!.phase = 'round-end'
    await lobby.setRoom(s!)
    const after = await lobby.joinRoom(room.roomId, { playerId: 'p2', playerName: 'b' })
    expect(after.players.map(p => p.id)).toEqual(['p1', 'p2'])
    expect(after.pendingJoins).toEqual([])
  })
```

- [ ] **Step 2: Rodar teste, verificar que falha**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm vitest run tests/server/lobby.test.ts`
Expected: FAIL — primeiro caso joga `GAME_IN_PROGRESS`

- [ ] **Step 3: Implementar — substituir `joinRoom` em memory.ts (linhas 38-66)**

Substituir o método inteiro:

```typescript
  async joinRoom(roomId: string, input: JoinInput): Promise<GameState> {
    const state = this.rooms.get(roomId)
    if (!state) throw new Error('ROOM_NOT_FOUND')
    const existing = state.players.find(p => p.id === input.playerId)
    if (existing) {
      const updated = { ...existing, connected: true, disconnectedAt: null }
      const players = state.players.map(p => (p.id === input.playerId ? updated : p))
      const next = { ...state, players }
      this.rooms.set(roomId, next)
      return next
    }
    const existingPending = state.pendingJoins.find(p => p.id === input.playerId)
    if (existingPending) {
      return state
    }
    const player: Player = {
      id: input.playerId,
      socketId: null,
      name: input.playerName,
      hand: [],
      score: 0,
      connected: true,
      disconnectedAt: null,
      revealedToSelf: [],
      deck: input.deck ?? 'default',
      arena: input.arena ?? 'default',
    }
    const gameInProgress = state.phase !== 'waiting' && state.phase !== 'round-end'
    if (gameInProgress) {
      const next = { ...state, pendingJoins: [...state.pendingJoins, player] }
      this.rooms.set(roomId, next)
      return next
    }
    if (state.players.length >= state.maxPlayers) throw new Error('ROOM_FULL')
    const next = { ...state, players: [...state.players, player] }
    this.rooms.set(roomId, next)
    return next
  }
```

- [ ] **Step 4: Atualizar `summarize` para incluir `pendingJoinCount`**

Substituir `summarize` (linhas 11-20 do `memory.ts`):

```typescript
function summarize(state: GameState): RoomSummary {
  return {
    roomId: state.roomId,
    name: state.name,
    playerCount: state.players.length,
    maxPlayers: state.maxPlayers,
    phase: state.phase,
    spectatorCount: state.spectators?.length ?? 0,
    pendingJoinCount: state.pendingJoins?.length ?? 0,
  }
}
```

- [ ] **Step 5: Rodar testes do lobby**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm vitest run tests/server/lobby.test.ts`
Expected: PASS — todos verdes

- [ ] **Step 6: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/storage/memory.ts tests/server/lobby.test.ts
git commit -m "queue join requests during active game in memory storage"
```

---

## Task 5: Espelhar mudanças no Redis storage

**Files:**
- Modify: `bate-backend/src/server/storage/redis.ts` (linhas 56-84 + função summarize equivalente)

- [ ] **Step 1: Localizar a função summarize do Redis**

Run: `grep -n "summarize\|pendingJoinCount" /Users/matheusdev/projects/bate-backend/src/server/storage/redis.ts`

Anotar linha de `summarize`.

- [ ] **Step 2: Aplicar a MESMA mudança de `joinRoom` da Task 4 em redis.ts**

Em `src/server/storage/redis.ts` (linhas 56-84), substituir `joinRoom` por (versão async com `getRoom`/`setRoom`):

```typescript
  async joinRoom(roomId: string, input: JoinInput): Promise<GameState> {
    const state = await this.getRoom(roomId)
    if (!state) throw new Error('ROOM_NOT_FOUND')
    const existing = state.players.find(p => p.id === input.playerId)
    if (existing) {
      const updated = { ...existing, connected: true, disconnectedAt: null }
      const players = state.players.map(p => (p.id === input.playerId ? updated : p))
      const next = { ...state, players }
      await this.setRoom(next)
      return next
    }
    const existingPending = state.pendingJoins.find(p => p.id === input.playerId)
    if (existingPending) {
      return state
    }
    const player: Player = {
      id: input.playerId,
      socketId: null,
      name: input.playerName,
      hand: [],
      score: 0,
      connected: true,
      disconnectedAt: null,
      revealedToSelf: [],
      deck: input.deck ?? 'default',
      arena: input.arena ?? 'default',
    }
    const gameInProgress = state.phase !== 'waiting' && state.phase !== 'round-end'
    if (gameInProgress) {
      const next = { ...state, pendingJoins: [...state.pendingJoins, player] }
      await this.setRoom(next)
      return next
    }
    if (state.players.length >= state.maxPlayers) throw new Error('ROOM_FULL')
    const next = { ...state, players: [...state.players, player] }
    await this.setRoom(next)
    return next
  }
```

- [ ] **Step 3: Aplicar a mesma mudança no `summarize` do redis.ts**

Localizar a função `summarize` ou equivalente em `redis.ts` e adicionar `pendingJoinCount: state.pendingJoins?.length ?? 0` ao retorno (estrutura espelha o memory.ts).

- [ ] **Step 4: Verificar compilação**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm tsc --noEmit`
Expected: SEM ERROS

- [ ] **Step 5: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/storage/redis.ts
git commit -m "queue join requests during active game in redis storage"
```

---

## Task 6: Auto-spectate quando enfileira + ack `{ queued: true }`

**Files:**
- Modify: `bate-backend/src/server/handlers/lobby-handlers.ts` (linhas 107-133)

- [ ] **Step 1: Substituir o handler `room:join` para auto-spectate + ack com flag**

Em `src/server/handlers/lobby-handlers.ts`, substituir o bloco `socket.on('room:join', ...)` (linhas 107-133) por:

```typescript
  socket.on('room:join', async (raw: unknown, ack: (res: { ok?: true; error?: string; queued?: boolean }) => void) => {
    const payload = parseAndAuth(RoomJoinSchema, raw, ack, socket)
    if (!payload) return
    try {
      const [deck, arena] = await Promise.all([lookupDeck(payload.playerId), lookupArena(payload.playerId)])
      const result = await lobby.withRoomLock(payload.roomId, async () => {
        const next = await lobby.joinRoom(payload.roomId, { ...payload, deck, arena })
        const queued = next.pendingJoins.some(p => p.id === payload.playerId)
        const target = queued
          ? next.pendingJoins.find(p => p.id === payload.playerId)
          : next.players.find(p => p.id === payload.playerId)
        if (target) {
          target.socketId = socket.id
          target.deck = deck
          target.arena = arena
        }
        let finalState = next
        if (queued) {
          const spectators = next.spectators ?? []
          if (!spectators.some(s => s.id === payload.playerId)) {
            finalState = {
              ...next,
              spectators: [...spectators, { id: payload.playerId, name: payload.playerName, socketId: socket.id }],
            }
          }
        }
        await lobby.setRoom(finalState)
        return { state: finalState, queued }
      })
      socket.join(payload.roomId)
      await lobby.bindSocket(socket.id, payload.roomId, payload.playerId)
      console.log(`[room:join] socket=${socket.id} player=${payload.playerId} room=${payload.roomId} queued=${result.queued} totalPlayers=${result.state.players.length} totalPending=${result.state.pendingJoins.length}`)
      ack(result.queued ? { ok: true, queued: true } : { ok: true })
      broadcastRoom(io, result.state)
      io.to('lobby').emit('lobby:update', { rooms: await lobby.listRooms() })
    } catch (err) {
      console.log(`[room:join] ERROR ${err instanceof Error ? err.message : 'UNKNOWN'} for player=${payload.playerId} room=${payload.roomId}`)
      ack({ error: err instanceof Error ? err.message : 'UNKNOWN' })
    }
  })
```

- [ ] **Step 2: Verificar que compila**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm tsc --noEmit`
Expected: SEM ERROS

- [ ] **Step 3: Rodar suite de testes inteira**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm vitest run`
Expected: PASS — tudo verde

- [ ] **Step 4: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/handlers/lobby-handlers.ts
git commit -m "auto-spectate queued joiners and return queued flag in ack"
```

---

## Task 7: `room:leave` remove de pendingJoins se presente

**Files:**
- Modify: `bate-backend/src/server/handlers/lobby-handlers.ts` (linhas 169-200)

- [ ] **Step 1: Adicionar verificação de pendingJoins no início do handler `room:leave`**

Localizar o callback `lobby.withRoomLock(payload.roomId, async () => { ...` dentro do `room:leave` (~linha 173). Após o `if (!room) return null` e ANTES do `const isSpectator = ...`, adicionar:

```typescript
        const isPending = (room.pendingJoins ?? []).some(p => p.id === payload.playerId)
        if (isPending) {
          const spectators = (room.spectators ?? []).filter(s => s.id !== payload.playerId)
          const next = {
            ...room,
            pendingJoins: room.pendingJoins.filter(p => p.id !== payload.playerId),
            spectators,
          }
          await lobby.setRoom(next)
          return next
        }
```

(Posicionar logo depois de `if (!room) return null` e antes da declaração `const isSpectator = ...`.)

- [ ] **Step 2: Verificar compilação**

Run: `cd /Users/matheusdev/projects/bate-backend && pnpm tsc --noEmit`
Expected: SEM ERROS

- [ ] **Step 3: Commit**

```bash
cd /Users/matheusdev/projects/bate-backend
git add src/server/handlers/lobby-handlers.ts
git commit -m "support leaving pendingJoins queue via room:leave"
```

---

## Task 8: Espelhar tipo `RoomSummary` no frontend

**Files:**
- Modify: `bate-frontend/src/types/shared.ts`

- [ ] **Step 1: Encontrar definição de RoomSummary no frontend**

Run: `grep -n "RoomSummary" /Users/matheusdev/projects/bate-frontend/src/types/shared.ts`

- [ ] **Step 2: Adicionar `pendingJoinCount` ao RoomSummary do frontend**

Editar `src/types/shared.ts` no frontend e adicionar a linha `pendingJoinCount: number` ao tipo `RoomSummary` (espelhar exatamente o backend, opcional `?` se preferir compat — mas backend sempre envia agora, então campo obrigatório está OK).

- [ ] **Step 3: Verificar TS no frontend**

Run: `cd /Users/matheusdev/projects/bate-frontend && pnpm tsc --noEmit`
Expected: SEM ERROS (ou um aviso onde RoomSummary é construído manualmente — pouco provável)

- [ ] **Step 4: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/types/shared.ts
git commit -m "mirror pendingJoinCount in frontend RoomSummary type"
```

---

## Task 9: RoomList mostra ambos botões em sala com jogo ativo

**Files:**
- Modify: `bate-frontend/src/components/lobby/RoomList.tsx` (linhas 37-89)

- [ ] **Step 1: Substituir a renderização do `<li>` para mostrar ambos botões**

Substituir o `return (` interno do `.map(room => { ... })` em `RoomList.tsx` (a partir da linha 44, o `<li>` inteiro) por:

```tsx
        return (
          <li key={room.roomId} className="flex justify-between items-center bg-bate-paper rounded-xl px-5 py-4 border-[3px] border-bate-ink shadow-hard-sm">
            <div>
              <div className="font-display text-bate-ink text-lg">{room.name}</div>
              <div className="text-sm text-bate-ink/70 flex items-center gap-2 font-body">
                <Users size={14} /> {room.playerCount}/{room.maxPlayers}
                {spectators > 0 && (
                  <>
                    <span>•</span>
                    <Eye size={14} /> {spectators}
                  </>
                )}
                <span>•</span>
                <span className={inActiveGame ? 'text-bate-red font-bold' : room.phase === 'round-end' ? 'text-bate-gold font-bold' : 'text-bate-green font-bold'}>
                  {inActiveGame ? 'em jogo' : room.phase === 'round-end' ? 'entre rodadas' : 'aguardando'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {canJoin && (
                <button
                  onClick={() => onJoin(room.roomId)}
                  className="px-4 py-2 rounded-lg bg-bate-green text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-105 transition-transform"
                >
                  ENTRAR
                </button>
              )}
              {inActiveGame && !isFull && (
                <button
                  onClick={() => onJoin(room.roomId)}
                  title="Você entra como espectador agora e vira jogador na próxima rodada"
                  className="px-4 py-2 rounded-lg bg-bate-green text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-105 transition-transform"
                >
                  ENTRAR (PRÓX.)
                </button>
              )}
              {inActiveGame && onSpectate && (
                <button
                  onClick={() => onSpectate(room.roomId)}
                  title="Assistir partida"
                  className="px-4 py-2 rounded-lg bg-bate-paper text-bate-ink border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-105 transition-transform flex items-center gap-1.5"
                >
                  <Eye size={14} strokeWidth={3} /> ASSISTIR
                </button>
              )}
              {isFull && !inActiveGame && (
                <span className="px-4 py-2 rounded-lg bg-bate-ink/20 text-bate-ink/60 border-[3px] border-bate-ink/40 font-display">CHEIA</span>
              )}
            </div>
          </li>
        )
```

Nota: a verificação `isFull` no caso `inActiveGame` previne mostrar "ENTRAR (PRÓX.)" se a sala atual já está cheia E ninguém vai sair antes da próxima rodada — mas a fila pode encher mesmo assim na próxima. **Decisão simplificadora:** se a sala atual está cheia E em jogo, esconde o botão "ENTRAR (PRÓX.)" (o usuário tenta de novo quando a rodada terminar).

- [ ] **Step 2: Verificar compilação**

Run: `cd /Users/matheusdev/projects/bate-frontend && pnpm tsc --noEmit`
Expected: SEM ERROS

- [ ] **Step 3: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/components/lobby/RoomList.tsx
git commit -m "show ENTRAR PRÓX button alongside ASSISTIR in active games"
```

---

## Task 10: handleJoin trata resposta `{ queued: true }` e roteia pra spectate+pending

**Files:**
- Modify: `bate-frontend/src/app/page.tsx` (linhas 85-105)

- [ ] **Step 1: Substituir o `handleJoin` para tratar `queued`**

Em `src/app/page.tsx`, substituir o callback do `socket.emit('room:join', ...)` (linha 97-100) por:

```typescript
      socket.emit('room:join', { roomId, playerId, playerName: name }, (res: { ok?: true; error?: string; queued?: boolean }) => {
        if (res?.error) { toast.error(`Erro: ${res.error}`); return }
        if (res?.queued) {
          toast.info('Você entra na próxima rodada — assistindo enquanto isso')
          router.push(`/room/${roomId}?spectate=1&pending=1`)
          return
        }
        router.push(`/room/${roomId}`)
      })
```

Nota: se `toast.info` não existir, usar `toast.success` ou outro variante disponível em `@/lib/ui-store`.

- [ ] **Step 2: Verificar que toast.info existe**

Run: `grep -n "info\|success\|error" /Users/matheusdev/projects/bate-frontend/src/lib/ui-store.ts | head -10`

Se `info` não existir, trocar pela variante mais próxima (ex: `success`).

- [ ] **Step 3: Verificar compilação**

Run: `cd /Users/matheusdev/projects/bate-frontend && pnpm tsc --noEmit`
Expected: SEM ERROS

- [ ] **Step 4: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/app/page.tsx
git commit -m "route queued joiners to spectator view with pending flag"
```

---

## Task 11: Página da sala mostra badge "AGUARDANDO PRÓXIMA RODADA" e re-emite room:join quando promovido

**Files:**
- Modify: `bate-frontend/src/app/room/[roomId]/page.tsx`

- [ ] **Step 1: Adicionar leitura do query param `pending` e detectar promoção**

Substituir `src/app/room/[roomId]/page.tsx` linha 23 (`const isSpectator = ...`) por:

```typescript
  const isSpectator = search.get('spectate') === '1'
  const isPending = search.get('pending') === '1'
```

- [ ] **Step 2: Adicionar `useEffect` que re-emite `room:join` quando phase virar `waiting`/`round-end` E o usuário não estiver na lista de players**

Após o useEffect que existe (após linha 93), adicionar este novo `useEffect`:

```typescript
  useEffect(() => {
    if (!isPending) return
    if (!room) return
    const myId = getPlayerId()
    const alreadyPlayer = room.players.some(p => p.id === myId)
    if (alreadyPlayer) {
      const url = new URL(window.location.href)
      url.searchParams.delete('spectate')
      url.searchParams.delete('pending')
      router.replace(url.pathname + url.search)
      return
    }
    if (room.phase === 'waiting' || room.phase === 'round-end' || room.phase === 'initial-peek') {
      const name = getStoredName()
      ensureSocketConnected().then(socket => {
        socket.emit('room:join', { roomId, playerId: myId, playerName: name }, (res: { ok?: true; error?: string; queued?: boolean }) => {
          if (res?.error) {
            toast.error(`Erro entrando: ${res.error}`)
          }
        })
      })
    }
  }, [room, isPending, roomId, router])
```

- [ ] **Step 3: Adicionar badge "AGUARDANDO PRÓXIMA RODADA" no header**

Substituir o bloco `{amISpectator && (...)}` (linhas 108-112) por:

```tsx
      {amISpectator && (
        <div className="fixed top-0 left-0 right-0 z-[55] bg-bate-ink text-bate-paper text-center py-1.5 text-[11px] sm:text-xs font-display tracking-wider shadow-hard-sm">
          {isPending ? '⏳ AGUARDANDO PRÓXIMA RODADA' : '👁 ASSISTINDO'} • {(room.spectators?.length ?? 0)} {(room.spectators?.length ?? 0) === 1 ? 'olho' : 'olhos'} na mesa
        </div>
      )}
```

- [ ] **Step 4: Verificar compilação**

Run: `cd /Users/matheusdev/projects/bate-frontend && pnpm tsc --noEmit`
Expected: SEM ERROS

- [ ] **Step 5: Commit**

```bash
cd /Users/matheusdev/projects/bate-frontend
git add src/app/room/[roomId]/page.tsx
git commit -m "show pending badge and auto-promote spectators on next round"
```

---

## Task 12: Smoke test manual ponta-a-ponta

**Files:** nenhum (validação manual)

- [ ] **Step 1: Subir o backend em modo dev**

Run em terminal separado: `cd /Users/matheusdev/projects/bate-backend && pnpm dev`
Expected: server inicia, porta padrão

- [ ] **Step 2: Subir o frontend em modo dev**

Run em outro terminal: `cd /Users/matheusdev/projects/bate-frontend && pnpm dev`
Expected: Next.js inicia, abre em http://localhost:3000

- [ ] **Step 3: Cenário — criar sala, iniciar jogo, segundo cliente clica "ENTRAR (PRÓX.)"**

1. Abrir http://localhost:3000 em janela 1: nome "A", criar sala, convidar B
2. Abrir janela 2 (anônima): nome "B", entrar
3. Janela 1: iniciar jogo (host)
4. Abrir janela 3: nome "C" → ver sala em estado "em jogo" com botões ENTRAR (PRÓX.) e ASSISTIR
5. Clicar ENTRAR (PRÓX.)
6. Verificar: toast "Você entra na próxima rodada", roteia pra `/room/X?spectate=1&pending=1`, badge "AGUARDANDO PRÓXIMA RODADA" aparece
7. Janela 1+2: jogar até `bate` ou esgotar deck → entra em `round-end`
8. Host clica "próxima rodada" → janela 3 deve virar jogador automaticamente, badge some, recebe 4 cartas

Expected: fluxo completo funciona sem erros no console.

- [ ] **Step 4: Cenário — desistir da fila**

1. Repetir até passo 5 acima
2. Em vez de jogar, na janela 3 clicar "Sair" (ou voltar pro lobby)
3. Verificar: outras janelas perdem o C da lista de espectadores; ao próximo `round-end`, C não é promovido

Expected: sem erros, sala segue normal.

- [ ] **Step 5: Cenário — sala fica cheia antes da promoção**

1. Sala maxPlayers=2 com A e B jogando
2. Janela 3 (C) e janela 4 (D) ambos clicam ENTRAR (PRÓX.) → ambos viram pendentes
3. Host promove rodada → só C entra (slotsAvailable=0... ou wait, maxPlayers=2, A e B saem? Não, ficam.)

**Esclarecimento:** se A e B ficam após round-end, slotsAvailable = 2-2 = 0, NENHUM dos pendentes promove. Continuam aguardando. **Validar comportamento.** Se A sair entre rodadas, slotsAvailable=1, C promove e D continua aguardando.

Expected: promoção respeita maxPlayers atuais; pendentes que não couberam permanecem na fila + spectators.

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Mostra os 2 botões em sala com jogo → Task 9
- ✅ Backend aceita join em fase ativa → Tasks 4, 5
- ✅ Promoção na próxima rodada → Task 3
- ✅ Auto-spectate + ack queued → Task 6
- ✅ Sair da fila → Task 7
- ✅ UX no lado do quarto (badge + promoção auto) → Task 11
- ✅ Tipos espelhados frontend → Task 8

**Pontos de atenção (edge cases cobertos):**
- Sala cheia no momento da promoção → permanece em pendingJoins (Task 3 step 1, último caso de teste)
- Reconexão de um pendente não duplica (Task 4 step 1, segundo teste)
- joinRoom em `round-end` ainda entra direto (Task 4 step 1, terceiro teste)
- Match-end: `finishRound` transita pra `waiting` (não `match-end` se isMatchEnd) — fluxo padrão de game:next-round trata; após match-end, host inicia novo jogo via game:start que chama startRound → promove pendingJoins normalmente.

**Não coberto (assumido fora de escopo):**
- Notificar pendentes via toast quando forem promovidos (a tela atualiza, basta)
- Mostrar nomes dos pendentes na lista do lobby (apenas count via `pendingJoinCount`)
- Ordem da fila — primeiro a entrar é primeiro promovido (FIFO simples via array)
