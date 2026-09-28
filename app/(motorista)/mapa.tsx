/**
 * B11b — Tela Mapa/Home: a UI fixa sobre o mapa e a orquestração.
 *
 * A metade "mapa" (pan/zoom, camadas de transform, ruas, hexágonos, rota e
 * marcador) mora em `@/components/mapa/MapaBase` (B11a). Aqui ficam o header,
 * a barra inferior, os FABs, o banner promocional e os overlays de drawer /
 * oferta / corrida.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html` linhas 138-232 e
 * `.design-import/logic.js`:
 * - `conectar()` linhas 304-307 — CARREGANDO por 1400ms, depois tela facial
 * - `mostrarUiMapa`/`bannerVisivel`/`bgCamada`/`slotConectar` linhas 482-486
 * - `fabBottom` linha 478 — os FABs sobem durante a corrida
 *
 * MARCA: o protótipo escreve "...ganhe R$ 500 na RotaFácil" (linha 180). O app
 * se chama "99"; usamos a frase autêntica registrada em `DESIGN_SYSTEM.md`
 * (linha 500): "Ganhe R$500 indicando um motora pra 99!".
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { CardOferta } from '@/components/corrida/CardOferta';
import { PainelStatus } from '@/components/corrida/PainelStatus';
import { DrawerMenu } from '@/components/menu/DrawerMenu';
import { BotaoRecentrar } from '@/components/mapa/BotaoRecentrar';
import MapaBase, {
  type EstadoCamera,
  type MapaBaseHandle,
  type MapaBaseProps,
} from '@/components/mapa/MapaBase';
import { CoberturaSplash } from '@/components/splash/CoberturaSplash';
import { PontosPulsando } from '@/components/ui/Botao';
import { Icone } from '@/components/ui/Icones';
import { DURACAO_OFERTA_S, useCorridaStore } from '@/state/corridaStore';
import { useMotoristaStore } from '@/state/motoristaStore';
import {
  irCentral,
  irConta,
  irPerfil,
  irPrefSolic,
  irTeste,
  irVeiculos,
} from '@/servicos/navegacao';
import { conectar, finalizarCorrida } from '@/servicos/simuladorCorridas';
import { fmt } from '@/servicos/mapaFalso';
import { cores, coresMapaEscuro } from '@/tema/cores';
import { espacamento, raioCard, raioPill, sombraFlutuante } from '@/tema/espacamento';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

/**
 * A foto do banner de indicação.
 *
 * No protótipo esse espaço é um listrado a 135° com "foto indicação" escrito
 * por cima (`.dc.html` linha 189-190) — um marcador de "aqui vai a foto".
 *
 * `require` estático de propósito: o Metro resolve o asset em tempo de
 * bundling, então o caminho não pode ser montado em runtime — mesma razão de
 * `src/servicos/som.ts`.
 */
const FOTO_INDICACAO = require('../../assets/imagens/indicacao.png');

const ALTURA_BOTAO = 56;

