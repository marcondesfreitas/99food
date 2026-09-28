/**
 * `PillMultiplicador` — a pill branca "1,8X–2,2X" que flutua sobre uma zona
 * de demanda aquecida.
 *
 * Fonte no protótipo: `.design-import/RotaFacil Motorista v6.dc.html`
 * linhas 112-115 (bloco `pills`, dentro de `transformOverlay`):
 *
 * ```html
 * <div style="... display:flex; align-items:center; gap:5px; height:30px;
 *             padding:0 11px; border-radius:999px; background:#FFFFFF;
 *             box-shadow: 0 2px 8px rgba(0,0,0,.14);">
 *   <span style="width:8px; height:13px; background:#1C1A1F;
 *                clip-path: polygon(58% 0, 100% 0, 42% 44%, 92% 44%, 12% 100%, 40% 52%, 0 52%);"></span>
 *   <span style="font-size:12px; font-weight:700; color:#1C1A1F;
 *                font-variant-numeric: tabular-nums;">{{ p.faixa }}</span>
 * </div>
 * ```
 *
 * Notas de tradução Web → RN:
 * - o `clip-path` do raio vira um `<Polygon>` de `react-native-svg` (mesma
 *   razão do `HexZona`);
 * - `box-shadow` vira o token `sombraFlutuante` (`@/tema/espacamento`), que já
 *   traduz `0 2px 8px rgba(0,0,0,.14)` para iOS (`shadowXxx`) e Android
 *   (`elevation`);
 * - `font-variant-numeric: tabular-nums` vira o token `numeroTabular`, para a
 *   pill não "tremer" quando o multiplicador muda a cada tick de demanda.
 *
 * O componente é **apresentacional**: quem decide se a pill deve existir é a
 * `CamadaDemanda` (regra `mi >= 1.1` do `logic.js` linha 425).
 */

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { cores } from '@/tema/cores';
import { raioPill, sombraFlutuante } from '@/tema/espacamento';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

const LARGURA_RAIO = 8;
const ALTURA_RAIO = 13;

/**
 * `polygon(58% 0, 100% 0, 42% 44%, 92% 44%, 12% 100%, 40% 52%, 0 52%)`
 * resolvido para a caixa de 8×13 do ícone de raio.
 */
const PONTOS_RAIO = '4.64,0 8,0 3.36,5.72 7.36,5.72 0.96,13 3.2,6.76 0,6.76';

export type PillMultiplicadorProps = {
  /** Posição já resolvida em pixels de tela (ver `CamadaDemanda`). */
  left: number;
  top: number;
  /** Texto pronto, vindo de `faixaFmt(mi, ma)` — ex.: `"1,8X–2,2X"`. */
  faixa: string;
};

function PillMultiplicador({ left, top, faixa }: PillMultiplicadorProps) {
  return (
    <View pointerEvents="none" style={[estilos.pill, { left, top }]}>
      <Svg width={LARGURA_RAIO} height={ALTURA_RAIO}>
        <Polygon points={PONTOS_RAIO} fill={cores.neutro900} />
      </Svg>
      <Text style={estilos.texto}>{faixa}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: raioPill,
    backgroundColor: cores.neutro0,
    ...sombraFlutuante,
  },
  texto: {
    ...tipografia.labelChip,
    // O protótipo usa peso 700 nesta pill (o token `labelChip` é 600).
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
    ...numeroTabular,
  },
});

export default PillMultiplicador;
