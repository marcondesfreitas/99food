import type { ViewStyle } from 'react-native';

/**
 * Tokens de espaçamento, raio e sombra — única fonte de verdade.
 *
 * Fonte: DESIGN_SYSTEM.md §2.6–2.7.
 */

/** Escala base de 4px usada em todo o app. */
export const escala = [4, 8, 12, 16, 20, 24, 32, 40, 48] as const;

export const espacamento = {
  escala,
  /** Padding lateral padrão de tela. */
  telaLateral: 16,
  /** Padding interno de card. */
  cardPadding: 16,
  /** Gap entre itens do menu lateral (drawer). */
  menuGap: 30,
} as const;

// ---- Raio ------------------------------------------------------------------

/** Botões primários, chips, pills de header. Qualquer valor bem maior que a
 * metade da altura do elemento funciona como "totalmente arredondado" no RN. */
export const raioPill = 9999;

/** Bottom sheet de oferta/corrida — aplicar só no topo
 * (`borderTopLeftRadius` / `borderTopRightRadius`). */
export const raioSheet = 20;

/** Cards de veículo, checklist, etc. */
export const raioCard = 12;

// ---- Sombra ------------------------------------------------------------------

/**
 * Tradução de `box-shadow` (CSS) para RN: no iOS via `shadowColor` +
 * `shadowOffset` + `shadowOpacity` + `shadowRadius`; no Android via
 * `elevation` (que não aceita cor/offset customizados, então é uma
 * aproximação visual do mesmo efeito).
 *
 * Usado em header pills, banner e FABs (DESIGN_SYSTEM.md §2.7,
 * `sombra/flutuante`: `0 2 8 rgba(0,0,0,.14)`).
 */
export const sombraFlutuante: Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
> = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.14,
  shadowRadius: 8,
  elevation: 4,
};
