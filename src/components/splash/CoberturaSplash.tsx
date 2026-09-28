/**
 * B10 — Splash, como camada de cobertura do mapa (posição definida em B25).
 *
 * Tela de abertura 100% automática: nenhuma interação, fica ~1,2s no ar e sai
 * sozinha. No protótipo ela nem é uma tela de verdade — é uma *camada de
 * cobertura* (`position: absolute; inset: 0; z-index: 8`) por cima do mapa,
 * que faz fade-out e revela a home já montada por baixo.
 *
 * ## Por que deixou de ser rota (B25)
 *
 * Enquanto era `app/index.tsx`, o fade revelava o fundo vazio do layout raiz e
 * só depois trocava de tela — o mapa nunca aparecia *através* da splash. Como
 * overlay dentro de `mapa.tsx` o efeito é o do protótipo: o mapa já está
 * montado embaixo e vai surgindo conforme a opacidade cai. `app/index.tsx`
 * virou só um `<Redirect>` para o mapa.
 *
 * Fonte no protótipo:
 * - `.design-import/RotaFacil Motorista v6.dc.html` linhas 1082-1092 (bloco
 *   `telaSplash`):
 *
 *   ```html
 *   <div style="position: absolute; inset: 0; z-index: 8;
 *               background: linear-gradient(180deg, #F4BA10 0%, #F4AD09 100%);
 *               display: flex; flex-direction: column;
 *               align-items: center; justify-content: center;
 *               animation: {{ animSplash }};">
 *     <div style="position: absolute; inset: 0; opacity: .18;"> ...hexágonos... </div>
 *     <div style="... width: 96px; height: 96px; border-radius: 999px;
 *                 background: #FFFFFF; font-size: 34px; font-weight: 800;
 *                 letter-spacing: -.03em; color: #F4AD09;">RF</div>
 *     <div style="margin-top: 14px; font-size: 18px; font-weight: 600;
 *                 color: #FFFFFF;">RotaFácil Motorista</div>
 *     <div style="position: absolute; bottom: 46px; text-align: center;
 *                 font-size: 13px; color: rgba(255,255,255,.7);">V7.10.26</div>
 *   </div>
 *   ```
 *
 * - `.design-import/logic.js` linha 621: `animSplash =
 *   'fadeout 800ms ease-in-out 400ms forwards'`.
 * - `.design-import/logic.js` linha 150: `this.at(() => this.setState({ tela:
 *   'mapa' }), 1200)` — 1200ms na splash antes de ir para o mapa (= 400ms de
 *   atraso + 800ms de fade, ou seja, a navegação acontece exatamente quando a
 *   opacidade chega a zero).
 * - `.design-import/logic.js` linha 459: `hexSplash` — as 15 posições do padrão
 *   de hexágonos no frame de 390×844 do protótipo.
 *
 * ## Marca
 *
 * O protótipo usa a marca fictícia "RotaFácil"/"RF"; o app é o **99**. Por isso
 * o monograma vira `99` e o wordmark vira `99 Motorista`
 * (`PLANO_IMPLEMENTACAO_V6.md §5`). Só o texto muda — cor, tamanho, peso e
 * posição continuam idênticos ao protótipo.
 *
 * ## Tradução Web → RN
 *
 * - `linear-gradient(180deg, ...)` não existe em RN e o projeto **não** tem
 *   `expo-linear-gradient` instalado. O gradiente é desenhado com
 *   `react-native-svg` (já é dependência do projeto, usado por B06/B07/B09):
 *   um `<Rect>` de tela cheia preenchido por um `<LinearGradient>` vertical.
 *   Assim não entra dependência nova.
 * - `clip-path: polygon(...)` também não existe em RN — os hexágonos são
 *   `<Polygon>` no mesmo `<Svg>` do gradiente (um único nó nativo para o fundo
 *   inteiro, em vez de 15 `View`s).
 * - `animation: fadeout 800ms ease-in-out 400ms forwards` vira
 *   `Animated.timing(..., { delay: 400, duration: 800, easing: Easing.inOut(Easing.ease) })`.
 *   Usamos o `Animated` do core do RN (e não o Reanimated) por ser uma
 *   animação de opacidade simples, sem gesto e sem worklet — mesma escolha dos
 *   blocos anteriores desta onda.
 * - O `hexSplash` do protótipo é uma lista fixa, medida para o frame de
 *   390×844. Aqui o padrão é **gerado** a partir da mesma malha (passo de 170px
 *   na horizontal, 128px na vertical, linhas ímpares deslocadas 80px) para
 *   cobrir qualquer tamanho de tela. Num aparelho de 390×844 o resultado é
 *   exatamente a lista original.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Defs, G, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';

import { cores } from '@/tema/cores';
import { raioPill } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

// ---------------------------------------------------------------------------
// Tempos (logic.js linhas 150 e 621)
// ---------------------------------------------------------------------------

/** `fadeout ... 400ms` — atraso antes do fade começar. */
const ATRASO_FADE_MS = 400;

