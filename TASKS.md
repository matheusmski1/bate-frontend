# Boteco Vivo — Tasklist

Spec: [`docs/superpowers/specs/2026-05-26-boteco-vivo-design.md`](docs/superpowers/specs/2026-05-26-boteco-vivo-design.md)

Execução em 3 PRs sequenciais, cada um shippable independente.

---

## 🛠 Pré-requisito: Assets gerados pelo Matheus

Lista do que precisa ser gerado (via Recraft.ai / Midjourney) antes do PR B começar. Detalhes de prompts e dimensões no spec.

### Decorações estáticas (4 assets)
- [ ] `public/arenas/boteco/neon-bar-do-batinho.webp` — 240x80 — Recraft.ai
- [ ] `public/arenas/boteco/cardapio.webp` — 160x200 — Midjourney/Flux
- [ ] `public/arenas/boteco/quadro-campeao.webp` — 100x130 — Recraft.ai
- [ ] `public/arenas/boteco/lampiao.webp` — 80x120 — Recraft.ai

### Bartender Batinho (7 assets)
- [ ] `public/arenas/boteco/bartender-batinho/idle-1.webp` — 200x280 — Recraft.ai (style ref do Batinho atual)
- [ ] `public/arenas/boteco/bartender-batinho/idle-2.webp` — 200x280 — img2img do idle-1
- [ ] `public/arenas/boteco/bartender-batinho/idle-3.webp` — 200x280 — img2img do idle-1
- [ ] `public/arenas/boteco/bartender-batinho/idle-4.webp` — 200x280 — img2img do idle-1
- [ ] `public/arenas/boteco/bartender-batinho/peek.webp` — 200x280 — sobrancelha levantada
- [ ] `public/arenas/boteco/bartender-batinho/wipe-counter.webp` — 200x280 — passando pano
- [ ] `public/arenas/boteco/bartender-batinho/spill.webp` — 200x280 — copo virado

### Móveis e patronos (4 assets)
- [ ] `public/arenas/boteco/tv.webp` — 140x100 — moldura, tela vazia
- [ ] `public/arenas/boteco/jukebox.webp` — 120x180 — vintage colorido
- [ ] `public/arenas/boteco/patrono-silhueta-1.webp` — 80x140 — costas no balcão
- [ ] `public/arenas/boteco/patrono-silhueta-2.webp` — 80x140 — pose diferente

### Pós-processamento (todos)
- [ ] Passar cada PNG em `remove.bg` se tiver fundo
- [ ] Comprimir em `squoosh.app` (WebP quality 85)
- [ ] Verificar tamanho total < 500KB

---

## PR A: Framework (sem visual novo)

Cria infraestrutura sem mudar nada visível. Refactor estrutural + event bus + publishers.

### Setup
- [ ] Instalar `mitt` (`pnpm add mitt`)
- [ ] Criar `src/lib/arena-events.ts` com tipo `ArenaEvent` + export do `arenaBus`
- [ ] Criar hook `src/lib/use-arena-event.ts`

### Refactor de estrutura
- [ ] Criar `src/components/room2d/ArenaScene.tsx` como wrapper que renderiza Background + DecorationsLayer
- [ ] Mover `<Background />` + `<ArenaDecorationsLayer />` de `GameArea.tsx` pra dentro de `ArenaScene`
- [ ] `GameArea.tsx` passa a renderizar só `<ArenaScene arenaId={arenaId} />`

### Publishers em GameArea
- [ ] Adicionar `useEffect` que emite `'bate'` quando `state.phase` transita pra `'bate-called'`
- [ ] Adicionar emit de `'peek-own'` quando peek effect dispara
- [ ] Adicionar emit de `'peek-other'` quando espiadinha dispara
- [ ] Adicionar emit de `'swap'` quando swap acontece
- [ ] Adicionar emit de `'snap-success'` / `'snap-fail'` no snap window
- [ ] Adicionar emit de `'round-end'` quando phase vira `'round-end'`
- [ ] Adicionar emit de `'match-end'` quando phase vira `'match-end'`
- [ ] Adicionar emit de `'time-running-out'` quando `turnDeadlineAt - now < 10s`

