# B20 — Tela Perfil

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (`DistribuicaoEstrelas`), B03 (foto/veículo ativo)
**Bloqueia:** B25

## Objetivo

Tela "empurrada" com dados públicos do motorista, acessada pelo avatar do
drawer ou pelo header.

## Arquivo a criar

```
app/(motorista)/perfil.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **878-930** (bloco `telaPerfil`).
`.design-import/logic.js`: `avatarBg/avatarConteudo` (546-547), `sheetFoto`/
`abrirSheetFoto`/`fecharSheetFoto`/`tirarFoto`/`removerFoto` (549-553),
`distribuicao` (linha 566), engrenagem → Config (B21) (`irConfig` linha 631).
`DESIGN_SYSTEM.md §4.5` tem a especificação em prosa completa desta tela.

## Especificação

- Fundo `neutro50`. Header: voltar + engrenagem (→ Config B21).
- Avatar 96px tocável (abre um sheet de opções: tirar foto / remover foto —
  `sheetFoto` — usar `Modal`/bottom sheet simples).
- Nome em caixa alta, `tituloLg`. Botão outline pill "Ver perfil público".
- Dois números lado a lado: corridas totais e dias na plataforma.
- Bloco de avaliação: "Avaliação 0.00 ★" + link "Como funciona ›" + legenda +
  `DistribuicaoEstrelas` (B05, somente leitura) com os dados de `distribuicao`
  (`logic.js` linha 566: array `[estrelas, percentual, quantidade]`).

## Notas de tradução Web → RN

- "Tirar foto" deveria idealmente abrir `expo-camera`/`expo-image-picker` —
  mas o protótipo apenas **simula** (`foto: 'enviando'` por 1.4s → `'ok'`, sem
  imagem real). Manter fiel ao protótipo primeiro (simulado); troca por
  câmera/galeria real é melhoria de Módulo 11, fora deste plano.

## Critério de aceite

- Avatar mostra iniciais quando não há foto, e o sheet de opções abre/fecha corretamente.
- `DistribuicaoEstrelas` reflete os dados mockados de `distribuicao`.
