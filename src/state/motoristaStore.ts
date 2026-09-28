/**
 * motoristaStore — fatia de estado do motorista que NÃO é a corrida em si:
 * sessão/ganhos, histórico, foto de perfil, veículos, conta, Pix, preferências
 * de categoria e banner/camada do mapa.
 *
 * Portado de `.design-import/logic.js` (Component.state, linhas 123–140) e das
 * ações espalhadas em `renderVals()` (linhas 402–655). A lógica da corrida em
 * si (oferta, corridaStatus, zonas, trajeto) pertence a `corridaStore` (B04),
 * que consome `registrarGanho` e `adicionarHistorico` daqui.
 *
 * B28: esta é a **única** store persistida — ganhos, histórico, veículos,
 * conta e Pix sobrevivem a fechar o app. Corrida e demanda recomeçam do zero
 * a cada abertura, de propósito. O recorte exato e o porquê de cada campo
 * estão em `src/servicos/armazenamento.ts`.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  CHAVE_MOTORISTA,
  VERSAO_ARMAZENAMENTO,
  armazenamentoDe,
  migrarEstadoMotorista,
} from '@/servicos/armazenamento';
import type { CampoConta } from '@/servicos/campoConta';
import { apagarFotoDePerfil, fotoExiste } from '@/servicos/imagemPerfil';
import { CATEGORIAS, TIPOS_CONTA, TILES, fmt } from '@/servicos/mapaFalso';
import type { Veiculo } from '@/state/tipos';

export type FotoStatus = 'ok' | 'vazio' | 'enviando';

/**
 * `state.status` do protótipo (logic.js linha 123): o motorista está
 * desconectado, entrando (verificação facial em curso) ou online esperando
 * oferta.
 *
 * B26 trouxe isto para cá — antes era `useState` local de `mapa.tsx`. Não podia
 * continuar assim: o mapa é **desmontado** enquanto a verificação facial está
 * no ar (a facial entra por `router.replace`), então o status voltava para
 * `OFFLINE` exatamente no ponto em que deveria virar `BUSCANDO`, e o fluxo
 * "Conectar → facial → Buscando → oferta" nunca fechava.
 *
 * Repare que `BUSCANDO` **não** é desligado ao aceitar uma corrida: no
 * protótipo o status é do turno de trabalho, não da corrida, e continua
 * `BUSCANDO` durante `INDO_BUSCAR`/`EM_VIAGEM` (é `corridaStore` quem sabe se
 * há corrida). Durante a corrida a barra inferior nem aparece
 * (`mostrarUiMapa`), então isso não vaza para a tela.
 */
export type StatusSessao = 'OFFLINE' | 'CARREGANDO' | 'BUSCANDO';

export type HistoricoItem = {
  hora: string;
  endereco: string;
  valorFmt: string;
  valor: number;
  h: number;
};

export type PixDados = {
  nome: string;
  cpf: string;
  conta: string;
  digito: string;
  agencia: string;
  tipo: string;
};

export type ContaDados = {
  nome: string;
  email: string;
  tel: string;
};

/**
 * Os campos pessoais que guardam texto — todos os de `CampoConta` menos
 * `senha`, que é validada mas não armazenada.
 */
export type CampoTextoConta = Exclude<CampoConta, 'senha'>;

/** De qual chave da store cada campo editável vem. */
const CHAVE_DO_CAMPO: Record<CampoTextoConta, keyof MotoristaState> = {
  nome: 'contaNome',
  email: 'contaEmail',
  tel: 'contaTel',
  cidade: 'contaCidade',
};

