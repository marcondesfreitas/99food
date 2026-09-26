# B13 — Tela Resumo da corrida

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (Estrelas), B04 (dados do resumo gerados por `finalizar()`)
**Bloqueia:** B25

## Objetivo

Tela cheia mostrada após `finalizar()` — valor animado subindo, decomposição
base+dinâmico, avaliação do passageiro.

## Arquivo a criar

```
app/(motorista)/resumo.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **452-498** (bloco `telaResumo`).
`.design-import/logic.js`: `finalizar()` linhas 367-392 (monta o objeto `resumo`
e anima `resumoValor` de 0 até o valor final com easing cúbico ao longo de
~900ms via `requestAnimationFrame`), `estrelasLista`/`concluirResumo` (linhas 555-556).

## Especificação

- "Corrida finalizada" + valor grande (`displayXl`) **animado subindo** de 0
  até o valor final (~900ms, easing `1 - (1-t)^3` — ease-out cúbico).
- Card com decomposição: "Corrida R$ X,XX" + "Tarifa dinâmica [faixa] R$ Y,YY"
  (cor `#C98A25` para o valor dinâmico).
- Dois cards lado a lado: quilômetros e minutos da corrida.
- "Como foi a viagem?" + 5 estrelas tocáveis (componente `Estrelas` de B05).
- Botão "Enviar" (amarelo) → volta ao mapa em "Buscando", agenda próxima oferta
  em 4000ms (`concluirResumo`).
- Botão secundário "Ver Ganhos" (ou nome similar) → Central de Ganhos (B17) — conferir se existe no protótipo além do botão Enviar (linha final do template, truncada na extração original — reconferir em `.design-import/...html` em torno da linha 498 antes de implementar).

## Notas de tradução Web → RN

- Animação de contagem: `requestAnimationFrame` funciona igual em RN; ou usar
  Reanimated `withTiming` num `useSharedValue` e formatar o valor exibido via
  `useDerivedValue` + `useAnimatedProps` num `TextInput` animado (padrão comum
  em RN para números "subindo" com fonte tabular) — ou mais simples: replicar
  o loop de rAF chamando `setValor()` local a cada frame, é só uma tela, não
  precisa de otimização extra.

## Critério de aceite

- Ao finalizar uma corrida, o valor sobe visualmente até o total certo, e os
  números de km/min/decomposição batem com os dados da corrida.
