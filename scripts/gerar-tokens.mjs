/**
 * Gera códigos novos para um lote de `src/dados/tokensAtivacao.ts`.
 *
 * Não grava nada sozinho — só imprime. Colar no catálogo é manual e de
 * propósito: é o momento de decidir descrição, validade e uso único do lote,
 * e um script que edita o arquivo por conta própria esconderia essa decisão.
 *
 *   node scripts/gerar-tokens.mjs [quantidade]
 *
 * `quantidade` default 24. Sem dependências: `crypto` do Node é a única
 * importação.
 */

import { randomBytes } from 'crypto';

// Sem 0/O, 1/I/L: são os pares que mais se confundem digitando num teclado
// de celular, e o campo de ativação não corrige nada (ver `ativacao.tsx`).
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const TAMANHO_CODIGO = 6;
const PREFIXO = 'MOT-';

function gerarCodigo() {
  const bytes = randomBytes(TAMANHO_CODIGO);
  let codigo = '';
  for (let i = 0; i < TAMANHO_CODIGO; i++) {
    codigo += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return PREFIXO + codigo;
}

function gerarLote(quantidade) {
  const vistos = new Set();
  const lote = [];
  while (lote.length < quantidade) {
    const codigo = gerarCodigo();
    // Colisão é rara (32^6 combinações) mas o custo de checar é zero.
    if (vistos.has(codigo)) continue;
    vistos.add(codigo);
    lote.push(codigo);
  }
  return lote;
}

const quantidade = Number(process.argv[2]) || 24;
const lote = gerarLote(quantidade);

console.log(`// ${quantidade} tokens novos — cole dentro de "codigos" de um`);
console.log('// lote novo em src/dados/tokensAtivacao.ts:');
console.log('');
for (const codigo of lote) {
  console.log(`      '${codigo}',`);
}
