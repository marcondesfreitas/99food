/**
 * PainelStatus — bottom sheet branco exibido durante a corrida.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `emCorrida`,
 * mais os valores derivados em `renderVals` (`.design-import/logic.js` 492-508):
 *
 *   alturaSheet   = snap === 0 ? 150 : snap === 1 ? 330 : 470
 *   alternarSnap  = snap => (snap + 1) % 3
 *   rotuloStatus  = INDO_BUSCAR ? 'A caminho' : AGUARDANDO ? 'No local' : 'Em viagem'
 *   rotuloTrecho  = EM_VIAGEM ? 'Destino' : 'Embarque'
 *   rotuloBotao   = AGUARDANDO ? 'Iniciar viagem' : 'Cheguei'
 *
 * A altura anima com `transition: height 260ms cubic-bezier(.2,.8,.2,1)` no
 * protótipo; aqui é `withTiming` sobre `height` (ver "Notas de tradução" do
 * bloco B08: animar `height` é aceitável neste protótipo).
 *
 * Apresentacional: recebe `corrida`/`corridaStatus`/`snap` e callbacks por
 * props, não lê stores.
 */

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ColorValue } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Corrida, StatusCorrida } from '@/state/corridaStore';
import { cores } from '@/tema/cores';
import { raioCard, raioPill, raioSheet } from '@/tema/espacamento';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

import { BotaoDeslizarFinalizar } from './BotaoDeslizarFinalizar';

/** `alturaSheet` — logic.js linha 492. */
export const ALTURAS_SNAP = [150, 330, 470] as const;
export type SnapPainel = 0 | 1 | 2;

/** `transition: height 260ms cubic-bezier(.2,.8,.2,1)`. */
const DUR_SNAP = 260;
const EASE_SNAP = Easing.bezier(0.2, 0.8, 0.2, 1);

/** `animation: crossfade 200ms ease-out both`. */
const DUR_CROSSFADE = 200;

export type VariantePainel = 'andando' | 'botao' | 'deslizar';

export type PainelStatusProps = {
  corrida: Corrida;
  corridaStatus: StatusCorrida;
  snap: SnapPainel;
  onAlternarSnap: () => void;
  /**
   * - `'andando'`: texto cinza com pontinhos pulsando, sem interação
   *   (`botaoAndando` — indo buscar / em viagem, sem chegada);
   * - `'botao'`: "Cheguei" (amarelo) ou "Iniciar viagem" (verde);
   * - `'deslizar'`: `BotaoDeslizarFinalizar` (só em `EM_VIAGEM`).
   */
  variante: VariantePainel;
  /** `avancarCorrida` (variante `botao`) / `finalizar` (variante `deslizar`). */
  onAvancar: () => void;
  /** `categoriaAtiva` — ex.: "99Moto". Vem do veículo ativo (motoristaStore). */
  categoria?: string;
  /** Sobrescreve o rótulo derivado de `corridaStatus` (variante `botao`). */
  rotulo?: string;
  /** Sobrescreve a cor derivada de `corridaStatus` (variante `botao`). */
  cor?: ColorValue;
  onLigar?: () => void;
  onMensagem?: () => void;
  onCancelar?: () => void;
};

