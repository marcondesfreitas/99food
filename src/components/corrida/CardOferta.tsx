/**
 * CardOferta — o bottom sheet preto que aparece quando chega uma corrida.
 *
 * `DESIGN_SYSTEM.md` §3.4 chama este de "componente mais importante" do app.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `temOferta`.
 * Campos vindos de `gerarOferta()` (`.design-import/logic.js` 317-339), já
 * tipados em `@/state/corridaStore` (`Oferta`).
 *
 * Animações do protótipo traduzidas para Reanimated 4:
 * - `riseup 320ms cubic-bezier(.2,.8,.2,1)` → `withTiming` em `translateY`
 *   (de +altura do sheet até 0) ao montar;
 * - `shrink {{duracao}}s linear forwards` → `withTiming(0, linear)` em
 *   `scaleX` da barra verde, com `transformOrigin: 'left'`;
 * - `pulseval 900ms ease-in-out infinite` (só quando `fase === 'expirando'`)
 *   → `withRepeat(withSequence(...))` em `scale` do valor.
 *
 * Apresentacional: recebe `oferta` e callbacks por props, não lê stores.
 */

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Oferta } from '@/state/corridaStore';
import { cores } from '@/tema/cores';
import { raioPill, sombraFlutuante } from '@/tema/espacamento';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

import { SeloDinamico } from './SeloDinamico';

/** `height: 412px` no protótipo. */
const ALTURA_SHEET = 412;
/**
 * `border-radius: 24px 24px 0 0` no protótipo `temOferta`. Note que é 24 e
 * não `raioSheet` (20) — o sheet da corrida (PainelStatus) é que usa 20.
 */
const RAIO_TOPO = 24;
/** `padding: 18px 20px 26px`. */
const PAD_TOPO = 18;
const PAD_LATERAL = 20;
const PAD_BASE = 26;

/** `animation: riseup 320ms cubic-bezier(.2,.8,.2,1) both`. */
const DUR_ENTRADA = 320;
const EASE_ENTRADA = Easing.bezier(0.2, 0.8, 0.2, 1);

export type FaseOferta = 'ativo' | 'expirando';

export type CardOfertaProps = {
  oferta: Oferta;
  /** `duracao` do protótipo (`this.props.duracaoOferta ?? 15`). */
  duracaoSegundos?: number;
  /** `'expirando'` liga o pulse do valor (últimos 3s). */
  fase?: FaseOferta;
  onAceitar: () => void;
  onRecusar: () => void;
  /** Número exibido no círculo à direita dos chips. Protótipo: `1`. */
  numero?: number;
};

