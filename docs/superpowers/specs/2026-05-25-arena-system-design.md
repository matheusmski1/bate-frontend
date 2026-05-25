# Arena System — Design Spec

> Sistema de "arenas" cosméticas que ambientam a área de jogo. Espelha o padrão Skin/Deck existente. MVP entrega infra completa + 1 arena nova (Boteco do Batinho) com kit completo, mantendo background atual como arena default.

---

## Contexto

Hoje a área de jogo (`GameArea.tsx`) renderiza sobre um `Background.tsx` estático: cream com watermark de naipes e ruído. A mesa, cartas e chrome ficam por cima. Não há ambientação ao redor.

Inspiração TFT: cada set tem um *field* temático que reforça personalidade e dá razão pra colecionar. No Batinho, o objetivo é estender o sistema cosmético (já temos Skins e Decks) com um terceiro eixo: **Arena** — o cenário ao redor da mesa.

O usuário escolheu **Boteco** como primeira arena nova (além da default). Kit completo: background + textura de mesa + decorações animadas + variantes temáticas do mascote Batinho.

---

## Objetivo

Construir a infraestrutura de Arena como sistema cosmético configurável (entity + endpoints + picker + integração no GameArea), entregando 2 arenas no MVP:

1. **Default** — o background atual mantido como-is, atribuído a todo user no boot
2. **Boteco do Batinho** — primeira arena temática completa, default-unlocked pra todos no MVP

---

## Escopo

### Dentro do escopo

- Entidades `Arena` e `UserArena` no Postgres (TypeORM + migration)
- Endpoints HTTP `/me/arenas` (list) e `/me/equip-arena` (equip)
- Campo `equippedArena` em `User`
- Campo `arena` em `Player` (shared type), sincronizado no `room:join`
- Seed + backfill de arenas default (mirror do que skins/decks fazem)
- `Background.tsx` vira multiplexer por `arenaId`
- Componentes `BackgroundDefault` (atual) e `BackgroundBoteco` (novo)
- `ArenaDecorationsLayer` que renderiza decorações posicionadas e animadas
- `getMascot(state, arenaId)` em `lib/mascot.ts` com fallback pra default
- 11 assets de arte novos pro Boteco (3 decorações + 7 batinhos + 1 neon)
- Picker UI em página `/arenas` (mirror `/decks`)
- Toast "Arena trocada" no equip
- Suporte a `prefers-reduced-motion` (desliga animações ambientes)

### Fora do escopo (futuro)

- Sistema de unlock por progressão (jogar X partidas)
- Auto-switch sazonal (Junina em junho, Carnaval em fevereiro)
- Arenas premium pagas (Cassino retrô, Sala de Elite)
- Animações reativas ao gameplay (BATE faz tudo tremer, vitória solta fogos)
- Preview da arena no lobby antes de entrar
- Spectator ver a arena do host (no MVP cada user vê a própria mesmo como spectator)
- Catálogo completo de arenas (Junina, Praia, Estádio, etc) — ficam pro roadmap

---

## Arquitetura

### Visão geral

```
┌─────────────┐      room:join       ┌──────────────┐
│  Frontend   │ ─────────────────►   │   Backend    │
│             │                       │              │
│  ArenaCtx   │ ◄─────────────────   │ Player.arena │
└─────────────┘  state:update         └──────────────┘
       │                                      │
       │                                      ├─ lookupArena() lê User.equippedArena
       │                                      │
       ▼                                      ▼
┌─────────────────┐                  ┌──────────────┐
│ Background.tsx  │                  │  arenas DB   │
│  (multiplexer)  │                  │ user_arenas  │
└─────────────────┘                  └──────────────┘
       │
       ├─► BackgroundDefault
       └─► BackgroundBoteco
              │
              ├─► ArenaDecorationsLayer (3 decorações posicionadas)
              ├─► CSS pattern parede tijolo + janela
              └─► getMascot('bate', 'boteco') → /arenas/boteco/batinho/bate.webp
```

### Espelhamento do padrão Skin/Deck

A entrega segue o mesmo padrão de Skin/Deck que já existe e foi validado:

