// Rota desenhada sobre a malha viária + pins de origem/destino.
//
// Porta de `.design-import/RotaFacil Motorista v6.dc.html` (bloco
// `rotaVisivel`, linhas ~112-128) e de `logic.js` linhas 464-471
// (`rotaPath` / `dashArray` / `dashOffset` / `origemX..destinoY`).
//
// O empilhamento dos três traços é normativo — DESIGN_SYSTEM.md §13.1,
// "O halo branco é obrigatório": sem ele a rota verde some sobre o parque
// e sobre a avenida diagonal clara.

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { Ponto } from '@/state/tipos';
import { cores, coresMapa } from '@/tema/cores';
import { raioPill, sombraFlutuante } from '@/tema/espacamento';
import { familiaInter } from '@/tema/tipografia';

const LARGURA_PADRAO = 390;
const ALTURA_PADRAO = 844;

/**
 * O protótipo usa `overflow: visible` no `<svg>`; em RN isso não é
 * confiável no Android, então o viewport é ampliado em 8px (metade do halo
 * de 8px, arredondado) em cada lado e o `viewBox` recebe o mesmo offset
 * negativo — as coordenadas do path continuam idênticas.
 */
const MARGEM = 8;

/** Espessuras do `.dc.html`. */
const ESPESSURA_HALO = 8;
const ESPESSURA_TRACO = 5;
/** `stroke-opacity="0.5"` do traço cinza decorativo. */
const OPACIDADE_PERCORRIDO = 0.5;

/** Pin: 40×40 com `margin: -20 0 0 -20` (ancora pelo centro). */
const PIN = 40;
const PIN_BORDA = 3;

/** `animation: pinin ... 220ms both` / `... 340ms both` — logic.js 470-471. */
const ATRASO_PIN_ORIGEM = 220;
const ATRASO_PIN_DESTINO = 340;

export type RotaPolylineProps = {
  /** `GeometriaPreparada.d` — o atributo `d` já pronto (B02 `preparar()`). */
  d: string;
  /** `GeometriaPreparada.len` — comprimento total da polyline. */
  len: number;
  /**
   * Progresso percorrido, 0 a 1. O trecho já andado "some" do traço verde
   * (é o efeito de `stroke-dashoffset` do protótipo). Fora de corrida o
   * protótipo passa 0 (rota inteira verde).
   */
  progresso?: number;
  /** Primeiro vértice da viagem (`pv.s[0]`). Omitir esconde o pin. */
  origem?: Ponto | null;
  /** Último vértice da viagem (`pv.s[len-1]`). Omitir esconde o pin. */
  destino?: Ponto | null;
  /** Dispara o "bouncepin" no pin de origem (chegada ao embarque). */
  bounceOrigem?: boolean;
  /** Dispara o "bouncepin" no pin de destino (chegada ao desembarque). */
  bounceDestino?: boolean;
  largura?: number;
  altura?: number;
};

