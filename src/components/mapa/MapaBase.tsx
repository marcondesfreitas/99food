/**
 * B11a — MapaBase: a metade "mapa" da tela principal.
 *
 * Entrega pan/zoom por gesto, as camadas de transform e a composição dos
 * componentes de mapa/demanda. NÃO faz header, barra inferior, FABs, banner
 * nem overlays de corrida — isso é do B11b (`app/(motorista)/mapa.tsx`), que
 * entra aqui por `children`.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html` (linhas 64-125, os
 * dois containers de transform) e `.design-import/logic.js`:
 * - `alvoCamera()` linhas 180-183 e o trecho `if (s.segue)` de `iniciarLoop`
 *   (linhas 204-209) — a câmera que segue a corrida
 * - `panDown/panMove/panUp` linhas 223-250, `zoomDuplo` 251-254,
 *   `recentrar` 255-258
 * - `transformMapa`/`transformOverlay`/`foraDoCentro` linhas 446/473-474
 *
 * ## As três camadas (a parte que é fácil errar)
 *
 * O protótipo usa DOIS containers de transform distintos, e a diferença entre
 * eles não é cosmética:
 *
 * 1. `transformMapa` — `translate(offX, offY) scale(z)`, com
 *    `transform-origin: 195px 422px`. Contém o mapa real (tiles), hexágonos
 *    de demanda, rota e pins. Tudo aqui escala junto, de graça.
 * 2. `transformOverlay` — só `translate(offX, offY)`, SEM `scale`. Contém
 *    pills de multiplicador, passageiros e o marcador do carro. Como não há
 *    escala no container, cada um desses precisa ter a posição escalada na
 *    mão: `195 + (x - 195) * z` / `422 + (y - 422) * z`. É por isso que
 *    `CamadaPills` recebe `zoom` como prop e `CamadaHexagonos` não.
 * 3. UI fixa (`children`) — fora dos dois transforms, não se move com o pan.
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import {
  CamadaHexagonosConectada,
  CamadaPillsConectada,
} from '@/components/mapa/CamadaDemandaConectada';
import {
  ATRIBUICAO_MAPA,
  CamadaMapaReal,
} from '@/components/mapa/CamadaMapaReal';
import { MarcadorCarro } from '@/components/mapa/MarcadorCarro';
import { RotaPolyline } from '@/components/mapa/RotaPolyline';
import { HOME, PAX, emT } from '@/servicos/mapaFalso';
import type { GeometriaPreparada, Ponto } from '@/state/tipos';
import { cores, coresMapa } from '@/tema/cores';
import { familiaInter } from '@/tema/tipografia';

// ---------------------------------------------------------------------------
// Constantes do plano falso (frame 390×844 do protótipo)
// ---------------------------------------------------------------------------

/** Centro de escala — `transform-origin: 195px 422px` no protótipo. */
const CENTRO_X = 195;
const CENTRO_Y = 422;

/**
 * Centro vertical usado pela CÂMERA, que não é o mesmo do `transform-origin`:
 * `alvoCamera` (logic.js 182) mira em 380, um pouco acima do meio, para o
 * marcador não ficar escondido atrás do bottom sheet de corrida.
 */
const CAMERA_Y = 380;

/** Limite de pan: ±180 normal, ±340 durante a corrida (logic.js 232/244). */
const LIMITE_PAN = 180;
const LIMITE_PAN_CORRIDA = 340;

/** `zoomDuplo` — logic.js 253: passo de .35, teto 1.7, e volta a 1. */
const PASSO_ZOOM = 0.35;
const ZOOM_MAX = 1.7;

/** Multiplicador da inércia ao soltar o arraste (logic.js 247-248). */
const INERCIA = 140;

/** `transition: transform 600ms cubic-bezier(.16,1,.3,1)` (logic.js 475). */
const DURACAO_TRANSICAO = 600;
const EASING_TRANSICAO = Easing.bezier(0.16, 1, 0.3, 1);

/** Constante de tempo do filtro exponencial da câmera (logic.js 206). */
const TAU_CAMERA = 0.4;

/** `foraDoCentro` — logic.js 446: tolerância de 8px antes de considerar fora. */
const TOLERANCIA_CENTRO = 8;

/** `maxPax` — logic.js 417: no máximo 3 passageiros decorativos. */
const MAX_PAX = 3;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export type EstadoCamera = {
  offX: number;
  offY: number;
  zoom: number;
  /** true quando o mapa saiu do centro ou está com zoom — B11b usa para
   * decidir se mostra o FAB de recentralizar. */
  foraDoCentro: boolean;
};

