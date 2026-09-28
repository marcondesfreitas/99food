/**
 * B17 — Central de Ganhos.
 *
 * Tela "empurrada" a partir do pill de ganhos do header do mapa ou do item
 * "Ganhos" do drawer: total do dia decomposto em base × dinâmico, atalhos de
 * "Meus recursos", gráfico de barras por hora e histórico de corridas do dia.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaCentral`
 * (linhas 644-750) e `.design-import/logic.js`:
 * - `totalBase`/`horas`/`maxHora` linhas 414-416
 * - `ganhosFmt`/`baseFmt`/`dinamicoFmt`/`pctBase`/`pctDin` linhas 486-488
 * - `historico`/`semHistorico`/`totalCorridas`/`grafico` linhas 559-564
 *
 * MARCA (PLANO_IMPLEMENTACAO_V6.md §5 — "RotaFácil"/"RF" viram "99"):
 * - linha 678 `Rota RF` → **`Faixa 99`**. O nome vem de `DESIGN_SYSTEM.md`
 *   §11.7 ("Faixa 99 — card branco, ícone de losango preto, `Disponível na
 *   sua fase` + à direita `3 Vantagens ›`"), que descreve o card autêntico;
 *   é preferível à tradução literal "Rota 99", que carregaria a palavra
 *   "rota", já removida do léxico da v7 (`DESIGN_SYSTEM.md` §14).
 * - linha 702 `Conta RF` → **`Conta 99`** (mesmo nome da carteira, B18).
 *
 * DIVERGÊNCIAS REGISTRADAS em relação a `contextos/B17-tela-central-ganhos.md`:
 * 1. O contexto pede um "grid de `tiles`" (Pagar boleto / Transferências /
 *    Recarregar celular / Gift Card). Esse grid NÃO existe no bloco
 *    `telaCentral` do protótipo — ele pertence à Carteira (`telaCarteira`,
 *    "Serviços gerais", `DESIGN_SYSTEM.md` §11.8), que é o bloco B18. Por
 *    isso `TILES` não é consumido aqui.
 * 2. O card amarelo de "Ganhos do dia" só aparece quando há ganhos no dia
 *    (`DESIGN_SYSTEM.md` §11.7: "Acima dela, **quando há dados**: card
 *    amarelo/500…"). O protótipo o renderiza sempre, zerado; seguimos a
 *    descrição do design system. Sem ganhos, o total do dia continua visível
 *    na linha "Saldo" de "Meus recursos".
 * 3. O endereço do histórico já chega cortado na vírgula — quem monta o item
 *    é `corridaStore.finalizar()` (`o.enderecoDestino.split(',')[0]`), então
 *    esta tela só renderiza.
 *
 * R7 — interatividade declarada (`DESIGN_SYSTEM.md` §11.7): das três linhas
 * de "Meus recursos", só **Conta 99** navega. "Saldo", "Método de resgate" e
 * o bloco "Melhore seus ganhos" são informativos — escopo declarado é melhor
 * que link morto.
 */

import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ListRenderItemInfo } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import CabecalhoPush from '@/components/ui/CabecalhoPush';
import { fmt } from '@/servicos/mapaFalso';
import { useMotoristaStore } from '@/state/motoristaStore';
import type { HistoricoItem } from '@/state/motoristaStore';
import { irCarteira, voltarDe } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill } from '@/tema/espacamento';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

/** Faixa de horas do gráfico — logic.js linha 415. */
const HORAS = [16, 17, 18, 19, 20, 21, 22, 23] as const;

/** `height: 110px` da caixa do gráfico. */
const ALTURA_GRAFICO = 110;
/** Fator de normalização da barra mais alta — logic.js linha 563. */
const ALTURA_MAX_BARRA = 92;
/** Barra mínima, para a hora sem corrida ainda ter um traço visível. */
const ALTURA_MIN_BARRA = 4;
/** Entrada das barras (crescem de baixo para cima ao abrir a tela). */
const DURACAO_BARRAS_MS = 520;

/** `height: 68px` das linhas de "Meus recursos". */
const ALTURA_LINHA = 68;
/** Ícone circular de 32px dessas mesmas linhas. */
const TAMANHO_ICONE = 32;
/** Caixa do losango preto do card "Faixa 99" (`width/height: 26px`). */
const TAMANHO_LOSANGO = 26;
/**
 * Lado do quadrado que, girado 45°, preenche a caixa de 26px: 26 / √2 ≈ 18,4.
 * (O protótipo faz o mesmo com `clip-path: polygon(...)`, que o RN não tem.)
 */
