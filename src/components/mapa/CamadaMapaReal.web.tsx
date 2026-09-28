/**
 * CamadaMapaReal (WEB) — o fundo do mapa em **tiles vetoriais**, via MapLibre.
 *
 * Esta é a versão que roda no navegador; o Metro escolhe o arquivo `.web.tsx`
 * automaticamente. `CamadaMapaReal.tsx`, ao lado, continua sendo a versão
 * raster e é a que valeria num build nativo.
 *
 * ## Por que trocar raster por vetor
 *
 * O pedido foi tirar os nomes de rua e deixar só símbolos e pontos de
 * referência. Em tile raster isso é impossível: o rótulo já vem gravado no
 * pixel da imagem, e a única defesa era escolher uma base mais discreta.
 *
 * Com tile vetorial o mapa chega como **dados** e o desenho acontece aqui — dá
 * para apagar exatamente a camada dos nomes de rua ({@link CAMADAS_NOME_DE_RUA})
 * e acrescentar os pontos de referência que a captura de alvo mostra, sem tocar
 * em mais nada do mapa.
 *
 * ## Alinhamento com o plano do protótipo
 *
 * O app inteiro trabalha em pixels de plano (`@/servicos/geo`), e o mapa
 * precisa cair exatamente por baixo das rotas e dos hexágonos. Dois números
 * fazem isso:
 *
 * 1. **A caixa.** Vai de (−340, −340) a (730, 1184) em coordenadas de plano.
 *    O centro dessa caixa é (195, 422) — o mesmo `transform-origin` do
 *    protótipo, que `geo.ts` ancora em {@link ANCORA}. Então basta centralizar
 *    o mapa na âncora para tudo coincidir.
 * 2. **O zoom.** MapLibre conta zoom com tile de 512px; `geo.ts` conta com 256.
 *    Um zoom de diferença, daí {@link ZOOM_MAPLIBRE}. Errar isso desalinha o
 *    mapa por um fator de 2, e o sintoma é sutil: tudo "quase" encaixa.
 *
 * ## Pan e zoom continuam sendo do `MapaBase`
 *
 * O mapa entra com `interactive: false`. Quem arrasta e amplia é o
 * `transform` do `MapaBase`, exatamente como fazia com as imagens raster —
 * nenhum gesto é tratado aqui. O efeito colateral é que o canvas escala junto
 * no zoom de toque duplo (até 1,7×) e perde um pouco de nitidez, igual ao que
 * acontecia antes com os tiles.
 */

import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { ANCORA, ZOOM_TILE } from '@/servicos/geo';
import { coresMapaEscuro } from '@/tema/cores';

/** Frame de referência do protótipo. */
const LARGURA_PADRAO = 390;
const ALTURA_PADRAO = 844;

/**
 * Folga em cada lado do frame. 340 = `LIMITE_PAN_CORRIDA` do `MapaBase`, o
 * maior deslocamento que um arraste consegue produzir.
 */
const TRANSBORDO = 340;

/**
 * Zoom do MapLibre equivalente ao {@link ZOOM_TILE} de `geo.ts`.
 *
 * MapLibre define zoom sobre tiles de 512px (mundo = 512 × 2^z); `geo.ts` usa
 * a convenção raster de 256 (mundo = 256 × 2^z). Igualando os dois mundos:
 * 512 × 2^z = 256 × 2^ZOOM_TILE, ou seja, z = ZOOM_TILE − 1.
 */
const ZOOM_MAPLIBRE = ZOOM_TILE - 1;

/**
 * Estilo escuro do OpenFreeMap: vetorial, gratuito e **sem chave de API** —
 * requisito daqui, já que o app é um export estático e qualquer chave ficaria
 * pública no bundle. Foi o que inviabilizou CARTO e Stadia.
 */
const URL_ESTILO = 'https://tiles.openfreemap.org/styles/dark';

/** Versão fixada do MapLibre. Carregada por CDN — ver `app/+html.tsx`. */
const CDN_MAPLIBRE = 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist';

/**
 * As camadas de rótulo de rua do estilo, que são justamente o que sai.
 *
 * Vêm da `source-layer` `transportation_name`. Os `place_*` NÃO entram nesta
 * lista de propósito: nome de bairro e de município continuam, como na captura
 * de alvo ("Verde Vilas", "Lauro de Freitas", "Jockey Club").
 */
const CAMADAS_NOME_DE_RUA = ['highway_name_other', 'highway_name_motorway'];

/**
 * Clareamento das vias.
 *
 * O estilo `dark` do OpenFreeMap desenha o asfalto quase na cor do fundo
 * (`#181818` nas vias comuns, 7% de luminosidade nas principais), e só o
 * contorno dá o traço. Na captura de alvo as vias são cinza médio, bem
 * separadas do preto — é o que faz o mapa "ler" como malha viária de app de
 * corrida, e não como uma mancha escura.
 *
 * Cada entrada substitui o `line-color` de uma camada específica, preservando
 * a hierarquia: via comum mais discreta, principal mais clara, expressa no
 * topo. Mexer numa cor só, ou aplicar um `brightness` no canvas inteiro,
 * levantaria o fundo junto e perderia justamente esse contraste.
 */
