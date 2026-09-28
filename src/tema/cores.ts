/**
 * Tokens de cor do app — única fonte de verdade.
 *
 * Fonte: DESIGN_SYSTEM.md §2.1–2.3 + `.design-import/RotaFacil Motorista v6.dc.html`
 * (inline styles). Onde os dois divergem, o `.dc.html` v6 vence — é o protótipo
 * mais recente. Ver notas abaixo.
 *
 * Nenhum componente deve ter cor hexadecimal hardcoded fora deste arquivo.
 */

export const cores = {
  // ---- Marca -------------------------------------------------------------
  /**
   * DESIGN_SYSTEM.md §2.1 registra `#FBE300` (medido do vídeo v1). O
   * protótipo v6 (`.dc.html`) usa `#F8D60B` — este é o valor de implementação.
   * `#FBE300` é histórico/depreciado (ver DESIGN_SYSTEM.md §9.2).
   */
  amarelo500: '#F8D60B',
  amarelo600: '#E0C009', // pressionado
  amarelo300: '#FDEF7A',
  amarelo100: '#FEF8CC',

  /**
   * Valor "de catálogo" do roxo de marca. No `.dc.html` v6 a pill de ganhos
   * não usa este tom — usa `sheetFundo` (#26292E). Mantido aqui para texto
   * forte / outros usos que ainda referenciam o roxo original.
   */
  roxo900: '#241B37',

  rosa500: '#E31C5F',

  // ---- Semânticas ----------------------------------------------------------
  sucesso500: '#24D279',
  alerta500: '#E8833A',
  alerta700: '#754219',
  alerta300: '#F5C542',
  erro500: '#EB312B',
  info500: '#4A90D9',
  info700: '#2F6FB5',

  /**
   * `azul/oval` — contorno do oval e arco de progresso do reconhecimento
   * facial (DESIGN_SYSTEM.md §9.2 `azul/facial` e §11 `azul/oval`;
   * `corOval` em `.design-import/logic.js` linha 540).
   *
   * NÃO é o `info500`: o azul do v1 (`#4A90D9`) continua valendo para o
   * spinner de "verificando" (`.dc.html` linha 443), o marcador do motorista e
   * o FAB de recentrar. A v2 trocou só o anel do facial por um azul mais
   * saturado, e a precedência do DESIGN_SYSTEM (§13: v6 > … > v1) manda a v2
   * ganhar. Trocar um pelo outro é o erro fácil aqui — são dois azuis
   * vizinhos com donos diferentes.
   */
  azulOval: '#2445A6',

  /**
   * `verde/700` e `verde/300` — fundo e texto do chip "Prioritário" do card de
   * oferta (DESIGN_SYSTEM.md §9.2, linhas 450-451; `.dc.html` linha 242).
   *
   * São dois tons próprios, e não `sucesso500` com opacidade: o chip precisa
   * ficar legível sobre o preto do bottom sheet, e um verde translúcido sobre
   * fundo escuro escurece em vez de destacar.
   */
  verde700: '#176C4B',
  verde300: '#65D3A6',
  /** Selo "tarifa dinâmica" no card de oferta e no resumo. */
  corDinamico: '#F4C372',

  // ---- Neutros -------------------------------------------------------------
  neutro0: '#FFFFFF',
  neutro50: '#F9F7FA',
  neutro100: '#EFEDF1',
  neutro200: '#DCDAE0',
  neutro400: '#9D9CA1',
  neutro600: '#5D5B61',
  neutro900: '#1C1A1F',

  /**
   * Fundo do bottom sheet de oferta/corrida no v6 — mais claro que o
   * `#1A181B` do v1. Também é o tom usado pela pill de ganhos no v6.
   */
  sheetFundo: '#26292E',
  sheetTrilho: '#353A48',
  sheetTexto2: '#A09EA1',

  // ---- Overlays --------------------------------------------------------------
  /** Fundo escurecido atrás do drawer lateral (B24). */
  overlayDrawer: 'rgba(0,0,0,0.35)',
  /** Fundo escurecido da tela de verificação facial, ao redor do recorte
   * oval (B09) — `.dc.html`, bloco `telaFacial`. */
  overlayFacial: 'rgba(18,20,24,0.72)',

  // ---- Tokens da v7 — DESIGN_SYSTEM.md §11.2 ("Tokens novos") -------------
  // Cores que só aparecem em telas específicas e não estavam na paleta base
  // §2. Consumidas pelas telas da Onda 3 (splash, carteira, teste de status,
  // preferências, Pix e formulários).

  /** Base do gradiente do splash — âmbar, mais quente que `amarelo500`. */
  amareloSplash: '#F4AD09',
  /** Topo do gradiente do splash. */
  amareloSplashTopo: '#F4BA10',
  /** Fundo do bloco superior da Conta 99 (carteira). */
  amareloCarteira: '#F5DA0A',
  /** Faixa escura "Adicionar cartão / Desconto" da carteira. */
  azulCarteira: '#1E202F',
  /**
   * Anel de resultado do Teste de status. Note que é um verde diferente do
   * `sucesso500` — o protótipo usa este tom só no anel.
   */
  verdeAnel: '#1EC376',
  /** Badge "Até 12X". */
  verdeBadge: '#51CD95',
  /** Ícone de atenção do card "Ativar mais categorias". */
  laranjaAlerta: '#E55F1F',
  /** Fundo do aviso regulatório do Banco Central (tela Pix). */
  amareloAviso: '#F6EF9E',
  /** Faixa de cabeçalho de seção ("INFORMAÇÕES PESSOAIS"). */
  neutroSecao: '#EFEFF1',
  /** Fundo de input e de aba inativa. */
  neutroCampo: '#F5F5F7',

  // Nota: `#131215` (fundo do canvas do Claude Design, fora do frame do
  // celular) NÃO é portado — não faz parte do app, é só do protótipo.

  // ---- B13 ----------------------------------------------------------------
  // Tons "escuros" da família dinâmica, para uso sobre fundo claro. O
  // `corDinamico` (#F4C372) foi calibrado contra o sheet escuro (#26292E) e
  // não tem contraste suficiente no branco da tela de Resumo.

  /**
   * Valor da linha "Tarifa dinâmica" na tela de Resumo, sobre branco.
   * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaResumo`.
   */
  dinamicoTexto: '#C98A25',
  /** Texto da pill de faixa ("1,4X–1,8X") sobre `amarelo100`, mesmo bloco. */
  dinamicoFaixaTexto: '#7A6A00',

  // ---- B11b ----------------------------------------------------------------

  /**
   * `vermelho/cta` — DESIGN_SYSTEM.md §11.2 (tabela de tokens da v6):
   * "Botão 'Quero indicar' no banner". Único vermelho de CTA do app; não
   * confundir com `erro500` (bolinha de novidade) nem com `rosa500`
   * (ação destrutiva "Cancelar").
   * Protótipo: `.design-import/RotaFacil Motorista v6.dc.html` linha ~186.
   */
  vermelhoCta: '#E22808',

  // ---- B17 ----------------------------------------------------------------

  /**
   * Ícone circular da linha "Conta 99" na Central de Ganhos (`▮` branco sobre
   * laranja). Protótipo: `.design-import/RotaFacil Motorista v6.dc.html`
   * linha ~701.
   *
   * É o mesmo valor de `coresMapa.pinDestino`, mas está duplicado aqui de
   * propósito: `coresMapa` é paleta cartográfica e, por contrato do bloco
   * B01, nenhum componente de interface deve consumi-la.
   */
  laranjaConta: '#EE542C',

  /**
   * Trilho da barra "base × dinâmico" dentro do card amarelo de "Ganhos do
   * dia" — preto a 12%, que escurece o `amarelo500` sem virar um cinza
   * chapado. Protótipo: mesmo bloco, `rgba(0,0,0,.12)`.
   */
  trilhoSobreAmarelo: 'rgba(0,0,0,0.12)',

  // ---- B22 ----------------------------------------------------------------

  /**
   * Fundo escurecido atrás da folha de opções da foto de perfil
   * (`sheetFoto` — `.design-import/RotaFacil Motorista v6.dc.html` linha 1067:
   * `rgba(0,0,0,.4)`). É mais opaco que o `overlayDrawer` (0.35) do menu
   * lateral, então não dá para reaproveitar aquele token.
   */
  overlayFolhaFoto: 'rgba(0,0,0,0.4)',

  // ---- B23 ----------------------------------------------------------------

  /**
   * Fundo do chip "Aprovado" do `CardVeiculo` — `sucesso/100` da
   * DESIGN_SYSTEM.md §11.6, o único verde claro da paleta. O texto do chip
   * continua sendo `sucesso500`.
   * Protótipo: `.design-import/RotaFacil Motorista v6.dc.html` linha ~1018.
   */
  sucesso100: '#E6F9EC',

  /**
   * Fundo escurecido do modal "Adicionar veículo" — `rgba(0,0,0,.4)` no
   * protótipo (linha ~1044). É mais escuro que o `overlayDrawer` (.35) de
   * propósito: o drawer deixa a tela de baixo legível, o modal não.
   */
  overlayModal: 'rgba(0,0,0,0.40)',

  /**
   * Faixas do "placeholder de foto" do veículo — o
   * `repeating-linear-gradient(135deg, #F0EEF2 0 6px, #E4E1E8 6px 12px)` do
   * thumbnail de 64×52 (linha ~1024). São dois tons próprios: `neutro100`
   * (#EFEDF1) e `neutro200` (#DCDAE0) não dão o mesmo contraste sutil entre
   * as listras.
   */
  veiculoArteFaixaClara: '#F0EEF2',
  veiculoArteFaixaEscura: '#E4E1E8',
} as const;

