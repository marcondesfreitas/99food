/**
 * SeloDinamico — linha "$ R$ 5,70 · Tarifa base dinâmica incl."
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `temOferta`
 * (a `<div>` logo abaixo da barra de tempo, `#F4C372`).
 *
 * Componente separado porque é reutilizado na tela de resumo da corrida (B13),
 * onde a decomposição base + dinâmico aparece de novo (ARQUITETURA §6.6).
 *
 * Apresentacional: recebe tudo por props, não lê stores.
 */

import { StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { cores } from '@/tema/cores';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

export type SeloDinamicoProps = {
  /** Valor já formatado — ex.: `"R$ 5,70"` (`oferta.dinamicoFmt`). */
  valorFmt: string;
  /** Texto à direita do valor. Padrão igual ao protótipo. */
  texto?: string;
  style?: StyleProp<ViewStyle>;
};

export function SeloDinamico({
  valorFmt,
  texto = 'Tarifa base dinâmica incl.',
  style,
}: SeloDinamicoProps) {
  return (
    <View style={[estilos.linha, style]}>
      <View style={estilos.moeda}>
        <Text style={estilos.cifrao}>$</Text>
      </View>
      <Text style={estilos.valor}>{valorFmt}</Text>
      <Text style={estilos.texto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  // display:flex; align-items:center; gap:7px
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  // 15×15, border 1.5px #F4C372, border-radius 999px
  moeda: {
    width: 15,
    height: 15,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: cores.corDinamico,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cifrao: {
    fontFamily: familiaInter.bold,
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    color: cores.corDinamico,
    textAlign: 'center',
  },
  // font-size:14; font-weight:700; tabular-nums
  valor: {
    fontFamily: familiaInter.bold,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    color: cores.corDinamico,
    ...numeroTabular,
  },
  // font-size:13
  texto: {
    ...tipografia.corpoSm,
    color: cores.corDinamico,
  },
});

export default SeloDinamico;
