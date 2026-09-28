/**
 * CamadaMapaReal — o fundo do mapa, agora com cartografia de verdade.
 *
 * Substitui `RuasEQuadras`, que desenhava à mão uma cidade fictícia (uma
 * grade de retângulos brancos, dois parques e uma represa). No lugar entram
 * **tiles reais** de cartografia escura, sobre a qual rota, pins e hexágonos
 * de demanda continuam legíveis. Ver `urlDoTile` para a escolha do servidor.
 *
 * O componente é um **tile layer** completo, só que estático: como o plano do
 * app é fixo (o mundo não se move sob o motorista simulado), não há
 * recálculo por gesto. Monta-se a grade de tiles uma vez, e o pan/zoom é o
 * mesmo `transform` do `MapaBase` que já movia as ruas desenhadas — ou seja,
 * arrastar e dar zoom continua funcionando exatamente como antes.
 *
 * ## Como a grade é montada
 *
 * `@/servicos/geo` garante que **1 px de plano = 1 px de tile no zoom 17**.
 * Isso reduz o trabalho aqui a três passos:
 *
 * 1. Traduzir a região visível do plano para pixels globais do Web Mercator.
 * 2. Dividir por `LADO_TILE_PLANO` para achar os índices `{x, y}` a baixar.
 * 3. Devolver cada tile a `left`/`top` de plano, já no tamanho ampliado.
 *
 * ## Região coberta
 *
 * Precisa cobrir tudo que o pan pode revelar. O pior caso é zoom 1 com o pan
 * no limite de corrida (±340px, `LIMITE_PAN_CORRIDA` do `MapaBase`), porque
 * com zoom > 1 a área de plano visível encolhe. Daí a folga de
 * {@link TRANSBORDO} em cada lado — nunca aparece borda vazia.
 *
 * ## Atribuição
 *
 * Esri e os dados de origem (ODbL do OSM) exigem crédito: o texto é
 * obrigatório e fica no `MapaBase`, na camada de UI fixa (não some com o pan).
 */

