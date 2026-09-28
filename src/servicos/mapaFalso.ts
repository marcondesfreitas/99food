// Geometria do "mapa falso" do protótipo Claude Design.
// Porta LITERAL de .design-import/logic.js (linhas 1-120) — é matemática
// pura, não muda entre plataformas. Zero UI aqui: nenhuma função deste
// arquivo importa React ou React Native.
//
// Sistema de coordenadas: plano falso em pixels, frame de referência
// 390×844 (o mesmo do protótipo). Quem consome isso (componentes de mapa)
// escala para o tamanho real de tela, não aqui.

import { coresMapa } from '@/tema/cores';
import type {
  GeometriaPreparada,
  Ponto,
  Trajeto,
  TrajetoPreparado,
} from '@/state/tipos';

// ---------------------------------------------------------------------------
// Malha de ruas
// ---------------------------------------------------------------------------

export const VERT = [-49, 23, 95, 167, 239, 311, 383, 455];
export const HORIZ = [-40, 46, 132, 218, 304, 390, 476, 562, 648, 734, 820, 906];

export const CX = 5;
export const CY = 4.5;
export const HOME: Ponto = [167 + CX, 562 + CY];

/** Converte índice de rua vertical para coordenada x em pixels. */
export function vx(i: number): number {
  return i + CX;
}

/** Converte índice de rua horizontal para coordenada y em pixels. */
export function hy(i: number): number {
  return i + CY;
}

/** Avenida diagonal (Av. Radial Leste) — y em função de x. */
export function diag(x: number): number {
  return 534 - 0.6333 * (x - 23);
}

/** Escala do protótipo: "metros" por pixel, usada para km/min estimados. */
const METRO_PX = 6;

// ---------------------------------------------------------------------------
// Trajetos pré-calculados (5 rotas fixas do protótipo)
// ---------------------------------------------------------------------------

export const ROTAS: Trajeto[] = [
  {
    origem: 'Avenida Paes de Barros, 1815, Mooca',
    destino: 'Rua Augusta, 2205, Jardins',
    buscar: [HOME, [vx(167), hy(476)], [vx(95), hy(476)]],
    viagem: [
      [vx(95), hy(476)], [vx(95), hy(304)], [vx(167), hy(304)],
      [vx(167), hy(218)], [vx(239), hy(218)], [vx(239), hy(132)], [vx(311), hy(132)],
    ],
  },
  {
    origem: 'Rua da Mooca, 2450, Mooca',
    destino: 'Avenida Rebouças, 1980, Pinheiros',
    buscar: [HOME, [vx(239), hy(562)], [vx(239), hy(476)]],
    viagem: [
      [vx(239), hy(476)], [vx(311), hy(476)], [vx(311), hy(304)],
      [vx(239), hy(304)], [vx(239), hy(218)], [vx(167), hy(218)],
      [vx(167), hy(132)], [vx(95), hy(132)],
    ],
  },
  {
    origem: 'Avenida Celso Garcia, 3200, Tatuapé',
    destino: 'Rua Vergueiro, 3185, Vila Mariana',
    buscar: [HOME, [vx(167), hy(648)], [vx(95), hy(648)]],
    viagem: [
      [vx(95), hy(648)], [vx(95), diag(vx(95))], [vx(167), diag(vx(167))],
      [vx(239), diag(vx(239))], [vx(311), diag(vx(311))], [vx(311), hy(218)], [vx(383), hy(218)],
    ],
  },
  {
    origem: 'Rua Bresser, 1490, Mooca',
    destino: 'Praça Silvio Romero, 90, Tatuapé',
    buscar: [HOME, [vx(239), hy(562)], [vx(311), hy(562)]],
    viagem: [
      [vx(311), hy(562)], [vx(311), hy(476)], [vx(239), hy(476)],
      [vx(239), hy(390)], [vx(167), hy(390)],
    ],
  },
  {
    origem: 'Rua Javari, 220, Mooca',
    destino: 'Avenida Sapopemba, 4100, Vila Prudente',
    buscar: [HOME, [vx(95), hy(562)], [vx(95), hy(304)], [vx(23), hy(304)]],
    viagem: [
      [vx(23), hy(304)], [vx(23), hy(476)], [vx(95), hy(476)], [vx(95), hy(562)],
      [vx(167), hy(562)], [vx(167), hy(648)], [vx(239), hy(648)], [vx(239), hy(734)],
      [vx(311), hy(734)], [vx(311), hy(648)], [vx(383), hy(648)],
    ],
  },
];

// ---------------------------------------------------------------------------
// Zonas de demanda e passageiros decorativos
// ---------------------------------------------------------------------------

export type Cluster = {
  id: string;
  x: number;
  y: number;
  base: number;
  cells: [number, number][];
};

export const CLUSTERS: Cluster[] = [
  { id: 'c1', x: -40, y: 104, base: 8.5, cells: [[0, 0], [1, 0], [0, 1]] },
  { id: 'c2', x: 246, y: 268, base: 11, cells: [[0, 0], [0, 1]] },
  { id: 'c3', x: 18, y: 424, base: 6, cells: [[0, 0]] },
  { id: 'c4', x: 168, y: 556, base: 8, cells: [[0, 0], [1, 0]] },
  { id: 'c5', x: -74, y: 688, base: 4.5, cells: [[0, 0]] },
];

