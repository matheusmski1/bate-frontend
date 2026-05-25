# Sistema de Animações de Mascote (anime.js + overlay)

**Data:** 2026-05-25
**Status:** Aprovado (aguardando review do user)
**Escopo:** olhadinha, espiadinha, snap (acertou/errou), troca, tempo acabando

## Contexto

Hoje várias ações importantes do jogo (`peek-own`, `peek-other`, snap, swap) acontecem **silenciosamente** do ponto de vista visual: o servidor responde, o estado muda, modais abrem, mas não tem nenhum "ator visível" representando a ação. O batinho existe como personalidade do jogo (vários WebPs em `public/batinho/`, mapeados em `src/lib/mascot.ts`), mas usado só decorativamente até agora.

A ideia: criar um **sistema de animações de mascote** disparado por eventos de jogo, que adiciona uma camada teatral em cima das ações sem mudar lógica. O mascote do ator viaja entre elementos do tabuleiro (descarte, cartas, avatares), comunicando quem fez o quê e dando peso dramático aos momentos.

Prototipado em `/test-mascot-overlay` e validado.

## Escopo (MVP)

6 animações, divididas em 4 padrões arquiteturais:

| # | Animação | Trigger | Padrão | Asset(s) |
|---|---|---|---|---|
| 1 | **Olhadinha** | `peek-own` effect resolvido | Flight (descarte → carta) | feliz → lupa |
| 2 | **Espiadinha** | `peek-other` effect resolvido | Flight (descarte → carta oponente) | feliz → espiadinha |
| 3 | **Snap acertou** | `game:snap` resposta ok | Pop-on-card | feliz |
| 4 | **Snap errou** | `game:snap` resposta erro | Pop-on-card com shake | assustado |
| 5 | **Troca** | `swap` effect resolvido | 2-leg flight (descarte → minha carta → carta oponente) | feliz → troca-de-cartas |
| 6 | **Tempo acabando** | Client-side inactivity (turn > 15s sem ação) | Attached loop (flutua no avatar) | tempo-acabando |

**Não inclui (futuro):**
- `initial-peek` (fase inicial de espiada nas próprias cartas)
- BATE chamado (já tem versão em `BateAnnouncement.tsx`)
- Vitória/derrota da rodada (já tem em `RoundEndScreen.tsx`)
- Som — toda animação é silenciosa neste MVP
- Sincronização de timer entre jogadores (tempo acabando é cosmético por cliente)

## Arquitetura

### Princípio

Animações são uma **camada passiva de apresentação** sobre o fluxo existente. Não mudam lógica de jogo. Não emitem eventos novos no servidor. Leem os mesmos sinais que `GameArea` já lê (respostas de socket e entradas em `state.log`) e usam medições de DOM via atributos `data-*` para descobrir posições em tempo de animação.

### Novos arquivos

```
src/
├── components/room2d/
│   └── MascotOverlay.tsx           # componente raiz, montado em GameArea
└── lib/mascot-overlay/
    ├── index.ts                    # exports públicos
    ├── controller.ts               # primitivas: runFlight, runSwapDelivery, popOnCard, attachLoop
    ├── geometry.ts                 # boxFor, getRect helpers
    ├── assets.ts                   # paths + aspect ratios
    └── triggers/
        ├── peek-own.ts             # observa tempReveal local + log.peek de outros
        ├── peek-other.ts           # idem
        ├── snap.ts                 # observa log.snap (sucesso/erro)
        ├── swap.ts                 # observa log.swap
        └── tempo-acabando.ts       # observa state.turn changes + inactivity timer
```

Cada arquivo em `triggers/` exporta uma função `useXTrigger({ state, myId, overlay })` que retorna `void` mas registra `useEffect`s e chama `overlay.runX(...)` quando dispara.

### Mudanças cirúrgicas em arquivos existentes

