// FAB "recentrar mapa".
//
// Porta de `.design-import/RotaFacil Motorista v6.dc.html` (bloco
// `mostrarRecentrar`, linhas ~168-172) e de `logic.js` linhas 255-257
// (`recentrar()`) e 477 (`mostrarRecentrar`).
//
// Só aparece quando o mapa saiu do centro (pan/zoom) ou quando o usuário
// "soltou" o seguimento durante a corrida. Entra e sai com fade de 200ms —
// enquanto invisível, desmonta, para não ocupar espaço na coluna de FABs.

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { cores, coresMapaEscuro } from '@/tema/cores';
import { raioPill, sombraFlutuante } from '@/tema/espacamento';

/** `.dc.html`: 44×44, `border-radius: 999px`, fundo branco. */
const FAB = 44;

/** Seta: 15×17, `clip-path: polygon(50% 0, 100% 100%, 50% 76%, 0 100%)`. */
const SETA_W = 15;
const SETA_H = 17;
const SETA_PATH = `M${SETA_W / 2} 0 L${SETA_W} ${SETA_H} L${SETA_W / 2} ${
  SETA_H * 0.76
} L0 ${SETA_H} Z`;

/** `animation: fadein 200ms ease-out both`. */
const DURACAO_ENTRADA = 200;
const DURACAO_SAIDA = 160;

export type BotaoRecentrarProps = {
  /** `mostrarRecentrar` (logic.js 477). */
  visivel: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function BotaoRecentrar({ visivel, onPress, style }: BotaoRecentrarProps) {
  const [montado, setMontado] = useState(visivel);
  const opacidade = useRef(new Animated.Value(visivel ? 1 : 0)).current;

  useEffect(() => {
    if (visivel) {
      setMontado(true);
      const anim = Animated.timing(opacidade, {
        toValue: 1,
        duration: DURACAO_ENTRADA,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
    }

    const anim = Animated.timing(opacidade, {
      toValue: 0,
      duration: DURACAO_SAIDA,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) setMontado(false);
    });
    return () => anim.stop();
  }, [visivel, opacidade]);

  if (!montado) return null;

  return (
    <Animated.View style={[estilos.fab, { opacity: opacidade }, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Recentralizar o mapa"
        style={estilos.area}
      >
        <Svg width={SETA_W} height={SETA_H} viewBox={`0 0 ${SETA_W} ${SETA_H}`}>
          <Path d={SETA_PATH} fill={cores.info500} />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fab: {
    width: FAB,
    height: FAB,
    borderRadius: raioPill,
    backgroundColor: coresMapaEscuro.botao,
    // `.dc.html`: 0 2px 8px rgba(0,0,0,.18)
    ...sombraFlutuante,
    shadowOpacity: 0.18,
  },
  area: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
