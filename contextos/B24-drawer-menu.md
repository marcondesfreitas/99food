# B24 — Drawer / menu lateral

**Onda:** 2 (paralelo com B05, B06, B07, B08, B09)
**Depende de:** B01 (tema), B03 (dados de perfil/ganhos para o cabeçalho do menu)
**Bloqueia:** B11

## Objetivo

O menu lateral esquerdo que desliza sobre o mapa (hambúrguer no header).
Componente autocontido, a tela B11 só decide quando mostrá-lo.

## Arquivos a criar

```
src/components/menu/DrawerMenu.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **344-387** (bloco `drawerEsq`).
`.design-import/logic.js`: campo `drawerEsq`, `abrirEsq`/`fecharDrawer` (linhas
625-626), `pillFase`/`tipoAtivo` (linhas 513-514), navegação para itens
(`irCentral`, `irPerfil`, `irVeiculos`, `irConta` — linhas 630-634).

## Especificação

- Ocupa ~85% da largura (332px de 390), desliza da esquerda com `ease-out` 280ms,
  overlay escuro `rgba(0,0,0,.35)` atrás (fade), fecha ao tocar no overlay ou
  arrastar para fechar.
- Topo: avatar circular 76px (tocável, leva ao Perfil — B20), nome + nota
  ("Diogo Marques · 5,00 ★"), pill "Moto • Fase 1" (`pillFase`, cor `#26292E`/texto branco).
- Duas métricas lado a lado: "Taxa de Aceitação 92%" (`neutro900`) e "Taxa de
  Finalização 78%" (`#E31C5F` — cor diferente é intencional, sinaliza métrica em risco, `DESIGN_SYSTEM.md §4.3`).
- Divisor, depois lista de itens com `corpoLg`, altura mínima 48, gap generoso
  de 30px entre eles (é a característica visual mais marcante do drawer):
  Ganhos (→ Central de Ganhos B17) · Recompensas · Indique um amigo · Central
  de Ajuda · Notificações · Central de Educação (com bolinha vermelha de
  novidade) · Loja · Veículos (→ B23, com chevron) · Horas Dirigidas (→ Editar
  conta B22, com chevron).
- Lista rola verticalmente se não couber.

## Notas de tradução Web → RN

- Overlay + painel deslizante: `Modal` do RN ou um `View` absoluto
  posicionado por cima de tudo (z-index alto) com Reanimated
  `translateX` de `-332` a `0`. Overlay como `Pressable` semi-transparente
  atrás, cobrindo a tela toda, capturando toque para fechar.
- Gesto de arrastar para fechar: `PanGestureHandler` horizontal, fecha se
  arrastar mais que ~40% da largura do drawer para a esquerda.

## Critério de aceite

- Abre/fecha com animação suave, overlay bloqueia toques no conteúdo atrás.
- Todos os itens de navegação chamam o callback certo (props `onIrPerfil`,
  `onIrVeiculos`, etc. — a tela B11 conecta isso à navegação real de B25).
