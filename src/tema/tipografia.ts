import type { TextStyle } from 'react-native';

/**
 * Tokens de tipografia — única fonte de verdade.
 *
 * Fonte: DESIGN_SYSTEM.md §2.5.
 *
 * Fonte de exibição: Inter (via `expo-font` / `@expo-google-fonts/inter`),
 * pesos 400/500/600/700/800, com fallback para a fonte do sistema enquanto
 * os arquivos não carregam (ou em caso de falha).
 */

/** Nomes de família exatamente como o `@expo-google-fonts/inter` exporta. */
export const familiaInter = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

/** Fallback usado até as fontes carregarem (ou se falharem). */
export const familiaFallback = 'System';

type EstiloTexto = Pick<
  TextStyle,
  'fontFamily' | 'fontSize' | 'fontWeight' | 'lineHeight'
>;

/**
 * Escala de texto do app. `fontFamily` já aponta para o peso Inter correto;
 * `fontWeight` é mantido em paralelo para telas/plataformas onde a fonte
 * ainda não carregou e o fallback do sistema precisa simular o peso.
 */
export const tipografia: Record<
  | 'displayXl'
  | 'displayLg'
  | 'tituloLg'
  | 'tituloMd'
  | 'corpoLg'
  | 'corpoMd'
  | 'corpoSm'
  | 'labelBtn'
  | 'labelChip',
  EstiloTexto
> = {
  /** Valor da oferta e do resumo — ex.: "R$ 19,00". */
  displayXl: {
    fontFamily: familiaInter.bold,
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 48,
  },
  /**
   * DESIGN_SYSTEM.md §2.5. Usado no contador central do anel do Teste de
   * status ("6/6", §3.6) e no valor de "Ganhos do dia" da Central de Ganhos
   * (§11 item 1).
   */
  displayLg: {
    fontFamily: familiaInter.bold,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  tituloLg: {
    fontFamily: familiaInter.bold,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  tituloMd: {
    fontFamily: familiaInter.semiBold,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  corpoLg: {
    fontFamily: familiaInter.semiBold,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  corpoMd: {
    fontFamily: familiaInter.regular,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
  corpoSm: {
    fontFamily: familiaInter.regular,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  labelBtn: {
    fontFamily: familiaInter.bold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  labelChip: {
    fontFamily: familiaInter.semiBold,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
};

/**
 * Estilo auxiliar para números de dinheiro — devem sempre usar algarismos
 * tabulares para o contador de ganhos não "tremer" durante a animação.
 *
 * `fontVariant: ['tabular-nums']` é suportado a partir do RN 0.71, mas
 * precisa ser testado no dispositivo/fonte alvo: se a Inter embarcada não
 * expuser a feature OpenType `tnum`, o fallback é trocar a família por uma
 * fonte monoespaçada só nos dígitos.
 */
export const numeroTabular: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};
