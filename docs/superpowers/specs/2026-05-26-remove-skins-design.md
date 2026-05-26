# Remove Skins System — Design Spec

> Remoção total do sistema de skins (UI, API, DB schema, runtime state) dos dois repos `bate-frontend` e `bate-backend`. Decisão tomada após realizar que o skin só renderiza num avatar de 30px enquanto todos os momentos visuais grandes (BateAnnouncement, MascotOverlay, RoundEndScreen, etc.) usam expressões event-driven e ignoram o skin escolhido — feature não entrega valor proporcional à complexidade.

---

## Contexto

O sistema de skins existe end-to-end:
- **Frontend:** `SkinPicker` modal no lobby, `skinImage()` em `lib/mascot.ts`, e display em `Nameplate`, `WaitingRoom`, `OpponentArea`.
- **Backend:** entidades `Skin` + `UserSkin`, módulo `db/skins.ts`, seed `seed-skins.ts` com 6 defaults, endpoints HTTP `/me/skins` e `/me/equip-skin`, granting automático no signup, coluna `equippedSkin` na tabela `users`.
- **Estado de partida:** `PlayerState.skin` em `server/game/state.ts`, propagado via `JoinInput` no Redis/memory storage.

Mapeamento de uso revelou que `skinImage(player.skin)` é chamado **apenas em 3 lugares pequenos** — todos avatarzinhos de 28-36px (Nameplate, WaitingRoom, OpponentArea). Os 12+ lugares grandes do mascote (BateAnnouncement, MascotOverlay com 5 triggers, RoundEndScreen, MatchEndScreen, Tutorial, Bartender da arena, Hero do lobby, cartas do baralho) usam `MASCOT.X` direto — escolhendo expressão pelo EVENTO, ignorando completamente o skin do jogador.

Resultado: o jogador pode passar 30 segundos no `SkinPicker` escolhendo "Batinho Detetive", mas durante a partida só vê isso num círculo de 28px ao lado do nome. Todos os momentos dramáticos (BATE!, peek, snap, vitória) usam o Batinho universal.

Brainstorm sobre como aumentar o valor das skins ofereceu 4 caminhos: reframear como customização leve (bordas, cores, sons), expandir pra todas as 16 expressões (96 ilustrações por família de skin), hybrid pose-dominante (com problemas emocionais), ou **remover do produto** — escolhido como direção.

Conecta com o spec [bate-batinho brand identity](./2026-05-26-bate-batinho-brand-identity-design.md) que estabeleceu Batinho como mascote singular: skins fragmentavam essa singularidade ao permitir múltiplas "personas" sem integração visual coerente.

---

## Objetivo

Remover completamente o sistema de skins de ambos os repos (frontend + backend), incluindo migration que dropa schema. Manter as 16 expressões do mascote (`MASCOT` em `lib/mascot.ts`) e todos os assets em `public/batinho/*.webp` — eles continuam sendo usados event-driven pelo MascotOverlay e pelos sprites das cartas.

---

## Escopo

### Dentro

- Deletar `SkinPicker.tsx`, `skins-api.ts` no frontend
- Deletar entidades `Skin` + `UserSkin`, módulos `skins.ts` + `seed-skins.ts` no backend
- Remover endpoints HTTP `/me/skins` + `/me/equip-skin` do backend
- Remover campo `skin` do tipo `Player` em `types/shared.ts` (cópias separadas no frontend e backend)
- Remover prop/uso de skin em `Nameplate`, `OpponentArea`, `PlayerHand2D`, `WaitingRoom` — substituir display por `<Avatar>` (componente que já existe e era o fallback quando skin era null)
- Remover botão do SkinPicker da chrome do lobby (`page.tsx`)
- Remover `SKIN_TO_MASCOT` + função `skinImage()` em `lib/mascot.ts`
- Remover propagação de `skin` no game state (`server/game/state.ts`, storage `redis.ts`/`memory.ts`, `JoinInput`)
- Remover `equippedSkin`, `grantSkin`, `getUserSkins`, `equipSkin` no backend `db/users.ts`
- Remover seed inicial de skins (`seed.ts` + `index.ts` startup)
- Criar nova migration TypeORM que dropa tabelas `skins`, `user_skins`, e coluna `equippedSkin` de `users` — irreversível (rollback via DB snapshot)

### Fora (não mexer)

