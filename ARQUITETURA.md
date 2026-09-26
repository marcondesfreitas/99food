# Projeto "99 Motorista" (clone didático)

**Autor:** Lucas
**Stack:** React Native + Expo (SDK 57 / RN 0.86 / React 19.2)
**Backend:** nenhum — dados de corrida simulados localmente
**Objetivo:** aprender mapas & localização, layout, animações, cores, som, câmera com verificação facial e preço dinâmico com zonas de demanda

> Este documento é o plano. Nenhum código foi escrito ainda — ele define *o que* construir, *em que ordem* e *com quais bibliotecas*, para que a implementação seja só executar o roteiro.

---

## 1. Visão geral do produto

Um app para o **motorista** (não para o passageiro). O motorista abre o app, faz uma verificação facial ("selfie de segurança"), fica online, recebe ofertas de corrida no mapa, aceita, dirige até o passageiro, inicia a viagem, finaliza e vê os ganhos.

O passageiro e o servidor de despacho **não existem** — um "simulador de corridas" dentro do app gera ofertas em intervalos aleatórios, com origem/destino perto da posição atual do motorista. Isso é proposital: você aprende toda a parte difícil (mapa, estado, UI, sensores) sem gastar tempo com infraestrutura.

---

## 2. Fluxo principal (máquina de estados)

O coração do app é uma **máquina de estados da corrida**. Modelar isso primeiro evita 90% dos bugs.

```
        ┌──────────┐
        │ OFFLINE  │◄──────────────────────────┐
        └────┬─────┘                           │
             │ motorista toca "Ficar online"   │
             ▼                                 │
        ┌──────────┐   sem aceitar em 15s      │
   ┌───►│  ONLINE  │◄──────────┐               │
   │    └────┬─────┘           │               │
   │         │ simulador       │               │
   │         │ gera oferta     │ recusa/expira │
   │         ▼                 │               │
   │   ┌──────────────┐────────┘               │
   │   │ OFERTA_ATIVA │                        │
   │   └──────┬───────┘                        │
   │          │ aceita                         │
   │          ▼                                │
   │   ┌────────────────┐                      │
   │   │ INDO_BUSCAR    │  navegando até o passageiro
   │   └──────┬─────────┘                      │
   │          │ "Cheguei"                      │
   │          ▼                                │
   │   ┌────────────────┐                      │
   │   │ AGUARDANDO     │  esperando embarque  │
   │   └──────┬─────────┘                      │
   │          │ "Iniciar viagem"               │
   │          ▼                                │
   │   ┌────────────────┐                      │
   │   │ EM_VIAGEM      │                      │
   │   └──────┬─────────┘                      │
   │          │ "Finalizar"                    │
   │          ▼                                │
   │   ┌────────────────┐                      │
   └───┤ RESUMO_GANHOS  ├──────────────────────┘
       └────────────────┘
```

**Regra de ouro:** um único objeto `rideState` manda em tudo. O mapa, o painel de baixo, as cores, os sons e as animações apenas *reagem* a ele. Nunca duplique essa informação em vários lugares.

---

## 3. Telas

| # | Tela | Conteúdo | O que você aprende |
|---|------|----------|--------------------|
| 1 | **Splash / Login** | logo animada, campo de telefone fake, botão entrar | layout básico, `expo-splash-screen`, animação de entrada |
| 2 | **Verificação Facial** | câmera frontal, moldura oval, instrução "posicione o rosto", captura | `expo-camera`, permissões, overlay, feedback visual |
| 3 | **Home / Mapa** *(principal)* | mapa fullscreen, marcador do carro, camada de demanda com heatmap e legenda, botão Online/Offline, bottom sheet com status e ganhos do dia | mapas, GPS em tempo real, heatmap, bottom sheet, gestos |
| 4 | **Oferta de corrida** | card sobreposto ao mapa: valor com selo de dinâmico, distância, nota do passageiro, barra de tempo esgotando, botões Aceitar/Recusar | animação de entrada, timer, som de alerta, vibração |
| 5 | **Corrida em andamento** | mapa com rota traçada, painel com dados do passageiro, botão de ação que muda conforme o estado | polyline, mudança de UI por estado |
| 6 | **Resumo da corrida** | valor ganho, distância, tempo, avaliação do passageiro (estrelas) | animação de números subindo, componente de estrelas |
| 7 | **Ganhos** | lista de corridas do dia, total, gráfico simples de barras por hora | listas performáticas, visualização de dados |
| 8 | **Perfil** | foto, nota, dados do carro, alternador de tema claro/escuro | armazenamento local, tema |

