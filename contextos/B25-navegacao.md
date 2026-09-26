# B25 — Navegação (Expo Router + push/voltar em tela cheia)

**Onda:** 4 (sequencial — depende de TODAS as telas da onda 3 existirem)
**Depende de:** B10, B11, B12, B13, B14, B15, B16, B17, B18, B19, B20, B21, B22, B23
**Bloqueia:** B26

## Objetivo

Ligar todas as telas construídas isoladamente em uma navegação real, replicando
o comportamento de duas camadas do protótipo:
1. **Overlays dentro do Mapa** (facial, resumo, drawer, oferta, corrida) — não
   são rotas separadas no protótipo, mas B12/B13 foram tratadas como telas
   próprias neste plano; decidir aqui se viram rotas do Expo Router (mais
   simples de navegar) ou overlays dentro de `mapa.tsx` (mais fiel ao
   protótipo, evita "voltar" acidental do sistema).
2. **Pilha "empurrada"** (`prefsolic, prefservicos, teste, central, carteira,
   pix, perfil, config, conta, veiculos`) — no protótipo, a tela base
   (`transformBase`) desliza para `translateX(-30%)` e a tela empurrada desliza
   da direita por cima, com gesto de borda esquerda para voltar (`bordaDown/Move/Up`,
   `.design-import/logic.js` linhas 260-272) — ver `DESIGN_SYSTEM.md §12.2`
   (Navegação em tela cheia) para a especificação completa desse efeito.

## Fonte no protótipo

`.design-import/logic.js`: `PUSH_TELAS` (linha 58), `push(tela)`/`voltarPush()`
(linhas 274-286 — **atenção às regras especiais de retorno**: `prefservicos`→`prefsolic`,
`carteira`/`pix`→`central`, `config`→`perfil`, `teste`→`prefsolic`, default→mapa),
`irPara(id)` (linhas 288-302, usado pelo menu de navegação lateral de debug do
protótipo — não existe em produção, mas documenta as transições válidas entre
todas as telas, útil como checklist de rotas a cobrir).

## Especificação

- Definir rotas do Expo Router em `app/(motorista)/` para cada tela empurrada
  (B14-B23), mais `mapa.tsx` (B11) como tela base do grupo.
- Transição: ao navegar para uma tela empurrada, animar como slide-da-direita
  (Expo Router suporta isso nativamente via opções de tela, ou customizar com
  Reanimated se precisar do efeito exato de "mapa desliza -30%, tela nova
  desliza por cima" do protótipo).
- Gesto de borda esquerda para voltar: usar o gesto de "voltar por borda"
  nativo do Stack navigator (iOS já tem isso; Android configurar
  `gestureEnabled`) — não precisa reimplementar manualmente se o Stack padrão
  já cobrir, **mas** as regras especiais de retorno acima (`voltarPush`) exigem
  lógica customizada de "para onde volta", não o padrão de pilha genérico do
  navigator — pode exigir `router.replace` explícito em vez de depender do
  histórico de navegação puro.
- `splash` (B10) e `verificacao-facial` (B12) usam `router.replace`, nunca
  `push` (não devem ficar na pilha de "voltar").
- `resumo` (B13) idem — não se deve conseguir "voltar" da tela de resumo para
  a corrida já finalizada.

## Notas de tradução Web → RN

- Este é o bloco mais "arquitetural" — decisões aqui afetam como B11 e B26
  se conectam. Se surgir ambiguidade sobre "overlay vs. rota", prefira overlay
  (dentro de `mapa.tsx`, controlado por estado local/`corridaStore`) para tudo
  que no protótipo aparece **sobreposto ao mapa sem cobrir a barra de status
  nem trocar a barra inferior** (drawer, card de oferta, painel de corrida) —
  e rota separada para tudo que no protótipo é **tela cheia com seu próprio
  header** (facial, resumo, e as 10 telas empurradas).

## Critério de aceite

- Todas as transições de `irPara`/`push`/`voltarPush` do protótipo (linhas
  274-302 do `logic.js`) têm um caminho de navegação equivalente e funcional no app.
- Voltar de `prefservicos` vai para `prefsolic`, de `carteira`/`pix` vai para
  `central`, de `config` vai para `perfil`, de `teste` vai para `prefsolic` — **não** para a tela anterior genérica do histórico.
