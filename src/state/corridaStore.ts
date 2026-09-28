/**
 * corridaStore — a máquina de estados da corrida (o coração do app).
 *
 * Fluxo: oferta → aceitar → indo buscar → aguardando → em viagem → resumo.
 * Ver `ARQUITETURA.md` §2 (diagrama da máquina de estados, em português) e
 * §6 (surge — usado aqui só via `demandaStore`, a fórmula em si mora lá).
 *
 * Fonte: `.design-import/logic.js`, métodos da classe `Component`:
 * - `trajeto()`/`prepAtual()` — linhas 177-178
 * - `iniciarLoop()` — linhas 185-215 (o "piloto automático", roda em rAF)
 * - `chegar()` — linhas 217-221
 * - `gerarOferta()` — linhas 317-339
 * - `recusar()` — linha 341
 * - `aceitar()` — linhas 343-350
 * - `avancarCorrida()` — linhas 352-365
 * - `finalizar()` — linhas 367-392
 *
 * Decisão de tradução Web → RN (ver `contextos/B04-corrida-demanda-store.md`,
 * "Notas de tradução", opção (a)): o loop do piloto automático continua em
 * `requestAnimationFrame` — é a tradução mais fiel ao protótipo. O que MUDOU
 * depois do relatório de QA (B29, item 7.3, "jank do piloto automático
 * ... é a decisão que este relatório não pode tomar"): jank real foi
 * relatado em dispositivo, então a cadência de `set()` deixou de ser 1:1 com
 * o rAF.
 *
 * `passo()` continua calculando `prog`/`ang` a cada quadro (a física não
 * perde precisão), mas só publica no Zustand a
 * {@link INTERVALO_PUBLICACAO_S}. Motivo: cada `set()` aqui é lido por
 * `MapaConectado` (`app/(motorista)/mapa.tsx`), que existe bem pequeno
 * exatamente para conter o custo — mas 60 reconciliações por segundo do
 * marcador, do halo e da geometria da rota ainda é gasto de mais numa tela
 * com gesto de pan simultâneo. Publicar a ~30 quadros por segundo é
 * imperceptível num marcador que se desloca ao longo de dezenas de
 * segundos, e corta a pressão de render pela metade. Não migramos para
 * `useSharedValue` do Reanimated porque isso moveria a FÍSICA (não só a
 * publicação) para fora do Zustand — mudança maior, e o corte de cadência
 * já resolve o jank relatado sem reescrever a máquina de estados.
 *
 * Fora de escopo aqui (propositalmente, pertence a outros blocos):
 * - câmera do mapa (`offX/offY/segue/zoom`) — é estado de UI do componente
 *   de mapa (B06/B11), não da corrida em si;
 * - `status` ONLINE/OFFLINE/BUSCANDO e o agendamento periódico de novas
 *   ofertas (`agendarOferta` no protótipo, linha 315) — isso é o "servidor
 *   fake", `src/servicos/simuladorCorridas.ts` na árvore de `ARQUITETURA.md`
 *   §4, um arquivo à parte. Este store só expõe as transições de estado;
 *   quem decide *quando* chamar `gerarOferta()` fica em outro bloco.
 */

import { create } from 'zustand';
import {
  pararSomNovaOferta,
  somChegada,
  somCorridaFinalizada,
  somNovaOferta,
  vibrarConfirmacao,
} from '@/servicos/som';
import { TRAJETOS, emT, fmt, um, faixaFmt, NOMES, DUR_BUSCAR, DUR_VIAGEM } from '@/servicos/mapaFalso';
import { useDemandaStore } from '@/state/demandaStore';
import { useMotoristaStore } from '@/state/motoristaStore';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Inferido a partir de `TRAJETOS` (não importa tipos de `tipos.ts` de
 * propósito — reduz o acoplamento com B02 a só o valor em tempo de execução). */
type TrajetoAtual = (typeof TRAJETOS)[number];
type GeometriaAtual = TrajetoAtual['pb'];

export type StatusCorrida = 'INDO_BUSCAR' | 'AGUARDANDO' | 'EM_VIAGEM';

