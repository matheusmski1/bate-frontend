# Scripts

## optimize-mascot.mjs

Converte PNG de mascote (com checkerboard de fundo baked) em WebP com alpha limpo. Usa flood-fill de borda pra remover pixels gray-ish.

Uso:

```bash
node scripts/optimize-mascot.mjs <input.png> <output.webp> [width=1024]
```

Exemplo:

```bash
node scripts/optimize-mascot.mjs ~/Downloads/batinho-cartas/batinho-novo.png public/batinho/batinho-novo.webp
```

Após gerar, adicionar o caminho ao `src/lib/mascot.ts` (se for skin/avatar) ou ao `src/lib/mascot-overlay/assets.ts` (se for usado em animação).
