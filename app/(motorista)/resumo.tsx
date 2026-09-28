/**
 * B13 — Tela de Resumo da corrida.
 *
 * Mostrada logo após `corridaStore.finalizar()`: valor grande subindo de 0 até
 * o total, decomposição base + tarifa dinâmica, km/min e avaliação por
 * estrelas.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaResumo`
 * (linhas 452-489) e `.design-import/logic.js`:
 * - `finalizar()` linhas 367-392 — monta `resumo` e anima `resumoValor`
 * - `resumoValorFmt`/`estrelasLista`/`concluirResumo` linhas 554-556
 *
 * DIVERGÊNCIA REGISTRADA: `contextos/B13-tela-resumo.md` diz que o
 * `SeloDinamico` (B08) seria reutilizado aqui. O protótipo não usa o selo
 * nesta tela — usa um card de duas linhas ("Corrida" / "Tarifa dinâmica" com
 * pill de faixa). Seguimos o protótipo, que é a fonte de verdade.
 *
 * A animação de contagem NÃO é refeita aqui: o `corridaStore` já expõe
 * `resumoValor` animado por rAF com easing cúbico de 900ms (logic.js 385-391).
 * Esta tela só formata.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Estrelas } from '@/components/ui/Estrelas';
import {
  concluirResumo,
  verCentralDeGanhos,
} from '@/servicos/simuladorCorridas';
import { useCorridaStore } from '@/state/corridaStore';
import { fmt } from '@/servicos/mapaFalso';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill } from '@/tema/espacamento';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

/** `padding: 71px 16px 24px` no protótipo. */
const PADDING_TOPO = 71;
const ALTURA_BOTAO = 56;

