// Tipos de domínio.
// Parte 1 portada literalmente de ARQUITETURA.md §5 (modelo de dados mock).
// Parte 2 é específica deste protótipo: geometria do "mapa falso" descrita em
// .design-import/logic.js (linhas 1-120) — coordenadas em pixels de um plano
// falso (frame 390×844), não lat/lng real.

// ---------------------------------------------------------------------------
// Modelo de dados (mock) — ARQUITETURA.md §5
// ---------------------------------------------------------------------------

export type Local = {
  latitude: number;
  longitude: number;
  endereco: string; // "Rua das Flores, 123"
  bairro: string;
};

export type Passageiro = {
  id: string;
  nome: string;
  nota: number; // 1.0 a 5.0
  fotoUrl: string;
  totalViagens: number;
};

export type StatusCorrida =
  | 'OFFLINE' | 'ONLINE' | 'OFERTA_ATIVA'
  | 'INDO_BUSCAR' | 'AGUARDANDO' | 'EM_VIAGEM' | 'FINALIZADA';

export type Corrida = {
  id: string;
  passageiro: Passageiro;
  origem: Local;
  destino: Local;
  distanciaAteOrigemKm: number;
  distanciaViagemKm: number;
  duracaoEstimadaMin: number;

  valorBase: number; // bandeirada + km + min
  multiplicador: number; // 1.0 quando não há dinâmico
  zonaOrigemId: string; // qual zona gerou o multiplicador
  valor: number; // valorBase × multiplicador — o que o motorista recebe

  categoria: '99Pop' | '99Comfort' | '99Entrega';
  status: StatusCorrida;
  criadaEm: number; // timestamp
  expiraEm: number; // timestamp — oferta some depois disso
};

// ---------------------------------------------------------------------------
// Geometria do mapa falso — específica do protótipo (logic.js linhas 1-120)
// ---------------------------------------------------------------------------

/** Coordenada no plano falso (px), NÃO lat/lng real. */
export type Ponto = [number, number];

/** Trajeto bruto, com os vértices originais do protótipo (poucos pontos). */
export type Trajeto = {
  origem: string;
  destino: string;
  buscar: Ponto[]; // vértices brutos de "ir buscar o passageiro"
  viagem: Ponto[]; // vértices brutos da "viagem até o destino"
};

/**
 * Resultado de `preparar()`: uma polyline densificada (1 vértice a cada
 * ~12px), pronta para desenhar como <Path> SVG e para interpolar por
 * comprimento de arco com `emT()`.
 */
export type GeometriaPreparada = {
  s: Ponto[]; // vértices densificados
  cum: number[]; // comprimento acumulado até cada vértice de `s`
  d: string; // atributo `d` de um <Path> SVG: "M x y L x y L x y ..."
  len: number; // comprimento total da polyline
  vertices: number; // quantidade de vértices originais (antes de densificar)
};

/** Trajeto já processado por `preparar()`, pronto para renderizar e animar. */
export type TrajetoPreparado = {
  origem: string;
  destino: string;
  pb: GeometriaPreparada; // "buscar" densificado
  pv: GeometriaPreparada; // "viagem" densificado
  km: number;
  kmOrigem: number;
  min: number;
  minOrigem: number;
};

/** Zona de demanda (cluster) do mapa falso, já enriquecida em runtime. */
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

// ---------------------------------------------------------------------------
// Veículo — logic.js Component.state.veiculos (linha 132-136)
// ---------------------------------------------------------------------------

export type TipoVeiculo = 'MOTO' | 'CARRO' | 'BIKE';

export type Veiculo = {
  tipo: TipoVeiculo;
  modelo: string;
  placa: string;
  arte: string;
};
