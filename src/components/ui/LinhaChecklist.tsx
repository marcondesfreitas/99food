import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { cores } from '@/tema/cores';
import { raioPill } from '@/tema/espacamento';
import { tipografia } from '@/tema/tipografia';

/**
 * Linha de checklist da tela "Teste de status".
 *
 * Fonte: DESIGN_SYSTEM.md §3.7 + `.design-import/RotaFacil Motorista v6.dc.html`
 * (linhas 611-627): altura 58, padding lateral 16, gap 12, divisor
 * `neutro100`, ícone de 24px em três estados —
 * **pendente** (círculo vazado `neutro200`), **testando** (anel com um quarto
 * em `neutro400` girando 1s/volta) e **aprovado** (disco `sucesso500` com
 * check branco). O texto migra de `neutro400` para `neutro900` na aprovação
 * (`logic.js`, campo `checklist`).
 */

export type EstadoChecklist = 'pendente' | 'testando' | 'aprovado';

const ALTURA = 58;
const ICONE = 24;
const DURACAO_GIRO = 1000;
const DURACAO_COR = 250;

// ---- Ícones ------------------------------------------------------------------

function IconePendente() {
  return <View style={[estilos.icone, estilos.circuloVazado]} />;
}

function IconeTestando() {
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // `@keyframes spin { to { transform: rotate(360deg) } }`, 1s linear infinito.
    const animacao = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: DURACAO_GIRO,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animacao.start();
    return () => {
      animacao.stop();
      giro.setValue(0);
    };
  }, [giro]);

  const rotacao = giro.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[estilos.icone, estilos.anelGirando, { transform: [{ rotate: rotacao }] }]}
    />
  );
}

function IconeAprovado() {
  return (
    <View style={[estilos.icone, estilos.discoAprovado]}>
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Path
          d="M4 12.5l5.5 5.5L20 6"
          fill="none"
          stroke={cores.neutro0}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

// ---- Linha -------------------------------------------------------------------

export type LinhaChecklistProps = {
  rotulo: string;
  estado: EstadoChecklist;
  /** Divisor inferior `neutro100`. Padrão `true` (última linha passa `false`). */
  divisor?: boolean;
  estilo?: StyleProp<ViewStyle>;
  testID?: string;
};

export function LinhaChecklist({
  rotulo,
  estado,
  divisor = true,
  estilo,
  testID,
}: LinhaChecklistProps) {
  const aprovado = estado === 'aprovado';

  // Transição suave cinza → preto quando o item é aprovado: é o detalhe que
  // faz a tela parecer viva (DESIGN_SYSTEM.md §3.7).
  const corAnimada = useRef(new Animated.Value(aprovado ? 1 : 0)).current;

  useEffect(() => {
    const animacao = Animated.timing(corAnimada, {
      toValue: aprovado ? 1 : 0,
      duration: DURACAO_COR,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });
    animacao.start();
    return () => animacao.stop();
  }, [aprovado, corAnimada]);

  const corTexto = corAnimada.interpolate({
    inputRange: [0, 1],
    outputRange: [cores.neutro400, cores.neutro900],
  });

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${rotulo}: ${ROTULO_ESTADO[estado]}`}
      testID={testID}
      style={[estilos.linha, divisor ? estilos.divisor : null, estilo]}
    >
      <Animated.Text
        style={[tipografia.corpoMd, estilos.rotulo, { color: corTexto }]}
        numberOfLines={1}
      >
        {rotulo}
      </Animated.Text>

      {estado === 'pendente' ? <IconePendente /> : null}
      {estado === 'testando' ? <IconeTestando /> : null}
      {aprovado ? <IconeAprovado /> : null}
    </View>
  );
}

const ROTULO_ESTADO: Record<EstadoChecklist, string> = {
  pendente: 'pendente',
  testando: 'testando',
  aprovado: 'aprovado',
};

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ALTURA,
    paddingHorizontal: 16,
  },
  divisor: {
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro100,
  },
  rotulo: {
    flex: 1,
  },
  icone: {
    width: ICONE,
    height: ICONE,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloVazado: {
    borderWidth: 2,
    borderColor: cores.neutro200,
  },
  anelGirando: {
    borderWidth: 2,
    borderColor: cores.neutro100,
    borderTopColor: cores.neutro400,
  },
  discoAprovado: {
    backgroundColor: cores.sucesso500,
  },
});