/** `chegada` — logic.js `chegar()` (linhas 217-221): pulso no marcador, depois
 * pin fixo, depois libera o botão de ação. */
export type Chegada = 'pulse' | 'pin' | 'botao' | null;

/**
 * Formato de `oferta` tal como `gerarOferta()` monta (logic.js linhas
 * 326-334) — já vem "achatado" e pré-formatado (valores em `R$`, distâncias
 * em texto), fiel ao protótipo. `aceitar()` só move este objeto para
 * `corrida` sem alterar o formato (logic.js linha 348), por isso `Corrida`
 * é um alias.
 */
export type Oferta = {
  nome: string;
  iniciais: string;
  nota: string;
  corridas: number;
  valor: number;
  base: number;
  mult: number;
  km: number;
  min: number;
  faixa: string;
  valorFmt: string;
  porKm: string;
  dinamicoFmt: string;
  tempoOrigem: string;
  tempoDestino: string;
  enderecoOrigem: string;
  enderecoDestino: string;
};

export type Corrida = Oferta;

/** Item de histórico — mesmo formato esperado por
 * `motoristaStore.registrarGanho(valor, dinamico, item)` (B03). Definido
 * localmente (em vez de importado) para não travar este bloco num nome de
 * export incerto de B03; é estruturalmente compatível. */
export type HistoricoItem = {
  hora: string;
  endereco: string;
  valorFmt: string;
  valor: number;
  h: number;
};

/** Resumo decomposto (base + dinâmico) para a tela de resumo da corrida —
 * ARQUITETURA §6.6 "separe 'corrida R$ 18,00 + dinâmico R$ 14,40'". Não está
 * na lista de campos do `contextos/B04-*.md`, mas `finalizar()` precisa
 * produzir esses dados em algum lugar antes de zerar `corrida`, e B07/B08
 * (que este bloco bloqueia) vão precisar deles para a tela de resumo. */
export type ResumoCorrida = {
  baseFmt: string;
  dinamicoFmt: string;
  faixa: string;
  km: string;
  min: number;
  valor: number;
  valorFmt: string;
};

type CorridaState = {
  oferta: Oferta | null;
  fase: 'ativo' | 'expirando';
  corrida: Corrida | null;
  corridaStatus: StatusCorrida | null;
  rotaIdx: number;
  prog: number;
  ang: number;
  chegada: Chegada;
  resumo: ResumoCorrida | null;
  /** Valor animado (contagem regressiva → crescente) do resumo — logic.js
   * linhas 385-391, easing cúbico em 900ms. */
  resumoValor: number;

  /** `trajeto()` — logic.js linha 177. */
  trajetoAtual: () => TrajetoAtual;
  /** `prepAtual()` — logic.js linha 178: geometria de "buscar" durante
   * INDO_BUSCAR, de "viagem" nos outros estados. */
  prepAtual: () => GeometriaAtual;

  gerarOferta: () => void;
  recusar: () => void;
  aceitar: () => void;
  avancarCorrida: () => void;
  finalizar: () => void;
  /** `chegar()` — logic.js linhas 217-221. */
  chegar: () => void;
  /** Inicia o rAF do piloto automático (idempotente — cancela um loop
   * anterior antes de começar, igual ao protótipo). */
  iniciarLoop: () => void;
  /** Cancela o rAF do piloto automático. Chamar no cleanup do componente que
   * consome esta store, além de já ser chamado internamente por
   * `finalizar()`/`avancarCorrida()` quando aplicável. */
  pararLoop: () => void;
  /**
   * `limpar()` — logic.js linha 144, chamado pelo `componentWillUnmount` do
   * protótipo (linha 152).
   *
   * Mata o que este store agenda por conta própria e que nenhuma tela enxerga:
   * a expiração da oferta em 15s, a virada para `fase: 'expirando'` e o rAF da
   * contagem do valor no resumo. Sem isto, encerrar o app com uma oferta no ar
   * deixaria esses timers pendurados — é o critério de aceite de B26.
   *
   * Note que NÃO mexe no estado: só cancela agendamentos. Zerar `oferta` aqui
   * dispararia o reagendamento automático de `simuladorCorridas`, que é
   * exatamente o contrário do que se quer ao desligar.
   */
  limparAgendamentos: () => void;
};

