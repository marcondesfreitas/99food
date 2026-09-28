/**
 * MolduraFacial — moldura **redonda** da "verificação facial" (bloco B09).
 *
 * Componente **puramente apresentacional e decorativo**: não faz detecção de
 * rosto nem captura de imagem. O protótipo inteiro é simulado — ver
 * `ARQUITETURA.md §8`, nível **A ("Simulada")**: moldura + animação de
 * progresso, sem câmera e sem nenhuma detecção real.
 *
 * ## DESVIO DELIBERADO: círculo, não elipse
 *
 * O protótipo usa uma elipse de 240×320 (`.dc.html` linhas 418 e 430) e o
 * componente se chamava `MolduraFacialOval`. A pedido, virou um círculo de
 * 280px com um **segmento girando** por cima do arco de progresso — leitura de
 * "escaneando" que a elipse estática não dava. O resto (tempos, cores,
 * sequência de estados, tremor da falha, "bater" do sucesso) continua idêntico
 * ao protótipo.
 *
 * Ver `DIAMETRO`, `FRACAO_SEGMENTO` e `DURACAO_ORBITA_MS` para o raciocínio de
 * cada número novo.
 *
 * A orquestração temporal (6100ms até `sucesso`, 900ms de atraso, etc.) é da
 * tela B12 (Onda 3). Aqui só existe a prop `estado`, e as animações reagem a
 * cada mudança dela.
 *
 * Fonte no protótipo:
 * - `.design-import/RotaFacil Motorista v6.dc.html` linhas 388-451 (`telaFacial`)
 *   e o `<style>` do `<helmet>` (keyframes `arcooval`, `tremer`, `bateu`, `spin`).
 * - `.design-import/logic.js` linhas 419 e 538-544 (`temFoto`, `corOval`,
 *   `animOval`, `facialTexto`).
 *
 * ## SEM CÂMERA (decisão de projeto, a pedido)
 *
 * A moldura **não abre mais a câmera**. O `expo-camera` (`CameraView` +
 * `useCameraPermissions`) foi removido daqui: nenhuma permissão é pedida e
 * nenhum preview é iniciado — nem no app, nem na web.
 *
 * No lugar do preview vai a **foto de perfil** da pessoa
 * (`motoristaStore.fotoUri`), recortada em `cover` dentro do mesmo furo
 * redondo da máscara. Sem foto escolhida, o miolo fica com o fundo escuro do
 * protótipo e as iniciais do nome, como nos demais avatares do app
 * (`FotoPerfil`).
 *
 * Isso não muda nada na simulação: a verificação já era um timer (§8, nível
 * A), então o preview nunca teve papel funcional.
 */
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Mask, Path, Rect } from 'react-native-svg';

import { iniciaisDe } from '@/components/ui/FotoPerfil';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';
import { useMotoristaStore, type FotoStatus } from '@/state/motoristaStore';

// ---------------------------------------------------------------------------
// Constantes de geometria e tempo (copiadas do protótipo)
// ---------------------------------------------------------------------------

/**
 * Recorte **circular** de 280px de diâmetro.
 *
 * DESVIO DELIBERADO do protótipo, a pedido: o `.dc.html` usa uma elipse de
 * 240×320 (rx 120 / ry 160). O diâmetro de 280 é a média das duas medidas, o
 * que mantém a moldura ocupando praticamente a mesma área da tela — e, por
 * coincidência útil, o perímetro quase não muda (2π·140 ≈ 879,6 contra os 884
 * da elipse original), então a velocidade do arco de progresso continua a
 * mesma sem reajustar nenhum tempo.
 */
const DIAMETRO = 280;
const RAIO = DIAMETRO / 2;

/** Espessura do anel externo e do arco de progresso. */
const ANEL_ESPESSURA = 4;

/**
 * Folga ao redor do SVG do anel para que o traço não seja cortado pela borda
 * do viewBox (no protótipo web o traço ficava meio cortado; aqui sobra espaço).
 */
const ANEL_FOLGA = ANEL_ESPESSURA;
const ANEL_LADO = DIAMETRO + ANEL_FOLGA * 2;
const ANEL_CENTRO = ANEL_LADO / 2;

/** Circunferência, base de todos os `strokeDasharray` deste arquivo. */
const PERIMETRO = 2 * Math.PI * RAIO;

