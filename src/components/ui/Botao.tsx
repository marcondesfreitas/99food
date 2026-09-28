import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import ReanimatedDefault, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { cores } from '@/tema/cores';
import { raioPill } from '@/tema/espacamento';
import { tipografia } from '@/tema/tipografia';

/**
 * Botão pill do app.
 *
 * Fonte: DESIGN_SYSTEM.md §3.1 (`BotaoPrimario`) +
 * `.design-import/RotaFacil Motorista v6.dc.html` (pill amarelo 56px,
 * `border-radius: 999px`) e o slot "Carregando" da barra inferior
 * (linhas 208-215 do `.dc.html`: três pontos de 4px com
 * `animation: dot 1.2s ease-in-out` defasados em 0 / .4s / .8s).
 *
 * Componente sem estado de domínio: recebe tudo por props.
 */

// ---- Variantes ---------------------------------------------------------------

export type VarianteBotao = 'primario' | 'sucesso' | 'escuro' | 'contorno';

type Paleta = {
  fundo: string;
  /**
   * Cor de fundo no estado pressionado. Quando ausente, o pressed é
   * simulado com opacidade (não há token escurecido para a variante).
   */
  fundoPressionado?: string;
  texto: string;
  borda?: string;
};

const PALETAS: Record<VarianteBotao, Paleta> = {
  /** Ação primária — pill amarelo (`Conectar`, `Aceitar`, `Enviar`). */
  primario: {
    fundo: cores.amarelo500,
    fundoPressionado: cores.amarelo600,
    texto: cores.neutro900,
  },
  /** Ação de avanço da corrida — "Iniciar viagem" (ver B08). */
  sucesso: {
    fundo: cores.sucesso500,
    texto: cores.neutro900,
  },
  /** Ação sobre fundo claro que precisa de contraste forte. */
  escuro: {
    fundo: cores.sheetFundo,
    texto: cores.neutro0,
  },
  /** Ação secundária — pill branco com borda (`Ver perfil público`). */
  contorno: {
    fundo: cores.neutro0,
    texto: cores.neutro900,
    borda: cores.neutro200,
  },
};

/** Altura padrão do botão (DESIGN_SYSTEM.md §3.1). */
export const ALTURA_BOTAO = 56;

/** Escala aplicada no estado pressionado. */
const ESCALA_PRESSIONADO = 0.97;

/**
 * Configuração da mola do feedback de toque (ver `Botao`, mais abaixo).
 * `damping` alto o bastante para não deixar a pill "balançar" de volta —
 * um pill sólido balançando lê como elástico, não como firme — mas
 * `stiffness` alto o suficiente para o aperto entrar rápido, sem parecer
 * lento perto do toque do dedo.
 */
const MOLA_TOQUE = { damping: 18, stiffness: 320, mass: 0.4 };

/**
 * `Pressable` com `style` animável por Reanimated — precisa ser criado uma
 * vez no escopo do módulo. Recriar via `createAnimatedComponent` dentro do
 * corpo de `Botao` geraria um tipo de componente novo a cada render (o React
 * desmontaria e remontaria o Pressable a cada toque, que é o oposto do que
 * este componente quer).
 */
const PressableAnimado = ReanimatedDefault.createAnimatedComponent(Pressable);

// ---- Pontinhos pulsando -------------------------------------------------------

const DURACAO_PULSO = 600;
const DEFASAGEM_PULSO = 400;
const OPACIDADE_MINIMA = 0.25;

export type PontosPulsandoProps = {
  /** Cor dos três pontos. Normalmente a mesma cor do rótulo. */
  cor: string;
  /** Diâmetro de cada ponto. Padrão 4 (valor do protótipo). */
  tamanho?: number;
  estilo?: StyleProp<ViewStyle>;
};

/**
 * Tradução do `@keyframes dot` do protótipo: três pontos que pulsam de
 * opacidade .25 → 1 → .25, defasados em 400ms.
 *
 * Exportado à parte porque a barra inferior (B10) usa o mesmo indicador sem
 * o botão em volta.
 */