### Mouse parallax (hook standalone)
- [ ] Criar `src/lib/use-mouse-parallax.ts` com throttle 60fps
- [ ] Adicionar exemplo de uso no spec/teste local (sem aplicar em nada ainda)

### Validação
- [ ] `npx tsc --noEmit` limpo
- [ ] Console.log temporário em subscriber de teste confirma todos os eventos disparam corretamente jogando uma partida
- [ ] Sem regressão visual (default e boteco continuam idênticos)
- [ ] Remover console.logs temporários antes do PR

### Commit + PR
- [ ] PR title: `feat: arena event bus framework + ArenaScene wrapper`

---

## PR B: Boteco Ambient (Fase 1)

Adiciona TODOS os elementos visuais que rodam sempre em loop. Requer assets gerados.

### Bloqueio
- [ ] Confirma que todos os 15 assets do pré-requisito existem em `public/arenas/boteco/`

### Componentes novos (cada um em arquivo próprio em `src/components/room2d/boteco/`)
- [ ] `Bartender.tsx` — sprite loop 4 frames @ 1.33s via CSS steps
- [ ] `TV.tsx` — moldura + tela HTML com placar piscando
- [ ] `Jukebox.tsx` — img + glow CSS + disco girando
- [ ] `PatronSilhouette.tsx` — recebe sprite + delay, anima cabeça
- [ ] `NeonAberto.tsx` — img + flicker keyframe
- [ ] `Cardapio.tsx` — img estático posicionado na parede
- [ ] `QuadroCampeao.tsx` — img estático
- [ ] `Lampiao.tsx` — img + balanço sway
- [ ] `ChoppSteam.tsx` — 3 divs gradient subindo com delays

### Componente container
- [ ] `BotecoVivoLayer.tsx` — orquestra layout dos componentes acima, posiciona cada um nas coords do spec

### Integração
- [ ] `ArenaScene` renderiza `<BotecoVivoLayer />` quando `arenaId === 'boteco'`
- [ ] Lazy load via `next/dynamic` (boteco só carrega se equipado)

### CSS keyframes em globals.css
- [ ] `bartender-idle` (steps 4)
- [ ] `patron-sway`
- [ ] `neon-flicker`
- [ ] `lampiao-swing`
- [ ] `smoke-rise`
- [ ] `jukebox-glow-pulse`
- [ ] `vinyl-spin`
- [ ] Bloco `@media (prefers-reduced-motion: reduce)` desligando todos

### Mouse parallax
- [ ] Aplica `useMouseParallax` no `BotecoVivoLayer` com camadas em força diferente

### Validação
- [ ] Visual smoke test em dev local — todos elementos aparecem nas posições certas
- [ ] FPS 60 estável (DevTools Performance)
- [ ] `prefers-reduced-motion` desliga tudo
- [ ] Default arena sem qualquer mudança
- [ ] Bundle size delta < 500KB (todos assets + JS)

### Commit + PR
- [ ] PR title: `feat: Boteco Vivo ambient layer (bartender loop, TV, jukebox, patrons)`

---

## PR C: Reativo + Interativo (Fases 2 + 3)

Conecta os componentes do PR B ao event bus do PR A. Adiciona cliques.

