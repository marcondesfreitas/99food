/**
 * CabecalhoPush — o cabeçalho comum das telas "empurradas" (B14-B23).
 *
 * Existe para as dez telas empurradas não reimplementarem o mesmo header dez
 * vezes com números levemente diferentes. Todas seguem o mesmo esqueleto no
 * protótipo (`.design-import/RotaFacil Motorista v6.dc.html`), variando só em
 * fundo, alinhamento do título e ação à direita:
 *
 * | Tela                | Variante | Fundo do header      | Título        |
 * |---------------------|----------|----------------------|---------------|
 * | Pref. solicitações  | escuro   | `neutro900`, 115px   | à esquerda    |
 * | Pref. serviços      | escuro   | `neutro900`, 115px   | à esquerda    |
 * | Teste de status     | claro    | transparente         | centro + ação |
 * | Central de ganhos   | claro    | `neutro0`            | à esquerda    |
 * | Carteira            | claro    | `amareloCarteira`    | à esquerda    |
 * | Transferência Pix   | claro    | transparente         | centralizado  |
 * | Perfil              | claro    | transparente         | (só ícones)   |
 * | Config. de perfil   | claro    | `neutro0`            | centralizado  |
 * | Editar conta        | claro    | transparente         | à esquerda    |
 * | Veículos            | claro    | transparente         | à esquerda    |
 *
 * O `59px` de respiro no topo é o valor literal do protótipo (frame fixo de
 * 390×844, já incluindo a barra de status). B25, ao montar a navegação de
 * verdade, pode trocar por `useSafeAreaInsets().top` — fica como constante
 * aqui para não depender de um provider que o layout raiz ainda não tem.
 */

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { cores } from '@/tema/cores';
import { espacamento } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

/** `padding: 59px 0 0` — respiro de barra de status do protótipo. */
export const TOPO_PUSH = 59;

/** Altura do header escuro (`height: 115px`). */
const ALTURA_HEADER_ESCURO = 115;

/** `width: 28px` do `‹` nas telas claras; 32px na de Teste de status. */
const LARGURA_VOLTAR = 28;

export type CabecalhoPushProps = {
  titulo?: string;
  /**
   * `escuro` = bloco de 115px, fundo `neutro900`, texto branco, conteúdo
   * alinhado embaixo (Preferências de solicitações/serviços).
   * `claro` = respiro de 59px + linha de 12/16 (todas as demais).
   */
  variante?: 'claro' | 'escuro';
  /** Cor de fundo da faixa. Só vale na variante `claro`. */
  fundo?: string;
  /** Centraliza o título, compensando a largura do `‹`. */
  centralizado?: boolean;
  onVoltar: () => void;
  /** Ação opcional à direita (botão "Tentar novamente", ícone de config…). */
  direita?: ReactNode;
  estilo?: StyleProp<ViewStyle>;
};

export function CabecalhoPush({
  titulo,
  variante = 'claro',
  fundo,
  centralizado = false,
  onVoltar,
  direita,
  estilo,
}: CabecalhoPushProps) {
  const escuro = variante === 'escuro';
  const corTexto = escuro ? cores.neutro0 : cores.neutro900;

  return (
    <View
      style={[
        escuro ? estilos.faixaEscura : estilos.faixaClara,
        !escuro && fundo ? { backgroundColor: fundo } : null,
        estilo,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={onVoltar}
        hitSlop={12}
        style={({ pressed }) => [
          estilos.botaoVoltar,
          pressed && estilos.botaoVoltarPressionado,
        ]}
      >
        <Text style={[estilos.chevron, { color: corTexto }]}>‹</Text>
      </Pressable>

      {titulo ? (
        <Text
          style={[
            estilos.titulo,
            { color: corTexto },
            centralizado && estilos.tituloCentralizado,
          ]}
          numberOfLines={1}
        >
          {titulo}
        </Text>
      ) : (
        <View style={estilos.preenchedor} />
      )}

      {direita ?? (centralizado ? <View style={estilos.espacadorDireita} /> : null)}
    </View>
  );
}

const estilos = StyleSheet.create({
  // height:115; background:#1C1A1F; align-items:flex-end; gap:12; padding:0 16 16
  faixaEscura: {
    height: ALTURA_HEADER_ESCURO,
    backgroundColor: cores.neutro900,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: espacamento.telaLateral,
  },
  // padding-top de 59 (respiro) + linha de 12/16
  faixaClara: {
    paddingTop: TOPO_PUSH,
    paddingBottom: 12,
    paddingHorizontal: espacamento.telaLateral,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botaoVoltar: {
    width: LARGURA_VOLTAR,
  },
  botaoVoltarPressionado: {
    opacity: 0.6,
  },
  // font-size:20; text-align:left
  chevron: {
    fontFamily: familiaInter.regular,
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'left',
  },
  // font-size:18; font-weight:600
  titulo: {
    ...tipografia.tituloMd,
    flex: 1,
  },
  tituloCentralizado: {
    textAlign: 'center',
  },
  preenchedor: {
    flex: 1,
  },
  // Compensa a largura do `‹` para o título centralizado ficar no meio real.
  espacadorDireita: {
    width: LARGURA_VOLTAR,
  },
});

export default CabecalhoPush;
