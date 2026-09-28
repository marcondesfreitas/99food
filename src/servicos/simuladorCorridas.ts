/**
 * B26 — O "servidor de despacho" fake: quando cada etapa do fluxo dispara, e
 * para onde ela leva.
 *
 * `ARQUITETURA.md §4` reserva este arquivo para o simulador de corridas; §1
 * explica por quê: não existe passageiro nem servidor, então alguém precisa
 * decidir sozinho que "agora chegou uma oferta".
 *
 * ## Por que isto não é um store
 *
 * `corridaStore` (B04) sabe *o que* é uma corrida e como ela evolui.
 * `motoristaStore` (B03) sabe o *status do turno*. Nenhum dos dois sabe
 * **quando** a próxima oferta deve nascer, nem para qual tela navegar — e nem
 * deveria: um store que chama `router` vira dependência circular com a camada
 * de telas. No protótipo esse papel é do próprio componente raiz, que tem
 * timers e `setState({ tela })` no mesmo lugar (`.design-import/logic.js`
 * linhas 304-341). Aqui é este módulo.
 *
 * As telas ficam burras de propósito: `mapa.tsx` chama `conectar()`,
 * `verificacao-facial.tsx` chama `concluirFacial()`, `resumo.tsx` chama
 * `concluirResumo()`. Nenhuma delas conhece os tempos nem a próxima rota.
 *
 * ## O fluxo inteiro, em um lugar só
 *
 * ```
 * mapa "Conectar"  →  CARREGANDO ──1400ms──▶  verificacao-facial
 * facial           →  (6100ms + 900ms, tempos da própria tela)
 *                     ──▶ BUSCANDO + mapa + agenda oferta em 3400ms
 * oferta expira ou "Recusar"  ──▶ agenda a próxima em 4200ms
 * "Aceitar"        →  corridaStore.aceitar() + piloto automático
 * deslizar         →  finalizarCorrida() ──▶ resumo
 * resumo "Enviar"  →  BUSCANDO + mapa + agenda oferta em 4000ms
 * ```
 *
 * ## Timers
 *
 * Ficam em `let` de módulo, fora do Zustand, pelo mesmo motivo que
 * `corridaStore` faz isso: id de timer não é dado de UI. `iniciarSimulador()`
 * / `encerrarSimulador()` são chamados por `app/_layout.tsx` — é o equivalente
 * do `componentDidMount`/`componentWillUnmount` do protótipo (logic.js linhas
 * 147-152) e garante o critério de aceite de B26: fechar o app no meio de
 * qualquer etapa não deixa timer fantasma.
 */

import { router } from 'expo-router';

import { ROTAS } from '@/servicos/navegacao';
import { destravarAudio } from '@/servicos/som';
import { useCorridaStore } from '@/state/corridaStore';
import { useMotoristaStore } from '@/state/motoristaStore';

// ---------------------------------------------------------------------------
// Tempos — todos vindos do protótipo, nenhum inventado
// ---------------------------------------------------------------------------

/** `conectar()` — logic.js linha 306: 1400ms em CARREGANDO antes da facial. */
const MS_CARREGANDO = 1400;

/** `rodarFacial()` — logic.js linha 310: `agendarOferta(3400)` ao ficar online. */
const MS_PRIMEIRA_OFERTA = 3400;

/** `recusar()` — logic.js linha 341: `agendarOferta(4200)`. */
const MS_APOS_RECUSA = 4200;

/** `concluirResumo` — logic.js linha 556: `agendarOferta(4000)`. */
const MS_APOS_RESUMO = 4000;

/** `agendarOferta(ms)` — logic.js linha 315: o `|| 4200` do argumento vazio. */
const MS_PADRAO = 4200;

// ---------------------------------------------------------------------------
// Housekeeping
// ---------------------------------------------------------------------------

/** Timer da próxima oferta. Só existe um por vez — agendar de novo cancela. */
let timerOferta: ReturnType<typeof setTimeout> | null = null;

/** Timer do "Carregando" entre o toque em Conectar e a tela facial. */
let timerConectar: ReturnType<typeof setTimeout> | null = null;

