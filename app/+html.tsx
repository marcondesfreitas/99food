/**
 * `+html.tsx` — o documento HTML que envolve o app na web.
 *
 * Arquivo especial do Expo Router: só existe na web, roda **uma vez, no
 * build**, e nunca no cliente. Nada de hooks, estado ou dado de runtime aqui —
 * o que sai daqui é HTML estático.
 *
 * ## Por que ele passou a existir
 *
 * Sem este arquivo o Expo gera um `<head>` mínimo: título, viewport e o
 * favicon. Só isso. E é o que faltava para o app funcionar como app quando
 * adicionado à tela de início do celular:
 *
 * - **Sem `<link rel="manifest">`**, o Android não sabe o nome, a cor nem os
 *   ícones do atalho. Ele improvisa a partir do favicon — e como o favicon do
 *   99 é transparente, o sistema compõe essa transparência sobre preto. Era
 *   daí que vinha o "9 com fundo preto".
 * - **Sem `<link rel="apple-touch-icon">`**, o iPhone faz pior: usa uma
 *   miniatura da própria página como ícone.
 *
 * O manifesto e os ícones vivem em `public/`, cujo conteúdo o
 * `expo export -p web` copia inteiro para `dist/`.
 *
 * ## Detalhes que parecem descuido e não são
 *
 * - `{children}` aparece só no `<body>`. É o contrato do Expo Router: a árvore
 *   do app entra ali, e o `<head>` é escrito à mão.
 * - `<ScrollViewStyleReset>` é o reset que o `react-native-web` exige na raiz;
 *   sem ele o `<body>` rola junto com os `ScrollView` internos e a tela treme.
 *   O Expo já o injeta no HTML padrão — ao assumir o `<head>`, passa a ser
 *   responsabilidade nossa.
 */