export function PainelStatus({
  corrida,
  corridaStatus,
  snap,
  onAlternarSnap,
  variante,
  onAvancar,
  categoria = '99Moto',
  rotulo,
  cor,
  onLigar,
  onMensagem,
  onCancelar,
}: PainelStatusProps) {
  const emViagem = corridaStatus === 'EM_VIAGEM';

  // ---- Altura / snaps ----------------------------------------------------
  const altura = useSharedValue<number>(ALTURAS_SNAP[snap]);
  useEffect(() => {
    altura.value = withTiming(ALTURAS_SNAP[snap], {
      duration: DUR_SNAP,
      easing: EASE_SNAP,
    });
    return () => cancelAnimation(altura);
  }, [altura, snap]);

  const estiloSheet = useAnimatedStyle(() => ({ height: altura.value }));

  // ---- Valores derivados (renderVals) ------------------------------------
  const rotuloStatus =
    corridaStatus === 'INDO_BUSCAR' ? 'A caminho' : corridaStatus === 'AGUARDANDO' ? 'No local' : 'Em viagem';
  const rotuloTrecho = emViagem ? 'Destino' : 'Embarque';
  const enderecoTrecho = emViagem ? corrida.enderecoDestino : corrida.enderecoOrigem;
  const rotuloAndando = emViagem ? 'Em viagem' : 'A caminho da origem';
  const rotuloBotao = rotulo ?? (corridaStatus === 'AGUARDANDO' ? 'Iniciar viagem' : 'Cheguei');
  const corBotao = cor ?? (corridaStatus === 'AGUARDANDO' ? cores.sucesso500 : cores.amarelo500);
  const corTextoBotao = corridaStatus === 'AGUARDANDO' ? cores.neutro0 : cores.neutro900;

  return (
    <Animated.View style={[estilos.sheet, estiloSheet]}>
      {/* Alça — alterna o snap (0 → 1 → 2 → 0). */}
      <Pressable
        onPress={onAlternarSnap}
        accessibilityRole="button"
        accessibilityLabel="Alternar altura do painel"
        style={estilos.areaAlca}
      >
        <View style={estilos.alca} />
      </Pressable>

      {/* Passageiro + badge de status */}
      <View style={estilos.cabecalho}>
        <View style={estilos.avatar}>
          <Text style={estilos.iniciais}>{corrida.iniciais}</Text>
        </View>
        <View style={estilos.cabecalhoTextos}>
          <Text style={estilos.nome} numberOfLines={1}>
            {corrida.nome}
          </Text>
          <Text style={estilos.subtitulo} numberOfLines={1}>
            ★ {corrida.nota} · {categoria}
          </Text>
        </View>
        <View style={[estilos.badge, emViagem ? estilos.badgeViagem : estilos.badgeEspera]}>
          <Text style={[estilos.badgeTexto, emViagem ? estilos.badgeTextoViagem : estilos.badgeTextoEspera]}>
            {rotuloStatus}
          </Text>
        </View>
      </View>

      {/* Trecho atual */}
      <View style={estilos.trecho}>
        <View
          style={[estilos.pontoTrecho, emViagem ? estilos.pontoDestino : estilos.pontoOrigem]}
        />
        <View style={estilos.trechoTextos}>
          <Text style={estilos.trechoRotulo}>{rotuloTrecho}</Text>
          <Text style={estilos.trechoEndereco}>{enderecoTrecho}</Text>
        </View>
      </View>

      {/* Ações */}
      <View style={estilos.acoes}>
        <Pressable
          onPress={onLigar}
          accessibilityRole="button"
          accessibilityLabel="Ligar para o passageiro"
          style={({ pressed }) => [estilos.acao, pressed && estilos.pressionado]}
        >
          <Text style={estilos.acaoIcone}>✆</Text>
        </Pressable>
        <Pressable
          onPress={onMensagem}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem ao passageiro"
          style={({ pressed }) => [estilos.acao, pressed && estilos.pressionado]}
        >
          <Text style={estilos.acaoIcone}>✉</Text>
        </Pressable>
        <Pressable
          onPress={onCancelar}
          accessibilityRole="button"
          accessibilityLabel="Cancelar corrida"
          style={({ pressed }) => [estilos.acao, pressed && estilos.pressionado]}
        >
          <Text style={estilos.acaoCancelar}>Cancelar</Text>
        </Pressable>
      </View>

      {/* Botão de ação principal — 3 formas */}
      {variante === 'andando' ? (
        <Animated.View
          key="andando"
          entering={FadeIn.duration(DUR_CROSSFADE)}
          style={estilos.andando}
        >
          <Text style={estilos.andandoTexto}>{rotuloAndando}</Text>
          <PontosPulsando />
        </Animated.View>
      ) : variante === 'deslizar' ? (
        <Animated.View key="deslizar" entering={FadeIn.duration(DUR_CROSSFADE)}>
          <BotaoDeslizarFinalizar onFinalizar={onAvancar} />
        </Animated.View>
      ) : (
        <Animated.View key={`botao-${corridaStatus}`} entering={FadeIn.duration(DUR_CROSSFADE)}>
          <Pressable
            onPress={onAvancar}
            accessibilityRole="button"
            accessibilityLabel={rotuloBotao}
            style={({ pressed }) => [
              estilos.botao,
              { backgroundColor: corBotao },
              pressed && estilos.botaoPressionado,
            ]}
          >
            <Text style={[estilos.botaoTexto, { color: corTextoBotao }]}>{rotuloBotao}</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Pontinhos pulsando — `@keyframes dot { 0%,100% { opacity:.25 } 50% { opacity:1 } }`
// com `1.2s ease-in-out infinite` e delays de 0 / .4s / .8s.
// ---------------------------------------------------------------------------

const DUR_PONTO = 1200;
const OPACIDADE_MIN = 0.25;

function PontosPulsando() {
  return (
    <View style={estilos.pontos}>
      <Ponto atraso={0} />
      <Ponto atraso={400} />
      <Ponto atraso={800} />
    </View>
  );
}

function Ponto({ atraso }: { atraso: number }) {
  const opacidade = useSharedValue(OPACIDADE_MIN);

  useEffect(() => {
    opacidade.value = withDelay(
      atraso,
      withRepeat(
        withSequence(
          withTiming(1, { duration: DUR_PONTO / 2, easing: Easing.inOut(Easing.ease) }),
          withTiming(OPACIDADE_MIN, { duration: DUR_PONTO / 2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(opacidade);
  }, [opacidade, atraso]);

  const estilo = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  return <Animated.View style={[estilos.ponto, estilo]} />;
}

const estilos = StyleSheet.create({
  pressionado: { opacity: 0.7 },

  // ---- Sheet -------------------------------------------------------------
  // left:0; right:0; bottom:0; radius 20 20 0 0; padding 10px 16px 30px
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: raioSheet,
    borderTopRightRadius: raioSheet,
    backgroundColor: cores.neutro0,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 30,
    // box-shadow: 0 -8px 24px rgba(0,0,0,.18)
    shadowColor: cores.neutro900,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },

  // ---- Alça --------------------------------------------------------------
  areaAlca: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: 'center',
  },
  alca: {
    width: 40,
    height: 4,
    borderRadius: raioPill,
    backgroundColor: cores.neutro200,
  },

  // ---- Cabeçalho ---------------------------------------------------------
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: raioPill,
    backgroundColor: cores.sheetFundo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: {
    fontFamily: familiaInter.bold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: cores.neutro0,
  },
  cabecalhoTextos: { flex: 1 },
  nome: {
    ...tipografia.corpoLg,
    color: cores.neutro900,
  },
  subtitulo: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
    ...numeroTabular,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: raioPill,
  },
  badgeViagem: { backgroundColor: cores.sheetFundo },
  badgeEspera: { backgroundColor: cores.amarelo100 },
  badgeTexto: {
    ...tipografia.labelChip,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
  },
  badgeTextoViagem: { color: cores.neutro0 },
  // `#7a6a00` não existe em @/tema/cores — `alerta700` é o token escuro/quente
  // mais próximo.
  badgeTextoEspera: { color: cores.alerta700 },

  // ---- Trecho atual ------------------------------------------------------
  trecho: {
    marginTop: 14,
    padding: 12,
    borderRadius: raioCard,
    backgroundColor: cores.neutro50,
    flexDirection: 'row',
    gap: 11,
  },
  pontoTrecho: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: raioPill,
  },
  pontoOrigem: { backgroundColor: cores.sucesso500 },
  // `#EE542C` só existe como `coresMapa.pinDestino` (paleta cartográfica);
  // `alerta500` é o token de UI mais próximo.
  pontoDestino: { backgroundColor: cores.alerta500 },
  trechoTextos: { flex: 1 },
  trechoRotulo: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  trechoEndereco: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro900,
  },

  // ---- Ações -------------------------------------------------------------
  acoes: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  acao: {
    flex: 1,
    height: 46,
    borderRadius: raioCard,
    borderWidth: 1,
    borderColor: cores.neutro200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoIcone: {
    fontFamily: familiaInter.regular,
    fontSize: 16,
    lineHeight: 22,
    color: cores.neutro900,
  },
  acaoCancelar: {
    ...tipografia.corpoSm,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.rosa500,
  },

  // ---- Variante "andando" ------------------------------------------------
  // `#F5F3F6` não existe em @/tema/cores — `neutro50` é o mais próximo.
  andando: {
    marginTop: 16,
    width: '100%',
    height: 56,
    borderRadius: raioPill,
    backgroundColor: cores.neutro50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  andandoTexto: {
    ...tipografia.corpoLg,
    color: cores.neutro400,
  },
  pontos: {
    flexDirection: 'row',
    gap: 3,
  },
  ponto: {
    width: 4,
    height: 4,
    borderRadius: raioPill,
    backgroundColor: cores.neutro400,
  },

  // ---- Variante "botao" --------------------------------------------------
  botao: {
    marginTop: 16,
    width: '100%',
    height: 56,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPressionado: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  botaoTexto: {
    ...tipografia.labelBtn,
  },
});

export default PainelStatus;
