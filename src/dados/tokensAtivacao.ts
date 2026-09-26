/**
 * Catálogo de tokens de ativação.
 *
 * É aqui — e só aqui — que se muda quais tokens o app aceita. A lógica que lê
 * este catálogo mora em `@/servicos/ativacao`; este arquivo é só dado.
 *
 * ## Como adicionar um lote novo
 *
 * `node scripts/gerar-tokens.mjs <quantidade>` imprime códigos novos, únicos
 * e com boa entropia (ver o script para o porquê do alfabeto). Cole o
 * resultado em `LOTES_TOKENS` abaixo, num objeto de lote novo — não misture
 * com um lote antigo, mesmo que os parâmetros sejam iguais: manter cada
 * remessa separada é o que permite revogar "todos os tokens que a Fulana
 * pegou terça" sem precisar caçar código por código.
 *
 * ## Revogar
 *
 * Remover um código (ou o lote inteiro) desta lista revoga imediatamente:
 * `ativacaoEstaValida` (em `ativacao.ts`) rejeita qualquer ativação cujo
 * token não esteja mais aqui, mesmo que o aparelho já estivesse liberado.
 */

export type TokenCatalogo = {
  /** Já normalizado: maiúsculo, sem espaço. Ver `normalizarToken`. */
  codigo: string;
  /** Só para humano lerem este arquivo — não aparece na UI do app. */
  descricao: string;
  /** Dias de validade a partir do momento em que ESTE token ativa um aparelho. */
  diasValidade: number;
  /**
   * `true`: depois de ativar um aparelho, o código não serve para ativar
   * outro (nem o mesmo aparelho de novo, após um reset). `false`: pensado
   * para QA/demonstração, onde travar por uso único atrapalharia mais do que
   * ajudaria.
   */
  usoUnico: boolean;
};

type LoteTokens = {
  /** Identifica o lote nos comentários/histórico — não é lido pelo código. */
  id: string;
  descricao: string;
  diasValidade: number;
  usoUnico: boolean;
  codigos: readonly string[];
};

const LOTES_TOKENS: readonly LoteTokens[] = [
  {
    id: 'qa-interno',
    descricao:
      'Token fixo para QA e demonstração interna. Reutilizável de propósito ' +
      '(usoUnico: false): travar por uso único aqui faria todo teste manual ' +
      'exigir gerar um token novo. Não distribuir a motorista real.',
    diasValidade: 30,
    usoUnico: false,
    codigos: ['MOTORISTA7'],
  },
  {
    id: '2026-09-lote-01',
    descricao:
      'Primeiro lote real de distribuição. Uso único, 7 dias — gerado com ' +
      '`node scripts/gerar-tokens.mjs 24`.',
    diasValidade: 7,
    usoUnico: true,
    codigos: [
      'MOT-HDR67M',
      'MOT-36MWCM',
      'MOT-JWC26M',
      'MOT-HBEQ8A',
      'MOT-KYWYDY',
      'MOT-PAX9DX',
      'MOT-UUKF7J',
      'MOT-3JWREA',
      'MOT-5B7F7A',
      'MOT-TBY6CU',
      'MOT-C83BXT',
      'MOT-RB3HDE',
      'MOT-5PYHA5',
      'MOT-GUS7PC',
      'MOT-PG49VS',
      'MOT-EX9YYU',
      'MOT-73D6WE',
      'MOT-ZUYTB4',
      'MOT-S6AZ2N',
      'MOT-Z2S8AS',
      'MOT-GV6J2M',
      'MOT-8B2XF7',
      'MOT-T9KHV5',
      'MOT-C95EG3',
    ],
  },
];

/** Achata os lotes num catálogo único — é isto que `ativacao.ts` consulta. */
export const CATALOGO_TOKENS: readonly TokenCatalogo[] = LOTES_TOKENS.flatMap(
  (lote) =>
    lote.codigos.map((codigo) => ({
      codigo,
      descricao: lote.descricao,
      diasValidade: lote.diasValidade,
      usoUnico: lote.usoUnico,
    }))
);