/**
 * Barra inferior: `padding: 8px 18px 0` e altura fixa de 88 no protótipo.
 *
 * Os 88 eram 8 (topo) + 56 (botão) + 24 de sobra embaixo — e essa sobra era
 * espaço branco morto, medido para o frame 390×844 do Claude Design, que não
 * tem barra de gestos. Num iPhone o resultado somava a sobra à faixa do
 * indicador de home e virava uma tarja branca larga sob o "Conectar".
 *
 * Agora a barra é justa ao conteúdo, na proporção do app real usado como
 * referência: 16 em cima, o botão, 2 embaixo — ou seja, o "Conectar" encosta
 * na base da tela, sem faixa branca sob ele. O protótipo fazia o oposto (8 em
 * cima, 24 embaixo), e de longe aquela sobra lia como uma laje branca.
 *
 * Os 2 (em vez de 0) existem só para a curva do pill não ser cortada pelo
 * canto arredondado da própria tela do aparelho.
 *
 * ## Por que um número fixo, e não `useSafeAreaInsets()`
 *
 * A versão anterior usava o inset inferior do sistema, e o resultado **mudava
 * conforme a abertura**: no arranque frio o `SafeAreaProvider` ainda não tinha
 * medido nada e devolvia 0 (barra de 72, compacta); numa reabertura quente já
 * devolvia os ~34 do indicador de home, e a barra nascia com 98 — mais alta do
 * que os 88 originais. Ou seja, a correção valia só na primeira abertura.
 *
 * A pedido, a barra passa a ter sempre a mesma altura, em qualquer abertura e
 * em qualquer aparelho. O preço é assumido: os 2px deixam o "Conectar" rente
 * da faixa do indicador de home do iPhone, em vez dos ~34 que o sistema
 * sugere. O botão continua tocável — a faixa do indicador não bloqueia toque,
 * só divide a área com o gesto de voltar à tela inicial.
 */
const PADDING_TOPO_BARRA = 16;
const ESPACO_BASE = 2;

/**
 * Distâncias dos elementos flutuantes até o TOPO da barra — e não até a base
 * da tela, como no protótipo (`fabBottom`, logic.js 478: 216 e 348; banner em
 * 104). Guardar a diferença, e não o valor absoluto, é o que mantém a
 * composição intacta a cada vez que a altura da barra é reajustada.
 */
const FOLGA_FAB = 128; // 216 − 88
const FOLGA_FAB_CORRIDA = 260; // 348 − 88
const FOLGA_BANNER = 16; // 104 − 88
/**
 * Botão central e laterais da barra, nas medidas do app real de referência.
 *
 * O protótipo desenhava os ícones laterais soltos sobre o branco, num alvo de
 * toque invisível de 44. No app de verdade eles são **discos cinza-claro** de
 * 50, e é isso que dá peso à barra — sem eles, a faixa branca fica com dois
 * riscos pretos nas pontas e um botão amarelo no meio, que é justamente a
 * leitura de "sobrou espaço".
 *
 * Com 18 de padding lateral, 50 + 228 + 50 deixa 13 de respiro entre os três
 * numa tela de 390 — a mesma proporção da referência.
 */
const DIAMETRO_BOTAO_BARRA = 50;
const LARGURA_BOTAO_CENTRAL = 228;

/** Cantos arredondados do topo da barra, como o painel branco da referência. */
const RAIO_TOPO_BARRA = 20;

/** Altura do banner promocional (`.dc.html`: height:100). */
const ALTURA_BANNER = 100;

const TOPO_HEADER = 71;
const ALVO_TOQUE = 44;

// ---------------------------------------------------------------------------
// Ponte entre o piloto automático e o MapaBase
// ---------------------------------------------------------------------------

type MapaConectadoProps = Omit<MapaBaseProps, 'progresso' | 'angulo'> & {
  refMapa: React.RefObject<MapaBaseHandle | null>;
};

/**
 * Só existe para isolar `corridaStore.prog`/`.ang` do resto da tela.
 *
 * Os dois mudam a cada quadro do piloto automático (`iniciarLoop`, rAF) —
 * ver o comentário em `Mapa()` sobre por que eles não são lidos lá em cima.
 * Isolados aqui, o quadro-a-quadro re-renderiza só `MapaBase`; `children`
 * chega como um elemento já pronto do render de `Mapa()`, então nem essa
 * reconciliação menor toca o header, o banner ou a folha inferior por baixo
 * do mapa — eles só re-renderizam quando o próprio `Mapa()` muda por um
 * motivo de verdade (oferta chegou, banner fechou, etc.).
 */
function MapaConectado({ refMapa, emCorrida, ...resto }: MapaConectadoProps) {
  const prog = useCorridaStore((s) => s.prog);
  const ang = useCorridaStore((s) => s.ang);
  return (
    <MapaBase
      ref={refMapa}
      emCorrida={emCorrida}
      progresso={emCorrida ? prog : 0}
      angulo={ang}
      {...resto}
    />
  );
}