import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/*
          O `<title>` NÃO vem daqui. O Expo Router gerencia o `<head>` com
          react-helmet e sempre emite um `<title>` próprio antes deste arquivo;
          quando dois títulos existem, o navegador usa o primeiro — e o dele
          sairia vazio. Quem define o título é `<Head>` em `app/_layout.tsx`,
          que preenche justamente essa tag. Verificado no navegador: com um
          `<title>` escrito aqui, `document.title` continuava vazio.
        */}

        {/* Android/Chrome: nome, ícones e cores do atalho. */}
        <link rel="manifest" href="/manifest.json" />

        {/*
          iOS ignora o manifesto e só olha para estas tags. O ícone tem fundo
          branco de propósito: o iPhone não respeita transparência em
          `apple-touch-icon` e preenche o vazio com preto — conferido no arquivo
          servido: 180×180, 0% de pixels transparentes.

          ## O `?v=`

          O iPhone guarda o ícone junto com o atalho e não volta a buscá-lo:
          quem adicionou o app à tela de início antes desta versão continua com
          o ícone antigo para sempre. Mudar a URL é o que faz o iOS tratá-lo
          como um arquivo novo na próxima vez que o app for adicionado. Ao
          trocar a arte do ícone, **suba este número**.

          ## Por que 512, e não os 180 que a tela de início usa

          Um "brilho" na borda dos 9 no atalho instalado é sinal de **ampliação**:
          o iOS usa o mesmo `apple-touch-icon` em vários lugares (tela de início,
          Ajustes, Spotlight, alternador de apps) e em alguns deles precisa de
          mais pixels do que os 180 tinham. Ampliar borra a borda, e borda
          borrada de amarelo sobre branco lê exatamente como um halo.

          Servindo um mestre de 512 o iOS só **reduz**, nunca amplia — e redução
          não cria halo. A arte é a mesma: `apple-touch-icon-512.png` é o
          `icone-512.png` com os cantos transparentes achatados sobre branco
          (`scripts/achatar-png.mjs`), sem nenhum outro retoque. Conferido pixel
          a pixel: a transição da borda é branco → 1 pixel de suavização →
          amarelo cheio, igual à do arquivo original.

          `precomposed` pede que o iOS não aplique brilho nem borda próprios
          sobre a arte — a outra origem possível de brilho, esta do sistema.
        */}
        <link
          rel="apple-touch-icon"
          sizes="512x512"
          href="/icones/apple-touch-icon-512.png?v=3"
        />
        <link
          rel="apple-touch-icon-precomposed"
          sizes="512x512"
          href="/icones/apple-touch-icon-512.png?v=3"
        />
        <link rel="icon" type="image/png" sizes="192x192" href="/icones/icone-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icones/icone-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* Nome padronizado do `apple-mobile-web-app-capable`; o Chrome já
            avisa que a versão com prefixo está obsoleta. Os dois ficam: iOS
            só entende o antigo. */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="99 Motorista" />

        {/*
          `black-translucent` é o que faz o app ocupar a TELA TODA no iPhone.

          Com o valor anterior (`default`), o iOS desenha uma barra de status
          opaca e começa a webview logo abaixo dela — daí a faixa branca sobrando
          no topo quando o app é aberto pela tela de início. Com
          `black-translucent` a barra vira transparente e o conteúdo passa a ser
          desenhado por baixo dela, de borda a borda.

          Isso combina com o layout do app, e não é coincidência: as telas vêm
          do frame 390×844 do protótipo, que já é a tela cheia do iPhone com a
          barra de status por cima. Os cabeçalhos de 111px com o conteúdo
          alinhado embaixo existem justamente para reservar esse espaço — é por
          isso que nada some atrás do relógio nem do notch, e por isso o app não
          usa `SafeAreaProvider` em lugar nenhum.

          Depende de `viewport-fit=cover` no viewport acima; sem ele o iOS
          ignora o valor.
        */}
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        <meta name="theme-color" content="#F8D60B" />

        <ScrollViewStyleReset />

        {/*
          Complementa o reset do Expo (`#root,body,html{height:100%}`).

          ## Por que `position: fixed` e não uma altura

          Medir altura no iOS em modo `standalone` é terreno movediço: com a
          barra de status translúcida, `height: 100%` e `100dvh` podem resolver
          para a tela MENOS a barra, e o app fica curto — sobrava uma faixa no
          rodapé, que é exatamente o problema que esta regra resolve.

          Ancorar o `#root` nas quatro bordas (`top/right/bottom/left: 0`)
          contorna a questão: não há altura a calcular, o elemento é esticado
          até os limites da viewport, seja ela qual for. É a receita conhecida
          para PWA em tela cheia no iOS.

          `height/width: auto` desfazem o `height: 100%` do reset do Expo, que
          de outro modo brigaria com o `bottom: 0`.

          ## O resto

          - Fundo de `html`/`body`: é o que aparece se algum pixel escapar do
            app. Agora é o MESMO grafite da folha inferior do mapa
            (`coresMapaEscuro.superficie`). Enquanto a tela era clara, o branco
            se confundia com ela; com o mapa em tema escuro, o mesmo branco
            virou uma tarja acesa embaixo do painel — foi o que apareceu na
            captura do aparelho. Igualando as duas cores, qualquer sobra deixa
            de ser visível, seja qual for a altura que o iOS reporte.
          - `overscroll-behavior: none` mata o efeito elástico que descolava o
            app das bordas ao arrastar o mapa.
        */}
        <style
          id="tela-cheia"
          dangerouslySetInnerHTML={{
            __html: `
              html, body { background-color: #1C1E21; overscroll-behavior: none; }

              /*
                Altura do app: ancorada nas quatro bordas, sem altura calculada.

                Historico util, porque este ponto ja foi mexido tres vezes e
                cada tentativa piorou de um jeito diferente:

                1. Script medindo innerHeight numa variavel CSS. Quando o iOS
                   devolvia medida velha, o script a CONGELAVA e o app ficava
                   presq curto. Removido.
                2. height: 100lvh. A viewport GRANDE do iOS veio MAIOR que a
                   area visivel, entao o app passou a ser mais alto que a tela e
                   a barra inferior saiu de vista, encobrindo o botao Conectar.
                   Removido.
                3. inset: 0 (esta versao). Sem altura declarada, sem unidade e
                   sem JavaScript: o navegador estica o elemento entre as bordas
                   e recalcula sozinho. E o comportamento mais previsivel dos
                   tres, e o unico que nunca deixou o app maior que a tela.

                Sem crase neste comentario: ele vive dentro de um template
                literal, e uma crase aqui encerraria a string.
              */
              #root {
                position: fixed;
                top: 0;
                right: 0;
                left: 0;
                width: auto;
                height: auto;
                bottom: 0;
              }
            `,
          }}
        />


      </head>
      <body>{children}</body>
    </html>
  );
}
