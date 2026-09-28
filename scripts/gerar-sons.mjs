/**
 * Gera os três efeitos sonoros de `assets/sons/` — WAV PCM 16-bit mono 44.1kHz.
 *
 *   node scripts/gerar-sons.mjs
 *
 * São **placeholders sintetizados**, não áudio licenciado: `contextos/B27` diz
 * que conseguir os arquivos de som está fora do escopo do bloco, mas um
 * `require()` de arquivo inexistente quebra o bundle do Metro. Sintetizar
 * resolve os dois lados — o app fica audivelmente completo e ninguém precisa
 * caçar licença de sample.
 *
 * Para trocar por áudio de verdade, basta substituir os arquivos em
 * `assets/sons/`; `src/servicos/som.ts` não muda. (Se o formato final for
 * `.mp3`, como previa o `ARQUITETURA.md §4`, é só ajustar os três `require`
 * lá — o `expo-audio` toca os dois formatos.)
 *
 * Síntese pura (senoides + harmônico + envelope), sem nenhuma dependência.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TAXA = 44100;

// Envelope ADSR simplificado: ataque e release curtos evitam o "clique" que
// aparece quando a onda começa/termina fora do zero.
function envelope(i, total, ataqueS = 0.008, releaseS = 0.06) {
  const ataque = ataqueS * TAXA;
  const release = releaseS * TAXA;
  if (i < ataque) return i / ataque;
  if (i > total - release) return Math.max(0, (total - i) / release);
  return 1;
}

// Um tom com leve decaimento exponencial — soa mais a "sino" que a "bipe puro".
function tom(freq, duracaoS, ganho = 0.5, decaimento = 3) {
  const total = Math.round(duracaoS * TAXA);
  const saida = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    const t = i / TAXA;
    const corpo = Math.sin(2 * Math.PI * freq * t)
      + 0.25 * Math.sin(2 * Math.PI * freq * 2 * t); // 2º harmônico, dá timbre
    saida[i] = corpo * ganho * Math.exp(-decaimento * t) * envelope(i, total);
  }
  return saida;
}

function silencio(duracaoS) {
  return new Float32Array(Math.round(duracaoS * TAXA));
}

function concatenar(...partes) {
  const total = partes.reduce((n, p) => n + p.length, 0);
  const saida = new Float32Array(total);
  let pos = 0;
  for (const p of partes) { saida.set(p, pos); pos += p.length; }
  return saida;
}

function paraWav(amostras) {
  const dados = Buffer.alloc(amostras.length * 2);
  for (let i = 0; i < amostras.length; i++) {
    const v = Math.max(-1, Math.min(1, amostras[i]));
    dados.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const cabecalho = Buffer.alloc(44);
  cabecalho.write('RIFF', 0);
  cabecalho.writeUInt32LE(36 + dados.length, 4);
  cabecalho.write('WAVE', 8);
  cabecalho.write('fmt ', 12);
  cabecalho.writeUInt32LE(16, 16);        // tamanho do chunk fmt
  cabecalho.writeUInt16LE(1, 20);         // PCM
  cabecalho.writeUInt16LE(1, 22);         // mono
  cabecalho.writeUInt32LE(TAXA, 24);
  cabecalho.writeUInt32LE(TAXA * 2, 28);  // byte rate
  cabecalho.writeUInt16LE(2, 32);         // block align
  cabecalho.writeUInt16LE(16, 34);        // bits por amostra
  cabecalho.write('data', 36);
  cabecalho.writeUInt32LE(dados.length, 40);
  return Buffer.concat([cabecalho, dados]);
}

const destino = process.argv[2] ?? new URL("../assets/sons/", import.meta.url).pathname;

// Nova corrida: dois toques ascendentes, insistentes — precisa cortar o ruído
// da rua e ser reconhecível de relance.
const novaCorrida = concatenar(
  tom(880, 0.14, 0.55, 6),
  silencio(0.05),
  tom(1175, 0.22, 0.55, 4)
);

// Chegada: um toque só, mais grave e curto — é confirmação, não alerta.
const chegada = tom(659, 0.26, 0.42, 5);

// Sucesso: tríade maior ascendente (dó–mi–sol), fecha a corrida com resolução.
const sucesso = concatenar(
  tom(523, 0.12, 0.4, 7),
  tom(659, 0.12, 0.4, 7),
  tom(784, 0.3, 0.45, 3.5)
);

// `nova-corrida` saiu desta lista: o alerta de oferta hoje é um arquivo real
// (`assets/sons/nova-corrida.mp3`), fornecido para o app. A síntese do
// `novaCorrida` acima fica como referência caso o placeholder precise voltar —
// regravá-la aqui só recriaria um `.wav` que `som.ts` não usa mais.
for (const [nome, amostras] of [
  ['chegada.wav', chegada],
  ['sucesso.wav', sucesso],
]) {
  const wav = paraWav(amostras);
  writeFileSync(join(destino, nome), wav);
  console.log(nome, wav.length, 'bytes', (amostras.length / TAXA).toFixed(2) + 's');
}
