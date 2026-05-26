# Bate vs Batinho — Brand Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar todas as mudanças de copy e docs definidas em `docs/superpowers/specs/2026-05-26-bate-batinho-brand-identity-design.md` — separar "Bate" (jogo) de "Batinho" (marca singular), eliminar pluralização antropomorfizada, e alinhar docs internos com a realidade pública.

**Architecture:** Mudanças de copy/doc em dois repos (bate-frontend e bate-backend). Sem nova lógica, sem testes unitários — verificação é por grep e checagem visual do dev server. Cada arquivo modificado vira um commit isolado pra facilitar revisão.

**Tech Stack:** Next.js 15 + React 19 (frontend), Markdown (docs), Node + Socket.io (backend). Editing tools: Edit, Bash (grep para verificação).

---

## Pré-requisitos

- Repo `bate-frontend` em `/Users/matheusdev/projects/bate-frontend` com branch `spec/bate-batinho-identity` já criado e contendo o spec em `docs/superpowers/specs/2026-05-26-bate-batinho-brand-identity-design.md` (commit `300211f`).
- Repo `bate-backend` em `/Users/matheusdev/projects/bate-backend`, atualmente em `main`, working tree limpo.
- Implementação no frontend continua em `spec/bate-batinho-identity`. Implementação no backend usa branch novo `feat/bate-batinho-identity` derivado de `main`.

---

### Task 1: Garantir branch e estado do frontend

**Files:**
- Nenhuma modificação. Só validação de branch.

- [ ] **Step 1: Switch to spec branch e checar estado**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git checkout spec/bate-batinho-identity
git status
```

Expected: `On branch spec/bate-batinho-identity` + nada modificado, exceto possíveis untracked (`.serena/`, `public/animations/`, `src/app/test-lottie/`) que não importam.

- [ ] **Step 2: Confirmar que o spec doc está commitado**

Run:
```bash
ls docs/superpowers/specs/2026-05-26-bate-batinho-brand-identity-design.md && git log -1 --format='%h %s' docs/superpowers/specs/2026-05-26-bate-batinho-brand-identity-design.md
```

Expected: arquivo existe + log mostra commit `300211f add bate-batinho brand identity spec`.

---

### Task 2: Atualizar copy do Hero

**Files:**
- Modify: `src/components/lobby/Hero.tsx:45-49`

- [ ] **Step 1: Confirmar estado atual com grep**

Run:
```bash
grep -n "Os Batinhos são malandros" src/components/lobby/Hero.tsx
```

Expected: linha 46 retornada contendo "Os Batinhos são malandros".

- [ ] **Step 2: Aplicar Edit**

Substituir o `<p>` inteiro (linhas 45-49) usando Edit tool:

old_string:
```tsx
      <p className="font-body text-sm sm:text-base md:text-lg text-bate-ink/80 mt-3 sm:mt-4 max-w-lg font-medium leading-snug">
        Os Batinhos são malandros: <span className="font-bold text-bate-red">memorizam</span> as cartas deles, <span className="font-bold text-bate-red">espiam</span> as suas, e <span className="font-bold text-bate-red">cortam</span> na hora exata.
        <br className="hidden sm:block" />
        Tu vai cair nessa?
      </p>
```

new_string:
```tsx
      <p className="font-body text-sm sm:text-base md:text-lg text-bate-ink/80 mt-3 sm:mt-4 max-w-lg font-medium leading-snug">
        <span className="font-bold text-bate-red">Memorize</span> as suas, <span className="font-bold text-bate-red">espie</span> as deles, <span className="font-bold text-bate-red">troque</span> o que precisa e <span className="font-bold text-bate-red">corte</span> na hora exata.
        <br className="hidden sm:block" />
        Menor placar leva. Tu cai nessa?
      </p>
```

- [ ] **Step 3: Verificar que copy antigo sumiu e novo apareceu**

Run:
```bash
grep -n "Os Batinhos" src/components/lobby/Hero.tsx; echo "---"; grep -n "Memorize as suas" src/components/lobby/Hero.tsx
```

Expected: primeiro grep retorna vazio (exit 1). Segundo grep retorna linha 46 com "Memorize as suas".

- [ ] **Step 4: Lint/typecheck do arquivo modificado**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json 2>&1 | grep -E "Hero.tsx" || echo "no Hero.tsx errors"
```

