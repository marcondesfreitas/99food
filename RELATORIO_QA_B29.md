# B29 — Relatório de QA

Auditoria do app portado (`99motorista/`) contra o protótipo
(`.design-import/RotaFacil Motorista v6.dc.html` + `logic.js`) e os checklists
do [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

**Método:** conferência de código e de dados, não comparação visual em
aparelho. O `contextos/B29-qa-visual.md` pede as duas telas lado a lado num
dispositivo; isso não foi feito. Em compensação, os itens que dependem de
*número* (timings, coordenadas, hex de cor, densidade de vértices, fórmulas de
km/min) foram verificados por comparação direta com o protótipo — inclusive
`diff` ponto a ponto da geometria das rotas —, o que é mais preciso do que
olhar a olho nu. Os itens que **só** olho humano fecha estão marcados com 👁
no fim.

**Resultado:** 3 divergências objetivas encontradas e corrigidas; nenhum ❌
pendente entre os itens verificáveis por código.

---

## 1. Divergências encontradas e corrigidas

### 1.1 Chip "Prioritário" com cor aproximada — `CardOferta` (B08)

O chip usava `sucesso500` (`#24D279`) a 30% de opacidade como fundo e o mesmo
verde como texto, com um comentário no código assumindo que *"`#176C4B` não
existe em `@/tema/cores`"*.

Existe, sim — como token nomeado do próprio design system:

| Token | Hex | Uso | Fonte |
|---|---|---|---|
| `verde/700` | `#176C4B` | fundo do chip "Prioritário" | DESIGN_SYSTEM §9.2, linha 450 |
| `verde/300` | `#65D3A6` | texto do chip "Prioritário" | DESIGN_SYSTEM §9.2, linha 451 |

Um verde translúcido sobre o preto do bottom sheet **escurece** em vez de
destacar, então o resultado visual não era só "aproximado": era o oposto do
pretendido.

**Correção:** tokens `verde700`/`verde300` adicionados a `src/tema/cores.ts`; o
chip passou a usar fundo sólido + texto claro, e a `View` extra de opacidade
saiu.

### 1.2 Anel do reconhecimento facial no azul errado — `MolduraFacialOval` (B09)

O contorno do oval e o arco de progresso usavam `info500` (`#4A90D9`). O
protótipo usa `#2445A6` (`corOval`, `logic.js` linha 540).

São dois azuis vizinhos com donos diferentes, e a confusão tem origem
documental: a **§2** do DESIGN_SYSTEM (v1) descreve `info/500 #4A90D9` como
*"arco do reconhecimento facial"*, mas a **§9.2** (v2) registra
`azul/facial #2445A6` como *"anel do reconhecimento facial v2 — azul mais
saturado"*, e a §11 repete como `azul/oval`. A regra de precedência do §13
(v6 > v5 > … > v1) faz a v2 valer.

**Correção:** token `azulOval` adicionado; o estado "verificando" passou a
usá-lo. O `info500` **continua** correto e inalterado nos outros três lugares —
o spinner logo abaixo do oval (`.dc.html` linha 443, que de fato é `#4A90D9`),
o marcador do motorista e o FAB de recentrar.

### 1.3 Duração da oferta declarada duas vezes

`DURACAO_OFERTA_S = 15` existia em `corridaStore.ts` (que agenda a expiração) e,
separadamente, em `mapa.tsx` (que dimensiona a barra de contagem do card). Os
dois valores estavam iguais, então nada estava quebrado — mas mudar um sem o
outro faria a barra chegar ao fim antes ou depois de a oferta realmente
expirar, um bug silencioso e difícil de rastrear.

**Correção:** a constante do `corridaStore` foi exportada e o `mapa.tsx` passou
a importá-la. Uma definição só.

---

## 2. Checklist §13.5 (v6)

| # | Item | | Como foi verificado |
|---|---|---|---|
| 1 | Rota segue apenas ruas | ✅ | Todos os 49 pontos das 5 rotas saem de `vx()`/`hy()` (a malha de ruas) ou de `diag()` (a Av. Radial Leste). `diff` contra o protótipo: **idênticos**, ponto a ponto |
| 2 | Esquinas em ângulo real, junção arredondada | ✅ | Pontos na malha ⇒ ângulos reais; `strokeLinejoin="round"` nas três camadas do traço |
| 3 | Halo branco de 8 px sob o traço verde | ✅ | `ESPESSURA_HALO = 8`, branco, desenhado antes do verde — igual ao `.dc.html` linha 94 |
| 4 | Pins ancorados sobre a via | ✅ | Posicionados em `pv.s[0]` e `pv.s[n-1]` com `marginLeft/Top: -PIN/2` (ancoragem pelo centro) |
| 5 | Vértices densos o bastante | ✅ | `preparar()` reamostra com `n = max(1, round(d/12))` — no máximo 12 px entre vértices. Fórmula idêntica ao protótipo |
| 6 | Velocidade constante de distância, sem frear nas esquinas | ✅ | `emT()` faz busca binária sobre **comprimento de arco acumulado** (`cum[]`), não índice de vértice. `prog` avança por `dt/dur`. É o erro mais citado do design system e o código está correto |
| 7 | Seta gira seguindo o bearing | ✅ | Filtro exponencial com wrap-around `((bearing - ang + 540) % 360) - 180` — menor caminho angular, τ = 0,12 s |
| 8 | 3 a 5 trajetos alternando | ✅ | 5 rotas; `gerarOferta` sorteia o índice |
| 9 | Rotas embutidas, sem rede | ✅ | Constantes em `src/servicos/mapaFalso.ts`; nenhuma chamada de rede no app |
| 10 | `distanciaKm`/`duracaoMin` batem com o traçado | ✅ | Derivados de `pv.len` pelas mesmas fórmulas do protótipo (`METRO_PX = 6`); o card lê `t.km`/`t.min` |
| 11 | Trecho percorrido em cinza, ponteiro por cima | ✅ | Ordem de render: ruas → rota → marcador. Cinza `#9D9CA1` a 50%, igual ao `.dc.html` linha 95. É o bug R3 do §9.1, e está correto |
| 12 | Nenhuma cor/fonte/token/curva alterada | ⚠️→✅ | Duas cores estavam alteradas (§1.1 e §1.2). Corrigidas |

## 3. Checklist §8 (geral)

| Item | | Observação |
|---|---|---|
| Tokens de cor batem com a §2 | ✅ | Após as correções da §1. Os 9 hex do protótipo sem par no app são todos do painel de debug do Claude Design (fora do frame de 390×844), que não é portado |
| Botão primário é pill, não full-width | ✅ | 214 × 56, valor literal do protótipo |
| Hexágonos sólidos, sem contorno | ✅ | `<Polygon fill={cor} />` sem `stroke` |
| Sheet de oferta preto, de corrida claro | ✅ | `sheetFundo` vs. `neutro0` |
| Barra de tempo linear, 15 s | ✅ | `Easing.linear`, `DURACAO_OFERTA_S` agora compartilhada |
| "Taxa de Finalização" em magenta | ✅ | `rosa500` (`#E31C5F`) no valor **e** no rótulo, como no protótipo |
| Valores monetários tabulares | ✅ | `numeroTabular` aplicado |
| Dados pessoais fictícios | ✅ | Nomes/placas trocados e documentado no código (DESIGN_SYSTEM §2.9) |

## 4. Timings

Todos conferidos contra o protótipo. **Nenhum arredondado.**

| Evento | Protótipo | App | Onde |
|---|---|---|---|
| Splash | 1200 ms (400 + 800) | 1200 | `CoberturaSplash` |
| Conectar → facial | 1400 ms | 1400 | `simuladorCorridas` |
| Facial → sucesso | 6100 ms | 6100 | `verificacao-facial` |
| Sucesso → mapa | 900 ms | 900 | `verificacao-facial` |
| 1ª oferta | 3400 ms | 3400 | `simuladorCorridas` |
| Após recusa | 4200 ms | 4200 | `simuladorCorridas` |
| Após resumo | 4000 ms | 4000 | `simuladorCorridas` |
| Oferta expira | 15 s | 15 | `corridaStore` |
| Indo buscar / em viagem | 12 s / 20 s | 12 / 20 | `mapaFalso` |
| Chegada (pulse→pin→botão) | 400 / 800 ms | 400 / 800 | `corridaStore` |
| Contagem do resumo | 900 ms | 900 | `corridaStore` |
| Tick de demanda | 2400 ms | 2400 | `demandaStore` |
| Drawer | 280 ms | 280 | `DrawerMenu` |
| Passo do Teste de status | 1150 ms | 1150 | `teste.tsx` |
| Câmera segue o carro | τ = 0,4 s | 0,4 | `MapaBase` |
| Foto de perfil | 1400 ms | 1400 | `motoristaStore` |

## 5. Léxico §14 — "rota" fora da interface

✅ Nenhuma string visível do app contém "Rota", "RotaFácil" ou "RF". As únicas
ocorrências no código são comentários citando o protótipo (`// Protótipo linha
815: "RF Pay Informe" → "99 Pay"`), que é exatamente o uso permitido pela §14.3
(vocabulário técnico interno).

---

## 6. Desvios pedidos depois da auditoria

Registrados aqui para não parecerem divergências não detectadas numa releitura
futura. Os dois foram pedidos explicitamente e são **intencionais**.

### 6.1 Moldura da verificação facial: elipse → círculo

O protótipo usa uma elipse de 240×320 (`.dc.html` linhas 418 e 430). Virou um
**círculo de 280px** — a média das duas medidas, o que mantém a área ocupada e,
como o perímetro quase não muda (2π·140 ≈ 879,6 contra 884), preserva a
velocidade do arco de progresso sem reajustar nenhum tempo.

Junto veio um **segmento branco orbitando** por cima do anel de progresso, que
o protótipo não tinha: a tela passa a comunicar as duas coisas ao mesmo tempo —
que está acontecendo (o giro) e quanto falta (o preenchimento). Sucesso e falha
continuam idênticos ao protótipo (anel inteiro na cor do estado, "bater" no
sucesso, tremor na falha).

O componente foi renomeado de `MolduraFacialOval` para `MolduraFacial`, e a
instrução na tela passou de "dentro do oval" para "dentro do círculo".

### 6.2 Foto de perfil passou a ser real

No protótipo os dois itens da folha de opções ("Tirar foto" e "Escolher da
galeria", linhas 1071-1072) chamam o mesmo `tirarFoto` falso, que só troca um
enum e pinta um retângulo listrado. Agora a imagem é de verdade
(`expo-image-picker` + `expo-file-system`), com recorte 1:1, e aparece nos cinco
avatares do app.

Três decisões de implementação que valem registro:

1. **A imagem é copiada** do cache do picker para `Paths.document`. O diretório
   de cache pode ser limpo pelo sistema, e como B28 persiste o caminho, o app
   reabriria com o avatar quebrado.
2. **O nome do arquivo muda a cada troca** (sufixo de timestamp). O `<Image>`
   cacheia por URI: gravando por cima do mesmo caminho, a tela continuaria
   mostrando a foto antiga.
3. **Os 1400ms de "enviando" saíram.** Simulavam um upload que não existe; com
   a imagem local e já copiada, esperar não representaria nada. O estado
   `'enviando'` continua no tipo para o dia em que houver servidor.

Correção de fidelidade que veio junto: a tela "Editar conta" agora abre a mesma
folha de foto, como no protótipo (`abrirSheetFoto`, linha 994) — antes ela só
empurrava para o Perfil, contradizendo a própria dica "Toque no ícone para
mudar a foto" logo abaixo do avatar.

---

## 7. 👁 O que ainda precisa de aparelho

Estes quatro itens não têm como ser fechados por leitura de código:

1. **Cor renderizada vs. especificada.** O código usa os hex certos; se o
   aparelho aplica gestão de cor ou o SVG do Android desloca algum tom, só o
   color picker lado a lado mostra.
2. **Percepção de "vértices densos o bastante".** 12 px entre vértices satisfaz
   a regra numérica, mas se a curva *parece* cortada depende do zoom real.
3. **Jank do piloto automático.** `corridaStore` roda `requestAnimationFrame`
   chamando `set()` do Zustand a cada quadro — uma nota no topo do próprio
   arquivo já prevê migrar para `useSharedValue` do Reanimated *"se o QA
   detectar jank real no dispositivo"*. É a decisão que este relatório não pode
   tomar.
4. **A pilha de navegação sob `replace`.** Confirmar que ir para a verificação
   facial não deixa um segundo `mapa` empilhado por causa do
   `unstable_settings.initialRouteName` (pendência já registrada na Onda 4).
5. **O segmento orbitando da moldura facial.** A velocidade (1,1s por volta) e
   o comprimento (22% da circunferência) foram escolhidos no papel; se ficar
   frenético ou lento demais, são duas constantes em
   `src/components/verificacao/MolduraFacial.tsx`.
6. **Câmera e galeria.** `expo-image-picker` e `expo-camera` só funcionam em
   build de desenvolvimento ou Expo Go num aparelho real — não há como exercitar
   o fluxo de escolher foto daqui.

Sugestão de roteiro, quando houver aparelho: `npx serve .design-import` para
abrir o protótipo no navegador ao lado do app, e percorrer o fluxo completo uma
vez com o color picker aberto.
