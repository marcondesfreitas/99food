# B11 — Tela Mapa/Home ⭐ (bloco mais complexo do plano)

**Onda:** 3 (paralelo com as demais telas — mas dê mais tempo/tokens a este)
**Depende de:** B02, B03, B04, B06, B07, B08, B24 (praticamente tudo das ondas 1-2)
**Bloqueia:** B25

## Objetivo

A tela principal do app — compõe o mapa falso, a camada de demanda, o header,
a barra inferior, os FABs, o banner promocional, o drawer, o card de oferta e
o painel de corrida. É a "tela mãe": no protótipo, **facial, resumo e todas as
telas "empurradas" também vivem dentro deste mesmo container visual**
(deslizando por cima ou substituindo o conteúdo), mas B12-B23 tratam essas
telas como componentes próprios — aqui a responsabilidade é só orquestrar o
que já foi construído nas ondas anteriores.

**Se o tempo/contexto de uma sessão não for suficiente, divida em:**
- **B11a** — mapa base: pan/zoom (gestos), `RuasEQuadras`, `CamadaDemanda`, `RotaPolyline`, `MarcadorCarro`, recentralizar.
- **B11b** — UI fixa por cima: header (hambúrguer + pill de ganhos), barra inferior (Conectar/Carregando/Buscando), FABs, banner promocional, e a integração com `CardOferta`/`PainelStatus`/`DrawerMenu`.

## Arquivo a criar

```
app/(motorista)/mapa.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **9-343** (tudo antes do
drawer) — grade do mapa, camada hexagonal, header, banner, barra inferior,
FABs, card de oferta, painel de corrida.
`.design-import/logic.js`: praticamente o arquivo inteiro é relevante, mas em
especial: `panDown/panMove/panUp/zoomDuplo/recentrar` (linhas 223-258),
`bordaDown/Move/Up` (260-272, gesto de borda — **não usado nesta tela**, é da
navegação em pilha de B25, ignorar aqui), e todo o bloco de `renderVals()`
relacionado a `mapaBase`, `mostrarUiMapa`, `slotConectar/slotCarregando/slotBuscando`.

## Especificação

### Pan & zoom do mapa
- Arrastar com um dedo move o mapa (`panDown/panMove/panUp`), limitado a
  ±180px (ou ±340 durante corrida). Solta com inércia (velocidade calculada
  nos últimos ms de arraste, `v.x*140`).
- Duplo toque dá zoom (`zoomDuplo`: alterna entre 1x e até 1.7x em incrementos de .35).
- Botão de recentralizar aparece quando o mapa está fora do centro ou com zoom != 1.
- Usar `react-native-gesture-handler` (`Gesture.Pan()`, `Gesture.Tap().numberOfTaps(2)`)
  em vez dos `onPointerDown/Move/Up` do protótipo.

### Header (flutua sobre o mapa, ~71px do topo)
- Esquerda: botão hambúrguer 44px branco, ponto vermelho de novidade → abre `DrawerMenu` (B24).
- Centro: pill escura com ganhos do dia (`R$ 0,00`) + chevron → leva para Central de Ganhos (B17).
- Some quando há oferta ativa (o recusar fica no lugar) ou em corrida (vira o header do `PainelStatus`).

### Barra inferior (altura 88)
- Esquerda: ícone de preferências → Preferências de solicitações (B14).
- Centro: 3 variantes por `motoristaStore`/`corridaStore` status:
  `OFFLINE` → botão "Conectar" (chama a ação que dispara verificação facial, B12);
  `CARREGANDO` → botão com "Carregando" + pontinhos;
  `BUSCANDO` → texto "Buscando" com shimmer.
- Direita: ícone de checklist → Teste de Status (B16).

### FABs (canto inferior direito, empilhados)
Recentralizar (condicional) · atalho de teste (`irTeste`, pode virar
debug-only, ver B29) · toggle da camada de demanda.

### Banner promocional
Card amarelo "Indique um motorista e ganhe R$ 500", fecha com X, só aparece
`OFFLINE`/sem oferta/sem corrida. **No protótipo (linha 180) o texto termina
em "...ganhe R$ 500 na RotaFácil" — na implementação, trocar para "na 99"**
(o `DESIGN_SYSTEM.md §2.9` já registra o texto autêntico do app real: "Ganhe
R$ 500 indicando um motora pra 99!" — prefira essa frase à tradução literal,
ver `PLANO_IMPLEMENTACAO_V6.md §5`).

### Overlays condicionais (renderizados por cima de tudo, nessa ordem de prioridade visual)
1. `DrawerMenu` (B24) quando aberto
2. `CardOferta` (B08) quando há oferta
3. `PainelStatus` (B08) quando em corrida

## Notas de tradução Web → RN

- O protótipo usa **dois containers de transform separados**: um para o mapa
  em si (`transformMapa`, ruas/quadras/rota) e outro para os elementos que
  ficam "por cima" mas ainda seguem o pan/zoom (`transformOverlay`, hexágonos/
  passageiros/marcador do carro). O header/barra/FABs/banner **não** entram em
  nenhum dos dois transforms — são fixos na tela. Replicar essa separação em 3
  camadas de `View` empilhadas (`position: absolute`, mesma técnica).
- `requestAnimationFrame`/estado do pan-zoom pode gerar re-render pesado se
  ligado direto ao Zustand a cada pixel de arraste — considere manter
  `offX/offY/zoom` como `useSharedValue` do Reanimated dentro desta tela (estado
  local de UI, não precisa estar na store global) e só sincronizar com a store
  quando necessário (ex.: câmera seguindo a corrida, que é gerenciado por B04).

## Critério de aceite

- Arrastar e dar zoom no mapa funciona suavemente, com inércia.
- Botão Conectar dispara o fluxo (Carregando → tela facial B12 → Buscando → oferta B08).
- Drawer, card de oferta e painel de corrida abrem/fecham sem conflito de gestos entre si.
- Comparar visualmente com `.design-import/RotaFacil Motorista v6.dc.html` aberto num navegador, lado a lado no dispositivo/simulador.
