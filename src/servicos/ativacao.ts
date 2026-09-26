/**
 * Ativação por token — o portão de entrada do app.
 *
 * Guarda no dispositivo se o app já foi liberado e por qual token. Quem
 * consome: `app/index.tsx` (decide entre a tela de ativação e o mapa) e
 * `app/ativacao.tsx` (a tela em si).
 *
 * ## Sem servidor, e o que isso implica
 *
 * O app é estático (export web na Vercel; nenhum backend). Então **toda** a
 * verificação acontece aqui, no aparelho, contra o catálogo de
 * {@link CATALOGO_TOKENS} (em `@/dados/tokensAtivacao`) — que vai no bundle e,
 * portanto, é legível por quem abrir o código-fonte da página. Isso serve
 * como porta de entrada de demonstração/distribuição controlada, não como
 * segurança: qualquer controle real (token emitido por servidor, revogação
 * imediata em todo aparelho já ativado, uso único cruzando aparelhos) exige
 * um endpoint que valide.
 *
 * O que **é** aplicado de verdade dentro dessa limitação:
 *
 * - **Validade por token**: cada código no catálogo carrega seu próprio
 *   `diasValidade`, contado a partir da ativação NESTE aparelho — não da
 *   emissão do token, já que não há servidor para saber quando cada um
 *   nasceu.
 * - **Uso único por aparelho**: um token com `usoUnico: true` fica registrado
 *   como consumido (`CHAVE_TOKENS_USADOS`) assim que ativa um aparelho, e não
 *   ativa de novo o mesmo aparelho depois de um reset. O que isto NÃO cobre —
 *   e não há como cobrir sem servidor — é o mesmo código sendo usado em *outro*
 *   aparelho: cada aparelho só enxerga o próprio registro de uso.
 * - **Revogação por remoção do catálogo**: tirar um código de
 *   {@link CATALOGO_TOKENS} faz `ativacaoEstaValida` rejeitá-lo na próxima
 *   checagem, mesmo em aparelhos já ativados — não é preciso esperar o prazo
 *   de validade vencer.
 *
 * ## Armazenamento
 *
 * Duas chaves no AsyncStorage, com ciclos de vida diferentes:
 *
 * - `CHAVE_ATIVACAO` — a ativação corrente do aparelho (`{ token, ativadoEm }`).
 *   Separada de `CHAVE_MOTORISTA` (`armazenamento.ts`, dados de domínio do
 *   motorista): misturar as duas faria um `limpar` de uma derrubar a outra.
 * - `CHAVE_TOKENS_USADOS` — quais códigos de uso único este aparelho já
 *   consumiu. Sobrevive a `limparAtivacao()` de propósito: se não sobrevivesse,
 *   sair e reativar com o mesmo código reabriria a cota dele, o que
 *   contradiz "uso único". Só `resetarParaTeste()` apaga as duas.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { CATALOGO_TOKENS, type TokenCatalogo } from '@/dados/tokensAtivacao';

/**
 * Quando `true`, **qualquer** texto digitado libera o app; só o campo vazio é
 * recusado. Não passa pelo catálogo, então também não expira nem controla uso
 * único — é um interruptor de emergência para desenvolvimento local, não algo
 * para deixar ligado em build distribuído.
 *
 * Está `false`: o app volta a exigir um token de {@link CATALOGO_TOKENS}.
 */
export const ACEITA_QUALQUER_TOKEN = false;

/**
 * Validade usada só para o texto da tela de ativação (`app/ativacao.tsx`),
 * que precisa de um único número para uma frase genérica antes de o usuário
 * digitar nada. A validade que de fato vale por token é
 * `TokenCatalogo.diasValidade` — ver {@link ativacaoEstaValida}.
 */
export const DIAS_VALIDADE_PADRAO = 7;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

const CHAVE_ATIVACAO = '99motorista:ativacao';
const CHAVE_TOKENS_USADOS = '99motorista:tokensUsados';