| Conceito | Skin | Deck | Arena |
|----------|------|------|-------|
| Entity | `Skin` | `Deck` | `Arena` |
| User-link | `UserSkin` | `UserDeck` | `UserArena` |
| Equipped field | `User.equippedSkin` | `User.equippedDeck` | `User.equippedArena` |
| Player field | `Player.skin` | `Player.deck` | `Player.arena` |
| List endpoint | `GET /me/skins` | `GET /me/decks` | `GET /me/arenas` |
| Equip endpoint | `POST /me/equip-skin` | `POST /me/equip-deck` | `POST /me/equip-arena` |
| Seed file | `seed-skins.ts` | `seed-decks.ts` | `seed-arenas.ts` |
| Backfill fn | `backfillDefaultSkinsToAllUsers` | `backfillDefaultDecksToAllUsers` | `backfillDefaultArenasToAllUsers` |
| Lookup helper | `lookupSkin()` | `lookupDeck()` | `lookupArena()` |

Manter essa simetria reduz custo cognitivo de implementação e revisão.

---

## Data model

### `Arena` (nova entity)

```ts
@Entity('arenas')
export class Arena {
  @PrimaryColumn() id: string                                          // 'default' | 'boteco'
  @Column() name: string                                               // 'Padrão' | 'Boteco do Batinho'
  @Column({ default: '' }) description: string
  @Column({ name: 'unlock_type', default: 'default' })
  unlockType: 'default' | 'earned' | 'purchased'
  @Column() thumbnail: string                                          // '/arenas/boteco/thumb.webp'
}
```

Asset paths (background, decorações, batinhos temáticos) **não vão no banco**. Frontend deriva por convenção: `/arenas/{arenaId}/bg.webp`, `/arenas/{arenaId}/decorations/{name}.webp`, `/arenas/{arenaId}/batinho/{state}.webp`. Mesma estratégia que `getCardImage(rank, deckId)` usa hoje pra decks.

Benefício: zero serialização de paths via socket, asset bundle versionado com o frontend.

### `UserArena` (nova entity)

```ts
@Entity('user_arenas')
export class UserArena {
  @PrimaryColumn({ name: 'user_id' }) userId: string
  @PrimaryColumn({ name: 'arena_id' }) arenaId: string
  @Column({ name: 'acquired_via' })
  acquiredVia: 'default' | 'earned' | 'purchased'
  @CreateDateColumn({ name: 'acquired_at' }) acquiredAt: Date
}
```

### `User` (modificar)

Adicionar coluna:

```ts
@Column({ name: 'equipped_arena', default: 'default' })
equippedArena: string
```

### `Player` (shared type)

Adicionar campo:

```ts
type Player = {
  // existing...
  arena: string  // 'default' | 'boteco'
}
```

---

## API contract

### `GET /me/arenas`

Auth: JWT cookie (mesmo padrão das outras rotas).

Response 200:
```json
{
  "owned": [
    { "id": "default", "name": "Padrão", "description": "...", "thumbnail": "/arenas/default/thumb.webp" },
    { "id": "boteco", "name": "Boteco do Batinho", "description": "...", "thumbnail": "/arenas/boteco/thumb.webp" }
  ],
  "equipped": "boteco"
}
```

### `POST /me/equip-arena`

Auth: JWT cookie.

Body:
```json
{ "arenaId": "boteco" }
```

Response 200:
```json
{ "ok": true, "equipped": "boteco" }
```

Response 403 (não possui):
```json
{ "error": "Arena not owned" }
```

Response 404 (não existe):
```json
{ "error": "Arena not found" }
```

### Backend handler hooks

- `lobby-handlers.ts` no `room:join` e `room:create` chama novo `lookupArena(userId)` que retorna `user.equippedArena` (default `'default'`)
- `Player.arena` populado a partir desse valor, igual `Player.skin` e `Player.deck` são hoje

---

## Frontend integration

### Mudança em `Background.tsx`

Hoje exporta um único componente. Vira multiplexer:

```tsx
// Background.tsx
import { BackgroundDefault } from './backgrounds/BackgroundDefault'
import { BackgroundBoteco } from './backgrounds/BackgroundBoteco'

export function Background({ arenaId }: { arenaId: string }) {
  switch (arenaId) {
    case 'boteco': return <BackgroundBoteco />
    case 'default':
    default: return <BackgroundDefault />
  }
}
```

`BackgroundDefault` recebe **o código atual sem mudança** (move o JSX existente).
`BackgroundBoteco` é nova arte (descrita abaixo).

### `GameArea.tsx`

Lê arena do player atual e passa pro Background:

