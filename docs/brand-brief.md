# Bate — Brand Brief / AI Prompt

> Um prompt-descritivo do jogo Bate. Pode ser colado como contexto pra qualquer IA gerar arte, copy, animação, código ou marketing alinhado com a identidade do jogo.

---

## O que é

**Bate** é uma versão online multiplayer de **Cabo** (também conhecido como Pablo, Cambio) — o jogo de cartas brasileiro de mesa onde o objetivo é ter a **menor pontuação**. Reskinning total da nomenclatura clássica: dez vira **OLHADINHA**, valete vira **ESPIADINHA**, dama vira **TROCA**, rei vira **PRATA (−3 pts)**, joker vira **OURO (−6 pts)**.

Jogado **2 a 4 jogadores**, sem cadastro, sem login, sem fricção. Você abre a URL, coloca um apelido, cria ou entra numa sala, e em **5 minutos uma rodada acabou**.

---

## Princípios de produto (não-negociáveis)

1. **Fácil de entrar** — zero login, zero tutorial obrigatório. O jogo se ensina em 2 jogadas.
2. **Amigável** — feito pra jogar com amigos no Discord, com a família no almoço, com o crush no FaceTime. Nunca sério ou competitivo demais.
3. **Recompensador** — cada interação tem feedback visual e sonoro satisfatório. Comprar carta, descartar, BATE, contar pontos — tudo gera microprazer.
4. **Rápido** — uma rodada inteira de 5 min. Nada de esperar. Nada de turnos infinitos. Animações são *snappy*, não cinematográficas.
5. **Justo** — server-authoritative, sem chance de cheating. Reconnect grace de 30s. Sem RNG injusta.

---

## Identidade visual: **Festa BR**

> Imagina o manual ilustrado de um jogo de tabuleiro brasileiro dos anos 90 — FDP, Truco UOL antigo, Stop, manuais de RPG amadores que circulavam em fotocópia. Bordas pretas grossas, cores chapadas e quentes, tipografia chunky com sombra hard offset, stickers tortos colados como se alguém tivesse decorado o manual à mão.

### Paleta

- **Cream** `#f5e9c9` — fundo principal (papel antigo)
- **Paper** `#fff5d1` — superfícies elevadas (cartas, inputs, modais)
- **Ink** `#1a0e08` — todo o texto, todas as bordas (marrom-tinta, não preto puro)
- **Red** `#d63232` — CTAs urgentes, destaque, "BATE!", autor de ação
- **Gold** `#ffb81c` — cartas OURO, botão principal, highlights de vitória
- **Green** `#4a7c4f` — feedback positivo (snap-success, sala disponível)
- **Teal** `#2c8a9c` — cartas de ação (TROCA, OLHADINHA, ESPIADINHA)
- **Silver** `#d3d3d3` — cartas PRATA

### Tipografia

- **Display (títulos, badges, números de carta)**: `Bowlby One` — chunky, sem-serif redondo, peso massivo
- **Body (UI, inputs, textos longos)**: `Fredoka` — sem-serif redondo amigável, weight 500-600
- **Acentos manuscritos pontuais** (legendas em modais especiais): `Caveat` opcional, com moderação

### Linguagem visual

- **Bordas pretas grossas** (3-4px) em tudo que é interativo
- **Hard-shadow offset** (3-6px, sólido, mesma cor ink) em vez de drop-shadow soft. Sempre `+x +y`, nunca centralizada
- **Cantos arredondados moderados** (8-12px) — chunky, não fofo demais
- **Stickers tortos** (rotação −12° a +12°) com `GRÁTIS`, `BETA`, `MULTI` em fundo colorido com borda preta
- **Stretching tipográfico**: títulos podem ter `-webkit-text-stroke` preto + múltiplos `text-shadow` em camadas (sombra preta + sombra colorida + sombra preta) pra dar efeito de "carimbo descolado"

### As 5 cartas especiais como mascotes recorrentes

Os cards **OURO / PRATA / OLHADINHA / ESPIADINHA / TROCA** são os "personagens" do jogo. Eles aparecem:
- Flutuando no hero da home (cantos, leve bob animado)
- Como ilustração em badges nos modais
- Como ícones nos toasts de feedback
- Como "winners" no round-end (a carta MVP da rodada ganha um destaque)

Não precisa criar mascote humano/animal. **As cartas são o branding.**

---

## Voz e tom

- **Português BR informal**, jeito de boteco
- "Bate!" não "Vitória" — "Cabo Rápido" não "Quick Match" — "Mesa do Bira" não "Room #4837"
- Nomes de salas auto-gerados com personalidade BR: *Mesa do Bira, Cabo Rápido, Sala do Zé, Bate Express, Mesa do Doutor, Salão do Cipó*
- Erros com humor seco: *"Sala fechada por inatividade"* não *"Session expired due to inactivity"*
- Nunca formal. Nunca corporativo. Nunca "Welcome to your gaming experience".

