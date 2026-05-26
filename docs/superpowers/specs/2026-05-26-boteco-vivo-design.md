# Boteco Vivo — Design Spec

> Evolução da arena Boteco de "background estático com mesa xadrez" pra cenário animado estilo TFT — com elementos ambientes em loop, reações ao gameplay e micro-interações por clique.

---

## Contexto

A arena Boteco atual (mergeada via PR #5/#9) entrega o mínimo: parede de tijolinho, luz quente lateral, mesa com toalha xadrez, decorações estáticas nos cantos. Funciona, mas é tímida.

User reportou: "qndo penso arena, penso no entorno da mesa tb". Referência citada: arenas do TFT, que são cenários vivos com animação ambiente, reações ao estado de jogo e elementos clicáveis com micro-recompensas.

Inspiração específica TFT:
- Pengus do Choncc's Lab andando pelo cenário
- Hextech levitando peças do tabuleiro entre rounds
- Dragonlands com dragão sobrevoando ao fundo
- Inn of the Three Dragons com lareira piscando e patronos brindando
- Click no cenário → micro-anim (penguin acena, lampião balança)

---

## Objetivo

Transformar a arena Boteco numa **cena viva** com 3 camadas:

1. **Ambient** — elementos sempre rodando em loop sutil (bartender limpando copo, fumacinha subindo do chopp, TV exibindo jogo, neon piscando)
2. **Reativo** — eventos de gameplay disparam reações na arena (BATE → TV faz "GOOOOL!", vitória → confete cai do teto, peek → bartender olha pra mesa)
3. **Interativo** — cliques em elementos do cenário soltam micro-animações sem afetar gameplay (jukebox toca nota, TV muda canal, balcão acende lampião)

Tudo isso sem engine 3D, sem Lottie — usando o que já temos: framer-motion + anime.js + CSS keyframes + SVG inline. Performance-first: ambient roda em CSS (GPU), reativo em framer-motion (sob demanda), interativo só dispara em clique.

---

## Escopo

### Dentro do escopo
- Sistema de camadas (parallax) com z-index claros entre background, decorações estáticas, decorações animadas, mesa, chrome
- Event bus arena↔gameplay (mitt-style emitter)
- Bartender Batinho NPC com loop de animação
- TV pendurada com tela animável (placar trocando, "GOOOOL!" no BATE)
- Jukebox com glow pulsando + clique solta nota musical
- 2 patronos silhueta ao fundo com cabeça balançando devagar
- Placa "ABERTO" neon piscando
- Cardápio "Bar do Batinho" tipo quadro negro
- Fumaça/vapor subindo do chopp central
- Particle system simples (confete na vitória, notas musicais nos cliques)
- Shake da tela no BATE
- Flash branco no GOOOOL
- Vinheta vermelha no momento de derrota
- Lampião pendurado balançando lentamente
- Mouse parallax sutil nas camadas (5-10px shift)
- Toggle global de "reduce motion" respeitado em todas as animações

### Fora do escopo (futuro)
- Outras arenas com mesma riqueza (vão herdar o framework, mas cada uma é spec própria)
- Áudio ambiente (música de fundo do boteco) — pode entrar depois junto com sistema de som já existente
- Day/night cycle (luz da janela mudando ao longo de uma sessão longa)
- NPCs respondendo ao chat/emote dos players
- Cinemática de abertura quando entra na arena

---

## Arquitetura

### Camadas (z-index)

```
z=  ∞   chrome UI (HUD, picker, modals, action log) — herda do atual
z= 30   mesa central (table-surface, cartas, pilhas) — herda do atual
z= 25   particles efêmeras (confete, notas musicais — após-clique/evento)
z= 20   ArenaDecorationsLayer animado (bartender, patronos, TV, jukebox)
z= 10   ArenaDecorationsLayer estático (cartazes, neon, lampião) — atual
z=  0   GameArea overlays (halos centro mesa) — herda do atual
z=-5    foreground parallax (objetos perto da câmera)
z=-10   midground parallax (bartender, TV, jukebox, patronos)
z=-15   background parallax (parede tijolinho + luz janela + chão)
```

### Event bus

Novo módulo: `src/lib/arena-events.ts`. Usa `mitt` (já dep do framer-motion ou adicionar — biblioteca de 100B):

```ts
import mitt from 'mitt'

export type ArenaEvent = {
  bate: { playerId: string; callerName: string }
  'peek-own': { playerId: string }
  'peek-other': { playerId: string; victimId: string }
  swap: { playerId: string; victimId: string }
  'snap-success': { playerId: string }
  'snap-fail': { playerId: string }
  'round-end': { winnerId: string | null }
  'match-end': { winnerId: string | null; podium: string[] }
  'time-running-out': { secondsLeft: number }
  'click-jukebox': void
  'click-tv': void
  'click-counter': void
}

export const arenaBus = mitt<ArenaEvent>()
```

**Publishers** (em `GameArea.tsx` e handlers):
- `useEffect` observa transições de `state.phase` / `state.bateCallerId` / `state.snapWindow` etc, e emite eventos
- Cliques em elementos clicáveis chamam `arenaBus.emit('click-jukebox')`

**Subscribers** (em cada componente de arena):
- `useEffect` registra listener no mount, unsubscribe no unmount
- Triggers animação local via framer-motion controls ou anime.js timeline

Vantagem: arena components ficam **completamente desacoplados** do GameStateRedux. Eles só ouvem eventos. Trocar de arena = trocar de subscribers, GameArea nem sabe.

### Composição React

```
GameArea (atual)
└── <ArenaScene arenaId={arenaId} />   ← NOVO componente raiz
    ├── BackgroundBoteco (atual, mas em camada -z-15)
    ├── ArenaDecorationsLayerStatic (atual, em -z-5)
    └── BotecoVivoLayer (NOVO, em -z-10)
        ├── Bartender (loop animado)
        ├── TV (tela animável + reage a BATE/round-end)
        ├── Jukebox (glow + clicável)
        ├── Patrons (silhueta + sway)
        ├── NeonAberto (pisca)
        ├── Cardapio (estático)
        ├── Lampiao (balanço lento)
        ├── ChoppSteam (particles CSS)
        └── ReactiveOverlays (shake, flash, vinheta — controlado via event bus)
```

Cada filho de `BotecoVivoLayer` é arquivo próprio, ~50-150 linhas. Sem componente Deus.

### Hook útil

```ts
// src/lib/use-arena-event.ts
export function useArenaEvent<K extends keyof ArenaEvent>(
  event: K,
  handler: (payload: ArenaEvent[K]) => void
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  useEffect(() => {
    const wrapped = (payload: ArenaEvent[K]) => handlerRef.current(payload)
    arenaBus.on(event, wrapped)
    return () => { arenaBus.off(event, wrapped) }
  }, [event])
}
```

Uso:
```tsx
function TV() {
  const [showGol, setShowGol] = useState(false)
  useArenaEvent('bate', () => {
    setShowGol(true)
    setTimeout(() => setShowGol(false), 1800)
  })
  ...
}
```

---

## Asset manifest

Lista item-a-item do que precisa ser gerado pelo Matheus, com ferramenta sugerida pra cada.

### Background estático (camada -z-15)
Já existe via CSS no `BackgroundBoteco.tsx`. **Nenhum asset novo.**

### Decorações estáticas (camada -z-5)

| # | Asset | Dimensão | Formato | Tool sugerido | Notas |
|---|-------|----------|---------|---------------|-------|
| 1 | `neon-bar-do-batinho.webp` | 240x80 | PNG/WebP transparente | **Recraft.ai** (style: neon sign, glowing letters) | "Neon sign saying BAR DO BATINHO, orange/yellow glow, transparent background, retro bar style" |
| 2 | `cardapio.webp` | 160x200 | PNG/WebP | **Midjourney** ou **Flux** | "Chalkboard menu hanging on brick wall, handwritten text saying CHOPP R$8 PORÇÃO R$22 BATINHO R$0, Brazilian botequim style, warm lighting" — texto pode também ser overlay HTML |
| 3 | `quadro-campeao.webp` | 100x130 | PNG/WebP | **Recraft.ai** | "Small framed photograph of a champion squirrel character (Batinho) holding a trophy, wooden frame, hanging on bar wall" |
| 4 | `lampiao.webp` | 80x120 | PNG/WebP transparente | **Recraft.ai** | "Vintage hanging brass lamp/lantern, warm yellow glow inside glass, transparent background, isometric view from below" |

### Decorações animadas (camada -z-10)

| # | Asset | Dimensão | Formato | Tool sugerido | Notas |
|---|-------|----------|---------|---------------|-------|
| 5 | `bartender-batinho/idle-1.webp`<br>`bartender-batinho/idle-2.webp`<br>`bartender-batinho/idle-3.webp`<br>`bartender-batinho/idle-4.webp` | 200x280 cada | PNG/WebP transparente | **Recraft.ai** com style reference do Batinho existente + img2img | **Frame-by-frame loop de 4 frames** do Batinho atrás do balcão limpando um copo. Mesma pose corporal, braço/copo em posições diferentes. Use o Batinho mais próximo do "bartender" no seu set (talvez batinho-feliz como base). |
| 6 | `bartender-batinho/peek.webp` | 200x280 | PNG/WebP transparente | **Recraft.ai** img2img | Batinho bartender com sobrancelha levantada, olhando pra esquerda (pra mesa). Substitui idle quando evento peek dispara. ~1.2s de exibição. |
| 7 | `bartender-batinho/wipe-counter.webp` | 200x280 | PNG/WebP transparente | **Recraft.ai** img2img | Batinho com pano passando no balcão. Substitui idle no round-end. ~2s. |
| 8 | `bartender-batinho/spill.webp` | 200x280 | PNG/WebP transparente | **Recraft.ai** img2img | Batinho com copo virado, expressão "puts". Substitui idle no momento da derrota. |
| 9 | `tv.webp` (moldura) | 140x100 | PNG/WebP transparente | **Recraft.ai** | "Old CRT TV hanging on wall, brown plastic frame, transparent background, isometric view slight perspective. Empty screen area for compositing." Tela vai ser elemento HTML separado por cima. |
| 10 | `jukebox.webp` | 120x180 | PNG/WebP transparente | **Recraft.ai** | "Vintage colorful jukebox, chrome details, vinyl record visible, transparent background, slight 3/4 view" |
| 11 | `patrono-silhueta-1.webp` | 80x140 | PNG/WebP transparente | **Recraft.ai** | "Dark silhouette of a person from behind sitting at a bar stool, holding a beer glass, transparent background, simple shapes" |
| 12 | `patrono-silhueta-2.webp` | 80x140 | PNG/WebP transparente | **Recraft.ai** | Mesma referência da #11 mas pose ligeiramente diferente (cabeça inclinada, gesto de "falando") |

### Particles e efeitos reativos
Tudo CSS/JS, **nenhum asset.**

### Sons (futuro)
Fora do escopo desse spec. Quando ativar, sons recomendados (free libraries: freesound.org, mixkit.co):
- Click no jukebox → snippet curto de sertanejo/funk
- BATE → torcida de futebol "GOOOOL!"
- Vitória → riff de viola

### Tools ranqueados (resumo)

| Tool | Forte em | Quando usar |
|------|----------|-------------|
| **Recraft.ai** | Consistência de personagem entre frames, transparência limpa, vector capabilities | Quase tudo aqui — especialmente quando precisa do Batinho consistente entre frames |
| **Midjourney v6+** | Cenas atmosféricas com alta qualidade, texturas | Cardápio com vibe pintado à mão, ou cenas de bar mais elaboradas |
| **Flux (via Krea.ai ou local)** | Cartoony, estilo coeso, custo baixo | Asset adicional ou variações rápidas |
| **DALL-E 3 (via ChatGPT)** | Iteração textual rápida, bom em conceitos | Brainstorm de variações ("me dá 4 versões dessa placa") |
| **Figma + Iconify** | SVG vetorial manual, controle pixel-perfect | Se quiser desenhar à mão a TV, jukebox, neon como SVG inline (alternativa aos PNGs) |
| **remove.bg** | Limpar background pra ficar 100% transparente | Pós-processamento de qualquer PNG gerado |
| **squoosh.app** | Comprimir PNG/WebP sem perder qualidade | Otimização final antes do commit |

**Workflow recomendado por asset:**
1. Gera no Recraft.ai com style reference do Batinho atual
2. Passa em remove.bg pra garantir transparência limpa
3. Comprime em squoosh com WebP quality 85
4. Joga em `public/arenas/boteco/{categoria}/{nome}.webp`

**Pro tip de consistência:** Antes de gerar a sequência do bartender (frames 1-4), salva um Batinho-bartender "canônico" e usa ele como **style reference** em todos os geradores. Recraft.ai aceita upload de reference image pra manter estilo idêntico. Sem isso o personagem vira "outro coelho" entre frames.

---

## Choreography — Fase 1: Ambient

Roda sempre, sutil, sem afetar gameplay. Tudo CSS keyframes em `globals.css` (já existe pattern de `deco-anim-*`).

### Bartender
- Frame loop 4 frames @ 3 FPS = 1.33s/ciclo
- CSS: `animation: bartender-idle 1.33s steps(4) infinite`
- Implementação: spritesheet horizontal 800x280 (4 frames x 200px), `background-position` muda em steps

### TV
- Tela exibe placar fixo "BAT 1 x 0 BAR" piscando o "1" toda 2s
- Borda da TV imóvel, tela é div HTML por cima com text + CSS animation
- `text-shadow` pulsando subtilmente pra simular CRT

### Jukebox
- Glow pulsa devagar (4s ease-in-out)
- Discos visíveis girando lento (CSS `animation: spin 12s linear infinite`)
- Hover: cursor pointer + brightness +10%

### Patronos silhueta
- Cabeça inclina ligeiramente a cada 6s (`animation: patron-sway 6s ease-in-out infinite`)
- 2 patronos com offset de animação diferente (delay 2s no segundo) pra não parecerem sincronizados

### Neon "ABERTO"
- Pisca leve a cada 8s (1 frame de dimmed)
- `animation: neon-flicker 8s steps(20, end) infinite`

### Lampião
- Balança lento ±2deg a cada 6s
- `transform-origin: top center`

### Fumaça do chopp central
- 3 divs com `radial-gradient` (cinza→transparente)
- Cada um sobe e desaparece em 4s, com delay diferente (0s, 1.3s, 2.6s)
- `animation: smoke-rise 4s linear infinite`
- Posicionados acima da pilha de descarte

### Mouse parallax
- Componente `useMouseParallax` retorna `{x, y}` deslocamento do mouse vs centro tela
- Aplica em cada layer com força diferente: bg -15px, mid -8px, fore -3px
- CSS `transform: translate3d(...)` pra GPU
- Throttle 16ms (60fps cap)

---

## Choreography — Fase 2: Reativo

Dispara em eventos do gameplay via event bus.

### BATE!
**Trigger:** `arenaBus.emit('bate', { playerId, callerName })`
**Reactions (em paralelo):**
- TV: substitui tela por "GOOOOL!" giant text shaking, 1.8s
- Bartender: troca pra `bartender-batinho/spill.webp` por 1s
- Luz da janela: pulsa alaranjado intenso 3 vezes
- Tela inteira: shake suave 200ms (anime.js easeOutElastic)
- Vinheta vermelha overlay 50% alpha → 0% em 600ms

### Olhadinha (peek-own)
**Trigger:** `arenaBus.emit('peek-own', { playerId })`
**Reaction:**
- Bartender: substitui por `bartender-batinho/peek.webp` (sobrancelha levantada) por 1.2s
- Glow sutil amarelo na mesa central (`box-shadow` pulse)

### Espiadinha (peek-other)
**Trigger:** `arenaBus.emit('peek-other', { playerId, victimId })`
**Reaction:**
- Patrono mais próximo (silhueta) gira a cabeça 5deg
- Sussurro visual: 3 pontinhos `...` flutuam do patrono pra mesa (CSS animation)

### Swap (troca)
**Trigger:** `arenaBus.emit('swap', { playerId, victimId })`
**Reaction:**
- Lampião balança forte 3 vezes (overlay anime.js sobre o swing leve do ambient)
- TV mostra estática (3 frames de noise CSS) por 300ms

### Snap success/fail
**Trigger:** `arenaBus.emit('snap-success' | 'snap-fail')`
**Reaction:**
- Success: confete pequeno cai do teto (10-15 particles, 1s)
- Fail: TV faz "ÁRBITRO!" texto vermelho piscando 800ms

### Round end
**Trigger:** `arenaBus.emit('round-end', { winnerId })`
**Reaction:**
- Bartender: troca pra `bartender-batinho/wipe-counter.webp` por 2.5s
- Music note flutuando do jukebox (1 nota, 2s)

### Match end (vitória)
**Trigger:** `arenaBus.emit('match-end', { winnerId, podium })`
**Reaction:**
- Confete denso cai do teto (50+ particles, 4s)
- TV mostra "CAMPEÃO!" giant
- Bartender ergue braço com chopp (novo frame `bartender-batinho/cheers.webp` opcional)
- Luz da janela fica intensa
- Jukebox glow pulsa mais forte

### Time running out
**Trigger:** `arenaBus.emit('time-running-out', { secondsLeft })`
**Reaction:**
- Lampião balança progressivamente mais rápido (anime.js controla velocidade)
- Relógio na TV aparece com ticktack visual
- Cliente do balcão (patrono) olha pra cima (cabeça inclina 15deg)

### Implementação

Cada effect vive no componente alvo. Padrão:

```tsx
function TV() {
  const [overlay, setOverlay] = useState<'idle' | 'gol' | 'arbitro' | 'campeao' | 'estatica'>('idle')
  
  useArenaEvent('bate', () => {
    setOverlay('gol')
    setTimeout(() => setOverlay('idle'), 1800)
  })
  useArenaEvent('snap-fail', () => {
    setOverlay('arbitro')
    setTimeout(() => setOverlay('idle'), 800)
  })
  useArenaEvent('match-end', () => setOverlay('campeao')) // sticky até unmount
  
  return (
    <div className="absolute ...">
      <img src="/arenas/boteco/tv.webp" /> {/* moldura */}
      <div className="absolute inset-[15%] flex items-center justify-center">
        {overlay === 'idle' && <ScoreScreen />}
        {overlay === 'gol' && <GolScreen />}
        {/* ... */}
      </div>
    </div>
  )
}
```

Shake da tela inteira: envolve GameArea ou ArenaScene num `motion.div` com `animate={shakeControls}`. Disparado por BATE.

### Publishers no GameArea

Adiciona em `GameArea.tsx`:

```tsx
const prevPhase = useRef(state.phase)
useEffect(() => {
  if (prevPhase.current !== 'bate-called' && state.phase === 'bate-called' && state.bateCallerId) {
    const caller = state.players.find(p => p.id === state.bateCallerId)
    arenaBus.emit('bate', { playerId: state.bateCallerId, callerName: caller?.name ?? '?' })
  }
  // ... outros eventos
  prevPhase.current = state.phase
}, [state.phase, state.bateCallerId, ...])
```

---

## Choreography — Fase 3: Interativo

Cliques no cenário disparam micro-anims sem afetar gameplay. Pura recompensa visual.

### Jukebox
**onClick** → `arenaBus.emit('click-jukebox')`
**Reaction:**
- Nota musical ♪ flutua do jukebox subindo 80px com rotation +30deg, fade out em 1.5s
- Disco gira mais rápido por 500ms
- (Futuro: tocar snippet de áudio)

### TV
**onClick** → `arenaBus.emit('click-tv')`
**Reaction:**
- Estática CSS (noise) por 200ms
- Troca pra um "canal" diferente: random entre placar X, propaganda Y, weather Z, durante 1.5s
- Volta pro idle

### Balcão (área debaixo do bartender)
**onClick** → `arenaBus.emit('click-counter')`
**Reaction:**
- Bartender acena rapidamente (substitui frame por `wave.webp` ou apenas anime.js rotação +15deg do braço se for SVG puppet)
- Lampião pisca 2x

### Implementação

Cada elemento clicável tem `onClick={() => arenaBus.emit('click-X')}` + `cursor-pointer`. Componente alvo ouve o evento e dispara animação local. Cliques são throttled (1/segundo) pra não floodar.

### Rate limit
```ts
function useClickThrottle<K extends keyof ArenaEvent>(event: K, ms = 1000): () => void {
  const lastClickRef = useRef(0)
  return useCallback(() => {
    const now = Date.now()
    if (now - lastClickRef.current < ms) return
    lastClickRef.current = now
    arenaBus.emit(event, undefined as ArenaEvent[K])
  }, [event, ms])
}
```

---

## Performance

Considerações importantes pra não derrubar device fraco:

- **Ambient só CSS keyframes** — não usa requestAnimationFrame, GPU compositing
- **Reactive em framer-motion** — só executa quando evento dispara, não sempre
- **Particles efêmeros** — confete tem max 60 elementos, são removidos do DOM ao terminar
- **Sprites do bartender** — 1 spritesheet horizontal 800x280 (~80KB WebP) carregado uma vez
- **prefers-reduced-motion** — desliga TODAS as animações, mostra estado estático
- **Mouse parallax throttled** 60fps cap
- **Lazy load Boteco** — `BackgroundBoteco` e filhos só montam quando `arenaId === 'boteco'`. User com arena default paga 0 custo.

**Métricas alvo:**
- 60 FPS sustentado em MacBook Air M1 com 4 players + ambient + 1 reactive event
- < 5% CPU idle em ambient-only steady state
- < 500KB total de assets do Boteco Vivo (todos os 12 PNGs comprimidos)

---

## Roadmap de implementação

Recomendo executar em 3 PRs separados, cada um shippable independente:

### PR A: Framework (sem visual novo)
- Cria `arena-events.ts`, `arena-bus.ts`, hook `useArenaEvent`
- Refactor `BackgroundBoteco` + `ArenaDecorationsLayer` pra serem children de novo `ArenaScene` component
- Adiciona publishers em `GameArea.tsx` pra todos os eventos (`bate`, `peek-*`, `swap`, etc) — sem subscribers ainda
- Mouse parallax como hook standalone
- Type-check + smoke test (eventos disparam no console.log temporário)

### PR B: Ambient + Static (Fase 1)
- Bartender com spritesheet loop
- TV com placar piscando
- Jukebox com glow + disco girando
- Patronos com sway
- Neon ABERTO piscando
- Cardápio (asset)
- Lampião balançando
- Fumaça do chopp
- Visual smoke test em ambiente real

### PR C: Reativo + Interativo (Fase 2 + 3)
- Subscribers em cada componente da Fase 1
- TV reage a BATE com "GOOOOL!", a snap-fail com "ÁRBITRO!"
- Bartender troca de sprite em peek/round-end/match-end
- Confete na vitória
- Shake da tela no BATE
- Cliques no jukebox/TV/balcão
- Vinheta vermelha overlay
- Rate limit em cliques
- Validação por checklist de evento×reaction

Cada PR é mergeable independente. Ambient sem reativo já é o "Boteco Vivo MVP" — Fases 2+3 viram polish progressivo.

---

## Validação manual (checklist final)

Após todos os 3 PRs mergeados:

1. **Ambient sempre rodando**
   - [ ] Entrar na sala com boteco → bartender limpando copo em loop
   - [ ] TV mostrando placar
   - [ ] Jukebox brilhando
   - [ ] Fumaça subindo da pilha central
   - [ ] Patronos silhueta inclinando cabeça
   - [ ] Neon piscando ocasionalmente

2. **Reativos**
   - [ ] Chamar BATE → TV GOOOOL, tela shake, bartender derrama
   - [ ] Olhadinha (peek own) → bartender olha pro lado
   - [ ] Espiadinha (peek other) → patrono gira cabeça + "..." flutua
   - [ ] Snap success → confete pequeno
   - [ ] Snap fail → TV "ÁRBITRO!"
   - [ ] Round end → bartender limpa balcão
   - [ ] Match end vitória → confete denso + TV CAMPEÃO + bartender brinde
   - [ ] Tempo acabando → lampião balança forte

3. **Interativo**
   - [ ] Click jukebox → nota musical voa
   - [ ] Click TV → estática + canal muda 1.5s
   - [ ] Click balcão → bartender acena
   - [ ] Click rápido 5x no mesmo → só primeiro dispara (rate limit)

4. **Performance**
   - [ ] Mac/PC fraco roda 60fps em ambient
   - [ ] Reactive event não derruba FPS
   - [ ] Reduced motion off → todas anims ativas
   - [ ] Reduced motion on → tudo estático mas layout preservado

5. **Não regrediu**
   - [ ] Arena default continua sem boteco-vivo elements
   - [ ] Outros pickers (skin, deck) seguem funcionando
   - [ ] Sair/voltar da sala não duplica listeners (sem memory leak)
