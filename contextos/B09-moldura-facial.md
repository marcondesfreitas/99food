# B09 — Moldura facial oval

**Onda:** 2 (paralelo com B05, B06, B07, B08, B24)
**Depende de:** B01 (tema)
**Bloqueia:** B12

## Objetivo

O componente visual da "verificação facial" — puramente decorativo/animado,
sem lógica de detecção real (o protótipo inteiro é simulado; ver
`ARQUITETURA.md §8`, nível A: "Simulada").

## Arquivos a criar

```
src/components/verificacao/MolduraFacialOval.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **388-451** (bloco `telaFacial`).
`.design-import/logic.js`: campos `facialVerificando/facialSucesso/facialFalha`,
`corOval`, `animOval`, `facialTexto` (linhas 538-544), e a máscara SVG com
`<ellipse>` (procurar `mascaraOvalV6` no `.dc.html`).

## Especificação

- Fundo escurecido (`rgba(18,20,24,.72)`) com um **recorte oval** de 240×320px
  no centro (via SVG `<mask>` com `<ellipse>` preta sobre retângulo branco —
  reproduzir com `react-native-svg` `<Mask>`+`<Ellipse>`, ou alternativa mais
  simples em RN: um `View` com `borderRadius` gigante recortando um
  preview de câmera dentro, já que RN não tem `clip-path`/`mask` de CSS).
- Preview de câmera (real, via `expo-camera` `CameraView facing="front"`,
  conforme `ARQUITETURA.md §8` nível A) dentro do recorte oval.
- Anel externo `neutro200` 4px + **arco de progresso** azul `#4A90D9` 4px que
  percorre 360° em ~6 segundos (`stroke-dasharray: 884`, `stroke-dashoffset`
  animando de 884 a 0 — `react-native-svg` `<Ellipse>` com os mesmos atributos,
  animado via Reanimated).
- Estados (prop `estado: 'verificando'|'sucesso'|'falha'`):
  - `verificando`: cor azul, arco progredindo, spinner pequeno embaixo, texto
    "Por favor, olhe diretamente para a câmera..."
  - `sucesso`: cor verde `#24D279`, check ✓ grande sobreposto, animação de
    "bater" (scale 1→1.06→1, 400ms), texto "Tudo certo!"
  - `falha`: cor vermelha `#EB312B`, animação de "tremer" (translateX
    -6,6,-4,4,0 em sequência, 300ms), texto "Não conseguimos verificar..." +
    botão "Tentar novamente"
- Acima do oval: preview pequeno da "foto do cadastro" com seta de comparação
  (ver bloco `semFoto`/`temFoto` no `.dc.html`, linhas ~410-425) — indica se o
  motorista tem foto de perfil cadastrada (vem de `motoristaStore.foto`, B03).

## Notas de tradução Web → RN

- `stroke-dasharray`/`stroke-dashoffset` animado → `react-native-svg` aceita
  ambos como props animáveis via Reanimated (`AnimatedProps` do
  `react-native-svg`, ou `Animated.createAnimatedComponent(Ellipse)`).
- Máscara oval sobre a câmera: se `react-native-svg` `<Mask>` não recortar a
  `<CameraView>` corretamente (masks de SVG não recortam Views nativas fora do
  próprio SVG), alternativa robusta: usar 4 `View`s retangulares (topo/baixo/
  esquerda/direita) coloridas com o escurecido, encaixadas ao redor de um
  container com `borderRadius: 9999` fazendo as vezes do oval — funciona bem
  para oval quase-circular como este (240×320, razão 3:4).
- Tremer/bater são sequências de `Animated.timing`/`withSequence` — copiar os
  keyframes exatos do CSS (`tremer`/`bateu` no `.dc.html`, dentro do `<style>` do `<helmet>`).

## Critério de aceite

- Os 3 estados (`verificando`/`sucesso`/`falha`) renderizam com as cores e
  animações certas quando a prop `estado` muda.
- O arco de progresso completa uma volta em ~6s quando `estado === 'verificando'`.