export default function Mapa() {
  const refMapa = useRef<MapaBaseHandle>(null);

  /**
   * Altura da barra inferior — a mesma em toda abertura, por decisão explícita
   * (ver `PADDING_TOPO_BARRA`). Os elementos flutuantes se posicionam a partir
   * dela, então continua bastando mudar as constantes para recompor a tela.
   */
  const alturaBarra = PADDING_TOPO_BARRA + ALTURA_BOTAO + ESPACO_BASE;

  // ---- Stores -------------------------------------------------------------

  const status = useMotoristaStore((s) => s.status);
  const ganhos = useMotoristaStore((s) => s.ganhos);
  const banner = useMotoristaStore((s) => s.banner);
  const camada = useMotoristaStore((s) => s.camada);
  const fecharBanner = useMotoristaStore((s) => s.fecharBanner);
  const toggleCamada = useMotoristaStore((s) => s.toggleCamada);

  const oferta = useCorridaStore((s) => s.oferta);
  const fase = useCorridaStore((s) => s.fase);
  const corrida = useCorridaStore((s) => s.corrida);
  const corridaStatus = useCorridaStore((s) => s.corridaStatus);
  // `prog`/`ang` NÃO são lidos aqui, de propósito: mudam a cada quadro do
  // piloto automático (`corridaStore.iniciarLoop`, ~30x/s durante uma
  // corrida), e ler os dois neste componente faria o corpo inteiro de
  // `Mapa()` — header, banner, folha inferior, drawer — re-executar a cada
  // quadro só para o carro andar. Quem lê os dois é `MapaConectado`, abaixo,
  // que isola essa reconciliação ao mapa em si. Ver comentário ali.
  const chegada = useCorridaStore((s) => s.chegada);
  const aceitar = useCorridaStore((s) => s.aceitar);
  const recusar = useCorridaStore((s) => s.recusar);
  const avancarCorrida = useCorridaStore((s) => s.avancarCorrida);
  const pararLoop = useCorridaStore((s) => s.pararLoop);
  const trajetoAtual = useCorridaStore((s) => s.trajetoAtual);
  const prepAtual = useCorridaStore((s) => s.prepAtual);

  // ---- Estado local de UI -------------------------------------------------

  const [drawerAberto, setDrawerAberto] = useState(false);
  const [snap, setSnap] = useState<0 | 1 | 2>(1);
  const [foraDoCentro, setForaDoCentro] = useState(false);

  const emCorrida = corrida !== null;
  // `mostrarUiMapa` — logic.js 482.
  const mostrarUiMapa = !oferta && !emCorrida;
  // `bannerVisivel` — logic.js 483.
  const bannerVisivel = mostrarUiMapa && banner;

  /**
   * Altura da folha branca do rodapé. Com o banner dentro, ela sobe até
   * `FOLGA_BANNER` acima dele; sem banner, é só a linha de botões.
   */
  const alturaPainel = bannerVisivel
    ? alturaBarra + FOLGA_BANNER + ALTURA_BANNER + FOLGA_BANNER
    : alturaBarra;

  // ---- Ciclo de vida ------------------------------------------------------

  /**
   * B26 moveu o tick de demanda e os timers de oferta para `app/_layout.tsx`:
   * eles precisam sobreviver às telas empurradas e à ida/volta da verificação
   * facial, e o mapa é desmontado nesse caminho (a facial entra por `replace`).
   *
   * O que continua sendo desta tela é só o piloto automático: ele desenha o
   * carro andando *aqui*, então nenhum quadro dele deve continuar sendo
   * calculado depois que a tela sai. `finalizar()` já para o loop no fluxo
   * normal — isto é a rede de segurança para as saídas atípicas.
   */
  useEffect(() => pararLoop, [pararLoop]);

  // ---- Ações --------------------------------------------------------------

  /** Fecha o menu antes de navegar — `push()` zera `drawer` (logic.js 276). */
  const navegarDoDrawer = useCallback((ir: () => void) => {
    setDrawerAberto(false);
    ir();
  }, []);

  const aoMudarCamera = useCallback((e: EstadoCamera) => {
    setForaDoCentro(e.foraDoCentro);
  }, []);

  const recentrar = useCallback(() => {
    refMapa.current?.recentrar();
  }, []);

  /**
   * Deslizar para finalizar. `finalizarCorrida()` (B26) credita os ganhos e
   * navega para o Resumo — a tela não precisa saber a ordem nem a rota.
   */
  const aoFinalizar = useCallback(() => {
    finalizarCorrida();
  }, []);

  /**
   * Variante do botão principal do painel de corrida (B08).
   * `andando` enquanto o carro se move; vira botão quando chega; e em
   * EM_VIAGEM com chegada liberada, vira o deslizar para finalizar.
   */
  const variantePainel: 'andando' | 'botao' | 'deslizar' =
    corridaStatus === 'EM_VIAGEM' && chegada === 'botao'
      ? 'deslizar'
      : chegada === 'botao'
        ? 'botao'
        : 'andando';

  // ---- Geometria passada ao MapaBase -------------------------------------

  const mostrarRota = !!oferta || emCorrida;
  const geometria = mostrarRota ? prepAtual() : null;
  const trajeto = trajetoAtual();
  const pontosViagem = trajeto.pv.s;
  const origem = mostrarRota ? pontosViagem[0] : null;
  const destino = mostrarRota ? pontosViagem[pontosViagem.length - 1] : null;

  // `haloVisivel` — logic.js 463.
  const andando =
    (corridaStatus === 'INDO_BUSCAR' || corridaStatus === 'EM_VIAGEM') &&
    !chegada;

  // ---- Shimmer do "Buscando" ---------------------------------------------

  const brilho = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (status !== 'BUSCANDO') return;
    const anim = Animated.loop(
      Animated.timing(brilho, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [status, brilho]);

  const opacidadeBuscando = brilho.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.45, 1],
  });

  return (
    <View style={estilos.tela}>
      <StatusBar style="light" />

      <MapaConectado
        refMapa={refMapa}
        mostrarDemanda={camada && mostrarUiMapa}
        emCorrida={emCorrida}
        trajeto={geometria}
        seguir={emCorrida}
        onMudarCamera={aoMudarCamera}
        // `haloVisivel` — logic.js 463 escreve
        // `!andando || corridaStatus === 'AGUARDANDO'`, mas a segunda cláusula
        // é inalcançável: AGUARDANDO já implica `!andando`. Mantemos só a
        // primeira, que tem exatamente o mesmo resultado.
        haloMarcador={!andando}
        pulsoMarcador={chegada === 'pulse'}
        bounceOrigem={chegada === 'pin' && corridaStatus === 'INDO_BUSCAR'}
        bounceDestino={chegada === 'pin' && corridaStatus === 'EM_VIAGEM'}
        origem={origem}
        destino={destino}
      >
        {/* ---- Header (some em oferta/corrida) ---- */}
        {mostrarUiMapa ? (
          <View style={estilos.header} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir menu"
              onPress={() => setDrawerAberto(true)}
              style={estilos.hamburguer}
            >
              <View style={estilos.tracoHamburguer} />
              <View style={estilos.tracoHamburguer} />
              <View style={estilos.tracoHamburguer} />
              <View style={estilos.pontoNovidade} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Central de ganhos"
              // `irCentral` — .dc.html linha 148.
              onPress={irCentral}
              style={estilos.pillGanhos}
            >
              <Text style={estilos.textoGanhos}>{fmt(ganhos)}</Text>
              <View style={estilos.chevronPill} />
            </Pressable>

            {/* Espaçador de 44px — mantém a pill centralizada. */}
            <View style={estilos.espacadorHeader} />
          </View>
        ) : null}

        {/* ---- FABs ---- */}
        <View
          style={[
            estilos.colunaFabs,
            {
              bottom:
                alturaBarra + (emCorrida ? FOLGA_FAB_CORRIDA : FOLGA_FAB),
            },
          ]}
          pointerEvents="box-none"
        >
          <BotaoRecentrar
            visivel={mostrarUiMapa && foraDoCentro}
            onPress={recentrar}
          />

          {mostrarUiMapa ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Teste de status"
              // `irTeste` — .dc.html linha 165.
              onPress={irTeste}
              style={estilos.fab}
            >
              <View style={estilos.trianguloTeste} />
            </Pressable>
          ) : null}

          {mostrarUiMapa ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Alternar camada de demanda"
              onPress={toggleCamada}
              style={[
                estilos.fab,
                // `bgCamada` — logic.js 484.
                { backgroundColor: coresMapaEscuro.botao },
              ]}
            >
              <View
                style={[
                  estilos.losangoCamada,
                  { backgroundColor: camada ? coresMapaEscuro.iconeSobreBotao : cores.neutro400 },
                ]}
              />
              <View
                style={[
                  estilos.losangoCamada,
                  estilos.losangoCamadaBaixo,
                  { backgroundColor: camada ? coresMapaEscuro.iconeSobreBotao : cores.neutro400 },
                ]}
              />
            </Pressable>
          ) : null}
        </View>

        {/* ---- Painel branco do rodapé ----
             No app real o banner e a linha de botões dividem UMA folha branca
             de cantos arredondados; no protótipo eram duas peças soltas sobre
             o mapa, com uma tira de mapa entre elas. Este retângulo é essa
             folha: fica atrás dos dois e cresce para cobrir o banner quando ele
             está visível. Desenhar o fundo aqui, em vez de reestruturar a
             árvore, mantém banner e barra posicionados como já estavam. */}
        {mostrarUiMapa ? (
          <View
            style={[estilos.painelInferior, { height: alturaPainel }]}
            pointerEvents="none"
          >
            {/* Alça de arraste. Decorativa: na referência ela indica que a
                folha é arrastável, mas aqui a folha tem altura fixa e nada
                escuta gesto — sem ela, porém, o topo da folha fica com um vazio
                que não existe na foto. */}
            <View style={estilos.alcaPainel} />
          </View>
        ) : null}

        {/* ---- Banner promocional ---- */}
        {bannerVisivel ? (
          <View
            style={[estilos.banner, { bottom: alturaBarra + FOLGA_BANNER }]}
            pointerEvents="box-none"
          >
            <View style={estilos.bannerTextoArea}>
              <Text style={estilos.bannerTexto}>
                Ganhe <Text style={estilos.bannerTextoForte}>R$500</Text>{' '}
                indicando um motora pra{' '}
                <Text style={estilos.bannerTextoForte}>99!</Text>
              </Text>
              <View style={estilos.bannerLinhaAcao}>
                <View style={estilos.bannerAvatares}>
                  <View style={estilos.bannerAvatar} />
                  <View style={[estilos.bannerAvatar, estilos.bannerAvatar2]} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  // Sem destino de propósito: o protótipo não tem tela de
                  // indicação (`.dc.html` linha 186 é um `<button>` sem
                  // `onClick`), e o item "Indique um amigo" do drawer também
                  // não navega. Inventar um destino aqui seria fugir da fonte.
                  onPress={() => {}}
                  style={estilos.bannerBotao}
                >
                  <Text style={estilos.bannerBotaoTexto}>Quero indicar</Text>
                </Pressable>
              </View>
            </View>

            <Image
              source={FOTO_INDICACAO}
              style={estilos.bannerFoto}
              // `cover`: o quadro é quase quadrado (76×68) e a foto é
              // panorâmica — `contain` deixaria duas faixas vazias e a
              // motorista minúscula. O recorte já foi feito no arquivo, então
              // o corte automático das laterais não tira ninguém do quadro.
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar banner"
              onPress={fecharBanner}
              hitSlop={10}
              style={estilos.bannerFechar}
            >
              <Text style={estilos.bannerFecharTexto}>✕</Text>
            </Pressable>
          </View>
        ) : null}

        {/* ---- Barra inferior ---- */}
        {mostrarUiMapa ? (
          <View style={[estilos.barraInferior, { paddingBottom: ESPACO_BASE }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Preferências de solicitações"
              // `irPrefSolic` — .dc.html linha 198.
              onPress={irPrefSolic}
              style={estilos.iconeBarra}
            >
              <Icone nome="filtros" tamanho={24} traco={2} cor={coresMapaEscuro.iconeSobreBotao} />
              <View style={estilos.pontoNovidadeBarra} />
            </Pressable>

            {status === 'OFFLINE' ? (
              <Pressable
                accessibilityRole="button"
                onPress={conectar}
                style={({ pressed }) => [
                  estilos.botaoCentral,
                  estilos.botaoConectar,
                  pressed && estilos.botaoConectarPressionado,
                ]}
              >
                <Text style={estilos.textoConectar}>Conectar</Text>
              </Pressable>
            ) : null}

            {status === 'CARREGANDO' ? (
              <View style={[estilos.botaoCentral, estilos.botaoCarregando]}>
                <Text style={estilos.textoConectar}>Carregando</Text>
                <PontosPulsando cor={cores.neutro900} />
              </View>
            ) : null}

            {status === 'BUSCANDO' ? (
              <View style={[estilos.botaoCentral, estilos.botaoBuscando]}>
                <Animated.Text
                  style={[
                    estilos.textoBuscando,
                    { opacity: opacidadeBuscando },
                  ]}
                >
                  Buscando
                </Animated.Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Central de ganhos"
              // `irCentral` — .dc.html linha 224 (o mesmo destino da pill do
              // header; são dois atalhos para a mesma tela no protótipo).
              onPress={irCentral}
              style={estilos.iconeBarra}
            >
              <Icone nome="balao" tamanho={24} traco={2} cor={coresMapaEscuro.iconeSobreBotao} />
            </Pressable>
          </View>
        ) : null}
      </MapaConectado>

      {/* ---- Overlays, na ordem de prioridade visual da spec ---- */}

      {/*
        Destinos do menu — `.dc.html` linhas 349 (avatar), 365 ("Ganhos"),
        375 ("Veículos") e 379 ("Horas Dirigidas"). Os demais itens
        (Recompensas, Indique um amigo, Central de Ajuda, Notificações,
        Central de Educação, Loja) não têm `onClick` no protótipo: não existe
        tela para eles, então continuam inertes de propósito.
      */}
      <DrawerMenu
        visivel={drawerAberto}
        onFechar={() => setDrawerAberto(false)}
        onIrPerfil={() => navegarDoDrawer(irPerfil)}
        onIrGanhos={() => navegarDoDrawer(irCentral)}
        onIrVeiculos={() => navegarDoDrawer(irVeiculos)}
        onIrHorasDirigidas={() => navegarDoDrawer(irConta)}
      />

      {oferta ? (
        <CardOferta
          oferta={oferta}
          duracaoSegundos={DURACAO_OFERTA_S}
          fase={fase}
          onAceitar={aceitar}
          onRecusar={recusar}
        />
      ) : null}

      {corrida && corridaStatus ? (
        <PainelStatus
          corrida={corrida}
          corridaStatus={corridaStatus}
          snap={snap}
          onAlternarSnap={() => setSnap((s) => ((s + 1) % 3) as 0 | 1 | 2)}
          variante={variantePainel}
          onAvancar={
            variantePainel === 'deslizar' ? aoFinalizar : avancarCorrida
          }
        />
      ) : null}

      {/*
        Splash por último, para ficar acima de tudo (`z-index: 8` no
        protótipo) e para o `StatusBar` claro dela vencer o escuro do mapa
        enquanto está no ar — o `expo-status-bar` resolve por ordem de
        montagem. Some sozinha em 1200ms e nunca mais volta nesta sessão.
      */}
      <CoberturaSplash />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro50,
  },

  // ---- Header ------------------------------------------------------------
  // left:16; right:16; top:71; space-between
  header: {
    position: 'absolute',
    left: espacamento.telaLateral,
    right: espacamento.telaLateral,
    top: TOPO_HEADER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hamburguer: {
    width: ALVO_TOQUE,
    height: ALVO_TOQUE,
    borderRadius: raioPill,
    backgroundColor: coresMapaEscuro.botao,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...sombraFlutuante,
  },
  tracoHamburguer: {
    width: 16,
    height: 2,
    borderRadius: 2,
    backgroundColor: coresMapaEscuro.iconeSobreBotao,
  },
  pontoNovidade: {
    position: 'absolute',
    top: 5,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: raioPill,
    backgroundColor: cores.erro500,
  },
  // height:44; padding:0 20px; radius:999; background:#26292E
  pillGanhos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: ALVO_TOQUE,
    paddingHorizontal: 20,
    borderRadius: raioPill,
    backgroundColor: cores.sheetFundo,
    ...sombraFlutuante,
  },
  // font-size:17; font-weight:700; tabular-nums
  textoGanhos: {
    ...tipografia.corpoLg,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro0,
    ...numeroTabular,
  },
  // Quadrado 7×7 com duas bordas, girado 45° — vira um chevron "▾".
  chevronPill: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: cores.neutro0,
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
  espacadorHeader: {
    width: ALVO_TOQUE,
  },

  // ---- FABs ---------------------------------------------------------------
  colunaFabs: {
    position: 'absolute',
    right: espacamento.telaLateral,
    flexDirection: 'column',
    gap: 12,
    alignItems: 'flex-end',
  },
  fab: {
    width: ALVO_TOQUE,
    height: ALVO_TOQUE,
    borderRadius: raioPill,
    backgroundColor: coresMapaEscuro.botao,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    ...sombraFlutuante,
  },
  // Triângulo cheio 20×17 (`polygon(50% 0, 100% 100%, 0 100%)`), desenhado
  // com a técnica de bordas — não precisa de SVG para um triângulo sólido.
  trianguloTeste: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 17,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: coresMapaEscuro.iconeSobreBotao,
  },
  // Losango 20×7 (`polygon(50% 0, 100% 50%, 50% 100%, 0 50%)`) — aproximado
  // com um quadrado girado 45°, que é o mesmo desenho sem precisar de SVG.
  losangoCamada: {
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }, { scaleY: 0.42 }],
  },
  losangoCamadaBaixo: {
    opacity: 0.55,
  },

  // ---- Banner -------------------------------------------------------------
  // left:16; right:16; bottom:104; height:100; radius:12; background:#F8D60B
  banner: {
    position: 'absolute',
    left: espacamento.telaLateral,
    right: espacamento.telaLateral,
    bottom: 104,
    height: 100,
    borderRadius: raioCard,
    backgroundColor: cores.amarelo500,
    paddingVertical: 13,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...sombraFlutuante,
  },
  bannerTextoArea: {
    maxWidth: 210,
  },
  // font-size:13.5; line-height:17
  bannerTexto: {
    fontFamily: familiaInter.regular,
    fontSize: 13.5,
    lineHeight: 17,
    color: cores.neutro900,
  },
  bannerTextoForte: {
    fontFamily: familiaInter.extraBold,
    fontWeight: '800',
  },
  bannerLinhaAcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 9,
  },
  bannerAvatares: {
    flexDirection: 'row',
  },
  bannerAvatar: {
    width: 22,
    height: 22,
    borderRadius: raioPill,
    backgroundColor: cores.sheetFundo,
    borderWidth: 2,
    borderColor: cores.amarelo500,
  },
  bannerAvatar2: {
    backgroundColor: cores.neutro600,
    marginLeft: -8,
  },
  // padding:6px 14px; radius:999; background:#E22808
  bannerBotao: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: raioPill,
    backgroundColor: cores.vermelhoCta,
  },
  bannerBotaoTexto: {
    fontFamily: familiaInter.bold,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '700',
    color: cores.neutro0,
  },
  /**
   * 76×68 — as medidas do "foto indicação" do protótipo (`.dc.html` linha
   * 189), que ali era um listrado branco com o rótulo escrito por cima. Agora
   * é a foto.
   *
   * Sem o `opacity: 0.55` que o placeholder tinha: ele existia para o listrado
   * não competir com o amarelo do banner, e numa foto de verdade só a lavaria.
   */
  bannerFoto: {
    width: 76,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bannerFechar: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerFecharTexto: {
    fontFamily: familiaInter.bold,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    color: cores.neutro900,
  },

  // ---- Barra inferior -----------------------------------------------------
  // Altura vem do conteúdo: 8 (topo) + botão + espaço da barra de gestos,
  // aplicado como `paddingBottom` no JSX. Ver `PADDING_TOPO_BARRA`.
  /**
   * A folha branca do rodapé — o fundo de banner + barra, numa peça só, como
   * no app real. A altura vem do JSX (`alturaPainel`), porque depende de o
   * banner estar visível ou não.
   */
  painelInferior: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: coresMapaEscuro.superficie,
    borderTopLeftRadius: RAIO_TOPO_BARRA,
    borderTopRightRadius: RAIO_TOPO_BARRA,
    alignItems: 'center',
    // Sombra para cima (`0 -2px 12px`) — o offset negativo é o que muda.
    shadowColor: sombraFlutuante.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // 36×4 no topo da folha, como na referência.
  alcaPainel: {
    marginTop: 8,
    width: 36,
    height: 4,
    borderRadius: raioPill,
    backgroundColor: coresMapaEscuro.alca,
  },

  // A linha dos três botões. Sem fundo próprio: quem pinta é `painelInferior`.
  barraInferior: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: PADDING_TOPO_BARRA,
    paddingHorizontal: 18,
  },
  iconeBarra: {
    width: DIAMETRO_BOTAO_BARRA,
    height: DIAMETRO_BOTAO_BARRA,
    borderRadius: raioPill,
    backgroundColor: coresMapaEscuro.botao,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pontoNovidadeBarra: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: raioPill,
    backgroundColor: cores.erro500,
  },

  // width:214; height:56; radius:999
  botaoCentral: {
    width: LARGURA_BOTAO_CENTRAL,
    height: ALTURA_BOTAO,
    borderRadius: raioPill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botaoConectar: {
    backgroundColor: cores.amarelo500,
  },
  // style-active do protótipo: background #E0C009 + scale(.97)
  botaoConectarPressionado: {
    backgroundColor: cores.amarelo600,
    transform: [{ scale: 0.97 }],
  },
  botaoCarregando: {
    backgroundColor: cores.amarelo600,
  },
  textoConectar: {
    ...tipografia.labelBtn,
    color: cores.neutro900,
  },
  botaoBuscando: {
    backgroundColor: cores.neutro50,
  },
  // O protótipo usa gradiente animado recortado no texto
  // (`background-clip: text`), que não existe em RN — a leitura equivalente
  // mais próxima sem SVG é pulsar a opacidade do texto.
  textoBuscando: {
    ...tipografia.tituloMd,
    color: cores.neutro600,
  },
});
