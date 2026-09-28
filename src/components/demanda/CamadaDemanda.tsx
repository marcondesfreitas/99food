/**
 * `CamadaDemanda` — camada visual de surge sobre o mapa: hexágonos coloridos
 * (`HexZona`) + pills de multiplicador (`PillMultiplicador`).
 *
 * Fonte da transformação zona → hexágonos/pills: `.design-import/logic.js`
 * linhas 423-433, dentro de `renderVals()`:
 *
 * ```js
 * const hexes = [], pills = [];
 * s.zonas.forEach(zn => {
 *   const [mi, ma] = this.faixaDe(zn);
 *   if (mi < 1.1) return;                              // zona "normal": nada
 *   const cor = mi >= 2.2 ? '#E9635B' : '#EF7D76';
 *   zn.cells.forEach((c, ci) => {
 *     hexes.push({ key: zn.id + '_' + ci,
 *       left: zn.x + c[0] * 150 + (c[1] % 2 ? 75 : 0),
 *       top:  zn.y + c[1] * 129,
 *       cor, op: 0.55, dur: 3 + (ci % 3) * 0.4 });
 *   });
 *   const px = Math.max(10, Math.min(250, zn.x + 18)), py = Math.max(120, zn.y + 22);
 *   pills.push({ key: zn.id,
 *     left: 195 + (px - 195) * z,
 *     top:  422 + (py - 422) * z,
 *     faixa: faixaFmt(mi, ma) });
 * });
 * ```
 *
 * ## Por que hexágonos e pills usam sistemas de coordenadas diferentes
 *
 * No protótipo (HTML linhas 63, 84 e 109-111) existem dois containers
 * sobrepostos, com transforms diferentes (logic.js linhas 473-474):
 *
 * - `transformMapa`   = `translate(offX, offY) scale(zoom)`, origem `195px 422px`
 *   → é onde vivem as ruas, as quadras e **os hexágonos**. Por isso o hexágono
 *   recebe coordenada crua de espaço-mapa: quem escala é o container.
 * - `transformOverlay` = `translate(offX, offY)` (SEM `scale`)
 *   → é onde vivem carro, passageiros e **as pills**. Sem escala, a pill não
 *   cresce/encolhe junto com o zoom (fica sempre legível), mas em compensação
 *   a posição precisa ser escalada "na mão" — é exatamente o que a fórmula
 *   `195 + (px - 195) * z` faz: escala o ponto em torno do centro da tela,
 *   replicando o `transform-origin: 195px 422px` do container do mapa.
 *
 * ## Divergência conhecida com o `DESIGN_SYSTEM.md` §2.4
 *
 * O `DESIGN_SYSTEM.md` descreve 3 níveis de calor em amarelo/laranja
 * (`aquecida #FDEF7A` · `quente #FBE300` · `muito_quente #F5A623`). O `logic.js`
 * do v6 — implementação mais recente e a que este bloco porta — simplificou
 * para 2 níveis em vermelho: `hexQuente` (mult < 2.2x) e `hexMuitoQuente`
 * (mult >= 2.2x). Seguimos o `logic.js`.
 *
 * O componente é **puramente apresentacional**: recebe `zonas` por prop (de
 * `useDemandaStore`) e não lê store nenhuma. `faixaDe` é reimplementada aqui
 * como função pura, idêntica à da store (ver comentário em `faixaDe`).
 */

import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import HexZona, { OPACIDADE_HEX } from '@/components/demanda/HexZona';
import PillMultiplicador from '@/components/demanda/PillMultiplicador';
import { faixaFmt } from '@/servicos/mapaFalso';
import type { ZonaDemanda } from '@/state/tipos';
import { coresMapa } from '@/tema/cores';

// ---------------------------------------------------------------------------
// Constantes de layout (logic.js linhas 426-432)
// ---------------------------------------------------------------------------

/** Passo horizontal entre células vizinhas da grade hexagonal. */
const PASSO_X = 150;
/** Passo vertical (menor que a altura de 172 — as fileiras se encaixam). */
const PASSO_Y = 129;
/** Deslocamento das fileiras ímpares, que produz o encaixe em favo de mel. */
const DESLOCAMENTO_IMPAR = 75;

