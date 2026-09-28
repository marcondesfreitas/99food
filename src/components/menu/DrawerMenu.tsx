import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iniciaisDe } from '@/components/ui/FotoPerfil';
import { useMotoristaStore } from '@/state/motoristaStore';
import { cores } from '@/tema/cores';
import { espacamento, raioPill, sombraFlutuante } from '@/tema/espacamento';
import { numeroTabular, tipografia } from '@/tema/tipografia';

/**
 * DrawerMenu — menu lateral esquerdo que desliza sobre o mapa (B24).
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html` linhas 344-387
 * (bloco `drawerEsq`) + `.design-import/logic.js` (`drawerEsq`, `abrirEsq`,
 * `fecharDrawer`, `pillFase`, `irCentral`/`irPerfil`/`irVeiculos`/`irConta`).
 * Especificação de comportamento: DESIGN_SYSTEM.md §4.3 e §5.
 *
 * Componente autocontido e sem navegação própria: quem monta a tela (B11)
 * controla `visivel` e liga cada callback à navegação real (B25).
 *
 * Notas de tradução Web → RN:
 * - O protótipo usa `position: absolute; inset: 0` dentro do frame do celular.
 *   Aqui é uma `View` absoluta com `zIndex`/`elevation` altos, e NÃO um
 *   `Modal`: o `Modal` do RN cria uma janela nativa separada que não herda o
 *   `GestureHandlerRootView` da árvore, o que quebraria o gesto de arrastar
 *   e a `ScrollView` do gesture-handler no Android.
 * - `width: 332px` (de um frame de 390) vira `85%` da largura real da janela,
 *   com teto para não virar um painel gigante em tablet.
 */

// ---- Constantes de layout e movimento -----------------------------------------

/** 332 / 390 do protótipo. */
const FRACAO_LARGURA = 0.85;

/** Teto para telas largas (tablet) — o painel não deve virar meia tela gigante. */
const LARGURA_MAXIMA = 360;

/** DESIGN_SYSTEM.md §5: "Drawer abre/fecha — 280ms — ease-out". */
const DURACAO_ANIMACAO = 280;

/** Equivalente Reanimated do `ease-out` do CSS (`cubic-bezier(0,0,.58,1)`). */
const CURVA_SAIDA = Easing.bezier(0, 0, 0.58, 1);

const CONFIG_ANIMACAO = {
  duration: DURACAO_ANIMACAO,
  easing: CURVA_SAIDA,
} as const;

/** Arrastar além de 40% da largura do painel fecha ao soltar. */
const LIMIAR_FECHAR = 0.4;

/** Velocidade (px/s) para a esquerda que fecha mesmo sem atingir o limiar. */
const VELOCIDADE_FECHAR = -600;

/**
 * Tolerâncias do gesto: só ativa depois de 12px na horizontal e desiste se o
 * dedo andar 12px na vertical antes disso — assim a lista continua rolando.
 */
const ATIVACAO_HORIZONTAL = 12;
const FALHA_VERTICAL = 12;

/** Altura mínima de alvo de toque dos itens da lista. */
const ALTURA_ITEM = 48;

/** Avatar do topo (protótipo: 76px). */
const TAMANHO_AVATAR = 76;

/** Respiro acima do avatar somado ao inset de status bar (protótipo: 71px). */
const RESPIRO_TOPO = 24;

// ---- Itens da lista -----------------------------------------------------------

/** Chaves estáveis dos itens — quem consome o componente identifica por elas. */
export type ChaveItemMenu =
  | 'ganhos'
  | 'recompensas'
  | 'indicar'
  | 'ajuda'
  | 'notificacoes'
  | 'educacao'
  | 'loja'
  | 'veiculos'
  | 'horasDirigidas';

type ItemMenu = {
  chave: ChaveItemMenu;
  rotulo: string;
  /** Mostra o chevron "›" à direita (item que empurra outra tela). */
  chevron?: boolean;
  /** Mostra a bolinha vermelha de novidade à direita. */
  novidade?: boolean;
};