/** `fadeout 800ms ...` — duração do fade. */
const DURACAO_FADE_MS = 800;

/**
 * `at(() => this.setState({ tela: 'mapa' }), 1200)` — tempo total na splash.
 * É a soma exata de `ATRASO_FADE_MS + DURACAO_FADE_MS`: a navegação acontece
 * no instante em que a cobertura fica invisível.
 */
const DURACAO_SPLASH_MS = ATRASO_FADE_MS + DURACAO_FADE_MS;

// ---------------------------------------------------------------------------
// Padrão de hexágonos do fundo
// ---------------------------------------------------------------------------

/** Caixa de cada hexágono (`width: 150px; height: 172px` no protótipo). */
const LARGURA_HEX = 150;
const ALTURA_HEX = 172;

/**
 * `polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)` resolvido para a
 * caixa de 150×172 (25% de 172 = 43, 75% = 129). Mesma geometria do `HexZona`
 * da camada de demanda (B07), redeclarada aqui de propósito: são contextos
 * visuais independentes (decoração da splash × heatmap do mapa) e o componente
 * de lá carrega Reanimated junto.
 */
const PONTOS_HEX = '75,0 150,43 150,129 75,172 0,129 0,43';

/** Primeira posição da malha (`hexSplash[0]`: `left: -50, top: 40`). */
const ORIGEM_X = -50;
const ORIGEM_Y = 40;

/** Passo horizontal entre hexágonos da mesma linha (-50 → 120 → 290). */
const PASSO_X = 170;

/** Passo vertical entre linhas (40 → 168 → 296 → 424 → 552 → 680). */
const PASSO_Y = 128;

/** Deslocamento das linhas ímpares (-50 → 30, 120 → 200). */
const DESLOCAMENTO_LINHA_IMPAR = 80;

/** `opacity: .18` do container dos hexágonos. */
const OPACIDADE_HEXES = 0.18;

type PosicaoHex = { chave: string; x: number; y: number };

/**
 * Gera a malha de hexágonos que cobre uma tela de `largura`×`altura`.
 *
 * Um hexágono entra na lista quando o seu **centro** cai dentro da tela — é a
 * regra que reproduz o recorte manual do `hexSplash` do protótipo (que, num
 * frame de 390px, para em `left: 290` nas linhas pares e em `left: 200` nas
 * ímpares).
 */
function gerarHexes(largura: number, altura: number): PosicaoHex[] {
  const hexes: PosicaoHex[] = [];
  const meiaLargura = LARGURA_HEX / 2;
  const meiaAltura = ALTURA_HEX / 2;

  for (let linha = 0; ; linha += 1) {
    const y = ORIGEM_Y + linha * PASSO_Y;
    if (y + meiaAltura > altura) break;

    const inicioX = ORIGEM_X + (linha % 2 === 1 ? DESLOCAMENTO_LINHA_IMPAR : 0);

    for (let coluna = 0; ; coluna += 1) {
      const x = inicioX + coluna * PASSO_X;
      if (x + meiaLargura > largura) break;
      hexes.push({ chave: `${linha}-${coluna}`, x, y });
    }
  }

  return hexes;
}