---

## 4. Arquitetura de pastas

```
99motorista/
├── app/                          # rotas (Expo Router — navegação por arquivos)
│   ├── _layout.tsx               # layout raiz: providers, tema, fontes
│   ├── index.tsx                 # splash / login
│   ├── verificacao-facial.tsx
│   └── (motorista)/              # área logada
│       ├── _layout.tsx           # abas: Mapa | Ganhos | Perfil
│       ├── mapa.tsx
│       ├── ganhos.tsx
│       └── perfil.tsx
│
├── src/
│   ├── components/
│   │   ├── mapa/                 # MarcadorCarro, RotaPolyline, BotaoRecentrar
│   │   ├── demanda/              # HeatmapDemanda, ZonaPoligono, BolhaMultiplicador,
│   │   │                         # LegendaDemanda, ChipZonaQuente
│   │   ├── corrida/              # CardOferta, PainelStatus, BotaoAcaoCorrida, SeloDinamico
│   │   └── ui/                   # Botao, Card, Estrelas, Cronometro
│   │
│   ├── state/
│   │   ├── corridaStore.ts       # máquina de estados da corrida (Zustand)
│   │   ├── motoristaStore.ts     # online/offline, ganhos do dia, perfil
│   │   ├── demandaStore.ts       # zonas, multiplicadores, camada ligada/desligada
│   │   └── tipos.ts              # Corrida, Passageiro, Local, StatusCorrida, Zona
│   │
│   ├── servicos/
│   │   ├── simuladorCorridas.ts  # gera ofertas fake — o "servidor" do app
│   │   ├── simuladorDemanda.ts   # tick das zonas: demanda, surge, esfriamento
│   │   ├── precificacao.ts       # bandeirada, tarifas, multiplicador, teto
│   │   ├── localizacao.ts        # wrapper do expo-location
│   │   ├── rotas.ts              # gera polyline entre dois pontos
│   │   ├── som.ts                # toca alertas
│   │   └── armazenamento.ts      # AsyncStorage: histórico, perfil, tema
│   │
│   ├── tema/
│   │   ├── cores.ts              # paletas clara e escura
│   │   ├── tipografia.ts
│   │   └── espacamento.ts
│   │
│   └── utils/
│       ├── geo.ts                # distância haversine, bearing, interpolação, zona de um ponto
│       └── formato.ts            # moeda BRL, tempo, distância
│
├── assets/
│   ├── sons/                     # nova-corrida.mp3, chegada.mp3, sucesso.mp3
│   ├── imagens/
│   └── fontes/
│
├── app.json                      # config Expo, plugins, permissões, chave do mapa
└── package.json
```

**Por que essa divisão:** `app/` só desenha telas; `components/` só desenha pedaços; `state/` guarda a verdade; `servicos/` fala com o mundo externo (GPS, câmera, disco, "servidor" fake). Se um arquivo faz duas dessas coisas, ele está no lugar errado.

---

## 5. Modelo de dados (mock)

```ts
type Local = {
  latitude: number;
  longitude: number;
  endereco: string;      // "Rua das Flores, 123"
  bairro: string;
};

type Passageiro = {
  id: string;
  nome: string;
  nota: number;          // 1.0 a 5.0
  fotoUrl: string;
  totalViagens: number;
};

type StatusCorrida =
  | 'OFFLINE' | 'ONLINE' | 'OFERTA_ATIVA'
  | 'INDO_BUSCAR' | 'AGUARDANDO' | 'EM_VIAGEM' | 'FINALIZADA';

type Corrida = {
  id: string;
  passageiro: Passageiro;
  origem: Local;
  destino: Local;
  distanciaAteOrigemKm: number;
  distanciaViagemKm: number;
  duracaoEstimadaMin: number;

  valorBase: number;              // bandeirada + km + min
  multiplicador: number;          // 1.0 quando não há dinâmico
  zonaOrigemId: string;           // qual zona gerou o multiplicador
  valor: number;                  // valorBase × multiplicador — o que o motorista recebe

  categoria: '99Pop' | '99Comfort' | '99Entrega';
  status: StatusCorrida;
  criadaEm: number;               // timestamp
  expiraEm: number;               // timestamp — oferta some depois disso
};
```

