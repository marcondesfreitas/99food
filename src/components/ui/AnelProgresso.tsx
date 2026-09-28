import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { cores } from '@/tema/cores';
import { numeroTabular, tipografia } from '@/tema/tipografia';

/**
 * Anel de progresso circular.
 *
 * Fonte: DESIGN_SYSTEM.md §3.6 (130px, stroke 10, trilho `neutro100`,
 * preenchimento `sucesso500`, início às 12h no sentido horário, transição
 * `ease-out` de 600ms) e o `.design-import/RotaFacil Motorista v6.dc.html`
 * (tela "Teste de status", linhas 570-585): `r="60"`,
 * `stroke-dasharray="377"` com `stroke-dashoffset` animado — mesma técnica
 * do arco oval da tela facial.
 *
 * Em SVG o traço de um `<Circle>` começa às 3h; o `rotate(-90)` em torno do
 * centro leva o início para as 12h, e o `strokeDashoffset` decrescente
 * preenche no sentido horário.
 */

const DURACAO_TRANSICAO = 600;

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

export type AnelProgressoProps = {
  /** Fração preenchida, de 0 a 1. Valores fora da faixa são limitados. */
  progresso: number;
  /** Texto grande no centro — ex.: `"3/6"`, `"78%"`. */
  valor?: string;
  /** Rótulo pequeno abaixo do valor, dentro do anel. */
  rotulo?: string;
  /** Diâmetro externo. Padrão 130. */
  tamanho?: number;
  /** Espessura do traço. Padrão 10. */
  espessura?: number;
  /** Cor do preenchimento. Padrão `sucesso500`. */
  cor?: string;
  /** Cor do trilho. Padrão `neutro100`. */
  corTrilho?: string;
  /** Desliga a transição de 600ms (útil em testes e no primeiro render). */
  animar?: boolean;
  estilo?: StyleProp<ViewStyle>;
  estiloValor?: StyleProp<TextStyle>;
  testID?: string;
};

function limitar(valor: number) {
  if (!Number.isFinite(valor)) return 0;
  return Math.min(1, Math.max(0, valor));
}

export function AnelProgresso({
  progresso,
  valor,
  rotulo,
  tamanho = 130,
  espessura = 10,
  cor = cores.sucesso500,
  corTrilho = cores.neutro100,
  animar = true,
  estilo,
  estiloValor,
  testID,
}: AnelProgressoProps) {
  const alvo = limitar(progresso);
  const centro = tamanho / 2;
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;

  const animado = useRef(new Animated.Value(alvo)).current;

  useEffect(() => {
    if (!animar) {
      animado.setValue(alvo);
      return;
    }
    const animacao = Animated.timing(animado, {
      toValue: alvo,
      duration: DURACAO_TRANSICAO,
      easing: Easing.out(Easing.ease),
      // `strokeDashoffset` do react-native-svg não passa pelo driver nativo.
      useNativeDriver: false,
    });
    animacao.start();
    return () => animacao.stop();
  }, [alvo, animar, animado]);

  const deslocamento = animado.interpolate({
    inputRange: [0, 1],
    outputRange: [circunferencia, 0],
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(alvo * 100) }}
      testID={testID}
      style={[estilos.container, { width: tamanho, height: tamanho }, estilo]}
    >
      <Svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
        <G rotation={-90} originX={centro} originY={centro}>
          <Circle
            cx={centro}
            cy={centro}
            r={raio}
            fill="none"
            stroke={corTrilho}
            strokeWidth={espessura}
          />
          <CirculoAnimado
            cx={centro}
            cy={centro}
            r={raio}
            fill="none"
            stroke={cor}
            strokeWidth={espessura}
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={deslocamento}
          />
        </G>
      </Svg>

      <View style={[StyleSheet.absoluteFill, estilos.centro]} pointerEvents="none">
        {valor ? (
          <Text
            style={[
              tipografia.tituloLg,
              numeroTabular,
              estilos.valor,
              // O protótipo usa 34px num anel de 130 — proporção mantida para
              // que o componente escale junto com `tamanho`.
              { fontSize: Math.round(tamanho * 0.26), lineHeight: Math.round(tamanho * 0.31) },
              estiloValor,
            ]}
            numberOfLines={1}
          >
            {valor}
          </Text>
        ) : null}
        {rotulo ? (
          <Text style={[tipografia.corpoSm, estilos.rotulo]} numberOfLines={1}>
            {rotulo}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valor: {
    color: cores.neutro900,
  },
  rotulo: {
    color: cores.neutro600,
    marginTop: 2,
  },
});
