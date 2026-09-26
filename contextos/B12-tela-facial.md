# B12 — Tela Verificação facial

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B09 (MolduraFacialOval), B03 (ação `conectar` / status do motorista)
**Bloqueia:** B25

## Objetivo

Tela cheia (não é bottom sheet) que roda a verificação simulada entre "Conectar"
e ficar "Buscando" no mapa.

## Arquivo a criar

```
app/(motorista)/verificacao-facial.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **388-451** (bloco `telaFacial`).
`.design-import/logic.js`: `conectar()` (304-307), `rodarFacial()` (308-313),
`reiniciarFacial` (linha 544). Sequência exata de tempos:
`conectar()` → 1400ms → tela facial + `rodarFacial()` → 6100ms → sucesso → 900ms → mapa buscando.

## Especificação

- Header: voltar (‹) + título "Reconhecimento facial".
- Se não há foto de perfil cadastrada (`motoristaStore.foto !== 'ok'`): banner
  amarelo "Adicione uma foto de perfil para agilizar a verificação" com link
  "Adicionar agora ›" → Perfil (B20).
- `MolduraFacialOval` (B09) central, com miniatura da "foto de cadastro" acima
  (se existir) e seta de comparação (↔).
- Texto de instrução abaixo, muda conforme estado.
- Em caso de falha (não ocorre no fluxo automático do protótipo, mas o botão
  "Tentar novamente" existe): reinicia o timer de 6100ms.

## Fluxo temporal (portar exatamente)

```
entra na tela → estado 'verificando' (arco progride 6s)
  → após 6100ms: estado 'sucesso' (check, "Tudo certo!")
    → após 900ms: navega para Mapa/Home com status 'BUSCANDO', agenda oferta em 3400ms
```

## Notas de tradução Web → RN

- Os `setTimeout` encadeados do protótipo (`at(fn, ms)`) devem ser limpos se o
  usuário sair da tela no meio (voltar) — usar `useEffect` com cleanup.
- Navegação final usa `router.replace` (não `push`) para não empilhar a tela
  facial atrás do mapa — coordenar com B25.

## Critério de aceite

- Fluxo completo automático: entra na tela, vê o arco progredir, vê o check
  de sucesso, e é levado ao mapa em "Buscando" sem interação do usuário — igual ao protótipo.
