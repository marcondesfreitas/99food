/**
 * Ativação por token — código estático.
 *
 * Aceita somente um código fixo.
 * A ativação permanece válida enquanto estiver salva no dispositivo.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
const CODIGO_ATIVACAO = 'MF7K-9X2P-Q4RT';
const CHAVE_ATIVACAO = '99motorista:ativacao';
const CHAVE_TOKENS_USADOS = '99motorista:tokensUsados';
export type Ativacao = {
  token: string;
  ativadoEm: number;
};
export type ResultadoAtivacao =
  | 'ok'
  | 'vazio'
  | 'invalido'
  | 'jaUsado'
  | 'falhaAoGravar';
export function normalizarToken(token: string): string {
  return token.replace(/\s+/g, '').toUpperCase();
}
export async function tokenJaFoiUsadoNesteAparelho(
  token: string
): Promise<boolean> {
  const normalizado = normalizarToken(token);
  try {
    const bruto = await AsyncStorage.getItem(CHAVE_TOKENS_USADOS);
    if (!bruto) return false;
    const usados = JSON.parse(bruto);
    return Object.prototype.hasOwnProperty.call(
      usados,
      normalizado
    );
  } catch {
    return false;
  }
}
export async function tokenPodeAtivar(
  token: string
): Promise<boolean> {
  const normalizado = normalizarToken(token);
  return normalizado === CODIGO_ATIVACAO;
}
export function ativacaoEstaValida(
  ativacao: Ativacao | null,
  agora: number = Date.now()
): boolean {
  if (!ativacao) return false;
  return normalizarToken(ativacao.token) === CODIGO_ATIVACAO;
}
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
    const ativacao = dado as Ativacao;
    if (!ativacaoEstaValida(ativacao)) {
      return null;
    }
    return ativacao;
  } catch {
    return null;
  }
}
export async function appEstaAtivado(): Promise<boolean> {
  return ativacaoEstaValida(await lerAtivacao());
}
export async function ativarComToken(
  token: string
): Promise<ResultadoAtivacao> {
  const normalizado = normalizarToken(token);
  if (!normalizado) return 'vazio';
  if (normalizado !== CODIGO_ATIVACAO) {
    return 'invalido';
  }
  const ativacao: Ativacao = {
    token: normalizado,
    ativadoEm: Date.now(),
  };
  try {
    await AsyncStorage.setItem(
      CHAVE_ATIVACAO,
      JSON.stringify(ativacao)
    );
    return 'ok';
  } catch {
    return 'falhaAoGravar';
  }
}
export async function limparAtivacao(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE_ATIVACAO);
  } catch {
    // Não foi possível remover a ativação.
  }
}
export async function resetarParaTeste(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      CHAVE_ATIVACAO,
      CHAVE_TOKENS_USADOS,
    ]);
  } catch {
    // Não foi possível limpar os dados de teste.
  }
}
export const DIAS_VALIDADE_PADRAO = 7;