/** Traduz `PONTOS_HEX` para a posição `(x, y)` da malha. */
function pontosEm(x: number, y: number): string {
  return PONTOS_HEX.split(' ')
    .map((par) => {
      const [px, py] = par.split(',');
      return `${Number(px) + x},${Number(py) + y}`;
    })
    .join(' ');
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------

/** Monograma. Protótipo (linha 1089): `RF` → marca do app: `99`. */
const MONOGRAMA = '99';

/** Wordmark. Protótipo (linha 1090): `RotaFácil Motorista` → `99 Motorista`. */
const WORDMARK = '99 Motorista';

/**
 * Rótulo de versão do rodapé (protótipo, linha 1091). Mantido como literal por
 * ora; se algum dia precisar refletir a versão real do build, o caminho é
 * `expo-constants` (`Constants.expoConfig?.version`) — decisão de B26.
 */
const VERSAO = 'V7.10.26';

/**
 * A splash é de abertura do app, não da tela.
 *
 * `mapa.tsx` é o fundo da pilha, mas é **desmontado e remontado** quando o
 * fluxo passa pela verificação facial e pelo resumo (as duas entram por
 * `router.replace`, ver `src/servicos/navegacao.ts`). Sem esta trava, cada
 * volta ao mapa reexibiria a splash.
 *
 * É um `let` de módulo, e não estado de store, porque a informação é do ciclo
 * de vida do processo — não é dado de domínio nem sobrevive a um restart, e
 * não deve ser persistido por B28.
 */
let jaExibida = false;

// ---------------------------------------------------------------------------

export function CoberturaSplash() {
  const { width: largura, height: altura } = useWindowDimensions();

  const [visivel, setVisivel] = useState(!jaExibida);

  const opacidade = useRef(new Animated.Value(1)).current;

  const hexes = useMemo(() => gerarHexes(largura, altura), [largura, altura]);

  useEffect(() => {
    if (!visivel) return;

    // `fadeout 800ms ease-in-out 400ms forwards`.
    const fade = Animated.timing(opacidade, {
      toValue: 0,
      delay: ATRASO_FADE_MS,
      duration: DURACAO_FADE_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    });
    fade.start();

    // Timer independente do fade (como no protótipo, que dispara a troca de
    // tela por `setTimeout`, não pelo fim da animação).
    const timer = setTimeout(() => {
      jaExibida = true;
      setVisivel(false);
    }, DURACAO_SPLASH_MS);

    return () => {
      fade.stop();
      clearTimeout(timer);
    };
  }, [opacidade, visivel]);

  if (!visivel) return null;

  return (
    <Animated.View
      style={[estilos.cobertura, { opacity: opacidade }]}
      // Bloqueia toques enquanto está no ar, como o `<div>` de cobertura do
      // protótipo: o mapa já está vivo embaixo e um toque solto poderia
      // acertar o botão "Conectar" antes de a splash sair.
      pointerEvents="auto"
    >
      {/* Barra de status clara: o protótipo marca `statusBarClara` enquanto
          `tela === 'splash'` (logic.js linha 622). */}
      <StatusBar style="light" />

      {/* Fundo: gradiente vertical + malha de hexágonos, num único <Svg>.

          O <Svg> NÃO recebe `width`/`height` numéricos: ele se estica pelo
          `absoluteFill`, acompanhando o container em vez da janela. A diferença
          importa na web instalada na tela de início — ali `useWindowDimensions`
          pode devolver uma altura menor que a da tela de verdade (a barra de
          status translúcida entra ou não na conta dependendo do momento da
          medição), e o SVG ficava curto, deixando uma faixa branca no rodapé.

          O gradiente continua ancorado em `altura` por `userSpaceOnUse`; se o
          container for mais alto que isso, o trecho abaixo recebe a cor do
          último `Stop` (`spreadMethod` padrão é `pad`), então a emenda é
          invisível. */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient
            id="gradienteSplash"
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={0}
            y2={altura}
          >
            <Stop offset="0" stopColor={cores.amareloSplashTopo} />
            <Stop offset="1" stopColor={cores.amareloSplash} />
          </LinearGradient>
        </Defs>

        <Rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="url(#gradienteSplash)"
        />

        <G opacity={OPACIDADE_HEXES}>
          {hexes.map((hex) => (
            <Polygon
              key={hex.chave}
              points={pontosEm(hex.x, hex.y)}
              fill={cores.neutro0}
            />
          ))}
        </G>
      </Svg>

      <View style={estilos.monograma}>
        <Text style={estilos.monogramaTexto}>{MONOGRAMA}</Text>
      </View>

      <Text style={estilos.wordmark}>{WORDMARK}</Text>

      <Text style={estilos.versao}>{VERSAO}</Text>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  /** `position: absolute; inset: 0; display: flex; flex-direction: column;
   *  align-items: center; justify-content: center;` */
  cobertura: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    /**
     * Cor final do gradiente também como fundo do container — rede de
     * segurança para qualquer pixel que o <Svg> não alcance (um frame antes de
     * ele pintar, um arredondamento de subpixel na borda). Sem isto o que
     * aparecia ali era o branco da página, e no rodapé isso lia como um defeito
     * de tela. Como é exatamente o `Stop` de baixo do gradiente, a emenda não
     * se nota.
     */
    backgroundColor: cores.amareloSplash,
  },

  /** `width: 96px; height: 96px; border-radius: 999px; background: #FFFFFF;` */
  monograma: {
    width: 96,
    height: 96,
    borderRadius: raioPill,
    backgroundColor: cores.neutro0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /**
   * `font-size: 34px; font-weight: 800; letter-spacing: -.03em; color: #F4AD09`.
   * `tipografia.displayLg` já é 34px, mas em peso 700 — a splash é o único
   * lugar do protótipo com 800, então o peso é sobrescrito aqui em vez de virar
   * um token novo. `-.03em` de 34px ≈ -1px.
   */
  monogramaTexto: {
    ...tipografia.displayLg,
    fontFamily: familiaInter.extraBold,
    fontWeight: '800',
    letterSpacing: -1,
    color: cores.amareloSplash,
  },

  /** `margin-top: 14px; font-size: 18px; font-weight: 600; color: #FFFFFF` */
  wordmark: {
    ...tipografia.tituloMd,
    marginTop: 14,
    color: cores.neutro0,
  },

  /**
   * `position: absolute; left: 0; right: 0; bottom: 46px; text-align: center;
   *  font-size: 13px; color: rgba(255,255,255,.7)`.
   * O alpha do texto é feito com `opacity` sobre `neutro0` para não precisar de
   * um token de cor só para isso.
   */
  versao: {
    ...tipografia.corpoSm,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 46,
    textAlign: 'center',
    color: cores.neutro0,
    opacity: 0.7,
  },
});