import React, { useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import {
  ANCORA_MUNDO,
  CENTRO_PLANO_X,
  CENTRO_PLANO_Y,
  LADO_TILE,
  ZOOM_TILE,
} from '@/servicos/geo';
import { coresMapaEscuro } from '@/tema/cores';

/** Frame de referência do protótipo. */
const LARGURA_PADRAO = 390;
const ALTURA_PADRAO = 844;

/**
 * Folga de tiles em cada lado do frame. 340 = `LIMITE_PAN_CORRIDA`, o maior
 * deslocamento que um arraste consegue produzir; qualquer valor menor deixaria
 * a borda do mapa aparecer no fim do pan durante uma corrida.
 */
const TRANSBORDO = 340;

/**
 * Servidor de tiles: **Dark Gray Canvas** da Esri.
 *
 * ## Por que ele
 *
 * O pedido foi tirar os nomes de rua do mapa. Em tile raster isso não se faz
 * por código: o rótulo está gravado no pixel da imagem. A única saída é trocar
 * a base por uma desenhada para ser discreta — e é o que esta é. Comparada ao
 * OSM padrão que estava aqui, ela some com **número de porta, nome de edifício
 * e os ícones de ponto de ônibus**, que eram o grosso da poluição; sobram as
 * vias, as áreas e uns poucos rótulos de referência, como na captura do app
 * real usada de alvo.
 *
 * Também já nasce escura, então o filtro de inversão que existia aqui saiu:
 * a cor vem pronta do servidor, sem passar por `invert`/`hue-rotate`. Menos
 * processamento e cor mais fiel.
 *
 * Alternativas descartadas, todas medidas: `dark_nolabels` do CARTO seria
 * perfeita (escura E sem rótulo nenhum), mas volta carimbada com "API KEY
 * REQUIRED" atravessada no tile — conferido baixando um. Chave não cabe num
 * export estático, onde ela ficaria pública no bundle.
 *
 * ## `{z}/{y}/{x}` — linha antes da coluna
 *
 * O ArcGIS inverte a ordem em relação ao padrão "slippy map". Trocar os dois
 * devolve tiles de outro lugar do mundo, sem erro nenhum.
 */
function urlDoTile(x: number, y: number, z: number): string {
  return (
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/' +
    `World_Dark_Gray_Base/MapServer/tile/${z}/${y}/${x}`
  );
}

/**
 * Zoom pedido ao servidor.
 *
 * A base da Esri termina no 16 nesta região — no 17 ela devolve, com HTTP 200,
 * um tile cinza escrito "Map data not yet available".
 *
 * Por isso `geo.ts` ancora o plano no PRÓPRIO 16: o tile vai para a tela no
 * tamanho nativo, sem ampliação. Foi uma correção de rota — antes o 16 era
 * desenhado em 512 para preservar a escala do 17, e o efeito colateral era
 * rótulo de rua em dobro, atravessando a tela como faixa. Em tamanho nativo
 * eles voltam a ser a legenda discreta que a referência mostra, e o traço
 * ainda ganha nitidez.
 */
const ZOOM_SERVIDOR = 16;

/** Lado do tile já convertido para pixels de plano (256 × 2). */
const LADO_TILE_PLANO = LADO_TILE * Math.pow(2, ZOOM_TILE - ZOOM_SERVIDOR);

/** Crédito exigido pela Esri e pelos dados de origem (ODbL do OSM). */
export const ATRIBUICAO_MAPA = 'Esri · HERE · Garmin · © OpenStreetMap';

export type CamadaMapaRealProps = {
  /** Largura do frame do mapa em px de plano. Padrão 390. */
  largura?: number;
  /** Altura do frame do mapa em px de plano. Padrão 844. */
  altura?: number;
};

type Tile = { chave: string; url: string; left: number; top: number };

/**
 * Desenha o mapa real. Deve ser o primeiro filho do container de mapa (abaixo
 * de hexágonos de demanda, rota e marcadores).
 */
export function CamadaMapaReal({
  largura = LARGURA_PADRAO,
  altura = ALTURA_PADRAO,
}: CamadaMapaRealProps) {
  const tiles = useMemo<Tile[]>(() => {
    // 1. Região do plano a cobrir, com a folga de pan nos quatro lados.
    const planoX0 = -TRANSBORDO;
    const planoY0 = -TRANSBORDO;
    const planoX1 = largura + TRANSBORDO;
    const planoY1 = altura + TRANSBORDO;

    // 2. A mesma região em pixels globais do Web Mercator, e daí em índices
    //    de tile. `floor`/`ceil` porque as bordas quase nunca caem em múltiplo
    //    de 256 — sem eles faltaria meia fileira de tile em cada ponta.
    const mundoX0 = ANCORA_MUNDO.x + (planoX0 - CENTRO_PLANO_X);
    const mundoY0 = ANCORA_MUNDO.y + (planoY0 - CENTRO_PLANO_Y);
    const mundoX1 = ANCORA_MUNDO.x + (planoX1 - CENTRO_PLANO_X);
    const mundoY1 = ANCORA_MUNDO.y + (planoY1 - CENTRO_PLANO_Y);

    const tileX0 = Math.floor(mundoX0 / LADO_TILE_PLANO);
    const tileY0 = Math.floor(mundoY0 / LADO_TILE_PLANO);
    const tileX1 = Math.ceil(mundoX1 / LADO_TILE_PLANO);
    const tileY1 = Math.ceil(mundoY1 / LADO_TILE_PLANO);

    // Quantidade de tiles por eixo no zoom atual — usado para descartar
    // índices fora do mundo (não acontece em São Paulo, mas mantém a função
    // correta perto de ±180° de longitude).
    const totalTiles = Math.pow(2, ZOOM_SERVIDOR);

    const lista: Tile[] = [];
    for (let ty = tileY0; ty < tileY1; ty++) {
      if (ty < 0 || ty >= totalTiles) continue;
      for (let tx = tileX0; tx < tileX1; tx++) {
        if (tx < 0 || tx >= totalTiles) continue;
        lista.push({
          chave: `${tx}/${ty}`,
          url: urlDoTile(tx, ty, ZOOM_SERVIDOR),
          // 3. De volta ao plano: onde a borda superior-esquerda deste tile
          //    cai em coordenadas do protótipo.
          left: tx * LADO_TILE_PLANO - ANCORA_MUNDO.x + CENTRO_PLANO_X,
          top: ty * LADO_TILE_PLANO - ANCORA_MUNDO.y + CENTRO_PLANO_Y,
        });
      }
    }
    return lista;
  }, [largura, altura]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Fundo sólido por baixo: é o que se vê enquanto os tiles carregam, e
          o que evita um flash branco no primeiro frame. */}
      <View
        style={[
          estilos.fundo,
          {
            left: -TRANSBORDO,
            top: -TRANSBORDO,
            width: largura + TRANSBORDO * 2,
            height: altura + TRANSBORDO * 2,
          },
        ]}
      />

      <View style={StyleSheet.absoluteFill}>
        {tiles.map((t) => (
          <Image
            key={t.chave}
            source={{ uri: t.url }}
            style={[estilos.tile, { left: t.left, top: t.top }]}
            // Os tiles já vêm no tamanho exato da caixa; `cover` só protege
            // contra um tile @2x que volte com proporção inesperada.
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ))}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  fundo: {
    position: 'absolute',
    backgroundColor: coresMapaEscuro.fundo,
  },
  tile: {
    position: 'absolute',
    width: LADO_TILE_PLANO,
    height: LADO_TILE_PLANO,
  },
});

export default CamadaMapaReal;
