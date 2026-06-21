# CLAUDE.md — bate-frontend (Batinho)

Frontend Next.js do **Batinho**; conecta via Socket.io ao `bate-backend`. *Princípios gerais estão no `~/.claude/CLAUDE.md` global — aqui só o institucional deste repo.*

## Stack
- Next.js 15 (App Router) + React 19, TypeScript strict, Tailwind, **Zustand** (state), **socket.io-client**, framer-motion/anime.js (animações), Fredoka font.

## Comandos (gates)
- `npx tsc --noEmit` — typecheck.
- `pnpm build` — **`next build`**; cuidar de `useSearchParams` SEMPRE dentro de `<Suspense>` (senão quebra o build).
- Dev local: `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 pnpm dev` (front :3000, backend :3001).
- **NÃO há testes ainda** (zero `*.test.*` no repo) — gap conhecido; ao mexer em fluxo crítico (ex: payload que o cliente emite), vale começar a cobrir.

## Convenções / gotchas
- `src/types/shared.ts` é **byte-idêntico** com o `bate-backend` — qualquer mudança de tipo vai nos dois repos.
- Eventos de socket são **não-tipados**: cada ack é tipado inline no call site (não há event-map central).
- Identidade de jogador é **agnóstica a formato**: o cliente manda `player.id` direto (humano = uuid, bot = `bot:<roomId>:<n>`). Não filtrar oponentes por `socketId`/uuid (esconderia bots).
- Salas de treino são auto-iniciadas + `private:true` (não aparecem na lista do lobby); entrada é botão dedicado, não item de `RoomList`.

## CI / deploy
- CI roda em PR pra `main` (typecheck + build). Deploy Vercel/Railway por push.
- Fluxo: feature branch → PR pra `staging` → merge pra `main`.