### Como o simulador funciona

1. Enquanto `status === 'ONLINE'`, um `setTimeout` com intervalo aleatório (8–25 s) dispara uma nova oferta.
2. A oferta pega a posição atual do motorista e sorteia origem a 0,5–4 km e destino a 2–15 km dela, usando deslocamento em latitude/longitude.
3. O valor base sai de uma fórmula didática: `bandeirada + (km × tarifa_km) + (min × tarifa_min)`. Em cima dele entra o multiplicador **da zona onde a origem cai** — não um número aleatório, mas o valor calculado pelo simulador de demanda (seção 6).
   *Consequência interessante:* zonas quentes passam a gerar ofertas mais frequentes **e** mais caras, o que é exatamente o incentivo que o mecanismo existe para criar.
4. A oferta tem 15 segundos de vida. Se não aceitar, volta para `ONLINE`.
5. Durante `INDO_BUSCAR` e `EM_VIAGEM`, um "piloto automático" move o marcador do carro ao longo da rota a cada segundo, interpolando entre os pontos — assim você testa sem sair de casa.

---

## 6. Preço dinâmico e zonas de maior demanda

No app real isso tem dois lados que costumam ser confundidos:

- **Preço dinâmico (*surge*):** um multiplicador aplicado ao valor da corrida quando há mais passageiros pedindo do que motoristas disponíveis numa região. É o que faz a corrida sair por R$ 28 em vez de R$ 18.
- **Mapa de demanda (*heatmap*):** a visualização que sugere ao motorista *para onde ir* antes de a corrida existir. É uma ferramenta de decisão, não de cobrança.

Você quer aprender os dois. Eles compartilham a mesma fonte de dados — a "temperatura" de cada região — mas aparecem em lugares diferentes da UI.

### 6.1 Como dividir a cidade

Um mapa é contínuo, mas demanda precisa ser contada em pedaços. Três abordagens, da mais simples à mais realista:

| Abordagem | Como funciona | Complexidade |
|-----------|---------------|--------------|
| **Grade fixa** | quadrados de ~1 km definidos por arredondamento de lat/lng (`Math.floor(lat / 0.01)`) | ⭐ trivial — **comece aqui** |
| **Bairros (polígonos)** | lista fixa de polígonos com nome ("Centro", "Aeroporto") | ⭐⭐ precisa das coordenadas dos contornos |
| **Hexágonos (H3)** | biblioteca `h3-js` da Uber — é literalmente o que a Uber usa | ⭐⭐⭐ conceito novo, mas biblioteca pronta |

Hexágonos são superiores por um motivo bonito: todos os vizinhos de um hexágono ficam à mesma distância do centro, o que não acontece com quadrados (os vizinhos na diagonal ficam 41% mais longe). Isso torna cálculos de "espalhar demanda para os vizinhos" muito mais justos.

**Sugestão:** faça grade fixa primeiro, e migre para H3 no final como exercício — a interface do seu código não precisa mudar, só a função que converte coordenada em ID de zona.

### 6.2 Modelo de dados

```ts
type Zona = {
  id: string;                    // "z_-2352_-4663" ou hex H3
  centro: { latitude: number; longitude: number };
  nome?: string;                 // "Centro", "Zona Sul"

  // estado dinâmico, recalculado a cada tick
  passageirosAguardando: number;
  motoristasDisponiveis: number;
  multiplicador: number;         // 1.0 = normal, 2.5 = teto
  nivel: 'normal' | 'aquecida' | 'quente' | 'muito_quente';
  tendencia: 'subindo' | 'estavel' | 'caindo';
};
```

### 6.3 O algoritmo de surge

A regra central é razão entre oferta e procura:

```ts
function calcularMultiplicador(zona: Zona): number {
  const OFERTA_MINIMA = 1;          // evita divisão por zero
  const razao = zona.passageirosAguardando
              / (zona.motoristasDisponiveis + OFERTA_MINIMA);

  // razao = 1 → equilíbrio → 1.0x
  // razao = 4 → quatro passageiros por motorista → ~2.0x
  const bruto = 1 + Math.log2(Math.max(razao, 1)) * 0.5;

  const TETO = 2.5;
  const arredondado = Math.round(bruto * 10) / 10;   // 1.7x, não 1.6834x
  return Math.min(arredondado, TETO);
}
```