const ITENS: readonly ItemMenu[] = [
  { chave: 'ganhos', rotulo: 'Ganhos' },
  { chave: 'recompensas', rotulo: 'Recompensas' },
  { chave: 'indicar', rotulo: 'Indique um amigo' },
  { chave: 'ajuda', rotulo: 'Central de Ajuda' },
  { chave: 'notificacoes', rotulo: 'Notificações' },
  { chave: 'educacao', rotulo: 'Central de Educação', novidade: true },
  { chave: 'loja', rotulo: 'Loja' },
  { chave: 'veiculos', rotulo: 'Veículos', chevron: true },
  { chave: 'horasDirigidas', rotulo: 'Horas Dirigidas', chevron: true },
];

// ---- Props --------------------------------------------------------------------

export type DrawerMenuProps = {
  /** Quem controla a abertura é a tela (B11). */
  visivel: boolean;
  /** Chamado ao tocar no overlay ou ao arrastar o painel para fora. */
  onFechar: () => void;

  /**
   * Nome exibido no cabeçalho. Por padrão vem de `motoristaStore.contaNome`.
   * Nunca hardcodar o nome do protótipo aqui.
   */
  nome?: string;
  /** Nota já formatada em pt-BR. Padrão `5,00`. */
  nota?: string;
  /** URI da foto de perfil, quando existir. */
  fotoUri?: string;

  /**
   * Taxa de aceitação em % inteiro. Padrão 0.
   *
   * DESVIO DELIBERADO do protótipo, a pedido: `logic.js` fixava 92. Zerado
   * para bater com o resto do perfil, que agora representa uma conta nova, sem
   * histórico de corridas avaliadas.
   */
  taxaAceitacao?: number;
  /** Taxa de finalização em % inteiro. Padrão 0 (protótipo: 78 — ver acima). */
  taxaFinalizacao?: number;

  /** Toque no avatar → Perfil (B20). */
  onIrPerfil?: () => void;
  /** Toque em qualquer item da lista. Recebe a chave do item. */
  onSelecionarItem?: (chave: ChaveItemMenu) => void;

  /** Atalhos nomeados, equivalentes a filtrar `onSelecionarItem`. */
  onIrGanhos?: () => void;
  onIrVeiculos?: () => void;
  onIrHorasDirigidas?: () => void;

  estilo?: StyleProp<ViewStyle>;
  testID?: string;
};

// ---- Auxiliares ---------------------------------------------------------------


/** "MOTO" → "Moto" (logic.js linha 514: `pillFase`). */
function tipoLegivel(tipo: string): string {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase();
}

/**
 * Chevron "›" do protótipo: um quadrado sem fundo com apenas as bordas direita
 * e inferior, girado -45°. Traduz literalmente o `<span>` de 7px do `.dc.html`.
 */
function Chevron() {
  return <View style={estilos.chevron} />;
}

// ---- Componente ---------------------------------------------------------------

