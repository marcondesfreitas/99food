# B18 — Tela Carteira (Conta 99)

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (UI genérica), B03 (saldo/ganhos)
**Bloqueia:** B25

## Objetivo

Tela "empurrada" de saldo/conta digital, acessada a partir da Central de
Ganhos (B17). Volta sempre para Central (`voltarPush`, `logic.js` linha 282).

## Arquivo a criar

```
app/(motorista)/carteira.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **751-821** (bloco `telaCarteira`).
`.design-import/logic.js`: `saldoFmt` (linha 486), `irPix` (linha 631).

## Especificação

- Header: voltar + título. **No protótipo (linha 756) o título diz "Conta RF"
  — na implementação vira "Conta 99"** (por isso o bloco já se chama "Carteira
  (Conta 99)" neste plano).
- Saldo em destaque (`saldoFmt`).
- Ações: transferir via Pix (→ B19), possivelmente outras (ler o bloco completo
  no `.dc.html` para a lista exata de ações/histórico de transações exibido).
- Seção "Destaques": card de imagem com legenda. **No protótipo (linha 815) o
  texto é "RF Pay Informe" — na implementação vira "99 Pay"** (ver
  `PLANO_IMPLEMENTACAO_V6.md §5`).

## Notas de tradução Web → RN

- Nenhuma armadilha específica — tela de conteúdo estático + navegação.

## Critério de aceite

- Saldo exibido bate com `motoristaStore.ganhos`; botão de Pix leva a B19; voltar leva a B17.
