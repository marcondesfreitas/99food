# B16 — Tela Teste de status

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (`AnelProgresso`, `LinhaChecklist`)
**Bloqueia:** B25

## Objetivo

Tela "empurrada" que roda uma checagem simulada de 6 itens (internet,
localização, perfil, documentos, solicitação, configurações), acessível pelo
ícone de checklist na barra inferior do mapa.

## Arquivo a criar

```
app/(motorista)/teste.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **570-643** (bloco `telaTeste`).
`.design-import/logic.js`: `CHECK` (linha 2), `rodarTeste()` (linha 314: dispara
um item a cada 1150ms, 6 itens = 6.9s total), `testeStep`/`checklist`/`anelOffset`/
`anelTexto`/`reiniciarTeste` (linhas 531-537).

## Especificação

- Header: voltar (volta para Preferências de Solicitações, `voltarPush` linha 284) + título.
- `AnelProgresso` (B05) central mostrando "N/6", progride conforme `testeStep`.
- Lista de 6 `LinhaChecklist` (B05), uma por item de `CHECK`, cada uma passa
  por pendente → testando → aprovado conforme o `testeStep` avança.
- Ao completar os 6 (após ~6.9s do início), mostrar estado "completo" (ver
  `testeCompleto`) — provavelmente um resumo/CTA, conferir o trecho final do
  bloco no `.dc.html` para o texto exato.
- Botão "Reiniciar" reseta e roda de novo.

## Notas de tradução Web → RN

- `at(fn, i*1150)` para cada item → `setTimeout` encadeados, limpar no
  `useEffect` cleanup se sair da tela no meio.

## Critério de aceite

- Ao entrar na tela, os 6 itens vão de pendente a aprovado em sequência, cada
  um levando ~1.15s a mais que o anterior, e o anel de progresso acompanha.
