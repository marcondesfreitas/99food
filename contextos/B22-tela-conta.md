# B22 — Tela Editar conta

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (UI genérica), B03 (`contaNome/contaEmail/contaTel`, `salvarConta`)
**Bloqueia:** B25

## Objetivo

Formulário de dados pessoais — tela "empurrada", também acessível pelo item
"Horas Dirigidas" do drawer (`irConta`, `logic.js` linha 632 — nome de rota e
label do drawer não batem 1:1, conferir se é intencional ou dado de placeholder do protótipo).

## Arquivo a criar

```
app/(motorista)/conta.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **972-1006** (bloco `telaConta`).
`.design-import/logic.js`: `camposPessoais` (linhas 567-572: telefone, e-mail,
cidade fixa "São Paulo", senha mascarada), `setContaNome/Email/Tel` (574-576),
`rotuloSalvarConta`/`salvarConta` (577-578: botão mostra "Alterações salvas ✓"
por um tempo após salvar — conferir se some depois ou fica assim até novo edit;
`contaSalvo` volta a `false` a cada edição, então o rótulo já reverte automaticamente ao digitar de novo).

## Especificação

- Header: voltar + título.
- Campos editáveis: nome, e-mail, telefone (via `TextInput`).
- Campos fixos/somente leitura: cidade, senha (mascarada).
- Botão "Salvar Alterações" → vira "Alterações salvas ✓" após salvar, volta ao
  rótulo normal se o usuário editar qualquer campo depois.

## Notas de tradução Web → RN

- Nenhuma armadilha específica — formulário controlado padrão.

## Critério de aceite

- Editar um campo e salvar atualiza `motoristaStore`; editar de novo depois de
  salvo reverte o rótulo do botão para "Salvar Alterações".