export const PAX: Ponto[] = [
  [vx(167), hy(218)],
  [vx(311), hy(390)],
  [vx(95), hy(734)],
];

// ---------------------------------------------------------------------------
// Categorias de corrida por tipo de veículo, tipos de conta e tiles da
// carteira — logic.js linhas 51-57. Não são geometria, mas vêm do mesmo
// trecho de constantes estáticas e são consumidas por `motoristaStore`.
// ---------------------------------------------------------------------------

/**
 * Categorias de corrida por tipo de veículo — strings VISÍVEIS, renderizadas
 * na tela de Preferências de serviços (B15).
 *
 * O `logic.js` (linhas 51-55) escreve "Rota Moto", "Rota Food", "Rota Bike"…,
 * mas essas são rótulos da marca fictícia do protótipo. O DESIGN_SYSTEM §14
 * é explícito: "nenhuma string visível do protótipo contém 'rota' ou 'rotas';
 * onde a palavra aparecia, fica 99" — e o §11.9 dá a lista final, usada aqui.
 * A lista de CARRO não muda (nunca teve "rota").
 */
export const CATEGORIAS: Record<'MOTO' | 'CARRO' | 'BIKE', string[]> = {
  MOTO: ['99Moto', '99Entrega Moto', '99Moto Promocional', '99Entrega Moto Empresas', '99Food'],
  CARRO: ['Pop', 'Entrega Carro', 'Negocia', 'Pop Expresso'],
  BIKE: ['99Bike', '99Entrega Bike'],
};

export const TIPOS_CONTA: string[] = [
  'Conta corrente',
  'Conta-poupança',
  'Conta de ganhos',
  'Instituição de pagamento',
];

/** [rótulo do tile, destaque] — logic.js linha 57. */
export const TILES: [string, boolean][] = [
  ['Pagar boleto', true],
  ['Transferências', false],
  ['Recarregar celular', false],
  ['Gift Card', false],
];

/**
 * Passageiros mock — [nome, iniciais, nota, total de viagens] — logic.js
 * linha 3. Usado por `corridaStore.gerarOferta()` para sortear quem "pediu"
 * a corrida.
 */
export const NOMES: [string, string, number, number][] = [
  ['Marina Alves', 'MA', 4.88, 243],
  ['Rafael Souza', 'RS', 4.93, 128],
  ['Cléo Bastos', 'CB', 4.72, 33],
  ['Diego Nunes', 'DN', 4.81, 205],
];

/**
 * Duração das duas pernas do "piloto automático", em segundos — logic.js
 * linha 59. Usado por `corridaStore.iniciarLoop()` para saber quanto tempo
 * a interpolação de `prog` leva em cada trecho (indo buscar vs. em viagem).
 */
export const DUR_BUSCAR = 12;
export const DUR_VIAGEM = 20;

/**
 * Itens verificados na tela "Teste de status" — logic.js linha 2. A tela
 * (B16) acende um por vez, a cada 1150ms (`rodarTeste()`, logic.js linha 314).
 */
export const CHECK: string[] = [
  'Status de internet',
  'Localização',
  'Status do perfil',
  'Análise de documentos',
  'Status da solicitação',
  'Configurações da solicitação',
];

/**
 * Telas "empurradas" (push) a partir do menu/perfil — logic.js linha 58.
 * A navegação real (Expo Router) é montada em B25; esta lista é a ordem e os
 * identificadores originais do protótipo.
 */
export const PUSH_TELAS: string[] = [
  'prefsolic',
  'prefservicos',
  'teste',
  'central',
  'carteira',
  'pix',
  'perfil',
  'config',
  'conta',
  'veiculos',
];

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

export function fmt(n: number): string {
  return 'R$ ' + n.toFixed(2).replace('.', ',');
}