---

## Animações — filosofia anime.js

> Tudo que tem feedback visual usa **anime.js v4**. Framer-motion fica pra transições estruturais (mount/unmount, layout shifts). Anime.js é pra os momentos juicy.

### Princípios

1. **Snappy, não cinematográfico** — 200-400ms é o sweet spot. Nada que demore mais que 600ms num feedback.
2. **Easing de jogo**, não de UI — `outBack`, `outElastic`, `inOutQuart`, `outExpo`. Nunca `linear`.
3. **Antecipação + overshoot** — antes de algo grande acontecer, um pequeno recuo; quando termina, um pequeno overshoot que volta. Como Pixar.
4. **Layered timeline** — uma ação grande (BATE!, round-end) é uma timeline com 3-6 eventos coreografados, não uma transição única.

### Momentos juicy obrigatórios

- **Comprar carta**: ela voa do deck com `outBack`, faz um leve `rotateY` cinematográfico e pousa
- **Descartar**: carta gira 360° no eixo Y enquanto escala pra baixo e pousa no descarte com bounce
- **Snap acerto**: carta pisca verde 3x, scale-up rápido, partículas (3-5 elementos saindo radialmente)
- **Snap errado**: carta treme horizontalmente, vira vermelha 1s, nova carta de penalidade slide-in com bounce
- **BATE!**: tela inteira pulsa, palavra "BATE!" explode no centro com `Bowlby One` 120px+ vermelho, fade-out em 1.5s. SFX de campainha de truco
- **Round-end**: cartas se viram uma a uma com stagger 150ms, contadores de pontos sobem com easing
- **Match-end**: vencedor recebe confete (DOM nodes coloridos com physics simulada), título "CAMPEÃO" rotaciona suavemente
- **Hover em carta**: scale 1.05 + lift 8px em `outBack` (200ms). Sem efeito de hover não tem feedback de affordance.

### Sons

Procedurais via Web Audio API (já implementado em `lib/sounds.ts`). Voz: chiclete eletrônico (square/triangle waves), nunca samples realistas. Cada ação tem som curto (<200ms) e distinto.

---

## O que o jogo NÃO É

- ❌ **Não é Hearthstone** — sem deck-building, sem decks personalizáveis, sem coleção
- ❌ **Não é Solitaire** — é social, sempre multiplayer
- ❌ **Não é roguelike** — partidas curtas, mas sem progressão entre partidas (por enquanto)
- ❌ **Não é "free to play with IAP"** — gratuito de verdade, sem energia, sem timers
- ❌ **Não é sério** — visual sempre brincalhão. Mesmo telas de erro têm personalidade
- ❌ **Não é mobile-first only** — pensado pra desktop com touch como secundário (jogado com amigos no monitor grande)
- ❌ **Não é minimalist clean Scandi UI** — é cheio de personalidade, sticker, sombra, cor. Linear/Notion são anti-referência.

---

## Futuro (visão de 6-12 meses)

- **Quick-match matchmaking** com fila de espera
- **Modo torneio** (bracket de 8, persistente, dura uma noite)
- **Histórico pessoal** (com persistência opcional via account leve — email apenas)
- **Cosméticos** (skins de baralho, mascotes alternativos, animações de BATE diferentes) — possível caminho de monetização
- **Mobile PWA** (instalável, sem app store)
- **Voz/chat de mesa** (push-to-talk via WebRTC) — só quando todos os players de uma sala estiverem na mesma sala
- **Bots** (IA pra preencher sala de 4 quando faltar player) — última prioridade

### Stack atual (pra contexto técnico)

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind + framer-motion + anime.js v4 + Zustand
- **Backend**: Node + Socket.io + Redis (opcional, pra multi-process) + TypeScript strict
- **Deploy**: Railway (backend) + Vercel (frontend)
- **Repos**: `matheusmski1/bate-frontend`, `matheusmski1/bate-backend`

---

## Quem é o jogador

- 18-40 anos, Brasil
- Já jogou Cabo/Pablo/Cambio na vida real (90% dos casos)
- Tá no Discord/FaceTime com amigos e quer um jogo casual rápido pra jogar enquanto conversa
- Não vai instalar app — quer abrir URL e jogar
- Não quer aprender 50 regras — quer entender em 2 jogadas

---

## Resumo de uma frase

> **Bate é o Cabo do boteco em formato online: rápido, gratuito, com cara de manual ilustrado dos anos 90, animações que dão prazer de ver, e zero fricção pra começar a jogar com os amigos.**