export type TokenCor = keyof typeof cores;

/**
 * Cores decorativas do "mapa falso" (quadras, áreas verdes, água, rótulos de
 * rua). Vêm dos `<div>`s absolutos do protótipo (`QUADRAS`/`ROTULOS` em
 * `.design-import/logic.js` linhas 103-120) e ficam separadas de `cores`
 * porque são paleta cartográfica, não tokens de UI — nenhum componente de
 * interface deve usá-las.
 *
 * Moram aqui (e não em `src/servicos/mapaFalso.ts`) para manter a regra do
 * bloco B01: nenhum hexadecimal fora deste arquivo.
 */
export const coresMapa = {
  /** Área verde / parque. */
  verde: '#CDE3C4',
  /** Represa / água. */
  agua: '#BFDDEA',
  /** Quadra genérica de edificação. */
  quadra: '#E1DDD5',
  /** Rótulo de rua/avenida. */
  rotuloRua: '#8d8a84',
  /** Rótulo sobre área verde. */
  rotuloVerde: '#7e9a76',
  /** Rótulo sobre água. */
  rotuloAgua: '#6f92a1',

  // ---- Base do mapa (B06) ---------------------------------------------------
  /** Fundo geral do mapa, atrás das ruas. */
  fundo: '#ECE8E1',
  /** Asfalto das ruas da grade (VERT/HORIZ). */
  rua: '#FFFFFF',
  /** Avenida diagonal (Av. Radial Leste), mais clara que as demais. */
  avenidaDiagonal: '#FDF6E3',

  // ---- Rota e pins (B06) ----------------------------------------------------
  /** Traço verde do trecho restante do trajeto. */
  rotaVerde: '#3ED97F',
  /** Pin de origem/embarque. */
  pinOrigem: '#24D279',
  /** Pin de destino/desembarque. */
  pinDestino: '#EE542C',

  // ---- Zonas de demanda (B07) ----------------------------------------------
  /**
   * Hexágono de zona quente (multiplicador < 2.2x) — logic.js linha ~426.
   *
   * Tom escurecido em relação ao protótipo (`#EF7D76`) porque a base do mapa
   * agora é escura: o salmão original, a 55% de opacidade sobre preto, virava
   * um borrão rosa fluorescente que competia com a rota e com os pins. Este
   * tom devolve o vermelho-tijolo translúcido da referência.
   */
  hexQuente: '#8C3A33',
  /** Hexágono de zona muito quente (multiplicador >= 2.2x). */
  hexMuitoQuente: '#A33E33',
} as const;

/**
 * Superfícies do tema ESCURO da tela de mapa.
 *
 * A referência do app real mostra o mapa em modo escuro: cartografia quase
 * preta, folha inferior grafite e os botões redondos em cinza-chumbo com
 * ícone branco. Os tokens claros de `cores` continuam valendo para todas as
 * outras telas (perfil, carteira, ajustes) — nada aqui vaza para elas.
 */
export const coresMapaEscuro = {
  /**
   * Base atrás dos tiles: é o que se vê enquanto eles carregam. Casado com o
   * cinza do Dark Gray Canvas da Esri, para a chegada dos tiles não piscar.
   */
  fundo: '#2E2E2E',
  /** Folha inferior (banner + linha de botões) e demais painéis sobre o mapa. */
  superficie: '#1C1E21',
  /** Botões redondos: FABs, hambúrguer e os dois laterais da barra. */
  botao: '#2C2F33',
  /** Ícone/traço desenhado dentro de `botao`. */
  iconeSobreBotao: '#FFFFFF',
  /** Alça de arraste no topo da folha inferior. */
  alca: '#55585D',
} as const;