export function RotaPolyline({
  d,
  len,
  progresso = 0,
  origem,
  destino,
  bounceOrigem = false,
  bounceDestino = false,
  largura = LARGURA_PADRAO,
  altura = ALTURA_PADRAO,
}: RotaPolylineProps) {
  const p = Math.max(0, Math.min(1, progresso));

  /**
   * `dasharray = [len, len]` faz o traço ter exatamente um "dash" do
   * tamanho da rota seguido de um "gap" do mesmo tamanho. Deslocar a fase
   * revela só o trecho restante.
   *
   * O protótipo usa offset negativo (`-p*len`). Como a fase é periódica em
   * `2*len`, usamos o equivalente positivo `(2-p)*len`: o `DashPathEffect`
   * do Android só aceita fase >= 0.
   */
  const dashOffset = len > 0 ? (2 - p) * len : 0;

  const larguraSvg = largura + MARGEM * 2;
  const alturaSvg = altura + MARGEM * 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg
        style={[estilos.svg, { left: -MARGEM, top: -MARGEM }]}
        width={larguraSvg}
        height={alturaSvg}
        viewBox={`${-MARGEM} ${-MARGEM} ${larguraSvg} ${alturaSvg}`}
      >
        {/* 1 · halo branco por baixo — obrigatório (DESIGN_SYSTEM §13.1) */}
        <Path
          d={d}
          fill="none"
          stroke={cores.neutro0}
          strokeWidth={ESPESSURA_HALO}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 2 · caminho completo em cinza a 50% (trecho consumido) */}
        <Path
          d={d}
          fill="none"
          stroke={cores.neutro400}
          strokeOpacity={OPACIDADE_PERCORRIDO}
          strokeWidth={ESPESSURA_TRACO}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 3 · trecho restante em verde */}
        <Path
          d={d}
          fill="none"
          stroke={coresMapa.rotaVerde}
          strokeWidth={ESPESSURA_TRACO}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[len, len]}
          strokeDashoffset={dashOffset}
        />
      </Svg>

      {origem ? (
        <Pin
          x={origem[0]}
          y={origem[1]}
          cor={coresMapa.pinOrigem}
          seta="↑"
          atraso={ATRASO_PIN_ORIGEM}
          bounce={bounceOrigem}
        />
      ) : null}
      {destino ? (
        <Pin
          x={destino[0]}
          y={destino[1]}
          cor={coresMapa.pinDestino}
          seta="↓"
          atraso={ATRASO_PIN_DESTINO}
          bounce={bounceDestino}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pin
// ---------------------------------------------------------------------------

type PinProps = {
  x: number;
  y: number;
  cor: string;
  seta: string;
  atraso: number;
  bounce: boolean;
};

/**
 * Disco colorido com borda branca. Entra com "pinin" (scale 0 → 1.14 → 1)
 * — aqui um `Animated.spring` com overshoot equivalente — e salta com
 * "bouncepin" quando o motorista chega no ponto.
 */
function Pin({ x, y, cor, seta, atraso, bounce }: PinProps) {
  const escala = useRef(new Animated.Value(0)).current;
  const salto = useRef(new Animated.Value(0)).current;

  // Reanima a entrada quando o pin muda de lugar (nova oferta / novo trajeto).
  useEffect(() => {
    escala.setValue(0);
    const anim = Animated.sequence([
      Animated.delay(atraso),
      Animated.spring(escala, {
        toValue: 1,
        friction: 5,
        tension: 170,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [escala, atraso, x, y]);

  // bouncepin 400ms: 0 → -8px (35%) → 0 (70%) → -3px (85%) → 0 (100%).
  useEffect(() => {
    if (!bounce) return;
    salto.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(salto, {
        toValue: -8,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(salto, {
        toValue: 0,
        duration: 140,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(salto, {
        toValue: -3,
        duration: 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(salto, {
        toValue: 0,
        duration: 60,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [bounce, salto]);

  return (
    <Animated.View
      style={[
        estilos.pinAncora,
        { left: x, top: y, transform: [{ translateY: salto }, { scale: escala }] },
      ]}
    >
      <View style={[estilos.pinDisco, { backgroundColor: cor }]}>
        <Text style={estilos.pinSeta}>{seta}</Text>
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
  pinAncora: {
    position: 'absolute',
    width: PIN,
    height: PIN,
    marginLeft: -PIN / 2,
    marginTop: -PIN / 2,
  },
  pinDisco: {
    width: PIN,
    height: PIN,
    borderRadius: raioPill,
    borderWidth: PIN_BORDA,
    borderColor: cores.neutro0,
    alignItems: 'center',
    justifyContent: 'center',
    // `.dc.html`: 0 2px 8px rgba(0,0,0,.24)
    ...sombraFlutuante,
    shadowOpacity: 0.24,
  },
  pinSeta: {
    fontFamily: familiaInter.bold,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '700',
    color: cores.neutro0,
  },
});
