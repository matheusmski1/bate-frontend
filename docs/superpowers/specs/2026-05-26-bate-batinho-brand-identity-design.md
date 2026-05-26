# Bate vs Batinho — Identidade de Marca

> Design spec que resolve a confusão entre "Bate" (jogo/mecânica) e "Batinho" (marca/produto/mascote singular), elimina o uso plural antropomorfizado ("Os Batinhos são malandros") e alinha docs internos com a realidade pública do produto.

---

## Contexto

A UI pública do produto foi renomeada de "Bate" pra "Batinho" em algum momento da evolução do projeto, mas os docs internos (`docs/brand-brief.md`, `bate-backend/README.md`, `bate-frontend/README.md`) continuam chamando o jogo de "Bate" e descrevem Batinho apenas como "mascote opcional". Resultado: três contradições visíveis:

1. **Nome canônico ambíguo** — domínio é `batinho.com.br`, `<title>` é "Batinho", H1 do hero é "BATINHO" (`src/components/lobby/Hero.tsx:34`), mas docs falam "jogo Bate".
2. **Mascote contraditório** — `docs/brand-brief.md:62` diz textualmente "Não precisa criar mascote humano/animal. **As cartas são o branding.**", mas o projeto já tem `MASCOT` com 16 expressões do Batinho esquilinho (`src/lib/mascot.ts:1-18`), as 14 cartas do baralho são ilustrações dele (introduzido em `2026-05-24-festa-br-redesign-design.md`), e ele é NPC bartender numa arena (`2026-05-26-boteco-vivo-design.md`).
3. **Singular vs plural antropomorfizado** — copy do hero diz "**Os Batinhos** são malandros: memorizam, espiam, cortam..." (`src/components/lobby/Hero.tsx:46`). Mas Batinho é UM personagem (mascote singular), e quem memoriza/espia/corta é o jogador, não o mascote.

---

## Objetivo

Estabelecer um modelo mental claro de duas camadas (jogo vs marca), eliminar antropomorfização errada no copy, e alinhar os docs internos com a realidade pública do produto.

---

## Escopo

### Dentro

- Reescrever copy de body do `Hero.tsx` e meta descriptions em `layout.tsx`
- Reescrever seção contraditória do `docs/brand-brief.md` (linhas 9 e 62)
- Reescrever introduções dos `README.md` dos dois repos
- Documentar 5 regras práticas pra usos futuros

### Fora

- **Renomear repos** `bate-frontend`/`bate-backend` — nome técnico legado, renomear dá trabalho desproporcional (mudanças em Railway/Vercel/GitHub Actions/links de docs). Mantém divergência aceitável entre nome técnico e nome de marca.
- **Reescrever specs históricos** — `festa-br-redesign-design.md`, `boteco-vivo-design.md`, `arena-system-design.md` e `peek-mascot-animation-design.md` são snapshots históricos do momento da decisão. Não reescrever passado.
- **Mudar o H1 do hero** — "BATINHO" tá correto, é a marca.
- **Mudar domínio, favicon, manifest, OG image** — todos já refletem "Batinho".
- **Mudar nomes das cartas** — `OURO / PRATA / OLHADINHA / ESPIADINHA / TROCA` continuam como nomes das ações de jogo, não viram entidades nomeadas (não vira "Batinho-Ouro" etc.).

---

## Modelo mental: duas camadas

| Camada | Nome | É… | Aparece em |
|---|---|---|---|
| **Mecânica** | Bate | O jogo. Releitura BR da família "Golf" (Cabo/Pablo/Cambio). O que você joga. | Tutorial, regras, descrição técnica, copy descritivo ("vem jogar Bate", "regras do Bate"), SEO |
| **Marca/Persona** | Batinho (esquilinho chibi, singular) | O produto online e o personagem único que ilustra ele. | Domínio `batinho.com.br`, `<title>`, H1 do hero, ilustração do mascote, 14 cartas do deck, NPC bartender da arena Boteco, copy de marketing/persona |

**Regra de ouro:** Batinho aparece visualmente (mascote, cartas, NPC) e como nome do produto, mas **nunca é antropomorfizado fazendo as ações do jogador no copy**. Memorizar, espiar, trocar, cortar — são verbos do jogador, no imperativo. Batinho convida, ilustra, recebe — mas não joga.

---

## Regras práticas

