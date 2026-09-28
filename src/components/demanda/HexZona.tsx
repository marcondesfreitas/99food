/**
 * `HexZona` — um hexágono da camada de demanda ("heatmap" de surge).
 *
 * Fonte no protótipo: `.design-import/RotaFacil Motorista v6.dc.html` linha 86
 * (bloco `hexVisivel`):
 *
 * ```html
 * <div style="position: absolute; left: {{hex.left}}px; top: {{hex.top}}px;
 *             width: 150px; height: 172px; background: {{hex.cor}};
 *             opacity: {{hex.op}};
 *             clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
 *             animation: breathe {{hex.dur}}s ease-in-out infinite;"></div>
 * ```
 *
 * e o keyframe `breathe` (linha 28): `0%,100% { opacity:.55 } 50% { opacity:.6 }`.
 *
 * ## Tradução Web → RN
 *
 * - `clip-path: polygon(...)` **não existe** em React Native. A forma é
 *   desenhada com `react-native-svg` (`<Polygon points="...">`), que é
 *   consistente entre iOS/Android/web. Os `points` abaixo são a conversão
 *   direta das porcentagens do `clip-path` para a caixa de 150×172.
 * - `animation: breathe Xs ease-in-out infinite` vira
 *   `withRepeat(withTiming(...), -1, true)` do Reanimated 4 (metade do período
 *   em cada sentido, com `reverse = true`, que é exatamente o que o keyframe
 *   `0/50/100%` faz).
 * - `mix-blend-mode: multiply` (aplicado no container dos hexágonos, linha 84
 *   do HTML, para os rótulos de rua continuarem legíveis por baixo) não tem
 *   equivalente em RN. Compensamos abaixando um pouco a opacidade
 *   (`COMPENSACAO_SEM_MULTIPLY`) — ver nota no bloco B07.
 */

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';

/** Caixa do hexágono no espaço-mapa (aresta ≈110px — `DESIGN_SYSTEM.md` §2.4). */
export const LARGURA_HEX = 150;
export const ALTURA_HEX = 172;

/**
 * `polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)` resolvido para
 * a caixa de 150×172 (25% de 172 = 43, 75% = 129).
 */
const PONTOS_HEX = '75,0 150,43 150,129 75,172 0,129 0,43';

/** Opacidade de repouso do keyframe `breathe` (`0%/100%`). */
export const OPACIDADE_HEX = 0.55;

/** Quanto a opacidade sobe no pico do `breathe` (`50%`: .55 → .6). */
const AMPLITUDE_BREATHE = 0.05;

/**
 * Fator aplicado à opacidade final para aproximar o efeito de
 * `mix-blend-mode: multiply` do protótipo, que em RN não existe: sem ele o
 * hexágono cobre os rótulos de rua mais do que na web. É um ajuste visual
 * deliberado, não um valor do design system.
 */
const COMPENSACAO_SEM_MULTIPLY = 0.9;

export type HexZonaProps = {
  /** Posição no espaço-mapa (o container pai é quem aplica pan/zoom). */
  left: number;
  top: number;
  /** Cor sólida do hexágono — sempre um token de `coresMapa` (B01). */
  cor: string;
  /** Opacidade de repouso. Padrão: `OPACIDADE_HEX` (o `hex.op` do protótipo). */
  opacidade?: number;
  /** Período do loop de "respiração", em **segundos** (`hex.dur`: 3 a 3.8s). */
  duracaoSegundos: number;
  /** Desliga a animação (útil em testes/snapshots ou "reduzir movimento"). */
  animar?: boolean;
};

function HexZona({
  left,
  top,
  cor,
  opacidade = OPACIDADE_HEX,
  duracaoSegundos,
  animar = true,
}: HexZonaProps) {
  const base = opacidade * COMPENSACAO_SEM_MULTIPLY;
  const pico = (opacidade + AMPLITUDE_BREATHE) * COMPENSACAO_SEM_MULTIPLY;

  const op = useSharedValue(base);

  useEffect(() => {
    if (!animar) {
      op.value = base;
      return;
    }
    // `withRepeat(..., -1, true)` = repetição infinita alternando o sentido,
    // ou seja, ida e volta — o equivalente do keyframe 0% → 50% → 100%.
    // Por isso o `withTiming` dura METADE do período total.
    op.value = withRepeat(
      withTiming(pico, {
        duration: (duracaoSegundos * 1000) / 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [animar, base, pico, duracaoSegundos, op]);

  const estiloAnimado = useAnimatedStyle(() => ({ opacity: op.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[estilos.hex, { left, top }, estiloAnimado]}
    >
      <Svg width={LARGURA_HEX} height={ALTURA_HEX}>
        <Polygon points={PONTOS_HEX} fill={cor} />
      </Svg>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  hex: {
    position: 'absolute',
    width: LARGURA_HEX,
    height: ALTURA_HEX,
  },
});

export default HexZona;
