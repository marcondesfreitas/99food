/**
 * B12 — Tela de Verificação facial.
 *
 * Tela cheia (não é bottom sheet) que roda entre o "Conectar" do mapa e o
 * estado "Buscando". A detecção é SIMULADA — `ARQUITETURA.md` §8, nível A:
 * NÃO há câmera nem reconhecimento de verdade. A moldura mostra a foto de
 * perfil da pessoa e o sucesso é só um timer.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html` linhas 388-451
 * (bloco `telaFacial`) e `.design-import/logic.js`:
 * - `rodarFacial()` linhas 308-313 — a sequência de tempos
 * - `reiniciarFacial` linha 544
 *
 * Sequência exata portada do protótipo:
 *   entra → 'verificando' (arco progride ~6s)
 *     → 6100ms → 'sucesso' ("Tudo certo!", check + animação de "bater")
 *       → 900ms → mapa em status BUSCANDO
 *
 * O componente pesado (`MolduraFacial`, B09) já cobre a moldura redonda, o
 * arco de progresso, os textos dos 3 estados, o banner amarelo de "sem foto",
 * o bloco de comparação com a foto do cadastro e o botão "Tentar novamente".
 * Esta tela é só o header, a máquina de tempo e a navegação.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import MolduraFacial, {
  type EstadoFacial,
} from '@/components/verificacao/MolduraFacial';
import {
  concluirFacial,
  desistirDaFacial,
  irAoPerfilDaFacial,
} from '@/servicos/simuladorCorridas';
import { cores } from '@/tema/cores';
import { espacamento } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

/** `rodarFacial()` — logic.js linha 309: sucesso após 6100ms. */
const MS_ATE_SUCESSO = 6100;
/** logic.js linha 311: 900ms depois do sucesso, vai para o mapa. */
const MS_SUCESSO_ATE_MAPA = 900;

/** Header de 111px com o conteúdo alinhado embaixo (`padding: 0 16px 14px`). */
const ALTURA_HEADER = 111;
const LARGURA_BOTAO_VOLTAR = 32;

export default function VerificacaoFacial() {
  const [estado, setEstado] = useState<EstadoFacial>('verificando');

  /**
   * Lista de timers a limpar, replicando `this.timers` + `limpar()` do
   * protótipo (logic.js linhas 142-144). Nenhum timer pode sobreviver à saída
   * da tela — é critério de aceite explícito do bloco B26 ("sair no meio de
   * qualquer etapa não deixa timers fantasmas").
   */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const limparTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const agendar = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }, []);

  /**
   * `rodarFacial()` — logic.js linhas 308-313.
   *
   * Os dois tempos são a timeline visual desta tela, e por isso ficam aqui. O
   * que vem *depois* do sucesso — virar `BUSCANDO`, voltar ao mapa e agendar a
   * primeira oferta em 3400ms — é do `simuladorCorridas` (B26): a tela não
   * conhece nem o status nem a rota.
   */
  const rodarFacial = useCallback(() => {
    agendar(() => {
      setEstado('sucesso');
      agendar(concluirFacial, MS_SUCESSO_ATE_MAPA);
    }, MS_ATE_SUCESSO);
  }, [agendar]);

  useEffect(() => {
    rodarFacial();
    return limparTimers;
  }, [rodarFacial, limparTimers]);

  /** `reiniciarFacial` — logic.js linha 544: limpa tudo e recomeça. */
  const tentarNovamente = useCallback(() => {
    limparTimers();
    setEstado('verificando');
    rodarFacial();
  }, [limparTimers, rodarFacial]);

  /**
   * `voltarMapa` — o ‹ do header (`.dc.html` linha 391). Desistir da
   * verificação também desfaz o "Conectar": `desistirDaFacial()` devolve o
   * status para OFFLINE antes de voltar, senão o mapa ficaria preso no botão
   * "Carregando".
   */
  const voltar = useCallback(() => {
    limparTimers();
    desistirDaFacial();
  }, [limparTimers]);

  /**
   * `irPerfil` — link "Adicionar agora ›" do banner de perfil sem foto
   * (`.dc.html` linha 398).
   *
   * `replace` em vez de `push` porque a facial não deve continuar viva embaixo
   * da pilha: sair dela para o Perfil é abandonar a verificação. Como a pilha
   * fica só com o Perfil, o `‹` dele (`voltarDe('perfil')` → `dismissTo` do
   * mapa) recai no comportamento de substituição e leva ao mapa — que é o
   * destino certo.
   */
  const irParaPerfil = useCallback(() => {
    limparTimers();
    irAoPerfilDaFacial();
  }, [limparTimers]);

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      {/* Header: ‹ à esquerda, título centralizado (com margem compensando
          a largura do botão, igual ao protótipo). */}
      <View style={estilos.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={voltar}
          hitSlop={12}
          style={({ pressed }) => [
            estilos.botaoVoltar,
            pressed && estilos.botaoVoltarPressionado,
          ]}
        >
          <Text style={estilos.chevronVoltar}>‹</Text>
        </Pressable>
        <Text style={estilos.titulo}>Reconhecimento facial</Text>
      </View>

      <MolduraFacial
        estado={estado}
        onTentarNovamente={tentarNovamente}
        onAdicionarFoto={irParaPerfil}
        style={estilos.moldura}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  // background: #F9F7FA
  tela: {
    flex: 1,
    backgroundColor: cores.neutro50,
  },

  // height:111; background:#FFF; align-items:flex-end; padding:0 16px 14px
  header: {
    zIndex: 3,
    height: ALTURA_HEADER,
    backgroundColor: cores.neutro0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 14,
  },
  botaoVoltar: {
    width: LARGURA_BOTAO_VOLTAR,
  },
  botaoVoltarPressionado: {
    opacity: 0.6,
  },
  // font-size:20; text-align:left; color:#1C1A1F
  chevronVoltar: {
    fontFamily: familiaInter.regular,
    fontSize: 20,
    lineHeight: 24,
    color: cores.neutro900,
    textAlign: 'left',
  },
  // flex:1; text-align:center; font-size:18; font-weight:600; margin-right:32
  titulo: {
    ...tipografia.tituloMd,
    flex: 1,
    textAlign: 'center',
    color: cores.neutro900,
    marginRight: LARGURA_BOTAO_VOLTAR,
  },

  moldura: {
    flex: 1,
  },
});