export type MapaBaseProps = {
  /** Camada de demanda (hexágonos + pills) visível. */
  mostrarDemanda?: boolean;
  /** Amplia o limite de pan de ±180 para ±340. */
  emCorrida?: boolean;
  /** Geometria do trecho atual; null quando não há corrida. */
  trajeto?: GeometriaPreparada | null;
  /** Progresso 0..1 do marcador ao longo de `trajeto`. */
  progresso?: number;
  /** Ângulo do marcador em graus. */
  angulo?: number;
  /** Câmera segue o marcador. */
  seguir?: boolean;
  /** Notifica mudança de câmera (para o FAB de recentralizar do B11b). */
  onMudarCamera?: (estado: EstadoCamera) => void;
  /** Halo pulsante no marcador (parado ou aguardando passageiro). */
  haloMarcador?: boolean;
  /** Pulso de "chegou" no marcador. */
  pulsoMarcador?: boolean;
  /** Pins de embarque/desembarque quicando na chegada. */
  bounceOrigem?: boolean;
  bounceDestino?: boolean;
  /** Origem/destino da viagem, para os pins. */
  origem?: Ponto | null;
  destino?: Ponto | null;
  /** UI fixa do B11b — renderizada por cima, FORA dos transforms. */
  children?: React.ReactNode;
};

