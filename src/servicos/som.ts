/**
 * B27 — Som e vibração.
 *
 * Funcionalidade **nova**, sem correspondente no protótipo: o `.dc.html` roda
 * no navegador e não tem áudio nem háptica. `ARQUITETURA.md §3` (tela 4) e §7
 * já previam isso como parte do app de verdade.
 *
 * ## A armadilha que este módulo existe para evitar
 *
 * `ARQUITETURA.md §7` cita nominalmente: *"carregue o som uma vez na montagem,
 * não a cada oferta"*. Criar o player junto com o disparo significa decodificar
 * o arquivo no momento em que a oferta aparece — e o atraso cai exatamente em
 * cima do instante que o som deveria marcar. Por isso os três players são
 * criados uma vez em `iniciarSom()` (chamado pelo layout raiz) e depois só
 * rebobinados.
 *
 * `createAudioPlayer` e não `useAudioPlayer` porque o disparo vem do
 * `corridaStore` e do simulador, que não são componentes React. O preço é
 * cuidar do descarte à mão (`remove()` em `encerrarSom()`).
 *
 * ## Rebobinar antes de tocar
 *
 * Um `AudioPlayer` que já tocou fica parado no fim da faixa; chamar `play()`
 * de novo não faz nada. Daí o `seekTo(0)` antes de cada `play()` — é o que
 * permite duas ofertas seguidas soarem, em vez de só a primeira.
 *
 * ## Falhar em silêncio
 *
 * Nenhum erro de áudio pode derrubar o fluxo da corrida: um aparelho sem saída
 * de som, um player já descartado ou uma permissão negada devem, no máximo,
 * fazer o app ficar mudo. Todas as chamadas são embrulhadas.
 */

import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

/**
 * Os três efeitos. `chegada` e `sucesso` continuam sendo os placeholders
 * gerados por síntese (ver `scripts/gerar-sons.mjs`); `novaCorrida` é um
 * arquivo real, fornecido para o app.
 *
 * O arquivo original de `novaCorrida` vinha com **3,19s de silêncio na
 * frente** — o alerta parecia atrasar vários segundos, porque atrasava mesmo.
 * O arquivo em `assets/` já está cortado nas duas pontas (3,6s no total, som
 * a partir de 0,1s), o que também deixa o laço sem buraco audível entre as
 * repetições. Ao trocar por outro arquivo, conferir o silêncio inicial antes.
 *
 * `require` estático de propósito: o Metro precisa resolver o asset em tempo de
 * bundle. Import dinâmico não funcionaria aqui.
 */
const FONTES = {
  novaCorrida: require('../../assets/sons/nova-corrida.mp3'),
  chegada: require('../../assets/sons/chegada.wav'),
  sucesso: require('../../assets/sons/sucesso.wav'),
} as const;

type NomeSom = keyof typeof FONTES;

/** Volume por som. O alerta de oferta é o único que precisa competir com a rua. */
const VOLUMES: Record<NomeSom, number> = {
  novaCorrida: 1,
  chegada: 0.7,
  sucesso: 0.8,
};

/**
 * Quais sons tocam em laço.
 *
 * Só o alerta de oferta: ele precisa insistir enquanto o card estiver na tela,
 * porque o telefone costuma estar no suporte, fora do campo de visão, e uma
 * única passada de 3,6s pode acontecer no momento em que o motorista está
 * olhando para a rua. O laço para quando a oferta sai — aceita, recusada ou
 * expirada —, sempre por `pararSomNovaOferta()` (ver `corridaStore`).
 *
 * Chegada e finalização são confirmações de algo que acabou de acontecer:
 * repetir seria alarme, não confirmação.
 */
const EM_LACO: Record<NomeSom, boolean> = {
  novaCorrida: true,
  chegada: false,
  sucesso: false,
};

let players: Record<NomeSom, AudioPlayer> | null = null;

/**
 * Se o áudio já foi destravado por um gesto do usuário. Ver
 * {@link destravarAudio}.
 */
let audioDestravado = false;

/** Remove os ouvintes de primeiro toque instalados por `iniciarSom` (web). */
let removerOuvintesDeToque: (() => void) | null = null;

/**
 * Cria os players e configura o modo de áudio. Idempotente.
 *
 * `playsInSilentMode: true` é deliberado e é a decisão de produto aqui: um
 * motorista com o telefone no silencioso ainda precisa ouvir que chegou
 * corrida — é o mesmo comportamento dos apps de mobilidade reais.
 *
 * `interruptionMode: 'mixWithOthers'` para o alerta não cortar o rádio ou o
 * podcast que ele estiver ouvindo; são efeitos de meio segundo, não música.
 */
export function iniciarSom(): void {
  if (players) return;

  void setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  }).catch(() => {
    // Modo de áudio é otimização de comportamento, não requisito: se falhar,
    // o som continua tocando com o padrão da plataforma.
  });

  try {
    players = {
      novaCorrida: createAudioPlayer(FONTES.novaCorrida),
      chegada: createAudioPlayer(FONTES.chegada),
      sucesso: createAudioPlayer(FONTES.sucesso),
    };
    for (const nome of Object.keys(players) as NomeSom[]) {
      players[nome].volume = VOLUMES[nome];
      players[nome].loop = EM_LACO[nome];
    }
  } catch {
    players = null;
  }

  instalarDestravaNoPrimeiroToque();
}

/**
 * Na web, arma o destravamento no **primeiro** gesto do usuário, qualquer que
 * seja ele — não dá para depender de o toque ser no "Conectar", já que a
 * pessoa pode abrir o menu, ver o perfil e só então conectar.
 *
 * `capture: true` para pegar o evento antes de qualquer `stopPropagation` da
 * árvore de componentes, e `once: true` porque um destravamento basta.
 *
 * Fora da web `document` não existe e a função não faz nada.
 */
