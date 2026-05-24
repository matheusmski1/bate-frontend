# Festa BR — Redesign Visual Completo

> Design spec do redesign de identidade visual do Bate. Substitui o look atual (genérico, sem personalidade) pela linguagem "Festa BR" inspirada em FDP / Truco / Exploding Kittens / Balatro, com mascote Batinho como protagonista do baralho.

---

## Contexto

A versão atual da UI funciona mas não tem personalidade. Foi rejeitada pelo usuário ("design péssimo"). Após brainstorm com 3 direções (Casino Noir, Brutalist Indie, Minimal Modern) e refinamento, foi escolhida a direção **Festa BR**: paleta creme + vermelho + dourado, tipografia chunky com sombras hard-offset, layout de manual ilustrado de jogo de tabuleiro brasileiro.

O usuário também forneceu **15 artes IA-generated do mascote Batinho** (esquilinho chibi) — 14 cartas + 1 verso. Essas artes substituem todo o baralho.

---

## Objetivo

Transformar Bate de "protótipo bege funcional" em "jogo de cartas indie com identidade visual forte e coesa", aplicando a linguagem Festa BR em todas as telas e substituindo o baralho pelas artes do Batinho.

---

## Escopo

### Telas afetadas

1. **Lobby** (`src/app/page.tsx`) — redesign completo
2. **Waiting Room** (`src/components/room/WaitingRoom.tsx`) — aplicar linguagem
3. **Game Area** (`src/components/room2d/GameArea.tsx` + filhos) — fundo + sobreposições + paleta
4. **Round End** (`src/components/room/RoundEndScreen.tsx`) — refinar com paleta nova
5. **Match End** (`src/components/room/MatchEndScreen.tsx`) — refinar com paleta nova
6. **Modais** (`CreateRoomDialog`, `PeekModal`, `InitialPeekConfirm`) — bordas pretas grossas, sombras offset, paleta nova

### Componentes afetados

- `Card2D.tsx` — refactor completo (passa a usar `<Image>` em vez de layout interno)
- `CardFace.tsx` — **DELETADO** (substituído pela imagem)
- `CardBack.tsx` — refactor (passa a usar verso PNG)
- `card-meta.ts` — adicionar campo `image` por rank
- `tailwind.config.ts` — repaletizar tokens `cabo-*`
- `globals.css` — importar fontes (Bowlby One, Fredoka, Caveat)
- Vários componentes do lobby criados anteriormente (Hero, QuickRules, Avatar, MuteToggle, Footer, RoomList) — reestilizar com a linguagem Festa BR

---

## Identidade visual

### Paleta

Substitui os tokens atuais `cabo-bg/cabo-purple/cabo-accent/etc`:

| Token Tailwind | Hex | Uso |
|---|---|---|
| `bate-cream` | `#f5e9c9` | Fundo principal (papel antigo) |
| `bate-paper` | `#fff5d1` | Superfícies elevadas (cartas, inputs, modais) |
| `bate-ink` | `#1a0e08` | Texto, todas as bordas (marrom-tinta, não preto puro) |
| `bate-red` | `#d63232` | CTAs urgentes, autor de ação, destaque |
| `bate-red-deep` | `#8b1a1a` | Sombras de gradient no vermelho |
| `bate-gold` | `#ffb81c` | Cartas OURO, botão principal, vitória |
| `bate-green` | `#4a7c4f` | Feedback positivo (snap-success, sala disponível) |
| `bate-teal` | `#2c8a9c` | Cartas de ação (TROCA, OLHADINHA, ESPIADINHA) |
| `bate-silver` | `#d3d3d3` | Cartas PRATA |

Os tokens `cabo-*` antigos serão **renomeados** (não preservados pra compatibilidade — refactor limpo).

### Tipografia

Carregadas via Google Fonts no `globals.css`:

- **Display** (títulos, badges, números chunky): `'Bowlby One', sans-serif` — peso massivo, redondo
- **Body** (UI, inputs, copy): `'Fredoka', sans-serif` weight 500-600 — amigável, redondo
- **Manuscrita pontual** (legendas em modais especiais, accents): `'Caveat', cursive` weight 700 — uso parcimonioso

Tailwind config:
```ts
fontFamily: {
  display: ['Bowlby One', 'sans-serif'],
  body: ['Fredoka', 'sans-serif'],
  hand: ['Caveat', 'cursive'],
}
```

### Linguagem visual ("Festa BR")

- **Bordas pretas grossas** em todo elemento interativo: `border-[3px]` ou `border-[4px]` (não 1-2px)
- **Hard-shadow offset** em vez de drop-shadow soft: `box-shadow: 5px 5px 0 var(--ink)` — sólida, mesma cor de borda, sempre `+x +y` (não centralizada)
- **Cantos arredondados moderados**: `rounded-xl` (12px) — chunky mas não fofo
- **Stickers tortos** (badges decorativos): rotação −12° a +12°, fundo colorido + borda preta
- **Stretching tipográfico em títulos**: `-webkit-text-stroke: 2-3px var(--ink)` + múltiplos `text-shadow` em camadas (preta + colorida + preta) pro efeito "carimbo descolado"

