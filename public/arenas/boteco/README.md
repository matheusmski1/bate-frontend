# Boteco Arena — Asset Manifest

Lista de assets necessários pra arena Boteco. Substituir thumb.webp atual (placeholder) e adicionar os outros conforme arte fica pronta.

## Background (1 asset opcional)

| Path | Dimensão | Notas |
|------|----------|-------|
| `neon-bar-do-batinho.webp` | ~240x80 | Neon laranja "Bar do Batinho" no canto superior esquerdo. Transparência. ~30KB |

Se não existir, o BackgroundBoteco.tsx esconde silenciosamente via onError.

## Thumbnail (picker)

| Path | Dimensão | Notas |
|------|----------|-------|
| `thumb.webp` | 240x160 | Screenshot ou render da arena em ação pro picker. Substitui placeholder. ~20KB |

## Decorações (3 assets, animadas via CSS)

| Path | Dimensão | Posição | Animação |
|------|----------|---------|----------|
| `decorations/copo-chope.webp` | 80x100 | canto inferior direito | sway-slow |
| `decorations/amendoim.webp` | 70x50 | canto inferior esquerdo | none |
| `decorations/pendente-luz.webp` | 60x80 | topo centralizado | pulse + glow |

Cada PNG/WebP com transparência alfa pra integrar com background.

## Batinho variants (7 assets)

Outfit swap subtil do Batinho default: mesma pose, mas com camisa do bar + chopp na mão.

| Path | Substitui | Notas |
|------|-----------|-------|
| `batinho/bate.webp` | `/batinho/batinho-bate.webp` | Batinho subindo na mesa gritando "BATE!" com chopp |
| `batinho/lupa.webp` | `/batinho/batinho-lupa.webp` | Batinho com camisa do bar segurando lupa |
| `batinho/feliz.webp` | `/batinho/batinho-feliz.webp` | Batinho brindando |
| `batinho/chorando.webp` | `/batinho/batinho-chorando.webp` | Batinho com chopp derramado |
| `batinho/trofeu.webp` | `/batinho/batinho-trofeu.webp` | Batinho dançando com chopp |
| `batinho/confuso.webp` | `/batinho/batinho-confuso.webp` | Batinho com chopp, expressão de "?" |
| `batinho/tempo-acabando.webp` | `/batinho/batinho-tempo-acabando.webp` | Batinho correndo com chopp |

**Importante:** manter as mesmas dimensões e enquadramento dos batinhos default (~400x400 com personagem centralizado) pra que animações framer-motion / anime.js existentes funcionem sem recálculo.

## Total estimado

~12 assets / ~250KB total. Lazy load — só carrega quando arena equipada (BackgroundBoteco e ArenaDecorationsLayer só montam quando arenaId === 'boteco').