Três decisões de projeto valem ser entendidas, porque são as mesmas que os apps reais tomam:

1. **Log em vez de linear.** Se fosse `razao * 1.0`, uma zona com 20 pessoas e 1 motorista daria 20x — absurdo. O logaritmo faz o preço crescer rápido no começo e desacelerar depois.
2. **Teto obrigatório.** Sem limite, um evento (show, chuva forte, aeroporto) geraria valores absurdos. Fixe em 2.5x.
3. **Suavização temporal.** O multiplicador **não** deve pular de 1.0 para 2.3 em um segundo. Guarde o valor anterior e mova-se em direção ao novo aos poucos:
   ```ts
   const suavizado = anterior + (novo - anterior) * 0.25;  // 25% por tick
   ```
   Sem isso o mapa "pisca" e a UI fica nervosa. Esse detalhe é o que separa um protótipo de algo que parece profissional.

### 6.4 O simulador de demanda

Como não há passageiros reais, você gera a demanda — e é aqui que fica divertido, porque dá para simular a **cidade viva**:

```ts
// fatores que alteram a demanda base de cada zona
const FATORES = {
  horaDoDia: {      // pico manhã e fim de tarde
    7: 1.8, 8: 2.0, 9: 1.4, 12: 1.3,
    17: 1.9, 18: 2.2, 19: 1.7, 22: 1.2, 23: 1.5,
  },
  diaDaSemana: { sexta: 1.4, sabado: 1.6, domingo: 0.8 },
  chuva: 1.7,        // alterne com um botão de debug
  evento: 3.0,       // "show no estádio" — zona específica, janela de tempo
};
```

O tick do simulador (a cada ~10 s) faz, para cada zona: recalcula demanda base pelos fatores → adiciona ruído aleatório → move motoristas simulados em direção às zonas quentes (isso cria o efeito realista de a zona **esfriar sozinha** quando muitos motoristas vão para lá) → recalcula o multiplicador com suavização.

Esse loop de retroalimentação é o conceito mais interessante do módulo: o surge não é um número aleatório, é o resultado de um sistema que se autorregula.

### 6.5 A parte visual

| Elemento | Como fazer | Observação |
|----------|-----------|------------|
| **Heatmap** | componente `<Heatmap>` do `react-native-maps`, com `points` (lat/lng/weight), `radius` (10–50) e `gradient` customizado | ⚠️ **Só funciona com Google Maps** — no iOS exige `provider={PROVIDER_GOOGLE}` |
| **Zonas com contorno** | `<Polygon>` com `fillColor` semitransparente variando por nível | alternativa mais "legível" que o heatmap borrado |
| **Bolha de multiplicador** | `<Marker>` customizado com pill mostrando "1.8x" | some abaixo de 1.2x para não poluir |
| **Pulsação** | `withRepeat(withTiming(...))` do Reanimated no círculo da zona mais quente | chama atenção sem ser irritante |
| **Legenda** | barra de gradiente com rótulos "Normal → Muito alta" | acessibilidade: nunca comunique nível **só** por cor |

**Gradiente sugerido** (do frio ao quente, seguro para daltônicos — evita a dupla vermelho/verde):

```ts
const gradienteDemanda = {
  colors: ['#4A90D9', '#7FBF7F', '#F5C542', '#E8833A', '#D64545'],
  startPoints: [0.05, 0.25, 0.5, 0.75, 1.0],
  colorMapSize: 256,
};
```

### 6.6 Onde isso aparece na UI

- **No mapa (Home):** um botão de camada liga/desliga o heatmap. Estando `ONLINE`, aparece um chip discreto: *"Zona Sul está 1.8x — 3 km"* com botão "Ir para lá".
- **No card de oferta:** quando o multiplicador é maior que 1.0, o valor mostra o preço base riscado, o valor final destacado e um selo "1.8x dinâmico". A animação de entrada do selo é um bom exercício de Reanimated.
- **No resumo da corrida:** separe "corrida R$ 18,00 + dinâmico R$ 14,40" — bom exercício de compor a UI a partir de valores decompostos em vez de um total pronto.
- **Na tela de Ganhos:** total do dia com a fatia que veio de dinâmico. Ótima desculpa para o primeiro gráfico.

---