export function PontosPulsando({ cor, tamanho = 4, estilo }: PontosPulsandoProps) {
  const valores = useRef([0, 1, 2].map(() => new Animated.Value(OPACIDADE_MINIMA))).current;

  useEffect(() => {
    const animacoes = valores.map((valor, indice) =>
      Animated.sequence([
        // O delay fica FORA do loop para não alterar a duração do ciclo:
        // cada ponto entra em fase 400ms depois do anterior e daí em diante
        // todos repetem no mesmo período de 1200ms.
        Animated.delay(indice * DEFASAGEM_PULSO),
        Animated.loop(
          Animated.sequence([
            Animated.timing(valor, {
              toValue: 1,
              duration: DURACAO_PULSO,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(valor, {
              toValue: OPACIDADE_MINIMA,
              duration: DURACAO_PULSO,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ),
      ]),
    );

    animacoes.forEach((animacao) => animacao.start());

    return () => {
      animacoes.forEach((animacao) => animacao.stop());
      valores.forEach((valor) => valor.setValue(OPACIDADE_MINIMA));
    };
  }, [valores]);

  return (
    <View style={[estilos.pontos, estilo]}>
      {valores.map((valor, indice) => (
        <Animated.View
          key={indice}
          style={{
            width: tamanho,
            height: tamanho,
            borderRadius: raioPill,
            backgroundColor: cor,
            opacity: valor,
          }}
        />
      ))}
    </View>
  );
}

// ---- Botão --------------------------------------------------------------------

export type BotaoProps = {
  rotulo: string;
  onPress?: () => void;
  /** Paleta do botão. Padrão `primario` (amarelo). */
  variante?: VarianteBotao;
  /** Mostra o rótulo + três pontinhos pulsando e bloqueia o toque. */
  carregando?: boolean;
  /** Fundo `neutro200` e texto `neutro400`; bloqueia o toque. */
  desabilitado?: boolean;
  /** Quando `false`, o botão encolhe para o conteúdo. Padrão `true`. */
  larguraTotal?: boolean;
  altura?: number;
  estilo?: StyleProp<ViewStyle>;
  estiloRotulo?: StyleProp<TextStyle>;
  /** Rótulo de acessibilidade quando o texto visível não basta. */
  rotuloAcessibilidade?: string;
  testID?: string;
};

export function Botao({
  rotulo,
  onPress,
  variante = 'primario',
  carregando = false,
  desabilitado = false,
  larguraTotal = true,
  altura = ALTURA_BOTAO,
  estilo,
  estiloRotulo,
  rotuloAcessibilidade,
  testID,
}: BotaoProps) {
  const paleta = PALETAS[variante];
  const bloqueado = desabilitado || carregando;

  const corFundo = desabilitado ? cores.neutro200 : paleta.fundo;
  const corTexto = desabilitado ? cores.neutro400 : paleta.texto;
  const corBorda = desabilitado ? cores.neutro200 : paleta.borda;

  // Substitui o antigo `transform` calculado dentro da função de `style` do
  // Pressable (que trocava a escala de 1 → 0.97 de um quadro para o outro,
  // sem transição nenhuma). Uma mola na UI thread entra e sai suave mesmo
  // com a JS thread ocupada — e não depende do `pressed` do Pressable, então
  // rastreamos o estado à mão em `onPressIn`/`onPressOut` para reaproveitar
  // no fundo/borda abaixo.
  const [pressionado, setPressionado] = useState(false);
  const escala = useSharedValue(1);

  const aoPressionar = useCallback(() => {
    setPressionado(true);
    escala.value = withSpring(ESCALA_PRESSIONADO, MOLA_TOQUE);
  }, [escala]);

  const aoSoltar = useCallback(() => {
    setPressionado(false);
    escala.value = withSpring(1, MOLA_TOQUE);
  }, [escala]);

  const estiloEscala = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));

  const ativoPressionado = pressionado && !bloqueado;

  return (
    <PressableAnimado
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessibilidade ?? rotulo}
      accessibilityState={{ disabled: desabilitado, busy: carregando }}
      disabled={bloqueado}
      onPress={onPress}
      onPressIn={aoPressionar}
      onPressOut={aoSoltar}
      testID={testID}
      style={[
        estilos.botao,
        larguraTotal ? estilos.larguraTotal : null,
        {
          height: altura,
          backgroundColor:
            ativoPressionado && paleta.fundoPressionado ? paleta.fundoPressionado : corFundo,
          borderWidth: corBorda ? 1 : 0,
          borderColor: corBorda ?? 'transparent',
          // Variantes sem token escurecido usam opacidade para o feedback.
          opacity: ativoPressionado && !paleta.fundoPressionado ? 0.85 : 1,
        },
        estiloEscala,
        estilo,
      ]}
    >
      <Text style={[tipografia.labelBtn, { color: corTexto }, estiloRotulo]} numberOfLines={1}>
        {rotulo}
      </Text>
      {carregando ? <PontosPulsando cor={corTexto} estilo={estilos.pontosBotao} /> : null}
    </PressableAnimado>
  );
}

const estilos = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raioPill,
    paddingHorizontal: 24,
  },
  larguraTotal: {
    alignSelf: 'stretch',
  },
  pontos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pontosBotao: {
    marginLeft: 8,
  },
});