```tsx
const me = state.players.find(p => p.id === myId)
const arenaId = me?.arena ?? 'default'

return (
  <>
    <Background arenaId={arenaId} />
    <ArenaDecorationsLayer arenaId={arenaId} />
    {/* resto inalterado */}
  </>
)
```

Cada player vê **a sua própria arena** (não a do host) — é cosmético individual.

### `ArenaDecorationsLayer` (novo componente)

Mounta decorações declaradas por arena. Definição inline (não vem do DB):

```tsx
// arena-decorations.ts
type Decoration = {
  asset: string
  position: { left?: string; right?: string; top?: string; bottom?: string }
  size: { width: number; height: number }
  animation?: 'sway-slow' | 'sway-fast' | 'pulse' | 'none'
}

export const ARENA_DECORATIONS: Record<string, Decoration[]> = {
  default: [],
  boteco: [
    { asset: 'copo-chope', position: { right: '24px', bottom: '120px' }, size: { width: 80, height: 100 }, animation: 'sway-slow' },
    { asset: 'amendoim', position: { left: '20px', bottom: '110px' }, size: { width: 70, height: 50 }, animation: 'none' },
    { asset: 'pendente-luz', position: { left: '50%', top: '40px' }, size: { width: 60, height: 80 }, animation: 'pulse' },
  ],
}
```

Componente:

```tsx
export function ArenaDecorationsLayer({ arenaId }: { arenaId: string }) {
  const decorations = ARENA_DECORATIONS[arenaId] ?? []
  return (
    <div className="fixed inset-0 pointer-events-none -z-[5]" aria-hidden>
      {decorations.map((d, i) => (
        <img
          key={i}
          src={`/arenas/${arenaId}/decorations/${d.asset}.webp`}
          alt=""
          className={`absolute deco-anim-${d.animation ?? 'none'}`}
          style={{ ...d.position, width: d.size.width, height: d.size.height }}
        />
      ))}
    </div>
  )
}
```

Animações: keyframes CSS em `globals.css` (`deco-anim-sway-slow`, etc). Respeitam `@media (prefers-reduced-motion: reduce)` desligando o animation property.

### `getMascot(state, arenaId)` em `lib/mascot.ts`

Hoje `MASCOT` é um objeto const com paths fixos. Vira função:

```ts
const DEFAULT_PATHS = {
  bate: '/batinho/batinho-bate.webp',
  lupa: '/batinho/batinho-lupa.webp',
  feliz: '/batinho/batinho-feliz.webp',
  // ...
}

const ARENA_OVERRIDES: Record<string, Set<string>> = {
  boteco: new Set(['bate', 'lupa', 'feliz', 'chorando', 'trofeu', 'confuso', 'tempo-acabando']),
}

export function getMascot(state: string, arenaId: string = 'default'): string {
  const overrides = ARENA_OVERRIDES[arenaId]
  if (overrides?.has(state)) return `/arenas/${arenaId}/batinho/${state}.webp`
  return DEFAULT_PATHS[state] ?? DEFAULT_PATHS.feliz
}
```

Sítios de uso atual de `MASCOT.bate`, `MASCOT.lupa`, etc, viram chamadas pra `getMascot(state, me?.arena)`. Lista de afetados: `BateAnnouncement.tsx`, `BatinhoOlhadinha.tsx`, `RoundEndScreen.tsx`, `MatchEndScreen.tsx`.

---

## Boteco kit — especificação de assets

### Background (`BackgroundBoteco.tsx`)

Composto majoritariamente via CSS, com 1 PNG hero (neon):

```tsx
<div className="fixed inset-0 -z-10 overflow-hidden">
  {/* parede tijolinho */}
  <div className="absolute inset-0" style={{
    backgroundColor: '#5a3a1f',
    backgroundImage: `
      repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 22px),
      repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 40px)
    `,
  }} />
  {/* luz quente da janela à direita */}
  <div className="absolute inset-0" style={{
    background: 'radial-gradient(ellipse 40% 50% at 95% 30%, rgba(255,184,28,0.35) 0%, transparent 70%)',
  }} />
  {/* chão de madeira escura na base */}
  <div className="absolute bottom-0 left-0 right-0 h-[30%]" style={{
    background: 'linear-gradient(180deg, transparent 0%, #2d1810 40%, #1a0e08 100%)',
  }} />
  {/* neon hero */}
  <img src="/arenas/boteco/neon-bar-do-batinho.webp" alt="" aria-hidden
    className="absolute top-6 left-6 w-48 opacity-90" />
</div>
```