// ---------------------------------------------------------------------------
// Housekeeping fora do estado reativo — timers e rAF ids não são dado de UI,
// então ficam fora do Zustand, igual a `this.timers`/`this.loopId`/`this.raf`
// no protótipo (ver nota de tradução #2 do bloco B04).
// ---------------------------------------------------------------------------

let timers: ReturnType<typeof setTimeout>[] = [];
function at(fn: () => void, ms: number) {
  const id = setTimeout(fn, ms);
  timers.push(id);
  return id;
}
function limparTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

let loopId: number | null = null;
let ultimo = 0;

/**
 * A cada quantos segundos `passo()` publica `prog`/`ang` no Zustand.
 * `1/30`: metade da cadência de um rAF a 60fps, mas o dobro do que o olho
 * precisa para ler como contínuo num marcador que se move devagar. Ver o
 * porquê completo no cabeçalho do arquivo.
 */
const INTERVALO_PUBLICACAO_S = 1 / 30;

/** Progresso/ângulo "de verdade", atualizados TODO quadro — publicados no
 * Zustand só a cada {@link INTERVALO_PUBLICACAO_S}. Fora do estado do
 * Zustand de propósito, junto com `loopId`/`ultimo`: não é dado reativo
 * entre publicações, é a memória do próprio loop. */
let progExec = 0;
let angExec = 0;
let desdeUltimaPublicacao = 0;

let resumoRafId: number | null = null;
function pararResumoAnim() {
  if (resumoRafId != null) cancelAnimationFrame(resumoRafId);
  resumoRafId = null;
}

/**
 * Duração da oferta em segundos — `this.props.duracaoOferta ?? 15` no
 * protótipo (logic.js linha 325). Sem sistema de props aqui, fica fixo.
 *
 * Exportada porque a barra de contagem do `CardOferta` precisa exatamente do
 * mesmo número que o timer de expiração daqui. B29 encontrou as duas cópias
 * já divergindo em potencial (uma constante igual declarada em `mapa.tsx`):
 * mudar uma sem a outra faria a barra chegar ao fim antes ou depois de a
 * oferta realmente expirar — um bug silencioso e difícil de rastrear.
 */
export const DURACAO_OFERTA_S = 15;

