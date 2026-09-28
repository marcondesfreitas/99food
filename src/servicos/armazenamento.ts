/**
 * B28 — Persistência local (AsyncStorage).
 *
 * Funcionalidade **nova**: o protótipo é uma página web cujo estado mora só na
 * memória e some a cada recarga. `ARQUITETURA.md §12` ("Como saber que
 * terminou") é explícito no que precisa mudar: *"fechar o app, reabrir, e o
 * histórico de ganhos continuar lá"*.
 *
 * Este módulo é a **política**: o que é salvo, sob qual chave, em qual versão e
 * como um dado gravado por uma versão antiga do app é lido pela nova. Quem
 * aplica a política é o `persist` do Zustand em `src/state/motoristaStore.ts`.
 *
 * ## O que persiste, e o que não
 *
 * A régua é a mesma que o botão de "resetar" do painel de debug do protótipo
 * usa (`logic.js` linhas 649-653): o que ele zera é o que o app considera
 * *dado do motorista*. Dali separamos em dois grupos:
 *
 * | Persiste | Por quê |
 * |---|---|
 * | `ganhos`, `dinamico`, `historico` | é o critério de aceite literal do bloco |
 * | `veiculos`, `veiculoAtivo` | cadastro; refazer a cada abertura seria absurdo |
 * | `contaNome`, `contaEmail`, `contaTel`, `contaCidade` | dados de conta, editáveis em Perfil › Configurações (B21) |
 * | `senhaAtualizadaEm` | data da última troca de senha. A **senha não é gravada**: sem servidor para autenticar, guardá-la só deixaria texto em claro no aparelho (ver `motoristaStore`) |
 * | `pix` | chave/conta de recebimento, digitada uma vez |
 * | `categoriasDesativadas` | preferência de aceitação |
 * | `foto` | ter ou não foto de perfil é cadastro, não sessão |
 *
 * | NÃO persiste | Por quê |
 * |---|---|
 * | `status` | reabrir o app tem de cair em `OFFLINE`; salvar `BUSCANDO` deixaria o motorista "online" sem nada rodando |
 * | `contaSalvo` | é o "Salvo!" que pisca depois de gravar, não um dado |
 * | `banner`, `camada` | estado de sessão: o protótipo os recria a cada carga, e o contexto do bloco não os lista |
 * | `corridaStore` inteiro | corrida em andamento é efêmera por decisão de escopo — reabrir com uma corrida pendurada e nenhum timer rodando seria um app travado |
 * | `demandaStore` inteiro | as zonas são recalculadas a cada 2400ms; salvar uma foto delas não tem valor |
 *
 * ## Tema claro/escuro
 *
 * `contextos/B28-persistencia.md` pede para *prever* o campo de preferência de
 * tema. Não há campo aqui porque não há tema no app (o protótipo v6 é só
 * claro) — inventar um valor que nada lê seria código morto. Quando entrar, o
 * caminho é: adicionar `tema` ao `motoristaStore`, incluí-lo em
 * `CAMPOS_PERSISTIDOS` e subir `VERSAO_ARMAZENAMENTO` com uma `migrate` que
 * devolva `'claro'` para quem já tinha dados gravados.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * Chave única no AsyncStorage. O prefixo evita colisão com qualquer outra
 * biblioteca que grave no mesmo namespace do app.
 */
export const CHAVE_MOTORISTA = '99motorista:motorista';

/**
 * Versão do formato gravado.
 *
 * Subir este número sempre que a **forma** dos dados persistidos mudar de um
 * jeito que o código novo não saiba ler (campo renomeado, tipo trocado,
 * estrutura aninhada diferente). Acrescentar um campo novo não exige subir:
 * o merge raso do `persist` preenche o que falta com o valor inicial do store.
 */
export const VERSAO_ARMAZENAMENTO = 1;

/**
 * O adaptador. `createJSONStorage` cuida do `JSON.stringify`/`parse`; o
 * AsyncStorage só vê strings.
 *
 * É uma função genérica, e não um valor pronto, porque o `persist` exige um
 * `PersistStorage<T>` casado com o tipo que a store grava — um
 * `PersistStorage<unknown>` compartilhado não passa no verificador.
 */
export function armazenamentoDe<T>() {
  return createJSONStorage<T>(() => AsyncStorage);
}

/**
 * Migração entre versões do formato.
 *
 * Ainda não há nenhuma — a versão 1 é a primeira. A função existe montada
 * porque o momento de precisar dela é justamente o momento em que esquecê-la
 * corrompe os dados de quem já usava o app: sem `migrate`, o `persist`
 * simplesmente descarta o estado gravado quando a versão não bate, e o
 * histórico de ganhos evapora sem aviso.
 *
 * O `as T` é inerente ao contrato: o que veio do disco é literalmente
 * `unknown` em tempo de execução, e cabe a esta função afirmar a forma. Ao
 * adicionar uma migração de verdade, é aqui que a validação de campo a campo
 * deve entrar, antes da afirmação.
 */
export function migrarEstadoMotorista<T>(
  estadoPersistido: unknown,
  versao: number
): T {
  if (versao === VERSAO_ARMAZENAMENTO) return estadoPersistido as T;
  // Nenhuma versão anterior existiu: qualquer coisa gravada com versão
  // desconhecida é lixo de um build de desenvolvimento e pode ser descartada.
  // O merge raso do `persist` repõe os valores iniciais da store.
  return {} as T;
}

/** Apaga tudo o que o app gravou. Equivalente ao `resetar()` do protótipo. */
export async function limparArmazenamento(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CHAVE_MOTORISTA);
  } catch {
    // Se o disco recusar, não há o que fazer além de seguir — é uma ação de
    // manutenção, não parte de nenhum fluxo do usuário.
  }
}
