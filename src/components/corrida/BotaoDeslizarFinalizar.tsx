/**
 * BotaoDeslizarFinalizar — "Deslize para finalizar →".
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `botaoDeslizar`
 * + `slideDown/slideMove/slideUp` (`.design-import/logic.js` 394-400) e
 * `slidePx`/`opacidadeRotulo` no `renderVals` (linhas 507-508):
 *
 *   slideMove: slide = max(0, min(302, clientX - x0))
 *   slideUp:   slide > 250 ? (slide = 302, finalizar()) : slide = 0
 *   opacidadeRotulo = max(0, 1 - slide / 180)
 *
 * Tradução Web → RN: `onPointerDown/Move/Up` viram a API moderna
 * `Gesture.Pan()` + `<GestureDetector>` do gesture-handler 2.32 —
 * `event.translationX` já é exatamente `clientX - x0`.
 *
 * O `302` do protótipo é `larguraDoTrilho - 56` num frame de 390px
 * (390 − 2×16 de padding = 358; 358 − 48 do botão − 2×4 de folga = 302).
 * Aqui o máximo é medido no `onLayout` para funcionar em qualquer largura,
 * mantendo o mesmo número em telas de 390px. O limiar (250/302 ≈ 0,828)
 * acompanha proporcionalmente.
 *
 * IMPORTANTE: como qualquer componente de gesture-handler, a árvore precisa
 * estar dentro de um `<GestureHandlerRootView>` (responsabilidade da tela/layout).
 */

import { StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { cores } from '@/tema/cores';
import { raioPill } from '@/tema/espacamento';
import { familiaInter } from '@/tema/tipografia';

/** `height: 56px` do trilho. */
const ALTURA = 56;
/** Botão circular `48×48` com `left: 4; top: 4`. */
const TAMANHO_BOTAO = 48;
const FOLGA = 4;
/** Curso total no frame de referência (390px) — usado como fallback. */
const CURSO_PADRAO = 302;
/** `slide > 250` de 302 → 82,8% do curso. */
const FRACAO_LIMIAR = 250 / CURSO_PADRAO;
/** `opacidadeRotulo = max(0, 1 - slide / 180)` — 180 de 302 → 59,6% do curso. */
const FRACAO_FADE = 180 / CURSO_PADRAO;

export type BotaoDeslizarFinalizarProps = {
  onFinalizar: () => void;
  rotulo?: string;
};

export function BotaoDeslizarFinalizar({
  onFinalizar,
  rotulo = 'Deslize para finalizar →',
}: BotaoDeslizarFinalizarProps) {
  /** `s.slide` do protótipo — deslocamento atual do botão, em px. */
  const slide = useSharedValue(0);
  /** Curso máximo (`302` no protótipo), medido no layout. */
  const curso = useSharedValue(CURSO_PADRAO);

  const aoMedir = (e: LayoutChangeEvent) => {
    const largura = e.nativeEvent.layout.width;
    const max = Math.max(0, largura - TAMANHO_BOTAO - FOLGA * 2);
    curso.value = max || CURSO_PADRAO;
  };

  const pan = Gesture.Pan()
    // O arrasto é horizontal; falha cedo em movimentos verticais para não
    // brigar com um eventual scroll do painel.
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      'worklet';
      // slideMove: max(0, min(302, clientX - x0))
      slide.value = Math.max(0, Math.min(curso.value, e.translationX));
    })
    .onEnd(() => {
      'worklet';
      // slideUp
      if (slide.value > curso.value * FRACAO_LIMIAR) {
        // Completa a animação até o fim e só então dispara `onFinalizar`.
        slide.value = withTiming(
          curso.value,
          { duration: 140, easing: Easing.out(Easing.quad) },
          (concluiu) => {
            'worklet';
            if (concluiu) scheduleOnRN(onFinalizar);
          },
        );
      } else {
        slide.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.6 });
      }
    })
    .onFinalize((_e, sucesso) => {
      'worklet';
      // Cancelamento (ex.: gesto interrompido) volta ao início, igual ao
      // `onPointerCancel -> slideUp` do protótipo.
      if (!sucesso) {
        slide.value = withSpring(0, { damping: 18, stiffness: 220, mass: 0.6 });
      }
    });

  const estiloBotao = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value }],
  }));

  const estiloRotulo = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - slide.value / (curso.value * FRACAO_FADE)),
  }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={estilos.trilho}
        onLayout={aoMedir}
        accessibilityRole="adjustable"
        accessibilityLabel={rotulo}
        accessibilityHint="Arraste para a direita para finalizar a corrida."
      >
        <Animated.View style={[estilos.areaRotulo, estiloRotulo]} pointerEvents="none">
          <Text style={estilos.rotulo}>{rotulo}</Text>
        </Animated.View>
        <Animated.View style={[estilos.botao, estiloBotao]} pointerEvents="none">
          <Text style={estilos.seta}>→</Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const estilos = StyleSheet.create({
  // position:relative; height:56; radius:999; background:#26292E; overflow:hidden
  trilho: {
    marginTop: 16,
    height: ALTURA,
    borderRadius: raioPill,
    backgroundColor: cores.sheetFundo,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  // position:absolute; inset:0; centro; 16px/700 branco
  areaRotulo: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotulo: {
    fontFamily: familiaInter.bold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: cores.neutro0,
  },
  // left:4; top:4; 48×48; radius:999; background:#F8D60B
  botao: {
    position: 'absolute',
    left: FOLGA,
    top: FOLGA,
    width: TAMANHO_BOTAO,
    height: TAMANHO_BOTAO,
    borderRadius: raioPill,
    backgroundColor: cores.amarelo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seta: {
    fontFamily: familiaInter.bold,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: cores.neutro900,
  },
});

export default BotaoDeslizarFinalizar;
