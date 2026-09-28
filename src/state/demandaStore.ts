/**
 * Simulador de demanda — zonas de calor e multiplicador de preço dinâmico.
 *
 * Fonte: `.design-import/logic.js` `criarZonas()` (linha 154), `tickDemanda()`
 * (linhas 156–169), `faixaDe()` (linhas 171–174), `zonaQuente()` (linha 175).
 * Explicação em prosa do algoritmo: `ARQUITETURA.md` §6 inteira (o markdown é
 * só a explicação — a fórmula real, incluindo a suavização, vem do `.js`).
 *
 * Duas ideias que o algoritmo mistura de propósito (ARQUITETURA §6):
 * - **surge**: multiplicador aplicado ao valor da corrida (usado por
 *   `corridaStore.gerarOferta()` via `zonaQuente()`/`faixaDe()`);
 * - **heatmap**: a mesma "temperatura" de zona, mas para desenhar no mapa
 *   (consumido pelos componentes de B07, via `zonas`).
 */

import { create } from 'zustand';
import { CLUSTERS } from '@/servicos/mapaFalso';

/**
 * Zona de demanda — grade fixa de clusters (ver `ARQUITETURA.md` §6.1,
 * "Grade fixa ... comece aqui"). Formato idêntico ao `ZonaDemanda` de
 * `src/state/tipos.ts` (B02); definido aqui também para não travar este
 * bloco numa dependência de import — os dois tipos são estruturalmente
 * compatíveis.
 */
export type ZonaDemanda = {
  id: string;
  x: number;
  y: number;
  cells: [number, number][];
  base: number;
  pax: number;
  mot: number;
  mult: number;
};

/**
 * `this.props.demandaBase ?? 1.4` no protótipo (logic.js linha 157). Aqui não
 * existe sistema de props, então fica fixo como constante didática.
 */
const DEMANDA_BASE = 1.4;

/** `setInterval(() => this.tickDemanda(), 2400)` — logic.js linha 149. */
const INTERVALO_TICK_MS = 2400;

function criarZonas(): ZonaDemanda[] {
  // criarZonas() — logic.js linha 154.
  return CLUSTERS.map((c) => ({
    id: c.id,
    x: c.x,
    y: c.y,
    cells: c.cells as [number, number][],
    base: c.base,
    pax: 3,
    mot: 3,
    mult: 1,
  }));
}

type DemandaState = {
  zonas: ZonaDemanda[];
  chuva: boolean;
  evento: boolean;

  /** Recalcula pax/mot/mult de cada zona. Chamar a cada tick (ver `iniciarTick`). */
  tickDemanda: () => void;
  /** Multiplica demanda por 1.7 — botão de debug (ARQUITETURA §6.4 / §9 Módulo 9). */
  toggleChuva: () => void;
  /** Zona de índice 1 recebe fator 3x — evento pontual (ex.: show no estádio). */
  toggleEvento: () => void;
  /** Faixa de multiplicador exibida na pill do mapa e no card de oferta. */
  faixaDe: (zona: ZonaDemanda) => [number, number];
  /** Zona com maior `mult` no momento — usada por `corridaStore.gerarOferta()`. */
  zonaQuente: () => ZonaDemanda;

  /** Roda `tickDemanda()` uma vez e agenda o `setInterval` de 2.4s. Chamar no
   * mount da tela que precisa da camada de demanda (idempotente). */
  iniciarTick: () => void;
  /** Limpa o `setInterval` iniciado por `iniciarTick()`. Chamar no cleanup do
   * `useEffect` do consumidor — nunca deixe o timer vazar. */
  pararTick: () => void;
};

/** Id do `setInterval` do tick — fora do estado do Zustand de propósito
 * (não é dado reativo, é housekeeping; equivalente a `this.demandaId` no
 * protótipo). */
let intervalId: ReturnType<typeof setInterval> | null = null;

export const useDemandaStore = create<DemandaState>()((set, get) => ({
  zonas: criarZonas(),
  chuva: false,
  evento: false,

  tickDemanda: () => {
    const { chuva, evento, zonas } = get();
    const fatorChuva = chuva ? 1.7 : 1;
    const proximasZonas = zonas.map((zonaAnterior, i) => {
      const z: ZonaDemanda = { ...zonaAnterior };
      const fatorEvento = evento && i === 1 ? 3 : 1;
      // z.pax — logic.js linha 161.
      z.pax = z.base * DEMANDA_BASE * fatorChuva * fatorEvento * (0.78 + Math.random() * 0.44);
      // z.mot — motoristas "migram" para zonas quentes e a zona esfria
      // sozinha (logic.js linhas 162-163 / ARQUITETURA §6.4).
      const quente = z.mult >= 1.4;
      z.mot = Math.max(1, Math.min(14, z.mot + (quente ? 0.8 : -0.35) + (Math.random() - 0.5)));
      // razao + log2 + teto 2.5 — algoritmo de surge, ARQUITETURA §6.3.
      const razao = z.pax / (z.mot + 1);
      const novo = Math.min(2.5, Math.round((1 + Math.log2(Math.max(razao, 1)) * 0.5) * 10) / 10);
      // suavização: 25% por tick em direção ao novo valor (logic.js linha 166).
      z.mult = Math.round((z.mult + (novo - z.mult) * 0.25) * 100) / 100;
      return z;
    });
    set({ zonas: proximasZonas });
  },

  toggleChuva: () => {
    set((s) => ({ chuva: !s.chuva }));
    get().tickDemanda();
  },
  toggleEvento: () => {
    set((s) => ({ evento: !s.evento }));
    get().tickDemanda();
  },

  faixaDe: (zona) => {
    // faixaDe(z) — logic.js linhas 171-174.
    const min = Math.max(1, Math.round(zona.mult * 10) / 10);
    return [min, Math.min(2.6, Math.round((min + 0.4) * 10) / 10)];
  },

  zonaQuente: () => {
    // zonaQuente() — logic.js linha 175.
    const { zonas } = get();
    if (zonas.length === 0) {
      // Fallback estrutural — no protótipo `this.zonas` nunca está vazio
      // (sempre inicializado por `criarZonas()` no mount), mas o tipo de
      // retorno precisa ser total.
      return { id: '', x: 0, y: 0, cells: [], base: 0, pax: 0, mot: 0, mult: 1 };
    }
    return zonas.reduce((a, b) => (b.mult > a.mult ? b : a), zonas[0]);
  },

  iniciarTick: () => {
    get().tickDemanda();
    if (intervalId != null) clearInterval(intervalId);
    intervalId = setInterval(() => get().tickDemanda(), INTERVALO_TICK_MS);
  },
  pararTick: () => {
    if (intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },
}));