- **`MASCOT` object em `lib/mascot.ts`** — as 16 expressões continuam, são usadas event-driven pelo MascotOverlay e pelos elementos visuais
- **Assets em `public/batinho/*.webp`** — não deletar; alguns são usados também pelas cartas do baralho (ex: `batinho-ouro.webp` ilustra a carta OURO)
- **MascotOverlay e seus 5 triggers** (peek-own, peek-other, snap, swap, tempo-acabando) — sistema event-driven independente do skin
- **`equippedDeck` + `equippedArena`** — colunas e sistemas separados com a mesma arquitetura, mas fora desse escopo. DeckPicker e ArenaPicker continuam funcionando.
- **Tutorial.tsx, Hero.tsx, BateAnnouncement.tsx, RoundEndScreen, MatchEndScreen, Bartender Boteco** — tudo continua usando `MASCOT.X` direto, intacto
- **Coins/economia** — sistema de moedas (`priceCoins`) era usado pra desbloquear skins; pode ser removido se não houver outro uso, mas é fora desse escopo

### Decisões registradas

- **2026-05-26 (Matheus)** — Remover skins. Razão: skin do jogador só impacta avatar de 30px; momentos visuais grandes usam expressões event-driven e ignoram o skin. Custo de manter > valor entregue.
- **2026-05-26 (Matheus)** — Não migrar dados. Migration faz `DROP` direto. Rollback exige restaurar snapshot do Postgres do Railway.

---

## Mudanças no frontend

### Deletar arquivos inteiros

- `src/components/lobby/SkinPicker.tsx`
- `src/lib/skins-api.ts`

### Editar arquivos

**`src/types/shared.ts`** — remover campo `skin` do tipo `Player` (2 ocorrências, conferir com grep).

**`src/lib/mascot.ts`** — remover constante `SKIN_TO_MASCOT` (linhas ~22-29) e função `skinImage()` (linhas ~31-34). Manter o `MASCOT` object e a função `getMascot()`.

**`src/app/page.tsx`** — remover:
- Import de `SkinPicker`
- State `showSkins` e setter
- Botão `<button onClick={() => setShowSkins(true)} title="Skins">` na chrome do lobby (com ícone `Shirt`)
- Render do `<SkinPicker open={showSkins} onClose={...} />` no final do JSX
- Import do ícone `Shirt` (`lucide-react`) se não for usado em outro lugar

**`src/components/room2d/Nameplate.tsx`** — remover prop `skin?: string | null`, remover ternário `{skin ? <img...> : <Avatar...>}`, sempre renderizar `<Avatar name={name} size={28} />` (Avatar componente já existe e já era o fallback).

**`src/components/room2d/OpponentArea.tsx`** — remover import de `skinImage`, remover `<img src={skinImage(player.skin)}>`, substituir por `<Avatar name={player.name} size={28} />`. Remover `skin={player.skin}` da chamada do Nameplate (já que Nameplate não aceita mais).

**`src/components/room2d/PlayerHand2D.tsx`** — remover `skin={player.skin}` da chamada do Nameplate.

**`src/components/room/WaitingRoom.tsx`** — remover import de `skinImage`, remover `<img src={skinImage(p.skin)}>`, substituir por `<Avatar name={p.name} size={28} />`.

---

## Mudanças no backend

### Deletar arquivos inteiros

- `src/server/db/skins.ts`
- `src/server/db/seed-skins.ts`
- `src/server/db/entities/Skin.ts`
- `src/server/db/entities/UserSkin.ts`

### Editar arquivos

**`src/types/shared.ts`** — remover campo `skin` do tipo `Player`.

**`src/server/storage/types.ts`** — remover `skin?: string` do `JoinInput`.

**`src/server/game/state.ts`** — remover `skin?: string` do PlayerState e remover `skin: input.skin ?? 'default'` do construtor.

**`src/server/storage/memory.ts`** e **`src/server/storage/redis.ts`** — remover `skin: input.skin ?? 'default'` da função de join.

**`src/server/db/users.ts`** — remover:
- Imports de `Skin` e `UserSkin`
- `equippedSkin: 'default'` do `repo.create(...)` inicial
- Função `grantSkin()`
- Função `getUserSkins()`
- Função `equipSkin()`
- Loop `for (const skin of defaultSkins) await grantSkin(...)` que granteia defaults no signup
- Query `AppDataSource.getRepository(Skin).find(...)` no setup
- Manter `equippedDeck` e `equippedArena` intactos

**`src/server/db/seed.ts`** — remover import e chamada de `seedDefaultSkins`.

**`src/server/index.ts`** — remover:
- Imports `seedDefaultSkins`, `backfillDefaultSkinsToAllUsers` (linha ~15)
- Imports `listSkinsForUser`, `equipSkinForUser` (linha ~18)
- Handler do endpoint `GET /me/skins` (linhas ~100-110)
- Handler do endpoint `POST /me/equip-skin` (linhas ~191-213)
- Bloco `const seed = await seedDefaultSkins() ... backfillDefaultSkinsToAllUsers()` no startup (linhas ~261-266)
- Mensagem de log que menciona skins (linha ~289)

