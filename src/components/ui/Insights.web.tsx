/**
 * Insights — Vercel Speed Insights (só web).
 *
 * Coleta as métricas de Web Vitals (LCP, CLS, INP…) e envia para o painel do
 * projeto na Vercel, em *Speed Insights*.
 *
 * ## Por que não é o import do Next
 *
 * O trecho que circula na documentação é
 * `import { SpeedInsights } from '@vercel/speed-insights/next'` — e esse ponto
 * de entrada é **exclusivo do Next.js**: ele lê a rota pelos hooks do
 * `next/navigation`, que não existem aqui. Este projeto é Expo Router sobre
 * `react-native-web`, então o ponto de entrada correto é o `/react`, que recebe
 * a rota por prop. É o mesmo produto e o mesmo painel; muda só quem informa a
 * rota.
 *
 * ## A rota importa
 *
 * Sem `route`, todas as medições seriam atribuídas à URL em que a pessoa
 * entrou, e um app de navegação interna como este acumularia tudo em `/mapa`.
 * Passando o `usePathname()` do Expo Router, cada tela aparece separada no
 * painel — que é o que torna o dado acionável.
 *
 * ## Onde ligar
 *
 * O painel do projeto na Vercel precisa ter **Speed Insights ativado**; sem
 * isso o script é servido mas nada é gravado. É um botão em
 * Project → Speed Insights.
 */

import { usePathname } from 'expo-router';
import { SpeedInsights } from '@vercel/speed-insights/react';

export function Insights() {
  return <SpeedInsights route={usePathname()} />;
}

export default Insights;