Expected: `no Hero.tsx errors`.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/lobby/Hero.tsx
git commit -m "$(cat <<'EOF'
rewrite Hero body copy to address player directly

Remove plural anthropomorphization ("Os Batinhos são malandros") per the
brand identity spec — player actions stay in imperative, Batinho stays
silent visual mascot. Add the missing "troque" verb and the "Menor placar
leva" objective line.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: commit criado com hash novo, working tree limpo.

---

### Task 3: Atualizar meta description e OpenGraph do layout

**Files:**
- Modify: `src/app/layout.tsx:31` e `src/app/layout.tsx:40`

- [ ] **Step 1: Confirmar estado atual**

Run:
```bash
grep -n "Os Batinhos\|Memorize, espie, troque, corte" src/app/layout.tsx
```

Expected: linha 31 com "Os Batinhos são malandros..." e linha 40 com "Memorize, espie, troque, corte. Menor placar leva.".

- [ ] **Step 2: Aplicar Edit na meta description (linha 31)**

old_string:
```tsx
  description: 'Os Batinhos são malandros: memorizam, espiam, trocam e cortam. Menor placar leva. 2-4 jogadores, grátis.',
```

new_string:
```tsx
  description: 'Memorize, espie, troque, corte. Menor placar leva. Bate online, 2-4 jogadores, grátis.',
```

- [ ] **Step 3: Aplicar Edit na OpenGraph description (linha 40)**

old_string:
```tsx
    description: 'Memorize, espie, troque, corte. Menor placar leva.',
```

new_string:
```tsx
    description: 'Bate online: memorize, espie, troque, corte. Menor placar leva.',
```

- [ ] **Step 4: Verificar resultado**

Run:
```bash
grep -n "Os Batinhos" src/app/layout.tsx; echo "---"; grep -n "Bate online" src/app/layout.tsx
```

Expected: primeiro grep retorna vazio (exit 1). Segundo grep retorna duas linhas — uma com "Bate online, 2-4 jogadores" (meta) e outra com "Bate online: memorize, espie" (OG).

- [ ] **Step 5: Typecheck**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json 2>&1 | grep -E "layout.tsx" || echo "no layout.tsx errors"
```

Expected: `no layout.tsx errors`.

- [ ] **Step 6: Commit**

Run:
```bash
git add src/app/layout.tsx
git commit -m "$(cat <<'EOF'
update meta and OG descriptions per brand identity spec

Drop plural "Os Batinhos são malandros" copy. Keep "Bate" in SEO/meta
contexts (search intent: "jogo Bate online", "Cabo online"); Batinho
stays the product/brand name in title and H1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Atualizar brand-brief.md

**Files:**
- Modify: `docs/brand-brief.md:9` e `docs/brand-brief.md:62`

- [ ] **Step 1: Confirmar estado atual**

Run:
```bash
sed -n '9p;62p' docs/brand-brief.md
```

Expected: linha 9 começa com "**Bate** é uma versão online multiplayer de **Cabo**..." e linha 62 é "Não precisa criar mascote humano/animal. **As cartas são o branding.**".

- [ ] **Step 2: Edit linha 9 — separar Bate de Batinho**

old_string:
```
**Bate** é uma versão online multiplayer de **Cabo** (também conhecido como Pablo, Cambio) — o jogo de cartas brasileiro de mesa onde o objetivo é ter a **menor pontuação**. Reskinning total da nomenclatura clássica: dez vira **OLHADINHA**, valete vira **ESPIADINHA**, dama vira **TROCA**, rei vira **PRATA (−3 pts)**, joker vira **OURO (−6 pts)**.
```

new_string:
```
**Batinho** é uma versão online multiplayer de **Bate** (releitura brasileira de **Cabo / Pablo / Cambio** — o jogo de cartas de mesa onde o objetivo é ter a **menor pontuação**). "Bate" é o nome da mecânica (o que você joga); "Batinho" é o nome do produto e do mascote singular que ilustra ele. Reskinning total da nomenclatura clássica: dez vira **OLHADINHA**, valete vira **ESPIADINHA**, dama vira **TROCA**, rei vira **PRATA (−3 pts)**, joker vira **OURO (−6 pts)**.
```

- [ ] **Step 3: Edit linha 62 — eliminar contradição do mascote**

old_string:
```
Não precisa criar mascote humano/animal. **As cartas são o branding.**
```