### Nova migration

Criar `src/server/db/migrations/1779470000000-RemoveSkins.ts` (ou regenerar timestamp com `Date.now()` no momento da implementação — qualquer número maior que `1748160000000` do init migration funciona pra ordering):

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveSkins1779470000000 implements MigrationInterface {
  name = 'RemoveSkins1779470000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_skins_unique"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_skins"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "skins"`)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "equippedSkin"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error('RemoveSkins migration is not reversible — restore from snapshot to roll back')
  }
}
```

Se regenerar o timestamp, garantir que o nome do arquivo, o nome da classe e o `name` da classe usem o mesmo número.

---

## Ordem de deploy

1. **PR-frontend (`feat/remove-skins` no bate-frontend)** — todas as mudanças de frontend. Merge + Vercel deploy automático.
2. **Janela de propagação:** esperar ~10-30min pra clientes velhos com bundle cacheado pararem de chamar `/me/skins`. Endpoints do backend ainda existem nessa janela e respondem normalmente.
3. **Pré-PR-backend:** garantir snapshot do Postgres do Railway (dashboard → Database → Snapshot).
4. **PR-backend (`feat/remove-skins` no bate-backend)** — todas as mudanças de backend + nova migration. Merge + Railway deploy automático (roda `pnpm migration:run` no boot, ou ferramenta equivalente).
5. **Pós-deploy:** confirmar que migration rodou (`SELECT * FROM users LIMIT 1` não tem coluna `equippedSkin`; `SELECT * FROM skins` retorna erro de tabela inexistente).

**Tratamento de cliente velho durante a janela:** se um usuário ficar com bundle frontend antigo após o deploy do backend, o `listSkins()` retornará 404 e o `SkinPicker` mostrará "Não consegui carregar as skins". Refresh resolve. Aceitável.

---

## Riscos

- 🟡 **Sessões in-flight no Redis:** `PlayerState.skin` em jogos ativos no momento do deploy. Mitigação: o código removido ignora o campo extra ao desserializar (TypeScript runtime é estrutural); jogos em curso continuam normalmente, próximas partidas não terão o campo. Não há dependência funcional do campo.
- 🟢 **Banco irreversível:** `DROP` de duas tabelas + coluna. Dados não são valiosos (skins não impactaram partidas). Snapshot pré-deploy é a rede.
- 🟢 **Type drift:** `types/shared.ts` tem cópias em ambos os repos. Como cada PR remove o campo no seu próprio arquivo, e o TypeScript não compila cross-repo, não há janela onde um tem skin e o outro não bloqueia o build.

---

## Critérios de sucesso

1. **Frontend:** `grep -rE "skinImage|SkinPicker|skins-api" src/` retorna vazio (zero matches). (`grep -r "skin\|Skin"` pode retornar falsos positivos não-relacionados — não usar como critério principal.)
2. **Frontend:** `pnpm tsc --noEmit -p tsconfig.json` passa sem erros.
3. **Frontend:** abrir lobby — não tem botão Skins na chrome (4 botões em vez de 5: Tutorial, Decks, Arenas, Mute).
4. **Frontend:** entrar numa sala — nameplates mostram Avatar (iniciais coloridas com gradient) em vez de mascote redondo.
5. **Backend:** `grep -rE "Skin|skin" src/` retorna apenas referências fora de skin de mascote (ex: variáveis homônimas em outro contexto, comentários históricos, ou nada).
6. **Backend:** `pnpm test:run` (72 testes do engine) continua passando.
7. **Backend:** `pnpm build` passa sem erros.
8. **Backend:** após migration rodar, `\d users` no psql não mostra coluna `equippedSkin`; `\dt skins` e `\dt user_skins` retornam "Did not find any relation".
9. **Backend:** novo signup não loga "[db] backfill skins granted=N", não chama `grantSkin`.

---

## Fora de escopo

- **Remover decks e arenas:** mesma arquitetura, mesma fraqueza potencial, mas decisão separada — DeckPicker e ArenaPicker têm valor visual diferente (deck muda as cartas todas; arena muda o fundo da mesa). Avaliar separadamente se quiser repetir esse processo.
- **Sistema de coins:** se `priceCoins` em skin era a única razão pra ter coins, considerar remover o sistema de moedas também. Investigação separada.
- **Reescrever brand-brief.md:** o brand-brief menciona "Cosméticos" como possível monetização futura (linha 121). Não atualizar nessa PR — futuro pode reintroduzir alguma forma de customização, e a entrada genérica do brand-brief não constrange essa decisão.
