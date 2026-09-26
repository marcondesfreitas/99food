# B10 — Tela Splash

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B01 (tema)
**Bloqueia:** B25

## Objetivo

Tela de abertura — transição de cobertura, não uma tela isolada de verdade
(o mapa/home já existe "por baixo" e o splash faz fade-out revelando ele).

## Arquivo a criar

```
app/index.tsx   (ou src/telas/Splash.tsx importado por app/index.tsx — decisão de B25)
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **1082-1122** (bloco `telaSplash`).
`.design-import/logic.js`: `animSplash` (linha 621: `fadeout 800ms ease-in-out 400ms forwards`),
`componentDidMount` (linha 146-151: fica 1200ms em `tela:'splash'` antes de ir para `'mapa'`).

## Especificação

- Fundo amarelo claro (`amarelo300 #FDEF7A`) com padrão de hexágonos
  `amarelo500` a 25% opacidade, 3 colunas visíveis, escala grande (usar as
  posições de `hexSplash` do `logic.js` linha 459 como referência, ou recriar
  um padrão repetido similar).
- Monograma centralizado, cinza translúcido, ~120px. **No protótipo (linha
  1089) o texto do monograma é "RF" e embaixo dele (linha 1090) o wordmark diz
  "RotaFácil Motorista" — na implementação, trocar para "99" e "99 Motorista"
  respectivamente** (ver `PLANO_IMPLEMENTACAO_V6.md §5`, é só troca de texto,
  cor/tamanho/posição continuam iguais).
- Fade-out para revelar o mapa por baixo em ~800ms, com 400ms de atraso
  (total: 1200ms na tela antes de navegar, exatamente como o `at(() => ..., 1200)` do protótipo).
- **Não tem interação** — é 100% automática.

## Notas de tradução Web → RN

- `animation: fadeout 800ms ease-in-out 400ms forwards` → Reanimated:
  `opacity.value = withDelay(400, withTiming(0, {duration: 800}))`, e ao final
  navegar para a tela de mapa (via `router.replace` do Expo Router, coordenado com B25).

## Critério de aceite

- Ao abrir o app, mostra o splash por ~1.2s e faz a transição suave para a tela de mapa.
