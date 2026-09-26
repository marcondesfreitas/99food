# B23 — Tela Veículos + modal Adicionar Veículo

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (UI genérica), B03 (`veiculos`, `veiculoAtivo`, `adicionarVeiculo`, `ativarVeiculo`)
**Bloqueia:** B25

## Objetivo

Lista de veículos cadastrados + fluxo de adicionar um novo, via modal com abas
por tipo (Moto/Carro/Bike).

## Arquivo a criar

```
app/(motorista)/veiculos.tsx
src/components/veiculos/ModalAdicionarVeiculo.tsx   // pode viver junto ou separado
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **1007-1081** (bloco `telaVeiculos`).
`.design-import/logic.js`: `veiculos` inicial (132-136), `veiculos` computado
(579-586, com `borda/marca/status` conforme ativo), `modalVeiculo`/`abrirModalVeiculo`/
`fecharModalVeiculo` (588-589), `abasVeiculo` (590-595), `salvarVeiculo` (600-608).
`DESIGN_SYSTEM.md §3.9` (`CardVeiculo`) e `§11.6` (spec completa desta tela).

## Especificação

- Header: voltar + título "Veículos".
- Lista de `CardVeiculo` — chip do tipo, placa, modelo, thumbnail, indicador de
  "Veículo ativo" (borda amarela + ✓) vs. "Tocar para ativar" (borda cinza + ○).
  Tocar num card não-ativo chama `ativarVeiculo`.
- Botão "Adicionar" (amarelo, rodapé) abre o modal.
- **Modal Adicionar Veículo:** abas Moto/Carro/Bike (`abasVeiculo`, estilo pill
  segmentado), campos placa/modelo/cor (`TextInput`s), botão salvar
  (`salvarVeiculo` — gera placa maiúscula com cor entre parênteses se
  preenchida, tipo de arte por categoria).

## Notas de tradução Web → RN

- Modal: `Modal` nativo do RN ou um bottom sheet customizado (o protótipo usa
  um modal simples sobreposto, não precisa ser bottom sheet com snaps).

## Critério de aceite

- Tocar em um veículo não-ativo o torna ativo (reflete no drawer/pill se
  aplicável). Adicionar veículo pelo modal aparece na lista e vira o ativo automaticamente (`ativo: veiculos.length`, linha 606 do `logic.js`).
