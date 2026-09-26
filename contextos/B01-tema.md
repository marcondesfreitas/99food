# B01 — Tema (cores, tipografia, espaçamento)

**Onda:** 1 (paralelo com B02, B03, B04)
**Depende de:** B00
**Bloqueia:** B05, B06, B07, B08, B09, B24 (todo componente visual)

## Objetivo

Criar os tokens de design como constantes TypeScript, únicos e centralizados —
nenhum componente deve ter cor/tamanho "mágico" hardcoded depois deste bloco.

## Arquivos a criar

```
src/tema/cores.ts
src/tema/tipografia.ts
src/tema/espacamento.ts
```

## Fonte no protótipo

- `DESIGN_SYSTEM.md §2` (tokens documentados e nomeados)
- Cores exatas confirmadas no `.design-import/RotaFacil Motorista v6.dc.html` (inline styles) — usar estas como valor final quando divergir do "observado" do DESIGN_SYSTEM (o protótipo é a fonte mais recente).

## Especificação

### Cores de marca
| Token | Hex |
|---|---|
| `amarelo500` | `#F8D60B` (usado no protótipo v6; ver nota abaixo) |
| `amarelo600` | `#E0C009` (pressionado) |
| `amarelo300` | `#FDEF7A` |
| `amarelo100` | `#FEF8CC` |
| `roxo900` | `#241B37` / pill de ganhos usa `#26292E` no v6 |
| `rosa500` | `#E31C5F` |

**Nota:** o DESIGN_SYSTEM.md §2.1 registra `#FBE300` como `amarelo/500` (medido do vídeo v1); o protótipo v6 usa `#F8D60B`. Use **`#F8D60B`** como valor de implementação (é o que está no `.dc.html` mais recente) e trate `#FBE300` como histórico/depreciado. Isso está documentado em `DESIGN_SYSTEM.md §9.2` (a v2 já tinha ajustado para `#F8D60B`).

### Cores semânticas
`sucesso500 #24D279` · `alerta500 #E8833A` · `alerta700 #754219` · `alerta300 #F5C542` · `erro500 #EB312B` · `info500 #4A90D9` · `info700 #2F6FB5` · `corDinamico #F4C372` (cor do selo "tarifa dinâmica" no card de oferta e no resumo)

### Neutros
`neutro0 #FFFFFF` · `neutro50 #F9F7FA` · `neutro100 #EFEDF1` · `neutro200 #DCDAE0` · `neutro400 #9D9CA1` · `neutro600 #5D5B61` · `neutro900 #1C1A1F` · `sheetFundo #26292E` (bottom sheet de oferta/corrida, mais claro que o `#1A181B` do v1) · `sheetTrilho #353A48` · `sheetTexto2 #A09EA1`

### Fundo do app (fora do frame do celular, é só do protótipo — ignorar em RN)
`#131215` — **não portar**, é o fundo do canvas do Claude Design, não faz parte do app.

### Tipografia
Fonte: **Inter** (`expo-font` + Google Fonts, pesos 400/500/600/700/800) → fallback `system`.

| Token | Tamanho / Peso / Line-height |
|---|---|
| `displayXl` | 44 / 700 / 48 — valor da oferta e do resumo |
| `tituloLg` | 22 / 700 / 28 |
| `tituloMd` | 18 / 600 / 24 |
| `corpoLg` | 17 / 600 / 22 |
| `corpoMd` | 15 / 400 / 20 |
| `corpoSm` | 13 / 400 / 18 |
| `labelBtn` | 18 / 700 / 22 |
| `labelChip` | 12 / 600 / 16 |

**Números de dinheiro sempre tabulares** — em RN não existe `font-variant-numeric`
direto no `Text` de forma universal; usar `fontVariant: ['tabular-nums']` (RN 0.71+
suporta) e testar no dispositivo — se não funcionar, usar uma fonte monoespaçada
só para números como fallback.

### Espaçamento
Escala de 4: `4, 8, 12, 16, 20, 24, 32, 40, 48`. Padding lateral de tela: 16.
Padding interno de card: 16. Gap do menu lateral: 30.

### Raio e sombra
`raioPill 999` · `raioSheet 20` (só topo) · `raioCard 12` · `sombraFlutuante {shadowOpacity:.14, shadowRadius:8, shadowOffset:{0,2}}` (mapear para `elevation` no Android também).

## Notas de tradução Web → RN

- CSS `box-shadow` → RN `shadowColor/shadowOffset/shadowOpacity/shadowRadius` (iOS) + `elevation` (Android). Cada sombra do protótipo (§DESIGN_SYSTEM §2.7) precisa de par de valores.
- `border-radius: 999px` → qualquer valor bem maior que a metade da altura funciona em RN (ex.: `9999`).

## Critério de aceite

- `import { cores } from '@/tema/cores'` expõe todos os tokens acima por nome.
- Nenhum valor hex aparece fora de `cores.ts` nos blocos seguintes (isso é responsabilidade de quem revisar B05 em diante, mas o objetivo deste bloco é tornar isso possível).
