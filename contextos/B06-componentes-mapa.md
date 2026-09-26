# B06 — Componentes do mapa falso

**Onda:** 2 (paralelo com B05, B07, B08, B09, B24)
**Depende de:** B01 (tema), B02 (geometria/tipos)
**Bloqueia:** B11

## Objetivo

Os componentes visuais que desenham a "cidade falsa" e a rota — tudo com
`View`s posicionadas absolutamente (igual ao protótipo, que usa `position: absolute`
em `<div>`s) mais a rota em `react-native-svg`.

## Arquivos a criar

```
src/components/mapa/RuasEQuadras.tsx     // grade de ruas + quadras + rótulos
src/components/mapa/RotaPolyline.tsx     // rota SVG com halo branco
src/components/mapa/MarcadorCarro.tsx    // AvatarPosicao: disco + seta + halo pulsante
src/components/mapa/BotaoRecentrar.tsx   // FAB
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **~85-230** (grade de
ruas `ruasV`/`ruasH`, quadras, rótulos, path da rota com os 2 traços de
contorno + 1 verde, pins de origem/destino, marcador do carro com halo).
Dados vêm de B02 (`mapaFalso.ts`): `VERT`, `HORIZ`, `QUADRAS`, `ROTULOS`.

## Especificação

### `RuasEQuadras`
- Fundo do mapa `#ECE8E1`, ruas brancas de 9-10px de espessura nas posições de `VERT`/`HORIZ`.
- Uma avenida diagonal (`AV. RADIAL LESTE`) — no protótipo é uma `<div>` larga
  rotacionada `-32.33deg` com fundo `#FDF6E3`; em RN usar `transform: [{rotate: '-32.33deg'}]` numa `View` absoluta.
- `QUADRAS` — retângulos com `border-radius` e cor variável (parque `#CDE3C4`,
  água `#BFDDEA`, quadras genéricas `#E1DDD5`).
- `ROTULOS` — texto pequeno (9px), rotacionado conforme o campo `rot`, cor `#8d8a84` (ou `#7e9a76`/`#6f92a1` para parque/represa).

### `RotaPolyline`
Recebe `d` (string de path, de `GeometriaPreparada.d`), `progresso` (0-1) e
desenha **3 traços sobrepostos** (essa ordem importa, é o "halo obrigatório"
do `DESIGN_SYSTEM.md §13.1`):
1. Branco, `strokeWidth=8`, por baixo (o halo)
2. Cinza `#9D9CA1` a 50% opacidade, `strokeWidth=5` (trecho "todo o caminho", decorativo)
3. Verde `#3ED97F`, `strokeWidth=5`, com `strokeDasharray={len} {len}` e
   `strokeDashoffset={-progresso*len}` — é assim que o protótipo faz o trecho
   percorrido "sumir" e só o restante do trajeto aparecer em verde.
Todos com `strokeLinecap="round"` `strokeLinejoin="round"`.
Pins de origem (verde `#24D279`, seta ↑) e destino (laranja `#EE542C`, seta ↓)
nas pontas do trajeto de viagem (`pv.s[0]` e `pv.s[last]`), com animação de
entrada tipo "bounce" (`pinin`/`bouncepin` no protótipo — usar
`Animated.spring` ou Reanimated `withSequence` de scale).

### `MarcadorCarro`
Disco branco 40px, borda azul `#4A90D9` 3px, seta triangular dentro rotacionada
pelo ângulo (`anguloMarcador`), halo azul pulsante atrás (`scale 1→1.9, opacity .32→0`
em loop 2s — `Animated.loop`). Halo só aparece quando parado/aguardando
(`haloVisivel` — ver `logic.js` linha 463).

### `BotaoRecentrar`
FAB branco 44px com seta de navegação azul, aparece só quando o mapa está fora
do centro (fade in/out simples).

## Notas de tradução Web → RN

- O protótipo usa `transform-origin` não-padrão em alguns elementos (ex. rótulos
  rotacionados `transform-origin: left center`) — em RN, `transformOrigin` não é
  suportado nativamente em todas as versões; alternativa: calcular o deslocamento
  manualmente ou usar a lib `react-native-transform-origin`, ou aceitar rotação
  em torno do centro (diferença visual pequena, ok para protótipo).
- `mix-blend-mode: multiply` (usado na camada de hexágonos, mas relevante aqui
  se as quadras also usam) não existe em RN — se necessário, aproxime reduzindo
  a opacidade em vez de blend mode real.
- Todo o mapa é posicionado dentro de um container que recebe
  `transform: translate(offX, offY) scale(zoom)` vindo do estado de pan/zoom —
  esse estado (offX/offY/zoom/arrastando) é gerenciado pela tela (B11), não
  por estes componentes; eles só recebem a posição já calculada como props.

## Critério de aceite

- Renderizar os 5 trajetos de B02 (`TRAJETOS`) com `RotaPolyline` e conferir
  visualmente que a linha segue "ruas" (não corta quadras) — comparar lado a
  lado com o protótipo aberto no navegador (arquivo `.design-import/RotaFacil Motorista v6.dc.html`, abrir localmente com um server estático).
- `MarcadorCarro` gira suavemente ao mudar `anguloMarcador` (sem "pulo" de 360°→0°).
