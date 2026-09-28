// Marcador de posição do motorista ("AvatarPosicao").
//
// Porta de `.design-import/RotaFacil Motorista v6.dc.html` (bloco
// `carroX/carroY`, linhas ~150-158) e de `logic.js` linhas 460-463
// (`anguloMarcador`, `animMarcador`, `haloVisivel`).
//
// Disco branco de 40px com borda azul, seta triangular girando pelo bearing
// da via e halo azul pulsante atrás enquanto o carro está parado.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { cores } from '@/tema/cores';
import { raioPill, sombraFlutuante } from '@/tema/espacamento';

/** `.dc.html`: 40×40 com `margin: -20 0 0 -20`. */
const DISCO = 40;
const DISCO_BORDA = 3;

/** Halo: `left:-12; top:-12; width:64; height:64`. */
const HALO = 64;
const HALO_OFFSET = -12;
/** `@keyframes halo { 0% { scale(1); opacity:.32 } 100% { scale(1.9); opacity:0 } }` */
const HALO_ESCALA_FINAL = 1.9;
const HALO_OPACIDADE_INICIAL = 0.32;
const HALO_DURACAO = 2000;

/** Seta: 14×16, `clip-path: polygon(50% 0, 100% 100%, 50% 76%, 0 100%)`. */
const SETA_W = 14;
const SETA_H = 16;
const SETA_PATH = `M${SETA_W / 2} 0 L${SETA_W} ${SETA_H} L${SETA_W / 2} ${
  SETA_H * 0.76
} L0 ${SETA_H} Z`;

/** Suavização da rotação da seta entre dois quadros de bearing. */
const DURACAO_GIRO = 220;

/** `@keyframes chegou`: scale 1 → 1.15 (45%) → 1, 400ms. */
const PULSO_DURACAO_SUBIDA = 180;
const PULSO_DURACAO_DESCIDA = 220;
const PULSO_ESCALA = 1.15;

export type MarcadorCarroProps = {
  /** Posição no plano falso (px). Já com pan/zoom aplicados pela tela (B11). */
  x: number;
  y: number;
  /** Bearing em graus (`emT().bearing` / `logic.js` `anguloMarcador`). */
  angulo: number;
  /**
   * Halo pulsante — no protótipo, `!andando || corridaStatus === 'AGUARDANDO'`
   * (logic.js linha 463): aparece quando o carro está parado ou esperando o
   * passageiro.
   */
  haloVisivel?: boolean;
  /** Pulso de "chegou" (logic.js linha 462, `chegada === 'pulse'`). */
  pulso?: boolean;
};

export function MarcadorCarro({
  x,
  y,
  angulo,
  haloVisivel = true,
  pulso = false,
}: MarcadorCarroProps) {
  // ---- Rotação contínua (sem salto 359° → 1°) ------------------------------
  // Guardamos o ângulo "desenrolado": em vez de animar para o valor bruto,
  // animamos para o representante mais próximo do ângulo atual. Assim uma
  // virada de 350° para 10° percorre +20°, não -340°.
  const anguloAnim = useRef(new Animated.Value(angulo)).current;
  const anguloDesenrolado = useRef(angulo);

  useEffect(() => {
    const anterior = anguloDesenrolado.current;
    // Menor diferença angular, em (-180, 180].
    const delta = ((((angulo - anterior) % 360) + 540) % 360) - 180;
    const alvo = anterior + delta;
    anguloDesenrolado.current = alvo;

    if (Math.abs(delta) < 0.05) {
      anguloAnim.setValue(alvo);
      return;
    }
    const anim = Animated.timing(anguloAnim, {
      toValue: alvo,
      duration: DURACAO_GIRO,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [angulo, anguloAnim]);

  // `extrapolate: 'extend'` (padrão) mantém a relação linear fora de 0-360,
  // o que é justamente o que o ângulo desenrolado precisa.
  const rotacao = anguloAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // ---- Halo pulsante -------------------------------------------------------
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!haloVisivel) {
      halo.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: HALO_DURACAO,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => {
      anim.stop();
      halo.setValue(0);
    };
  }, [haloVisivel, halo]);

  const haloEscala = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [1, HALO_ESCALA_FINAL],
  });
  const haloOpacidade = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [HALO_OPACIDADE_INICIAL, 0],
  });

  // ---- Pulso de chegada ----------------------------------------------------
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulso) return;
    escala.setValue(1);
    const anim = Animated.sequence([
      Animated.timing(escala, {
        toValue: PULSO_ESCALA,
        duration: PULSO_DURACAO_SUBIDA,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(escala, {
        toValue: 1,
        duration: PULSO_DURACAO_DESCIDA,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [pulso, escala]);

  return (
    <Animated.View
      style={[estilos.ancora, { left: x, top: y, transform: [{ scale: escala }] }]}
      pointerEvents="none"
    >
      {haloVisivel ? (
        <Animated.View
          style={[
            estilos.halo,
            { opacity: haloOpacidade, transform: [{ scale: haloEscala }] },
          ]}
        />
      ) : null}

      <View style={estilos.disco}>
        <Animated.View style={{ transform: [{ rotate: rotacao }] }}>
          <Svg width={SETA_W} height={SETA_H} viewBox={`0 0 ${SETA_W} ${SETA_H}`}>
            <Path d={SETA_PATH} fill={cores.info500} />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  ancora: {
    position: 'absolute',
    width: DISCO,
    height: DISCO,
    marginLeft: -DISCO / 2,
    marginTop: -DISCO / 2,
  },
  halo: {
    position: 'absolute',
    left: HALO_OFFSET,
    top: HALO_OFFSET,
    width: HALO,
    height: HALO,
    borderRadius: raioPill,
    backgroundColor: cores.info500,
  },
  disco: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: raioPill,
    backgroundColor: cores.neutro0,
    borderWidth: DISCO_BORDA,
    borderColor: cores.info500,
    alignItems: 'center',
    justifyContent: 'center',
    // `.dc.html`: 0 2px 8px rgba(0,0,0,.22)
    ...sombraFlutuante,
    shadowOpacity: 0.22,
  },
});
