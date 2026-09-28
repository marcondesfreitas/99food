/**
 * Icones — o conjunto de pictogramas de linha do app.
 *
 * Funcionalidade **nova**. O protótipo (`.design-import/RotaFacil Motorista
 * v6.dc.html`) não tem ícone nenhum: onde deveria haver um, ele desenha um
 * quadradinho cinza vazio (`background:#F5F5F7`, `border-radius:10`) ou um
 * caractere solto — o `◈` do Pix (linha 778) e o `✦` de "Adicionar cartão"
 * (linha 771). São marcadores de lugar de quem estava prototipando layout, não
 * decisões de desenho.
 *
 * Este módulo preenche esses lugares. Regras que mantêm o conjunto coeso:
 *
 * - **Uma grade só**: todo ícone é desenhado num `viewBox` 24×24 e escalado
 *   pelo `tamanho`. É isso que faz um ícone de 18px na barra de ações e um de
 *   24px no cabeçalho parecerem da mesma família.
 * - **Traço, não preenchimento**: contorno de 1.7 com pontas e junções
 *   arredondadas, na mesma linguagem das bordas de 1.5–2px que o protótipo já
 *   usa (o "olho" do saldo, os chevrons). Preenchimento só nos pontos pequenos
 *   demais para ter contorno.
 * - **Cor por prop, nunca embutida**: quem usa passa o token de
 *   `src/tema/cores.ts`. Nenhuma cor aparece neste arquivo.
 *
 * Os desenhos são todos originais — nenhum é copiado de biblioteca de
 * terceiros, para o projeto não herdar licença de ícone.
 */

import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { cores } from '@/tema/cores';

/**
 * A engrenagem é o único desenho gerado em vez de escrito à mão: um dente
 * trapezoidal repetido 8 vezes em volta do centro. Escrever os 32 vértices na
 * mão daria um `d` ilegível e impossível de ajustar — mudando um número aqui,
 * a roda inteira se reequilibra.
 *
 * `-Math.PI / 2` põe o primeiro dente no topo (o ângulo 0 do SVG aponta para a
 * direita); as frações de `passo` são a largura angular do dente (0.15 para
 * cada lado no topo) e do vale (0.30), o que dá um dente levemente cônico.
 */
function caminhoEngrenagem(
  dentes = 8,
  rInterno = 6.3,
  rExterno = 9.5,
  centro = 12
): string {
  const passo = (Math.PI * 2) / dentes;
  const vertices: string[] = [];

  for (let i = 0; i < dentes; i += 1) {
    const base = i * passo - Math.PI / 2;
    const marcos: [number, number][] = [
      [rInterno, base - passo * 0.3],
      [rExterno, base - passo * 0.15],
      [rExterno, base + passo * 0.15],
      [rInterno, base + passo * 0.3],
    ];

    for (const [raio, angulo] of marcos) {
      const x = (centro + raio * Math.cos(angulo)).toFixed(2);
      const y = (centro + raio * Math.sin(angulo)).toFixed(2);
      vertices.push(`${vertices.length === 0 ? 'M' : 'L'}${x} ${y}`);
    }
  }

  return `${vertices.join(' ')} Z`;
}

const ENGRENAGEM = caminhoEngrenagem();

export type NomeIcone =
  // Carteira — barra de ações e faixa do cartão
  | 'pix'
  | 'escanear'
  | 'qrCode'
  | 'cartao'
  | 'olho'
  // Carteira — "Serviços gerais" e histórico
  | 'boleto'
  | 'transferencia'
  | 'celular'
  | 'presente'
  | 'recibo'
  // Perfil e configurações
  | 'engrenagem'
  | 'usuario'
  | 'telefone'
  | 'envelope'
  | 'local'
  | 'cadeado'
  | 'documento'
  | 'dispositivo'
  // Ações destrutivas
  | 'lixeira'
  // Barra inferior do mapa
  | 'balao'
  | 'filtros';

/**
 * O desenho de cada ícone. Só as formas — cor e espessura vêm do `<G>` em
 * `Icone`, para o mesmo desenho servir em cima do amarelo, do branco e do
 * preto sem duplicação.
 */
