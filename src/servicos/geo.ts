/**
 * Georreferenciamento do plano do mapa — Web Mercator.
 *
 * Existe para responder uma única pergunta: **onde, no mundo real, fica o
 * ponto (x, y) do plano do protótipo?**
 *
 * O app inteiro (rotas de `mapaFalso.ts`, hexágonos de demanda, marcador do
 * carro, pins de origem/destino) trabalha em *pixels de plano*, no frame
 * 390×844 herdado do Claude Design. Nada disso muda. O que muda é o **fundo**:
 * em vez das ruas desenhadas à mão de `RuasEQuadras`, agora entram tiles
 * cartográficos de verdade (Dark Gray Canvas da Esri).
 *
 * Para os dois mundos conversarem, ancoramos o plano no mundo real por uma
 * relação simples, de propósito:
 *
 * 1. O centro do plano — (195, 422), o mesmo `transform-origin` do protótipo —
 *    cai em {@link ANCORA}, na Mooca, São Paulo. É o bairro que o mapa falso
 *    já dizia representar (Av. Paes de Barros, R. da Mooca, R. Bresser,
 *    Av. Radial Leste — todas ruas reais dali).
 * 2. **1 px de plano = 1 px de tile no zoom {@link ZOOM_TILE}.** Essa é a
 *    escolha que torna tudo o resto trivial: nenhuma escala entra na conta,
 *    os tiles são desenhados no tamanho nativo (256px) e a imagem fica nítida.
 *
 * Consequência da regra 2: a escala do plano é a resolução do Web Mercator no
 * {@link ZOOM_TILE} na latitude da âncora — hoje ~2,2 m/px (ver
 * {@link metrosPorPixel}). Com isso os 72px entre duas ruas da grade do
 * protótipo valem ~158m, ainda na ordem de grandeza de um quarteirão paulistano:
 * as rotas pré-desenhadas continuam parecendo trajetos plausíveis sobre as ruas
 * de verdade.
 *
 * ATENÇÃO a uma inconsistência deliberada: `mapaFalso.METRO_PX` (6 m/px) segue
 * intocado, porque é ele que produz os km/min mostrados nos cards de oferta, e
 * esses números fazem parte do design do protótipo. Ou seja, a escala usada
 * para *desenhar* e a usada para *estimar distância* são diferentes. Isso não
 * aparece na tela — mas se um dia as distâncias precisarem bater com o mapa,
 * é aqui que a conversa começa.
 */

/** Lado de um tile do Web Mercator, em pixels. */
export const LADO_TILE = 256;

/**
 * Zoom dos tiles, e portanto a escala do plano.
 *
 * Era 17 enquanto a base vinha do OpenStreetMap. Com o Dark Gray Canvas da
 * Esri passou a 16, por dois motivos que andam juntos: a base da Esri termina
 * no 16 nesta região, e desenhar o tile no tamanho nativo (em vez de ampliado)
 * mantém o traço nítido e os rótulos pequenos — no dobro do tamanho eles
 * viravam faixas de texto atravessando a tela.
 *
 * Consequência: 1 px de plano ≈ 2,2 m (ver {@link metrosPorPixel}), então os
 * 72 px entre duas ruas da grade do protótipo passam a valer ~158 m.
 */
export const ZOOM_TILE = 16;

/** Centro do plano no protótipo (`transform-origin: 195px 422px`). */
export const CENTRO_PLANO_X = 195;
export const CENTRO_PLANO_Y = 422;

/**
 * Onde o centro do plano cai no mundo real: Mooca, São Paulo — entre a
 * Av. Paes de Barros e a R. da Mooca, as duas avenidas que o mapa falso
 * rotulava.
 */
export const ANCORA = { lat: -23.5566, lng: -46.5943 } as const;

/** Circunferência da Terra no equador, em metros (Web Mercator). */
const CIRCUNFERENCIA_EQUADOR = 40075016.686;

export type PontoMundo = { x: number; y: number };

/**
 * lat/lng → pixel global do Web Mercator no zoom informado. É a projeção
 * padrão de todo tile server "slippy map" (`{z}/{x}/{y}.png`).
 */
export function latLngParaPixelMundo(
  lat: number,
  lng: number,
  zoom: number = ZOOM_TILE
): PontoMundo {
  const escala = LADO_TILE * Math.pow(2, zoom);
  const seno = Math.sin((lat * Math.PI) / 180);
  // Clamp evita ±Infinity nos polos; irrelevante para São Paulo, obrigatório
  // para a função ser total.
  const senoLimitado = Math.min(Math.max(seno, -0.9999), 0.9999);
  return {
    x: ((lng + 180) / 360) * escala,
    y:
      (0.5 -
        Math.log((1 + senoLimitado) / (1 - senoLimitado)) / (4 * Math.PI)) *
      escala,
  };
}

/** Inversa de {@link latLngParaPixelMundo}. */
export function pixelMundoParaLatLng(
  x: number,
  y: number,
  zoom: number = ZOOM_TILE
): { lat: number; lng: number } {
  const escala = LADO_TILE * Math.pow(2, zoom);
  const n = Math.PI - (2 * Math.PI * y) / escala;
  return {
    lat: (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
    lng: (x / escala) * 360 - 180,
  };
}

/** Pixel global da âncora — a origem de toda conversão plano ↔ mundo. */
export const ANCORA_MUNDO = latLngParaPixelMundo(ANCORA.lat, ANCORA.lng);

/**
 * Pixel de plano → pixel global do tile server. Um `translate` puro, pela
 * regra "1 px de plano = 1 px de tile" descrita no cabeçalho.
 */
export function planoParaPixelMundo(x: number, y: number): PontoMundo {
  return {
    x: ANCORA_MUNDO.x + (x - CENTRO_PLANO_X),
    y: ANCORA_MUNDO.y + (y - CENTRO_PLANO_Y),
  };
}

/** Pixel de plano → coordenada geográfica de verdade. */
export function planoParaLatLng(x: number, y: number): { lat: number; lng: number } {
  const p = planoParaPixelMundo(x, y);
  return pixelMundoParaLatLng(p.x, p.y);
}

/** Coordenada geográfica → pixel de plano. */
export function latLngParaPlano(lat: number, lng: number): { x: number; y: number } {
  const p = latLngParaPixelMundo(lat, lng);
  return {
    x: CENTRO_PLANO_X + (p.x - ANCORA_MUNDO.x),
    y: CENTRO_PLANO_Y + (p.y - ANCORA_MUNDO.y),
  };
}

/**
 * Metros cobertos por 1 px de plano na latitude da âncora — ~2,2 m no zoom 16.
 * Serve para escalas/depuração; os km mostrados nas ofertas continuam vindo de
 * `mapaFalso.ts` (ver a ressalva no cabeçalho).
 */
export function metrosPorPixel(
  lat: number = ANCORA.lat,
  zoom: number = ZOOM_TILE
): number {
  return (
    (CIRCUNFERENCIA_EQUADOR * Math.cos((lat * Math.PI) / 180)) /
    (LADO_TILE * Math.pow(2, zoom))
  );
}