/** Cancelamento da assinatura do `corridaStore` (ver `iniciarSimulador`). */
let cancelarAssinatura: (() => void) | null = null;

function limpar(timer: ReturnType<typeof setTimeout> | null) {
  if (timer) clearTimeout(timer);
  return null;
}

// ---------------------------------------------------------------------------
// Ofertas
// ---------------------------------------------------------------------------

/**
 * `agendarOferta(ms)` — logic.js linha 315.
 *
 * A guarda é avaliada **na hora de disparar**, não na hora de agendar: entre
 * um e outro o motorista pode ter desconectado, ou uma corrida pode ter
 * começado. É literalmente a condição do protótipo:
 * `if (status === 'BUSCANDO' && !oferta && !corrida)`.
 */
export function agendarOferta(ms: number = MS_PADRAO): void {
  timerOferta = limpar(timerOferta);
  timerOferta = setTimeout(() => {
    timerOferta = null;
    const { status } = useMotoristaStore.getState();
    const corrida = useCorridaStore.getState();
    if (status !== 'BUSCANDO' || corrida.oferta || corrida.corrida) return;
    corrida.gerarOferta();
  }, ms);
}

/** Cancela uma oferta agendada que ainda não nasceu. */
export function cancelarOfertaAgendada(): void {
  timerOferta = limpar(timerOferta);
}

// ---------------------------------------------------------------------------
// Ciclo de vida do módulo
// ---------------------------------------------------------------------------

/**
 * Liga o simulador. Idempotente — chamar duas vezes não duplica a assinatura.
 *
 * A assinatura no `corridaStore` resolve um caso que, de outra forma, teria de
 * ser tratado em dois lugares: **a oferta pode morrer sozinha**. O botão
 * "Recusar" é um caminho, mas o outro é o timer de 15s dentro do próprio store
 * (`gerarOferta` agenda `recusar()` em `DURACAO_OFERTA_S`), que nenhuma tela
 * observa. Observando a transição `oferta: algo → null` com `corrida` ainda
 * nula, os dois caminhos reagendam pelo mesmo código — que é o que o protótipo
 * faz ao pôr o `agendarOferta(4200)` dentro do próprio `recusar()`
 * (logic.js linha 341).
 */
export function iniciarSimulador(): void {
  if (cancelarAssinatura) return;
  cancelarAssinatura = useCorridaStore.subscribe((estado, anterior) => {
    const ofertaMorreu = anterior.oferta !== null && estado.oferta === null;
    // `aceitar()` também zera `oferta`, mas cria `corrida` no mesmo `set` —
    // por isso a checagem de `corrida`, que separa "recusou" de "aceitou".
    if (ofertaMorreu && estado.corrida === null) agendarOferta(MS_APOS_RECUSA);
  });
}

/**
 * Desliga tudo, na mesma ordem do `componentWillUnmount` do protótipo
 * (logic.js linha 152): a assinatura primeiro, para nenhum cancelamento
 * abaixo disparar um reagendamento; depois os timers deste módulo, os do
 * `corridaStore` (expiração da oferta, rAF do resumo) e o piloto automático.
 *
 * Chamado no unmount do layout raiz — é o que garante o critério de aceite de
 * B26: nada continua rodando depois que o app sai.
 */
export function encerrarSimulador(): void {
  cancelarAssinatura?.();
  cancelarAssinatura = null;
  timerOferta = limpar(timerOferta);
  timerConectar = limpar(timerConectar);
  const corrida = useCorridaStore.getState();
  corrida.limparAgendamentos();
  corrida.pararLoop();
}

// ---------------------------------------------------------------------------
// As transições do fluxo
// ---------------------------------------------------------------------------

/**
 * `conectar()` — logic.js linhas 304-307. Botão "Conectar" da barra inferior.
 *
 * `replace` para a facial: ela não pode ficar na pilha de voltar (requisito
 * explícito de `contextos/B25-navegacao.md`).
 */
