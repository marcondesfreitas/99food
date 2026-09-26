# B08 — Componentes de corrida (oferta e painel de status)

**Onda:** 2 (paralelo com B05, B06, B07, B09, B24)
**Depende de:** B01 (tema), B03 (tipos de ganhos/formatação), B04 (tipos de `Oferta`/`Corrida`/`StatusCorrida`)
**Bloqueia:** B11

## Objetivo

Os dois componentes mais importantes da experiência: o card de oferta (bottom
sheet que aparece quando chega uma corrida) e o painel de status durante a
corrida (bottom sheet com 3 alturas/snaps). `DESIGN_SYSTEM.md §3.4` chama o
card de oferta de "componente mais importante" — capriche.

## Arquivos a criar

```
src/components/corrida/CardOferta.tsx
src/components/corrida/PainelStatus.tsx
src/components/corrida/SeloDinamico.tsx
src/components/corrida/BotaoDeslizarFinalizar.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html`:
- Card de oferta: bloco `temOferta` (linhas ~231-300 aprox., procurar `oferta.valorFmt`)
- Painel de corrida: bloco `emCorrida` (linhas ~301-343, procurar `alturaSheet`)

`.design-import/logic.js`:
- Geração/campos da oferta: `gerarOferta()` linhas 317-339
- Snap do painel: `alturaSheet: s.snap === 0 ? 150 : s.snap === 1 ? 330 : 470` linha 492, `alternarSnap` linha 493
- Deslizar para finalizar: `slideDown/slideMove/slideUp` linhas 394-400, e no `renderVals` linhas 507-508

## Especificação

### `CardOferta`
Bottom sheet preto (`#26292E`), cantos 20px só no topo, entra de baixo
(`translateY 100%→0`, ~320ms, easing tipo `cubic-bezier(.2,.8,.2,1)`).
De cima para baixo:
1. Fileira de chips: "Pgto. no app", "Prioritário" (verde), número do card (círculo)
2. Valor `R$ 19,00` — `displayXl`, branco, com leve "pulse" quando `fase === 'expirando'`
3. "R$ 1,22/km" — `corpoSm`, cinza claro
4. Barra de tempo (altura 5, fundo `#353A48`, preenchimento verde `#24D279`,
   encolhe da direita pra esquerda via `transform: scaleX` com `animation-duration = duracao segundos`, linear)
5. Selo de dinâmico (`SeloDinamico` — ver abaixo)
6. Linha de credibilidade: nota + corridas + chip "Perfil Essencial"
7. Origem (ponto verde + tempo + endereço) e destino (ponto laranja + tempo + endereço)
8. Botão recusar (fora do sheet, topo direito, "✕ Não afeta a TA") + o próprio
   card inteiro é clicável para aceitar (`onClick aceitar` no `<div>` do sheet)

Props: `oferta`, `duracaoSegundos`, `fase: 'ativo'|'expirando'`, `onAceitar`, `onRecusar`.

### `SeloDinamico`
Pill/linha com ícone "$" e texto "R$ 5,70 · Tarifa base dinâmica incl.",
cor `#F4C372`. Reutilizado no resumo da corrida (B13) também — por isso é
componente separado.

### `PainelStatus`
Bottom sheet branco, altura anima entre 3 snaps (150/330/470px) ao tocar na
"alça" (handle de 40×4). Conteúdo: avatar+nome+nota do passageiro, badge de
status (`A caminho`/`No local`/`Em viagem`), card do trecho atual (embarque ou
destino), 3 ícones de ação (ligar/mensagem/cancelar), e o botão de ação
principal que muda 3 formas:
- **"andando"** (indo buscar ou em viagem, sem chegada): texto cinza com
  pontinhos pulsando, sem interação — via prop `variante="andando"`
- **botão simples** ("Cheguei" amarelo, ou "Iniciar viagem" verde) — via
  `variante="botao"`, prop `rotulo`, `cor`, `onPress`
- **deslizar para finalizar** (`BotaoDeslizarFinalizar`) — só no estado `EM_VIAGEM`

Props: `corrida`, `corridaStatus`, `snap (0|1|2)`, `onAlternarSnap`,
`variante`, `onAvancar`.

### `BotaoDeslizarFinalizar`
Trilho preto arredondado, texto "Deslize para finalizar →" que esmaece
conforme o usuário arrasta, botão circular amarelo que se move com o dedo
(`translateX`). Solta e volta se não passar de ~250px de 302px totais; se
passar, completa a animação até o fim e dispara `onFinalizar`. Implementar com
`react-native-gesture-handler` `PanGestureHandler` + Reanimated
`useAnimatedStyle`, replicando `slideDown/slideMove/slideUp` (`logic.js` 394-400).

## Notas de tradução Web → RN

- `onPointerDown/Move/Up` (Pointer Events da web) → `PanResponder` ou, melhor,
  `react-native-gesture-handler` (`Gesture.Pan()`), que já está nas deps de B00.
- A barra de tempo que "encolhe" via CSS `animation: shrink Ns linear` →
  Reanimated `withTiming(0, {duration: N*1000, easing: Easing.linear})` no
  `scaleX`, disparado quando o componente monta/quando `duracaoSegundos` muda.
- Altura do bottom sheet animando entre snaps → `Animated.spring` ou Reanimated
  `withSpring`/`withTiming` no `height`, não em `transform` (o protótipo anima
  `height` diretamente com `transition: height 260ms cubic-bezier(...)`) —
  animar `height` em RN funciona mas é menos performático que `transform`;
  para este protótipo é aceitável, otimizar depois se necessário.

## Critério de aceite

- `CardOferta` com dados mockados mostra todos os campos e a barra de tempo
  esgota visualmente no tempo certo.
- `PainelStatus` alterna corretamente entre os 3 snaps ao tocar na alça.
- `BotaoDeslizarFinalizar` só dispara `onFinalizar` quando arrastado além do
  limiar, e volta suavemente caso contrário.