function instalarDestravaNoPrimeiroToque(): void {
  if (typeof document === 'undefined' || removerOuvintesDeToque) return;

  const eventos = ['pointerdown', 'touchend', 'keydown'] as const;
  const aoPrimeiroGesto = () => destravarAudio();

  for (const evento of eventos) {
    document.addEventListener(evento, aoPrimeiroGesto, {
      once: true,
      capture: true,
    });
  }

  removerOuvintesDeToque = () => {
    for (const evento of eventos) {
      document.removeEventListener(evento, aoPrimeiroGesto, { capture: true });
    }
  };
}

/**
 * Destrava o áudio da web. **Precisa ser chamada de dentro de um gesto do
 * usuário** (toque, clique, tecla).
 *
 * ## O problema
 *
 * Navegador nenhum deixa um site tocar som sozinho: o `AudioContext` nasce
 * suspenso e só passa a "running" durante um gesto. O alerta de oferta, porém,
 * dispara por *timer* — `agendarOferta()` chama `gerarOferta()` alguns segundos
 * depois do "Conectar". Nesse instante não há gesto nenhum acontecendo, então
 * o `play()` cai num contexto suspenso e **não sai som**.
 *
 * O sintoma aparecia com força no app instalado na tela inicial (PWA em modo
 * `standalone`), onde não há nem o histórico de interação da aba comum para
 * mascarar o problema.
 *
 * ## A solução
 *
 * Tocar cada faixa com volume 0 e pausar em seguida, tudo dentro do gesto.
 * Isso "acorda" o contexto e deixa os players prontos; quando o timer disparar
 * de verdade, o `play()` já encontra tudo liberado. É a mesma técnica que
 * players de web usam há anos.
 *
 * No app nativo isso é inofensivo: não há trava de gesto, e um play/pause mudo
 * não produz efeito audível.
 */
export function destravarAudio(): void {
  if (audioDestravado || !players) return;
  audioDestravado = true;

  for (const nome of Object.keys(players) as NomeSom[]) {
    const player = players[nome];
    try {
      player.volume = 0;
      player.play();
      player.pause();
      void player.seekTo(0);
      player.volume = VOLUMES[nome];
    } catch {
      // Ver "falhar em silêncio" no topo.
    }
  }

  removerOuvintesDeToque?.();
  removerOuvintesDeToque = null;
}

/** Descarta os players. Chamado no unmount do layout raiz. */
export function encerrarSom(): void {
  removerOuvintesDeToque?.();
  removerOuvintesDeToque = null;
  audioDestravado = false;
  if (!players) return;
  for (const player of Object.values(players)) {
    try {
      player.remove();
    } catch {
      // Já descartado — nada a fazer.
    }
  }
  players = null;
}

function parar(nome: NomeSom): void {
  const player = players?.[nome];
  if (!player) return;
  try {
    player.pause();
    void player.seekTo(0);
  } catch {
    // Ver "falhar em silêncio" no topo.
  }
}

function tocar(nome: NomeSom): void {
  const player = players?.[nome];
  if (!player) return;
  try {
    // `seekTo` é assíncrono, mas não dá para esperar por ele sem atrasar o
    // som: tocamos junto e deixamos a busca alcançar. Para faixas de meio
    // segundo isso é imperceptível e evita o "engasgo" de um `await`.
    void player.seekTo(0);
    player.play();
  } catch {
    // Ver "falhar em silêncio" no topo.
  }
}

// ---------------------------------------------------------------------------
// Os disparos, nomeados pelo evento e não pelo arquivo
// ---------------------------------------------------------------------------

/**
 * Nova oferta na tela (`corridaStore.gerarOferta`).
 *
 * Som **e** vibração juntos: é o único evento do app que acontece com o
 * telefone possivelmente no suporte, fora do campo de visão.
 * `NotificationFeedbackType.Warning` é o padrão mais "chamativo" da API sem
 * ser o de erro — dois toques, contra o toque único do Success.
 */
export function somNovaOferta(): void {
  tocar('novaCorrida');
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(
    () => {}
  );
}

/**
 * Corta o alerta de oferta.
 *
 * É o **único** jeito de o laço parar: `novaCorrida` toca repetindo (ver
 * {@link EM_LACO}), então sem esta chamada ele seguiria tocando para sempre,
 * inclusive com o motorista já a caminho do embarque. `corridaStore` a invoca
 * nos três caminhos em que a oferta sai da tela — `aceitar()`, `recusar()` e a
 * expiração (que termina em `recusar()`).
 *
 * `parar()` também rebobina, então a próxima oferta começa do início do
 * arquivo, e não de onde o laço foi interrompido.
 */
export function pararSomNovaOferta(): void {
  parar('novaCorrida');
}

/** Chegada ao embarque ou ao destino (`corridaStore.chegar`). */
export function somChegada(): void {
  tocar('chegada');
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Corrida finalizada (`corridaStore.finalizar`). */
export function somCorridaFinalizada(): void {
  tocar('sucesso');
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
    () => {}
  );
}

/**
 * Confirmação tátil de um toque importante, sem som: aceitar a oferta e
 * completar o deslizar de finalizar.
 *
 * Sem áudio de propósito — são ações que o motorista acabou de fazer com o
 * dedo na tela, então já sabe que aconteceram; o som seria redundante e o
 * alerta perderia o valor de "isto é diferente".
 */
export function vibrarConfirmacao(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
