# B21 — Tela Configurações de perfil

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (UI genérica)
**Bloqueia:** B25

## Objetivo

Tela "empurrada" simples de configurações, acessada pela engrenagem do Perfil (B20).

## Arquivo a criar

```
app/(motorista)/config.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **931-971** (bloco `telaConfig`).
`.design-import/logic.js`: `voltarPush` linha 283 (volta para `perfil`, não mapa), `irConta` (linha 632).

## Especificação

- Header: voltar (para Perfil B20) + título.
- Lista de opções de configuração (ler o bloco completo no `.dc.html` para os
  itens exatos — inclui pelo menos o caminho para "Editar conta", B22).

## Notas de tradução Web → RN

- Nenhuma armadilha específica.

## Critério de aceite

- Navega corretamente para Editar Conta (B22); voltar retorna ao Perfil (B20).
