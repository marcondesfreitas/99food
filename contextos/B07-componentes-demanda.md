# B07 — Componentes de demanda (hexágonos)

**Onda:** 2 (paralelo com B05, B06, B08, B09, B24)
**Depende de:** B01 (tema), B02 (geometria), B04 (formato de `ZonaDemanda` — só o tipo, não precisa da store implementada, pode combinar a interface antes)
**Bloqueia:** B11

## Objetivo

Camada visual de demanda: hexágonos coloridos sobre o mapa + pills "1.8x"
flutuantes. É puramente apresentação — recebe a lista de zonas já calculada
(de `demandaStore`) e desenha.

## Arquivos a criar

```
src/components/demanda/HexZona.tsx
src/components/demanda/PillMultiplicador.tsx
src/components/demanda/CamadaDemanda.tsx   // compõe os dois acima a partir de zonas[]
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` bloco `hexVisivel` (dentro do
mapa, em torno da linha ~95-115 do template) e bloco de `pills` (~linha 150-165).
Lógica de transformação zona→hexágonos/pills: `.design-import/logic.js` linhas
**423-433** (dentro de `renderVals()`):

```js
s.zonas.forEach(zn => {
  const [mi, ma] = this.faixaDe(zn);
  if (mi < 1.1) return;                     // zona "normal" não desenha nada
  const cor = mi >= 2.2 ? '#E9635B' : '#EF7D76';
  zn.cells.forEach((c, ci) => {
    hexes.push({ left: zn.x + c[0]*150 + (c[1]%2 ? 75 : 0), top: zn.y + c[1]*129, cor, op: .55, dur: 3 + (ci%3)*.4 });
  });
  pills.push({ left: ..., top: ..., faixa: faixaFmt(mi, ma) });
});
```

## Especificação

- **`HexZona`** — hexágono via `clipPath: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)`
  no protótipo (CSS `clip-path`). Em RN, `clip-path` de polígono **não existe
  nativamente** — usar `react-native-svg` com `<Polygon points="...">` em vez de
  `View`+clip-path (mais confiável entre plataformas). Tamanho 150×172 (aresta
  ≈110px conforme `DESIGN_SYSTEM.md §2.4`). Cor sólida semitransparente
  (`op: .55`), **sem contorno**. Animação de "respiração" (`breathe`: opacidade
  oscila levemente, 3-4.2s de loop, defasada por hexágono via `dur`).
- **Cores por nível** (`DESIGN_SYSTEM.md §2.4`): `aquecida #FDEF7A` (0.45 op) ·
  `quente #FBE300` (0.55) · `muito_quente #F5A623` (0.60). **Nota:** o `logic.js`
  do v6 simplifica para só 2 cores (`#E9635B` muito quente ≥2.2x, `#EF7D76` quente
  <2.2x) — usar os valores do `logic.js` (é a implementação real mais recente),
  documentar a divergência com o `DESIGN_SYSTEM.md` se notarem.
- **`PillMultiplicador`** — pill branca, ícone de raio + texto "1.8X–2.2X" (`faixaFmt`),
  sombra flutuante. Só aparece se `mi >= 1.1` (zonas "normais" não geram pill).
- **`CamadaDemanda`** — recebe `zonas: ZonaDemanda[]`, `zoom`, `offX/offY` (para
  posicionar as pills corretamente mesmo com pan/zoom — ver fórmula
  `195 + (px - 195) * zoom` no `logic.js` linha 432), itera e renderiza hexágonos + pills.
  Some inteiramente quando há oferta ativa ou corrida em andamento
  (`hexVisivel = mapaBase && camada && !oferta && !emCorrida`).

## Notas de tradução Web → RN

- `mix-blend-mode: multiply` no container dos hexágonos (para o texto de rua
  continuar legível por baixo) — sem equivalente direto em RN; a alternativa
  mais próxima é baixar a opacidade um pouco mais do que o CSS original, ou
  aceitar a diferença visual (é um efeito sutil).
- Layout: os hexágonos ficam dentro do mesmo container transformado por
  pan/zoom que o mapa (`transformOverlay`), então recebem as mesmas coordenadas
  de espaço-mapa que `RotaPolyline`/`MarcadorCarro` de B06 — não recalcular
  zoom aqui, receber já resolvido ou usar a mesma fórmula consistentemente.

## Critério de aceite

- Com 5 zonas de teste (mocks), renderiza hexágonos nas posições certas sem
  sobreposição incorreta, e pills só aparecem onde `mult >= 1.1`.
- Zona com `mult` mudando ao longo do tempo (mock de tick) faz o hexágono
  trocar de cor suavemente (não é obrigatório animar a transição de cor em si,
  mas a opacidade "respirando" deve ficar visível).