new_string:
```
**Batinho (esquilinho chibi, singular) é o protagonista visual** — aparece como mascote único no hero, como ilustração nas 14 cartas do baralho (cada carta mostra o Batinho em uma situação diferente: segurando moeda na carta OURO, espiando na carta OLHADINHA, etc. — as cartas continuam se chamando "OURO", "OLHADINHA" etc., não viram entidades nomeadas), e como NPC nas arenas (ex: bartender no Boteco). As cartas especiais (OURO / PRATA / OLHADINHA / ESPIADINHA / TROCA) continuam sendo as estrelas das interações de jogo, mas são extensões visuais do mascote, não substitutos dele.
```

- [ ] **Step 4: Verificar resultado**

Run:
```bash
grep -n "Não precisa criar mascote" docs/brand-brief.md; echo "---"; grep -cn "Batinho" docs/brand-brief.md
```

Expected: primeiro grep retorna vazio (exit 1, frase eliminada). Segundo retorna número ≥ 2 (Batinho agora aparece pelo menos no início e na seção do mascote).

- [ ] **Step 5: Commit**

Run:
```bash
git add docs/brand-brief.md
git commit -m "$(cat <<'EOF'
realign brand-brief with Bate vs Batinho two-layer model

Rewrite intro (line 9) to explicitly separate "Bate" (mechanic) from
"Batinho" (product/mascot). Replace the "no mascot needed, cards are
branding" line (62) with the actual current state: Batinho is the
singular visual protagonist, cards are extensions of him.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Atualizar README do bate-frontend

**Files:**
- Modify: `README.md` linha 3 (descrição do pacote) E seção "Sobre o jogo" (linhas 9 e 11)

> Nota: a descrição da linha 3 ("Frontend Next.js do **Bate** — ...") tem o mesmo problema da linha 3 do backend README e é incluída aqui pra simetria. O spec define o princípio "Bate = mecânica, Batinho = produto" sem enumerar toda ocorrência — o plano aplica exaustivamente onde detecta o padrão.

- [ ] **Step 1: Confirmar estado atual**

Run:
```bash
grep -n "Frontend Next.js do \*\*Bate\*\*\|Bate é uma releitura\|mascote \*\*Batinho\*\*" README.md
```

Expected: 3 linhas retornadas — linha 3 ("Frontend Next.js do **Bate**..."), linha 9 ("Bate é uma releitura..."), linha 11 ("o mascote **Batinho**...").

- [ ] **Step 2: Edit da descrição do pacote (linha 3)**

old_string:
```
Frontend Next.js do **Bate** — jogo de cartas multiplayer brasileiro de memorização e dedução. Conecta via Socket.io ao backend separado.
```

new_string:
```
Frontend Next.js do **Batinho** — produto online multiplayer baseado no jogo **Bate** (releitura brasileira de Cabo/Pablo/Cambio, família "Golf"). Conecta via Socket.io ao backend separado.
```

- [ ] **Step 3: Edit do parágrafo inteiro da seção "Sobre o jogo"**

old_string:
```
Bate é uma releitura brasileira de jogos clássicos da família "Golf" — uma tradição de jogos de cartas de pontuação mínima que remonta às décadas de 1960-70, popularizada em jogos como **Golf** (domínio público) e **Rat-a-Tat Cat** (Gamewright, 1995). Cada jogador recebe 4 cartas viradas para baixo e tenta terminar a rodada com a menor pontuação possível, usando ações de espiar, trocar e cortar.

A identidade visual, o mascote **Batinho**, os nomes das ações (OLHADINHA, ESPIADINHA, TROCA, PRATA, OURO) e o sistema de pontuação são originais desta implementação.
```

new_string:
```
**Batinho** é a versão online multiplayer do **Bate** — releitura brasileira de jogos clássicos da família "Golf", tradição de cartas de pontuação mínima que remonta às décadas de 1960-70, popularizada em **Golf** (domínio público) e **Rat-a-Tat Cat** (Gamewright, 1995). Cada jogador recebe 4 cartas viradas para baixo e tenta terminar a rodada com a menor pontuação possível, usando ações de espiar, trocar e cortar.