export type Ativacao = {
  /** Token normalizado que liberou o app. */
  token: string;
  /** `Date.now()` do momento da ativação. */
  ativadoEm: number;
};

/**
 * "  99motorista  " → "99MOTORISTA".
 *
 * Maiúsculas e sem espaço nenhum: quem digita num teclado de celular erra
 * caixa e cola espaço no fim o tempo todo, e recusar por isso seria um
 * obstáculo sem propósito.
 */
export function normalizarToken(token: string): string {
  return token.replace(/\s+/g, '').toUpperCase();
}

/** Config do token no catálogo, ou `undefined` se ele nunca existiu ou foi revogado. */
function buscarNoCatalogo(normalizado: string): TokenCatalogo | undefined {
  return CATALOGO_TOKENS.find((t) => t.codigo === normalizado);
}

// ---------------------------------------------------------------------------
// Registro de uso único (por aparelho)
// ---------------------------------------------------------------------------

/** Mapa `código → quando foi consumido`, gravado em `CHAVE_TOKENS_USADOS`. */
async function lerTokensUsados(): Promise<Record<string, number>> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_TOKENS_USADOS);
    if (!bruto) return {};
    const dado: unknown = JSON.parse(bruto);
    if (typeof dado !== 'object' || dado === null) return {};
    return dado as Record<string, number>;
  } catch {
    return {};
  }
}

async function marcarComoUsado(normalizado: string): Promise<void> {
  try {
    const usados = await lerTokensUsados();
    usados[normalizado] = Date.now();
    await AsyncStorage.setItem(CHAVE_TOKENS_USADOS, JSON.stringify(usados));
  } catch {
    // Se não gravar o registro de uso, o pior caso é o token continuar
    // "gastável" — inconveniente, não uma falha que trava o usuário.
  }
}

/** Este aparelho já consumiu este token (de uso único) alguma vez? */
export async function tokenJaFoiUsadoNesteAparelho(
  token: string
): Promise<boolean> {
  const normalizado = normalizarToken(token);
  const usados = await lerTokensUsados();
  return Object.prototype.hasOwnProperty.call(usados, normalizado);
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

/**
 * O token pode ativar um aparelho agora?
 *
 * Distinto de {@link ativacaoEstaValida}: esta função decide se um código
 * digitado *agora* é aceito (existe no catálogo e, sendo de uso único, ainda
 * não foi consumido por este aparelho). A outra decide se uma ativação já
 * gravada *continua* valendo ao reabrir o app — nessa segunda checagem, o
 * token obviamente já foi "usado" (é assim que o aparelho ficou ativado), e
 * seria errado invalidar por isso.
 */
export async function tokenPodeAtivar(token: string): Promise<boolean> {
  const normalizado = normalizarToken(token);
  if (!normalizado) return false;
  if (ACEITA_QUALQUER_TOKEN) return true;

  const config = buscarNoCatalogo(normalizado);
  if (!config) return false;
  if (config.usoUnico && (await tokenJaFoiUsadoNesteAparelho(normalizado))) {
    return false;
  }
  return true;
}

/**
 * A ativação existe, o token continua no catálogo (não foi revogado) e ainda
 * está dentro da validade **daquele token específico**?
 *
 * Reconferir o catálogo, e não só o prazo, é o que faz uma revogação valer
 * também para quem já estava dentro: aparelhos liberados por um token que
 * saiu de {@link CATALOGO_TOKENS} voltam a pedir ativação no próximo abrir,
 * em vez de manter acesso até o prazo vencer.
 */
export function ativacaoEstaValida(
  ativacao: Ativacao | null,
  agora: number = Date.now()
): boolean {
  if (!ativacao) return false;

  const config = buscarNoCatalogo(ativacao.token);
  if (!config) return false;

  const msValidade = config.diasValidade * MS_POR_DIA;
  // Relógio adiantado e depois corrigido produz `ativadoEm` no futuro; tratar
  // como válida é mais seguro do que trancar quem já ativou.
  if (ativacao.ativadoEm > agora) return true;
  return agora - ativacao.ativadoEm < msValidade;
}

/**
 * Lê a ativação gravada. Devolve `null` quando não há nenhuma, quando o
 * conteúdo está corrompido ou quando o disco recusa a leitura — em todos esses
 * casos o certo é pedir o token de novo, não travar o app.
 */
export async function lerAtivacao(): Promise<Ativacao | null> {
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_ATIVACAO);
    if (!bruto) return null;

    const dado: unknown = JSON.parse(bruto);
    if (
      typeof dado !== 'object' ||
      dado === null ||
      typeof (dado as Ativacao).token !== 'string' ||
      typeof (dado as Ativacao).ativadoEm !== 'number'
    ) {
      return null;
    }
    return dado as Ativacao;
  } catch {
    return null;
  }
}

