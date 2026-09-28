import { useEffect } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { cores } from '@/tema/cores';
import { raioPill, sombraFlutuante } from '@/tema/espacamento';

/**
 * Chave liga/desliga.
 *
 * Fonte: DESIGN_SYSTEM.md §3.15 — trilho 51×31, `raio/pill`; off `neutro200`,
 * on `amarelo500` com bolinha branca. As medidas internas (padding 3, bolinha
 * 25, sombra da bolinha) vêm do `.design-import/RotaFacil Motorista v6.dc.html`
 * (bloco de categorias, `width: 51px; height: 31px; padding: 3px`).
 *
 * ## Por que Reanimated, e não `Animated` do core (histórico)
 *
 * A primeira versão deste componente usava `Animated.Value` com
 * `useNativeDriver: false` — obrigatório ali porque o driver nativo clássico
 * não interpola `backgroundColor`. Na prática isso rodava a animação de cor
 * inteira na thread de JS: em qualquer tela com o mapa ou uma lista rolando
 * ao mesmo tempo (`prefservicos`, `veiculos`), o toggle podia perder quadros
 * exatamente quando a thread de JS estava ocupada.
 *
 * `interpolateColor` do Reanimated resolve a mesma interpolação como
 * worklet, na UI thread — por isso a troca de cor e o deslizar da bolinha
 * continuam suaves mesmo com a JS thread ocupada. Um único `progresso`
 * (0→1) ainda controla os dois, como antes.
 */

const LARGURA = 51;
const ALTURA = 31;
const PADDING = 3;
const BOLINHA = ALTURA - PADDING * 2; // 25
const DESLOCAMENTO = LARGURA - PADDING * 2 - BOLINHA; // 20
const DURACAO = 180;

export type ToggleProps = {
  valor: boolean;
  onChange?: (valor: boolean) => void;
  desabilitado?: boolean;
  /**
   * Cor do trilho ligado. Padrão `amarelo500` (DESIGN_SYSTEM.md §3.15).
   * A lista de categorias do protótipo usa `neutro900` — telas que quiserem
   * esse visual passam `corLigado={cores.neutro900}`.
   */
  corLigado?: string;
  /** Cor do trilho desligado. Padrão `neutro200`. */
  corDesligado?: string;
  rotuloAcessibilidade?: string;
  estilo?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Toggle({
  valor,
  onChange,
  desabilitado = false,
  corLigado = cores.amarelo500,
  corDesligado = cores.neutro200,
  rotuloAcessibilidade,
  estilo,
  testID,
}: ToggleProps) {
  const progresso = useSharedValue(valor ? 1 : 0);

  useEffect(() => {
    progresso.value = withTiming(valor ? 1 : 0, {
      duration: DURACAO,
      easing: Easing.out(Easing.ease),
    });
  }, [valor, progresso]);

  const estiloTrilho = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progresso.value,
      [0, 1],
      [corDesligado, corLigado]
    ),
  }));

  const estiloBolinha = useAnimatedStyle(() => ({
    transform: [{ translateX: progresso.value * DESLOCAMENTO }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={rotuloAcessibilidade}
      accessibilityState={{ checked: valor, disabled: desabilitado }}
      disabled={desabilitado}
      hitSlop={8}
      onPress={() => onChange?.(!valor)}
      testID={testID}
      style={[desabilitado ? estilos.desabilitado : null, estilo]}
    >
      <Animated.View style={[estilos.trilho, estiloTrilho]}>
        <Animated.View style={[estilos.bolinha, estiloBolinha]} />
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  trilho: {
    width: LARGURA,
    height: ALTURA,
    borderRadius: raioPill,
    padding: PADDING,
    justifyContent: 'center',
  },
  bolinha: {
    width: BOLINHA,
    height: BOLINHA,
    borderRadius: raioPill,
    backgroundColor: cores.neutro0,
    // `box-shadow: 0 1px 3px rgba(0,0,0,.2)` do protótipo: reaproveita a cor
    // do token de sombra e ajusta offset/raio para a escala da bolinha.
    ...sombraFlutuante,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  desabilitado: {
    opacity: 0.5,
  },
});