### Mascote recorrente

As **5 cartas especiais** (OURO/PRATA/OLHADINHA/ESPIADINHA/TROCA) são os personagens recorrentes da identidade. Aparecem:

- Flutuando no hero da home (bob animado, rotação leve)
- Como ícone em badges decorativos (modais, tooltips)
- Como "MVP" no round-end (carta com menor pontuação ganha destaque)

Não há mascote humano/animal separado — **as cartas são o branding**.

---

## Baralho — substituição pelos PNGs do Batinho

### Assets fornecidos (em `/Users/matheusdev/Downloads/batinho-cartas/`)

| Arquivo | Rank | Tipo |
|---|---|---|
| `batinho-as.png` | A (Ás) | numeric (+1) |
| `batinho-2.png` … `batinho-9.png` | 2-9 | numeric |
| `batinho-olhadinha.png` | 10 | action (+10) |
| `batinho-espiadinha.png` | J | action (+11) |
| `batinho-troca.png` | Q | action (+12) |
| `batinho-k-3.png` | K | silver (−3) |
| `batinho-joker.png` | JOKER | gold (−6) |
| `bate-verso-de-carta.png` | — | back (verso) |

Total: **15 PNGs**, todas 864×1232 (aspect 7:10), ~1.1MB cada cru.

### Decisões de design

- **Naipe único por rank**: as 4 cópias de cada rank (♠♥♦♣) usam a mesma arte. Naipe vira decorativo (não importa em game logic do Cabo).
- **batinho-5** apresenta cartas Q decorativas voando ao redor — aceito (rank "5" claro nos cantos).
- **Verso único** (`bate-verso-de-carta.png`) usado em todas as cartas viradas.

### Pipeline de otimização

Sem otimização: 15MB total → inviável.

```
bate-frontend/public/cards/raw/*.png  (864×1232, ~1.1MB cada)
        ↓ scripts/optimize-cards.ts (sharp)
bate-frontend/public/cards/*.webp     (320×448, ~40-60KB cada)
```

- **Dimensão final**: 320×448 (cobre `lg @2x` retina com 10% buffer; downscale em sm/md é browser-side)
- **Formato**: WebP (lossy quality 85)
- **Total esperado**: ~700KB-1MB (vs 15MB) — 95% de redução

Script `scripts/optimize-cards.ts` é parte do build (não roda em runtime). Outputs vão pro git.

### Mapeamento rank → arquivo

Em `card-meta.ts`:

```ts
export const CARD_META: Record<Rank, CardMeta & { image: string }> = {
  'A':     { pointValue: 1,  kind: 'numeric', image: '/cards/batinho-as.webp' },
  '2':     { pointValue: 2,  kind: 'numeric', image: '/cards/batinho-2.webp' },
  // ... 3-9
  '10':    { pointValue: 10, kind: 'action',  image: '/cards/batinho-olhadinha.webp', displayName: 'OLHADINHA', abilityText: 'Espia 1 carta SUA' },
  'J':     { pointValue: 11, kind: 'action',  image: '/cards/batinho-espiadinha.webp', displayName: 'ESPIADINHA', abilityText: 'Espia 1 carta de OUTRO' },
  'Q':     { pointValue: 12, kind: 'action',  image: '/cards/batinho-troca.webp',     displayName: 'TROCA',      abilityText: 'Troca carta com outro jogador' },
  'K':     { pointValue: -3, kind: 'silver',  image: '/cards/batinho-k.webp',         displayName: 'PRATA',      abilityText: 'Vale −3 pontos' },
  'JOKER': { pointValue: -6, kind: 'gold',    image: '/cards/batinho-joker.webp',     displayName: 'OURO',       abilityText: 'Vale −6 pontos' },
}

export const CARD_BACK_IMAGE = '/cards/back.webp'
```

Note: campos `iconName` e badges internos atualmente em `CARD_META` (Eye, Search, ArrowLeftRight, etc) deixam de ser usados em `CardFace`, mas ficam mantidos no meta porque ainda são usados em `QuickRules.tsx`, `ActionLog.tsx` e tooltips.

### Refactor de `Card2D.tsx`

**Atual** (resumido):
- Renderiza `<CardFace rank suit>` em uma face e `<CardBack>` na outra
- `CardFace` tem layout interno complexo (badge top-left, suit cantos, icon+name centro)
- Tudo via CSS + container queries

**Novo**:
- Renderiza `<img src={CARD_META[rank].image}>` na face frontal
- `<img src={CARD_BACK_IMAGE}>` na face traseira
- Mantém: animação flip 3D (`rotateY`), borda, hard-shadow, hover, `victimEffect` overlay, `tempRevealedAs`
- Remove: tooltip via meta (mantém via `title` HTML attr)
- Image element: usar `<img>` cru (não Next.js `Image`) por simplicidade dentro de animações 3D — performance é OK pois imagens são pequenas (~40-60KB cada, lazy-loaded por padrão)