## 7. Bibliotecas por tema de aprendizado

| Tema | Biblioteca | Observação importante |
|------|-----------|----------------------|
| Navegação | **Expo Router** | roteamento por arquivos, já vem no template |
| Mapa | **`react-native-maps`** *(principal)* | maduro, muita documentação, funciona bem no Android com chave do Google Maps |
| Heatmap de demanda | **`<Heatmap>` do `react-native-maps`** | ⚠️ **só com Google Maps** — no iOS exige `provider={PROVIDER_GOOGLE}`; props: `points`, `radius` (10–50), `opacity`, `gradient` |
| Zonas hexagonais | `h3-js` (opcional) | a mesma indexação geoespacial usada pela Uber; deixe para o final |
| Mapa (alternativa) | `expo-maps` | oficial da Expo, mas **ainda em alpha** e com breaking changes frequentes — use só se quiser experimentar |
| Localização | **`expo-location`** | `watchPositionAsync` para seguir o motorista; background exige development build |
| Câmera | **`expo-camera`** | `CameraView` com `facing="front"` para a selfie |
| Detecção facial | **ML Kit via development build** | ⚠️ `expo-face-detector` foi **removido** do Expo. Ver seção 8. |
| Animações | **`react-native-reanimated`** + `react-native-gesture-handler` | animações a 60fps na thread de UI; base do bottom sheet |
| Bottom sheet | `@gorhom/bottom-sheet` | painel deslizante igual ao do app real |
| Som | **`expo-audio`** | substituiu o antigo `expo-av`; hook `useAudioPlayer` |
| Vibração | `expo-haptics` | feedback tátil ao chegar oferta |
| Estado | **Zustand** | mais simples que Redux, perfeito para iniciante |
| Armazenamento | `@react-native-async-storage/async-storage` | histórico de corridas e tema |
| Ícones | `@expo/vector-icons` | já incluso |

> **Regra prática:** instale sempre com `npx expo install <pacote>` (não `npm install`), assim o Expo escolhe a versão compatível com seu SDK.

---

## 8. O ponto delicado: verificação facial

Esse é o item que mais confunde iniciantes, então vale um plano explícito.

**O que mudou:** o pacote `expo-face-detector` foi **descontinuado e removido** do Expo (usava dependências sem suporte a ARM64, o que bloqueava a migração dos simuladores iOS). Não existe substituto oficial dentro do Expo Go.

**Suas três opções, da mais simples à mais completa:**

| Nível | Abordagem | O que exige | Bom para |
|-------|-----------|-------------|----------|
| **A — Simulada** | `expo-camera` + moldura oval + contagem regressiva "Segure o rosto no círculo" → captura foto → tela de "verificado". Nenhuma detecção real. | Nada além do Expo Go | **Comece por aqui.** Você aprende câmera, permissões, overlay, animação de progresso. 100% do valor visual, 0% de dor de configuração. |
| **B — Detecção real** | `react-native-vision-camera` + `react-native-vision-camera-face-detector` (ML Kit). Detecta rosto, olhos, sorriso, inclinação. Permite "prova de vida": *pisque*, *vire a cabeça*. | **Development build** (`npx expo run:android`), Android Studio instalado | Depois do módulo A funcionar. É onde mora o aprendizado sério de integração nativa. |
| **C — Reconhecimento** | Comparar rosto com foto cadastrada (AWS Rekognition, Face++, ou TensorFlow.js) | Conta em serviço externo | Fora do escopo — anote como "se sobrar tempo". |

**Recomendação:** faça **A** no módulo 6 e **B** no módulo 9, como upgrade. Não tente B primeiro; a configuração de development build derruba muita gente antes de ver a primeira tela na mão.

---

## 9. Roadmap de estudo — 11 módulos

Cada módulo é uma sessão de estudo fechada, com entrega visível. Não pule para o seguinte sem o anterior rodando no celular.

### Módulo 1 — Ambiente e primeiro "Olá"
Node 22+, `npx create-expo-app@latest`, app rodando no seu celular via Expo Go. Entender o que é `app.json`, o que é o Metro bundler, como recarregar.
**Entrega:** app em branco com seu nome na tela, rodando no celular físico.