Cinco regras curtas pra ancorar decisões futuras quando a dúvida voltar:

1. **Nome do jogo é "Bate"** — use em contextos descritivos/técnicos/SEO. Ex: "jogo Bate online", "regras do Bate", "vem jogar Bate".
2. **Nome do produto/marca é "Batinho"** — use em hero, título, domínio, copy de marketing, nome do app, persona.
3. **Batinho é sempre singular** — nunca "Os Batinhos". Pra falar dos personagens visuais nas cartas, use "as cartas do Batinho" ou "o baralho do Batinho".
4. **Batinho não faz ações do jogo no copy** — quem memoriza/espia/troca/corta é o jogador (imperativo direto). Batinho aparece, ilustra, recebe, hospeda — não joga.
5. **Cartas = Batinho em situações diferentes**, não personagens independentes — continuam sendo "carta OURO", "carta OLHADINHA". Não viram "Batinho-Ouro" ou "Batinho-Olhadinha" como entidades nomeadas.

---

## Mudanças no código

### `src/components/lobby/Hero.tsx` (linhas 45-49)

**De:**
```tsx
<p className="font-body text-sm sm:text-base md:text-lg text-bate-ink/80 mt-3 sm:mt-4 max-w-lg font-medium leading-snug">
  Os Batinhos são malandros: <span className="font-bold text-bate-red">memorizam</span> as cartas deles, <span className="font-bold text-bate-red">espiam</span> as suas, e <span className="font-bold text-bate-red">cortam</span> na hora exata.
  <br className="hidden sm:block" />
  Tu vai cair nessa?
</p>
```

**Pra:**
```tsx
<p className="font-body text-sm sm:text-base md:text-lg text-bate-ink/80 mt-3 sm:mt-4 max-w-lg font-medium leading-snug">
  <span className="font-bold text-bate-red">Memorize</span> as suas, <span className="font-bold text-bate-red">espie</span> as deles, <span className="font-bold text-bate-red">troque</span> o que precisa e <span className="font-bold text-bate-red">corte</span> na hora exata.
  <br className="hidden sm:block" />
  Menor placar leva. Tu cai nessa?
</p>
```

Mudanças: plural antropomorfizado → imperativo direto pro jogador; adiciona "Menor placar leva" (regra-objetivo do jogo) e o verbo "troque" que faltava (TROCA é uma das ações do baralho).

### `src/app/layout.tsx` (linha 31)

**Meta description, de:**
```
'Os Batinhos são malandros: memorizam, espiam, trocam e cortam. Menor placar leva. 2-4 jogadores, grátis.'
```

**Pra:**
```
'Memorize, espie, troque, corte. Menor placar leva. Bate online, 2-4 jogadores, grátis.'
```

Mantém "Bate" aqui de propósito — SEO de quem busca "jogo Bate online" ou "Cabo online".

### `src/app/layout.tsx` (linha 40)

**OpenGraph description, de:**
```
'Memorize, espie, troque, corte. Menor placar leva.'
```

**Pra:**
```
'Bate online: memorize, espie, troque, corte. Menor placar leva.'
```

---

## Mudanças nos docs

### `docs/brand-brief.md` (linha 9)

**De:**
> **Bate** é uma versão online multiplayer de **Cabo** (também conhecido como Pablo, Cambio) — o jogo de cartas brasileiro de mesa onde o objetivo é ter a **menor pontuação**.

**Pra:**
> **Batinho** é uma versão online multiplayer de **Bate** (releitura brasileira de **Cabo / Pablo / Cambio** — o jogo de cartas de mesa onde o objetivo é ter a **menor pontuação**). "Bate" é o nome da mecânica (o que você joga); "Batinho" é o nome do produto e do mascote singular que ilustra ele.

### `docs/brand-brief.md` (linha 62, seção "As 5 cartas especiais como mascotes recorrentes")

**De:**
> Não precisa criar mascote humano/animal. **As cartas são o branding.**

**Pra:**
> **Batinho (esquilinho chibi, singular) é o protagonista visual** — aparece como mascote único no hero, como ilustração nas 14 cartas do baralho (cada carta mostra o Batinho em uma situação diferente: segurando moeda na carta OURO, espiando na carta OLHADINHA, etc. — as cartas continuam se chamando "OURO", "OLHADINHA" etc., não viram entidades nomeadas), e como NPC nas arenas (ex: bartender no Boteco). As cartas especiais (OURO / PRATA / OLHADINHA / ESPIADINHA / TROCA) continuam sendo as estrelas das interações de jogo, mas são extensões visuais do mascote, não substitutos dele.