export type MapaBaseHandle = {
  /** Volta ao centro. Replica `recentrar()` de logic.js linhas 255-258. */
  recentrar: () => void;
};

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export const MapaBase = forwardRef<MapaBaseHandle, MapaBaseProps>(
  function MapaBase(
    {
      mostrarDemanda = true,
      emCorrida = false,
      trajeto = null,
      progresso = 0,
      angulo = 0,
      seguir = true,
      onMudarCamera,
      haloMarcador,
      pulsoMarcador,
      bounceOrigem,
      bounceDestino,
      origem,
      destino,
      children,
    },
    ref
  ) {
    // `zonas` NÃO é lido aqui: mudaria a cada tick de 2.4s da demanda e
    // re-renderizaria este componente inteiro (pan, gestos, marcador, rota)
    // só por causa de um hexágono. Quem lê é `CamadaHexagonosConectada` /
    // `CamadaPillsConectada`, abaixo — ver o porquê em
    // `CamadaDemandaConectada.tsx`.

    // Pan em shared values: muda a cada pixel de arraste, então não pode
    // passar por estado do React (spec do B11, §"Notas de tradução").
    const offX = useSharedValue(0);
    const offY = useSharedValue(0);
    const inicioX = useSharedValue(0);
    const inicioY = useSharedValue(0);
    const arrastando = useSharedValue(false);

    /**
     * O zoom vive em DOIS lugares de propósito: um shared value (para compor
     * o transform sem passar pelo JS) e um estado do React (porque marcador,
     * pills e passageiros escalam a posição na mão e isso acontece no render).
     * Ele muda raramente — só no toque duplo —, então espelhar é barato.
     */
    const zoomSV = useSharedValue(1);
    const [zoom, setZoom] = useState(1);

    const limite = emCorrida ? LIMITE_PAN_CORRIDA : LIMITE_PAN;

    // ---- Notificação de câmera --------------------------------------------

    const notificar = useCallback(
      (x: number, y: number, z: number) => {
        onMudarCamera?.({
          offX: x,
          offY: y,
          zoom: z,
          // logic.js 446 — tolerância de 8px.
          foraDoCentro:
            Math.abs(x) > TOLERANCIA_CENTRO ||
            Math.abs(y) > TOLERANCIA_CENTRO ||
            z !== 1,
        });
      },
      [onMudarCamera]
    );

    // ---- Gestos ------------------------------------------------------------

    const pan = Gesture.Pan()
      .onStart(() => {
        arrastando.value = true;
        inicioX.value = offX.value;
        inicioY.value = offY.value;
      })
      .onUpdate((e) => {
        // panMove — logic.js 230-239: clamp nos dois eixos.
        offX.value = Math.max(
          -limite,
          Math.min(limite, inicioX.value + e.translationX)
        );
        offY.value = Math.max(
          -limite,
          Math.min(limite, inicioY.value + e.translationY)
        );
      })
      .onEnd((e) => {
        // panUp — logic.js 240-250: aplica inércia e volta a clampar.
        // `velocityX` do gesture-handler é px/s; o protótipo usava px/ms com
        // fator 140, o que dá o mesmo alcance dividindo por 1000.
        const destinoX = Math.max(
          -limite,
          Math.min(limite, offX.value + (e.velocityX / 1000) * INERCIA)
        );
        const destinoY = Math.max(
          -limite,
          Math.min(limite, offY.value + (e.velocityY / 1000) * INERCIA)
        );
        arrastando.value = false;
        offX.value = withTiming(destinoX, {
          duration: DURACAO_TRANSICAO,
          easing: EASING_TRANSICAO,
        });
        offY.value = withTiming(destinoY, {
          duration: DURACAO_TRANSICAO,
          easing: EASING_TRANSICAO,
        });
        runOnJS(notificar)(destinoX, destinoY, zoomSV.value);
      });

    const aplicarZoom = useCallback(
      (novo: number) => {
        setZoom(novo);
        zoomSV.value = withTiming(novo, {
          duration: DURACAO_TRANSICAO,
          easing: EASING_TRANSICAO,
        });
        notificar(offX.value, offY.value, novo);
      },
      [notificar, offX, offY, zoomSV]
    );

    // zoomDuplo — logic.js 251-254.
    const toqueDuplo = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        const atual = zoomSV.value;
        const novo =
          atual >= ZOOM_MAX ? 1 : Math.round((atual + PASSO_ZOOM) * 100) / 100;
        runOnJS(aplicarZoom)(novo);
      });

    const gestos = Gesture.Simultaneous(pan, toqueDuplo);

    // ---- recentrar() -------------------------------------------------------

    const recentrar = useCallback(() => {
      // logic.js 255-258: durante a corrida, recentrar só devolve o controle
      // à câmera automática (`segue: true`) sem zerar o pan — quem reposiciona
      // é o próprio loop. Fora de corrida, volta tudo ao estado inicial.
      if (emCorrida) {
        notificar(offX.value, offY.value, zoomSV.value);
        return;
      }
      offX.value = withTiming(0, {
        duration: DURACAO_TRANSICAO,
        easing: EASING_TRANSICAO,
      });
      offY.value = withTiming(0, {
        duration: DURACAO_TRANSICAO,
        easing: EASING_TRANSICAO,
      });
      setZoom(1);
      zoomSV.value = withTiming(1, {
        duration: DURACAO_TRANSICAO,
        easing: EASING_TRANSICAO,
      });
      notificar(0, 0, 1);
    }, [emCorrida, notificar, offX, offY, zoomSV]);

    useImperativeHandle(ref, () => ({ recentrar }), [recentrar]);

    // ---- Câmera que segue a corrida ---------------------------------------

    /**
     * `alvoCamera(pt)` — logic.js 180-183. Devolve o offset que coloca o ponto
     * `pt` no centro de câmera (195, 380), já considerando o zoom.
     */
    const alvoCamera = (pt: { x: number; y: number }, z: number) => ({
      x: CENTRO_X - (CENTRO_X + (pt.x - CENTRO_X) * z),
      y: CAMERA_Y - (CENTRO_Y + (pt.y - CENTRO_Y) * z),
    });

    const ultimoTs = useRef(0);

    useEffect(() => {
      if (!seguir || !trajeto || arrastando.value) {
        ultimoTs.current = 0;
        return;
      }
      const agora = performance.now();
      // Primeiro frame após ligar o "seguir": sem dt confiável, só marca.
      const dt =
        ultimoTs.current === 0
          ? 0
          : Math.min(0.05, (agora - ultimoTs.current) / 1000);
      ultimoTs.current = agora;
      if (dt === 0) return;

      const pt = emT(trajeto, progresso);
      const alvo = alvoCamera(pt, zoom);
      // Filtro exponencial idêntico ao do protótipo (logic.js 206).
      const k = 1 - Math.exp(-dt / TAU_CAMERA);
      offX.value = offX.value + (alvo.x - offX.value) * k;
      offY.value = offY.value + (alvo.y - offY.value) * k;
    }, [progresso, seguir, trajeto, zoom, offX, offY, arrastando]);

    // ---- Estilos animados das duas camadas --------------------------------

    // Camada 1: translate + scale, origem em (195, 422).
    const estiloMapa = useAnimatedStyle(() => ({
      transform: [
        { translateX: offX.value },
        { translateY: offY.value },
        { scale: zoomSV.value },
      ],
    }));

    // Camada 2: SÓ translate — sem scale, de propósito (ver cabeçalho).
    const estiloOverlay = useAnimatedStyle(() => ({
      transform: [{ translateX: offX.value }, { translateY: offY.value }],
    }));

    // ---- Posições escaladas à mão (porque a camada 2 não tem scale) -------

    const escalar = (p: Ponto): { left: number; top: number } => ({
      left: CENTRO_X + (p[0] - CENTRO_X) * zoom,
      top: CENTRO_Y + (p[1] - CENTRO_Y) * zoom,
    });

    // Posição do marcador: no trajeto quando há corrida, senão parado em HOME
    // (logic.js 413).
    const pontoMarcador = trajeto
      ? emT(trajeto, progresso)
      : { x: HOME[0], y: HOME[1], bearing: 0 };
    const marcador = escalar([pontoMarcador.x, pontoMarcador.y]);

    const passageiros = PAX.slice(0, MAX_PAX);

    return (
      <View style={estilos.raiz}>
        <GestureDetector gesture={gestos}>
          <View style={estilos.areaGesto}>
            {/* ---- Camada 1: escala junto com o zoom ---- */}
            <Animated.View
              style={[estilos.camada, estilos.origemEscala, estiloMapa]}
              pointerEvents="none"
            >
              <CamadaMapaReal />

              {mostrarDemanda ? <CamadaHexagonosConectada /> : null}

              {trajeto ? (
                <RotaPolyline
                  d={trajeto.d}
                  len={trajeto.len}
                  progresso={emCorrida ? progresso : 0}
                  origem={origem}
                  destino={destino}
                  bounceOrigem={bounceOrigem}
                  bounceDestino={bounceDestino}
                />
              ) : null}
            </Animated.View>

            {/* ---- Camada 2: só translada; posições escaladas à mão ---- */}
            <Animated.View
              style={[estilos.camada, estiloOverlay]}
              pointerEvents="none"
            >
              {mostrarDemanda ? <CamadaPillsConectada zoom={zoom} /> : null}

              {mostrarDemanda
                ? passageiros.map((p, i) => {
                    const pos = escalar(p);
                    return (
                      <View
                        key={`pax-${i}`}
                        style={[
                          estilos.passageiro,
                          { left: pos.left, top: pos.top },
                        ]}
                      >
                        <View style={estilos.passageiroHalo} />
                        <View style={estilos.passageiroDisco} />
                      </View>
                    );
                  })
                : null}

              <MarcadorCarro
                x={marcador.left}
                y={marcador.top}
                angulo={angulo}
                haloVisivel={haloMarcador}
                pulso={pulsoMarcador}
              />
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Crédito dos tiles: obrigatório (OpenStreetMap é ODbL, CARTO exige
            atribuição) e por isso vive na camada fixa — não pode sair de vista
            com o pan. `bottom` limpa a barra inferior de 88px do B11b. */}
        <Text style={estilos.atribuicao} pointerEvents="none">
          {ATRIBUICAO_MAPA}
        </Text>

        {/* ---- Camada 3: UI fixa do B11b, fora dos transforms ---- */}
        {children}
      </View>
    );
  }
);