export function CardOferta({
  oferta,
  duracaoSegundos = 15,
  fase = 'ativo',
  onAceitar,
  onRecusar,
  numero = 1,
}: CardOfertaProps) {
  // ---- riseup ------------------------------------------------------------
  const entradaY = useSharedValue(ALTURA_SHEET);
  useEffect(() => {
    entradaY.value = ALTURA_SHEET;
    entradaY.value = withTiming(0, { duration: DUR_ENTRADA, easing: EASE_ENTRADA });
    return () => cancelAnimation(entradaY);
  }, [entradaY]);

  const estiloSheet = useAnimatedStyle(() => ({
    transform: [{ translateY: entradaY.value }],
  }));

  // ---- shrink (barra de tempo) -------------------------------------------
  const escalaBarra = useSharedValue(1);
  useEffect(() => {
    escalaBarra.value = 1;
    escalaBarra.value = withTiming(0, {
      duration: Math.max(0, duracaoSegundos) * 1000,
      easing: Easing.linear,
    });
    return () => cancelAnimation(escalaBarra);
    // Reinicia quando muda a oferta ou a duração.
  }, [escalaBarra, duracaoSegundos, oferta]);

  const estiloBarra = useAnimatedStyle(() => ({
    transform: [{ scaleX: escalaBarra.value }],
  }));

  // ---- pulseval (valor, só quando expirando) ------------------------------
  const escalaValor = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(escalaValor);
    if (fase === 'expirando') {
      escalaValor.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 450, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 450, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      escalaValor.value = 1;
    }
    return () => cancelAnimation(escalaValor);
  }, [escalaValor, fase]);

  const estiloValor = useAnimatedStyle(() => ({
    transform: [{ scale: escalaValor.value }],
  }));

  return (
    // `position: absolute; inset: 0; pointer-events: none` — só os filhos
    // recebem toque.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Botão recusar: fora do sheet, topo direito. */}
      <Pressable
        onPress={onRecusar}
        accessibilityRole="button"
        accessibilityLabel="Recusar corrida. Não afeta a taxa de aceitação."
        style={({ pressed }) => [estilos.recusar, pressed && estilos.pressionado]}
      >
        <Text style={estilos.recusarX}>✕</Text>
        <Text style={estilos.recusarTexto}>Não afeta a TA</Text>
      </Pressable>

      {/* O sheet inteiro é clicável para aceitar (`onClick aceitar` no div). */}
      <Animated.View style={[estilos.sheet, estiloSheet]}>
        <Pressable
          onPress={onAceitar}
          accessibilityRole="button"
          accessibilityLabel={`Aceitar corrida de ${oferta.valorFmt}`}
          style={estilos.areaAceitar}
        >
          {/* 1. Chips ------------------------------------------------------ */}
          <View style={estilos.chips}>
            <View style={estilos.chip}>
              <Text style={estilos.chipTexto}>Pgto. no app</Text>
            </View>
            <View style={estilos.chipPrioritario}>
              <Text style={estilos.chipPrioritarioTexto}>Prioritário</Text>
            </View>
            <View style={estilos.espacador} />
            <View style={estilos.numero}>
              <Text style={estilos.numeroTexto}>{numero}</Text>
            </View>
          </View>

          {/* 2. Valor ------------------------------------------------------ */}
          <Animated.Text style={[estilos.valor, estiloValor]}>{oferta.valorFmt}</Animated.Text>

          {/* 3. Por km ----------------------------------------------------- */}
          <Text style={estilos.porKm}>{oferta.porKm}</Text>

          {/* 4. Barra de tempo --------------------------------------------- */}
          <View style={estilos.trilhoBarra}>
            <Animated.View style={[estilos.preenchimentoBarra, estiloBarra]} />
            <Pressable
              onPress={onAceitar}
              accessibilityRole="button"
              accessibilityLabel="Aceitar corrida"
              style={({ pressed }) => [estilos.cadeado, pressed && estilos.pressionado]}
            >
              <View style={estilos.cadeadoArco} />
              <View style={estilos.cadeadoCorpo} />
            </Pressable>
          </View>

          {/* 5. Selo de dinâmico ------------------------------------------- */}
          <SeloDinamico valorFmt={oferta.dinamicoFmt} style={estilos.selo} />

          {/* 6. Credibilidade ---------------------------------------------- */}
          <View style={estilos.credibilidade}>
            <Text style={estilos.estrela}>★</Text>
            <Text style={estilos.nota}>{oferta.nota}</Text>
            <Text style={estilos.credibilidadeTexto}>· {oferta.corridas} corridas ·</Text>
            <Text style={estilos.selinho}>☑</Text>
            <Text style={estilos.credibilidadeTexto}>Perfil Essencial</Text>
          </View>

          {/* 7. Origem e destino ------------------------------------------- */}
          <View style={estilos.trechos}>
            <View style={estilos.trecho}>
              <View style={[estilos.bolinhaTrecho, estilos.bolinhaOrigem]}>
                <Text style={estilos.setaTrecho}>↑</Text>
              </View>
              <View style={estilos.trechoTextos}>
                <Text style={estilos.trechoTempo}>{oferta.tempoOrigem}</Text>
                <Text style={estilos.trechoEndereco}>{oferta.enderecoOrigem}</Text>
              </View>
            </View>
            <View style={estilos.trecho}>
              <View style={[estilos.bolinhaTrecho, estilos.bolinhaDestino]}>
                <Text style={estilos.setaTrecho}>↓</Text>
              </View>
              <View style={estilos.trechoTextos}>
                <Text style={estilos.trechoTempo}>{oferta.tempoDestino}</Text>
                <Text style={estilos.trechoEndereco}>{oferta.enderecoDestino}</Text>
              </View>
            </View>
          </View>

          <Text style={estilos.dica}>Toque no card ou no cadeado para aceitar</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pressionado: { opacity: 0.85 },

  // ---- Botão recusar -----------------------------------------------------
  // right:16; top:71; height:40; padding:0 15px; radius:999; bg #26292E
  recusar: {
    position: 'absolute',
    right: 16,
    top: 71,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    paddingHorizontal: 15,
    borderRadius: raioPill,
    backgroundColor: cores.sheetFundo,
    ...sombraFlutuante,
    shadowOpacity: 0.3,
  },
  recusarX: {
    fontFamily: familiaInter.bold,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: cores.neutro0,
  },
  recusarTexto: {
    fontFamily: familiaInter.semiBold,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '600',
    color: cores.neutro0,
  },

  // ---- Sheet -------------------------------------------------------------
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: ALTURA_SHEET,
    borderTopLeftRadius: RAIO_TOPO,
    borderTopRightRadius: RAIO_TOPO,
    backgroundColor: cores.sheetFundo,
    // box-shadow: 0 -8px 24px rgba(0,0,0,.25)
    ...sombraFlutuante,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  areaAceitar: {
    flex: 1,
    paddingTop: PAD_TOPO,
    paddingHorizontal: PAD_LATERAL,
    paddingBottom: PAD_BASE,
  },

  // ---- Chips -------------------------------------------------------------
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: raioPill,
    // `#454851` não existe em @/tema/cores — `sheetTrilho` é o mais próximo.
    backgroundColor: cores.sheetTrilho,
  },
  chipTexto: {
    ...tipografia.labelChip,
    color: cores.neutro0,
  },
  // `background: #176C4B; color: #65D3A6` — .dc.html linha 242.
  chipPrioritario: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: raioPill,
    backgroundColor: cores.verde700,
  },
  chipPrioritarioTexto: {
    ...tipografia.labelChip,
    color: cores.verde300,
  },
  espacador: { flex: 1 },
  numero: {
    width: 30,
    height: 30,
    borderRadius: raioPill,
    backgroundColor: cores.sheetTrilho,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numeroTexto: {
    fontFamily: familiaInter.bold,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: cores.neutro0,
  },

  // ---- Valor -------------------------------------------------------------
  valor: {
    marginTop: 12,
    ...tipografia.displayXl,
    color: cores.neutro0,
    ...numeroTabular,
    // `transform-origin: left center` do `pulseval`.
    transformOrigin: 'left center',
  },
  porKm: {
    ...tipografia.corpoSm,
    color: cores.sheetTexto2,
    marginTop: 1,
  },

  // ---- Barra de tempo ----------------------------------------------------
  // margin: 16px -20px 0 — a barra sangra até as bordas do sheet.
  trilhoBarra: {
    marginTop: 16,
    marginHorizontal: -PAD_LATERAL,
    height: 5,
    backgroundColor: cores.sheetTrilho,
  },
  preenchimentoBarra: {
    height: 5,
    backgroundColor: cores.sucesso500,
    // `transform-origin: left` do `shrink`.
    transformOrigin: 'left',
  },
  cadeado: {
    position: 'absolute',
    right: 12,
    top: -14,
    width: 34,
    height: 34,
    borderRadius: raioPill,
    backgroundColor: cores.sheetTrilho,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    ...sombraFlutuante,
    shadowOpacity: 0.35,
  },
  // Arco do cadeado: 9×6, borda 2px branca sem a base, cantos superiores 4px.
  cadeadoArco: {
    width: 9,
    height: 6,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: cores.neutro0,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  cadeadoCorpo: {
    width: 13,
    height: 9,
    borderRadius: 2,
    backgroundColor: cores.neutro0,
  },

  // ---- Selo de dinâmico --------------------------------------------------
  selo: { marginTop: 18 },

  // ---- Credibilidade -----------------------------------------------------
  credibilidade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },
  estrela: {
    ...tipografia.corpoSm,
    color: cores.neutro0,
  },
  nota: {
    ...tipografia.corpoSm,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro0,
    ...numeroTabular,
  },
  credibilidadeTexto: {
    ...tipografia.corpoSm,
    color: cores.sheetTexto2,
  },
  selinho: {
    ...tipografia.corpoSm,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.info500,
  },

  // ---- Trechos -----------------------------------------------------------
  trechos: {
    marginTop: 16,
    gap: 13,
  },
  trecho: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bolinhaTrecho: {
    width: 26,
    height: 26,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolinhaOrigem: { backgroundColor: cores.sucesso500 },
  // `#EE542C` do protótipo só existe como `coresMapa.pinDestino` (cartográfico);
  // `alerta500` é o token de UI mais próximo.
  bolinhaDestino: { backgroundColor: cores.alerta500 },
  setaTrecho: {
    fontFamily: familiaInter.bold,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: cores.neutro0,
  },
  trechoTextos: { flex: 1 },
  trechoTempo: {
    ...tipografia.corpoLg,
    color: cores.neutro0,
    ...numeroTabular,
  },
  trechoEndereco: {
    ...tipografia.corpoMd,
    color: cores.sheetTexto2,
  },

  // ---- Dica --------------------------------------------------------------
  // `#6d6f76` não existe em @/tema/cores — `neutro600` é o mais próximo.
  dica: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: familiaInter.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: cores.neutro600,
  },
});

export default CardOferta;