export function DrawerMenu({
  visivel,
  onFechar,
  nome,
  nota = '5,00',
  fotoUri,
  taxaAceitacao = 0,
  taxaFinalizacao = 0,
  onIrPerfil,
  onSelecionarItem,
  onIrGanhos,
  onIrVeiculos,
  onIrHorasDirigidas,
  estilo,
  testID,
}: DrawerMenuProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const largura = Math.round(Math.min(width * FRACAO_LARGURA, LARGURA_MAXIMA));

  const contaNome = useMotoristaStore((s) => s.contaNome);
  const veiculos = useMotoristaStore((s) => s.veiculos);
  const veiculoAtivo = useMotoristaStore((s) => s.veiculoAtivo);
  const foto = useMotoristaStore((s) => s.foto);
  const fotoSalva = useMotoristaStore((s) => s.fotoUri);

  const nomeExibido = nome ?? contaNome;
  // A prop existe para o Storybook/testes; o padrão é sempre a foto da store.
  const fotoExibida = fotoUri ?? fotoSalva;
  const temFoto = foto !== 'vazio';

  /** `pillFase` do protótipo — ex.: "Moto • Fase 1". */
  const pillFase = useMemo(() => {
    const veiculo = veiculos[veiculoAtivo] ?? veiculos[0];
    return `${tipoLegivel(veiculo?.tipo ?? 'MOTO')} • Fase 1`;
  }, [veiculos, veiculoAtivo]);

  // ---- Animação ---------------------------------------------------------------

  /**
   * `montado` sobrevive ao `visivel: false` até a animação de saída terminar —
   * sem isso o painel sumiria de uma vez em vez de deslizar para fora.
   */
  const [montado, setMontado] = useState(visivel);

  /** Deslocamento horizontal do painel: `-largura` (fechado) → `0` (aberto). */
  const deslocamento = useSharedValue(visivel ? 0 : -largura);

  /** Posição do painel no instante em que o dedo encostou. */
  const deslocamentoInicial = useSharedValue(0);

  useEffect(() => {
    if (visivel) setMontado(true);
  }, [visivel]);

  useEffect(() => {
    if (!montado) return;

    if (visivel) {
      deslocamento.value = withTiming(0, CONFIG_ANIMACAO);
      return;
    }

    deslocamento.value = withTiming(-largura, CONFIG_ANIMACAO, (concluiu) => {
      'worklet';
      // Só desmonta se a animação terminou de verdade: se ela foi interrompida
      // por uma reabertura, desmontar aqui apagaria o painel recém-aberto.
      if (concluiu) scheduleOnRN(setMontado, false);
    });
  }, [visivel, montado, largura, deslocamento]);

  const estiloPainel = useAnimatedStyle(() => ({
    transform: [{ translateX: deslocamento.value }],
  }));

  const estiloOverlay = useAnimatedStyle(() => ({
    opacity: interpolate(deslocamento.value, [-largura, 0], [0, 1], Extrapolation.CLAMP),
  }));

  // ---- Gesto de arrastar para fechar -------------------------------------------

  const arrastar = useMemo(
    () =>
      Gesture.Pan()
        // Sem estas tolerâncias o pan roubaria o toque da lista rolável.
        .activeOffsetX([-ATIVACAO_HORIZONTAL, ATIVACAO_HORIZONTAL])
        .failOffsetY([-FALHA_VERTICAL, FALHA_VERTICAL])
        .onBegin(() => {
          deslocamentoInicial.value = deslocamento.value;
        })
        .onUpdate((evento) => {
          // Só arrasta para a esquerda: puxar para a direita não abre além de 0.
          deslocamento.value = Math.min(0, deslocamentoInicial.value + evento.translationX);
        })
        .onEnd((evento) => {
          const passouDoLimiar = deslocamento.value < -largura * LIMIAR_FECHAR;
          const arremessouParaFora = evento.velocityX < VELOCIDADE_FECHAR;

          if (passouDoLimiar || arremessouParaFora) {
            deslocamento.value = withTiming(-largura, CONFIG_ANIMACAO, (concluiu) => {
              'worklet';
              // Avisa a tela; ela baixa `visivel` e o efeito acima desmonta.
              if (concluiu) scheduleOnRN(onFechar);
            });
            return;
          }

          deslocamento.value = withTiming(0, CONFIG_ANIMACAO);
        }),
    [largura, deslocamento, deslocamentoInicial, onFechar],
  );

  // ---- Navegação ---------------------------------------------------------------

  const aoTocarItem = (chave: ChaveItemMenu) => {
    onSelecionarItem?.(chave);
    if (chave === 'ganhos') onIrGanhos?.();
    if (chave === 'veiculos') onIrVeiculos?.();
    if (chave === 'horasDirigidas') onIrHorasDirigidas?.();
  };

  if (!montado) return null;

  return (
    <View style={[estilos.container, estilo]} testID={testID}>
      <Animated.View style={[estilos.overlay, estiloOverlay]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
          onPress={onFechar}
          style={estilos.areaOverlay}
          testID="drawer-menu-overlay"
        />
      </Animated.View>

      <GestureDetector gesture={arrastar}>
        <Animated.View
          accessibilityViewIsModal
          style={[
            estilos.painel,
            sombraFlutuante,
            { width: largura, paddingTop: insets.top + RESPIRO_TOPO },
            estiloPainel,
          ]}
        >
          <ScrollView
            contentContainerStyle={[
              estilos.conteudo,
              { paddingBottom: insets.bottom + espacamento.telaLateral },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* ---- Cabeçalho: avatar, nome e pill de fase ---- */}
            <View style={estilos.cabecalho}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Abrir perfil de ${nomeExibido}`}
                onPress={onIrPerfil}
                style={({ pressed }) => [
                  estilos.avatar,
                  { backgroundColor: temFoto ? cores.neutro200 : cores.sheetFundo },
                  pressed ? estilos.pressionado : null,
                ]}
                testID="drawer-menu-avatar"
              >
                {temFoto && fotoExibida ? (
                  <Image source={{ uri: fotoExibida }} style={estilos.avatarImagem} />
                ) : temFoto ? null : (
                  <Text style={estilos.avatarIniciais}>{iniciaisDe(nomeExibido)}</Text>
                )}
              </Pressable>

              <Text style={estilos.nome} numberOfLines={1}>
                {`${nomeExibido} · ${nota} ★`}
              </Text>

              <View style={estilos.pill}>
                <Text style={estilos.pillTexto}>{pillFase}</Text>
              </View>
            </View>

            {/* ---- Métricas ---- */}
            <View style={estilos.metricas}>
              <View style={estilos.metrica}>
                <Text style={estilos.metricaValor}>{`${taxaAceitacao}%`}</Text>
                <Text style={estilos.metricaRotulo}>Taxa de Aceitação</Text>
              </View>
              {/* Cor diferente é intencional: sinaliza a métrica em risco
                  (DESIGN_SYSTEM.md §4.3). */}
              <View style={estilos.metrica}>
                <Text style={[estilos.metricaValor, estilos.metricaRisco]}>
                  {`${taxaFinalizacao}%`}
                </Text>
                <Text style={[estilos.metricaRotulo, estilos.metricaRisco]}>
                  Taxa de Finalização
                </Text>
              </View>
            </View>

            <View style={estilos.divisor} />

            {/* ---- Lista de itens ---- */}
            <View style={estilos.lista}>
              {ITENS.map((item) => (
                <Pressable
                  key={item.chave}
                  accessibilityRole="button"
                  accessibilityLabel={item.rotulo}
                  onPress={() => aoTocarItem(item.chave)}
                  style={({ pressed }) => [estilos.item, pressed ? estilos.pressionado : null]}
                  testID={`drawer-menu-item-${item.chave}`}
                >
                  <Text style={estilos.itemRotulo}>{item.rotulo}</Text>
                  {item.novidade ? <View style={estilos.novidade} /> : null}
                  {item.chevron ? <Chevron /> : null}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ---- Estilos ------------------------------------------------------------------

const estilos = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    // Fica acima do mapa, dos FABs e da barra inferior.
    zIndex: 40,
    elevation: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: cores.overlayDrawer,
  },
  areaOverlay: {
    flex: 1,
  },
  painel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: cores.neutro0,
  },
  conteudo: {
    paddingHorizontal: 20,
  },

  // Cabeçalho
  cabecalho: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 18,
  },
  avatar: {
    width: TAMANHO_AVATAR,
    height: TAMANHO_AVATAR,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImagem: {
    width: '100%',
    height: '100%',
  },
  avatarIniciais: {
    ...tipografia.tituloLg,
    color: cores.neutro0,
  },
  nome: {
    ...tipografia.tituloMd,
    color: cores.neutro900,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: raioPill,
    backgroundColor: cores.sheetFundo,
  },
  pillTexto: {
    ...tipografia.labelChip,
    color: cores.neutro0,
  },

  // Métricas
  metricas: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 18,
  },
  metrica: {
    flex: 1,
  },
  metricaValor: {
    ...tipografia.tituloLg,
    ...numeroTabular,
    color: cores.neutro900,
  },
  metricaRotulo: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  /** Métrica em risco — valor E rótulo em rosa (DESIGN_SYSTEM.md §4.3). */
  metricaRisco: {
    color: cores.rosa500,
  },

  divisor: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: cores.neutro100,
    marginBottom: 22,
  },

  // Lista
  lista: {
    // O gap de 30 é a característica visual mais marcante do drawer.
    gap: espacamento.menuGap,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: ALTURA_ITEM,
  },
  itemRotulo: {
    ...tipografia.corpoLg,
    color: cores.neutro900,
    flexShrink: 1,
  },
  novidade: {
    width: 8,
    height: 8,
    borderRadius: raioPill,
    backgroundColor: cores.erro500,
  },
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: cores.neutro400,
    transform: [{ rotate: '-45deg' }],
  },

  pressionado: {
    opacity: 0.6,
  },
});

export default DrawerMenu;