### Textura de mesa

A textura é aplicada como **classe CSS no elemento que representa o tampo da mesa central** em `GameArea.tsx`. Uma classe por arena, multiplexada pelo `arenaId`:

```css
.table-surface-boteco {
  background: repeating-linear-gradient(45deg, #c83737 0 18px, #faf3e0 18px 36px);
  border: 3px solid #5a3a1f;
  box-shadow: inset 0 0 24px rgba(0,0,0,0.3);
}
.table-surface-default {
  /* mantém o visual atual sem mudança */
}
```

No componente: `className={`table-surface table-surface-${arenaId}`}`. O elemento alvo é o container que hoje agrupa `DeckPile2D` + `DiscardPile2D` + `DrawnCard2D` (o "tampo" visual). O plano de implementação confirma o seletor exato.

### Decorações (3 PNGs/WebPs)

| Asset | Posição | Tamanho | Animação |
|-------|---------|---------|----------|
| `copo-chope.webp` | right 24px, bottom 120px | 80x100 | sway-slow (4s ease-in-out infinite) |
| `amendoim.webp` | left 20px, bottom 110px | 70x50 | none |
| `pendente-luz.webp` | center-x, top 40px | 60x80 | pulse (glow opacity 0.6→1, 2s) |

Animações em CSS pura (sem JS, sem framer-motion) pra economizar CPU:

```css
@keyframes sway-slow {
  0%, 100% { transform: rotate(-3deg); }
  50%      { transform: rotate(3deg); }
}
.deco-anim-sway-slow { animation: sway-slow 4s ease-in-out infinite; transform-origin: top center; }

@keyframes pulse {
  0%, 100% { filter: drop-shadow(0 0 8px #ffb81c); }
  50%      { filter: drop-shadow(0 0 16px #ffb81c); }
}
.deco-anim-pulse { animation: pulse 2s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .deco-anim-sway-slow, .deco-anim-pulse { animation: none; }
}
```

### Batinho variants (7 WebPs)

Outfit swap subtil: poses identicas aos batinhos default, mas com **camisa do bar** + **chopp na mão**. Mesmo tamanho de arte, mesmo enquadramento (pra animações framer-motion/anime.js existentes funcionarem sem mudança).

| State | Arquivo | Descrição |
|-------|---------|-----------|
| bate | `batinho/bate.webp` | Batinho subindo na mesa gritando "BATE!" com chopp |
| lupa | `batinho/lupa.webp` | Batinho com camisa do bar segurando lupa, chopp na outra mão |
| feliz | `batinho/feliz.webp` | Batinho brindando |
| chorando | `batinho/chorando.webp` | Batinho com chopp derramado, expressão triste |
| trofeu | `batinho/trofeu.webp` | Batinho dançando com chopp na mão |
| confuso | `batinho/confuso.webp` | Batinho com chopp, expressão de "?" |
| tempo-acabando | `batinho/tempo-acabando.webp` | Batinho correndo com chopp |

### Thumbnail pra picker

`/arenas/boteco/thumb.webp` — 240x160 — montagem da arena renderizada (preview).

### Inventário total de arte nova

| Categoria | Quantidade | Tamanho estimado |
|-----------|------------|------------------|
| Neon hero | 1 | ~30KB |
| Decorações | 3 | ~60KB |
| Batinho variants | 7 | ~140KB |
| Thumbnail | 1 | ~20KB |
| **Total** | **12** | **~250KB** |

---

## Picker UI

Nova página `/arenas` (Next.js App Router) espelhando `/decks` que já existe:

- Grid de cards com `thumbnail`, `name`, `description`, badge "EQUIPADA" se aplicável
- Click em card disponível → POST `/me/equip-arena` → toast "Arena trocada" → invalidação local
- Card de arena bloqueada (caso unlockType futuro) tem cadeado + tooltip "Desbloqueie X"

Acesso: novo botão "🎪 Arenas" no chrome do lobby, próximo dos botões de Skin e Deck que já existem.

---

## Migration & seed

### Migration `1748180000000-AddArenas.ts`