### `bate-backend/README.md` (linha 3)

**De:**
> Servidor Node.js + Socket.io pro **Bate** — jogo de cartas multiplayer brasileiro de memorização e dedução, releitura da família clássica "Golf" (domínio público) e de jogos como Rat-a-Tat Cat (Gamewright, 1995). Identidade visual, mascote Batinho, nomes de ações e sistema de pontuação são originais.

**Pra:**
> Servidor Node.js + Socket.io do **Batinho** — produto online multiplayer baseado no jogo **Bate** (releitura brasileira da família "Golf"/Cabo, com inspiração em Rat-a-Tat Cat — Gamewright, 1995). Identidade visual, mascote (esquilinho chibi singular), nomes de ações e sistema de pontuação são originais.

### `bate-frontend/README.md` (seção "Sobre o jogo", abertura)

**De:**
> Bate é uma releitura brasileira de jogos clássicos da família "Golf" — uma tradição de jogos de cartas de pontuação mínima que remonta às décadas de 1960-70, popularizada em jogos como **Golf** (domínio público) e **Rat-a-Tat Cat** (Gamewright, 1995). Cada jogador recebe 4 cartas viradas para baixo e tenta terminar a rodada com a menor pontuação possível, usando ações de espiar, trocar e cortar.
>
> A identidade visual, o mascote **Batinho**, os nomes das ações (OLHADINHA, ESPIADINHA, TROCA, PRATA, OURO) e o sistema de pontuação são originais desta implementação.

**Pra:**
> **Batinho** é a versão online multiplayer do **Bate** — releitura brasileira de jogos clássicos da família "Golf", tradição de cartas de pontuação mínima que remonta às décadas de 1960-70, popularizada em **Golf** (domínio público) e **Rat-a-Tat Cat** (Gamewright, 1995). Cada jogador recebe 4 cartas viradas para baixo e tenta terminar a rodada com a menor pontuação possível, usando ações de espiar, trocar e cortar.
>
> "Bate" é o nome da mecânica (o que você joga); "Batinho" é o nome do produto e do mascote singular (esquilinho chibi). A identidade visual, os nomes das ações (OLHADINHA, ESPIADINHA, TROCA, PRATA, OURO) e o sistema de pontuação são originais desta implementação.

---

## Critérios de sucesso

1. **Zero ocorrências de "Os Batinhos"** (plural) no código-fonte do frontend — `grep -r "Os Batinhos" src/` retorna vazio.
2. **Zero ocorrências de Batinho antropomorfizado fazendo ações do jogo** — Batinho não "memoriza", não "espia", não "corta" em nenhum copy.
3. **Domínio, título, H1, READMEs e brand-brief contam a mesma história** — "Bate é o jogo, Batinho é o produto/mascote singular".
4. **Linha 62 do brand-brief não contradiz mais a existência do mascote** — não diz mais "não precisa criar mascote", reflete que Batinho É o protagonista visual.
5. **READMEs explicitamente diferenciam Bate (jogo) de Batinho (produto)** — leitor novo entende a separação na primeira parágrafo.

---

## Fora de escopo (revisitar depois, talvez)

- **Renomear repos pra `batinho-frontend`/`batinho-backend`** — fica como decisão futura quando/se valer a pena (envolve Railway/Vercel/GitHub Actions/redirects).
- **Criar um GLOSSARY.md** com vocabulário do produto (Bate, Batinho, OLHADINHA, ESPIADINHA, etc.) — útil se o time crescer, hoje é desnecessário.
- **Adicionar tagline curta da marca** (ex: "Batinho — Bate online com os amigos") — pode entrar em OG image / favicon copy depois.

---

## Decisões registradas (origem do spec)

- **2026-05-26 (Matheus)** — Bate é o jogo (mecânica), Batinho é a marca/produto (persona singular). Duas camadas intencionais.
- **2026-05-26 (Matheus)** — Batinho é UM personagem singular, nunca pluralizado em copy.
- **2026-05-26 (Matheus)** — Hero adota framing "mascote silencioso": Batinho aparece como ilustração ao lado do H1, body fala direto pro jogador no imperativo, sem antropomorfizar o mascote.