### Subscribers reativos
- [ ] `TV.tsx` ouve `'bate'` → mostra GOOOOL 1.8s
- [ ] `TV.tsx` ouve `'snap-fail'` → mostra ÁRBITRO 0.8s
- [ ] `TV.tsx` ouve `'match-end'` → mostra CAMPEÃO até unmount
- [ ] `TV.tsx` ouve `'swap'` → estática 300ms
- [ ] `Bartender.tsx` ouve `'peek-own'` → troca pra peek sprite 1.2s
- [ ] `Bartender.tsx` ouve `'round-end'` → troca pra wipe-counter sprite 2.5s
- [ ] `Bartender.tsx` ouve `'bate'` → troca pra spill sprite 1s
- [ ] `PatronSilhouette.tsx` ouve `'peek-other'` → cabeça gira + "..." flutua
- [ ] `Lampiao.tsx` ouve `'swap'` → balanço forte 3x
- [ ] `Lampiao.tsx` ouve `'time-running-out'` → velocidade do swing aumenta

### Overlays globais
- [ ] `ReactiveOverlays.tsx` ouve `'bate'` → shake na tela inteira (anime.js, 200ms)
- [ ] `ReactiveOverlays.tsx` ouve `'bate'` → vinheta vermelha 50% → 0% (600ms)
- [ ] `ReactiveOverlays.tsx` ouve `'snap-success'` → confete pequeno (10-15 particles)
- [ ] `ReactiveOverlays.tsx` ouve `'match-end' winner=me` → confete denso (50+ particles, 4s)

### Cliques interativos
- [ ] `Jukebox.tsx` onClick → emit `'click-jukebox'` (com rate limit 1s)
- [ ] `Jukebox.tsx` ouve `'click-jukebox'` → nota musical voa
- [ ] `TV.tsx` onClick → emit `'click-tv'` (rate limit)
- [ ] `TV.tsx` ouve `'click-tv'` → estática 200ms + troca canal random 1.5s
- [ ] `Bartender.tsx` área onClick (balcão) → emit `'click-counter'` (rate limit)
- [ ] `Bartender.tsx` ouve `'click-counter'` → frame de "aceno" + lampião pisca

### Hook compartilhado
- [ ] Criar `useClickThrottle` que retorna função throttled de emit

### Validação (manual checklist completo do spec)
- [ ] Ambient sempre rodando (todos elementos do PR B intactos)
- [ ] BATE → TV GOOOOL + shake + bartender spill
- [ ] Olhadinha → bartender peek
- [ ] Espiadinha → patrono gira cabeça
- [ ] Snap success → confete pequeno
- [ ] Snap fail → TV ÁRBITRO
- [ ] Round end → bartender wipe
- [ ] Match end vitória → confete denso + TV CAMPEÃO
- [ ] Tempo acabando → lampião acelera
- [ ] Click jukebox → nota voa
- [ ] Click TV → muda canal
- [ ] Click balcão → bartender acena
- [ ] Click 5x rápido → só primeiro dispara (throttle)
- [ ] FPS mantém 60 mesmo com reactive ativo
- [ ] `prefers-reduced-motion` desliga TUDO (reactivo + ambient)
- [ ] Sair/voltar da sala não duplica listeners

### Commit + PR
- [ ] PR title: `feat: Boteco Vivo reactive events + interactive clicks`

---

## Pós-merge dos 3 PRs

- [ ] Validação E2E em produção (batinho.com.br) com 2-3 amigos jogando uma partida
- [ ] Capturar GIF/video do BATE → GOOOOL pra mostrar a feature
- [ ] Atualizar README com gif demo da arena Boteco Vivo
- [ ] Decidir próxima arena (Junina? Praia?) com mesmo framework
- [ ] Considerar áudio ambiente (música, som no BATE) como spec separado

---

## Backlog (não bloqueia, faz depois)

- [ ] Som ambient boteco (música de fundo de bar baixo)
- [ ] Day/night cycle (luz da janela muda ao longo de sessões longas)
- [ ] NPCs reagindo a emotes do chat (patrono ri quando alguém manda emote de risada)
- [ ] Cinemática de entrada na arena (3s de transição quando equipa)
- [ ] Outras arenas com mesmo framework (Junina, Praia, Estádio)
