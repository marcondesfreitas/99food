/**
 * Foto de perfil — escolher da galeria ou tirar na hora, e guardar em disco.
 *
 * Funcionalidade **nova**, fora do protótipo: lá os dois botões da folha de
 * opções (`.dc.html` linhas 1071-1072) chamam o mesmo `tirarFoto` falso, que só
 * troca um enum de estado e pinta um retângulo listrado. Aqui a imagem é real.
 *
 * ## Por que a imagem é copiada em vez de referenciada
 *
 * O `expo-image-picker` devolve um URI dentro do diretório de **cache** do app
 * (`.../ImagePicker/xxx.jpg`). O sistema operacional pode limpar esse diretório
 * a qualquer momento — e como B28 persiste o caminho da foto, o app reabriria
 * apontando para um arquivo que não existe mais, com o avatar quebrado e nenhum
 * jeito óbvio de entender por quê.
 *
 * Copiar para `Paths.document` (o diretório que a documentação descreve como
 * "safe from being deleted by the system") resolve na origem: o que é
 * persistido só some quando o app remove.
 *
 * ## Por que o nome do arquivo muda a cada troca
 *
 * O `<Image>` do React Native cacheia por URI. Se a foto nova gravasse por cima
 * do mesmo caminho, a tela continuaria mostrando a antiga até o cache expirar.
 * Um sufixo de timestamp garante URI novo a cada troca — e a foto anterior é
 * apagada logo depois, então não sobra lixo acumulando.
 *
 * ## Por que a web tem um caminho próprio
 *
 * O `expo-file-system` **não roda no navegador** — a documentação do SDK 57
 * lista só Android, iOS e tvOS. Tudo que envolve `Paths.document`, `Directory`
 * e `File` estoura ali. Como todo o fluxo abaixo é embrulhado num `try`, o erro
 * era engolido e a tela se comportava exatamente como se a pessoa tivesse
 * cancelado: a folha fechava, nada acontecia, nenhum aviso. Era esse o bug de
 * "não dá para trocar a foto de perfil" na versão web.
 *
 * Na web o picker também devolve um URI diferente: um `blob:`
 * (`URL.createObjectURL`), que vale só enquanto a página está aberta e morre no
 * recarregamento — inútil para um dado que B28 persiste. Por isso a web
 * converte a imagem para um `data:` URI, que carrega os próprios bytes e
 * sobrevive ao restart junto com o resto da store.
 *
 * Convertendo, aproveitamos para resolver dois problemas de uma vez:
 * o recorte quadrado (o `allowsEditing`/`aspect` do picker não existe na web) e
 * o tamanho — uma foto de celular vira ~5 MB em base64 e estoura sozinha a cota
 * do `localStorage`. Reduzir para 512px deixa o avatar em dezenas de KB.
 */

import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/** De onde a imagem vem — os dois itens da folha de opções do protótipo. */
export type OrigemFoto = 'camera' | 'galeria';

/** Subpasta em `Paths.document`, para não misturar com outros arquivos do app. */
const PASTA_PERFIL = 'perfil';

/**
 * Qualidade da compressão (0–1). 0,85 é o joelho da curva para uma foto de
 * avatar: acima disso o arquivo cresce sem diferença visível num círculo de
 * 96px.
 */
const QUALIDADE = 0.85;

/** Recorte quadrado — o avatar é sempre um círculo. */
const PROPORCAO: [number, number] = [1, 1];

/**
 * Lado máximo do avatar gravado na web, em pixels.
 *
 * 512 é folgado para um círculo que nunca passa de 96pt (dá margem para telas
 * de alta densidade) e mantém o `data:` URI na casa das dezenas de KB — bem
 * dentro da cota do `localStorage`, que é da ordem de 5 MB para o app inteiro.
 */
const LADO_MAXIMO_WEB = 512;

function pastaPerfil(): Directory {
  const pasta = new Directory(Paths.document, PASTA_PERFIL);
  if (!pasta.exists) pasta.create({ intermediates: true });
  return pasta;
}

/**
 * Abre a câmera ou a galeria, deixa a pessoa recortar, e devolve o URI da cópia
 * persistida. `null` quando ela cancela ou nega a permissão.
 *
 * A permissão é pedida no momento do uso, e não na montagem da tela: é o toque
 * em "Tirar foto" que explica ao sistema (e à pessoa) por que o app quer a
 * câmera.
 */