type MotoristaState = {
  // Sessão de trabalho
  status: StatusSessao;

  // Ganhos e histórico
  ganhos: number;
  dinamico: number;
  historico: HistoricoItem[];

  // Foto de perfil
  foto: FotoStatus;
  /**
   * Caminho da imagem escolhida pela pessoa, já copiada para o diretório de
   * documentos (`src/servicos/imagemPerfil.ts`). `null` significa "tem foto de
   * cadastro, mas ainda não trocou por uma própria" — nesse caso o avatar
   * desenha o placeholder chapado do protótipo.
   *
   * É separado de `foto` porque as duas perguntas são diferentes: `foto` diz
   * se existe foto de cadastro (é o `temFoto` do protótipo, que controla o
   * banner "Adicionar agora" da verificação facial); `fotoUri` diz o que
   * desenhar.
   */
  fotoUri: string | null;

  // Banner e camada do mapa
  banner: boolean;
  camada: boolean;

  // Veículos
  veiculos: Veiculo[];
  veiculoAtivo: number;

  // Conta
  contaNome: string;
  contaEmail: string;
  contaTel: string;
  /**
   * Cidade onde o motorista roda. No protótipo era a string `'São Paulo'`
   * cravada no template de `telaConfig` — virou dado porque a linha passou a
   * ser editável (B21).
   */
  contaCidade: string;
  /**
   * Quando a senha foi trocada pela última vez, em ISO. `null` = nunca trocou
   * desde a instalação.
   *
   * A senha em si **não** é guardada, nem aqui nem em disco. Não há servidor
   * neste app: guardar o texto digitado só criaria uma senha em claro no
   * AsyncStorage do aparelho, que qualquer backup levaria junto, sem nada em
   * troca — não existe nada para autenticar contra. O que a tela precisa saber
   * é apenas que a troca aconteceu, e é isso que fica registrado.
   */
  senhaAtualizadaEm: string | null;
  contaSalvo: boolean;

  // Pix
  pix: PixDados;

  // Preferências de categoria (por tipo de veículo ativo)
  categoriasDesativadas: string[];

  // Ações
  /**
   * Troca o status da sessão. Quem orquestra as transições é
   * `src/servicos/simuladorCorridas.ts` (B26) — as telas só leem `status`.
   */
  setStatus: (status: StatusSessao) => void;
  registrarGanho: (valor: number, dinamicoValor: number, item: HistoricoItem) => void;
  adicionarHistorico: (item: HistoricoItem) => void;
  fecharBanner: () => void;
  toggleCamada: () => void;
  /**
   * Grava a imagem escolhida. Recebe o URI já persistido por
   * `escolherFotoDePerfil`; a store não conhece picker nem sistema de arquivos.
   */
  definirFoto: (uri: string) => void;
  removerFoto: () => void;
  ativarVeiculo: (i: number) => void;
  adicionarVeiculo: (v: Veiculo) => void;
  /**
   * Exclui o veículo do índice dado (B23).
   *
   * Funcionalidade nova: no protótipo a lista só cresce (`salvarVeiculo`,
   * logic.js 600-608) — não há como remover nada.
   *
   * **Nunca remove o último.** `veiculoAtivo` é um índice e o app inteiro
   * assume que existe um veículo ativo: o pill do menu lateral (B24) e as
   * categorias de Preferências de serviços (B15) saem do `tipo` dele. Zero
   * veículos é um estado que nenhuma tela sabe desenhar e do qual o motorista
   * não conseguiria trabalhar — a tela nem oferece a lixeira nesse caso, e a
   * guarda aqui é a rede de segurança.
   */
  removerVeiculo: (indice: number) => void;
  salvarConta: (dados: ContaDados) => void;
  /**
   * Grava **um** campo pessoal — é o que a tela de Configurações (B21) faz,
   * uma linha por vez, enquanto a de Editar conta (B22) grava os três de uma
   * vez com `salvarConta`.
   *
   * Recebe o valor já normalizado por `src/servicos/campoConta.ts`; a store não
   * formata telefone nem apara espaço, só guarda.
   */
  salvarCampoConta: (campo: CampoTextoConta, valor: string) => void;
  /**
   * Registra que a senha foi trocada. Repare que não recebe a senha: quem
   * valida a força é `CAMPOS_CONTA.senha.validar`, e o texto digitado morre na
   * folha de edição (ver `senhaAtualizadaEm`).
   */
  registrarTrocaDeSenha: () => void;
  enviarPix: (dados: PixDados) => boolean;
  toggleCategoria: (nome: string) => void;
};

/**
 * Veículos iniciais — modelo e placas TROCADOS em relação ao protótipo, que
 * usava dados possivelmente ligados à pessoa que gravou o vídeo original
 * (ver DESIGN_SYSTEM.md §2.9). Placas em formato Mercosul fictício.
 */
const VEICULOS_INICIAIS: Veiculo[] = [
  { tipo: 'MOTO', modelo: 'HONDA CG 160 START', placa: 'ABC1D23 (PRATA)', arte: 'foto moto' },
  { tipo: 'CARRO', modelo: 'Sem modelo', placa: 'XYZ9K87', arte: 'foto carro' },
  { tipo: 'BIKE', modelo: 'Sem modelo', placa: 'QRS4M56', arte: 'foto bike' },
];