const LADO_LOSANGO = 18;

/** `Ganhos do dia (ago.20)` do protótipo, mas com a data de hoje. */
const MESES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

/** Seta `›` desenhada como no protótipo (7px, dois lados, girada -45°). */
function Chevron() {
  return <View style={estilos.chevron} />;
}

type IconeProps = { cor: string; glifo: string };

/** Bolinha de 32px com um glifo branco no meio. */
function IconeCircular({ cor, glifo }: IconeProps) {
  return (
    <View style={[estilos.iconeCircular, { backgroundColor: cor }]}>
      <Text style={estilos.iconeGlifo}>{glifo}</Text>
    </View>
  );
}

export default function Central() {
  const ganhos = useMotoristaStore((s) => s.ganhos);
  const dinamico = useMotoristaStore((s) => s.dinamico);
  const historico = useMotoristaStore((s) => s.historico);

  /** logic.js linha 414: `totalBase = ganhos - dinamico`, com 2 casas. */
  const base = Math.round((ganhos - dinamico) * 100) / 100;
  /** logic.js linhas 487-488. */
  const pctBase = ganhos > 0 ? Math.round((base / ganhos) * 100) : 0;
  const pctDin = ganhos > 0 ? Math.round((dinamico / ganhos) * 100) : 0;

  const temGanhos = ganhos > 0;
  /** `totalCorridas` — logic.js linha 560. */
  const totalCorridas = historico.length;

  const dataRotulo = useMemo(() => {
    const hoje = new Date();
    return `${MESES[hoje.getMonth()] ?? ''}.${hoje.getDate()}`;
  }, []);

  /**
   * `grafico` — logic.js linhas 561-564: soma o valor das corridas de cada
   * hora, normaliza pela hora de pico (mínimo 1, para não dividir por zero) e
   * converte em altura de no mínimo 4px.
   */
  const grafico = useMemo(() => {
    const porHora = HORAS.map((h) =>
      historico.filter((x) => x.h === h).reduce((a, b) => a + b.valor, 0)
    );
    const maxHora = Math.max(1, ...porHora);
    return HORAS.map((h, i) => {
      const valor = porHora[i] ?? 0;
      return {
        hora: `${h}h`,
        valor,
        altura: Math.max(
          ALTURA_MIN_BARRA,
          Math.round((valor / maxHora) * ALTURA_MAX_BARRA)
        ),
      };
    });
  }, [historico]);

  /**
   * Animação de entrada das barras — `Animated` do core do RN, com
   * `useNativeDriver: false` porque `height` não é uma propriedade que o
   * driver nativo saiba interpolar. Reinicia sempre que a distribuição muda,
   * ou seja, quando uma corrida nova entra no histórico com a tela aberta.
   */
  const crescimento = useRef(new Animated.Value(0)).current;
  const assinaturaGrafico = grafico.map((b) => b.altura).join(',');

  useEffect(() => {
    crescimento.setValue(0);
    const anim = Animated.timing(crescimento, {
      toValue: 1,
      duration: DURACAO_BARRAS_MS,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [crescimento, assinaturaGrafico]);

  /** A Central volta sempre para o mapa (`voltarPush` default, logic.js 285). */
  const voltar = () => {
    voltarDe('central');
  };

  const cabecalhoLista = (
    <View>
      {/* ---- Ganhos do dia (só quando há dados — ver nota 2 no topo) ---- */}
      {temGanhos ? (
        <View style={estilos.cardGanhos}>
          <Text style={estilos.rotuloSobreAmarelo}>
            Ganhos do dia ({dataRotulo})
          </Text>
          <Text style={estilos.valorGanhos}>{fmt(ganhos)}</Text>

          <View style={estilos.colunasGanhos}>
            <View>
              <Text style={estilos.rotuloColuna}>Corridas</Text>
              <Text style={estilos.valorColuna}>{fmt(ganhos)}</Text>
            </View>
            <View>
              {/* O protótipo fixa entregas em zero: o simulador só gera
                  corridas de passageiro. */}
              <Text style={estilos.rotuloColuna}>Entregas</Text>
              <Text style={estilos.valorColuna}>{fmt(0)}</Text>
            </View>
          </View>

          {/* Barra base × dinâmico — ARQUITETURA.md §6.6: "total do dia com a
              fatia que veio de dinâmico". */}
          <View style={estilos.trilhoBarra}>
            <View style={[estilos.fatiaBase, { width: `${pctBase}%` }]} />
            <View style={[estilos.fatiaDinamico, { width: `${pctDin}%` }]} />
          </View>
          <View style={estilos.legendaBarra}>
            <Text style={estilos.legendaTexto}>base {fmt(base)}</Text>
            <Text style={estilos.legendaTexto}>dinâmico {fmt(dinamico)}</Text>
          </View>
        </View>
      ) : null}

      {/* ---- Faixa 99 (ex-"Rota RF", linha 678 do protótipo) ---- */}
      <View style={estilos.cardFase}>
        <View style={estilos.caixaLosango}>
          <View style={estilos.losango} />
        </View>
        <View style={estilos.textoFase}>
          <Text style={estilos.tituloFase}>Faixa 99</Text>
          <Text style={estilos.subtituloFase}>Disponível na sua fase</Text>
        </View>
        <Text style={estilos.vantagens}>
          <Text style={estilos.vantagensNumero}>3</Text> Vantagens ›
        </Text>
      </View>

      {/* ---- Meus recursos ---- */}
      <Text style={estilos.tituloSecao}>Meus recursos</Text>
      <View style={estilos.cardLista}>
        {/* Informativa (R7): sem navegação. */}
        <View style={[estilos.linha, estilos.linhaComDivisor]}>
          <IconeCircular cor={cores.info500} glifo="$" />
          <Text style={estilos.rotuloLinha}>Saldo</Text>
          <Text style={estilos.valorLinha}>{fmt(ganhos)} ›</Text>
        </View>

        {/* Informativa (R7): sem navegação. */}
        <View style={[estilos.linha, estilos.linhaComDivisor]}>
          <IconeCircular cor={cores.erro500} glifo="$" />
          <View style={estilos.textoLinha}>
            <Text style={estilos.rotuloLinha}>Método de resgate</Text>
            <Text style={estilos.subtituloLinha}>Chave Pix</Text>
          </View>
          <Chevron />
        </View>

        {/* Única linha navegável da tela (`irCarteira`, .dc.html 699). */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Conta 99"
          onPress={irCarteira}
          style={({ pressed }) => [
            estilos.linha,
            pressed && estilos.pressionado,
          ]}
        >
          <IconeCircular cor={cores.laranjaConta} glifo="▮" />
          <View style={estilos.textoLinha}>
            <Text style={estilos.rotuloLinha}>Conta 99</Text>
            <Text style={estilos.subtituloLinha}>
              Saque quando quiser; aceita boleto
            </Text>
          </View>
          <Text style={estilos.valorLinha}>{fmt(ganhos)} ›</Text>
        </Pressable>
      </View>

      {/* ---- Melhore seus ganhos ---- */}
      <Text style={estilos.tituloSecao}>Melhore seus ganhos</Text>
      <View style={estilos.cardLista}>
        <View style={[estilos.blocoTexto, estilos.linhaComDivisor]}>
          <Text style={estilos.tituloBloco}>Recompensa por indicação</Text>
          <Text style={estilos.subtituloBloco}>
            Convide novos motoristas e aumente seus ganhos
          </Text>
        </View>
        <View style={estilos.blocoTexto}>
          <Text style={estilos.tituloBloco}>Recompensas</Text>
          <Text style={estilos.subtituloBloco}>
            Confira suas recompensas mais recentes
          </Text>
        </View>
      </View>

      {/* ---- Gráfico por hora ---- */}
      <View style={estilos.cardGrafico}>
        <Text style={estilos.rotuloGrafico}>Por hora</Text>
        <View
          style={estilos.areaGrafico}
          accessibilityRole="image"
          accessibilityLabel={`Ganhos por hora, das ${HORAS[0]}h às ${
            HORAS[HORAS.length - 1]
          }h`}
        >
          {grafico.map((barra) => (
            <View key={barra.hora} style={estilos.colunaBarra}>
              <Animated.View
                style={[
                  estilos.barra,
                  barra.valor > 0 ? estilos.barraCheia : estilos.barraVazia,
                  {
                    height: crescimento.interpolate({
                      inputRange: [0, 1],
                      outputRange: [ALTURA_MIN_BARRA, barra.altura],
                    }),
                  },
                ]}
              />
              <Text style={estilos.rotuloHora}>{barra.hora}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ---- Topo do card de histórico (o corpo são os itens da lista) ---- */}
      <View style={estilos.topoHistorico}>
        <Text style={estilos.rotuloHistorico}>Corridas de hoje</Text>
        <Text style={estilos.contadorHistorico}>{totalCorridas}</Text>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<HistoricoItem>) => (
    <View
      style={[
        estilos.corpoHistorico,
        estilos.itemHistorico,
        index < totalCorridas - 1 && estilos.linhaComDivisor,
      ]}
    >
      <Text style={estilos.horaItem}>{item.hora}</Text>
      <Text style={estilos.enderecoItem} numberOfLines={1}>
        {item.endereco}
      </Text>
      <Text style={estilos.valorItem}>{item.valorFmt}</Text>
    </View>
  );

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      <CabecalhoPush
        titulo="Central de ganhos"
        fundo={cores.neutro0}
        onVoltar={voltar}
        direita={<Text style={estilos.linkHistorico}>Histórico</Text>}
      />

      <FlatList
        data={historico}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${index}-${item.hora}`}
        ListHeaderComponent={cabecalhoLista}
        ListEmptyComponent={
          <View style={[estilos.corpoHistorico, estilos.vazio]}>
            <Text style={estilos.vazioTitulo}>Nenhuma corrida ainda</Text>
            <Text style={estilos.vazioTexto}>
              Conecte-se para receber ofertas.
            </Text>
          </View>
        }
        ListFooterComponent={<View style={estilos.rodapeHistorico} />}
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  // background:#F9F7FA (o respiro de 59px do topo vem do CabecalhoPush)
  tela: {
    flex: 1,
    backgroundColor: cores.neutro50,
  },
  // As margens laterais de 16px de todos os cards do protótipo viram um
  // padding único do container da lista.
  conteudo: {
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 28,
  },
  // font-size:15; color:#5D5B61
  linkHistorico: {
    ...tipografia.corpoMd,
    color: cores.neutro600,
  },

  // ---- Card amarelo "Ganhos do dia" ----------------------------------------
  // margin:12 16 0; padding:16; radius:12; background:#F8D60B
  cardGanhos: {
    marginTop: 12,
    padding: espacamento.cardPadding,
    borderRadius: raioCard,
    backgroundColor: cores.amarelo500,
  },
  // font-size:13; color:#7a6a00
  rotuloSobreAmarelo: {
    ...tipografia.corpoSm,
    color: cores.dinamicoFaixaTexto,
  },
  // font-size:34; font-weight:700; line-height:40; tabular-nums
  valorGanhos: {
    ...tipografia.displayLg,
    color: cores.neutro900,
    ...numeroTabular,
  },
  // gap:24; margin-top:10
  colunasGanhos: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 10,
  },
  // font-size:12; color:#7a6a00
  rotuloColuna: {
    fontFamily: familiaInter.regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    color: cores.dinamicoFaixaTexto,
  },
  // font-size:15; font-weight:700; tabular-nums
  valorColuna: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
    ...numeroTabular,
  },
  // height:8; radius:999; overflow:hidden; background:rgba(0,0,0,.12)
  trilhoBarra: {
    flexDirection: 'row',
    height: 8,
    borderRadius: raioPill,
    overflow: 'hidden',
    backgroundColor: cores.trilhoSobreAmarelo,
    marginTop: 14,
  },
  fatiaBase: {
    backgroundColor: cores.neutro0,
  },
  fatiaDinamico: {
    backgroundColor: cores.alerta500,
  },
  // gap:14; margin-top:6; font-size:11.5; color:#7a6a00
  legendaBarra: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 6,
  },
  legendaTexto: {
    fontFamily: familiaInter.regular,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '400',
    color: cores.dinamicoFaixaTexto,
    ...numeroTabular,
  },

  // ---- Card "Faixa 99" -----------------------------------------------------
  // margin:12 16 0; padding:14; radius:12; branco; border 1px #DCDAE0; gap:12
  cardFase: {
    marginTop: 12,
    padding: 14,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  caixaLosango: {
    width: TAMANHO_LOSANGO,
    height: TAMANHO_LOSANGO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%) → quadrado a 45°
  losango: {
    width: LADO_LOSANGO,
    height: LADO_LOSANGO,
    backgroundColor: cores.neutro900,
    transform: [{ rotate: '45deg' }],
  },
  textoFase: {
    flex: 1,
  },
  // font-size:15; font-weight:600
  tituloFase: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro900,
  },
  // font-size:13; color:#5D5B61
  subtituloFase: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  vantagens: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  // <strong> font-weight:700; color:#1C1A1F
  vantagensNumero: {
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
  },

  // ---- Seções ("Meus recursos" / "Melhore seus ganhos") --------------------
  // margin:20 16 0; font-size:22; font-weight:700
  tituloSecao: {
    ...tipografia.tituloLg,
    color: cores.neutro900,
    marginTop: 20,
  },
  // margin:10 16 0; radius:12; branco; border 1px #DCDAE0; overflow:hidden
  cardLista: {
    marginTop: 10,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
    overflow: 'hidden',
  },
  // height:68; padding:0 14; gap:12
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ALTURA_LINHA,
    paddingHorizontal: 14,
  },
  // border-bottom: 1px solid #EFEDF1
  linhaComDivisor: {
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro100,
  },
  pressionado: {
    backgroundColor: cores.neutro50,
  },
  // width/height:32; radius:999
  iconeCircular: {
    width: TAMANHO_ICONE,
    height: TAMANHO_ICONE,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // font-size:15; font-weight:700; color:#FFFFFF
  iconeGlifo: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro0,
  },
  textoLinha: {
    flex: 1,
  },
  // font-size:17
  rotuloLinha: {
    flex: 1,
    fontFamily: familiaInter.regular,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400',
    color: cores.neutro900,
  },
  // font-size:13; color:#5D5B61
  subtituloLinha: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  // font-size:15; color:#5D5B61; tabular-nums
  valorLinha: {
    ...tipografia.corpoMd,
    color: cores.neutro600,
    ...numeroTabular,
  },
  // 7x7 com borda direita/inferior, girada -45° (o `›` do protótipo)
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: cores.neutro400,
    transform: [{ rotate: '-45deg' }],
  },
  // padding:14
  blocoTexto: {
    padding: 14,
  },
  // font-size:15; font-weight:600
  tituloBloco: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro900,
  },
  // font-size:13; color:#5D5B61
  subtituloBloco: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },

  // ---- Gráfico "Por hora" --------------------------------------------------
  // margin:20 16 0; padding:16 14 12; radius:12; branco; border 1px #DCDAE0
  cardGrafico: {
    marginTop: 20,
    paddingTop: espacamento.cardPadding,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
  },
  // font-size:13; color:#5D5B61; margin-bottom:12
  rotuloGrafico: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
    marginBottom: 12,
  },
  // align-items:flex-end; gap:8; height:110
  areaGrafico: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: ALTURA_GRAFICO,
  },
  // flex:1; column; align-items:center; gap:6
  colunaBarra: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  // width:100%; border-radius:5px 5px 0 0
  barra: {
    width: '100%',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barraCheia: {
    backgroundColor: cores.amarelo500,
  },
  barraVazia: {
    backgroundColor: cores.neutro100,
  },
  // font-size:10; color:#9D9CA1; tabular-nums
  rotuloHora: {
    fontFamily: familiaInter.regular,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '400',
    color: cores.neutro400,
    ...numeroTabular,
  },

  // ---- Histórico do dia ----------------------------------------------------
  // O card do protótipo é um retângulo branco arredondado com N linhas dentro.
  // Como as linhas são os itens da FlatList (contexto B17 → ARQUITETURA.md §3,
  // tela 7: lista performática porque cresce ao longo do dia), o card é
  // montado em três partes — topo (cabeçalho da lista), corpo (cada item) e
  // rodapé —, cada uma com o pedaço de borda que lhe cabe.
  topoHistorico: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
    borderBottomColor: cores.neutro100,
    borderTopLeftRadius: raioCard,
    borderTopRightRadius: raioCard,
  },
  rotuloHistorico: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  contadorHistorico: {
    ...tipografia.corpoSm,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
    ...numeroTabular,
  },
  corpoHistorico: {
    backgroundColor: cores.neutro0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: cores.neutro200,
  },
  rodapeHistorico: {
    height: raioCard,
    backgroundColor: cores.neutro0,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: cores.neutro200,
    borderBottomLeftRadius: raioCard,
    borderBottomRightRadius: raioCard,
  },
  // padding:14; gap:12
  itemHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  // font-size:13; color:#9D9CA1; tabular-nums
  horaItem: {
    ...tipografia.corpoSm,
    color: cores.neutro400,
    ...numeroTabular,
  },
  // flex:1; font-size:15
  enderecoItem: {
    flex: 1,
    ...tipografia.corpoMd,
    color: cores.neutro900,
  },
  // font-size:15; font-weight:600; tabular-nums
  valorItem: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro900,
    ...numeroTabular,
  },
  // padding:24 16; text-align:center
  vazio: {
    paddingVertical: 24,
    paddingHorizontal: espacamento.telaLateral,
    alignItems: 'center',
  },
  // font-size:15; font-weight:600
  vazioTitulo: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro900,
  },
  // font-size:13; color:#5D5B61; margin-top:4
  vazioTexto: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
    marginTop: 4,
    textAlign: 'center',
  },
});