const DESENHOS: Record<NomeIcone, React.ReactNode> = {
  /**
   * Marca do Pix: quatro setas em volta de um losango. O que a identifica são
   * as **frestas** nos meios das arestas — sem elas vira um losango comum, por
   * isso cada seta para antes de encostar na vizinha.
   */
  pix: (
    <>
      <Path d="M9.4 7.4 12 4.8l2.6 2.6" />
      <Path d="M16.6 9.4 19.2 12l-2.6 2.6" />
      <Path d="M14.6 16.6 12 19.2l-2.6-2.6" />
      <Path d="M7.4 14.6 4.8 12l2.6-2.6" />
    </>
  ),

  /** Escanear boleto: os quatro cantos da mira, com o código de barras dentro. */
  escanear: (
    <>
      <Path d="M4 8.6V6.2a2.2 2.2 0 0 1 2.2-2.2h2.4" />
      <Path d="M15.4 4h2.4A2.2 2.2 0 0 1 20 6.2v2.4" />
      <Path d="M20 15.4v2.4a2.2 2.2 0 0 1-2.2 2.2h-2.4" />
      <Path d="M8.6 20H6.2A2.2 2.2 0 0 1 4 17.8v-2.4" />
      <Path d="M8.7 9.2v5.6M12 9.2v5.6M15.3 9.2v5.6" />
    </>
  ),

  /** Receber Pix: QR code — três âncoras e o miolo em L. */
  qrCode: (
    <>
      <Rect x="4.2" y="4.2" width="5.6" height="5.6" rx="1.2" />
      <Rect x="14.2" y="4.2" width="5.6" height="5.6" rx="1.2" />
      <Rect x="4.2" y="14.2" width="5.6" height="5.6" rx="1.2" />
      <Path d="M14.2 14.2h2.6v2.6" />
      <Path d="M19.8 16.6v3.2h-3.2" />
    </>
  ),

  /** Adicionar cartão: cartão com tarja e o começo do número. */
  cartao: (
    <>
      <Rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.6" />
      <Path d="M2.8 9.8h18.4" />
      <Path d="M6.4 14.6h3.8" />
    </>
  ),

  /**
   * Esconder saldo. Substitui o `border-radius: 999px / 60%` do protótipo — um
   * raio elíptico que o React Native não tem e que virara uma pill achatada.
   */
  olho: (
    <>
      <Path d="M2.5 12S6.3 5.8 12 5.8 21.5 12 21.5 12 17.7 18.2 12 18.2 2.5 12 2.5 12z" />
      <Circle cx="12" cy="12" r="2.7" />
    </>
  ),

  /** Pagar boleto: código de barras no corpo da ficha. */
  boleto: (
    <>
      <Rect x="2.8" y="5.6" width="18.4" height="12.8" rx="2.4" />
      <Path d="M6.6 9v6M9.6 9v6M12.6 9v6M15.4 9v6M18 9v6" />
    </>
  ),

  /** Transferências: as duas setas trocando de sentido. */
  transferencia: (
    <>
      <Path d="M4 9.4h13.6" />
      <Path d="M14.6 6.4 17.6 9.4l-3 3" />
      <Path d="M20 15.4H6.4" />
      <Path d="M9.4 12.4l-3 3 3 3" />
    </>
  ),

  /** Recarregar celular: o raio dentro da tela é o "recarregar". */
  celular: (
    <>
      <Rect x="6.6" y="2.8" width="10.8" height="18.4" rx="2.6" />
      <Path d="M10.6 5.6h2.8" />
      <Path d="M13 8.4 10.4 13h3.2L11.2 17.6" />
    </>
  ),

  /** Gift Card: caixa com laço. */
  presente: (
    <>
      <Rect x="3" y="8.6" width="18" height="3.8" rx="1.2" />
      <Path d="M4.8 12.4v6.6a1.8 1.8 0 0 0 1.8 1.8h10.8a1.8 1.8 0 0 0 1.8-1.8v-6.6" />
      <Path d="M12 8.6v12.2" />
      <Path d="M12 8.6C9.5 8.6 8 7.5 8 6.3c0-1.6 2.6-1.2 4 2.3z" />
      <Path d="M12 8.6c2.5 0 4-1.1 4-2.3 0-1.6-2.6-1.2-4 2.3z" />
    </>
  ),

  /** Histórico de transações: o recibo com a borda serrilhada. */
  recibo: (
    <>
      <Path d="M6.4 3.6h11.2v16.8l-2.8-1.6-2.8 1.6-2.8-1.6-2.8 1.6z" />
      <Path d="M9.2 8.4h5.6M9.2 12h5.6" />
    </>
  ),

  engrenagem: (
    <>
      <Path d={ENGRENAGEM} />
      <Circle cx="12" cy="12" r="3.2" />
    </>
  ),

  usuario: (
    <>
      <Circle cx="12" cy="8.4" r="3.8" />
      <Path d="M4.8 20.4a7.4 7.4 0 0 1 14.4 0" />
    </>
  ),

  telefone: (
    <Path d="M8.4 3.6H6.2a2 2 0 0 0-2 2.1C4.2 13.4 10.6 19.8 18.3 19.8a2 2 0 0 0 2.1-2v-2.2l-4.3-1.4-1.6 2a13.4 13.4 0 0 1-4.7-4.7l2-1.6z" />
  ),

  envelope: (
    <>
      <Rect x="2.8" y="5" width="18.4" height="14" rx="2.4" />
      <Path d="M3.6 7 12 13.2 20.4 7" />
    </>
  ),

  local: (
    <>
      <Path d="M12 21.2s7-5.7 7-11.2a7 7 0 1 0-14 0c0 5.5 7 11.2 7 11.2z" />
      <Circle cx="12" cy="10" r="2.6" />
    </>
  ),

  cadeado: (
    <>
      <Rect x="4.6" y="10.4" width="14.8" height="10.2" rx="2.4" />
      <Path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" />
      <Path d="M12 14.6v2.4" />
    </>
  ),

  documento: (
    <>
      <Path d="M13.6 3.4H7.4a2 2 0 0 0-2 2v13.2a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2V8.4z" />
      <Path d="M13.6 3.4v5h5" />
      <Path d="M9 13.2h6M9 16.6h4" />
    </>
  ),

  /** Gestão de dispositivo: dois aparelhos, que é o que a linha administra. */
  dispositivo: (
    <>
      <Rect x="2.8" y="5.6" width="12" height="10.4" rx="2" />
      <Path d="M6.4 19.4h4.8" />
      <Path d="M8.8 16v3.4" />
      <Rect x="16.6" y="9.2" width="4.6" height="10.2" rx="1.6" />
    </>
  ),

  /** Excluir: tampa, alça e corpo com as duas ranhuras. */
  lixeira: (
    <>
      <Path d="M4 6.4h16" />
      <Path d="M9.6 6.4V4.8a1.6 1.6 0 0 1 1.6-1.6h1.6a1.6 1.6 0 0 1 1.6 1.6v1.6" />
      <Path d="M6.4 6.4l.9 12.4a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.9-12.4" />
      <Path d="M10.4 10.4v6M13.6 10.4v6" />
    </>
  ),

  /**
   * Balão de conversa da barra inferior do mapa (canto direito).
   *
   * O corpo é um retângulo de cantos bem arredondados e a "rabicho" sai do
   * canto inferior esquerdo, apontando para baixo — é a forma do app real. Um
   * traço só, fechado, para o `strokeLinejoin` costurar a junção do rabicho
   * com o corpo sem deixar bico.
   */
  balao: (
    <Path d="M20 13.6a3.2 3.2 0 0 1-3.2 3.2H9.2L5.2 20v-3.2H5.2A3.2 3.2 0 0 1 4 13.6V7.2A3.2 3.2 0 0 1 7.2 4h9.6A3.2 3.2 0 0 1 20 7.2z" />
  ),

  /**
   * Controles deslizantes ("preferências de solicitações"), canto esquerdo.
   *
   * O protótipo usava três traços de larguras diferentes; o app real desenha
   * três trilhos do mesmo comprimento com um botão em posições distintas, que
   * é o que faz o ícone ler como "ajustes" e não como "menu".
   */
  filtros: (
    <>
      <Path d="M4 7.5h16M4 12h16M4 16.5h16" />
      <Path d="M9 5.9v3.2M15.5 10.4v3.2M7.5 14.9v3.2" />
    </>
  ),
};

export type IconeProps = {
  nome: NomeIcone;
  /** Lado do quadrado do ícone. Padrão 20. */
  tamanho?: number;
  /** Padrão `neutro900`. */
  cor?: string;
  /**
   * Espessura do traço, em unidades do `viewBox` 24×24 — ou seja, ela **não**
   * é em pixels e não engorda quando o ícone cresce, que é justamente o que
   * mantém a família consistente entre tamanhos.
   */
  traco?: number;
};

export function Icone({
  nome,
  tamanho = 20,
  cor = cores.neutro900,
  traco = 1.7,
}: IconeProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      <G
        stroke={cor}
        strokeWidth={traco}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {DESENHOS[nome]}
      </G>
    </Svg>
  );
}
