/**
 * Achata um PNG RGBA sobre um fundo sólido e regrava como PNG RGB (sem canal
 * alfa nenhum).
 *
 * Existe porque o iPhone NÃO respeita transparência em `apple-touch-icon`:
 * onde há alfa ele pinta preto. O ícone de 512 tem os cantos arredondados
 * transparentes, então precisa desta passada antes de virar ícone de iOS.
 *
 *   node achatar-png.mjs entrada.png saida.png [R G B]
 *
 * Sem dependências: `zlib` do Node faz a compressão; o resto (chunks, filtros,
 * CRC) é o formato PNG na mão.
 */
import { readFileSync, writeFileSync } from 'fs';
import { inflateSync, deflateSync } from 'zlib';

const [, , entrada, saida, ...corArgs] = process.argv;
const FUNDO = corArgs.length === 3 ? corArgs.map(Number) : [255, 255, 255];

const arq = readFileSync(entrada);
if (arq.readUInt32BE(0) !== 0x89504e47) throw new Error('não é PNG');

// ---- Lê os chunks ---------------------------------------------------------
let pos = 8;
let larg = 0, alt = 0, bits = 0, tipoCor = 0, entrelacado = 0;
const idat = [];
while (pos < arq.length) {
  const tam = arq.readUInt32BE(pos);
  const tipo = arq.slice(pos + 4, pos + 8).toString('latin1');
  const dados = arq.slice(pos + 8, pos + 8 + tam);
  if (tipo === 'IHDR') {
    larg = dados.readUInt32BE(0);
    alt = dados.readUInt32BE(4);
    bits = dados[8];
    tipoCor = dados[9];
    entrelacado = dados[12];
  } else if (tipo === 'IDAT') idat.push(dados);
  else if (tipo === 'IEND') break;
  pos += 12 + tam;
}
if (bits !== 8 || tipoCor !== 6 || entrelacado !== 0) {
  throw new Error(`só trato RGBA 8 bits sem entrelace (bits=${bits} tipo=${tipoCor} entrelace=${entrelacado})`);
}

// ---- Desfaz os filtros ----------------------------------------------------
const bruto = inflateSync(Buffer.concat(idat));
const bpp = 4;
const linhaBytes = larg * bpp;
const px = Buffer.alloc(alt * linhaBytes);

const paeth = (a, b, c) => {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
};

let orig = 0;
for (let y = 0; y < alt; y++) {
  const filtro = bruto[orig++];
  const linha = bruto.slice(orig, orig + linhaBytes);
  orig += linhaBytes;
  const dest = y * linhaBytes;
  for (let i = 0; i < linhaBytes; i++) {
    const a = i >= bpp ? px[dest + i - bpp] : 0;
    const b = y > 0 ? px[dest - linhaBytes + i] : 0;
    const c = i >= bpp && y > 0 ? px[dest - linhaBytes + i - bpp] : 0;
    let v = linha[i];
    if (filtro === 1) v += a;
    else if (filtro === 2) v += b;
    else if (filtro === 3) v += (a + b) >> 1;
    else if (filtro === 4) v += paeth(a, b, c);
    px[dest + i] = v & 0xff;
  }
}

// ---- Achata sobre o fundo, saindo em RGB ----------------------------------
const saidaLinha = larg * 3;
const cru = Buffer.alloc(alt * (1 + saidaLinha));
let opacosParciais = 0;
for (let y = 0; y < alt; y++) {
  cru[y * (1 + saidaLinha)] = 0; // filtro None
  for (let x = 0; x < larg; x++) {
    const s = y * linhaBytes + x * 4;
    const a = px[s + 3] / 255;
    if (a < 1) opacosParciais++;
    const d = y * (1 + saidaLinha) + 1 + x * 3;
    for (let ch = 0; ch < 3; ch++) {
      cru[d + ch] = Math.round(px[s + ch] * a + FUNDO[ch] * (1 - a));
    }
  }
}

// ---- Reescreve o PNG ------------------------------------------------------
const tabelaCrc = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = tabelaCrc[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (tipo, dados) => {
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tam, corpo, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(larg, 0); ihdr.writeUInt32BE(alt, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

writeFileSync(saida, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(cru, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]));

console.log(JSON.stringify({
  entrada, saida, tamanho: larg + 'x' + alt,
  pixelsComAlfaAchatados: opacosParciais,
  bytes: readFileSync(saida).length,
}, null, 2));