const VIAS_MAIS_CLARAS: Record<string, string> = {
  highway_minor: '#34363A',
  highway_major_inner: '#4A4D53',
  highway_major_subtle: '#3B3E43',
  highway_motorway_inner: '#5A5E66',
  highway_motorway_subtle: '#34363A',
  highway_major_casing: 'rgba(90,90,96,0.8)',
  highway_motorway_casing: 'rgba(90,90,96,0.8)',
  highway_path: '#2B2D30',
};

/**
 * Pontos de referência, a parte que o estilo não traz pronta.
 *
 * O `dark` do OpenFreeMap não desenha nenhuma camada de POI, mas a fonte
 * `openmaptiles` carrega a `source-layer` `poi` — então dá para acrescentá-la.
 * O desenho copia a captura: um disco escuro com o ícone claro no meio, sem
 * texto, para o mapa não voltar a encher de letra.
 *
 * `icon-image` tenta o ícone da subclasse (ex.: `pharmacy_11`), cai para o da
 * classe (`hospital_11`) e por fim para um genérico. `coalesce` + `image`
 * resolve isso sem quebrar quando o sprite não tem o ícone.
 */
const ID_DISCO_POI = 'referencia-disco';
const ID_ICONE_POI = 'referencia-icone';

/** Raio do disco do ponto de referência, em px. */
const RAIO_DISCO_POI = 11;

/**
 * Quantos pontos de referência por tile.
 *
 * O `rank` do OpenMapTiles ordena os POIs de um tile por importância (1 é o
 * mais relevante). Sem corte, o mapa recebe **todo** POI do OpenStreetMap —
 * farmácia, padaria, caixa eletrônico — e vira uma parede de distintivos, bem
 * pior que os nomes de rua que saíram. Medido na tela: passavam de cem.
 *
 * Com 3 por tile sobram os mesmos poucos marcos que a captura de alvo mostra.
 */
const RANK_MAXIMO_POI = 3;

/**
 * Classes de POI que ficam de fora.
 *
 * Parada de ônibus e estação aparecem a cada esquina e, mesmo dentro do corte
 * por `rank`, tomavam quase todos os distintivos — o mapa virava um mural de
 * ícones de transporte. A captura de alvo mostra marcos: praça, condomínio,
 * prédio institucional. Estes são os que sobram ao remover a lista abaixo.
 */
const CLASSES_POI_IGNORADAS = [
  'bus',
  'railway',
  'ferry_terminal',
  'aerialway',
  'entrance',
];

/** Só os POIs relevantes, e que não sejam de transporte. */
const FILTRO_POI = [
  'all',
  ['<=', ['get', 'rank'], RANK_MAXIMO_POI],
  ['!', ['in', ['get', 'class'], ['literal', CLASSES_POI_IGNORADAS]]],
];

type MapLibreMinimo = {
  on: (evento: string, fn: () => void) => void;
  remove: () => void;
  getLayer: (id: string) => unknown;
  setLayoutProperty: (camada: string, prop: string, valor: unknown) => void;
  setPaintProperty: (camada: string, prop: string, valor: unknown) => void;
  addLayer: (camada: Record<string, unknown>) => void;
  resize: () => void;
  triggerRepaint: () => void;
};

/** Carrega o MapLibre uma vez e devolve o global já pronto. */
let promessaMapLibre: Promise<unknown> | null = null;