export default function Resumo() {
  const resumo = useCorridaStore((s) => s.resumo);
  const resumoValor = useCorridaStore((s) => s.resumoValor);

  /**
   * `estrelas` é estado só desta tela — no protótipo vive no state global
   * junto de tudo, mas não é consumido por nenhuma outra tela nem persistido
   * (`logic.js` linha 555 só pinta a estrela; `concluirResumo` descarta).
   */
  const [estrelas, setEstrelas] = useState(0);

  /*
   * Os dois botões desta tela são ações do `simuladorCorridas` (B26), usadas
   * diretamente:
   *
   * - "Enviar" → `concluirResumo` (logic.js linha 556): volta ao mapa em
   *   `BUSCANDO` e agenda a próxima oferta em 4000ms;
   * - "Ver central de ganhos" → `verCentralDeGanhos` (`.dc.html` linha 487).
   *
   * A nota em estrelas é descartada, como no protótipo: `concluirResumo` não a
   * lê nem a envia para lugar nenhum.
   */

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.rotuloTopo}>Corrida finalizada</Text>

        {/* Valor grande — `resumoValor` já vem animado do corridaStore. */}
        <Text style={estilos.valorGrande}>{fmt(resumoValor)}</Text>

        {/* Card de decomposição: base + tarifa dinâmica. */}
        <View style={estilos.cardDecomposicao}>
          <View style={estilos.linhaDecomposicao}>
            <Text style={estilos.rotuloLinha}>Corrida</Text>
            <Text style={estilos.valorLinha}>{resumo?.baseFmt ?? fmt(0)}</Text>
          </View>

          <View style={estilos.divisor} />

          <View style={estilos.linhaDecomposicao}>
            <View style={estilos.rotuloComPill}>
              <Text style={estilos.rotuloLinha}>Tarifa dinâmica</Text>
              {resumo?.faixa ? (
                <View style={estilos.pillFaixa}>
                  <Text style={estilos.pillFaixaTexto}>{resumo.faixa}</Text>
                </View>
              ) : null}
            </View>
            <Text style={estilos.valorDinamico}>
              {resumo?.dinamicoFmt ?? fmt(0)}
            </Text>
          </View>
        </View>

        {/* Dois cards lado a lado: quilômetros e minutos. */}
        <View style={estilos.linhaMetricas}>
          <View style={estilos.cardMetrica}>
            <Text style={estilos.metricaValor}>{resumo?.km ?? '0,0'}</Text>
            <Text style={estilos.metricaRotulo}>quilômetros</Text>
          </View>
          <View style={estilos.cardMetrica}>
            <Text style={estilos.metricaValor}>{resumo?.min ?? 0}</Text>
            <Text style={estilos.metricaRotulo}>minutos</Text>
          </View>
        </View>

        <Text style={estilos.pergunta}>Como foi a viagem?</Text>
        <Estrelas
          valor={estrelas}
          onChange={setEstrelas}
          estilo={estilos.estrelas}
        />

        <Pressable
          accessibilityRole="button"
          onPress={concluirResumo}
          style={({ pressed }) => [
            estilos.botaoEnviar,
            pressed && estilos.botaoEnviarPressionado,
          ]}
        >
          <Text style={estilos.botaoEnviarTexto}>Enviar</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={verCentralDeGanhos}
          style={({ pressed }) => [
            estilos.botaoSecundario,
            pressed && estilos.botaoSecundarioPressionado,
          ]}
        >
          <Text style={estilos.botaoSecundarioTexto}>Ver central de ganhos</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro0,
  },
  // padding: 71px 16px 24px
  conteudo: {
    paddingTop: PADDING_TOPO,
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 24,
  },

  // font-size:15; color:#5D5B61; margin-top:12px
  rotuloTopo: {
    ...tipografia.corpoMd,
    color: cores.neutro600,
    marginTop: 12,
  },

  // font-size:44; font-weight:700; line-height:48; tabular-nums
  valorGrande: {
    ...tipografia.displayXl,
    color: cores.neutro900,
    ...numeroTabular,
  },

  // margin-top:18; border-radius:12; border:1px #DCDAE0
  cardDecomposicao: {
    marginTop: 18,
    borderRadius: raioCard,
    borderWidth: 1,
    borderColor: cores.neutro200,
    overflow: 'hidden',
  },
  // padding: 13px 14px; space-between
  linhaDecomposicao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  rotuloComPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rotuloLinha: {
    ...tipografia.corpoMd,
    color: cores.neutro600,
  },
  // font-size:15; font-weight:600; tabular-nums
  valorLinha: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro900,
    ...numeroTabular,
  },
  // height:1px; background:#EFEDF1
  divisor: {
    height: 1,
    backgroundColor: cores.neutro100,
  },
  // padding:3px 8px; radius:999; background:#FEF8CC; color:#7a6a00; 11/700
  pillFaixa: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: raioPill,
    backgroundColor: cores.amarelo100,
  },
  pillFaixaTexto: {
    fontFamily: familiaInter.bold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: cores.dinamicoFaixaTexto,
    ...numeroTabular,
  },
  // font-weight:600; color:#C98A25
  valorDinamico: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.dinamicoTexto,
    ...numeroTabular,
  },

  // gap:12; margin-top:16
  linhaMetricas: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  // flex:1; padding:14; radius:12; background:#F9F7FA
  cardMetrica: {
    flex: 1,
    padding: 14,
    borderRadius: raioCard,
    backgroundColor: cores.neutro50,
  },
  // font-size:22; font-weight:700; tabular-nums
  metricaValor: {
    ...tipografia.tituloLg,
    color: cores.neutro900,
    ...numeroTabular,
  },
  // font-size:13; color:#5D5B61
  metricaRotulo: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },

  // margin-top:24; font-size:18; font-weight:600
  pergunta: {
    ...tipografia.tituloMd,
    color: cores.neutro900,
    marginTop: 24,
  },
  // gap:10; margin-top:12 (o gap padrão do componente Estrelas já é 10)
  estrelas: {
    marginTop: 12,
  },

  // margin-top:24; width:100%; height:56; radius:999; background:#F8D60B
  botaoEnviar: {
    marginTop: 24,
    width: '100%',
    height: ALTURA_BOTAO,
    borderRadius: raioPill,
    backgroundColor: cores.amarelo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoEnviarPressionado: {
    backgroundColor: cores.amarelo600,
  },
  // font-size:18; font-weight:700; color:#1C1A1F
  botaoEnviarTexto: {
    ...tipografia.labelBtn,
    color: cores.neutro900,
  },

  // width:100%; margin-top:10; font-size:14; font-weight:600; color:#5D5B61
  botaoSecundario: {
    width: '100%',
    marginTop: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSecundarioPressionado: {
    opacity: 0.6,
  },
  botaoSecundarioTexto: {
    fontFamily: familiaInter.semiBold,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: cores.neutro600,
  },
});