"Bate" é o nome da mecânica (o que você joga); "Batinho" é o nome do produto e do mascote singular (esquilinho chibi). A identidade visual, os nomes das ações (OLHADINHA, ESPIADINHA, TROCA, PRATA, OURO) e o sistema de pontuação são originais desta implementação.
```

- [ ] **Step 4: Verificar resultado**

Run:
```bash
grep -n "Frontend Next.js do \*\*Bate\*\* —\|Bate é uma releitura" README.md && echo "FAIL: old phrasing still present" || echo "PASS: old phrasing removed"
echo "---"
grep -n "Frontend Next.js do \*\*Batinho\*\*\|Batinho.*é a versão online" README.md
```

Expected: primeiro bloco mostra `PASS: old phrasing removed`. Segundo bloco mostra 2 linhas — linha 3 com "Frontend Next.js do **Batinho** — produto online..." e linha 9 com "**Batinho** é a versão online multiplayer do **Bate**".

- [ ] **Step 5: Commit (cobre as duas edições do README num único commit)**

Run:
```bash
git add README.md
git commit -m "$(cat <<'EOF'
clarify Bate vs Batinho separation in frontend README

Update both the package description (line 3) and the "Sobre o jogo" section
to open with "Batinho é a versão online multiplayer do Bate". Mirrors the
treatment applied to bate-backend README — Bate is the mechanic, Batinho
is the product/mascot.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Atualizar README do bate-backend (repo separado)

**Files:**
- Modify: `/Users/matheusdev/projects/bate-backend/README.md:3`

⚠️ Este é um repo Git diferente. Tarefa começa com troca de diretório e criação de branch novo a partir de `main`.

- [ ] **Step 1: Trocar pro repo backend e criar branch**

Run:
```bash
cd /Users/matheusdev/projects/bate-backend
git status
git checkout -b feat/bate-batinho-identity
```

Expected: status mostra working tree limpo + switched to new branch `feat/bate-batinho-identity` baseado em `main`.

- [ ] **Step 2: Confirmar estado atual do README**

Run:
```bash
grep -n "Servidor Node.js + Socket.io pro \*\*Bate\*\*" README.md
```

Expected: linha 3 retornada.

- [ ] **Step 3: Edit do parágrafo de descrição**

old_string:
```
Servidor Node.js + Socket.io pro **Bate** — jogo de cartas multiplayer brasileiro de memorização e dedução, releitura da família clássica "Golf" (domínio público) e de jogos como Rat-a-Tat Cat (Gamewright, 1995). Identidade visual, mascote Batinho, nomes de ações e sistema de pontuação são originais.
```

new_string:
```
Servidor Node.js + Socket.io do **Batinho** — produto online multiplayer baseado no jogo **Bate** (releitura brasileira da família "Golf"/Cabo, com inspiração em Rat-a-Tat Cat — Gamewright, 1995). Identidade visual, mascote (esquilinho chibi singular), nomes de ações e sistema de pontuação são originais.
```

- [ ] **Step 4: Verificar resultado**

Run:
```bash
grep -n "Servidor Node.js + Socket.io do \*\*Batinho\*\*" README.md; echo "---"; grep -n "pro \*\*Bate\*\*" README.md
```

Expected: primeiro grep retorna linha 3 com nova descrição. Segundo retorna vazio.

- [ ] **Step 5: Commit no backend**

Run:
```bash
git add README.md
git commit -m "$(cat <<'EOF'
clarify Bate vs Batinho separation in backend README

Mirror the change made in the frontend repo: this is the server for the
"Batinho" product, which is based on the "Bate" game mechanic. Singular
mascot (esquilinho chibi).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 6: Voltar pro repo frontend pra checagem final**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git branch --show-current
```

Expected: `spec/bate-batinho-identity`.

---

### Task 7: Verificar todos os critérios de sucesso do spec

**Files:**
- Nenhuma modificação. Só verificação.