/**
 * Validação do formulário de Pix — regra exata do protótipo (logic.js linha
 * 444): nome > 2, cpf > 5, conta > 3 caracteres, após `trim()`.
 *
 * Exportada além de usada por `enviarPix` porque a tela (B19) precisa saber, a
 * cada tecla, se pinta o botão "Continuar" de amarelo ou de cinza — e o botão
 * não pode chamar `enviarPix` só para descobrir isso, já que a ação grava.
 * Sem este export, a regra acabaria duplicada na tela e as duas cópias
 * divergiriam com o tempo.
 */
export function pixValido(dados: PixDados): boolean {
  return (
    dados.nome.trim().length > 2 &&
    dados.cpf.trim().length > 5 &&
    dados.conta.trim().length > 3
  );
}


/**
 * B28 — o recorte do estado que vai para o disco.
 *
 * `Pick` em vez de uma lista solta de strings: se um campo for renomeado no
 * `MotoristaState`, o TypeScript quebra aqui em vez de deixar o app gravando
 * uma chave que ninguém mais lê. O raciocínio de cada inclusão/exclusão está
 * na tabela em `src/servicos/armazenamento.ts`.
 */
type MotoristaPersistido = Pick<
  MotoristaState,
  | 'ganhos'
  | 'dinamico'
  | 'historico'
  | 'foto'
  | 'fotoUri'
  | 'veiculos'
  | 'veiculoAtivo'
  | 'contaNome'
  | 'contaEmail'
  | 'contaTel'
  | 'contaCidade'
  | 'senhaAtualizadaEm'
  | 'pix'
  | 'categoriasDesativadas'
>;

