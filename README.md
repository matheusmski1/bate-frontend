# bate-frontend

Frontend Next.js do **Batinho** — produto online multiplayer baseado no jogo **Bate** (releitura brasileira de Cabo/Pablo/Cambio, família "Golf"). Conecta via Socket.io ao backend separado.

Backend: https://github.com/matheusmski1/bate-backend

## Sobre o jogo

**Batinho** é a versão online multiplayer do **Bate** — releitura brasileira de jogos clássicos da família "Golf", tradição de cartas de pontuação mínima que remonta às décadas de 1960-70, popularizada em **Golf** (domínio público) e **Rat-a-Tat Cat** (Gamewright, 1995). Cada jogador recebe 4 cartas viradas para baixo e tenta terminar a rodada com a menor pontuação possível, usando ações de espiar, trocar e cortar.

"Bate" é o nome da mecânica (o que você joga); "Batinho" é o nome do produto e do mascote singular (esquilinho chibi). A identidade visual, os nomes das ações (OLHADINHA, ESPIADINHA, TROCA, PRATA, OURO) e o sistema de pontuação são originais desta implementação.

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