export function um(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

export function faixaFmt(a: number, b: number): string {
  return um(a) + 'X–' + um(b) + 'X';
}

// ---------------------------------------------------------------------------
// Densificação de polylines e interpolação por comprimento de arco
// ---------------------------------------------------------------------------

/**
 * Densifica uma polyline (1 vértice a cada ~12px) e devolve o comprimento
 * acumulado + string SVG `d`. Sem isso o marcador "salta" de vértice em
 * vértice em vez de andar suavemente (ver DESIGN_SYSTEM.md §13.3).
 */
export function preparar(pts: Ponto[]): GeometriaPreparada {
  const s: Ponto[] = [[pts[0][0], pts[0][1]]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.round(d / 12));
    for (let k = 1; k <= n; k++) {
      s.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
  }
  const cum = [0];
  for (let i = 1; i < s.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
  }
  let d = 'M' + s[0][0].toFixed(1) + ' ' + s[0][1].toFixed(1);
  for (let i = 1; i < s.length; i++) {
    d += ' L' + s[i][0].toFixed(1) + ' ' + s[i][1].toFixed(1);
  }
  return { s, cum, d, len: cum[cum.length - 1], vertices: pts.length };
}

/**
 * Dado um `t` de 0 a 1 (progresso), devolve a posição e o bearing
 * interpolando por comprimento de arco acumulado (busca binária em
 * `prep.cum`) — não por índice de vértice. É o que faz o "piloto
 * automático" não frear nas curvas (DESIGN_SYSTEM.md §13.3, item mais
 * citado como erro provável).
 */
export function emT(
  prep: GeometriaPreparada,
  t: number
): { x: number; y: number; bearing: number } {
  const alvo = Math.max(0, Math.min(1, t)) * prep.len;
  const c = prep.cum;
  let lo = 0;
  let hi = c.length - 1;
  while (lo < hi - 1) {
    const m = (lo + hi) >> 1;
    if (c[m] <= alvo) lo = m; else hi = m;
  }
  const seg = c[hi] - c[lo];
  const f = seg === 0 ? 0 : (alvo - c[lo]) / seg;
  const a = prep.s[lo];
  const b = prep.s[hi];
  const ad = prep.s[Math.min(prep.s.length - 1, hi + 2)];
  return {
    x: a[0] + (b[0] - a[0]) * f,
    y: a[1] + (b[1] - a[1]) * f,
    bearing: Math.atan2(ad[0] - a[0], -(ad[1] - a[1])) * 180 / Math.PI,
  };
}

// ---------------------------------------------------------------------------
// Trajetos processados (prontos para render + animação)
// ---------------------------------------------------------------------------

export const TRAJETOS: TrajetoPreparado[] = ROTAS.map((r) => {
  const pb = preparar(r.buscar);
  const pv = preparar(r.viagem);
  return {
    origem: r.origem,
    destino: r.destino,
    pb,
    pv,
    km: Math.round(pv.len * METRO_PX / 100) / 10,
    kmOrigem: Math.round(pb.len * METRO_PX / 100) / 10,
    min: Math.max(3, Math.round(pv.len * METRO_PX / 1000 * 2.7)),
    minOrigem: Math.max(2, Math.round(pb.len * METRO_PX / 1000 * 2.7)),
  };
});

// ---------------------------------------------------------------------------
// Quadras e rótulos decorativos do mapa falso
// ---------------------------------------------------------------------------

export type Quadra = {
  key: string;
  left: number;
  top: number;
  w: number;
  h: number;
  raio: number;
  cor: string;
};

export const QUADRAS: Quadra[] = [
  { key: 'parque', left: vx(239) + 5, top: hy(132) + 4.5, w: 67, h: 81, raio: 12, cor: coresMapa.verde },
  { key: 'agua', left: vx(23) + 5, top: hy(734) + 4.5, w: 67, h: 81, raio: 14, cor: coresMapa.agua },
  { key: 'q1', left: vx(95) + 18, top: hy(218) + 18, w: 40, h: 48, raio: 6, cor: coresMapa.quadra },
  { key: 'q2', left: vx(311) + 16, top: hy(476) + 20, w: 44, h: 44, raio: 6, cor: coresMapa.quadra },
  { key: 'q3', left: vx(167) + 20, top: hy(648) + 18, w: 38, h: 46, raio: 6, cor: coresMapa.quadra },
  { key: 'q4', left: vx(-49) + 16, top: hy(46) + 18, w: 44, h: 50, raio: 6, cor: coresMapa.quadra },
  { key: 'q5', left: vx(383) + 14, top: hy(304) + 16, w: 46, h: 52, raio: 6, cor: coresMapa.quadra },
  { key: 'parque2', left: vx(311) + 8, top: hy(820) + 6, w: 62, h: 74, raio: 12, cor: coresMapa.verde },
];

export type Rotulo = {
  key: string;
  left: number;
  top: number;
  txt: string;
  cor: string;
  rot: number;
};

export const ROTULOS: Rotulo[] = [
  { key: 'radial', left: 60, top: diag(60) - 16, txt: 'AV. RADIAL LESTE', cor: coresMapa.rotuloRua, rot: -32.33 },
  { key: 'paes', left: vx(239) + 14, top: hy(476) - 12, txt: 'AV. PAES DE BARROS', cor: coresMapa.rotuloRua, rot: 0 },
  { key: 'mooca', left: vx(95) + 14, top: hy(648) - 12, txt: 'R. DA MOOCA', cor: coresMapa.rotuloRua, rot: 0 },
  { key: 'bresser', left: vx(167) + 12, top: hy(304) + 16, txt: 'R. BRESSER', cor: coresMapa.rotuloRua, rot: 90 },
  { key: 'parque', left: vx(239) + 12, top: hy(132) + 60, txt: 'PARQUE DA MOOCA', cor: coresMapa.rotuloVerde, rot: 0 },
  { key: 'agua', left: vx(23) + 12, top: hy(734) + 60, txt: 'REPRESA', cor: coresMapa.rotuloAgua, rot: 0 },
];
