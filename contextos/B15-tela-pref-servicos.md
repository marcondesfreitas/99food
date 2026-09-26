# B15 — Tela Preferências de serviços

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (UI genérica)
**Bloqueia:** B25

## Objetivo

Tela "empurrada" simples, acessada a partir de Preferências de Solicitações (B14).

## Arquivo a criar

```
app/(motorista)/prefservicos.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **546-569** (bloco `telaPrefServicos`)
— bloco pequeno, ler o trecho completo antes de implementar para não perder
nenhum campo (é o menor dos blocos de tela do protótipo).
`.design-import/logic.js`: `voltarPush()` linha 279-286 define que voltar desta
tela leva a `prefsolic` (B14), não ao mapa — respeitar essa regra em B25.

## Especificação

- Header: voltar + título.
- Conteúdo curto (ver o `.dc.html` para o texto/toggles exatos — o bloco é
  pequeno o suficiente para copiar a estrutura quase literalmente, só trocando
  `<div>`/estilos inline por `View`/`StyleSheet`).

## Notas de tradução Web → RN

- Nenhuma armadilha específica.

## Critério de aceite

- Tela renderiza com o conteúdo do protótipo; botão voltar retorna a Preferências de Solicitações (B14), não ao mapa.