| Arquivo | Mudança |
|---|---|
| `src/components/room2d/Card2D.tsx` | Adiciona `data-card-id={card.id}` no wrapper externo. |
| `src/components/room2d/DiscardPile2D.tsx` | Adiciona `data-discard-pile` no container do topo. |
| `src/components/room2d/OpponentArea.tsx` | Adiciona `data-opponent-nameplate={player.id}` no wrapper do nameplate. |
| `src/components/room2d/PlayerHand2D.tsx` | Adiciona `data-player-nameplate={player.id}` no wrapper do nameplate. |
| `src/components/room2d/GameArea.tsx` | Monta `<MascotOverlay state={state} myId={myId} localActions={...} />` perto de `<PeekModal>`. Refatora `tempReveal` pra separar "marcar conhecido" (imediato) de "abrir modal" (callback do overlay). |
| `src/components/room2d/PeekModal.tsx` | Sem mudanças. |

### Componente raiz

```tsx
type LocalActions = {
  peekRevealed: { cardId: string; reveal: RevealValue } | null
  snapResult: { handIndex: number; ok: boolean } | null
  swapResolved: { myCardId: string; opponentCardId: string } | null
}

function MascotOverlay({ state, myId, localActions, onPeekArrived }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const overlay = useMascotController(overlayRef)  // exposes runFlight, runSwap, popOnCard, attachLoop

  usePeekOwnTrigger({ state, myId, overlay, localActions, onArrived: onPeekArrived })
  usePeekOtherTrigger({ state, myId, overlay, localActions })
  useSnapTrigger({ state, myId, overlay, localActions })
  useSwapTrigger({ state, myId, overlay, localActions })
  useTempoAcabandoTrigger({ state, myId, overlay })

  return <div ref={overlayRef} className="fixed inset-0 pointer-events-none z-40" aria-hidden />
}
```

### Primitivas do controller

```ts
export type Controller = {
  runFlight(opts: FlightOpts): { cancel: () => void }
  runSwapDelivery(opts: SwapOpts): { cancel: () => void }
  popOnCard(opts: PopOpts): { cancel: () => void }
  attachLoop(opts: AttachOpts): { cancel: () => void }
}

type FlightOpts = {
  fromRect: DOMRect
  toRect: DOMRect
  travelAsset: string       // ex: FELIZ
  arrivalAsset: string      // ex: LUPA ou ESPIADINHA
  onArrived?: () => void
  onComplete?: () => void
}

type SwapOpts = {
  fromRect: DOMRect
  midRect: DOMRect          // minha carta
  toRect: DOMRect           // carta do oponente
  travelAsset: string       // FELIZ
  carryAsset: string        // TROCA
  onSwapped?: () => void
  onComplete?: () => void
}

type PopOpts = {
  targetRect: DOMRect
  asset: string             // FELIZ ou ASSUSTADO
  variant: 'success' | 'shake'
  onComplete?: () => void
}

type AttachOpts = {
  anchorElement: HTMLElement     // observa via ResizeObserver pra reposicionar
  asset: string                  // TEMPO
  position: 'top-right' | 'top-center'
  onComplete?: never             // attach é persistente; retorna cancel() pra parar
}
```

Todas as primitivas:
- Respeitam `prefers-reduced-motion` → skip imediato chamando callbacks síncronos
- Têm try/catch interno que chama callbacks mesmo se anime.js falhar
- Lidam com elementos ausentes (rect null) → skip + callbacks
- Retornam `{ cancel }` pra interrupção externa

### Sistema de fila

Animações enfileiram numa lista interna do controller. Apenas 1 animação "flight/swap/pop" roda por vez (são exclusivas). `attachLoop` é separado (pode coexistir múltiplos).

Se animação nova chegar com `flight/swap/pop` já rodando: **dropa a nova mas executa callbacks (`onArrived`, `onComplete`) imediato** pra não travar UX (modal abre, fluxo continua).

## Data flow por animação

### #1 Olhadinha (peek-own)

