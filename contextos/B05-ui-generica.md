# B05 — Componentes de UI genérica

**Onda:** 2 (paralelo com B06, B07, B08, B09, B24)
**Depende de:** B01 (tema)
**Bloqueia:** B10, B13, B14, B15, B16, B17, B18, B19, B20, B21, B22, B23 (praticamente todas as telas)

## Objetivo

Componentes reutilizáveis sem estado de domínio — usados por quase toda tela.
Nenhum deles conhece `corridaStore`/`motoristaStore`; recebem tudo via props.

## Arquivos a criar

```
src/components/ui/Botao.tsx
src/components/ui/Card.tsx
src/components/ui/Toggle.tsx
src/components/ui/Estrelas.tsx
src/components/ui/AnelProgresso.tsx
src/components/ui/LinhaChecklist.tsx
```

## Fonte no protótipo

`DESIGN_SYSTEM.md §3.1, §3.6, §3.7, §3.10, §3.15` (especificação em prosa,
já pronta e é a referência primária deste bloco). Conferir valores exatos de
cor/animação contra `.design-import/RotaFacil Motorista v6.dc.html`:
- Anel de progresso: procurar `arcooval`/`stroke-dasharray` (usado na tela facial, B09, mas o componente genérico `AnelProgresso` é o mesmo padrão usado na tela de Teste de Status — ver linhas 570-643 do `.dc.html`, span `anelOffset`/`anelTexto` no `logic.js` linha 532)
- Checklist: `.dc.html` linhas 570-643, campo `checklist` no `logic.js` linhas 533-536
- Estrelas: `.dc.html` bloco `telaResumo` (452-498), campo `estrelasLista` no `logic.js` linha 555

## Especificação por componente

- **`Botao`** — pill amarelo `#F8D60B`, 56 de altura, `labelBtn`. Estados:
  `default` / `pressed` (`#E0C009`, scale .97) / `loading` (texto + 3 pontinhos
  pulsando defasados 400ms) / `disabled` (`neutro200` bg, `neutro400` texto).
  Prop `variant` para permitir outras cores (o app usa botão verde `#24D279`
  para "Iniciar viagem" — ver B08).
- **`Card`** — container branco, `raioCard` (12), padding 16, sombra flutuante opcional via prop.
- **`Toggle`** — trilho 51×31, `raioPill`. Off `neutro200`, On `amarelo500` com bolinha branca. Animar a transição de posição (Reanimated ou `Animated` simples, 150-200ms).
- **`Estrelas`** (avaliação, tocável) — 5 estrelas 48×48 tocáveis, cor `amarelo500` preenchida / `neutro200` vazia, `onChange(n)`.
  **`DistribuicaoEstrelas`** (somente leitura, usada no Perfil B20) — 5 linhas
  número+estrela+barra+contagem, ver `DESIGN_SYSTEM.md §3.10`. Pode viver no
  mesmo arquivo `Estrelas.tsx` como export separado.
- **`AnelProgresso`** — círculo 130px, stroke 10, trilho `neutro100`, preenchimento `sucesso500`, começa às 12h sentido horário (em SVG isso é `transform="rotate(-90 cx cy)"` + `strokeDashoffset` controlado por prop `progresso` 0-1). Centro: número grande + rótulo pequeno.
- **`LinhaChecklist`** — altura 58, 3 estados visuais (`pendente`/`testando`/`aprovado`) conforme `DESIGN_SYSTEM.md §3.7`. O ícone "testando" gira continuamente (`Animated.loop` de rotação, 1s/volta).

## Notas de tradução Web → RN

- CSS `@keyframes dot` (pontinhos pulsando) → 3 `Animated.Value` com delay
  escalonado, ou Reanimated `withDelay(withRepeat(withTiming(...)))`.
- SVG de anel de progresso: usar `react-native-svg` `<Circle>` com
  `strokeDasharray`/`strokeDashoffset` — mesma técnica do `arcooval` do
  protótipo (ver `.dc.html`, `stroke-dasharray="884"` no facial).
- Ícone de refresh girando: `Animated.loop(Animated.timing(rotate, {toValue:1, duration:1000, easing: Easing.linear}))`.

## Critério de aceite

- Cada componente renderiza isoladamente (Storybook-like, ou uma tela de
  teste temporária) mostrando todos os estados documentados acima.
- Nenhum componente importa `zustand` ou os stores.