### Módulo 2 — Fundamentos de layout e tema
`View`, `Text`, `Pressable`, Flexbox, `StyleSheet`. Criar `src/tema/cores.ts` com a paleta (o 99 usa amarelo/preto — escolha a sua). Montar a tela de login estática.
**Entrega:** tela de login bonita, sem funcionar ainda.
**Conceito-chave:** no React Native tudo é Flexbox, e `flexDirection` padrão é `column`, não `row`.

### Módulo 3 — Navegação
Expo Router: rotas por arquivo, layout de abas, navegação entre telas, passagem de parâmetros. Criar as 8 telas vazias com título.
**Entrega:** consegue navegar por todo o app, mesmo com telas vazias.

### Módulo 4 — Estado com Zustand
Criar `motoristaStore` (online/offline, ganhos) e `corridaStore` (a máquina de estados). Botão "Ficar online" que muda o estado e a cor do cabeçalho.
**Entrega:** botão que alterna online/offline com a UI reagindo em todas as telas.
**Conceito-chave:** a máquina de estados da seção 2, implementada com transições explícitas — uma função por transição, nunca `setStatus` solto pelo código.

### Módulo 5 — Mapa e localização ⭐
Chave do Google Maps no Google Cloud Console, `react-native-maps` na tela, permissão de localização, `watchPositionAsync`, marcador do carro seguindo você, botão de recentrar, estilo de mapa escuro personalizado.
**Entrega:** o carro no mapa se move quando você anda pela rua.
**Conceito-chave:** *nunca* faça `setState` a cada evento de GPS sem throttle — o mapa vai travar. Use `distanceInterval` e `timeInterval`.

### Módulo 6 — Câmera e verificação facial (nível A) ⭐
`expo-camera`, permissão, câmera frontal, overlay com recorte oval, instruções animadas, contagem regressiva, captura e preview da foto.
**Entrega:** fluxo de "verificação" completo e convincente, salvo localmente.

### Módulo 7 — Simulador de corridas + card de oferta ⭐
`simuladorCorridas.ts` gerando ofertas. `CardOferta` animado entrando de baixo com Reanimated, barra de tempo esgotando, botões Aceitar/Recusar. Som de alerta com `expo-audio` + vibração com `expo-haptics`.
**Entrega:** ficar online → tocar som → card aparece → aceitar muda o estado.
**Conceito-chave:** carregue o som *uma vez* na montagem, não a cada oferta.
*Nota:* aqui o `multiplicador` fica fixo em `1.0`. Já deixe o campo no modelo — o Módulo 9 só vai preenchê-lo com o valor real, sem mexer no resto do código.

### Módulo 8 — Corrida em andamento
Rota desenhada como `Polyline`, marcadores de origem/destino, carro andando sozinho pela rota (interpolação), painel de baixo mudando de conteúdo e cor a cada estado, botão de ação que muda de rótulo, `fitToCoordinates` ajustando o zoom.
**Entrega:** ciclo completo de corrida do aceite ao resumo.

### Módulo 9 — Preço dinâmico e zonas de demanda ⭐
Grade de zonas sobre o mapa, simulador de demanda com fatores de hora/dia/chuva/evento, cálculo do multiplicador com log + teto + suavização, `<Heatmap>` com gradiente customizado, botão de camada, chip "Zona Sul 1.8x", selo de dinâmico no card de oferta e preço decomposto no resumo. Painel de debug com botões "chover" e "criar evento" para você forçar cenários.
**Entrega:** o mapa mostra zonas quentes que esquentam e esfriam sozinhas, e uma corrida em zona quente paga mais — com o motivo visível na tela.
**Conceito-chave:** suavização temporal. Sem ela o multiplicador oscila a cada tick e o mapa pisca. Guarde o valor anterior e caminhe 25% em direção ao novo. Ver seção 6.

### Módulo 10 — Polimento: animações, sons, cores
Bottom sheet arrastável, transição entre telas, números do resumo subindo animados, estrelas de avaliação, tema claro/escuro, tela de ganhos com gráfico de barras, ícones e microinterações.
**Entrega:** o app parece um app de verdade.

### Módulo 11 — Nível avançado (opcional)
Development build (`npx expo run:android`), detecção facial real com ML Kit e prova de vida (piscar), localização em background, persistência do histórico, build de APK com EAS Build.
**Entrega:** APK instalável no seu celular sem Expo Go.

---

## 10. Preparação necessária antes do Módulo 5