function carregarMapLibre(): Promise<unknown> {
  const janela = window as unknown as { maplibregl?: unknown };
  if (janela.maplibregl) return Promise.resolve(janela.maplibregl);
  if (promessaMapLibre) return promessaMapLibre;

  promessaMapLibre = new Promise((resolver, rejeitar) => {
    // O CSS do MapLibre é obrigatório: sem ele o canvas não recebe as regras
    // de posicionamento e o mapa some.
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${CDN_MAPLIBRE}/maplibre-gl.css`;
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = `${CDN_MAPLIBRE}/maplibre-gl.js`;
    script.async = true;
    script.onload = () => resolver(janela.maplibregl);
    script.onerror = () => rejeitar(new Error('MapLibre não carregou'));
    document.head.appendChild(script);
  });

  return promessaMapLibre;
}

/** Crédito exigido pelo OpenFreeMap e pelos dados de origem. */
export const ATRIBUICAO_MAPA = '© OpenFreeMap · © OpenMapTiles · © OpenStreetMap';

export type CamadaMapaRealProps = {
  /** Largura do frame do mapa em px de plano. Padrão 390. */
  largura?: number;
  /** Altura do frame do mapa em px de plano. Padrão 844. */
  altura?: number;
};

export function CamadaMapaReal({
  largura = LARGURA_PADRAO,
  altura = ALTURA_PADRAO,
}: CamadaMapaRealProps) {
  const refCaixa = useRef<View>(null);

  useEffect(() => {
    const no = refCaixa.current as unknown as HTMLElement | null;
    if (!no) return;

    let mapa: MapLibreMinimo | null = null;
    let vivo = true;

    void carregarMapLibre()
      .then((lib) => {
        // A tela pode ter saído enquanto o script baixava.
        if (!vivo || !lib) return;

        const MapLibre = lib as {
          Map: new (opcoes: Record<string, unknown>) => MapLibreMinimo;
        };

        mapa = new MapLibre.Map({
          container: no,
          style: URL_ESTILO,
          center: [ANCORA.lng, ANCORA.lat],
          zoom: ZOOM_MAPLIBRE,
          // Todo gesto é do `MapaBase`; o mapa aqui é imagem, não controle.
          interactive: false,
          attributionControl: false,
          // O crédito é desenhado pelo `MapaBase`, na camada de UI fixa.
          fadeDuration: 0,
        });

        mapa.on('load', () => {
          if (!vivo || !mapa) return;

          // 1. Fora os nomes de rua.
          for (const id of CAMADAS_NOME_DE_RUA) {
            if (mapa.getLayer(id)) {
              mapa.setLayoutProperty(id, 'visibility', 'none');
            }
          }

          // 2. As vias ganham contraste contra o fundo.
          for (const [id, cor] of Object.entries(VIAS_MAIS_CLARAS)) {
            if (mapa.getLayer(id)) {
              mapa.setPaintProperty(id, 'line-color', cor);
            }
          }

          // 3. Entram os pontos de referência, como na captura de alvo.
          mapa.addLayer({
            id: ID_DISCO_POI,
            type: 'circle',
            source: 'openmaptiles',
            'source-layer': 'poi',
            minzoom: 13,
            filter: FILTRO_POI,
            paint: {
              'circle-radius': RAIO_DISCO_POI,
              'circle-color': coresMapaEscuro.botao,
              'circle-stroke-width': 1,
              'circle-stroke-color': 'rgba(255,255,255,0.14)',
              'circle-opacity': 0.95,
            },
          });

          mapa.addLayer({
            id: ID_ICONE_POI,
            type: 'symbol',
            source: 'openmaptiles',
            'source-layer': 'poi',
            minzoom: 13,
            filter: FILTRO_POI,
            layout: {
              'icon-image': [
                'coalesce',
                ['image', ['concat', ['get', 'subclass'], '_11']],
                ['image', ['concat', ['get', 'class'], '_11']],
                ['image', 'marker_11'],
              ],
              'icon-size': 1,
              'icon-allow-overlap': false,
              // Em disputa por espaço, o mais relevante fica.
              'symbol-sort-key': ['get', 'rank'],
            },
            paint: {
              'icon-color': coresMapaEscuro.iconeSobreBotao,
              'icon-opacity': 0.9,
            },
          });
        });
      })
      .catch(() => {
        // Sem mapa o app continua utilizável: sobra o fundo escuro, e rota,
        // pins e hexágonos seguem desenhados por cima. Falhar em silêncio é
        // melhor do que derrubar a tela inteira por causa de um CDN fora do ar.
      });

    /**
     * Redesenha ao voltar à tona.
     *
     * O MapLibre desenha dentro de `requestAnimationFrame`, que o navegador
     * congela enquanto a página está oculta. Um app instalado que passa um
     * tempo em segundo plano volta, portanto, com o canvas parado — e nada o
     * acorda sozinho, porque o mapa é estático e não recebe gesto nenhum.
     *
     * `resize` reconfere as dimensões (a viewport pode ter mudado no meio) e
     * `triggerRepaint` força um quadro. Os dois são baratos e idempotentes.
     */
    const acordar = () => {
      if (!mapa) return;
      try {
        mapa.resize();
        mapa.triggerRepaint();
      } catch {
        // Mapa já descartado.
      }
    };
    document.addEventListener('visibilitychange', acordar);
    window.addEventListener('pageshow', acordar);
    window.addEventListener('focus', acordar);

    return () => {
      vivo = false;
      document.removeEventListener('visibilitychange', acordar);
      window.removeEventListener('pageshow', acordar);
      window.removeEventListener('focus', acordar);
      try {
        mapa?.remove();
      } catch {
        // Já descartado — nada a fazer.
      }
    };
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        ref={refCaixa}
        style={[
          estilos.caixa,
          {
            left: -TRANSBORDO,
            top: -TRANSBORDO,
            width: largura + TRANSBORDO * 2,
            height: altura + TRANSBORDO * 2,
          },
        ]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: {
    position: 'absolute',
    // Enquanto o estilo baixa é isto que se vê — mesma família do mapa, então
    // a chegada dos tiles não pisca.
    backgroundColor: coresMapaEscuro.fundo,
  },
});

export default CamadaMapaReal;