Container queries (cqh/cqw) **não são mais necessárias** pois a imagem se ajusta ao container via `object-fit: cover`.

### `CardFace.tsx` — DELETADO

Sem substituto. A "face" da carta agora é a imagem direta.

### `CardBack.tsx` — Refactor

```tsx
export function CardBack() {
  return <img src="/cards/back.webp" alt="" className="w-full h-full object-cover rounded-md" />
}
```

---

## Lobby — redesign aplicando Festa BR

Componentes já existentes (do redesign anterior rejeitado) serão **reestilizados** com a nova linguagem visual:

- `Hero.tsx` — substituir cartas SVG falsas por **`<img>` das 5 cartas especiais do Batinho** flutuando (animação framer-motion mantida)
- `QuickRules.tsx` — paleta nova, fontes Bowlby/Fredoka, manter ícones lucide
- `Avatar.tsx` — manter (hash → HSL gradient já funciona com qualquer paleta)
- `MuteToggle.tsx` — paleta nova, borda preta grossa, hard-shadow
- `Footer.tsx` — paleta nova
- `RoomList.tsx` — empty state com Batinho ilustrado em vez de emoji 🃏
- `CreateRoomDialog.tsx` — paleta nova, bordas grossas, botões chunky

Layout estrutural do lobby (já aprovado): Hero + name input + QuickRules + Quick Play CTA + Rooms section + Footer.

---

## In-game (GameArea) — aplicar identidade

- **Background**: substituir gradiente atual por gradiente Festa BR (cream + leve textura SVG)
- **TurnBanner, CaboButton, InstructionBar**: paleta nova, bordas grossas, hard-shadow
- **BateAnnouncement** (anime.js timeline existente): manter coreografia, apenas trocar cores/fontes pro vermelho + ink + Bowlby One
- **PeekModal**: paleta nova, sticker tag "OLHADINHA"
- **DiscardPile2D, DeckPile2D, DrawnCard2D**: usam `Card2D` refatorado — auto-atualizam

---

## Round End / Match End

Os componentes `RoundEndScreen` e `MatchEndScreen` ganham a paleta nova mas mantêm a estrutura (já tem o breakdown de pontos por carta — feito em iteração anterior). Refinos:

- Card MVP da rodada (menor pontuação): pulsar com glow dourado + Batinho-OURO em badge celebração
- "Próxima rodada" button: chunky vermelho com hard-shadow
- Match-end com confete (DOM nodes coloridos, animação anime.js)

---

## O que NÃO está no escopo

- ❌ Variação de naipe por carta (todas as 4 cópias usam mesma arte)
- ❌ Re-gerar arte do batinho-5 (decisão: aceitar como está)
- ❌ Animações novas além das já existentes (somente troca de cores/fontes nas animações)
- ❌ Game logic / regras / scoring — sem alteração
- ❌ Sons (sounds.ts mantido)
- ❌ Backend — zero alteração
- ❌ Match history, leaderboard, persistência — fora do escopo
- ❌ Mobile-specific polish (assume desktop-first; mobile usa breakpoints já existentes)

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Imagens não otimizadas inflam o bundle | Script `optimize-cards.ts` no pre-commit ou no build. Apenas WebPs vão pro git. |
| Flash visual no primeiro carregamento | Preload das 15 imagens via `<link rel="preload">` no `<head>` |
| `<img>` dentro de animação 3D pode causar jank | Testar; se houver, voltar pra `background-image` (mais leve no compositor) |
| Fontes externas (Google Fonts) lentas no first paint | `font-display: swap` no `globals.css` import |
| Diferenças entre PNG e WebP em browsers antigos | WebP suportado em 100% dos browsers modernos. Não suportar Safari <14 / IE. |
| Refactor do `Card2D` quebrar `victimEffect` e `tempRevealedAs` | Tests manuais explícitos no plano de implementação |

---

## Critérios de sucesso

1. ✅ Todas as 14 cartas do baralho renderizam com a arte do Batinho
2. ✅ Verso da carta renderiza com `bate-verso-de-carta`
3. ✅ Lobby reflete a identidade Festa BR (hero, fontes, paleta, bordas grossas, sombras offset)
4. ✅ Round-end e match-end refletem a identidade
5. ✅ Game area (in-play) reflete a identidade no background + chrome
6. ✅ Bundle total das cartas <1MB depois de otimizado
7. ✅ Tempo de carregamento inicial do lobby <2s em 4G
8. ✅ Animações existentes (flip 3D, BATE!, snap, peek, swap) continuam funcionando
9. ✅ Typecheck passa, sem regressão em testes existentes
10. ✅ Build de produção compila sem warnings críticos

---

## Próximo passo

Após aprovação deste spec, invocar a skill `writing-plans` pra criar um plano de implementação detalhado, dividido em tarefas pequenas (otimização de assets → tailwind config → fontes → Card2D refactor → telas uma por uma).