/** `true` se o app está liberado agora. Atalho de `lerAtivacao` + validade. */
export async function appEstaAtivado(): Promise<boolean> {
  return ativacaoEstaValida(await lerAtivacao());
}

export type ResultadoAtivacao = 'ok' | 'vazio' | 'invalido' | 'jaUsado' | 'falhaAoGravar';

/**
 * Valida o token e, dando certo, grava a ativação.
 *
 * Devolve um resultado em vez de lançar: a tela precisa distinguir "campo
 * vazio" de "token errado" de "token já usado" para escolher a mensagem, e
 * nenhum dos três é excepcional — são o caminho normal de quem digita.
 */
export async function ativarComToken(
  token: string
): Promise<ResultadoAtivacao> {
  const normalizado = normalizarToken(token);
  if (!normalizado) return 'vazio';

  if (!ACEITA_QUALQUER_TOKEN) {
    const config = buscarNoCatalogo(normalizado);
    if (!config) return 'invalido';
    if (config.usoUnico && (await tokenJaFoiUsadoNesteAparelho(normalizado))) {
      return 'jaUsado';
    }
  }

  const ativacao: Ativacao = { token: normalizado, ativadoEm: Date.now() };
  try {
    await AsyncStorage.setItem(CHAVE_ATIVACAO, JSON.stringify(ativacao));
  } catch {
    // Sem gravação não há "abrir direto na próxima vez". Melhor dizer que
    // falhou do que liberar e o app pedir o token de novo no próximo abrir,
    // parecendo que a ativação não valeu.
    return 'falhaAoGravar';
  }

  // Só marca como consumido depois que a gravação da ativação deu certo: se
  // tivesse marcado antes e `setItem` falhasse, o token seria queimado sem
  // nunca ter ativado nada.
  const config = buscarNoCatalogo(normalizado);
  if (config?.usoUnico) {
    await marcarComoUsado(normalizado);
  }

  return 'ok';
}

/**
 * Apaga a ativação — o app volta a pedir token. Útil para suporte ("some com
 * a sessão deste aparelho").
 *
 * Não libera de novo um token de uso único: o registro em
 * `CHAVE_TOKENS_USADOS` não é tocado aqui, de propósito (ver cabeçalho do
 * arquivo). Para isso, {@link resetarParaTeste}.
 */
export async function limparAtivacao(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE_ATIVACAO);
  } catch {
    // Ação de manutenção: se o disco recusar, não há o que fazer.
  }
}

/**
 * Apaga ativação **e** o registro de tokens usados deste aparelho — os
 * tokens de uso único voltam a poder ativar este mesmo aparelho.
 *
 * Só para teste/QA local. Chamar isto num aparelho de motorista real
 * reabriria a cota de um token de uso único que já tinha sido consumido, o
 * que é exatamente o que "uso único" existe para impedir.
 */
export async function resetarParaTeste(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([CHAVE_ATIVACAO, CHAVE_TOKENS_USADOS]);
  } catch {
    // Ação de manutenção: se o disco recusar, não há o que fazer.
  }
}
