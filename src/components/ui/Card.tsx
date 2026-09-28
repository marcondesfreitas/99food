import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { cores } from '@/tema/cores';
import { espacamento, raioCard, sombraFlutuante } from '@/tema/espacamento';

/**
 * Container branco genérico — a base de quase todo bloco de conteúdo das
 * telas de lista (Teste de status, Preferências, Perfil, Veículos…).
 *
 * Fonte: DESIGN_SYSTEM.md §2.7 (`raio/card` = 12, `sombra/flutuante`) e os
 * cards do `.design-import/RotaFacil Motorista v6.dc.html`, que aparecem em
 * duas roupagens: com borda `#DCDAE0` (listas) ou com sombra (flutuantes).
 */

export type CardProps = {
  children?: ReactNode;
  /** Aplica `sombraFlutuante` (iOS: shadow*, Android: elevation). */
  sombra?: boolean;
  /** Borda de 1px em `neutro200` — usada nos cards de lista do protótipo. */
  borda?: boolean;
  /** Padding interno. Padrão 16 (`espacamento.cardPadding`). */
  padding?: number;
  /** Raio dos cantos. Padrão 12 (`raioCard`). */
  raio?: number;
  /** Cor de fundo. Padrão `neutro0`. */
  fundo?: string;
  estilo?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Card({
  children,
  sombra = false,
  borda = false,
  padding = espacamento.cardPadding,
  raio = raioCard,
  fundo = cores.neutro0,
  estilo,
  testID,
}: CardProps) {
  return (
    <View
      testID={testID}
      style={[
        estilos.card,
        {
          padding,
          borderRadius: raio,
          backgroundColor: fundo,
          borderWidth: borda ? 1 : 0,
          borderColor: borda ? cores.neutro200 : 'transparent',
        },
        sombra ? sombraFlutuante : null,
        estilo,
      ]}
    >
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  card: {
    // `overflow: hidden` é intencionalmente omitido: no Android ele corta a
    // sombra. Cards que precisam recortar filhos (listas com divisores até a
    // borda) passam `estilo={{ overflow: 'hidden' }}` e não usam `sombra`.
  },
});