- [ ] **Step 1: Critério 1 — zero "Os Batinhos" no frontend src**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
grep -r "Os Batinhos" src/ || echo "PASS: no plural anthropomorphization found"
```

Expected: `PASS: no plural anthropomorphization found`.

- [ ] **Step 2: Critério 2 — Batinho não aparece fazendo ações de jogo**

Run:
```bash
grep -rE "Batinho (memoriza|espia|troca|corta|memorizam|espiam|trocam|cortam)" src/ docs/ README.md || echo "PASS: Batinho never anthropomorphized doing game actions"
```

Expected: `PASS: Batinho never anthropomorphized doing game actions`.

- [ ] **Step 3: Critério 3 — domínio/título/H1/READMEs/brand-brief contam a mesma história**

Run:
```bash
echo "--- Hero H1 ---"
grep -A1 "<h1" src/components/lobby/Hero.tsx | head -5
echo "--- Page title ---"
grep "title: 'Batinho'" src/app/layout.tsx
echo "--- Brand brief opening ---"
sed -n '9p' docs/brand-brief.md
echo "--- Frontend README opening of game section ---"
grep "Batinho.*é a versão online" README.md
echo "--- Backend README opening ---"
grep "Servidor Node.js + Socket.io do" /Users/matheusdev/projects/bate-backend/README.md
```

Expected: cada bloco mostra "Batinho" como nome de produto e "Bate" como nome de mecânica, consistentemente.

- [ ] **Step 4: Critério 4 — linha 62 do brand-brief não contradiz mais o mascote**

Run:
```bash
grep -n "Não precisa criar mascote" docs/brand-brief.md && echo "FAIL: contradiction still present" || echo "PASS: contradiction removed"
```

Expected: `PASS: contradiction removed`.

- [ ] **Step 5: Critério 5 — READMEs diferenciam Bate de Batinho no primeiro parágrafo**

Run:
```bash
echo "--- Frontend ---"
head -10 README.md | grep -E "Bate|Batinho"
echo "--- Backend ---"
head -5 /Users/matheusdev/projects/bate-backend/README.md | grep -E "Bate|Batinho"
```

Expected: ambos READMEs mencionam "Batinho" e "Bate" nos primeiros parágrafos com a separação clara.

- [ ] **Step 6: Build full check do frontend**

Run:
```bash
pnpm tsc --noEmit -p tsconfig.json
```

Expected: exit 0 (zero errors).

- [ ] **Step 7 (opcional): Verificação visual no dev server**

Run em terminal separado:
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 pnpm dev
```

Em outro terminal: abrir http://localhost:3000 no browser. Conferir visualmente que:
- H1 do hero mostra "BATINHO" (mantido)
- Body do hero mostra "Memorize as suas, espie as deles, troque o que precisa e corte na hora exata. Menor placar leva. Tu cai nessa?"
- Não tem "Os Batinhos" em nenhum lugar visível

Encerrar dev server depois (Ctrl+C).

---

### Task 8: Resumo final e estado dos branches

**Files:**
- Nenhuma modificação.

- [ ] **Step 1: Listar commits do frontend**

Run:
```bash
cd /Users/matheusdev/projects/bate-frontend
git log main..spec/bate-batinho-identity --oneline
```

Expected: 5 commits — `300211f add bate-batinho brand identity spec` + 4 commits de implementação (Hero, layout, brand-brief, README).

- [ ] **Step 2: Listar commits do backend**

Run:
```bash
cd /Users/matheusdev/projects/bate-backend
git log main..feat/bate-batinho-identity --oneline
```

Expected: 1 commit — `clarify Bate vs Batinho separation in backend README`.

- [ ] **Step 3: Relatar resultado e próximos passos pro usuário**

Reportar (não commitar ainda):
- Branch frontend: `spec/bate-batinho-identity` com 5 commits prontos
- Branch backend: `feat/bate-batinho-identity` com 1 commit pronto
- Próximos passos sob decisão do usuário: abrir PR pra `main` em ambos os repos (com `gh pr create`) ou push das branches sem PR (`git push -u origin <branch>`). Não executar `git push` sem pedir confirmação explícita.

---

## Resumo de arquivos modificados

| Repo | Arquivo | Tipo | Tarefa |
|---|---|---|---|
| bate-frontend | `src/components/lobby/Hero.tsx` | copy | Task 2 |
| bate-frontend | `src/app/layout.tsx` | metadata | Task 3 |
| bate-frontend | `docs/brand-brief.md` | doc interno | Task 4 |
| bate-frontend | `README.md` | doc público | Task 5 |
| bate-backend | `README.md` | doc público | Task 6 |

## Out of scope (não fazer neste plano)

- Renomear repos `bate-*` pra `batinho-*` — decisão futura.
- Criar GLOSSARY.md.
- Adicionar tagline / mexer em favicon / OG image.
- Push das branches ou abertura de PR — usuário decide depois.
- Reescrever specs históricos (`festa-br-redesign`, `boteco-vivo`, etc.) — snapshots do passado.