/** Uma volta completa do arco em ~6s (`animation: arcooval 6s linear both`). */
const DURACAO_ARCO_MS = 6000;

/**
 * Segmento que orbita a moldura durante a verificação — o "escaneando".
 *
 * É a parte que o protótipo não tinha: lá o anel só se preenchia. O segmento
 * gira por cima do progresso, então a tela comunica as duas coisas ao mesmo
 * tempo: *está acontecendo* (o giro) e *quanto falta* (o preenchimento).
 *
 * 22% da circunferência é o comprimento em que o arco ainda lê como "um
 * pedaço girando" em vez de "um anel quase fechado tremendo".
 */
const FRACAO_SEGMENTO = 0.22;
const COMPRIMENTO_SEGMENTO = PERIMETRO * FRACAO_SEGMENTO;

/**
 * Uma volta do segmento por 1,1s. Cinco voltas e meia ao longo dos 6s da
 * verificação: rápido o bastante para ler como atividade, devagar o bastante
 * para o olho acompanhar.
 */
const DURACAO_ORBITA_MS = 1100;

/** `@keyframes bateu`: scale 1 → 1.06 → 1 em 400ms. */
const DURACAO_BATER_MS = 400;
const ESCALA_BATER = 1.06;

/** `@keyframes tremer`: translateX 0/-6/6/-4/4/0 em 300ms (5 trechos de 60ms). */
const PASSOS_TREMER = [-6, 6, -4, 4, 0] as const;
const DURACAO_TREMER_MS = 300;
const DURACAO_PASSO_TREMER = DURACAO_TREMER_MS / PASSOS_TREMER.length;

/**
 * Deslocamento vertical da moldura em relação ao centro do container.
 * No frame de 390×844 do protótipo o recorte fica em `top: 292` (centro
 * y = 452), 30px abaixo do centro do frame (422) — mantido aqui como offset
 * relativo para funcionar em qualquer altura de tela.
 */
const DESLOCAMENTO_Y = 30;

/** Distância do bloco de texto/ação até a base (`bottom: 96` no protótipo). */
const BASE_TEXTO = 96;

