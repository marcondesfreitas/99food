# B17 — Tela Central de Ganhos

**Onda:** 3 (paralelo com as demais telas)
**Depende de:** B05 (UI genérica), B03 (`historico`, `ganhos`, `dinamico`)
**Bloqueia:** B25

## Objetivo

Tela "empurrada" acessada pelo pill de ganhos do header do mapa ou pelo item
"Ganhos" do drawer — histórico do dia + gráfico simples de barras por hora.

## Arquivo a criar

```
app/(motorista)/central.tsx
```

## Fonte no protótipo

`.design-import/RotaFacil Motorista v6.dc.html` linhas **644-750** (bloco `telaCentral`).
`.design-import/logic.js`: cálculo do gráfico (`grafico`, linhas 561-564 —
soma valores por hora das 16h às 23h, normaliza pela hora de pico), `tiles`
(linha 565, atalhos tipo "Pagar boleto"/"Transferências"/etc.), `historico`/
`semHistorico`/`totalCorridas` (linhas 559-560).

## Especificação

- Header: voltar + título "Ganhos" (ou "Central de Ganhos").
- Total do dia em destaque (`ganhosFmt`), com a fatia "dinâmico" destacada
  separadamente (`dinamicoFmt`) — ver `ARQUITETURA.md §6.6` ("separe corrida
  R$18 + dinâmico R$14,40").
- Gráfico de barras simples: 8 barras (16h-23h), altura proporcional ao valor
  daquela hora (mínimo 4px mesmo com valor 0), cor amarela se houver valor,
  cinza claro (`neutro100`) se não houver.
- Grid de `tiles` (atalhos: Pagar boleto, Transferências, Recarregar celular,
  Gift Card — alguns com badge).
- Lista de corridas do dia (`historico`): hora, endereço (primeira parte antes
  da vírgula), valor. Estado vazio quando `semHistorico`.
- Link/botão para Carteira (B18). **No protótipo esse item de menu (linha
  702) diz "Conta RF" — na implementação vira "Conta 99"**. Há também um card
  de fase/rewards (linha 678) com o texto "Rota RF" ("Disponível na sua fase")
  — trocar para "99" (ou "Fase 99", ajustando à frase ao redor). Ver
  `PLANO_IMPLEMENTACAO_V6.md §5`.

## Notas de tradução Web → RN

- Gráfico de barras: `View`s simples com `height` proporcional — não precisa
  de biblioteca de charts para 8 barras fixas.
- Lista de histórico: `FlatList` (a lista pode crescer ao longo do dia — usar
  lista performática conforme `ARQUITETURA.md §3` tela 7).

## Critério de aceite

- Com histórico mockado de N corridas em horas variadas, o gráfico reflete a
  distribuição corretamente e o total bate com a soma dos valores.
