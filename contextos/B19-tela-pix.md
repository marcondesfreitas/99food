# B19 — Tela Transferência Pix

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (UI genérica), B03 (estado/ação de Pix)
**Bloqueia:** B25

## Objetivo

Formulário de transferência Pix — tela "empurrada" a partir da Carteira (B18).

## Arquivo a criar

```
app/(motorista)/pix.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **822-877** (bloco `telaPix`).
`.design-import/logic.js`: campos `pixNome/pixCpf/pixConta/pixDigito/pixAgencia/pixTipo`
e setters (linhas 609-618), `TIPOS_CONTA` (linha 56), validação `pixOk`
(linha 444: nome > 2 chars, cpf > 5 chars, conta > 3 chars), `tiposConta`
(linhas 615-618), `enviarPix` (linha 620: só avança se `pixOk`, leva de volta a `carteira`).

## Especificação

- Header: voltar (para Carteira B18) + título.
- Campos: nome, CPF, conta, dígito, agência — `TextInput`s controlados por
  `motoristaStore.pix`.
- Seletor de tipo de conta (`TIPOS_CONTA`: Conta corrente / Conta-poupança /
  Conta de ganhos / Instituição de pagamento) — radio/chips selecionáveis.
- Botão "Continuar": cinza (`neutro200`) e desabilitado enquanto `!pixOk`,
  amarelo e habilitado quando válido — replicar a validação **exatamente**
  (nome.trim().length > 2, cpf.trim().length > 5, conta.trim().length > 3).

## Notas de tradução Web → RN

- Formulário simples — `TextInput` controlado, sem máscaras obrigatórias no
  protótipo (não implementar máscara de CPF/conta a menos que quiséssemos ir
  além do protótipo — manter fiel primeiro).

## Critério de aceite

- Botão "Continuar" só habilita quando os 3 campos mínimos passam da validação
  exata acima; ao confirmar, volta para a Carteira (B18).
