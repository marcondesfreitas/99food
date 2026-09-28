/**
 * B25 — Rotas nomeadas e as regras de "para onde volta".
 *
 * Existe por dois motivos:
 *
 * 1. **Um lugar só para os caminhos.** Antes deste bloco, cada tela escrevia
 *    `router.push('/(motorista)/pix')` na mão. Renomear um arquivo de rota
 *    quebraria strings espalhadas por 14 telas sem o TypeScript reclamar.
 *
 * 2. **As regras especiais de `voltarPush`.** O protótipo NÃO tem pilha de
 *    navegação: `push(tela)` só troca `state.tela`, e `voltarPush()`
 *    (`.design-import/logic.js` linhas 279-286) tem uma tabela fixa de "de
 *    onde eu estou, para onde eu volto" — um chute de qual foi a tela
 *    anterior, já que não existe histórico para consultar:
 *
 *    ```js
 *    if (t === 'prefservicos') return this.push('prefsolic');
 *    if (t === 'carteira' || t === 'pix') return this.push('central');
 *    if (t === 'config') return this.push('perfil');
 *    if (t === 'teste') return this.push('prefsolic');
 *    this.setState({ tela: 'mapa', ... });
 *    ```
 *
 * `router.dismissTo(destino)` é a primitiva exata para reproduzir isso com uma
 * pilha de verdade: desempilha até chegar no destino e, se ele **não** estiver
 * na pilha, substitui a tela atual por ele. Ou seja, o resultado visível é o
 * mesmo do protótipo por qualquer caminho de entrada — inclusive os que a
 * tabela do protótipo não previa (ex.: abrir `teste` pelo FAB do mapa, não
 * pelo menu de Preferências).
 *
 * ## Uma divergência registrada em relação ao `.dc.html`
 *
 * O `‹` de cada tela no protótipo chama um handler explícito (`voltarMapa`,
 * `irCentral`, `irPerfil`…), e não `voltarPush` — a exceção é o Teste de
 * status (linha 573), o único que chama `voltarPush` diretamente. Em nove das
 * dez telas os dois caminhos concordam. **Em uma não**:
 *
 * | Tela  | `‹` no `.dc.html`        | `voltarPush()` (gesto) | Aqui      |
 * |-------|--------------------------|------------------------|-----------|
 * | `pix` | `irCarteira` (linha 825) | `central`              | `central` |
 *
 * Seguimos `voltarPush`, porque o critério de aceite de
 * `contextos/B25-navegacao.md` é explícito ("de `carteira`/`pix` vai para
 * `central`"). E a pilha é montada para o gesto nativo concordar com o botão:
 * a Carteira navega para o Pix com `replace`, não `push` (ver `irPix` abaixo),
 * então a pilha fica `[mapa, central, pix]` e desempilhar uma vez já cai na
 * Central.
 *
 * ## Onde gesto e botão ainda podem discordar
 *
 * `teste` é alcançável por dois caminhos: o menu de `prefsolic` e o FAB do
 * mapa. `voltarPush` manda para `prefsolic` nos dois casos — mas pelo FAB a
 * pilha é `[mapa, teste]`, então o gesto nativo de borda desempilha para o
 * mapa enquanto o `‹` vai para `prefsolic`. É o preço de usar a pilha nativa
 * em vez de reimplementar o gesto do protótipo à mão.
 */

import { router } from 'expo-router';

/**
 * Caminhos de todas as rotas do app.
 *
 * O grupo `(motorista)` aparece no caminho de propósito: é assim que o Expo
 * Router referencia uma rota dentro de um grupo quando existe mais de um
 * layout aninhado.
 */
export const ROTAS = {
  /**
   * Portão de ativação por token. Fica FORA do grupo `(motorista)` de
   * propósito: é anterior ao app, não tem o layout de pilha das telas do
   * motorista e nunca deve aparecer no histórico de voltar.
   */
  ativacao: '/ativacao',
  /** B11 — tela base do grupo; é sempre o fundo da pilha. */
  mapa: '/(motorista)/mapa',
  /** B12 — cheia, entra por `replace` (nunca fica na pilha de voltar). */
  facial: '/(motorista)/verificacao-facial',
  /** B13 — cheia, entra por `replace` (não se volta para a corrida encerrada). */
  resumo: '/(motorista)/resumo',

  // As dez telas "empurradas" (`PUSH_TELAS`, logic.js linha 58).
  prefsolic: '/(motorista)/prefsolic',
  prefservicos: '/(motorista)/prefservicos',
  teste: '/(motorista)/teste',
  central: '/(motorista)/central',
  carteira: '/(motorista)/carteira',
  pix: '/(motorista)/pix',
  perfil: '/(motorista)/perfil',
  config: '/(motorista)/config',
  conta: '/(motorista)/conta',
  veiculos: '/(motorista)/veiculos',
} as const;