export const useMotoristaStore = create<MotoristaState>()(
  persist<MotoristaState, [], [], MotoristaPersistido>(
    (set, get) => ({
      status: 'OFFLINE',

      ganhos: 0,
      dinamico: 0,
      historico: [],

      foto: 'ok',
      fotoUri: null,

      banner: true,
      camada: true,

      veiculos: VEICULOS_INICIAIS,
      veiculoAtivo: 0,

      // Nomes fictícios genéricos — não reutilizar dados pessoais do protótipo.
      contaNome: 'Bruno Ferreira',
      contaEmail: 'bruno.ferreira@exemplo.com',
      contaTel: '+55 11 91234-5678',
      contaCidade: 'São Paulo',
      senhaAtualizadaEm: null,
      contaSalvo: false,

      pix: { nome: '', cpf: '', conta: '', digito: '', agencia: '', tipo: 'Conta corrente' },

      categoriasDesativadas: [],

      setStatus: (status) => set({ status }),

      registrarGanho: (valor, dinamicoValor, item) => {
        set((s) => ({
          ganhos: Math.round((s.ganhos + valor) * 100) / 100,
          dinamico: Math.round((s.dinamico + dinamicoValor) * 100) / 100,
          historico: s.historico.concat([item]),
        }));
      },

      adicionarHistorico: (item) => {
        set((s) => ({ historico: s.historico.concat([item]) }));
      },

      fecharBanner: () => set({ banner: false }),

      toggleCamada: () => set((s) => ({ camada: !s.camada })),

      /**
       * O protótipo simulava 1400ms de upload (`foto: 'enviando'` → `'ok'`,
       * logic.js linha 553). O atraso saiu: a imagem é local e já está copiada
       * em disco quando esta ação é chamada, então esperar não representaria
       * nada — só atrasaria o retorno visual.
       *
       * O estado `'enviando'` continua existindo no tipo, e é aqui que ele
       * volta a ser usado no dia em que houver upload de verdade para um
       * servidor.
       */
      definirFoto: (uri) => {
        apagarFotoDePerfil(get().fotoUri);
        set({ foto: 'ok', fotoUri: uri });
      },

      removerFoto: () => {
        apagarFotoDePerfil(get().fotoUri);
        set({ foto: 'vazio', fotoUri: null });
      },

      ativarVeiculo: (i) => {
        set({ veiculoAtivo: i, categoriasDesativadas: [] });
      },

      adicionarVeiculo: (v) => {
        set((s) => ({
          veiculos: s.veiculos.concat([v]),
          veiculoAtivo: s.veiculos.length,
          categoriasDesativadas: [],
        }));
      },

      removerVeiculo: (indice) => {
        const { veiculos, veiculoAtivo } = get();
        if (indice < 0 || indice >= veiculos.length) return;
        if (veiculos.length <= 1) return;

        /**
         * `veiculoAtivo` é um índice, então tirar um item do meio do array
         * **move** o veículo ativo de lugar. Sem este ajuste, excluir um
         * veículo acima do ativo faria a moldura amarela pular sozinha para o
         * card de baixo.
         *
         * Ao remover o próprio ativo, o `min` mantém a mesma posição na lista
         * (o de baixo sobe para o lugar) e só recua quando era o último.
         */
        const novoAtivo =
          indice < veiculoAtivo
            ? veiculoAtivo - 1
            : indice > veiculoAtivo
              ? veiculoAtivo
              : Math.min(veiculoAtivo, veiculos.length - 2);

        set({
          veiculos: veiculos.filter((_, i) => i !== indice),
          veiculoAtivo: novoAtivo,
          /**
           * As categorias desativadas valem para o `tipo` do veículo ativo
           * (B15). Só precisam ser zeradas quando o ativo de fato mudou — se o
           * excluído foi outro, o veículo ativo continua sendo o mesmo objeto e
           * apagar as preferências dele seria uma perda gratuita. É por isso
           * que aqui não se repete o reset incondicional de `ativarVeiculo`.
           */
          ...(indice === veiculoAtivo ? { categoriasDesativadas: [] } : null),
        });
      },

      salvarConta: (dados) => {
        set({
          contaNome: dados.nome,
          contaEmail: dados.email,
          contaTel: dados.tel,
          contaSalvo: true,
        });
      },

      /**
       * `contaSalvo` **não** é mexido aqui de propósito: ele é o "Alterações
       * salvas ✓" do botão da tela de Editar conta (B22). Ligá-lo a partir
       * daqui faria aquele botão anunciar um salvamento que não aconteceu
       * naquela tela.
       */
      salvarCampoConta: (campo, valor) => {
        set({ [CHAVE_DO_CAMPO[campo]]: valor } as Pick<
          MotoristaState,
          'contaNome' | 'contaEmail' | 'contaTel' | 'contaCidade'
        >);
      },

      registrarTrocaDeSenha: () => {
        set({ senhaAtualizadaEm: new Date().toISOString() });
      },

      enviarPix: (dados) => {
        const pixOk = pixValido(dados);
        if (pixOk) {
          set({ pix: dados });
        }
        return pixOk;
      },

      toggleCategoria: (nome) => {
        const off = get().categoriasDesativadas;
        const ligada = off.indexOf(nome) === -1;
        set({
          categoriasDesativadas: ligada ? off.concat([nome]) : off.filter((x) => x !== nome),
        });
      },
    }),
    {
      name: CHAVE_MOTORISTA,
      storage: armazenamentoDe<MotoristaPersistido>(),
      version: VERSAO_ARMAZENAMENTO,
      migrate: migrarEstadoMotorista,

      /** Ver a tabela de `src/servicos/armazenamento.ts`. */
      partialize: (s) => ({
        ganhos: s.ganhos,
        dinamico: s.dinamico,
        historico: s.historico,
        foto: s.foto,
        fotoUri: s.fotoUri,
        veiculos: s.veiculos,
        veiculoAtivo: s.veiculoAtivo,
        contaNome: s.contaNome,
        contaEmail: s.contaEmail,
        contaTel: s.contaTel,
        contaCidade: s.contaCidade,
        senhaAtualizadaEm: s.senhaAtualizadaEm,
        pix: s.pix,
        categoriasDesativadas: s.categoriasDesativadas,
      }),

      /**
       * O caminho da foto sobrevive ao restart, mas o **arquivo** pode não ter
       * sobrevivido: reinstalação, restauração de backup, limpeza do sistema.
       * Reidratar sem conferir deixaria um `<Image>` apontando para o nada — e
       * um `<Image>` quebrado no React Native não avisa, só fica em branco.
       *
       * Voltar para o placeholder de cadastro é o resultado honesto: a foto
       * própria de fato não está mais lá.
       *
       * (`foto: 'enviando'` é normalizado pelo mesmo motivo — hoje esse estado
       * nem chega a ser gravado, já que a troca de foto é instantânea, mas a
       * guarda continua barata e protege dados de builds anteriores.)
       */
      onRehydrateStorage: () => (estado) => {
        if (!estado) return;
        if (estado.foto === 'enviando') estado.foto = 'ok';
        if (estado.fotoUri && !fotoExiste(estado.fotoUri)) estado.fotoUri = null;
      },
    }
  )
);

// Reexportadas para conveniência das telas que consomem esta store
// (evita duplicar as constantes; fonte real é `src/servicos/mapaFalso.ts`).
export { CATEGORIAS, TIPOS_CONTA, TILES, fmt };