```
ATOR (eu):
1. Clico minha carta → handlePlayerCardClick → emit('game:effect-target')
2. Server responde { revealed: [{ card }] }
3. tempReveal(cardId, value) — refatorado:
   a. setTempReveals(...) — IMEDIATO (mostra valor na mão)
   b. setKnownCards(...) — IMEDIATO
   c. setLocalActions({ peekRevealed: { cardId, reveal } }) — em vez de setRevealModal direto
4. MascotOverlay vê peekRevealed mudar → controller.runFlight({ from=descarte, to=cardId, travel=FELIZ, arrival=LUPA, onArrived: () => setRevealModal(value) })
5. ~900ms depois, onArrived → modal abre normalmente

OBSERVADOR (não-ator):
1. state.log ganha { type: 'peek', actorId, payload: { targetPlayerId, cardIndex } }
2. usePeekOwnTrigger detecta (espelha lógica L133-181 atual)
3. controller.runFlight idêntico, mas SEM onArrived/modal (observador não vê valor)
4. markVictimEffect já existe e continua disparando independente
```

### #2 Espiadinha (peek-other)

Idêntico a olhadinha, exceto:
- Trigger: `usePeekOtherTrigger` observa `peek-other` em vez de `peek-own`
- Asset de chegada: ESPIADINHA em vez de LUPA
- Target: carta do oponente (mesma mecânica de measurement via `data-card-id`)

### #3+4 Snap (acertou/errou)

```
1. Cliente emite game:snap com handIndex
2. Server responde { ok: true } ou { error }
3. handlePlayerCardClick HOJE: trata o erro com toast.error
4. NOVO: setLocalActions({ snapResult: { handIndex, ok: !error } })
5. MascotOverlay vê snapResult mudar → controller.popOnCard({ targetRect=mineHand[handIndex], asset=ok?FELIZ:ASSUSTADO, variant: ok?'success':'shake' })
6. ~900ms depois, onComplete → setLocalActions(prev => ({ ...prev, snapResult: null }))

Pra OUTROS jogadores observarem snap de alguém:
- state.log ganha { type: 'snap', actorId, payload: { handIndex, success } }
- useSnapTrigger detecta e dispara popOnCard na carta do actor (lookup actorId.hand[handIndex])
```

### #5 Troca

```
ATOR (eu):
1. Clico minha carta no modo swap → setMySwapPickIndex
2. Clico carta do oponente → handleOpponentCardClick → emit('game:effect-target' com myCardIndex + targetCardIndex)
3. Server responde { ok: true }
4. NOVO: setLocalActions({ swapResolved: { myCardId, opponentCardId } })
5. MascotOverlay vê → controller.runSwapDelivery({ from=descarte, mid=myCard, to=opponentCard, travel=FELIZ, carry=TROCA })
6. ~1900ms depois, onSwapped + onComplete

OBSERVADOR:
1. state.log ganha { type: 'swap', actorId, payload: { targetPlayerId, targetCardIndex, myCardIndex } }
2. useSwapTrigger detecta. Calcula 2 rects: actorPlayer.hand[myCardIndex] e targetPlayer.hand[targetCardIndex]
3. controller.runSwapDelivery idêntico
```

### #6 Tempo acabando (client-side inactivity)

```
1. useTempoAcabandoTrigger watch state.turn changes
2. Quando state.turn muda, record turnStartedAt = Date.now() pro turn atual
3. setInterval 1s: se Date.now() - turnStartedAt > 15000 e attachedRef.current === null:
   a. Lookup anchor element via data-opponent-nameplate ou data-player-nameplate do currentPlayerId
   b. controller.attachLoop({ anchorElement, asset: TEMPO, position: 'top-right' })
   c. attachedRef.current = cancel()
4. Quando state.turn muda DE NOVO: attachedRef.current?.(); attachedRef.current = null
5. Quando alguma ação acontecer (drawnCard set, snap, etc.): reset turnStartedAt
```

Importante: cada cliente conta SEU PRÓPRIO tempo localmente. Não tenta sincronizar entre jogadores. Implica que jogadores podem ver "tempo acabando" em momentos ligeiramente diferentes (diferenças de relógio + lag de socket). Isso é aceitável pra um nudge cosmético.

## Edge cases comuns