- **Node.js 22.13+** instalado
- Conta Google → **Google Cloud Console** → criar projeto → ativar "Maps SDK for Android" → gerar chave de API → colocar em `app.json`
  *(o Google exige cartão de crédito para ativar, mas a cota gratuita é generosa e você não será cobrado nesse volume)*
- **Expo Go** instalado no celular (Play Store)
- A partir do Módulo 11: **Android Studio** com SDK e emulador

---

## 11. Armadilhas mais comuns (leia antes de gastar 3 horas)

1. **`npm install` em vez de `npx expo install`** → versões incompatíveis, erros crípticos no Metro.
2. **Mapa em branco no Android** → chave de API ausente, sem restrição correta, ou "Maps SDK for Android" não ativada no Cloud Console.
3. **Permissões negadas para sempre** → depois de negar duas vezes, o Android bloqueia; desinstale e reinstale o app para testar de novo.
4. **App travando ao seguir o GPS** → re-render a cada leitura. Use throttle e `useRef` para valores que não precisam redesenhar.
5. **Reanimated não funciona** → falta o plugin no `babel.config.js` (deve ser o *último* da lista) e um reinício do Metro com `--clear`.
6. **Tentar usar `expo-face-detector`** → não existe mais. Ver seção 8.
7. **Heatmap invisível no iOS** → o componente só funciona com Google Maps; sem `provider={PROVIDER_GOOGLE}` ele simplesmente não desenha, sem erro nenhum.
8. **Multiplicador piscando no mapa** → falta suavização temporal. Ver seção 6.3.
9. **Testar mapa/GPS no emulador** → o emulador tem GPS falso e parado; teste no celular real ou configure rota simulada no emulador.
10. **Não commitar cedo** → use Git desde o Módulo 1, um commit por módulo. Quando quebrar algo, você volta.

---

## 12. Como saber que terminou

O projeto está "pronto para portfólio" quando você consegue, no celular, sem tocar no código:

- fazer login e passar pela verificação facial
- ficar online e ver o mapa acompanhar sua posição real
- ver zonas de alta demanda no mapa e o multiplicador mudando com o tempo
- receber uma oferta com som e vibração, e aceitá-la
- ver o carro percorrer a rota até o passageiro e até o destino
- finalizar e ver o valor — decomposto em base + dinâmico — entrar no total de ganhos do dia
- fechar o app, reabrir, e o histórico de ganhos continuar lá

---

## 13. Avisos técnicos

Limitações reais do projeto — o que **não** dá para fazer e por quê. Nenhuma delas atrapalha o aprendizado; várias inclusive forçam você a construir a versão mais interessante.

| # | Limitação | Motivo técnico | Como contornar |
|---|-----------|----------------|----------------|
| 1 | Sem os assets originais (logo, ícones, fontes da marca) | não estão disponíveis publicamente em formato utilizável | desenhe os seus — é o exercício de layout e cores do Módulo 2. Use `@expo/vector-icons` e uma paleta própria |
| 2 | Sem a API real de despacho de corridas | é interna e autenticada; nenhum app de mobilidade expõe isso | o `simuladorCorridas.ts` faz esse papel — e te dá controle total sobre os cenários de teste |
| 3 | Sem as tarifas reais por cidade | não são públicas e mudam por região | fórmula própria em `precificacao.ts` (bandeirada + km + min). Você entende cada variável, o que é melhor para estudar |
| 4 | Sem rotas reais de trânsito | Google Directions API é paga acima da cota gratuita | interpole uma linha reta entre os pontos. Se quiser rota real depois, ative a Directions API na mesma chave do mapa |
| 5 | Heatmap não funciona no iOS sem Google Maps | o componente é implementado só no provider do Google | `provider={PROVIDER_GOOGLE}` no `<MapView>` |
| 6 | Detecção facial não roda no Expo Go | ML Kit precisa de código nativo compilado | development build (`npx expo run:android`) — Módulo 11 |
| 7 | Localização em background não roda no Expo Go (iOS) | exige entitlements nativos | development build, ou teste só em foreground |
| 8 | GPS parado no emulador | o emulador não tem sensor real | teste no celular físico, ou use rota simulada no Android Studio |

**Nome do app:** use o que quiser durante o desenvolvimento. Se um dia empacotar para outra pessoa instalar, troque por um nome seu ("DriveJá", "RotaFácil") — só para não confundir quem receber o APK.