export const useCorridaStore = create<CorridaState>()((set, get) => ({
  oferta: null,
  fase: 'ativo',
  corrida: null,
  corridaStatus: null,
  rotaIdx: 0,
  prog: 0,
  ang: 0,
  chegada: null,
  resumo: null,
  resumoValor: 0,

  trajetoAtual: () => TRAJETOS[get().rotaIdx] || TRAJETOS[0],
  prepAtual: () => (get().corridaStatus === 'INDO_BUSCAR' ? get().trajetoAtual().pb : get().trajetoAtual().pv),

  gerarOferta: () => {
    // gerarOferta() — logic.js linhas 317-339.
    const [nome, iniciais, nota, corridas] = NOMES[Math.floor(Math.random() * NOMES.length)] as [
      string,
      string,
      number,
      number,
    ];
    const idx = Math.floor(Math.random() * TRAJETOS.length);
    const t = TRAJETOS[idx];

    const { zonaQuente, faixaDe } = useDemandaStore.getState();
    const [fmin, fmax] = faixaDe(zonaQuente());
    const mult = Math.round((fmin + (fmax - fmin) * Math.random()) * 100) / 100;
    const base = Math.round((6.5 + t.km * 1.05 + t.min * 0.32) * 20) / 20;
    // Valor arredondado a 0.05 (×20 → round → /20) — critério de aceite do bloco.
    const valor = Math.round(base * mult * 20) / 20;

    const oferta: Oferta = {
      nome,
      iniciais,
      nota: nota.toFixed(2).replace('.', ','),
      corridas,
      valor,
      base,
      mult,
      km: t.km,
      min: t.min,
      faixa: faixaFmt(fmin, fmax),
      valorFmt: fmt(valor),
      porKm: fmt(valor / t.km) + '/km',
      dinamicoFmt: fmt(Math.round((valor - base) * 100) / 100),
      tempoOrigem: t.minOrigem + 'min (' + um(t.kmOrigem) + 'km)',
      tempoDestino: t.min + 'min (' + um(t.km) + 'km)',
      enderecoOrigem: t.origem,
      enderecoDestino: t.destino,
    };

    const pt = emT(t.pb, 0);
    set({ oferta, rotaIdx: idx, fase: 'ativo', prog: 0, ang: pt.bearing, chegada: null });

    // B27: alerta sonoro + vibração. Fica aqui, e não na tela, porque a oferta
    // pode nascer com o motorista em qualquer tela empurrada — o timer que a
    // gera vive no layout raiz. Amarrar o som ao `CardOferta` significaria
    // ficar mudo justamente quando o telefone está fora do campo de visão.
    somNovaOferta();

    // Expira em `dur` segundos; fica "expirando" nos últimos 3s (logic.js
    // linhas 337-338).
    at(() => set({ fase: 'expirando' }), Math.max(500, (DURACAO_OFERTA_S - 3) * 1000));
    at(() => get().recusar(), DURACAO_OFERTA_S * 1000);
  },

  recusar: () => {
    // recusar() — logic.js linha 341. O protótipo também reagenda a
    // próxima oferta (`agendarOferta`); aqui isso fica por conta de quem
    // orquestra o "ficar online" (fora de escopo deste bloco, ver nota no
    // topo do arquivo).
    limparTimers();
    // B27: o card saiu da tela, o alerta some junto (ver `pararSomNovaOferta`).
    pararSomNovaOferta();
    set({ oferta: null, fase: 'ativo' });
  },

  aceitar: () => {
    // aceitar() — logic.js linhas 343-350.
    limparTimers();
    pararSomNovaOferta();
    const o = get().oferta;
    if (!o) return;
    const t = TRAJETOS[get().rotaIdx] || TRAJETOS[0];
    const pt = emT(t.pb, 0);
    // B27: só vibração, sem som — o motorista acabou de tocar o botão, então
    // já sabe que aceitou. Um som aqui competiria com o alerta de oferta e
    // gastaria o valor de "isto é diferente" que ele carrega.
    vibrarConfirmacao();
    set({ corrida: o, corridaStatus: 'INDO_BUSCAR', oferta: null, prog: 0, ang: pt.bearing, chegada: null });
    get().iniciarLoop();
  },

  avancarCorrida: () => {
    // avancarCorrida() — logic.js linhas 352-365.
    const st = get().corridaStatus;
    if (st === 'INDO_BUSCAR') {
      get().pararLoop();
      const t = TRAJETOS[get().rotaIdx] || TRAJETOS[0];
      const pt = emT(t.pv, 0);
      set({ corridaStatus: 'AGUARDANDO', prog: 0, chegada: 'botao', ang: pt.bearing });
      get().iniciarLoop();
      return;
    }
    if (st === 'AGUARDANDO') {
      set({ corridaStatus: 'EM_VIAGEM', prog: 0, chegada: null });
      get().iniciarLoop();
    }
  },

  finalizar: () => {
    // finalizar() — logic.js linhas 367-392.
    limparTimers();
    get().pararLoop();
    pararResumoAnim();

    const o = get().corrida || get().oferta;
    if (!o) return;

    // B27: som de sucesso + háptica de confirmação. Cobre também o gesto de
    // deslizar para finalizar, que é o único caminho até aqui — vibrar duas
    // vezes no mesmo instante seria ruído, não feedback.
    somCorridaFinalizada();

    const dinamico = Math.round((o.valor - o.base) * 100) / 100;

    // Integração entre stores: crédito de ganhos e histórico pertencem ao
    // motoristaStore (B03) — `registrarGanho` deve fazer, internamente,
    // ganhos += valor / dinamico += dinamico / historico.concat(item).
    const motorista = useMotoristaStore.getState();
    const historicoLen = motorista.historico.length;
    const hora = 19 + (historicoLen % 4);
    const item: HistoricoItem = {
      hora: hora + ':' + String((12 + historicoLen * 9) % 60).padStart(2, '0'),
      endereco: o.enderecoDestino.split(',')[0],
      valorFmt: fmt(o.valor),
      valor: o.valor,
      h: hora,
    };
    motorista.registrarGanho(o.valor, dinamico, item);

    set({
      corrida: null,
      corridaStatus: null,
      chegada: null,
      resumo: {
        baseFmt: fmt(o.base),
        dinamicoFmt: fmt(dinamico),
        faixa: o.faixa,
        km: um(o.km),
        min: o.min,
        valor: o.valor,
        valorFmt: fmt(o.valor),
      },
      resumoValor: 0,
    });

    // Animação de contagem do valor — easing cúbico em 900ms (logic.js
    // linhas 385-391).
    const inicio = performance.now();
    const anim = () => {
      const t = Math.min(1, (performance.now() - inicio) / 900);
      set({ resumoValor: o.valor * (1 - Math.pow(1 - t, 3)) });
      if (t < 1) resumoRafId = requestAnimationFrame(anim);
      else resumoRafId = null;
    };
    resumoRafId = requestAnimationFrame(anim);
  },

  chegar: () => {
    // chegar() — logic.js linhas 217-221.
    // B27: confirmação de chegada ao embarque/destino.
    somChegada();
    set({ chegada: 'pulse' });
    at(() => set({ chegada: 'pin' }), 400);
    at(() => set({ chegada: 'botao' }), 800);
  },

  iniciarLoop: () => {
    // iniciarLoop() — logic.js linhas 185-215. O "piloto automático": move
    // `prog` ao longo da geometria preparada e suaviza `ang` (bearing) com
    // um filtro exponencial.
    if (loopId != null) cancelAnimationFrame(loopId);
    ultimo = performance.now();
    desdeUltimaPublicacao = 0;
    // Parte de onde a store já estava (não de 0): retomar um loop parado a
    // meio de uma corrida (ex.: voltar de uma tela empurrada) continua do
    // ponto certo, e não do início do trajeto.
    progExec = get().prog;
    angExec = get().ang;

    const passo = (agora: number) => {
      const dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;

      const s = get();
      if (!s.corrida) return;

      const move = (s.corridaStatus === 'INDO_BUSCAR' || s.corridaStatus === 'EM_VIAGEM') && !s.chegada;
      const dur = s.corridaStatus === 'INDO_BUSCAR' ? DUR_BUSCAR : DUR_VIAGEM;
      if (move) progExec = Math.min(1, progExec + dt / dur);

      const pt = emT(get().prepAtual(), progExec);

      if (move) {
        // Filtro exponencial do bearing, com wrap-around de 360° — copiado
        // EXATAMENTE de logic.js linha 200 (`((bearing - ang + 540) % 360) - 180`)
        // para não perder o sinal do menor ângulo.
        const d = ((pt.bearing - angExec + 540) % 360) - 180;
        angExec = angExec + d * (1 - Math.exp(-dt / 0.12));
      }

      const chegouAgora = move && progExec >= 1;

      // Publica no Zustand a ~30fps (ou já, se a corrida acabou de chegar —
      // `chegar()` abaixo depende de `s.prog`/`s.chegada` estarem frescos).
      // Ver {@link INTERVALO_PUBLICACAO_S} para o porquê da cadência.
      desdeUltimaPublicacao += dt;
      if (desdeUltimaPublicacao >= INTERVALO_PUBLICACAO_S || chegouAgora) {
        desdeUltimaPublicacao = 0;
        set({ prog: progExec, ang: angExec });
      }

      if (chegouAgora) get().chegar();
      loopId = requestAnimationFrame(passo);
    };

    loopId = requestAnimationFrame(passo);
  },

  pararLoop: () => {
    if (loopId != null) cancelAnimationFrame(loopId);
    loopId = null;
  },

  limparAgendamentos: () => {
    limparTimers();
    pararResumoAnim();
  },
}));