```ts
export class AddArenas1748180000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE arenas (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        description VARCHAR NOT NULL DEFAULT '',
        unlock_type VARCHAR NOT NULL DEFAULT 'default',
        thumbnail VARCHAR NOT NULL
      )
    `)
    await queryRunner.query(`
      CREATE TABLE user_arenas (
        user_id VARCHAR NOT NULL,
        arena_id VARCHAR NOT NULL,
        acquired_via VARCHAR NOT NULL,
        acquired_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, arena_id)
      )
    `)
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN equipped_arena VARCHAR NOT NULL DEFAULT 'default'
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN equipped_arena`)
    await queryRunner.query(`DROP TABLE user_arenas`)
    await queryRunner.query(`DROP TABLE arenas`)
  }
}
```

### `seed-arenas.ts`

```ts
const DEFAULT_ARENAS = [
  { id: 'default', name: 'Padrão', description: 'O cenário clássico.', unlockType: 'default', thumbnail: '/arenas/default/thumb.webp' },
  { id: 'boteco', name: 'Boteco do Batinho', description: 'Tijolinho, neon, mesa de bar.', unlockType: 'default', thumbnail: '/arenas/boteco/thumb.webp' },
]

export async function seedDefaultArenas() { /* upsert */ }

export async function backfillDefaultArenasToAllUsers() { /* grant 'default' arenas pra todo user existente */ }
```

Boot sequence (em `index.ts`):

```ts
await AppDataSource.initialize()
await seedDefaultSkins()
await backfillDefaultSkinsToAllUsers()
await seedDefaultDecks()
await backfillDefaultDecksToAllUsers()
await seedDefaultArenas()              // novo
await backfillDefaultArenasToAllUsers()// novo
```

`ensureUser()` ganha grant das arenas defaults no primeiro acesso (igual já faz com skins/decks).

---

## Riscos & tradeoffs

### Performance
- Decorações always-on podem custar CPU em dispositivo fraco.
- **Mitigação**: animações em CSS puro (não JS), `will-change: transform`, `prefers-reduced-motion` desliga, decorações em layer `-z-[5]` separada do board.

### Carga inicial
- ~250KB de assets do Boteco somam ao bundle.
- **Mitigação**: Lazy load — arenas só carregam quando equipadas. `BackgroundBoteco` é dynamic import. Default não paga custo nenhum.

### Coupling
- `Background.tsx` virando multiplexer pode crescer descontrolado conforme arenas chegam.
- **Mitigação**: cada arena é componente isolado em `backgrounds/`, multiplexer é switch trivial. Adicionar arena = criar arquivo + 1 case.

### Variedade de mascote
- Sítios que usam `MASCOT.xxx` hoje viram chamadas a função (`getMascot`). Refactor pontual.
- **Mitigação**: lista de uso é finita (~4 componentes), trocar é mecânico. TypeScript pega quebra.

### Spectator
- Spectator que troca de arena durante uma partida vê visual diferente do que jogadores veem.
- **Mitigação**: aceitar. Cosmético individual, não muda gameplay. Spectator vê a SUA arena, igual jogador.

---

## Validação manual

Não temos testes automatizados de frontend. Validação por checklist:

1. **DB**: rodar migration, conferir tabelas `arenas` e `user_arenas` existirem; coluna `equipped_arena` em `users`.
2. **Seed**: subir backend, conferir que `default` e `boteco` aparecem em `arenas` e que todo user em `user_arenas` ganhou as duas.
3. **API**:
   - `curl GET /me/arenas` → retorna 2 arenas owned + `equipped: 'default'`
   - `curl POST /me/equip-arena {arenaId: 'boteco'}` → 200, depois GET retorna `equipped: 'boteco'`
   - POST com `arenaId: 'inexistente'` → 404
4. **Frontend**:
   - Entrar numa sala com arena default → ver background atual sem mudança
   - Equipar Boteco no picker → entrar em sala → ver parede de tijolinho, neon, decorações animadas, toalha xadrez
   - Chamar BATE → ver Batinho com chopp (variante boteco)
   - Olhadinha → ver Batinho com camisa do bar segurando lupa
   - Outros jogadores na sala com arena default → ainda veem visual default deles (cada um vê a própria)
5. **Reduced motion**: ativar `prefers-reduced-motion` no DevTools → decorações ficam estáticas
6. **Picker**: trocar arena no picker, voltar pra sala já criada, refresh — arena nova é aplicada
