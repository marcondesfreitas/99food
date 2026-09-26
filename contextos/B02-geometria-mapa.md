# B02 — Geometria do mapa falso + tipos de dados

**Onda:** 1 (paralelo com B01, B03, B04)
**Depende de:** B00
**Bloqueia:** B06, B07

## Objetivo

Portar os dados estáticos e as funções matemáticas puras que descrevem a
"cidade falsa" do protótipo (ruas, quadras, rótulos, zonas de demanda,
trajetos pré-calculados) e os tipos TypeScript do domínio. **Zero UI aqui** —
só dados e funções puras, testáveis sem renderizar nada.

## Arquivos a criar

```
src/state/tipos.ts
src/servicos/mapaFalso.ts
```

## Fonte no protótipo

`.design-import/logic.js` **linhas 1–101** (constantes `CHECK`, `NOMES`, `VERT`,
`HORIZ`, `CX/CY/HOME`, `vx/hy/diag`, `ROTAS`, `CLUSTERS`, `PAX`, `CATEGORIAS`,
`TIPOS_CONTA`, `TILES`, `PUSH_TELAS`, `DUR_BUSCAR/DUR_VIAGEM`, `fmt/um/faixaFmt`,
`preparar()`, `emT()`, `TRAJETOS`) e **linhas 103–120** (`QUADRAS`, `ROTULOS`).

## Especificação

### `src/state/tipos.ts`
Portar o modelo de `ARQUITETURA.md §5` (`Local`, `Passageiro`, `StatusCorrida`,
`Corrida`) **mais** os tipos específicos deste protótipo que não estavam no
plano original:

```ts
type Ponto = [number, number];               // coordenada no plano falso (px), não lat/lng real
type Trajeto = {
  origem: string; destino: string;
  buscar: Ponto[]; viagem: Ponto[];           // vértices brutos (linha 14-39 do logic.js)
};
type TrajetoPreparado = {
  origem: string; destino: string;
  pb: GeometriaPreparada; pv: GeometriaPreparada;  // "buscar" e "viagem" já densificados
  km: number; kmOrigem: number; min: number; minOrigem: number;
};
type GeometriaPreparada = { s: Ponto[]; cum: number[]; d: string; len: number; vertices: number };
type ZonaDemanda = { id: string; x: number; y: number; cells: [number, number][]; base: number; pax: number; mot: number; mult: number };
```

`d` dentro de `GeometriaPreparada` é o atributo `d` de um `<Path>` SVG
(`M x y L x y L x y ...`) — reutilizável direto em `react-native-svg`.

### `src/servicos/mapaFalso.ts`

Portar **literalmente** (é matemática pura, não muda entre plataformas):

- `VERT`, `HORIZ` (posições das ruas verticais/horizontais)
- `CX, CY, HOME` e `vx(i)`, `hy(i)`, `diag(x)` (funções de conversão de índice de rua → pixel)
- `ROTAS` (5 trajetos com pontos brutos de "ir buscar" e "viagem")
- `preparar(pts)` — densifica uma polyline (1 vértice a cada ~12px) e devolve
  comprimento acumulado + string SVG `d`. **Esta é a função mais importante do
  bloco** — sem ela o marcador anda "aos saltos" nos vértices originais em vez
  de suavemente (ver `DESIGN_SYSTEM.md §13.3`, é o erro mais provável).
- `emT(prep, t)` — dado um `t` de 0 a 1 (progresso), devolve `{x, y, bearing}`
  interpolando por **comprimento de arco acumulado**, não por índice de vértice.
  Faz busca binária em `prep.cum`. Chave para o "piloto automático" não frear
  nas curvas (`DESIGN_SYSTEM.md §13.3`, último bullet — é literalmente o erro
  mais citado no design system).
- `TRAJETOS` = `ROTAS.map(...)` já processado com `preparar()`, com `km`/`min`
  calculados a partir do comprimento real da polyline (`METRO_PX = 6` — escala
  do protótipo, 6 "metros" por pixel).
- `QUADRAS`, `ROTULOS` (retângulos e textos decorativos do mapa falso)
- `CLUSTERS`, `PAX` (centros das zonas de demanda e posições de passageiros decorativos)
- `fmt(n)` → `"R$ 12,50"`, `um(n)` → `"1,8"`, `faixaFmt(a,b)` → `"1.0X–1.4X"`

## Notas de tradução Web → RN

- Nenhuma — é JS/TS puro, roda igual em RN. A única diferença é o import de
  `react-native-svg` no consumidor (B06), não aqui.
- Manter as coordenadas no mesmo sistema de pixels do protótipo (frame de
  390×844) — os componentes que consomem isso (B06/B07/B11) escalam para o
  tamanho real de tela lá, não aqui.

## Critério de aceite

- Testes unitários simples (ou um script ad-hoc) confirmam que `emT(preparar(ROTAS[0].viagem), 0.5)`
  devolve um ponto a meio caminho do comprimento total (não do índice do meio).
- `TRAJETOS.length === 5`.
- Nenhuma função aqui importa React ou React Native.