/** Offset da pill em relação ao canto da zona. */
const PILL_OFFSET_X = 18;
const PILL_OFFSET_Y = 22;
/** Clamps para a pill não sair da tela de 390×844 (logic.js linha 431). */
const PILL_MIN_X = 10;
const PILL_MAX_X = 250;
const PILL_MIN_Y = 120;

/**
 * Centro da tela de 390×844 — é o `transform-origin: 195px 422px` do container
 * do mapa, replicado na fórmula de posição das pills.
 */
const CENTRO_X = 195;
const CENTRO_Y = 422;

/** Abaixo disto a zona é "normal" e não desenha nada (logic.js linha 425). */
const LIMIAR_DESENHO = 1.1;
/** A partir daqui a zona vira "muito quente" (logic.js linha 426). */
const LIMIAR_MUITO_QUENTE = 2.2;

// ---------------------------------------------------------------------------
// Cálculo (funções puras — testáveis sem renderizar)
// ---------------------------------------------------------------------------

/**
 * Faixa `[min, max]` de multiplicador exibida para a zona.
 *
 * Cópia fiel de `faixaDe()` (logic.js linhas 171-174 / `demandaStore.faixaDe`).
 * Duplicada de propósito: mantém a camada apresentacional desacoplada da store
 * — o critério de aceite do bloco B07 é que estes componentes só desenhem.
 */
export function faixaDe(zona: Pick<ZonaDemanda, 'mult'>): [number, number] {
  const min = Math.max(1, Math.round(zona.mult * 10) / 10);
  return [min, Math.min(2.6, Math.round((min + 0.4) * 10) / 10)];
}

export type HexCalculado = {
  chave: string;
  left: number;
  top: number;
  cor: string;
  opacidade: number;
  /** Período do loop de "respiração", em segundos (3 · 3.4 · 3.8). */
  duracaoSegundos: number;
};

export type PillCalculada = {
  chave: string;
  left: number;
  top: number;
  faixa: string;
};

/** Hexágonos de todas as zonas aquecidas, em coordenadas de espaço-mapa. */
export function calcularHexagonos(zonas: ZonaDemanda[]): HexCalculado[] {
  const hexes: HexCalculado[] = [];
  for (const zona of zonas) {
    const [min] = faixaDe(zona);
    if (min < LIMIAR_DESENHO) continue;
    const cor = min >= LIMIAR_MUITO_QUENTE ? coresMapa.hexMuitoQuente : coresMapa.hexQuente;
    zona.cells.forEach((celula, i) => {
      const [coluna, fileira] = celula;
      hexes.push({
        chave: `${zona.id}_${i}`,
        left: zona.x + coluna * PASSO_X + (fileira % 2 ? DESLOCAMENTO_IMPAR : 0),
        top: zona.y + fileira * PASSO_Y,
        cor,
        opacidade: OPACIDADE_HEX,
        // Defasagem: hexágonos vizinhos "respiram" fora de sincronia.
        duracaoSegundos: 3 + (i % 3) * 0.4,
      });
    });
  }
  return hexes;
}

/**
 * Pills das zonas aquecidas, já em pixels de tela (o container das pills não
 * tem `scale`, então o zoom entra aqui — ver bloco de doc no topo do arquivo).
 */
export function calcularPills(zonas: ZonaDemanda[], zoom: number): PillCalculada[] {
  const pills: PillCalculada[] = [];
  for (const zona of zonas) {
    const [min, max] = faixaDe(zona);
    if (min < LIMIAR_DESENHO) continue;
    const px = Math.max(PILL_MIN_X, Math.min(PILL_MAX_X, zona.x + PILL_OFFSET_X));
    const py = Math.max(PILL_MIN_Y, zona.y + PILL_OFFSET_Y);
    pills.push({
      chave: zona.id,
      left: CENTRO_X + (px - CENTRO_X) * zoom,
      top: CENTRO_Y + (py - CENTRO_Y) * zoom,
      faixa: faixaFmt(min, max),
    });
  }
  return pills;
}

