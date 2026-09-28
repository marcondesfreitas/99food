/**
 * B25 — A pilha de navegação do app.
 *
 * Duas camadas, como pede `contextos/B25-navegacao.md`:
 *
 * - **`mapa`** é o fundo da pilha e nunca sai dele. Tudo que no protótipo
 *   aparece *sobreposto ao mapa* — splash, drawer, card de oferta, painel de
 *   corrida — é overlay dentro de `mapa.tsx`, não rota. Assim o gesto de
 *   voltar do sistema não fecha um card de oferta por acidente.
 *
 * - **Telas cheias com cabeçalho próprio** são rotas: as dez de `PUSH_TELAS`
 *   (logic.js linha 58), mais `verificacao-facial` e `resumo`.
 *
 * ## Transição
 *
 * `animation: 'slide_from_right'` é o push horizontal do `DESIGN_SYSTEM.md
 * §12.2`. No iOS o `react-native-screens` já entrega o efeito completo da
 * especificação — tela nova entrando da direita, tela de trás recuando ~30%
 * com véu, e gesto de borda para voltar. No Android o recuo parcial da tela de
 * trás não existe no navegador nativo: a transição fica sendo só o slide da
 * tela nova. É uma diferença conhecida e aceita (reproduzir o -30% exigiria um
 * animador customizado, fora do escopo deste bloco).
 *
 * ## Gesto de voltar
 *
 * `gestureEnabled: true` liga o arrastar da borda esquerda em todas as telas
 * empurradas — é o `bordaDown/bordaMove/bordaUp` do protótipo (logic.js
 * 260-272), que aqui não precisa ser reimplementado à mão.
 *
 * Ele fica **desligado** em `verificacao-facial` e `resumo`: são telas que o
 * fluxo atravessa com `replace`, e voltar delas por gesto não faria sentido
 * (não se volta para uma corrida já finalizada).
 *
 * `predictiveBackGestureEnabled` está `false` no `app.json` — sem isso, o
 * gesto preditivo do Android 14+ animaria a saída do app por baixo da pilha.
 *
 * ## Para onde volta
 *
 * O `‹` de cada tela empurrada NÃO usa `router.back()`: usa `voltarDe()` de
 * `src/servicos/navegacao.ts`, que carrega a tabela de `voltarPush` do
 * protótipo (`prefservicos`→`prefsolic`, `carteira`/`pix`→`central`,
 * `config`→`perfil`, `teste`→`prefsolic`).
 */

import { Stack } from 'expo-router';

/**
 * Garante que `mapa` seja o fundo da pilha mesmo quando o app abre direto numa
 * tela empurrada (deep link, ou recarga do Fast Refresh numa rota interna).
 * Sem isto, `voltarDe(...)` cairia numa pilha vazia.
 */
export const unstable_settings = {
  initialRouteName: 'mapa',
};

export default function MotoristaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      {/* Tela base — entra sem animação, é o fundo da pilha. */}
      <Stack.Screen name="mapa" options={{ animation: 'none' }} />

      {/*
        Telas cheias do fluxo de corrida: sem gesto de voltar.

        DESVIO DELIBERADO: o protótipo troca de tela sem transição nenhuma
        (`setState({ tela: 'facial' })`), o que num app nativo vira um corte
        seco entre o mapa e a câmera. `fade` suaviza sem inventar um movimento
        que não existe na fonte. Para colar 100% no protótipo, é trocar por
        `'none'` nestas duas linhas.
      */}
      <Stack.Screen
        name="verificacao-facial"
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="resumo"
        options={{ animation: 'fade', gestureEnabled: false }}
      />

      {/* As dez telas empurradas herdam `slide_from_right` + gesto de borda. */}
      <Stack.Screen name="prefsolic" />
      <Stack.Screen name="prefservicos" />
      <Stack.Screen name="teste" />
      <Stack.Screen name="central" />
      <Stack.Screen name="carteira" />
      <Stack.Screen name="pix" />
      <Stack.Screen name="perfil" />
      <Stack.Screen name="config" />
      <Stack.Screen name="conta" />
      <Stack.Screen name="veiculos" />
    </Stack>
  );
}