/**
 * Qualquer um dos caminhos de `ROTAS`, preservando o literal.
 *
 * Sem isto, uma tabela tipada como `Record<…, string>` alargaria os valores
 * para `string` e o `Href` do Expo Router recusaria — daí o `as const` acima.
 */
export type Rota = (typeof ROTAS)[keyof typeof ROTAS];

/** As dez telas de `PUSH_TELAS` (logic.js linha 58). */
export type TelaPush =
  | 'prefsolic'
  | 'prefservicos'
  | 'teste'
  | 'central'
  | 'carteira'
  | 'pix'
  | 'perfil'
  | 'config'
  | 'conta'
  | 'veiculos';

/**
 * `voltarPush()` — logic.js linhas 279-286, transcrito como tabela.
 *
 * As quatro primeiras linhas são os `if`s explícitos do protótipo; as demais
 * são o `default` (`tela: 'mapa'`).
 */
const DESTINO_VOLTAR: Record<TelaPush, Rota> = {
  prefservicos: ROTAS.prefsolic,
  teste: ROTAS.prefsolic,
  carteira: ROTAS.central,
  pix: ROTAS.central,
  config: ROTAS.perfil,

  prefsolic: ROTAS.mapa,
  central: ROTAS.mapa,
  perfil: ROTAS.mapa,
  conta: ROTAS.mapa,
  veiculos: ROTAS.mapa,
};

/**
 * O `‹` de uma tela empurrada. Use sempre isto, nunca `router.back()`: só a
 * tabela acima reproduz as regras do protótipo, e `back()` cru daria a tela
 * anterior genérica do histórico — o que o critério de aceite de B25 proíbe
 * explicitamente para `prefservicos`, `carteira`, `pix`, `config` e `teste`.
 */
export function voltarDe(tela: TelaPush): void {
  router.dismissTo(DESTINO_VOLTAR[tela]);
}

/** `irPrefSolic` — logic.js linha 633 (barra inferior do mapa). */
export function irPrefSolic(): void {
  router.push(ROTAS.prefsolic);
}

/** `irPrefServicos` — logic.js linha 633 (a partir de `prefsolic`). */
export function irPrefServicos(): void {
  router.push(ROTAS.prefservicos);
}

/** `irTeste` — logic.js linha 630 (FAB do mapa e menu de `prefsolic`). */
export function irTeste(): void {
  router.push(ROTAS.teste);
}

/** `irCentral` — logic.js linha 630 (pill de ganhos, barra inferior, drawer). */
export function irCentral(): void {
  router.push(ROTAS.central);
}

/** `irCarteira` — logic.js linha 630 (linha "Conta 99" da Central). */
export function irCarteira(): void {
  router.push(ROTAS.carteira);
}

/**
 * `irPix` — logic.js linha 631 (ação "Pix" da Carteira).
 *
 * `replace`, e não `push`, para que a pilha fique `[mapa, central, pix]`: assim
 * tanto o `‹` quanto o gesto nativo de borda caem na Central, que é a regra de
 * `voltarPush` (logic.js linha 282). Com `push` a pilha teria a Carteira no
 * meio e o gesto discordaria do botão.
 */
export function irPix(): void {
  router.replace(ROTAS.pix);
}

/**
 * Volta do Pix para a Carteira depois de enviar — `enviarPix` faz
 * `push('carteira')` no protótipo (logic.js linha 620).
 *
 * `replace` pelo mesmo motivo de `irPix`: mantém a pilha `[mapa, central,
 * carteira]`, de onde voltar cai na Central.
 */
export function irCarteiraAposPix(): void {
  router.replace(ROTAS.carteira);
}

/** `irPerfil` — logic.js linha 631 (avatar do drawer). */
export function irPerfil(): void {
  router.push(ROTAS.perfil);
}

/** `irConfig` — logic.js linha 631 (engrenagem do Perfil). */
export function irConfig(): void {
  router.push(ROTAS.config);
}

/** `irConta` — logic.js linha 632 (item "Horas Dirigidas" do drawer). */
export function irConta(): void {
  router.push(ROTAS.conta);
}

/** `irVeiculos` — logic.js linha 632 (item "Veículos" do drawer). */
export function irVeiculos(): void {
  router.push(ROTAS.veiculos);
}

/**
 * `voltarMapa` — logic.js linha 634: volta ao mapa de qualquer lugar,
 * esvaziando a pilha. Usado pelo `✕` da tela de Configurações e pelo CTA do
 * Teste de status.
 */
export function voltarMapa(): void {
  router.dismissTo(ROTAS.mapa);
}
