# bate-frontend

Frontend Next.js do jogo Bate. Multiplayer card game tipo Cabo/Pablo. Conecta via Socket.io ao backend separado.

Backend: https://github.com/matheusmski1/bate-backend

## Stack
- Next.js 15 (App Router) + React 19
- TypeScript strict
- Tailwind CSS + Fredoka font
- framer-motion + anime.js (animações)
- Zustand (state)
- Socket.io-client (real-time)
- Lucide React (ícones)

## Dev local

```bash
pnpm install
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 pnpm dev   # frontend porta 3000
```

(Backend deve estar rodando na porta 3001 — ver bate-backend README.)

## Deploy

### Opção 1 — Railway

1. Conecta repo (auto-deploy on push)
2. Env vars:
   - `NEXT_PUBLIC_SOCKET_URL` — URL do backend (ex: `https://bate-backend-production.up.railway.app`)
3. Domínio gerado: ex `bate-frontend-production.up.railway.app`
4. Backend precisa ter `CORS_ORIGIN` apontando pra esse domínio

### Opção 2 — Vercel (grátis + CDN melhor)

1. Importar repo no Vercel
2. Build command auto-detected (Next.js)
3. Env var: `NEXT_PUBLIC_SOCKET_URL` (Production scope)
4. Deploy automático em push

## Env vars

| Var | Default | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SOCKET_URL` | (empty = same origin) | URL completa do backend (incluindo https://) |