| Cenário | Comportamento |
|---|---|
| `[data-card-id]` ou `[data-discard-pile]` ausente | Skip animação, callbacks síncronos |
| Card alvo desmonta no meio da animação | Cleanup do `useEffect` cancela timeline, remove DOM, chama onComplete |
| Jogador desconecta no meio | Cleanup natural do React |
| 2 disparos da MESMA animação em sucessão (raro) | Fila enfileira (drop + callbacks imediatos do novo se já tá rodando) |
| `prefers-reduced-motion: reduce` | Skip animação, callbacks chamados em <100ms |
| Tab oculta (`document.hidden`) | anime.js pausa naturalmente. No `visibilitychange` de volta → `timeline.seek(timeline.duration)` |
| Falha no anime.js | Try/catch → callbacks síncronos. Modal/UX nunca trava por falha de animação |
| Tempo acabando: jogador toma ação no segundo 14.9 | Reset do turnStartedAt cancela attachLoop antes de aparecer |
| Tempo acabando: turno muda enquanto attach tá ativo | Cleanup do useEffect cancela o attach automaticamente |
| Animação dispara em viewport diferente (mobile rotation) | `getBoundingClientRect` retorna no momento do dispara — animação usa coords da medição, ignora rotation subsequente |

## Pipeline de assets

PNGs novos em `~/Downloads/batinho-cartas/` (formato 1376x768, sprite character-only com checkerboard baked) precisam de chroma-key antes de virar WebP usável.

**Novo script:** `scripts/optimize-mascot.mjs`

```js
// Uso: node scripts/optimize-mascot.mjs <input.png> <output.webp>
// Faz flood-fill de borda removendo pixels gray-ish (light 130-250, sat <25)
// Exporta WebP 1024w com alpha
```

Esse script vai ser usado pra:
- Gerar/regenerar `batinho-troca-de-cartas.webp` ✓ (já feito manualmente)
- Gerar/regenerar `batinho-espiadinha.webp` ✓ (já feito manualmente)
- Futuro: assustado, bate, feliz, lupa, tempo-acabando — se quiser reimportar dos originais 1376x768

Documenta o script em `scripts/README.md` (criar se não existir).

## Testing

Padrão do repo é não ter testes automatizados (não há `*.test.tsx`). Proposta:

- **Test page** `/test-mascot-overlay` (já feita) fica como ambiente de iteração visual permanente.
- **Sem testes unitários** pra controller/triggers no MVP. Refatorar pra testabilidade só quando aparecer regressão.
- **Verificação manual**: cada animação ligada testada em sessão real de jogo (2+ jogadores) antes de merge.

## Decisões registradas

1. **Trigger só client-side, zero mudança no server.**
2. **Visibilidade**: todas as animações são visíveis para todos os jogadores (não só o ator). Usa `state.log` como sinal cross-client.
3. **Origem das animações de flight/swap**: pilha de descarte (tematicamente coerente — efeito disparado por descarte).
4. **Sequencialização com modal/UX**: olhadinha/espiadinha disparam `onArrived` que abre o PeekModal. Modal fica como payoff visual; mascote como intro.
5. **Frame swap**: 2 frames por animação flight (travel asset + arrival asset). Swap instantâneo via `img.src` durante a timeline.
6. **Asset aspect ratios variam**: `ASPECTS` map em `lib/mascot-overlay/assets.ts` documenta cada um. Container `<div>` + `<img object-fit:contain>` absorve a variação sem layout shift.
7. **Tempo acabando**: 100% client-side, inactivity-based. Sem timer autoritativo no server. 15s default, configurável via const.
8. **Arquitetura modular**: 1 overlay raiz + N triggers desacoplados + 4 primitivas no controller. Facilita adicionar/desligar animação individual sem mexer no resto.
9. **Não vamos**:
   - Reusar `BatinhoOlhadinha.tsx` (componente legacy fica intocado, pode ser removido depois se ficar 100% órfão)
   - Reusar Lottie
   - Adicionar Choreographer global / EventBus (YAGNI)
   - Testar timings (frágil)

## Não vamos (recap)

- Não tocar no servidor
- Não animar BATE / vitória / RoundEnd (já existem)
- Não sincronizar tempo entre clientes
- Não adicionar som neste MVP
- Não remover `BatinhoOlhadinha.tsx` ou `/test-lottie` (legacy, deixa quieto)
