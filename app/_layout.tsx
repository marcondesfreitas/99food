/**
 * Layout raiz (B25) + o que precisa viver acima de qualquer tela (B26).
 *
 * Quatro responsabilidades, nesta ordem de aninhamento:
 *
 * 1. `GestureHandlerRootView` — o `react-native-gesture-handler` exige esse
 *    provider na raiz da árvore. Sem ele o pan/zoom do mapa
 *    (`src/components/mapa/MapaBase.tsx`) e o arrastar do drawer falham em
 *    silêncio, sem erro de build nem de tipo.
 *
 * 2. `SafeAreaProvider` — `DrawerMenu` (B24) chama `useSafeAreaInsets()`.
 *    Sem o provider o hook devolve zeros e o avatar do menu encosta na barra
 *    de status. Não era necessário enquanto as telas eram testadas isoladas;
 *    passa a ser agora que existe uma árvore só.
 *
 * 3. Os dois simuladores (B26). Ambos precisam viver **acima** de qualquer
 *    tela, porque no protótipo eles moram no `componentDidMount` da raiz
 *    (logic.js linhas 147-152), não em cada tela:
 *
 *    - `demandaStore.tickDemanda()` a cada 2400ms — as zonas de calor
 *      continuam esquentando e esfriando mesmo com o app numa tela empurrada;
 *    - `simuladorCorridas` — os timers de oferta atravessam a navegação
 *      inteira (o agendamento feito na verificação facial precisa sobreviver à
 *      volta ao mapa).
 *
 *    Os dois cleanups juntos são o `componentWillUnmount` do protótipo, e são
 *    o que garante o critério de aceite de B26: nenhum timer fantasma.
 *
 * 4. O carregamento da Inter (B01). `src/tema/tipografia.ts` já aponta todo
 *    `fontFamily` para `Inter_400Regular`/`_500Medium`/… — exatamente os pesos
 *    que o protótipo puxa do Google Fonts (`.dc.html` linha 14:
 *    `family=Inter:wght@400;500;600;700;800`). Só que no React Native um
 *    `fontFamily` não registrado não dá erro: o texto cai calado na fonte do
 *    sistema (Roboto no Android, San Francisco no iOS). Sem este `useFonts`
 *    os tokens de tipografia eram letra morta e o app não tinha a fonte do
 *    protótipo. Os `.ttf` vêm do `@expo-google-fonts/inter` e são locais ao
 *    bundle, então a espera é de alguns quadros, não de rede.
 *
 * A pilha em si é só um contêiner: `index` redireciona e `(motorista)` tem o
 * próprio `Stack` com todas as telas. Por isso `headerShown: false` — cada
 * tela desenha o próprio cabeçalho (`CabecalhoPush`, B05).
 */

import { useEffect } from 'react';
import { View } from 'react-native';
/**
 * Imports **profundos**, um por peso, e não o `from '@expo-google-fonts/inter'`
 * da raiz. O `index.js` do pacote faz `require` dos 18 arquivos da família
 * (todos os pesos × normal/itálico), e o Metro empacota tudo o que é exigido
 * ali — o `import` nomeado não poda nada, porque `require` de asset não é
 * tree-shakeable. No build web isso eram 6 MB de fonte para 5 pesos usados.
 */
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from '@expo-google-fonts/inter/useFonts';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  encerrarSimulador,
  iniciarSimulador,
} from '@/servicos/simuladorCorridas';
import { Insights } from '@/components/ui/Insights';
import { encerrarSom, iniciarSom } from '@/servicos/som';
import { useDemandaStore } from '@/state/demandaStore';
import { cores } from '@/tema/cores';

export default function RootLayout() {
  // Os cinco pesos que `tipografia.ts` referencia — nem um a mais: cada peso
  // extra é um .ttf a mais dentro do bundle.
  const [fontesCarregadas] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // `componentDidMount`/`componentWillUnmount` do protótipo (logic.js 147-152).
  useEffect(() => {
    const { iniciarTick, pararTick } = useDemandaStore.getState();
    iniciarTick();
    iniciarSimulador();
    // B27: os players de áudio são criados AQUI, uma vez, e não no momento da
    // oferta — decodificar o arquivo na hora atrasaria justamente o instante
    // que o som deveria marcar (ARQUITETURA.md §7).
    iniciarSom();
    return () => {
      pararTick();
      encerrarSimulador();
      encerrarSom();
    };
  }, []);

  return (
    <>
      {/*
        Título da página na web — o nome que aparece na aba, no favorito e no
        atalho da tela de início. Duas armadilhas, as duas verificadas no
        HTML gerado:

        1. Tem de vir por este `<Head>`, e não por um `<title>` escrito em
           `app/+html.tsx`. O router gerencia o `<head>` e emite o próprio
           `<title>` antes daquele arquivo; havendo dois, o navegador usa o
           primeiro — e o dele sai vazio. Este `<Head>` preenche justamente
           essa tag em vez de criar outra.
        2. Tem de ficar FORA do portão das fontes abaixo. Na exportação web o
           app é renderizado uma vez no build, e nesse instante `useFonts`
           ainda devolve `false`: com o `<Head>` dentro do `return` de baixo,
           o `return` curto do carregamento o pulava e o título saía vazio.

        Em iOS e Android o componente é inerte.
      */}
      <Head>
        <title>99 Motorista</title>
      </Head>

      {!fontesCarregadas ? (
        // Segurar a árvore por esses poucos quadros é o que a doc do
        // `expo-font` pede (lá com `expo-splash-screen`, que este projeto não
        // usa): sem isso o texto aparece em Roboto e troca para Inter com a
        // tela já visível. A cor é a base do gradiente da splash
        // (`CoberturaSplash`, B10), então a espera se lê como o primeiro
        // quadro da splash, não como uma tela em branco.
        <View style={{ flex: 1, backgroundColor: cores.amareloSplash }} />
      ) : (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }} />
            {/* Web Vitals para o painel da Vercel. Não desenha nada. */}
            <Insights />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      )}
    </>
  );
}