export function conectar(): void {
  // B27: o toque em "Conectar" é o último gesto garantido antes do alerta de
  // oferta, que dispara por timer. Destravar o áudio aqui é o que faz o som
  // sair na web — em especial no app instalado na tela inicial. Idempotente:
  // se o primeiro toque da sessão já destravou, esta chamada não faz nada.
  destravarAudio();

  timerConectar = limpar(timerConectar);
  useMotoristaStore.getState().setStatus('CARREGANDO');
  timerConectar = setTimeout(() => {
    timerConectar = null;
    router.replace(ROTAS.facial);
  }, MS_CARREGANDO);
}

/**
 * Fim da verificação facial com sucesso — logic.js linha 310.
 *
 * Os 6100ms + 900ms da animação são da própria tela (é a timeline visual dela);
 * o que acontece **depois** é daqui.
 */
export function concluirFacial(): void {
  useMotoristaStore.getState().setStatus('BUSCANDO');
  router.replace(ROTAS.mapa);
  agendarOferta(MS_PRIMEIRA_OFERTA);
}

/**
 * O `‹` da tela facial — `voltarMapa` no protótipo (`.dc.html` linha 391).
 *
 * Desistir da verificação desfaz o "Conectar": o protótipo volta ao mapa e o
 * botão lá está pintado por `status`, que continua `CARREGANDO` se ninguém
 * mexer. Voltamos para `OFFLINE`, senão o mapa mostraria "Carregando…" para
 * sempre, sem nada carregando.
 */
export function desistirDaFacial(): void {
  timerConectar = limpar(timerConectar);
  useMotoristaStore.getState().setStatus('OFFLINE');
  router.replace(ROTAS.mapa);
}

/**
 * "Adicionar agora ›" no banner de perfil sem foto da tela facial
 * (`.dc.html` linha 398, `irPerfil`).
 *
 * Sair da verificação para o Perfil também é desistir dela — daí o `OFFLINE`,
 * pelo mesmo motivo de `desistirDaFacial()`.
 *
 * `replace` porque a facial não pode continuar viva embaixo da pilha. Como
 * sobra só o Perfil, o `‹` dele (`voltarDe('perfil')`, que faz `dismissTo` do
 * mapa) cai no comportamento de substituição do `dismissTo` e leva ao mapa —
 * o destino certo.
 */
export function irAoPerfilDaFacial(): void {
  timerConectar = limpar(timerConectar);
  useMotoristaStore.getState().setStatus('OFFLINE');
  router.replace(ROTAS.perfil);
}

/**
 * Deslizar para finalizar, em EM_VIAGEM — logic.js linhas 367-392.
 *
 * `corridaStore.finalizar()` já credita os ganhos no `motoristaStore`, grava o
 * histórico e monta o `resumo` animado; aqui só falta ir para a tela.
 */
export function finalizarCorrida(): void {
  useCorridaStore.getState().finalizar();
  router.replace(ROTAS.resumo);
}

/**
 * "Enviar" no resumo — `concluirResumo`, logic.js linha 556.
 *
 * O status já é `BUSCANDO` (nunca deixou de ser durante a corrida), mas
 * reafirmamos para o caso de a tela ter sido alcançada por outro caminho.
 */
export function concluirResumo(): void {
  useMotoristaStore.getState().setStatus('BUSCANDO');
  router.replace(ROTAS.mapa);
  agendarOferta(MS_APOS_RESUMO);
}

/**
 * "Ver central de ganhos" no resumo — `irCentral`, `.dc.html` linha 487.
 *
 * DIVERGÊNCIA REGISTRADA: no protótipo este botão faz `push('central')` e
 * abandona o resumo **sem** reagendar oferta — o motorista fica online e nunca
 * mais recebe nada, porque `agendarOferta` só é chamado por `concluirResumo`.
 * Aqui o resumo é dado por concluído do mesmo jeito (inclusive o agendamento),
 * só que o destino é a Central.
 *
 * `replace` e não `push` para o resumo não ficar embaixo na pilha: voltar da
 * Central tem de dar no mapa, não numa corrida já encerrada.
 */
export function verCentralDeGanhos(): void {
  useMotoristaStore.getState().setStatus('BUSCANDO');
  router.replace(ROTAS.central);
  agendarOferta(MS_APOS_RESUMO);
}
