# B26 — Fiação final do fluxo de estado

**Onda:** 4 (sequencial — depois de B25)
**Depende de:** B04, B11, B12, B13, B25
**Bloqueia:** B27, B28, B29

## Objetivo

Conectar de ponta a ponta o fluxo completo: Conectar → verificação facial →
Buscando → Oferta → Corrida (indo buscar → aguardando → em viagem) → Resumo →
volta ao mapa Buscando. Este bloco existe separado de B25 porque a navegação
"sabe para onde ir" mas a **decisão de quando** disparar cada transição é do
`corridaStore`/`motoristaStore` (B04/B03) reagindo a timers e eventos do
simulador — é aqui que o "quando" e o "para onde" se encontram.

## Fonte no protótipo

`.design-import/logic.js` inteiro, em especial a orquestração em
`conectar()`→`rodarFacial()`→`agendarOferta()`→`gerarOferta()`→`aceitar()`→
`avancarCorrida()`→`finalizar()`→`concluirResumo` (linhas 304-401 e 550-556).

## Especificação

- O botão "Conectar" do mapa (B11) chama uma ação que:
  1. Muda status para `CARREGANDO` por 1400ms
  2. Navega para a tela facial (B12) via `router.replace`
  3. Facial roda sozinha (6100ms) e ao suceder, 900ms depois navega de volta
     ao mapa com status `BUSCANDO`
  4. Agenda a primeira oferta em 3400ms (`agendarOferta`)
- `demandaStore.tickDemanda()` deve rodar continuamente em background desde o
  `componentDidMount` equivalente (montagem do app ou da tela de mapa) a cada
  2400ms, **mesmo com o app em telas empurradas** (B14-B23) — no protótipo o
  `setInterval` vive na raiz do componente, não em cada tela. Decidir onde
  este intervalo mora em RN: sugestão — dentro da própria `demandaStore`,
  iniciado uma vez no layout raiz (`app/_layout.tsx`) e nunca desmontado
  enquanto o app estiver aberto.
- Card de oferta (B08, dentro de B11) aparece quando `corridaStore.oferta`
  existe; aceitar/recusar chamam as ações de B04.
- Painel de corrida (B08, dentro de B11) aparece quando `corridaStore.corrida`
  existe; os botões de avançar chamam `avancarCorrida()`; deslizar em
  `EM_VIAGEM` chama `finalizar()`, que:
  1. Credita `motoristaStore.registrarGanho(...)`
  2. Navega para Resumo (B13) via `router.replace`
- Resumo → botão "Enviar" chama `concluirResumo` → volta ao mapa em `BUSCANDO`,
  agenda próxima oferta em 4000ms.
- **Loop do piloto automático** (`iniciarLoop`, B04): precisa estar rodando
  exatamente enquanto `corridaStatus` é `INDO_BUSCAR` ou `EM_VIAGEM` e cancelado
  ao desmontar/trocar de tela — testar especialmente a transição
  Corrida→Resumo (o loop deve parar, não continuar rodando "invisível").

## Critério de aceite

- Rodar o fluxo do início ao fim sem nenhuma interação manual além de tocar
  "Conectar" e, quando a oferta chegar, tocar em "Aceitar", depois "Cheguei" →
  "Iniciar viagem" → deslizar para finalizar → "Enviar" no resumo — chegando
  de volta ao mapa em estado "Buscando", pronto para receber a próxima oferta.
- Sair do app no meio de qualquer etapa (ex.: fechar durante `INDO_BUSCAR`) e
  reabrir não deixa timers "fantasmas" rodando nem trava o app.