const TEXTOS: Record<EstadoFacial, string> = {
  // O protótipo pedia "olhe diretamente para a câmera e posicione seu rosto
  // dentro do oval". Sem câmera, a frase virava instrução para algo que não
  // acontece mais — agora o texto descreve o que a tela de fato faz: conferir
  // a foto do perfil.
  verificando: 'Conferindo a foto do seu perfil. Aguarde um instante.',
  sucesso: 'Tudo certo!',
  falha: 'Não conseguimos verificar. Tentar novamente.',
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export type EstadoFacial = 'verificando' | 'sucesso' | 'falha';

export type MolduraFacialProps = {
  /** Estado visual da verificação. Quem controla o tempo é a tela (B12). */
  estado: EstadoFacial;

  /**
   * Status da foto de perfil. Se omitido, é lido de `motoristaStore.foto`
   * (B03). Existe como prop para permitir usar o componente isolado (Storybook,
   * testes) sem depender da store.
   */
  foto?: FotoStatus;

  /** Ação do botão "Tentar novamente" (só aparece em `falha`). */
  onTentarNovamente?: () => void;

  /** Ação do link "Adicionar agora ›" do aviso de perfil sem foto. */
  onAdicionarFoto?: () => void;

  style?: StyleProp<ViewStyle>;
};

const CirculoAnimado = Animated.createAnimatedComponent(Circle);

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function MolduraFacial({
  estado,
  foto,
  onTentarNovamente,
  onAdicionarFoto,
  style,
}: MolduraFacialProps) {
  const fotoDaStore = useMotoristaStore((s) => s.foto);
  const fotoUri = useMotoristaStore((s) => s.fotoUri);
  const nome = useMotoristaStore((s) => s.contaNome);
  const statusFoto = foto ?? fotoDaStore;

  // `.design-import/logic.js` linha 419: `temFoto = s.foto === 'ok'`.
  // Durante o upload ('enviando') mantemos o bloco de comparação visível, só
  // que esmaecido (`avatarOpacidade: 0.5` no protótipo) — mostrar o aviso
  // "adicione uma foto" no meio do envio seria enganoso.
  const temFoto = statusFoto === 'ok';
  const enviandoFoto = statusFoto === 'enviando';
  const mostrarComparacao = temFoto || enviandoFoto;

  // Medimos o container para posicionar a máscara e o anel no mesmo centro.
  const [medida, setMedida] = useState<{ largura: number; altura: number } | null>(null);

  const aoMedir = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setMedida((anterior) =>
      anterior && anterior.largura === width && anterior.altura === height
        ? anterior
        : { largura: width, altura: height },
    );
  };

  // ---- Animações ----------------------------------------------------------

  /** `strokeDashoffset` do arco de progresso: perímetro (vazio) → 0 (cheio). */
  const deslocamentoArco = useSharedValue(PERIMETRO);
  /**
   * Posição do segmento que orbita, expressa como `strokeDashoffset`.
   *
   * Com `strokeDasharray = [segmento, resto]`, deslocar o offset de 0 até
   * `-PERIMETRO` faz o traço dar exatamente uma volta no sentido horário. É a
   * mesma técnica do arco de progresso logo acima — e a razão de não girar um
   * `<G>` por `rotation`: `strokeDashoffset` é um número puro que o
   * `react-native-svg` já anima aqui de forma comprovada, enquanto props de
   * transform em nós SVG dependem de caminho menos previsível.
   */
  const deslocamentoOrbita = useSharedValue(0);
  /** `@keyframes bateu` (sucesso). */
  const escalaMoldura = useSharedValue(1);
  /** `@keyframes tremer` (falha). */
  const tremorX = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(deslocamentoArco);
    cancelAnimation(deslocamentoOrbita);
    cancelAnimation(escalaMoldura);
    cancelAnimation(tremorX);

    escalaMoldura.value = 1;
    tremorX.value = 0;

    if (estado === 'verificando') {
      deslocamentoArco.value = PERIMETRO;
      deslocamentoArco.value = withTiming(0, {
        duration: DURACAO_ARCO_MS,
        easing: Easing.linear,
      });

      // Giro contínuo, sem easing: qualquer aceleração faria o segmento
      // "pulsar" a cada volta em vez de girar liso. `false` no terceiro
      // argumento = não inverte no fim do ciclo — o segmento sempre gira para
      // o mesmo lado, e como começa e termina no mesmo ponto do traço, a
      // emenda entre voltas é invisível.
      deslocamentoOrbita.value = 0;
      deslocamentoOrbita.value = withRepeat(
        withTiming(-PERIMETRO, {
          duration: DURACAO_ORBITA_MS,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
      return;
    }

    if (estado === 'sucesso') {
      deslocamentoArco.value = 0;
      escalaMoldura.value = withSequence(
        withTiming(ESCALA_BATER, {
          duration: DURACAO_BATER_MS / 2,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, {
          duration: DURACAO_BATER_MS / 2,
          easing: Easing.out(Easing.quad),
        }),
      );
      return;
    }

    // falha
    deslocamentoArco.value = PERIMETRO;
    tremorX.value = withSequence(
      ...PASSOS_TREMER.map((passo) =>
        withTiming(passo, {
          duration: DURACAO_PASSO_TREMER,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
    );
  }, [estado, deslocamentoArco, deslocamentoOrbita, escalaMoldura, tremorX]);

  useEffect(
    () => () => {
      cancelAnimation(deslocamentoArco);
      cancelAnimation(deslocamentoOrbita);
      cancelAnimation(escalaMoldura);
      cancelAnimation(tremorX);
    },
    [deslocamentoArco, deslocamentoOrbita, escalaMoldura, tremorX],
  );

  const propsArco = useAnimatedProps(() => ({
    strokeDashoffset: deslocamentoArco.value,
  }));

  const propsOrbita = useAnimatedProps(() => ({
    strokeDashoffset: deslocamentoOrbita.value,
  }));

  const estiloMoldura = useAnimatedStyle(() => ({
    transform: [{ translateX: tremorX.value }, { scale: escalaMoldura.value }],
  }));

  // `animBateu` no protótipo: o bloco da foto do cadastro "bate" junto no sucesso.
  const estiloComparacao = useAnimatedStyle(() => ({
    transform: [{ scale: escalaMoldura.value }],
  }));

  // ---- Cores por estado ---------------------------------------------------

  /**
   * `corOval` — logic.js linha 540.
   *
   * O estado "verificando" usa `azulOval` (#2445A6), não `info500` (#4A90D9):
   * o DESIGN_SYSTEM §9.2 trocou o anel do facial por um azul mais saturado na
   * v2, e a precedência (§13) manda a v2 valer. O `info500` continua sendo o
   * azul do spinner logo abaixo do oval (`.dc.html` linha 443), do marcador do
   * motorista e do FAB de recentrar — são dois azuis diferentes na mesma tela.
   */
  const corEstado =
    estado === 'sucesso'
      ? cores.sucesso500
      : estado === 'falha'
        ? cores.erro500
        : cores.azulOval;

  // ---- Posições derivadas da medida --------------------------------------

  const centroX = medida ? medida.largura / 2 : 0;
  const centroY = medida ? medida.altura / 2 + DESLOCAMENTO_Y : 0;
  const molduraEsquerda = centroX - RAIO;
  const molduraTopo = centroY - RAIO;

  return (
    <View style={[styles.raiz, style]} onLayout={aoMedir}>
      {/* 1. Foto de perfil no lugar do antigo preview de câmera, atrás de
             tudo. A imagem é posicionada e dimensionada para caber exatamente
             no furo redondo da máscara (camada 2), então ela aparece dentro da
             moldura e não como um fundo de tela inteira. */}
      {medida ? (
        <View
          style={[
            styles.camadaFoto,
            {
              left: molduraEsquerda,
              top: molduraTopo,
            },
          ]}
          pointerEvents="none"
        >
          {fotoUri ? (
            <Image
              source={{ uri: fotoUri }}
              style={StyleSheet.absoluteFill}
              // `cover`: a foto já foi recortada em 1:1 ao ser escolhida
              // (`imagemPerfil.ts`), então preencher o círculo não distorce.
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View style={styles.fotoAusente}>
              <Text style={styles.iniciaisFoto}>{iniciaisDe(nome)}</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* 2. Escurecido com recorte circular — SVG <Mask> + <Circle>, mesma
             estrutura do `mascaraOvalV6` do protótipo, só que redondo. O furo
             é transparente, então a foto da camada de baixo aparece por
             ele. */}
      {medida ? (
        <View style={styles.camadaMascara} pointerEvents="none">
          <Svg width={medida.largura} height={medida.altura}>
            <Defs>
              <Mask id="mascaraMolduraFacial">
                <Rect
                  x={0}
                  y={0}
                  width={medida.largura}
                  height={medida.altura}
                  fill={cores.neutro0}
                />
                <Circle
                  cx={centroX}
                  cy={centroY}
                  r={RAIO}
                  fill={cores.neutro900}
                />
              </Mask>
            </Defs>
            <Rect
              x={0}
              y={0}
              width={medida.largura}
              height={medida.altura}
              fill={cores.overlayFacial}
              mask="url(#mascaraMolduraFacial)"
            />
          </Svg>
        </View>
      ) : null}

      {/* 3. Anel externo + arco de progresso + segmento orbitando + check. */}
      {medida ? (
        <Animated.View
          style={[
            styles.caixaMoldura,
            { left: molduraEsquerda, top: molduraTopo },
            estiloMoldura,
          ]}
          pointerEvents="none"
        >
          <Svg
            width={ANEL_LADO}
            height={ANEL_LADO}
            style={{ marginLeft: -ANEL_FOLGA, marginTop: -ANEL_FOLGA }}
          >
            {/* Anel externo neutro, sempre visível. */}
            <Circle
              cx={ANEL_CENTRO}
              cy={ANEL_CENTRO}
              r={RAIO}
              fill="none"
              stroke={cores.neutro200}
              strokeWidth={ANEL_ESPESSURA}
            />

            {estado === 'verificando' ? (
              <>
                {/* Progresso: percorre 360° em ~6s, começando no topo
                    (`rotate(-90 …)`, como no protótipo). */}
                <CirculoAnimado
                  cx={ANEL_CENTRO}
                  cy={ANEL_CENTRO}
                  r={RAIO}
                  fill="none"
                  stroke={corEstado}
                  strokeWidth={ANEL_ESPESSURA}
                  strokeLinecap="round"
                  strokeDasharray={PERIMETRO}
                  transform={`rotate(-90 ${ANEL_CENTRO} ${ANEL_CENTRO})`}
                  animatedProps={propsArco}
                />

                {/* Segmento girando por cima do progresso. Branco e mais fino
                    para ler como um brilho passando pelo anel, e não como um
                    segundo indicador competindo com o primeiro. */}
                <CirculoAnimado
                  cx={ANEL_CENTRO}
                  cy={ANEL_CENTRO}
                  r={RAIO}
                  fill="none"
                  stroke={cores.neutro0}
                  strokeWidth={ANEL_ESPESSURA - 1}
                  strokeLinecap="round"
                  strokeOpacity={0.9}
                  transform={`rotate(-90 ${ANEL_CENTRO} ${ANEL_CENTRO})`}
                  strokeDasharray={`${COMPRIMENTO_SEGMENTO} ${
                    PERIMETRO - COMPRIMENTO_SEGMENTO
                  }`}
                  animatedProps={propsOrbita}
                />
              </>
            ) : (
              /* Sucesso/falha: anel inteiro na cor do estado, sem movimento. */
              <Circle
                cx={ANEL_CENTRO}
                cy={ANEL_CENTRO}
                r={RAIO}
                fill="none"
                stroke={corEstado}
                strokeWidth={ANEL_ESPESSURA}
              />
            )}
          </Svg>

          {estado === 'sucesso' ? (
            <View style={styles.caixaCheck}>
              <Text style={styles.check}>✓</Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      {/* 4. Topo: aviso de "sem foto" ou comparação com a foto do cadastro. */}
      {mostrarComparacao ? (
        <Animated.View
          style={[
            styles.blocoComparacao,
            enviandoFoto ? styles.comparacaoEsmaecida : null,
            estiloComparacao,
          ]}
        >
          <View style={styles.avatarCadastro}>
            {/* Mostra a foto que a pessoa escolheu, quando houver. Sem foto
                própria, fica o rótulo do protótipo, que é um placeholder
                dizendo "existe uma foto no cadastro". */}
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={StyleSheet.absoluteFill} />
            ) : (
              <Text style={styles.textoAvatar}>{'foto do\ncadastro'}</Text>
            )}
          </View>
          <Text style={styles.legendaCadastro}>
            {enviandoFoto ? 'Enviando sua foto…' : 'Foto do seu cadastro'}
          </Text>
          <View style={styles.tracoComparacao} />
          <View style={styles.selosetaComparacao}>
            <Text style={styles.setaComparacao}>↔</Text>
          </View>
        </Animated.View>
      ) : (
        <View style={styles.avisoSemFoto}>
          <Text style={styles.textoAvisoSemFoto}>
            Adicione uma foto de perfil para agilizar a verificação.
          </Text>
          <Pressable
            onPress={onAdicionarFoto}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={styles.linkAvisoSemFoto}>Adicionar agora ›</Text>
          </Pressable>
        </View>
      )}

      {/* 5. Base: texto do estado + spinner (verificando) ou botão (falha). */}
      <View style={styles.blocoBase} pointerEvents="box-none">
        <Text
          style={styles.textoEstado}
          accessibilityLiveRegion="polite"
          accessibilityRole="text"
        >
          {TEXTOS[estado]}
        </Text>

        {estado === 'verificando' ? <SpinnerPequeno /> : null}

        {estado === 'falha' ? (
          <Pressable
            onPress={onTentarNovamente}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.botaoTentar,
              pressed ? styles.botaoTentarPressionado : null,
            ]}
          >
            <Text style={styles.textoBotaoTentar}>Tentar novamente</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Spinner (26px, `@keyframes spin 1s linear infinite`)
// ---------------------------------------------------------------------------

const SPINNER_TAMANHO = 26;
const SPINNER_ESPESSURA = 3;
const SPINNER_RAIO = (SPINNER_TAMANHO - SPINNER_ESPESSURA) / 2;
const SPINNER_CENTRO = SPINNER_TAMANHO / 2;

/**
 * Trilho branco a 25% + um quarto de volta azul, desenhados em SVG para não
 * precisar de literais `rgba(255,255,255,.25)` fora de `@/tema/cores`
 * (`strokeOpacity` resolve a transparência).
 */
function SpinnerPequeno() {
  const giro = useSharedValue(0);

  useEffect(() => {
    giro.value = 0;
    giro.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(giro);
  }, [giro]);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ rotate: `${giro.value}deg` }],
  }));

  return (
    <Animated.View style={estilo}>
      <Svg width={SPINNER_TAMANHO} height={SPINNER_TAMANHO}>
        <Circle
          cx={SPINNER_CENTRO}
          cy={SPINNER_CENTRO}
          r={SPINNER_RAIO}
          fill="none"
          stroke={cores.neutro0}
          strokeOpacity={0.25}
          strokeWidth={SPINNER_ESPESSURA}
        />
        {/* Quarto de arco no topo, equivalente ao `border-top-color` do CSS. */}
        <Path
          d={`M ${SPINNER_CENTRO} ${SPINNER_CENTRO - SPINNER_RAIO} A ${SPINNER_RAIO} ${SPINNER_RAIO} 0 0 1 ${SPINNER_CENTRO + SPINNER_RAIO} ${SPINNER_CENTRO}`}
          fill="none"
          stroke={cores.info500}
          strokeWidth={SPINNER_ESPESSURA}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: cores.neutro900,
  },

  /**
   * Caixa da foto de perfil: exatamente o quadrado circunscrito ao furo da
   * máscara (`DIAMETRO`), posicionada pela tela em `left`/`top`. O
   * `borderRadius` é redundante com a máscara em condições normais, mas
   * garante o recorte redondo mesmo se o SVG ainda não tiver pintado no
   * primeiro frame.
   */
  camadaFoto: {
    position: 'absolute',
    zIndex: 1,
    width: DIAMETRO,
    height: DIAMETRO,
    borderRadius: RAIO,
    overflow: 'hidden',
    backgroundColor: cores.sheetFundo,
  },

  fotoAusente: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  iniciaisFoto: {
    fontFamily: familiaInter.semiBold,
    fontSize: 72,
    lineHeight: 84,
    color: cores.sheetTexto2,
    textAlign: 'center',
  },

  camadaMascara: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },

  caixaMoldura: {
    position: 'absolute',
    zIndex: 3,
    width: DIAMETRO,
    height: DIAMETRO,
  },

  caixaCheck: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    fontFamily: familiaInter.bold,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 46,
    color: cores.neutro0,
  },

  // ---- Bloco da foto do cadastro (topo) ----------------------------------

  blocoComparacao: {
    zIndex: 4,
    alignItems: 'center',
    paddingTop: 18,
  },

  comparacaoEsmaecida: {
    opacity: 0.5,
  },

  avatarCadastro: {
    width: 64,
    height: 64,
    borderRadius: raioPill,
    borderWidth: 2,
    borderColor: cores.neutro200,
    overflow: 'hidden',
    backgroundColor: cores.neutro100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoAvatar: {
    ...tipografia.corpoSm,
    fontSize: 8,
    lineHeight: 10,
    color: cores.neutro600,
    textAlign: 'center',
  },

  legendaCadastro: {
    ...tipografia.corpoSm,
    marginTop: 6,
    color: cores.neutro0,
    opacity: 0.86,
  },

  tracoComparacao: {
    width: 0,
    height: 24,
    marginTop: 6,
    borderLeftWidth: 2,
    borderLeftColor: cores.neutro0,
    borderStyle: 'dashed',
    opacity: 0.4,
  },

  selosetaComparacao: {
    marginTop: -13,
    width: 26,
    height: 26,
    borderRadius: raioPill,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  setaComparacao: {
    ...tipografia.labelChip,
    color: cores.neutro600,
  },

  avisoSemFoto: {
    zIndex: 4,
    margin: espacamento.telaLateral,
    padding: 14,
    borderRadius: raioCard,
    backgroundColor: cores.amarelo100,
  },

  textoAvisoSemFoto: {
    ...tipografia.corpoSm,
    fontSize: 14,
    lineHeight: 19,
    color: cores.neutro900,
  },

  linkAvisoSemFoto: {
    ...tipografia.corpoSm,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    marginTop: 8,
    color: cores.alerta700,
  },

  // ---- Bloco de base -----------------------------------------------------

  blocoBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: BASE_TEXTO,
    zIndex: 4,
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 40,
  },

  textoEstado: {
    ...tipografia.corpoMd,
    lineHeight: 21,
    color: cores.neutro0,
    textAlign: 'center',
  },

  botaoTentar: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: raioPill,
    backgroundColor: cores.amarelo500,
  },

  botaoTentarPressionado: {
    backgroundColor: cores.amarelo600,
  },

  textoBotaoTentar: {
    ...tipografia.labelBtn,
    fontSize: 16,
    color: cores.neutro900,
  },
});

export default MolduraFacial;
