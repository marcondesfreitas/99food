# B14 — Tela Preferências de solicitações

**Onda:** 3 (paralelo com as demais telas — sem dependência cruzada com B15-B23)
**Depende de:** B05 (UI genérica), B03 (`categoriasDesativadas`, `toggleCategoria`)
**Bloqueia:** B25

## Objetivo

Tela "empurrada" (desliza da direita sobre o mapa, ver B25) com toggles de
categorias de corrida por tipo de veículo ativo.

## Arquivo a criar

```
app/(motorista)/prefsolic.tsx    // ou nome de rota equivalente definido por B25
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **499-545** (bloco `telaPrefSolic`).
`.design-import/logic.js`: `CATEGORIAS` (linhas 51-55), `categorias` computado
em `renderVals()` linhas 524-530, `toggleDestino`/`corToggle` linhas 511-512.

## Especificação

- Header: voltar + título.
- Fundo **claro** (esta tela usa `claro = true`, ver `logic.js` linha 421 —
  status bar clara/ícones escuros).
- Lista de categorias do tipo de veículo ativo (`CATEGORIAS[tipoAtivo]` — ex.
  para CARRO: `Pop, Entrega Carro, Negocia, Pop Expresso`), cada uma com nome +
  `Toggle` (B05) — on/off individual, estado em `motoristaStore.categoriasDesativadas`.
- Um toggle adicional "destino" (`destinoOn`/`toggleDestino`) — preferência de
  filtrar por destino, aparência de toggle simples.
- Navegação: ícone de engrenagem/atalho leva para Preferências de Serviços (B15) — conferir botão exato no template.

## Notas de tradução Web → RN

- Nenhuma armadilha grande — é lista + toggles, usar `Toggle` de B05 diretamente.

## Critério de aceite

- Cada toggle reflete e altera `motoristaStore.categoriasDesativadas` corretamente.