// ---------------------------------------------------------------------------
// Sub-camadas — exportadas para quem já tem os containers de pan/zoom prontos
// (B11) e prefere posicionar cada uma dentro do container certo.
// ---------------------------------------------------------------------------

export type CamadaHexagonosProps = {
  zonas: ZonaDemanda[];
  /** Desliga o `breathe` (testes/snapshots ou "reduzir movimento"). */
  animar?: boolean;
};

/**
 * Só os hexágonos. Deve ficar **dentro do container transformado pelo mapa**
 * (`translate(offX, offY) scale(zoom)`), junto com ruas/quadras.
 */
export function CamadaHexagonos({ zonas, animar = true }: CamadaHexagonosProps) {
  const hexes = useMemo(() => calcularHexagonos(zonas), [zonas]);
  return (
    <View pointerEvents="none" style={estilos.preenche}>
      {hexes.map((h) => (
        <HexZona
          key={h.chave}
          left={h.left}
          top={h.top}
          cor={h.cor}
          opacidade={h.opacidade}
          duracaoSegundos={h.duracaoSegundos}
          animar={animar}
        />
      ))}
    </View>
  );
}

export type CamadaPillsProps = {
  zonas: ZonaDemanda[];
  /** Zoom atual do mapa — entra na fórmula de posição da pill. */
  zoom?: number;
};

/**
 * Só as pills. Deve ficar **dentro do container de overlay** (só
 * `translate(offX, offY)`, sem `scale`), junto com carro e passageiros.
 */
export function CamadaPills({ zonas, zoom = 1 }: CamadaPillsProps) {
  const pills = useMemo(() => calcularPills(zonas, zoom), [zonas, zoom]);
  return (
    <View pointerEvents="none" style={estilos.preenche}>
      {pills.map((p) => (
        <PillMultiplicador key={p.chave} left={p.left} top={p.top} faixa={p.faixa} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Camada completa (auto-contida)
// ---------------------------------------------------------------------------

export type CamadaDemandaProps = {
  /** Zonas já calculadas — normalmente `useDemandaStore((s) => s.zonas)`. */
  zonas: ZonaDemanda[];
  /** Zoom do mapa (logic.js `s.zoom`). */
  zoom?: number;
  /** Pan do mapa em pixels (logic.js `s.offX` / `s.offY`). */
  offX?: number;
  offY?: number;
  /**
   * `hexVisivel = mapaBase && camada && !oferta && !emCorrida`
   * (logic.js linha 1621). Quem calcula essa condição é a tela (B11); aqui a
   * camada só some por inteiro quando recebe `false`.
   */
  visivel?: boolean;
  /** Desliga o `breathe` dos hexágonos. */
  animar?: boolean;
};

/**
 * Camada completa e auto-contida: aplica ela mesma os dois transforms do
 * protótipo (mapa com `scale`, overlay sem) a partir de `zoom`/`offX`/`offY`.
 *
 * Se a tela já tiver esses dois containers montados (caso de B11), prefira
 * `CamadaHexagonos` e `CamadaPills` separadamente, para não empilhar
 * transform em cima de transform.
 */
function CamadaDemanda({
  zonas,
  zoom = 1,
  offX = 0,
  offY = 0,
  visivel = true,
  animar = true,
}: CamadaDemandaProps) {
  if (!visivel) return null;
  return (
    <View pointerEvents="none" style={estilos.preenche}>
      {/* transformMapa: translate + scale, origem no centro da tela. */}
      <View
        pointerEvents="none"
        style={[
          estilos.preenche,
          {
            transform: [{ translateX: offX }, { translateY: offY }, { scale: zoom }],
            transformOrigin: [CENTRO_X, CENTRO_Y, 0],
          },
        ]}
      >
        <CamadaHexagonos zonas={zonas} animar={animar} />
      </View>
      {/* transformOverlay: só translate — o zoom das pills já veio na posição. */}
      <View
        pointerEvents="none"
        style={[
          estilos.preenche,
          { transform: [{ translateX: offX }, { translateY: offY }] },
        ]}
      >
        <CamadaPills zonas={zonas} zoom={zoom} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  preenche: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});

export default CamadaDemanda;