const estilos = StyleSheet.create({
  raiz: {
    flex: 1,
    backgroundColor: coresMapa.fundo,
    overflow: 'hidden',
  },
  areaGesto: {
    ...StyleSheet.absoluteFill,
  },
  camada: {
    ...StyleSheet.absoluteFill,
  },
  atribuicao: {
    position: 'absolute',
    left: 8,
    /**
     * Acima da folha inferior do B11b, que com o banner aberto sobe a 206px.
     * A licença ODbL do OpenStreetMap exige que o crédito esteja **visível**;
     * nos 92px de antes ele ficava escondido atrás da folha.
     */
    bottom: 212,
    fontFamily: familiaInter.regular,
    fontSize: 9,
    lineHeight: 12,
    // Invertido junto com a cartografia: texto claro sobre um véu escuro. Com
    // o halo branco de antes, o crédito virava uma etiqueta acesa no meio de
    // um mapa noturno.
    color: coresMapa.rotuloRua,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
  // `transform-origin: 195px 422px` do protótipo (linha 64 do .dc.html).
  origemEscala: {
    transformOrigin: '195px 422px',
  },
  // 44×44 com `margin: -22px 0 0 -22px` — centraliza no ponto.
  passageiro: {
    position: 'absolute',
    width: 44,
    height: 44,
    marginLeft: -22,
    marginTop: -22,
  },
  // Halo e anel do passageiro usam o amarelo de marca (`#F8D60B` no
  // protótipo), não a paleta cartográfica — por isso vêm de `cores`.
  passageiroHalo: {
    position: 'absolute',
    left: -6,
    top: -6,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: cores.amarelo500,
    opacity: 0.22,
  },
  passageiroDisco: {
    ...StyleSheet.absoluteFill,
    borderRadius: 999,
    backgroundColor: cores.neutro0,
    borderWidth: 3,
    borderColor: cores.amarelo500,
  },
});

export default MapaBase;