export async function escolherFotoDePerfil(
  origem: OrigemFoto
): Promise<string | null> {
  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: PROPORCAO,
    quality: QUALIDADE,
  };

  try {
    if (origem === 'camera') {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissao.granted) return null;
    } else {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissao.granted) return null;
    }

    const resultado =
      origem === 'camera'
        ? await ImagePicker.launchCameraAsync(opcoes)
        : await ImagePicker.launchImageLibraryAsync(opcoes);

    if (resultado.canceled) return null;

    const escolhida = resultado.assets?.[0];
    if (!escolhida) return null;

    return Platform.OS === 'web'
      ? await persistirNaWeb(escolhida.uri)
      : persistir(escolhida.uri);
  } catch {
    // Picker indisponível, permissão revogada no meio do caminho, disco cheio:
    // nada disso justifica derrubar a tela. Devolver `null` faz a UI se
    // comportar como se a pessoa tivesse cancelado.
    return null;
  }
}

/**
 * Versão web: recorta no centro, reduz para no máximo `LADO_MAXIMO_WEB` e
 * devolve um `data:` URI — ver o cabeçalho do arquivo.
 *
 * O `blob:` do picker é revogado no fim: já copiamos os bytes para o `data:`,
 * e deixá-lo vivo seguraria o arquivo inteiro na memória da aba.
 */
async function persistirNaWeb(uriBlob: string): Promise<string> {
  const imagem = await carregarImagem(uriBlob);

  // Recorte central quadrado, equivalente ao `aspect: [1, 1]` que o picker
  // aplica no nativo e ignora na web.
  const lado = Math.min(imagem.width, imagem.height);
  const destino = Math.min(lado, LADO_MAXIMO_WEB);

  const tela = document.createElement('canvas');
  tela.width = destino;
  tela.height = destino;

  const ctx = tela.getContext('2d');
  // Sem contexto 2D não há como redimensionar. Devolver o `blob:` é pior que
  // nada? Não: a foto aparece na sessão atual e some ao recarregar, que é
  // melhor do que não trocar a foto. E `fotoExiste` já descarta `blob:` na
  // reidratação, então o app não fica apontando para um URI morto.
  if (!ctx) return uriBlob;

  ctx.drawImage(
    imagem,
    (imagem.width - lado) / 2,
    (imagem.height - lado) / 2,
    lado,
    lado,
    0,
    0,
    destino,
    destino
  );

  const dataUri = tela.toDataURL('image/jpeg', QUALIDADE);
  URL.revokeObjectURL(uriBlob);
  return dataUri;
}

/** `<img>` carregada, para poder desenhar no canvas. */
function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagem = new window.Image();
    imagem.onload = () => resolve(imagem);
    imagem.onerror = () => reject(new Error('não foi possível ler a imagem'));
    imagem.src = src;
  });
}

/** Copia o arquivo temporário do picker para o diretório de documentos. */
function persistir(uriTemporario: string): string {
  const origem = new File(uriTemporario);
  const extensao = origem.extension || '.jpg';
  const destino = new File(pastaPerfil(), `foto-${Date.now()}${extensao}`);
  origem.copy(destino);
  return destino.uri;
}

/**
 * O arquivo ainda está lá?
 *
 * Usado ao reidratar o estado persistido (B28): entre uma sessão e outra o
 * usuário pode ter desinstalado/reinstalado, restaurado backup, ou o arquivo
 * pode ter sumido por qualquer outro motivo. Melhor cair no placeholder de
 * cadastro do que renderizar um `<Image>` apontando para o nada.
 */
export function fotoExiste(uri: string | null | undefined): boolean {
  if (!uri) return false;

  // Na web não há sistema de arquivos para consultar; a pergunta vira sobre a
  // forma do URI. Um `data:` carrega os próprios bytes e sempre é válido. Um
  // `blob:` gravado por uma sessão anterior está morto — a URL só vale
  // enquanto aquela aba viveu —, e é justamente isso que precisa ser
  // descartado para o avatar não ficar apontando para o nada.
  if (Platform.OS === 'web') return uri.startsWith('data:');

  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

/**
 * Apaga uma foto gravada. Silencioso de propósito: o arquivo pode já não
 * existir (troca dupla rápida, limpeza do sistema), e nesse caso o objetivo
 * — "essa foto não está mais lá" — já está cumprido.
 */
export function apagarFotoDePerfil(uri: string | null | undefined): void {
  if (!uri) return;

  // Na web não há arquivo a apagar: o `data:` mora dentro do próprio estado
  // persistido e some junto com ele. Um `blob:` que ainda esteja vivo vale
  // revogar para soltar a memória da aba.
  if (Platform.OS === 'web') {
    if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
    return;
  }

  try {
    const arquivo = new File(uri);
    if (arquivo.exists) arquivo.delete();
  } catch {
    // Ver acima.
  }
}
