# DESIGN SYSTEM — 99 Motorista (clone didático)

**Fonte:** análise quadro a quadro de dois vídeos + `ARQUITETURA.md`
- **v1** — `WhatsApp Video 2026-07-28 at 20.36.57.mp4` (70 s, 384×832, Fortaleza-CE, 18:15) → §1 a §8
- **v2** — `WhatsApp Video 2026-08-18 at 19.25.48.mp4` (33 s, 384×848, São Paulo-SP, 19:15, **com áudio**) → §9
- **v3** — revisão pedida por escrito (avatar editável, facial oval, foto de referência) → §10
- **v4** — `WhatsApp Video 2026-08-19 at 19.00.13.mp4` (**3 min 05 s**, app v7.10.26, **narração contínua**) → §11
- **v5** — correções de comportamento contra o protótipo (ponteiro em movimento, tela cheia) → §12
- **v6** — refinamento do traçado: rota aderente à malha viária → §13
- **v7** — léxico: nenhuma string visível contém "rota"/"rotas"; no lugar, **99** → §14
- **v8** — ícone de tela de início (PWA) a partir da arte enviada → §15

> ⚠️ **Precedência: v8 > v7 > v6 > v5 > v4 > v3 > v2 > v1.** Onde houver conflito, vale a versão mais alta. A v1 continua sendo fonte única apenas para o que nenhuma versão posterior mostrou.

**Destino final:** protótipo de alta fidelidade interativo para apresentação a grupo de pesquisa. Fidelidade máxima de cores, tipografia, animações e telas — as §2, §2.5 a §2.7 e §5 são invariantes: nenhuma versão posterior as altera, só acrescenta.
**Destino:** insumo para o **Claude Design** gerar protótipos de alta fidelidade interativos
**Autor da análise:** Claude · **Data:** 19/08/2026

> **Nota sobre o áudio:** ambos os vídeos foram transcritos com **Whisper rodando localmente** (sherpa-onnx / Whisper *small*, int8, `language=pt`, chunks de 25 s).
> - **v1:** sem narração. Os primeiros 60 s são silêncio absoluto (RMS = 0.0000); só há som em 60–70 s, o **alerta de nova corrida**. Toda a §1–§8 vem de análise visual.
> - **v2:** **com fala**, transcrita na íntegra. Contém três requisitos explícitos de produto — ver §9.1 (R1, R2, R3). São obrigatórios.
> - **v4:** **narração contínua nos 3 min**, transcrita em 8 blocos. Contém mais nove requisitos — ver §11.1 (R4 a R12). Também obrigatórios.

---

## 0. Como usar este documento

| Seção | Serve para |
|---|---|
| 1 | Entender o que o vídeo mostra (inventário de telas e evidências) |
| 2 | Design tokens — cole direto em `src/tema/` |
| 3 | Componentes com anatomia, props e estados |
| 4 | Especificação tela a tela (a parte que o Claude Design consome) |
| 5 | Movimento e microinterações |
| 6 | Máquina de estados e navegação |
| 7 | **Prompts prontos** para o Claude Design, um por tela |
| 8 | Checklist de verificação |
| **9** | **Atualização v2** — tokens, componentes e prompts do vídeo de São Paulo, mais os requisitos falados |
| **10** | **Revisão v3** — avatar editável, moldura facial oval e foto de perfil como referência na verificação |
| **11** | **Expansão v4** — walkthrough completo: ganhos, carteira, Pix, veículos, preferências por categoria, mapa arrastável |
| **12** | **Correções v5** — ponteiro que percorre a rota e navegação em tela cheia |
| **13** | **Refinamento v6** — trajeto aderente às ruas reais do mapa |
| **14** | **Léxico v7** — a palavra "rota" sai da interface e vira "99" |
| **15** | **Ícone v8** — ícone de tela de início, manifest e modo tela cheia |

Regra geral: **fidelidade máxima.** Projeto acadêmico, não publicado — logos, banners e nomes da marca ficam como estão nos vídeos. A única troca necessária é de dados pessoais reais (§2.9).

**Ordem sugerida de execução no Claude Design:**

1. **Prompt 0** — fundação (tokens, tipografia, componentes base)
2. **Prompt 14** — splash · **Prompt 9** → **Prompt 15** — mapa v2 e depois arrastável
3. **Prompt 13** — facial oval com foto de referência · **Prompt 10** — card de oferta
4. **Prompt 12** — perfil com avatar editável · **Prompt 16** — configurações e editor de conta
5. **Prompt 17** — veículos · **Prompt 20** — preferências de serviços (depende do 17)
6. **Prompt 21** — teste de status · **Prompt 18** — ganhos e carteira · **Prompt 19** — Pix
7. **Prompt 2** — menu lateral · **Prompt 22** — corrida em andamento com ponteiro em movimento · **Prompt 8** — resumo e ganhos

8. **Prompt 24** — passe sobre as telas de mapa: trajeto aderente às ruas
9. **Prompt 25** — passe final de léxico: "rota" some da interface e vira "99"
10. **§15** — publicar os ícones e o `manifest.json` junto do protótipo (não precisa de prompt: os arquivos já estão prontos em `assets/icons/`)

**Precedência entre versões:** v7 (§14) > v6 (§13) > v5 (§12) > v4 (§11) > v3 (§10) > v2 (§9) > v1 (§1–§8).
**Prompts substituídos — não rode:** 1 (→15), 3 (→21), 4 e 11 (→13), 5 (→10), 6 (→12 e 17), 7 (→22), 20(a) (→23).
Os **Prompts 24 e 25** não substituem nada — são passes aplicados por cima das telas já prontas. O **25 é sempre o último**.

---

## 1. Inventário do vídeo

35 frames amostrados a 0,5 fps. Fluxo observado, em ordem:

| # | Tempo | Tela | Evidência |
|---|---|---|---|
| 1 | 0–3 s | Home screen do iOS | ícones 99 Motorista, iFood, INDRIVE, Uber Driver |
| 2 | 3–7 s | **Splash** | fundo amarelo, padrão de hexágonos em baixo contraste, wordmark "99" cinza translúcido no centro |
| 3 | 7–16 s | **Home / Mapa (offline)** | mapa claro, camada hexagonal amarela, avatar de posição azul, header, banner, barra inferior com "Conectar" |
| 4 | 16–22 s | **Menu lateral (drawer esquerdo)** | perfil, taxas, lista de 9+ itens |
| 5 | 22–26 s | **Veículo** | card MOTO / placa / modelo / "Aprovado" |
| 6 | 26–30 s | **Perfil** | avaliação 0.00 com distribuição de estrelas |
| 7 | 30–36 s | **Preferências de solicitações (drawer direito)** | toggle "Definir meu destino", "Assistente de ganhos" |
| 8 | 36–46 s | **Teste de status** | anel de progresso 1/6 → 6/6, checklist, resultado "Perfeito" |
| 9 | 46–52 s | **Conectando** | botão vira "Carregando…" com três pontos |
| 10 | 52–60 s | **Reconhecimento facial** | header preto, preview circular, arco de progresso azul, linha de varredura |
| 11 | 60–64 s | **Buscando** | barra inferior sem botão, rótulo "Buscando" animado |
| 12 | 64–70 s | **Oferta de corrida** | bottom sheet preto, R$ 19,00, barra de tempo, origem/destino |

**O que o vídeo NÃO mostra** (mas está no `ARQUITETURA.md` e entra no protótipo — §4.11 a §4.13): corrida em andamento, resumo da corrida, tela de ganhos com gráfico.

---

## 2. Design tokens

Valores amostrados por quantização de cor nos frames originais. O vídeo é comprimido (384 px de largura, H.264), então as cores foram **arredondadas para valores canônicos limpos** — a coluna "observado" registra a medição bruta para auditoria.

### 2.1 Cores de marca

| Token | Hex | Observado | Uso |
|---|---|---|---|
| `amarelo/500` | `#FBE300` | `#FAE627` | Botão primário (Conectar), splash, banner, zona quente |
| `amarelo/600` | `#E8D000` | — | Estado pressionado do primário |
| `amarelo/300` | `#FDEF7A` | `#F9EF98` | Zona de demanda média, fundo do splash |
| `amarelo/100` | `#FEF8CC` | — | Fundo de badge suave |
| `roxo/900` | `#241B37` | `#251C38` | Pill de ganhos, pill "99 Moto", texto forte |
| `rosa/500` | `#E31C5F` | `#983257`¹ | Taxa de finalização, instrução secundária do facial |
| `preto/sheet` | `#1A181B` | `#1A181B` | Bottom sheet de oferta, header do facial |

¹ medido sobre fundo branco com anti-aliasing pesado — o valor canônico é o magenta da marca.

### 2.2 Cores semânticas

| Token | Hex | Uso |
|---|---|---|
| `sucesso/500` | `#2FD05B` | Checks do Teste de status, anel "Perfeito", ponto de origem |
| `sucesso/100` | `#E6F9EC` | Fundo de badge "Aprovado" |
| `alerta/500` | `#E8833A` | Barra de tempo da oferta (preenchida) |
| `alerta/700` | `#754219` | Fundo do badge "R$ 5,70 incluídos" |
| `alerta/300` | `#F5C542` | Texto do badge "incluídos" |
| `erro/500` | `#EB312B` | Ponto de destino, badge de notificação |
| `info/500` | `#4A90D9` | Arco do reconhecimento facial, avatar de posição no mapa |
| `info/700` | `#2F6FB5` | Borda do avatar de posição |

### 2.3 Neutros

| Token | Hex | Uso |
|---|---|---|
| `neutro/0` | `#FFFFFF` | Cards, drawers, header |
| `neutro/50` | `#F9F7FA` | Fundo de tela (Perfil, Teste de status) |
| `neutro/100` | `#EFEDF1` | Trilho de barras, divisores fortes |
| `neutro/200` | `#DCDAE0` | Bordas de card, trilho de estrelas |
| `neutro/400` | `#9D9CA1` | Texto terciário, ícones inativos |
| `neutro/600` | `#5D5B61` | Texto secundário |
| `neutro/900` | `#1C1A1F` | Texto primário |
| `sheet/trilho` | `#353A48` | Trilho não preenchido da barra de tempo (sobre preto) |
| `sheet/texto2` | `#A09EA1` | Texto secundário sobre o sheet preto |

### 2.4 Camada de demanda (hexágonos)

O 99 real usa **grade hexagonal** (H3), não quadrados nem heatmap borrado — isso é visível nos frames 6, 18, 30, 35: hexágonos grandes de aresta reta, adjacentes, com fill sólido semitransparente e **sem contorno**.

> Isso muda a recomendação do `ARQUITETURA.md` §6.1. Para o **protótipo** desenhe hexágonos direto (é o visual correto); para a **implementação em RN**, `h3-js` + `<Polygon>` chega mais perto do original do que o `<Heatmap>`.

| Nível | Fill | Opacidade | Multiplicador equivalente |
|---|---|---|---|
| `normal` | — | 0 | 1.0x — não desenha |
| `aquecida` | `#FDEF7A` | 0.45 | 1.1–1.3x |
| `quente` | `#FBE300` | 0.55 | 1.4–1.8x |
| `muito_quente` | `#F5A623` | 0.60 | 1.9–2.5x |

Aresta do hexágono no protótipo: **≈ 110 px** na largura de 390 px (cobre ~4 hexágonos na horizontal). Sem stroke. Blend `multiply` sobre o mapa para o texto de rua continuar legível.

### 2.5 Tipografia

O app usa uma grotesca geométrica proprietária. Substituto livre mais próximo, nesta ordem: **Inter** → `Plus Jakarta Sans` → system.

| Token | Tamanho / Peso / Line-height | Uso |
|---|---|---|
| `display/xl` | 44 / 700 / 48 | Valor da oferta — "R$ 19,00" |
| `display/lg` | 34 / 700 / 40 | Anel do Teste de status — "6/6" |
| `título/lg` | 22 / 700 / 28 | "YGOR JOSÉ", "Avaliação 0.00" |
| `título/md` | 18 / 600 / 24 | Título de header, "Olhe diretamente para a câmera" |
| `corpo/lg` | 17 / 600 / 22 | Itens do menu lateral, "7Min (3.4km)" |
| `corpo/md` | 15 / 400 / 20 | Endereços, descrições |
| `corpo/sm` | 13 / 400 / 18 | "R$ 1,22 por km", "Taxa de Aceitação" |
| `label/btn` | 18 / 700 / 22 | "Conectar", "Adicionar" |
| `label/chip` | 12 / 600 / 16 | "Cartão Verif.", "MOTO" |

Números de dinheiro sempre **tabular** (`font-variant-numeric: tabular-nums`) — sem isso o contador de ganhos treme durante a animação.

### 2.6 Espaçamento

Escala de 4: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`.
Padding lateral padrão de tela: **16 px**. Padding interno de card: **16 px**. Gap entre itens de lista do menu: **30 px** (o menu é generosamente arejado — é a característica visual mais marcante do drawer).

### 2.7 Raio e elevação

| Token | Valor | Uso |
|---|---|---|
| `raio/pill` | 999 | Botões primários, chips, pills de header |
| `raio/sheet` | 20 (topo) | Bottom sheet de oferta |
| `raio/card` | 12 | Cards de veículo, checklist |
| `raio/fab` | 999 | Botão de recentrar, botão X |
| `sombra/sheet` | `0 -8 24 rgba(0,0,0,.25)` | Bottom sheet |
| `sombra/flutuante` | `0 2 8 rgba(0,0,0,.14)` | Header pills, banner, FAB |
| `sombra/drawer` | `0 0 32 rgba(0,0,0,.30)` | Drawer aberto |

### 2.8 Grid e frame

Protótipo em **390 × 844** (iPhone 14/15). Safe area topo 59 px, home indicator 34 px. Barra de status: fundo transparente, ícones escuros no modo claro e claros sobre o sheet preto.

### 2.9 Assets de marca

Projeto **acadêmico, não publicado**. Reproduza a marca como está nos vídeos: wordmark "99", banners promocionais reais ("Ganhe R$ 500 indicando um motora pra 99!", "99 Moto — Ganhe mais sem parar no ponto"), rótulos "99 Moto" (ver §14), "Loja 99", categorias 99Pop/99Comfort/99Entrega. Fidelidade máxima é o objetivo.

Duas ressalvas práticas, não de marca:

- **Dados pessoais reais** do vídeo (nome do motorista, foto, placa TOV2J77) → troque por fictícios. Não é questão de marca, é de não vazar o dado de quem gravou.
- Se algum dia o APK sair da sua máquina, aí sim troque o nome e a logo antes de distribuir.

---

## 3. Componentes

### 3.1 `BotaoPrimario`
Pill amarelo, largura 180–200 px (não é full-width — fica centralizado entre dois ícones na barra inferior), altura 56, `label/btn` em `neutro/900`.
**Estados:** `default` · `pressed` (`amarelo/600`, scale 0.97) · `loading` ("Carregando…" + três pontos pulsando em sequência, 400 ms de defasagem) · `hidden` (some no estado `Buscando`, restando só o rótulo de texto animado) · `disabled` (`neutro/200`, texto `neutro/400`).

### 3.2 `BarraInferior`
Altura 88 (56 de conteúdo + 32 de home indicator). Três slots: **ícone de filtro/preferências** (esquerda, abre drawer direito) · **slot central** (botão ou rótulo de status) · **ícone de checklist** (direita). Fundo `neutro/0`, sem borda superior — separa-se do mapa apenas pelo `sombra/flutuante` invertido.

Variantes do slot central: `Conectar` (botão) · `Carregando…` (botão em loading) · `Buscando` (só texto `título/md`, com shimmer horizontal).

### 3.3 `HeaderMapa`
Flutua sobre o mapa, 12 px abaixo da safe area.
- **Esquerda:** botão circular 44 px branco com ícone hambúrguer + ponto vermelho 8 px no canto superior direito quando há novidade.
- **Centro:** pill `roxo/900`, altura 44, padding 20, exibe ganhos do dia (`R$ 0,00`) + chevron para baixo. Toque expande o resumo de ganhos.
- **Card de cidade:** aparece colado à esquerda ("Fortaleza / Fortaleza - CE") com ícone de expandir; no estado de oferta ele fica visível e o header some.

### 3.4 `CardOferta` ⭐ (componente mais importante)
Bottom sheet `preto/sheet`, `raio/sheet`, ocupa ~40% da altura, entra de baixo.

Anatomia, de cima para baixo:
1. **Valor** — `display/xl` branco, centralizado. `R$ 19,00`
2. **Taxa por km** — `corpo/sm` em `sheet/texto2`. `R$ 1,22 por km`
3. **Badge de bônus** — pill `alerta/700` com bullet e texto `alerta/300`, `label/chip`. `● R$ 5,70 incluídos`
4. **Barra de tempo** — altura 4, `raio/pill`, preenchida em `alerta/500` sobre trilho `sheet/trilho`; encolhe da direita para a esquerda em 15 s, linear
5. **Linha de credibilidade** — `● 4.81 · 51 corridas · [Cartão Verif.]`; o chip final é azul `info/500` com ícone de escudo
6. **Origem** — ponto `sucesso/500` 10 px + `7Min (3.4km)` em `corpo/lg` branco + endereço em `corpo/md` `sheet/texto2`
7. **Destino** — ponto `erro/500` + mesma estrutura
8. *(fora do quadro no vídeo, previsto)* área de ação: **Aceitar** em `amarelo/500` full-width e **Recusar** como texto discreto

**Fechar:** botão circular preto 44 px com X branco no topo direito da tela, fora do sheet.
**Estados:** `entrando` · `ativo` · `expirando` (últimos 3 s: barra pisca, valor faz pulse de 1.0→1.03) · `expirado` · `aceito`.

### 3.5 `ItemMenu`
Texto `corpo/lg` em `neutro/900`, altura mínima 48, sem ícone à esquerda, sem chevron. Indicadores à direita: ponto `erro/500` (novidade, ex.: "Central de Educação") ou spinner `neutro/400` (carregando, ex.: "Veículos").

### 3.6 `AnelProgresso`
Círculo de 130 px, stroke 10, trilho `neutro/100`, preenchimento `sucesso/500`, cantos arredondados, início às 12 h no sentido horário. Centro: contador `display/lg` + rótulo `corpo/sm` `neutro/600`. Transição entre passos com `ease-out` de 600 ms.

### 3.7 `LinhaChecklist`
Altura 58, texto `corpo/md`. Três estados no ícone à direita (24 px): **pendente** = círculo vazado `neutro/200` + texto `neutro/400`; **testando** = ícone de refresh girando 1 s/volta + texto `neutro/400`; **aprovado** = check branco em disco `sucesso/500` + texto `neutro/900`. A cor do texto migrando de cinza para preto na aprovação é o detalhe que faz a tela parecer viva.

### 3.8 `MolduraFacial`
Círculo de 240 px. Preview da câmera com máscara circular. Anel externo `neutro/200` de 4 px + **arco de progresso** `info/500` de 4 px que percorre 0→360° em ~6 s, com um ponto de 6 px na cabeça do arco. **Linha de varredura** horizontal `info/500` a 40% de opacidade descendo e subindo em loop de 2 s. Abaixo: instrução primária `título/md` em `neutro/900` e a **mesma frase repetida** em `rosa/500` itálico (é literalmente assim no app — provavelmente o subtítulo de acessibilidade). Spinner `info/500` no rodapé.

### 3.9 `CardVeiculo`
Card branco, `raio/card`, borda `neutro/200`. Chip `MOTO` (outline, `label/chip`) à esquerda e status `Aprovado` em `sucesso/500` à direita. Placa em `título/lg`, modelo em `corpo/sm` `neutro/600`, thumbnail do veículo à direita. Rodapé: ponto verde + "Veículo ativo".

### 3.10 `DistribuicaoEstrelas`
Cinco linhas `5→1`. Cada linha: número `corpo/md` + estrela 16 px `amarelo/500` + barra de 8 px `raio/pill` (trilho `neutro/100`, preenchimento `amarelo/500`) + contagem à direita `corpo/md` `neutro/600`.

### 3.11 `FabRecentrar`
Círculo 48 px branco, `sombra/flutuante`, ícone de seta de navegação `info/500`. Fica acima do banner promocional, alinhado à direita.

### 3.12 `AvatarPosicao`
Disco branco 34 px com borda de 3 px, seta `info/500` apontando na direção do movimento, com halo `info/500` a 15% de 60 px pulsando (scale 1→1.4, opacidade 0.3→0, 2 s em loop).

### 3.13 `BannerPromo`
Card `amarelo/500` de altura 96, `raio/card`, ancorado acima da barra inferior com 16 px de margem. Título em duas linhas com peso misto (bold + regular na mesma frase), botão pill claro pequeno, arte à direita, **X** de fechar 20 px no canto superior direito.

### 3.14 `Drawer`
Esquerdo (menu, ~85% da largura) e direito (preferências, ~72%). Deslizam com `ease-out` 280 ms, overlay `rgba(0,0,0,.35)` em fade. Fecham por toque no overlay ou swipe.

### 3.15 `Toggle`
Trilho 51×31, `raio/pill`. Off: `neutro/200`. On: `amarelo/500` com botão branco. (No frame de Preferências o toggle aparece off.)

---

## 4. Especificação por tela

Cada tela lista: **layout · conteúdo · estados · interações**.

### 4.1 Splash
Fundo `amarelo/300` com padrão de hexágonos em `amarelo/500` a 25% de opacidade, escala grande (3 colunas visíveis). Monograma centralizado em cinza translúcido, ~120 px. O header e a barra inferior da Home já aparecem esmaecidos por baixo — é uma **transição de cobertura**, não uma tela separada: o splash faz fade-out revelando o mapa em ~800 ms.

### 4.2 Home / Mapa — `OFFLINE`
Mapa claro fullscreen (estilo Google Maps padrão, ruas brancas, água azul-claro, POIs com pins coloridos). Camada hexagonal ativa. `HeaderMapa` com pill em `R$ 0,00`. `AvatarPosicao` no centro-baixo. `FabRecentrar` à direita. `BannerPromo`. `BarraInferior` com **Conectar**.
**Interações:** hambúrguer → drawer esquerdo · ícone de filtro → drawer direito · pill de ganhos → expande · Conectar → §4.8.

### 4.3 Menu lateral
Topo centralizado: avatar 76 px, `Nome · 5,00 ★` em `título/md`, pill `roxo/900` "99 Moto ›" (§14).
Duas colunas de métrica: **Taxa de Aceitação 0%** (`neutro/900`) e **Taxa de Finalização 0%** (`rosa/500`) — a cor diferente é intencional: sinaliza a métrica em risco.
Divisor `neutro/100`. Lista: Ganhos · Recompensas · Indique um amigo · Central de Ajuda · Notificações · Central de Educação ● · Loja · Veículos ⟳ · Horas Dirigidas. Rola verticalmente.

### 4.4 Veículo
Header com voltar + título "Veículo". `CardVeiculo`. Botão **Adicionar** `amarelo/500` ancorado no rodapé, full-width menos 16 px de margem.

### 4.5 Perfil
Fundo `neutro/50`. Header com voltar + engrenagem à direita. Avatar 96 px, nome em `título/lg` **caixa alta**, botão outline pill "Ver perfil público". Dois números lado a lado: `0 Corridas` · `1 Dia`. Bloco de avaliação: "Avaliação 0.00 ★" + link "Como funciona ›" à direita, legenda "Média das 100 últimas avaliações de corridas", `DistribuicaoEstrelas`.

### 4.6 Preferências de solicitações
> 🚫 **Revogada pela §12.2.** Esta tela **não** é drawer — abre em tela cheia com header escuro e push horizontal. O conteúdo descrito abaixo continua válido; o contêiner, não.

~~Drawer direito.~~ Seção **Preferências de solicitações**: linha com ícone de alvo + "Definir meu destino" + `Toggle`; linha com engrenagem + "Configurar solicitações ›". Seção **Assistente de ganhos**: "Teste de status ›" (ícone refresh) e "Eventos futuros ›" (ícone de gráfico). Títulos de seção em `título/md`, itens em `corpo/md` sobre cards brancos com `raio/card`.

### 4.7 Teste de status
Fundo `neutro/50`. Header voltar + "Teste de status" + (no fim) "Tentar novamente" à direita.
`AnelProgresso` centralizado. Card branco com 6 `LinhaChecklist`: Status de internet · Localização · Status do perfil · Análise de documentos · Status da solicitação · Configurações da solicitação.
**Sequência:** cada item leva ~1,2 s; o anel avança junto. Ao chegar em 6/6 o anel encolhe para 100 px, muda o rótulo para **"Perfeito"** com subtítulo "O melhor status!" e o card ganha o cabeçalho colapsável "Testes aprovados ⌃".

### 4.8 Conectando
A `BarraInferior` troca o rótulo para **Carregando…** com três pontos; o resto da tela não muda. Duração ~1,5 s, depois navega para o facial.

### 4.9 Reconhecimento facial
Header `preto/sheet` com voltar branco + "Reconhecimento facial". Corpo branco. `MolduraFacial` centralizada em ~38% da altura. Instrução dupla abaixo. Spinner no rodapé.
**Estados:** `posicionando` (arco a 0, instrução "Posicione o rosto no círculo") · `verificando` (arco preenchendo) · `sucesso` (anel vira `sucesso/500`, check, 600 ms, e volta ao mapa) · `falha` (anel `erro/500`, "Não conseguimos verificar. Tentar novamente").

### 4.10 Buscando
Idêntico à Home, com três diferenças: o botão sai e vira o rótulo **Buscando** com shimmer; o `AvatarPosicao` ganha o halo pulsante; a camada de demanda ganha uma leve animação de respiração nos hexágonos mais quentes (opacidade ±0.05, 3 s).

### 4.11 Oferta de corrida
Ver §3.4. Ao entrar: mapa escurece 20%, `CardOferta` sobe em 320 ms com `ease-out-back` leve, alerta sonoro + `expo-haptics` no impacto. O card de cidade sobe para o topo esquerdo e o **X** aparece no topo direito.

### 4.12 Corrida em andamento *(do `ARQUITETURA.md`, não filmada)*
> ⚠️ **Complementada pela §12.1.** O layout abaixo continua válido, mas o ponteiro do motorista **precisa percorrer a rota** — ver a especificação de movimento na §12.1 antes de construir esta tela.
Mesmo mapa, com `Polyline` `roxo/900` de 5 px, marcador de origem `sucesso/500` e destino `erro/500`, `fitToCoordinates` com padding de 80. Bottom sheet **claro** (não preto — o preto é reservado para a oferta), 3 alturas de snap: 120 / 280 / 480.
Conteúdo: avatar + nome do passageiro + nota, endereço do trecho atual, ações secundárias (ligar / mensagem / cancelar) e um **botão de ação único** que muda de rótulo e cor conforme o estado:

| Estado | Rótulo | Cor |
|---|---|---|
| `INDO_BUSCAR` | Cheguei | `amarelo/500` |
| `AGUARDANDO` | Iniciar viagem | `sucesso/500` |
| `EM_VIAGEM` | Finalizar corrida | `roxo/900` (texto branco) |

Use **deslizar para confirmar** no "Finalizar" — é a ação irreversível.

### 4.13 Resumo e Ganhos *(do `ARQUITETURA.md`, não filmadas)*
**Resumo:** valor grande com contagem animada de 0 até o total (900 ms, `ease-out`), decomposto em `corrida R$ 18,00 + dinâmico R$ 14,40` conforme §6.6 do `ARQUITETURA.md`, distância, tempo e componente de avaliação com 5 estrelas tocáveis.
**Ganhos:** total do dia em `display/xl`, fatia vinda de dinâmico como barra segmentada (`amarelo/500` base + `alerta/500` dinâmico), gráfico de barras por hora e lista de corridas do dia com valor à direita.

---

## 5. Movimento

| Elemento | Duração | Curva | Observação |
|---|---|---|---|
| Splash → Mapa | 800 ms | `ease-in-out` | fade da cobertura |
| Drawer abre/fecha | 280 ms | `ease-out` | overlay em fade paralelo |
| `CardOferta` entra | 320 ms | `cubic-bezier(.2,.8,.2,1)` | translateY 100% → 0 |
| Barra de tempo | 15 000 ms | `linear` | **nunca** com easing — o tempo é literal |
| Anel do Teste de status | 600 ms/passo | `ease-out` | |
| Arco facial | 6 000 ms | `linear` | |
| Linha de varredura | 2 000 ms | `ease-in-out` | alternando |
| Halo do avatar | 2 000 ms | `ease-out` | loop infinito |
| Contador de ganhos | 900 ms | `ease-out` | tabular-nums obrigatório |
| Multiplicador da zona | 1 000 ms | `ease-in-out` | com a suavização de 25%/tick da §6.3 do `ARQUITETURA.md` |

**Não anime:** a posição dos hexágonos (só opacidade/cor), o texto de endereço, a barra de tempo com bounce.

---

## 6. Navegação e estados

```
Splash → Mapa[OFFLINE] ──Conectar──► Carregando ──► Facial ──sucesso──► Mapa[BUSCANDO]
   │                                                   │
   │                                                   └──falha──► Facial[erro] ──► Mapa[OFFLINE]
   │
   ├─hambúrguer─► Drawer esquerdo ─► Veículo | Perfil | Ganhos | …
   └─filtro─────► Drawer direito  ─► Teste de status | Eventos futuros

Mapa[BUSCANDO] ──oferta──► Oferta[ativo] ──15s/X──► Mapa[BUSCANDO]
                                │
                                └──Aceitar──► Corrida[INDO_BUSCAR → AGUARDANDO → EM_VIAGEM] ──► Resumo ──► Mapa[BUSCANDO]
```

Alinhado à máquina de estados da §2 do `ARQUITETURA.md`, com um ajuste: o app real insere **Carregando** e **Reconhecimento facial** entre `OFFLINE` e `ONLINE`, e chama o estado online de **"Buscando"**, não "Online". Recomendo renomear no `corridaStore` para `BUSCANDO` — fica fiel ao produto e é mais descritivo.

---

## 7. Prompts para o Claude Design

Cole um por vez. Cada um assume que os tokens das §2 já foram fornecidos como contexto.

**Prompt 0 — fundação (rode primeiro)**
> Crie um protótipo mobile de alta fidelidade, 390×844, para um app de motorista de corridas. Estabeleça primeiro o design system: cores, tipografia (Inter), espaçamento em escala de 4, raios e sombras exatamente conforme a tabela de tokens que vou colar. Gere uma página de estilo mostrando a paleta, a escala tipográfica e os componentes base: botão pill primário, chip, card, toggle, anel de progresso e linha de checklist com três estados.

**Prompt 1 — Mapa / Home**
> Tela de mapa fullscreen em estilo claro, com uma camada de hexágonos amarelos semitransparentes sobre uma região urbana (aresta ~110 px, sem contorno, blend multiply, três níveis de intensidade). Flutuando sobre o mapa: botão circular branco de menu com ponto vermelho de notificação à esquerda, pill roxo-escuro central mostrando "R$ 0,00" com chevron, card branco pequeno com o nome da cidade colado à esquerda. Avatar de posição circular branco com seta azul e halo pulsante. FAB circular de recentrar. Card promocional amarelo de 96 px acima da barra inferior, com X de fechar. Barra inferior branca com ícone de filtro à esquerda, botão pill amarelo "Conectar" de 190×56 no centro e ícone de checklist à direita. Faça o botão ter três variantes: Conectar, "Carregando…" com pontos animados, e apenas o texto "Buscando" com shimmer.

**Prompt 2 — Menu lateral**
> Drawer lateral esquerdo cobrindo 85% da largura sobre o mapa escurecido. Topo centralizado: avatar de 76 px, nome com rating "5,00 ★", pill roxo-escuro "99 Moto ›". Abaixo, duas métricas lado a lado: "0% / Taxa de Aceitação" em preto e "0% / Taxa de Finalização" em magenta. Divisor. Lista vertical bem arejada (gap de 30 px) com itens em 17px semibold: Ganhos, Recompensas, Indique um amigo, Central de Ajuda, Notificações, Central de Educação (com ponto vermelho à direita), Loja, Veículos (com spinner à direita), Horas Dirigidas.

**Prompt 3 — Teste de status**
> Tela clara com header "Teste de status" e ação "Tentar novamente". Anel de progresso de 130 px, stroke 10 arredondado, verde sobre trilho cinza, com "1/6" e "Testando" no centro. Card branco abaixo com 6 linhas: Status de internet, Localização, Status do perfil, Análise de documentos, Status da solicitação, Configurações da solicitação. Cada linha tem três estados visuais: pendente (círculo vazado, texto cinza), testando (ícone de refresh girando), aprovado (check branco em disco verde, texto preto). Gere também o estado final: anel completo, "Perfeito / O melhor status!" e todas as linhas aprovadas sob o cabeçalho colapsável "Testes aprovados".

**Prompt 4 — Reconhecimento facial**
> Tela com header preto "Reconhecimento facial" e corpo branco. No centro, moldura circular de 240 px com preview de câmera mascarado, anel externo cinza de 4 px, arco de progresso azul percorrendo 0→360° com um ponto na ponta, e uma linha horizontal azul translúcida varrendo o círculo de cima a baixo em loop. Abaixo: "Olhe diretamente para a câmera" em preto 18px semibold e a mesma frase repetida em magenta itálico. Spinner azul no rodapé. Gere as variantes de sucesso (anel verde com check) e falha (anel vermelho com botão "Tentar novamente").

**Prompt 5 — Card de oferta** ⭐
> Sobre o mapa escurecido em 20%, um bottom sheet preto (#1A181B) com cantos superiores de 20 px ocupando 40% da altura. De cima para baixo, centralizado: "R$ 19,00" em 44px bold branco; "R$ 1,22 por km" em 13px cinza; pill marrom-escuro com bullet e texto âmbar "R$ 5,70 incluídos"; barra de tempo de 4 px preenchida em laranja sobre trilho azul-acinzentado; linha com "● 4.81 · 51 corridas" e um chip azul "Cartão Verif." com ícone de escudo. Depois, alinhados à esquerda, dois blocos: ponto verde + "7Min (3.4km)" em 17px branco + "R. Barão de Aracati 531, Parquelândia" em 15px cinza; e ponto vermelho + "9Min (1.3km)" + "R. Pedro Borges 2142, Benfica". No rodapé do sheet, botão pill amarelo "Aceitar" full-width e "Recusar" como texto discreto abaixo. Fora do sheet, botão circular preto com X branco no topo direito da tela e card branco de cidade no topo esquerdo. A barra de tempo deve animar de 100% a 0% em 15 s de forma linear, e nos últimos 3 s o valor faz um pulse sutil.

**Prompt 6 — Perfil e Veículo**
> Duas telas com fundo cinza-claro. **Perfil:** header com voltar e engrenagem; avatar de 96 px; nome em caixa alta 22px bold; botão outline pill "Ver perfil público"; dois números lado a lado "0 Corridas" e "1 Dia"; bloco "Avaliação 0.00 ★" com link "Como funciona ›" e legenda "Média das 100 últimas avaliações de corridas"; distribuição de 5 a 1 estrela com barras finas amarelas e contagem à direita. **Veículo:** header com voltar; card branco com chip outline "MOTO" à esquerda e "Aprovado" em verde à direita, placa em 22px bold, modelo em cinza, thumbnail da moto à direita, e rodapé com ponto verde e "Veículo ativo"; botão amarelo "Adicionar" fixo no rodapé.

**Prompt 7 — Corrida em andamento**
> Mapa com rota traçada em roxo-escuro de 5 px entre um marcador verde e um vermelho, com zoom ajustado à rota. Bottom sheet claro com três alturas de snap (120/280/480), mostrando avatar e nome do passageiro com nota, o endereço do trecho atual, três ações secundárias em ícone (ligar, mensagem, cancelar) e um botão de ação principal full-width. Gere três variantes do botão: "Cheguei" em amarelo, "Iniciar viagem" em verde e "Finalizar corrida" como deslizar-para-confirmar em roxo-escuro.

**Prompt 8 — Resumo e Ganhos**
> **Resumo:** valor total em 44px bold com números tabulares, decomposto abaixo em duas linhas "Corrida R$ 18,00" e "Dinâmico R$ 14,40" com um chip "1,8x"; distância e tempo em duas colunas; bloco de avaliação com 5 estrelas tocáveis e botão amarelo "Enviar". **Ganhos:** total do dia em destaque, barra segmentada mostrando a fatia de preço dinâmico em laranja sobre a base amarela, gráfico de barras por hora do dia, e lista de corridas com horário, endereço curto e valor à direita.

---

## 8. Checklist de verificação do protótipo

- [ ] Tokens de cor batem com a §2 (nenhum hex inventado fora da tabela)
- [ ] Botão primário é pill de ~190 px, **não** full-width, na barra inferior
- [ ] Hexágonos são polígonos sólidos sem contorno — não heatmap borrado
- [ ] Bottom sheet de oferta é **preto**; o de corrida em andamento é **claro**
- [ ] Barra de tempo da oferta é linear e dura 15 s
- [ ] Instrução do facial aparece duplicada (preto + magenta itálico)
- [ ] "Taxa de Finalização" está em magenta e "Taxa de Aceitação" em preto
- [ ] Todos os valores monetários usam numerais tabulares
- [ ] Dados pessoais reais substituídos por fictícios (§2.9)
- [ ] Cada tela tem seus estados de carregamento, vazio e erro

*(A §9 acrescenta itens de verificação da versão v2 — leia até o fim antes de fechar o checklist.)*

---

# 9. Atualização v2 — vídeo de São Paulo (18/08, 33 s)

**Fonte:** `WhatsApp Video 2026-08-18 at 19.25.48.mp4` (33 s, 384×848, São Paulo-SP, 19:15). 16 frames + **áudio com fala**, transcrito com o mesmo Whisper local.

Esta é uma **versão diferente e mais recente do app** que a do vídeo de Fortaleza. Onde as duas divergem, **a v2 é a referência canônica do protótipo** — ela é mais rica e mais próxima do produto atual. A v1 continua valendo para tudo que a v2 não mostra (menu lateral, perfil, veículo, teste de status).

### 9.1 Transcrição do áudio

Whisper local, `pt`, dois chunks:

> "Olha se tu consegue deixar assim, tipo, nem muito dessa bolinha, a amarela tu tem que deixar porque essas vermelhas aqui repara, aí tu deixa a amarela só que pouca, tá ligado. Aí tipo, quando fizer facial do cara assim, aí aparece a linha que aparece, tá ligado, o trajeto, ó."
>
> "Mas tu conseguiu — tava passando por cima do trajeto, tive aqui no ponteiro, o ponteiro vai pra cima da minha…"

**Três requisitos diretos do usuário, extraídos da fala.** São instruções de produto, não observações — trate como obrigatórias:

| # | Fala | Requisito |
|---|---|---|
| R1 | *"nem muito dessa bolinha… a amarela tu deixa só que pouca"* | Os **marcadores circulares de passageiro** (as "bolinhas" amarelas) devem ser **poucos e esparsos** — 2 a 4 na viewport, nunca um enxame. Densidade baixa é decisão de design, não acaso. |
| R2 | *"essas vermelhas aqui repara"* | Os **hexágonos vermelhos com faixa de multiplicador** são o sinal visual dominante do mapa. A bolinha amarela é secundária e não pode competir com eles. |
| R3 | *"quando fizer facial do cara, aí aparece a linha… o trajeto"* + *"o ponteiro vai por cima"* | O **trajeto verde** aparece no mapa **depois** da verificação facial, e o **ponteiro do motorista renderiza sempre ACIMA da polyline** (z-index maior). No vídeo o ponteiro estava passando por baixo — é o bug que ele aponta. |

### 9.2 Tokens novos (v2)

**Camada de demanda — vermelha, não amarela.** Esta é a mudança visual mais importante entre as duas versões.

| Token | Hex | Observado | Uso |
|---|---|---|---|
| `demanda/hex` | `#EF7D76` | `#EF7D76` | Fill do hexágono de demanda (opacidade ~0.55, sem stroke) |
| `demanda/hex-forte` | `#E9635B` | `#E9A9A6`¹ | Hexágono de faixa mais alta (2,2X–2,6X) |
| `verde/rota` | `#3ED97F` | — | Polyline do trajeto |
| `verde/500` | `#24D279` | `#24D279` | Pin de origem, barra de tempo da oferta |
| `verde/700` | `#176C4B` | `#176C4B` | Fundo do chip "Prioritário" |
| `verde/300` | `#65D3A6` | `#65D3A6` | Texto do chip "Prioritário" |
| `laranja/pin` | `#EE542C` | `#EE542C` | Pin de destino |
| `sheet/v2` | `#26292E` | `#26292E` | Fundo do card de oferta v2 (carvão, não preto) |
| `sheet/chip` | `#454851` | `#454851` | Fundo do chip "Pgto. no app" |
| `ambar/tarifa` | `#F4C372` | `#F4C372` | Moeda e texto "Tarifa base dinâmica incl." |
| `vermelho/cta` | `#E22808` | `#E22808` | Botão "Quero indicar" no banner |
| `amarelo/v2` | `#F8D60B` | `#F8D60B` | Botão Conectar (praticamente idêntico ao `amarelo/500` da v1) |
| `azul/facial` | `#2445A6` | `#2445A6` | Anel do reconhecimento facial v2 — azul mais saturado e **anel cheio**, não arco fino |

¹ medido com anti-aliasing sobre o mapa claro; o fill puro é mais saturado.

### 9.3 Componentes novos

#### `HexagonoDemanda` (substitui a camada da §2.4)
Hexágono vermelho `demanda/hex`, sem contorno, orientação **pointy-top**, aresta ~90 px em 390 px de largura. Sobrepõem-se parcialmente formando clusters irregulares — não é uma grade regular preenchida, são ilhas de 1 a 3 hexágonos.

Cada cluster carrega **uma** `PillMultiplicador`.

#### `PillMultiplicador` ⭐
Pill branco puro, `raio/pill`, altura 30, `sombra/flutuante`, ancorado na borda superior-esquerda do cluster.
Conteúdo: ícone **raio** ⚡ preto 14 px + label `label/chip` bold preto no formato **faixa**, com vírgula decimal e X maiúsculo:
`1,2X–1,6X` · `1,4X–1,8X` · `1,7X–2,1X` · `1,8X–2,2X` · `2,2X–2,6X`

> **Insight de produto:** a v2 mostra **faixa**, não valor fixo. O app não promete "1,8x" — promete "entre 1,4x e 1,8x". Isso muda o `demandaStore` do `ARQUITETURA.md`: guarde `multiplicadorMin` e `multiplicadorMax`, e derive o valor efetivo da corrida dentro da faixa no momento da oferta. É mais honesto e é o que o produto real faz.

#### `MarcadorPassageiro` (a "bolinha" — R1)
Círculo branco de 44 px com anel `amarelo/500` de 3 px e ícone de pedestre preto no centro. Halo amarelo suave por baixo.
**Regra de densidade (R1): no máximo 3 visíveis por viewport.** Se o simulador gerar mais, agrupe. Ele indica *passageiro pedindo agora naquele ponto* — é informação pontual, o hexágono é a informação agregada.

#### `RotaPreview` (R3)
> ⚠️ **Refinada pela §13.** A geometria precisa ser aderente à malha viária, com halo branco e vértices densos — leia a §13.1 antes de traçar.

Polyline `verde/rota` de 5 px, `stroke-linecap: round`, com curvas seguindo o traçado das ruas (não linha reta). Pontas:
- **Origem:** disco `verde/500` de 40 px com seta ↑ branca
- **Destino:** disco `laranja/pin` de 40 px com seta ↓ branca, com uma "gota" apontando para o ponto exato
- **Motorista:** disco branco de 40 px com anel `info/500` de 3 px e seta azul de navegação

**Z-order obrigatório, de baixo para cima:** mapa → hexágonos → polyline → pins origem/destino → **ponteiro do motorista** → marcadores de passageiro → UI flutuante.

#### `ChipNaoAfetaTA`
Pill `sheet/v2` escuro, altura 40, no topo direito durante a oferta: **✕ Não afeta a TA**. Significa "recusar esta corrida não afeta sua Taxa de Aceitação". Toque = recusar. É o botão de recusa **e** a explicação, num elemento só — copie exatamente, é bom design.

#### `FabsMapa` (coluna direita)
Três botões circulares de 44 px empilhados verticalmente, gap 12, acima do banner:
1. **⚠ Alerta** — branco, ícone de triângulo preto
2. **Camadas** — cinza-claro, ícone de pilha (liga/desliga a camada de demanda)
3. **Escudo azul** — `info/500` sólido, check branco (status de verificação) — este fica **à esquerda**, não na coluna

#### `BannerIndicacao`
Card `amarelo/500`, altura ~100. Texto em duas linhas com peso misto: "Ganhe **R$500** indicando um motora pra **99!**". Abaixo, dois ícones circulares pequenos + botão pill `vermelho/cta` com "Quero indicar" branco. Foto à direita. **✕** no canto superior direito.

#### `CardOferta v2` ⭐ (substitui a §3.4)
Bottom sheet `sheet/v2`, raio superior 24, ~45% da altura. Ordem, de cima para baixo:

1. **Linha de chips** — `Pgto. no app` (fundo `sheet/chip`, texto branco) · `Prioritário` (fundo `verde/700`, texto `verde/300`) · à direita, disco cinza 30 px com o número de corridas na fila (`1`)
2. **Valor** — `display/xl` branco, alinhado à **esquerda**. `R$ 19,92`
3. **Taxa por km** — `corpo/sm` `sheet/texto2`. `R$ 1,76/km`
4. **Barra de tempo** — altura 5, **verde `verde/500`**, full-bleed até a borda do sheet, com um botão de **cadeado** 34 px na ponta direita (aceitar-e-travar / auto-aceite)
5. **Tarifa dinâmica** — ícone de moeda `ambar/tarifa` + `R$ 2,02` bold + `Tarifa base dinâmica incl.` — tudo em `ambar/tarifa`
6. **Credibilidade** — `★ 4,88 · 243 corridas · ☑ Perfil Essencial` (o check é `info/500`)
7. **Origem** — disco `verde/500` 26 px com ↑ + `7min (3,1km)` em `corpo/lg` branco + `Avenida Paes de Barros, 1815, Mooca` em `corpo/md` `sheet/texto2`
8. **Destino** — disco `laranja/pin` com ↓ + `37min (11,3km)` + `Rua Augusta, 2205, Jardins`

**Diferenças relevantes vs. v1:** valor à esquerda (não centralizado); barra de tempo **verde e no topo** do bloco de preço (não laranja no meio); recusa vive no chip flutuante "Não afeta a TA" fora do sheet; unidade escrita `7min`, sem espaço e com **m minúsculo** — na v1 era `7Min`.

#### `MolduraFacial v2`
Círculo de 160 px (menor que a v1), preview com **anel azul `azul/facial` cheio de 5 px** — não arco de progresso. Sem linha de varredura. Fundo da tela `neutro/50`. Instrução em duas linhas centralizadas, `corpo/md` `neutro/600`:
`Por favor, olhe diretamente para a câmera e posicione seu rosto dentro do círculo.`
Header claro com apenas voltar + título centralizado "Reconhecimento facial".

> Sem a duplicata magenta da v1. Se quiser fidelidade máxima, use a v2 — é a versão nova.

### 9.4 Fluxo v2 (o que muda na navegação)

```
Mapa[OFFLINE]                  ← hexágonos vermelhos + faixas + poucas bolinhas
      │ Conectar
      ▼
Reconhecimento facial (v2)
      │ sucesso
      ▼
Mapa[BUSCANDO]                 ← barra inferior vira pill "Buscando"
      │ oferta
      ▼
Mapa[OFERTA]                   ← R3: entra o trajeto verde + pins + ponteiro POR CIMA
      ├─ chip "✕ Não afeta a TA"  → recusa, volta a BUSCANDO
      └─ toque no card / cadeado  → aceita
```

Durante `OFERTA` a UI do mapa é **limpa**: somem header, banner, FABs e barra inferior. Ficam só o trajeto, os três marcadores, o chip de recusa e o sheet. Os hexágonos também somem — o mapa deixa de ser ferramenta de decisão e vira contexto da oferta.

### 9.5 Animação do trajeto (R3)

Ao chegar a oferta, em sequência:
1. Mapa faz `fitToCoordinates` na rota, 600 ms `ease-in-out`, padding 80
2. Polyline **se desenha** da origem ao destino em 700 ms (`stroke-dashoffset` animado), `ease-out`
3. Pins de origem e destino entram com scale 0→1 e overshoot leve, defasados 120 ms
4. Sheet sobe em 320 ms
5. Barra verde começa a esvaziar

O ponteiro do motorista **não anima** — ele já estava lá e permanece por cima o tempo todo.

### 9.6 Prompts adicionais para o Claude Design

**Prompt 9 — Mapa v2 com demanda vermelha** *(substitui o Prompt 1 se você adotar a v2)*
> Tela de mapa fullscreen claro de uma região urbana densa. Sobre o mapa, clusters irregulares de hexágonos vermelho-coral semitransparentes (aresta ~90 px, pointy-top, sem contorno, ilhas de 1 a 3 hexágonos sobrepostos). Cada cluster tem um pill branco flutuante com sombra contendo um ícone de raio e uma faixa de multiplicador em bold: "1,2X–1,6X", "1,4X–1,8X", "1,7X–2,1X", "1,8X–2,2X", "2,2X–2,6X". Espalhe no máximo 3 marcadores circulares brancos de 44 px com anel amarelo e ícone de pedestre — poucos, esparsos, nunca aglomerados. Uma linha verde clara atravessa o mapa. Marcador do motorista: disco branco com anel azul e seta de navegação azul, sempre renderizado acima de qualquer linha. Header flutuante: botão circular branco de menu à esquerda e pill escuro central "R$ 0,00 ▾". À direita, coluna de dois FABs circulares (alerta triangular e ícone de camadas); à esquerda, um FAB azul com check. Banner amarelo "Ganhe R$500 indicando um motora pra 99!" com botão pill vermelho "Quero indicar" e X de fechar. Barra inferior branca: ícone de sliders com ponto vermelho, botão pill amarelo largo "Conectar", ícone de balão de conversa.

**Prompt 10 — Card de oferta v2** *(substitui o Prompt 5)*
> Sobre um mapa claro mostrando uma rota verde curvilínea entre um pin verde com seta para cima e um pin laranja com seta para baixo, com o marcador azul do motorista por cima da linha: um bottom sheet cinza-carvão (#26292E) com cantos superiores de 24 px ocupando 45% da altura. Dentro, alinhado à esquerda: uma linha de chips com "Pgto. no app" em cinza e "Prioritário" em verde-escuro com texto verde-claro, mais um disco cinza com o número "1" na direita. Abaixo, "R$ 19,92" em 44px bold branco e "R$ 1,76/km" em cinza. Depois uma barra de progresso verde de 5 px que sangra até as bordas, com um botão de cadeado na ponta direita. Em seguida, ícone de moeda âmbar + "R$ 2,02" bold + "Tarifa base dinâmica incl.", tudo em âmbar. Depois "★ 4,88 · 243 corridas · ☑ Perfil Essencial". Por fim dois blocos de endereço: disco verde com seta para cima + "7min (3,1km)" + "Avenida Paes de Barros, 1815, Mooca"; disco laranja com seta para baixo + "37min (11,3km)" + "Rua Augusta, 2205, Jardins". Fora do sheet, no topo direito, um pill escuro com X e o texto "Não afeta a TA". Nenhum outro elemento de UI sobre o mapa. A barra verde deve esvaziar linearmente e a rota deve se desenhar da origem ao destino em 700 ms ao abrir.

**Prompt 11 — Reconhecimento facial v2** *(substitui o Prompt 4)*
> Tela de fundo cinza-claro, header simples com seta de voltar à esquerda e título centralizado "Reconhecimento facial" em preto. No centro vertical, um círculo de 160 px com preview de câmera mascarado e um anel azul-royal cheio de 5 px ao redor. Abaixo, em duas linhas centralizadas, texto cinza-escuro de 15px: "Por favor, olhe diretamente para a câmera e posicione seu rosto dentro do círculo." Sem outros elementos. Gere as variantes: anel verde com check ao aprovar, anel vermelho com botão "Tentar novamente" ao falhar.

### 9.7 Checklist adicional (v2)

- [ ] Hexágonos são **vermelho-coral**, não amarelos, e formam ilhas irregulares
- [ ] Cada cluster tem **um** pill de faixa, no formato `1,4X–1,8X` (vírgula, travessão, X maiúsculo)
- [ ] Marcadores de passageiro: **no máximo 3** por viewport (R1)
- [ ] Ponteiro do motorista renderiza **acima** da polyline (R3) — verificar sobrepondo os dois de propósito
- [ ] O trajeto só aparece **depois** da facial / na oferta, nunca antes
- [ ] Durante a oferta o mapa fica limpo: sem header, banner, FABs, barra inferior nem hexágonos
- [ ] Barra de tempo da oferta v2 é **verde e full-bleed**, com cadeado na ponta
- [ ] "Não afeta a TA" é o único caminho de recusa, e fica fora do sheet
- [ ] Unidades escritas como `7min (3,1km)` — minúsculo, vírgula decimal, sem espaço antes de "min"
- [ ] O `demandaStore` guarda faixa (`min`/`max`), não multiplicador único

---

# 10. Revisão v3 — foto de perfil editável e facial oval

Três ajustes pedidos após a revisão da v2. **Substituem** o que está escrito na §4.5 (Perfil), na §3.8 (`MolduraFacial`) e na §9.3 (`MolduraFacial v2`). Onde houver conflito, **a §10 manda.**

| # | Mudança | Substitui |
|---|---|---|
| A1 | O avatar do Perfil vira **botão de alteração de foto**, com o padrão usual (badge de câmera + action sheet) | §4.5 |
| A2 | A moldura da verificação facial vira **oval**, não círculo | §3.8 e §9.3 |
| A3 | A foto do perfil aparece **de capa** na verificação facial, como referência de comparação | novo |

**Por que os três andam juntos:** eles fecham um ciclo que hoje está solto no protótipo. A foto que o motorista escolhe no Perfil passa a ser a mesma que o app mostra na hora de verificar quem ele é. Isso transforma a verificação facial de "tela decorativa" em "tela com propósito visível" — o usuário entende que está sendo comparado com algo, e sabe exatamente com o quê. É a mudança que mais aumenta a sensação de app real por linha de especificação escrita.

---

### 10.1 Tokens novos

| Token | Hex | Uso |
|---|---|---|
| `overlay/foto` | `rgba(0,0,0,.45)` | Véu sobre o avatar no estado `pressed` |
| `overlay/facial` | `rgba(18,20,24,.72)` | Máscara escura fora do recorte oval |
| `azul/oval` | `#2445A6` | Contorno do oval (mesmo `azul/facial` da v2) |
| `verde/oval` | `#24D279` | Contorno do oval aprovado |
| `erro/oval` | `#EB312B` | Contorno do oval reprovado |

Nenhuma cor nova de marca — tudo reaproveita a paleta existente.

---

### 10.2 `AvatarEditavel` (A1) — substitui o avatar estático da §4.5

Botão, não imagem. Tudo que segue é área tocável única.

**Anatomia**
- Foto circular de **96 px**, `object-fit: cover`, borda `neutro/0` de 3 px
- **Badge de câmera:** disco de 32 px ancorado no canto inferior direito (offset −2, −2), fundo `amarelo/500`, ícone de câmera `neutro/900` de 16 px, borda branca de 2 px separando do avatar
- Alvo de toque mínimo: 96 × 96 (o badge não é um segundo alvo — o botão inteiro abre o mesmo fluxo)

**Estados**

| Estado | Aparência |
|---|---|
| `default` | foto + badge amarelo |
| `pressed` | `overlay/foto` sobre a foto, scale 0.97, badge mantém a cor |
| `vazio` | fundo `roxo/900`, iniciais do motorista em `título/lg` branco, badge presente |
| `enviando` | foto a 50% de opacidade + anel de progresso indeterminado `info/500` de 3 px em volta |
| `erro` | badge vira `erro/500` com ícone de exclamação; toast "Não foi possível enviar a foto. Tentar novamente." |

**Fluxo ao tocar** — action sheet padrão iOS subindo de baixo, fundo `neutro/0`, raio 16, itens de 56 px:

```
┌─────────────────────────────┐
│  Foto de perfil             │  título · corpo/sm · neutro/600
├─────────────────────────────┤
│  📷  Tirar foto             │  corpo/lg · neutro/900
│  🖼️  Escolher da galeria    │
│  🗑️  Remover foto atual     │  erro/500 — só aparece se houver foto
└─────────────────────────────┘
┌─────────────────────────────┐
│         Cancelar            │  card separado, corpo/lg bold
└─────────────────────────────┘
```

**Tela de recorte** (após escolher a origem): imagem em tela cheia sobre fundo `neutro/900`, máscara circular com o resto escurecido, gestos de pinça e arraste, régua de zoom opcional. Header transparente com **Cancelar** à esquerda e **Concluir** em `amarelo/500` à direita.

**Regra de produto:** a foto escolhida aqui é a **única** fonte de verdade do avatar. Ela alimenta, na mesma hora e sem passo extra: o Perfil, o cabeçalho do menu lateral (§4.3) e a **capa da verificação facial** (§10.4). No `motoristaStore`, um campo só — `fotoPerfilUri` — lido pelos três lugares. Se algum deles precisar de uma segunda cópia da foto, o estado está errado.

---

### 10.3 `MolduraFacialOval` (A2) — substitui a §3.8 e a §9.3

**Geometria**
- Oval de **240 × 320** (proporção 3:4 — é o formato de um rosto humano, por isso a mudança faz o enquadramento parecer natural em vez de forçado)
- Raio: elipse pura, não retângulo arredondado. Em SVG: `<ellipse rx="120" ry="160">`
- Preview da câmera frontal em `cover`, mascarado pelo oval
- **Contorno:** 5 px `azul/oval`, seguindo a curva da elipse
- **Fora do oval:** `overlay/facial` cobrindo a tela inteira, criando o recorte. Isso é o que dá o ar de "documento oficial" — o resto da tela some e sobra o rosto

**Arco de progresso:** percorre o **perímetro da elipse**, não de um círculo. Comece em 12 h, sentido horário, 6 s, `linear`, com ponto de 6 px na cabeça. Em SVG use `stroke-dasharray` sobre o mesmo `<ellipse>` do contorno — não tente aproximar com um círculo, a diferença é visível.

**Estados**

| Estado | Contorno | Texto |
|---|---|---|
| `posicionando` | `azul/oval`, arco em 0 | "Por favor, olhe diretamente para a câmera e posicione seu rosto dentro do oval." |
| `verificando` | `azul/oval`, arco preenchendo | "Não se mexa. Estamos verificando…" |
| `sucesso` | `verde/oval` + check branco de 40 px no centro, 600 ms | "Tudo certo!" |
| `falha` | `erro/oval` | "Não conseguimos verificar. Tentar novamente." + botão `amarelo/500` |

Note que a palavra muda: **"dentro do oval"**, não "dentro do círculo". Se o texto continuar dizendo círculo com um oval na tela, o protótipo entrega a costura.

---

### 10.4 `CapaReferencia` (A3) — a foto de perfil na verificação facial

Este é o componente novo. Ele responde, na tela, à pergunta que o motorista faz sem perceber: *"comparado com o quê?"*

**Layout da tela de verificação facial v3**, de cima para baixo:

1. **Header** — voltar + "Reconhecimento facial" centralizado
2. **Capa de referência** — miniatura **circular de 64 px** da `fotoPerfilUri`, centralizada, com anel `neutro/200` de 2 px. Abaixo, em `corpo/sm` `neutro/600`: **"Foto do seu cadastro"**
3. **Conector** — linha vertical tracejada `neutro/200` de 24 px ligando a capa ao oval, com um ícone de comparação (↔ ou dois pontos) no meio. É o elemento que faz o olho entender que as duas imagens são a mesma pessoa sendo confrontada
4. **Oval** — `MolduraFacialOval` (§10.3), centralizado
5. **Instrução** — duas linhas centralizadas, `corpo/md` `neutro/600`
6. **Rodapé** — spinner `info/500` durante `verificando`

**Variante alternativa (escolha uma e mantenha):** a capa como **thumbnail flutuante** de 72 px no canto superior esquerdo, sobre o `overlay/facial`, com borda branca de 2 px e o rótulo por baixo. Ocupa menos altura e parece mais com um app de verificação de documento. Use esta se o oval de 320 px de altura deixar a tela apertada.

**Comportamento**
- Se `fotoPerfilUri` estiver vazia, a capa **não aparece** — e a tela mostra, antes do oval, um aviso `amarelo/100` com texto `neutro/900`: "Adicione uma foto de perfil para agilizar a verificação." com link "Adicionar agora" que leva ao §10.2. Nunca mostre um placeholder cinza no lugar da capa: capa vazia comunica "não temos com o que comparar", que é exatamente o oposto da mensagem
- No estado `sucesso`, a capa e o oval fazem um pulse simultâneo de 1.0 → 1.06 → 1.0 em 400 ms. Os dois juntos, não em sequência — é o que lê como "bateu"
- No estado `falha`, só o oval treme (shake horizontal de 6 px, 300 ms). A capa fica parada: ela não é o que falhou

---

### 10.5 Impacto no `ARQUITETURA.md`

| Arquivo | O que muda |
|---|---|
| `state/motoristaStore.ts` | novo campo `fotoPerfilUri: string \| null` + ação `definirFotoPerfil(uri)` |
| `servicos/armazenamento.ts` | persistir a foto — copie o arquivo para `FileSystem.documentDirectory` e guarde o caminho no AsyncStorage; **nunca** salve base64 no AsyncStorage, ele estoura |
| `components/ui/` | novo `AvatarEditavel.tsx` |
| `components/facial/` | pasta nova: `MolduraFacialOval.tsx`, `CapaReferencia.tsx` |
| Módulo 6 do roadmap | passa a incluir o seletor de foto (`expo-image-picker`) e o recorte — é o lugar natural, já é o módulo de câmera e permissões |
| Bibliotecas | acrescentar **`expo-image-picker`** (galeria + câmera, permissões prontas) e **`expo-file-system`**. Instale com `npx expo install`, como manda a §7 |

> A máscara oval em React Native: o caminho mais limpo é `react-native-svg` com um `<Mask>` contendo `<Rect fill="white">` e `<Ellipse fill="black">` sobre o overlay, e um `<Ellipse>` separado para o contorno e o arco. Tentar fazer com `borderRadius` em `View` não gera uma elipse verdadeira — gera um retângulo de cantos redondos, e a diferença aparece.

---

### 10.6 Prompts para o Claude Design

**Prompt 12 — Perfil com avatar editável** *(substitui a metade "Perfil" do Prompt 6)*
> Tela de perfil com fundo cinza-claro, header com seta de voltar e engrenagem. No centro, um **botão de avatar**: foto circular de 96 px com borda branca de 3 px e um badge circular amarelo de 32 px no canto inferior direito contendo um ícone de câmera preto, com borda branca de 2 px. O conjunto inteiro é um único botão. Abaixo, nome em caixa alta 22px bold, botão outline pill "Ver perfil público", os números "0 Corridas" e "1 Dia" lado a lado, e o bloco de avaliação com distribuição de 5 a 1 estrela em barras amarelas finas. Gere também: (a) o estado pressionado, com véu escuro sobre a foto e scale 0.97; (b) o estado vazio, com fundo roxo-escuro e iniciais brancas no lugar da foto; (c) o estado enviando, com a foto a 50% e um anel de progresso azul em volta; (d) um action sheet iOS subindo de baixo com o título "Foto de perfil" e as opções "Tirar foto", "Escolher da galeria" e "Remover foto atual" em vermelho, mais um card separado de "Cancelar".

**Prompt 13 — Verificação facial oval com foto de referência** *(substitui os Prompts 4 e 11)*
> Tela de verificação facial com fundo cinza-claro e header simples "Reconhecimento facial". Empilhados verticalmente e centralizados: primeiro, uma miniatura circular de 64 px com a foto de perfil do usuário e anel cinza de 2 px, com a legenda "Foto do seu cadastro" em 13px cinza; depois, uma linha vertical tracejada curta com um ícone de comparação no meio; depois, uma **moldura oval de 240×320** (elipse verdadeira, proporção 3:4) com preview de câmera frontal recortado por ela, contorno azul-royal de 5 px e todo o resto da tela coberto por um véu escuro que cria o recorte. Um arco de progresso azul percorre o perímetro da elipse, não de um círculo, com um ponto na ponta. Abaixo, em duas linhas centralizadas, 15px cinza: "Por favor, olhe diretamente para a câmera e posicione seu rosto dentro do oval." Spinner azul no rodapé. Gere as variantes: **sucesso** (contorno verde, check branco no centro do oval, foto de referência e oval pulsando juntos), **falha** (contorno vermelho, oval tremendo na horizontal, texto "Não conseguimos verificar." e botão amarelo "Tentar novamente") e **sem foto cadastrada** (sem a miniatura, com um aviso amarelo-claro acima do oval dizendo "Adicione uma foto de perfil para agilizar a verificação." e o link "Adicionar agora").

---

### 10.7 Checklist adicional (v3)

- [ ] O avatar do Perfil é **botão**, com badge de câmera amarelo — não imagem estática
- [ ] Os cinco estados do `AvatarEditavel` existem (default, pressed, vazio, enviando, erro)
- [ ] O action sheet tem "Remover foto atual" em vermelho, e ele **some** quando não há foto
- [ ] A moldura facial é **elipse verdadeira** de 240×320, não círculo nem retângulo arredondado
- [ ] O arco de progresso segue o **perímetro da elipse**
- [ ] O texto diz "dentro do **oval**", não "dentro do círculo"
- [ ] A foto de perfil aparece como capa de referência na verificação facial, com a legenda "Foto do seu cadastro"
- [ ] Trocar a foto no Perfil muda a capa da facial e o avatar do menu lateral — **um único `fotoPerfilUri` alimenta os três**
- [ ] Sem foto cadastrada: a capa não aparece e surge o aviso com "Adicionar agora" — nunca um placeholder cinza
- [ ] No sucesso, capa e oval pulsam **juntos**; na falha, só o oval treme

---

# 11. Expansão v4 — walkthrough completo do app

**Fonte:** `WhatsApp Video 2026-08-19 at 19.00.13.mp4` — **3 min 05 s**, 384×848, app **v7.10.26**, conta de Recife-PE, mapa de São Paulo. 62 frames + narração contínua, transcrita com o mesmo Whisper local.

Este é o vídeo de referência definitivo: percorre o app inteiro, tela por tela, com o usuário narrando o que cada uma faz e o que ele quer no protótipo. **Tudo aqui é aditivo** — nenhum token, fonte, animação ou tela das §1–§10 muda. A v4 acrescenta as telas que faltavam e fixa dois comportamentos de interação.

**Precedência atualizada:** v4 (§11) > v3 (§10) > v2 (§9) > v1 (§1–§8).

---

### 11.1 Requisitos falados

Transcrição integral em 8 blocos de 25 s. Os requisitos abaixo saem literalmente da fala e são **obrigatórios**.

| # | Fala | Requisito |
|---|---|---|
| **R4** | *"tu podia fazer nessa engrenazinha aqui em cima da direita — aí foto de perfil, número de telefone, central do condutor, a cidade"* | A engrenagem do Perfil abre uma tela de **Configurações de perfil** com lista de campos. §11.4 |
| **R5** | *"horas dirigidas é o que a gente usa pra botar foto, nome, o e-mail e o número de telefone… é o que a gente usa pra editar a conta"* | O item **"Horas Dirigidas"** do menu abre o **editor de conta** (rótulo estranho, mas é assim no app — preserve). §11.5 |
| **R6** | *"veículos… deixar desse mesmo jeito, igualzinho. Aí clica em adicionar, aí mostra tudo — a placa, o modelo. Carro também… e vou adicionar uma bike"* | Lista de veículos + modal **Adicionar veículo** com abas Moto/Carro/Bike. §11.6 |
| **R7** | *"em ganhos… só dá pra clicar nesse ponto 99, que aí vem pra cá, e só dá pra clicar aqui também: transferir com Pix, que é a hora do saque"* | Na Central de ganhos, **apenas dois caminhos são interativos** no protótipo: `Conta99` e `Transferir com Pix`. O resto é visual. §11.7 |
| **R8** | *"esses três risquinhos aqui embaixo… definir meu destino… preferências de serviços: como tá bike vai aparecer assim, aí em carro vai aparecer assim, e moto vai aparecer assim"* | **Preferências de serviços muda a lista conforme o veículo ativo.** É a interação mais sofisticada do app. §11.9 |
| **R9** | *"tira essa de ativar mais categorias, pode deixar tudo… e ao invés de colocar 'Bom', botar 'Ótimo'"* | No Teste de status: **remova o card "Ativar mais categorias"**, deixe todas as categorias ligadas e o resultado é **"Ótimo"**, não "Bom". §11.10 |
| **R10** | *"aí conectar, fazer a leitura da biometria facial e chamar a corrida — mas aí tu bota o risco por cima de onde vai passar"* | Reforça a **R3**: a linha do trajeto por cima. Confirmado em dois vídeos — é o ponto que mais incomoda. |
| **R11** | *(pedido por escrito)* | O **mapa precisa ser arrastável** na apresentação. §11.3 |
| **R12** | *(pedido por escrito)* | A foto do perfil precisa ser editável — já coberto pela §10.2, e o vídeo **confirma** que o app real faz isso: a tela de edição diz literalmente *"Toque no ícone para mudar a foto"*. |

> **Observação sobre a R12:** a §10 foi escrita como proposta. Este vídeo mostra que o app real **já tem** exatamente isso — avatar com badge de câmera e a legenda "Toque no ícone para mudar a foto". A §10 deixa de ser sugestão e vira reprodução fiel. Só ajuste a legenda para o texto literal do app.

---

### 11.2 Tokens novos

| Token | Hex | Uso |
|---|---|---|
| `amarelo/splash` | `#F4AD09` | Base do gradiente do splash (âmbar, mais quente que o `amarelo/500`) |
| `amarelo/splash-topo` | `#F4BA10` | Topo do gradiente |
| `amarelo/carteira` | `#F5DA0A` | Fundo do bloco superior da Conta99 |
| `azul/carteira` | `#1E202F` | Faixa escura "Adicionar cartão / Desconto" |
| `verde/anel` | `#1EC376` | Anel de resultado do Teste de status |
| `verde/badge` | `#51CD95` | Badge "Até 12X" |
| `laranja/alerta` | `#E55F1F` | Ícone de atenção do card "Ativar mais categorias" |
| `amarelo/aviso` | `#F6EF9E` | Fundo do aviso regulatório do Banco Central |
| `neutro/secao` | `#EFEFF1` | Faixa de cabeçalho de seção ("INFORMAÇÕES PESSOAIS") |
| `neutro/campo` | `#F5F5F7` | Fundo de input e de aba inativa |

Tipografia, espaçamento, raios e curvas de animação: **sem mudança**. Continue usando as §2.5 a §2.7.

---

### 11.3 Mapa arrastável (R11)

O mapa deixa de ser imagem e vira superfície manipulável. É a mudança que mais melhora a apresentação para o grupo de pesquisa, porque permite demonstrar a camada de demanda em vez de só mostrá-la.

**Gestos**
| Gesto | Efeito |
|---|---|
| Arrastar (1 dedo) | Pan livre |
| Pinça (2 dedos) | Zoom, 12 a 18 níveis |
| Toque duplo | Zoom +1 com animação de 250 ms |
| Rotação (2 dedos) | **Desabilitada** — o mapa fica sempre com o norte para cima |

**Comportamento ao arrastar**
- Os hexágonos e as pills de multiplicador **acompanham o mapa** — são geográficos, não de tela. As pills mantêm o tamanho constante em pixels (não escalam com o zoom); só a posição muda
- Os elementos de UI flutuante (header, FABs, banner, barra inferior) **não se movem**
- Assim que o mapa sai do centro, aparece o **`FabRecentrar`** (§3.11) com fade de 200 ms; some ao voltar ao centro
- Momentum: desaceleração inercial de ~600 ms após soltar

**No protótipo do Claude Design:** se o alvo for HTML, use uma imagem de mapa maior que a viewport com `transform: translate()` controlado por drag, e posicione os hexágonos em coordenadas do mesmo sistema — assim eles arrastam junto de graça. Limite o pan às bordas da imagem.

---

### 11.4 `ConfiguracoesPerfil` (R4) — a engrenagem

Abre em tela cheia com header **voltar · "Perfil" · ✕**. Fundo `neutro/50`.

**Seção `INFORMAÇÕES PESSOAIS`** — cabeçalho em `label/chip` maiúsculo `neutro/400` sobre faixa `neutro/secao`, altura 36. Linhas em card branco, altura 64, chevron `neutro/400` à direita:

| Ícone | Rótulo | Valor secundário |
|---|---|---|
| *(miniatura da foto, 32 px)* | Foto de perfil | — |
| telefone | Número de telefone | `+55 81 99381‑6502` |
| envelope | E‑mail | `centralcondutor01@gmail.com` |
| pino | Cidade | `Recife` |
| cadeado | Senha | — |

**Seção `GERENCIAMENTO DE PERFIL`**

| Ícone | Rótulo |
|---|---|
| pasta | Documentos pendentes |
| celular | Gestão de dispositivo |

O rótulo fica em `corpo/lg` `neutro/900` e o valor abaixo em `corpo/sm` `neutro/600`. **"Foto de perfil"** leva ao fluxo da §10.2.

---

### 11.5 `EditarConta` (R5) — o item "Horas Dirigidas"

Header voltar + **"Horas Dirigidas"**. Fundo `neutro/50`.

1. **Card do avatar** — card branco, `raio/card`, padding 24. Centralizado: avatar de 88 px com anel `amarelo/500` de 3 px e **badge de câmera** de 30 px (disco `neutro/900`, ícone branco) no canto inferior direito. Abaixo, em `corpo/md` `neutro/600`: **"Toque no ícone para mudar a foto"**
2. **Card de campos** — três inputs empilhados, cada um com label em `corpo/sm` bold `neutro/900` acima e caixa de 52 px, fundo `neutro/0`, borda `neutro/200`, `raio/card`:
   - `Nome do Perfil` → `Jonatha`
   - `E-mail` → `centralcondutor01@gmail.com`
   - `Número de Telefone` → `+55 81 993816502`
3. **`Salvar Alterações`** — botão `amarelo/500` full-width menos 16 px, altura 56, `label/btn`

> Diferença importante em relação à §10.2: aqui o badge de câmera é **escuro** (`neutro/900`), não amarelo, e o avatar tem anel amarelo. Use este visual — é o do app real. O badge amarelo da §10.2 vale para o avatar do Perfil (§4.5), onde não há anel.

---

### 11.6 `Veiculos` e `AdicionarVeiculo` (R6)

**Lista** — header voltar + "Veículo". Um `CardVeiculo` por veículo cadastrado, empilhados com gap 12. Estrutura do card (revisa a §3.9):

- Linha de chips: tipo (`MOTO` / `CARRO` / `BIKE`, outline `neutro/400`) + status (`Aprovado`, fundo `sucesso/100`, texto `sucesso/500`, pill)
- **Modelo** em `título/lg` `neutro/900`, até duas linhas — `YAMAHA XTZ 250 LANDER`
- **Placa e cor** em `corpo/sm` `neutro/600` — `SRE5J51 (BEGE)`. Quando não há modelo: título vira `Sem modelo` e a linha mostra só a placa
- **Ilustração** do veículo à direita, 64 px — moto, carro ou bicicleta conforme o tipo
- Rodapé: ✓ `sucesso/500` + `Veículo ativo`

Botão **`Adicionar`** `amarelo/500` fixo no rodapé.

**Modal `Adicionar veículo`** — bottom sheet branco, raio superior 20, fundo escurecido atrás:

1. Título `Adicionar veículo` em `título/md`, centralizado
2. **Segmented control** de 3 abas — trilho `neutro/campo`, `raio/pill`, altura 48. Aba ativa: fundo `neutro/0`, texto `neutro/900` bold, sombra sutil. Inativas: texto `neutro/400`. Opções: **Moto · Carro · Bike**
3. Três inputs de 56 px, fundo `neutro/campo`, sem borda, `raio/card`, placeholders: `Placa` · `Modelo (ex: YAMAHA XTZ)` · `Cor`
4. Rodapé com dois botões lado a lado: **Cancelar** (fundo `neutro/campo`, texto `neutro/900`) e **Salvar** (`amarelo/500`), ambos `raio/pill`, altura 52, largura igual

Ao salvar, o novo veículo entra na lista com o chip do tipo escolhido. **O tipo do veículo ativo governa a §11.9** — é aqui que a cadeia começa.

---

### 11.7 `CentralGanhos` (R7)

Header voltar + **"Central de ganhos"** + link **"Histórico"** à direita em `corpo/md`.

1. **Faixa 99** *(no app real: "Rota99" — ver §14)* — card branco, ícone de losango preto, `Disponível na sua fase` + à direita `3 Vantagens ›` com o número em bold. Acima dela, quando há dados: card `amarelo/500` com `Ganhos do dia (ago.19)` em `corpo/sm`, valor em `display/lg`, e duas colunas `Corridas R$ 0,00` / `Entregas R$ 0,00`
2. **`Meus recursos`** — título de seção `título/lg`. Card branco com três linhas de 68 px, ícone circular de 32 px à esquerda:
   - 💲 azul — **Saldo** · `R$ 0,00` ›
   - 💲 vermelho — **Método de resgate** / `Chave Pix` ›
   - 👛 laranja — **Conta99** / `Saque quando quiser; aceita boleto` · `R$ 0,00` ›
3. **`Melhore seus ganhos`** — Recompensa por indicação (*Convide novos motoristas e aumente seus ganhos*) · Recompensas (*Confira suas recompensas mais recentes*)
4. **`Eventos futuros`** — Planeje corridas (*Veja os horários de pico e os horários recomendados para correr*) · Defina objetivos (*Defina objetivos semanais para ajudar a acompanhar seu progresso*)
5. **`Outros serviços`** — Loja 99, etc.

**R7 — interatividade:** no protótipo, só **Conta99** navega (para a §11.8). As demais linhas ficam visíveis e com feedback de toque, mas não levam a lugar nenhum. Documente isso na apresentação em vez de esconder: escopo declarado é melhor que link morto.

---

### 11.8 `Conta99` — a carteira

Tela dividida em duas metades visuais.

**Bloco superior, fundo `amarelo/carteira`:**
- **Aviso regulatório** — card `amarelo/aviso`, `raio/card`, texto `corpo/sm` `neutro/900` e ✕ à direita: *"De acordo com as exigências regulatórias do Banco Central do Brasil, você precisa adicionar seu endereço completo. Toque para começar."*
- **Card do saldo** — branco, `raio/card`. `Minha Carteira(R$)` em `corpo/md` com ícone de olho (mostrar/ocultar), valor **`0,00`** em `display/xl` + chevron
- **Faixa escura** colada embaixo do card, fundo `azul/carteira`, `raio/card` inferior: `✨ Adicionar cartão` à esquerda e `Desconto 0 ›` à direita, texto branco
- **Três ações** em linha, ícone 28 px + rótulo `corpo/sm` centralizado: **Transferir com Pix** · **Escanear boleto** · **Receber Pix**

**Bloco inferior, fundo `neutro/0`, `raio/sheet` no topo:**
- **`Serviços gerais`** — grade de 3 colunas com tiles de 100 px, fundo `neutro/campo`, `raio/card`, ícone ilustrado 36 px + rótulo `corpo/sm`: **Pagar boleto** (com badge `verde/badge` "Até 12X" no canto superior direito) · **Transferências** · **Recarregar celular** · **Gift Card**
- **Histórico de transações** — linha de card com ícone de recibo, título `corpo/lg` e subtítulo *"Verifique todos as transações e recibos"*, chevron
- **`Destaques`** — carrossel horizontal, primeiro card "99Pay Informe"

**R7:** daqui, só **Transferir com Pix** navega.

---

### 11.9 `TransferenciaPix` e `PreferenciasServicos` (R8)

**`Transferência Pix`** — header voltar + título centralizado. Formulário em campos de linha (label flutuante, sublinhado `neutro/200`, sem caixa):
`Nome completo` · `CPF/CNPJ` · `Número da conta` + `Dígito` (mesma linha, 70/30) · `Número da agência` · `Instituição ›` (abre seletor).
**`Tipo de conta`** — quatro radios verticais: `Conta corrente` · `Conta-poupança` · `Conta de ganhos` · `Instituição de pagamento`.
Botão **`Continuar`** ancorado no rodapé, **desabilitado por padrão** (`neutro/200`, texto `neutro/400`) — habilita em `amarelo/500` quando os campos obrigatórios estão preenchidos. O estado desabilitado é o que aparece no vídeo; mostre os dois.

**`Preferências de solicitações`** — header **escuro** (`neutro/900`, texto branco), diferente do resto do app. Duas seções em cards brancos:
- `Ferramentas de aceitação`: **Definir meu destino** (ícone de alvo) · **Preferências de serviços** (ícone de engrenagem)
- `Status da solicitação`: **Teste de status** (ícone de refresh) · **Eventos futuros** (ícone de gráfico)

**`Preferências de serviços`** ⭐ **(R8 — a interação mais importante da v4)**
Header claro, subtítulo em faixa `neutro/secao`: `PREFERÊNCIAS DE SOLICITAÇÕES` + *"Selecione quais tipos de solicitação você quer receber"*.
Lista de linhas de 62 px com rótulo `corpo/lg` à esquerda e `Toggle` (§3.15) à direita. **A lista é gerada pelo tipo do veículo ativo:**

| Veículo ativo | Categorias exibidas |
|---|---|
| **Moto** | 99Moto · 99Entrega Moto · 99Moto Promocional · 99Entrega Moto Empresas · 99Food |
| **Carro** | Pop · Entrega Carro · Negocia · Pop Expresso |
| **Bike** | 99Bike · 99Entrega Bike |

Trocar o veículo ativo em §11.6 **re-renderiza esta tela inteira**. No protótipo, exponha as três variantes e ligue-as ao seletor de veículo — é isso que o usuário está pedindo quando diz *"como tá bike vai aparecer assim, aí em carro vai aparecer assim"*. Ele quer ver a cadeia funcionando, não três telas soltas.

Note que a pill do menu lateral também segue o veículo ativo: **`Moto • Fase 1`** / **`Carro • Fase 1`** / **`Bike • Fase 1`**.

---

### 11.10 `TesteStatus` v4 (R9) — resultado graduado

Substitui o final da §4.7. O anel deixa de ser um contador `n/6` no fim e vira um **medidor de qualidade em semicírculo**.

**Durante o teste:** anel completo de 130 px com `2/6`, `5/6`… e a lista de 6 itens abaixo, cada um com check `sucesso/500` conforme aprova (a mecânica da §3.7 continua válida). Header ganha o botão **`⟳ Tentar novamente`** à direita, pill outline.

**No resultado:** o anel vira **semicírculo** (arco de 180°, stroke 14, cantos arredondados, trilho `neutro/100`, preenchimento `verde/anel`), com a palavra do resultado em `título/lg` bold no centro e a contagem de pendências em `corpo/sm` `neutro/600` abaixo.

| Resultado | Arco | Texto de apoio |
|---|---|---|
| **Ótimo** | 100% | *"Tudo certo"* — **é este que o protótipo deve mostrar (R9)** |
| Bom | ~75% | *"1 item(ns) otimizável(is)"* |
| Regular | ~45% | *"3 item(ns) otimizável(is)"* |

**R9 — o que remover:** o card **"Ativar mais categorias"** (com o ícone `laranja/alerta` e o botão "Ativar") **não aparece** no protótipo. Todas as categorias ficam ligadas, o resultado é **Ótimo** e o card some. Especifiquei o card acima só para você saber o que está sendo deliberadamente omitido — se algum dia quiser demonstrar o estado degradado, ele está documentado.

**O que permanece:** o card **"Como receber chamadas mais rápido?"**, com ícone de raio em disco `amarelo/100`, título **"Vá até uma área de alta demanda"** e o texto *"Vá para área de alta demanda no Mapa de Chamadas e receba corridas mais rápido"* com chevron. Este card é bom: conecta a tela de status de volta ao mapa de demanda.

---

### 11.11 `Splash` v4 (revisa a §4.1)

Fundo em **gradiente vertical** de `amarelo/splash-topo` (topo) para `amarelo/splash` (base), com o padrão de hexágonos em sobreposição sutil. Centralizado: disco branco de 96 px com o wordmark **99** em `amarelo/splash`, e abaixo **"99 Motorista"** em `título/md` branco. No rodapé, versão em `corpo/sm` branco a 70%: **`V7.10.26`**.

Duração 1,2 s, depois fade de 800 ms para o mapa.

---

### 11.12 Fluxo completo v4

```
Splash (1,2 s)
   ▼
Mapa [OFFLINE] ◄──── arrastável, hexágonos acompanham (R11)
   │
   ├─ ☰ Menu ─┬─ Ganhos ──► Central de ganhos ──► Conta99 ──► Transferência Pix
   │          │                                      (R7: só estes dois clicam)
   │          ├─ Veículos ──► Lista ──► [+ Adicionar] ──► modal Moto|Carro|Bike
   │          │                              └─► define o veículo ativo ──┐
   │          ├─ Horas Dirigidas ──► Editar conta (foto, nome, e-mail, tel) │ R5
   │          └─ (demais itens: visuais)                                    │
   │                                                                       │
   ├─ ⚙ (no Perfil) ──► Configurações de perfil ──► Foto de perfil ──► §10.2│ R4
   │                                                                       │
   ├─ ⚙ sliders ──► Preferências de solicitações                           │
   │                   ├─ Definir meu destino                              │
   │                   ├─ Preferências de serviços ◄─────────────────────┘ R8
   │                   ├─ Teste de status ──► resultado "Ótimo"              R9
   │                   └─ Eventos futuros
   │
   └─ Conectar ──► Facial oval (§10.3) ──► Mapa [BUSCANDO] ──► Oferta
                                                (trajeto por cima — R3/R10)
```

---

### 11.13 Prompts para o Claude Design

**Prompt 14 — Splash v4** *(substitui a §4.1)*
> Tela de abertura com fundo em gradiente vertical de âmbar (#F4BA10 no topo para #F4AD09 na base), com um padrão sutil de hexágonos em sobreposição. Centralizado verticalmente: um disco branco de 96 px com o número "99" em âmbar bold, e abaixo o texto "99 Motorista" em 18px branco semibold. No rodapé, "V7.10.26" em 13px branco a 70% de opacidade.

**Prompt 15 — Mapa arrastável** *(estende o Prompt 9)*
> Pegue o mapa do Prompt 9 e torne-o manipulável: arrastar com um dedo faz pan, pinça faz zoom entre 12 e 18 níveis, toque duplo aplica zoom +1 em 250 ms, rotação desabilitada. Os hexágonos vermelhos e as pills de multiplicador arrastam junto com o mapa, mas as pills mantêm tamanho constante em pixels e não escalam com o zoom. Header, FABs, banner e barra inferior permanecem fixos na tela. Quando o mapa sai do centro, um FAB de recentrar aparece com fade de 200 ms e some ao voltar. Adicione desaceleração inercial de 600 ms ao soltar o arraste.

**Prompt 16 — Configurações de perfil e editor de conta**
> Duas telas com fundo cinza-claro. **(a) Configurações de perfil:** header com voltar à esquerda, "Perfil" centralizado e X à direita. Faixa cinza de seção com "INFORMAÇÕES PESSOAIS" em maiúsculas 12px cinza. Card branco com cinco linhas de 64 px, cada uma com ícone à esquerda, rótulo em 17px e chevron à direita: "Foto de perfil" (com miniatura circular de 32 px no lugar do ícone), "Número de telefone" com "+55 81 99381-6502" abaixo, "E-mail" com "centralcondutor01@gmail.com", "Cidade" com "Recife", e "Senha". Segunda faixa "GERENCIAMENTO DE PERFIL" com "Documentos pendentes" e "Gestão de dispositivo". **(b) Editor de conta:** header "Horas Dirigidas". Card branco com avatar centralizado de 88 px com anel amarelo de 3 px e um badge circular escuro de 30 px com ícone de câmera no canto inferior direito, e abaixo a legenda "Toque no ícone para mudar a foto" em 15px cinza. Segundo card com três campos rotulados — "Nome do Perfil" (Jonatha), "E-mail" (centralcondutor01@gmail.com) e "Número de Telefone" (+55 81 993816502) — cada um com label bold acima e caixa branca de 52 px com borda cinza. No rodapé, botão amarelo full-width "Salvar Alterações".

**Prompt 17 — Veículos e adicionar veículo**
> **(a) Lista:** header com voltar e "Veículo". Cards brancos empilhados, cada um com uma linha de chips no topo (tipo em outline cinza — MOTO, CARRO ou BIKE — e "Aprovado" em pill verde-claro com texto verde), o modelo em 22px bold em até duas linhas, a placa e a cor em 13px cinza, uma ilustração do veículo de 64 px à direita, e no rodapé um check verde com "Veículo ativo". Gere três cards: "YAMAHA XTZ 250 LANDER / SRE5J51 (BEGE)" com ilustração de moto; "Sem modelo / GFRH" com carro; "Sem modelo / TGDY" com bicicleta. Botão amarelo "Adicionar" fixo no rodapé. **(b) Modal:** bottom sheet branco com cantos superiores de 20 px sobre o fundo escurecido, título centralizado "Adicionar veículo", um segmented control de três abas em trilho cinza arredondado — Moto, Carro, Bike — com a aba ativa em branco com sombra e texto preto bold. Abaixo, três inputs cinza-claro sem borda com os placeholders "Placa", "Modelo (ex: YAMAHA XTZ)" e "Cor". No rodapé, dois botões de largura igual: "Cancelar" em cinza-claro e "Salvar" em amarelo.

**Prompt 18 — Central de ganhos e carteira Conta99**
> **(a) Central de ganhos:** header com voltar, "Central de ganhos" e o link "Histórico" à direita. Card amarelo com "Ganhos do dia (ago.19)" em 13px, "R$0,00" em 34px bold, e duas colunas "Corridas R$0,00" e "Entregas R$0,00". Card branco "99 (Veja mais)" com "Disponível na sua fase" e "3 Vantagens ›". Seção "Meus recursos" em card branco com três linhas de 68 px, cada uma com ícone circular colorido de 32 px: cifrão azul "Saldo — R$0,00", cifrão vermelho "Método de resgate / Chave Pix", carteira laranja "Conta99 / Saque quando quiser; aceita boleto — R$0,00". Seções "Melhore seus ganhos" (Recompensa por indicação, Recompensas) e "Eventos futuros" (Planeje corridas, Defina objetivos), cada item com ícone de linha, título e subtítulo cinza. **(b) Conta99:** metade superior com fundo amarelo, contendo um aviso em amarelo-claro com o texto do Banco Central e um X, um card branco com "Minha Carteira(R$)" e ícone de olho, o valor "0,00" em 44px bold com chevron, e colada embaixo uma faixa azul-escura com "Adicionar cartão" e "Desconto 0 ›" em branco. Abaixo, três ações em linha com ícone e rótulo: "Transferir com Pix", "Escanear boleto", "Receber Pix". Metade inferior em card branco com cantos superiores arredondados: título "Serviços gerais" e uma grade de 3 colunas com tiles cinza-claro de 100 px — "Pagar boleto" com badge verde "Até 12X", "Transferências", "Recarregar celular", "Gift Card". Depois, a linha "Histórico de transações / Verifique todos as transações e recibos" e a seção "Destaques" com um carrossel.

**Prompt 19 — Transferência Pix**
> Header com voltar e "Transferência Pix" centralizado. Formulário com campos de linha sublinhada (sem caixa), label flutuante cinza: "Nome completo", "CPF/CNPJ", "Número da conta" e "Dígito" lado a lado em 70/30, "Número da agência", e "Instituição" com chevron. Abaixo, o grupo "Tipo de conta" com quatro opções de rádio empilhadas: "Conta corrente", "Conta-poupança", "Conta de ganhos", "Instituição de pagamento". No rodapé, um botão full-width "Continuar" no estado desabilitado (cinza-claro com texto cinza). Gere também o estado habilitado em amarelo.

**Prompt 20 — Preferências de serviços com três variantes**
> **(a)** Tela "Preferências de solicitações" com header escuro de fundo preto e texto branco. Dois cards brancos: "Ferramentas de aceitação" com as linhas "Definir meu destino" (ícone de alvo) e "Preferências de serviços" (ícone de engrenagem); e "Status da solicitação" com "Teste de status" (ícone de refresh) e "Eventos futuros" (ícone de gráfico), todas com chevron. **(b)** Tela "Preferências de serviços" com header claro, faixa cinza de seção com "PREFERÊNCIAS DE SOLICITAÇÕES" e o texto "Selecione quais tipos de solicitação você quer receber". Abaixo, uma lista de linhas de 62 px com rótulo em 17px à esquerda e um toggle preto à direita. Gere **três variantes desta tela**, que devem alternar conforme o tipo de veículo ativo: **Moto** → 99Moto, 99Entrega Moto, 99Moto Promocional, 99Entrega Moto Empresas, 99Food; **Carro** → Pop, Entrega Carro, Negocia, Pop Expresso; **Bike** → 99Bike, 99Entrega Bike. Todos os toggles ligados.

**Prompt 21 — Teste de status com resultado "Ótimo"** *(substitui o Prompt 3)*
> Tela clara com header "Teste de status" e um botão pill outline "⟳ Tentar novamente" à direita. **Durante o teste:** anel circular de 130 px com stroke verde arredondado sobre trilho cinza, mostrando "2/6" e depois "5/6" com "Testando" abaixo, e uma lista de seis linhas — Status de internet, Localização, Status do perfil, Análise de documentos, Status da solicitação, Configurações da solicitação — cada uma virando check verde à medida que aprova. **No resultado:** o anel vira um semicírculo de 180 graus com stroke 14 arredondado, totalmente preenchido em verde, com a palavra "Ótimo" em 22px bold no centro e "Tudo certo" em 13px cinza abaixo. Abaixo, um único card branco: "Como receber chamadas mais rápido?" em bold, e dentro dele uma linha com ícone de raio em disco amarelo-claro, título "Vá até uma área de alta demanda" e o texto "Vá para área de alta demanda no Mapa de Chamadas e receba corridas mais rápido" com chevron. **Não inclua** nenhum card de "Ativar mais categorias".

---

### 11.14 Checklist adicional (v4)

- [ ] Mapa arrasta, dá zoom por pinça e toque duplo, e **não** rotaciona (R11)
- [ ] Hexágonos e pills acompanham o pan; pills não escalam com o zoom
- [ ] FAB de recentrar aparece só quando o mapa sai do centro
- [ ] A engrenagem do Perfil abre "Configurações de perfil" com as 5 + 2 linhas (R4)
- [ ] "Horas Dirigidas" abre o **editor de conta**, com a legenda literal "Toque no ícone para mudar a foto" (R5)
- [ ] Badge de câmera do editor de conta é **escuro** com anel amarelo no avatar; o do Perfil é **amarelo** sem anel
- [ ] Modal "Adicionar veículo" tem as três abas e os três campos, com Cancelar/Salvar de largura igual (R6)
- [ ] Existem os três cards de veículo: moto com modelo, carro e bike com "Sem modelo" (R6)
- [ ] Na Central de ganhos, **só Conta99 navega**; na Conta99, **só Transferir com Pix** (R7)
- [ ] "Continuar" da Transferência Pix nasce desabilitado
- [ ] **Preferências de serviços muda com o veículo ativo** — as três listas existem e estão ligadas ao seletor (R8)
- [ ] A pill do menu lateral acompanha: `Moto • Fase 1` / `Carro • Fase 1` / `Bike • Fase 1`
- [ ] Teste de status termina em **"Ótimo"** com semicírculo cheio (R9)
- [ ] O card "Ativar mais categorias" **não existe** no protótipo (R9)
- [ ] O card "Como receber chamadas mais rápido?" **permanece**
- [ ] Splash tem gradiente âmbar, disco branco com 99 e a versão `V7.10.26`
- [ ] Trajeto continua renderizando por cima — verificado de novo (R10)
- [ ] Nenhuma cor, fonte ou curva de animação das §2–§10 foi alterada

---

# 12. Correções v5 — ponteiro em movimento e navegação em tela cheia

Duas correções de comportamento observadas no protótipo contra o vídeo v4. Nenhuma cor, fonte, token ou curva muda — são correções de **movimento** e de **padrão de navegação**.

**Precedência atualizada:** v5 (§12) > v4 (§11) > v3 (§10) > v2 (§9) > v1 (§1–§8).

| # | Problema | Correção |
|---|---|---|
| **C1** | Ao iniciar a corrida, o ponteiro do motorista **fica parado** no lugar | O ponteiro percorre a rota sozinho, girando na direção do movimento, com a câmera acompanhando. §12.1 |
| **C2** | "Preferências de solicitações" abre como **drawer lateral direito** | Abre em **tela cheia**, com push horizontal e header escuro. §12.2 |

---

## 12.1 `PilotoAutomatico` — o ponteiro precisa andar (C1)

Um ponteiro parado num mapa com rota traçada quebra a ilusão inteira: o protótipo passa a parecer um print. Este é o movimento mais importante do app depois do card de oferta.

### O que substitui

A §4.12 descrevia a corrida em andamento como layout estático. A §3.12 (`AvatarPosicao`) e a §9.3 (`RotaPreview`) descreviam o ponteiro sem comportamento de deslocamento. **Esta seção acrescenta o movimento aos três** — o visual dos componentes não muda.

### Mecânica

O ponteiro **interpola sua posição ao longo dos vértices da polyline**, não em linha reta entre origem e destino. É o que o `ARQUITETURA.md` §5.5 já previa como "piloto automático"; aqui está a especificação visual.

```
posição(t) = interpolar(vertices, progresso)
progresso  = 0 → 1 ao longo da duração do trecho
```

| Parâmetro | Valor | Observação |
|---|---|---|
| Tick de atualização | **60 fps** no protótipo | O app real usa 1 s; para apresentação use quadro a quadro, senão o ponteiro "pula" |
| Duração do trecho | **12 s** para ir buscar · **20 s** em viagem | Tempo de demonstração, não tempo real. Ninguém vai assistir 37 min |
| Curva | `linear` | Movimento de veículo é constante; easing aqui parece elástico e errado |
| Rotação | segue o **bearing** entre o ponto atual e o próximo vértice | Interpole o ângulo, não o aplique de uma vez — ver abaixo |
| Suavização do giro | 300 ms `ease-out`, e sempre pelo caminho angular curto | Sem isso, ao passar de 350° para 10° o ícone dá uma volta completa. É o bug clássico |

### Rastro consumido

Enquanto o ponteiro avança, a rota atrás dele muda de cor — o trecho já percorrido vira `neutro/400` a 50% de opacidade e o trecho à frente permanece `verde/rota`. Isso dá leitura instantânea de progresso sem nenhum texto na tela.

Implementação: duas polylines sobrepostas, a de trás inteira e a da frente com `stroke-dasharray` sincronizado ao progresso.

### Câmera

A câmera **acompanha o ponteiro** mantendo-o a 45% da altura da tela (não centralizado — deixa mais mapa visível à frente do que atrás, que é o que qualquer app de navegação faz). Segue com atraso de ~400 ms, o que produz um leve arraste natural em vez de o mapa parecer colado.

**Interrupção por gesto (integra com a R11):** se o usuário arrastar o mapa durante o percurso, a câmera **solta** o ponteiro e o `FabRecentrar` aparece. Tocar nele devolve o acompanhamento com uma animação de 600 ms `ease-in-out`. O ponteiro nunca para de andar — só a câmera para de segui-lo.

### Comportamento por estado

| Estado | Ponteiro | Rota visível | Botão de ação |
|---|---|---|---|
| `INDO_BUSCAR` | anda do ponto atual até a **origem**, 12 s | motorista → origem | Cheguei |
| `AGUARDANDO` | **parado**, com o halo pulsando (§3.12) | some a rota anterior; entra a rota origem → destino em 700 ms | Iniciar viagem |
| `EM_VIAGEM` | anda da **origem até o destino**, 20 s | origem → destino, consumindo o rastro | Finalizar corrida |
| `FINALIZADA` | parado sobre o destino | rota inteira em `neutro/400` | — |

`AGUARDANDO` é o único estado em que ficar parado é **correto** — é literalmente esperar o passageiro embarcar. Nos outros dois, parado é o bug.

### Chegada

Ao atingir o fim do trecho: o ponteiro para, dá um pulse de 1.0 → 1.15 → 1.0 em 400 ms, o pin correspondente (origem ou destino) faz um bounce vertical de 8 px, e só então o botão de ação troca de rótulo com um cross-fade de 200 ms. A ordem importa — trocar o botão antes da chegada entrega que é uma animação temporizada e não uma consequência.

### Impacto no `ARQUITETURA.md`

| Arquivo | O que acrescentar |
|---|---|
| `utils/geo.ts` | `interpolarNaRota(vertices, progresso)` e `calcularBearing(a, b)` — a segunda já estava prevista |
| `servicos/rotas.ts` | expor os vértices da polyline, não só as pontas |
| `state/corridaStore.ts` | `progressoTrecho: number` (0→1), atualizado por `requestAnimationFrame` ou pelo Reanimated |
| Módulo 8 do roadmap | é exatamente a entrega dele — "carro andando sozinho pela rota (interpolação)". A §12.1 é a especificação visual que faltava |

> **Cuidado com performance:** anime o marcador pelo Reanimated na thread de UI, não com `setState` a 60 fps. Um `setState` por quadro derruba o mapa — é a armadilha nº 4 da §11 do `ARQUITETURA.md`, e ela aparece exatamente aqui.

---

## 12.2 Navegação em tela cheia (C2)

### O que substitui

A §4.6 descrevia "Preferências de solicitações" como **drawer lateral direito ocupando 72% da largura**. Isso veio do vídeo v1 e está **errado** para o app atual. O vídeo v4 mostra a tela ocupando **100% da largura**, com header próprio.

**A §4.6 fica revogada.** O layout de conteúdo descrito nela continua válido; só o contêiner muda.

### Especificação correta

Tela cheia, empilhada na navegação (não modal, não drawer):

- **Header** — altura 56 + safe area, fundo `neutro/900`, seta de voltar branca à esquerda e título **"Preferências de solicitações"** em `título/md` branco, alinhado à esquerda depois da seta. Barra de status com ícones **claros**
- **Corpo** — fundo `neutro/50`, padding lateral 16
- **Títulos de seção** — `título/md` bold `neutro/900`, direto sobre o fundo, sem faixa cinza, com 24 px acima e 12 abaixo: **`Ferramentas de aceitação`** e **`Status da solicitação`**
- **Cards** — brancos, `raio/card`, um por seção, contendo linhas de 58 px com **ícone circular outline** de 24 px (`neutro/900`, traço 1,5), rótulo `corpo/lg` e chevron `neutro/400`. Divisor `neutro/100` entre linhas, recuado até o início do texto

| Seção | Linhas | Ícone |
|---|---|---|
| Ferramentas de aceitação | Definir meu destino | bússola |
| | Preferências de serviços | interrogação em círculo |
| Status da solicitação | Teste de status | check em círculo |
| | Eventos futuros | calendário |

### Transição

**Push horizontal**, o padrão de pilha do iOS — não slide-over, não modal subindo:

| Elemento | Movimento | Duração |
|---|---|---|
| Tela nova | entra da direita, `translateX` 100% → 0 | 300 ms `ease-out` |
| Tela anterior | sai para a esquerda, `translateX` 0 → −30%, com véu `rgba(0,0,0,.08)` por cima | 300 ms, paralelo |
| Voltar | inverso, e **arrastável a partir da borda esquerda** | mesma curva |

O deslocamento parcial da tela de trás (−30%, não −100%) é o que dá a sensação de profundidade da pilha nativa. Sem ele parece troca de slide.

### Regra geral de contêiner

Enquanto corrige uma tela, vale fixar o padrão para o protótipo inteiro — hoje o documento tem três contêineres e nem sempre estava claro qual usar onde:

| Padrão | Quando usar | Exemplos |
|---|---|---|
| **Tela cheia (push)** | Qualquer destino de navegação com conteúdo próprio | Preferências de solicitações, Preferências de serviços, Teste de status, Veículo, Perfil, Configurações de perfil, Editar conta, Central de ganhos, Conta99, Transferência Pix |
| **Drawer lateral esquerdo** | **Só o menu principal** | §4.3 |
| **Bottom sheet** | Conteúdo efêmero sobre o mapa, ou escolha rápida | Card de oferta, Adicionar veículo, action sheet da foto |

**Nenhum drawer lateral direito existe no app.** Se aparecer um no protótipo, é herança da v1 e deve virar tela cheia.

---

## 12.3 Prompts para o Claude Design

**Prompt 22 — Corrida em andamento com ponteiro em movimento** *(substitui o Prompt 7)*
> Mapa claro com uma rota verde curvilínea traçada entre um pin verde de origem (seta para cima) e um pin laranja de destino (seta para baixo). Sobre a linha, sempre renderizado acima dela, o marcador do motorista: disco branco de 40 px com anel azul de 3 px e seta de navegação azul. **O marcador deve percorrer a rota sozinho**, interpolando entre os vértices da polyline em movimento linear e contínuo a 60 fps, levando 12 segundos até a origem e 20 segundos da origem ao destino. A seta gira para apontar na direção do próximo vértice, com o giro suavizado em 300 ms e sempre pelo caminho angular mais curto. O trecho da rota já percorrido muda para cinza a 50% de opacidade enquanto o trecho à frente permanece verde. A câmera acompanha o marcador mantendo-o a 45% da altura da tela, com atraso de 400 ms; se o usuário arrastar o mapa, a câmera solta o marcador e aparece um FAB de recentrar — mas o marcador continua andando. Ao chegar, o marcador dá um pulse de 1.0 a 1.15 e o pin correspondente faz um bounce vertical de 8 px, e só então o botão de ação troca de rótulo com cross-fade de 200 ms. Bottom sheet claro com três alturas de snap (120/280/480) contendo avatar e nome do passageiro com nota, endereço do trecho atual, três ações em ícone (ligar, mensagem, cancelar) e um botão de ação principal full-width. Gere os quatro estados: indo buscar (botão amarelo "Cheguei", marcador andando), aguardando (botão verde "Iniciar viagem", **marcador parado com halo pulsando**, rota trocando para origem→destino em 700 ms), em viagem (botão roxo-escuro "Finalizar corrida" em deslizar-para-confirmar, marcador andando) e finalizada (rota inteira em cinza).

**Prompt 23 — Preferências de solicitações em tela cheia** *(substitui a parte (a) do Prompt 20)*
> Tela cheia — **não** um painel lateral. Header de 56 px com fundo preto, seta de voltar branca à esquerda e o título "Preferências de solicitações" em 18px branco semibold logo depois da seta, com os ícones da barra de status em claro. Corpo com fundo cinza-claro e padding lateral de 16 px. Dois blocos, cada um com um título de seção em 18px bold preto direto sobre o fundo (sem faixa cinza) seguido de um card branco arredondado: **"Ferramentas de aceitação"** com as linhas "Definir meu destino" (ícone de bússola em círculo outline) e "Preferências de serviços" (ícone de interrogação em círculo); **"Status da solicitação"** com "Teste de status" (check em círculo) e "Eventos futuros" (calendário). Cada linha tem 58 px, ícone outline de 24 px à esquerda, rótulo em 17px e chevron cinza à direita, com divisor fino recuado até o início do texto. A tela entra com push horizontal da direita em 300 ms ease-out, empurrando a tela anterior 30% para a esquerda com um véu escuro sutil, e pode ser fechada arrastando da borda esquerda.

---

## 12.4 Checklist adicional (v5)

- [ ] O ponteiro **anda** nos estados `INDO_BUSCAR` e `EM_VIAGEM` (C1)
- [ ] O ponteiro fica parado **apenas** em `AGUARDANDO` e `FINALIZADA`
- [ ] A seta gira seguindo o bearing, suavizada, sem dar volta completa ao cruzar 0°
- [ ] O trecho percorrido da rota fica cinza; o trecho à frente segue verde
- [ ] A câmera acompanha com atraso e **solta** ao arrastar, sem parar o ponteiro
- [ ] Chegada: pulse do ponteiro → bounce do pin → troca do botão, **nessa ordem**
- [ ] O ponteiro continua renderizando acima da polyline durante todo o percurso (R3/R10)
- [ ] "Preferências de solicitações" ocupa a **tela inteira**, com header preto (C2)
- [ ] A transição é **push horizontal**, com a tela de trás recuando 30%
- [ ] Voltar funciona por arraste na borda esquerda
- [ ] **Nenhum drawer lateral direito** sobrou no protótipo — só o menu esquerdo é drawer
- [ ] Nenhuma cor, fonte ou token foi alterado nesta versão

---

# 13. Refinamento v6 — trajeto sobre as ruas reais

**Precedência atualizada:** v6 (§13) > v5 (§12) > v4 (§11) > v3 (§10) > v2 (§9) > v1 (§1–§8).

A rota deixa de ser uma curva desenhada *sobre* o mapa e passa a ser um caminho que **segue a malha viária**: entra em ruas, faz esquinas em ângulo, contorna quarteirões e respeita o sentido das vias. Nenhum token, fonte ou animação muda — muda a **geometria** da polyline e a forma de obtê-la.

### Por que isso importa mais do que parece

Uma linha que atravessa quarteirões diz ao espectador, sem palavras, "isto é um desenho". Uma linha que dobra na esquina diz "isto é um sistema que sabe onde estão as ruas". Para uma banca de pesquisa, essa é a diferença entre um mockup e uma demonstração — e é a única mudança do documento inteiro que melhora simultaneamente a **credibilidade** e a **utilidade** da tela: com a rota correta, os tempos e as distâncias exibidos no card de oferta passam a ser verificáveis contra o mapa.

> Isto **revoga a limitação nº 4 da §13 do `ARQUITETURA.md`**, que dizia "interpole uma linha reta entre os pontos". Aquela decisão fazia sentido quando o objetivo era evitar custo de API. Para o protótipo de apresentação, o caminho da §13.2 resolve sem custo nenhum.

---

## 13.1 Especificação da geometria

| Propriedade | Regra |
|---|---|
| **Aderência** | Todo vértice cai sobre uma via do mapa base. Nenhum segmento cruza quadra, praça, rio ou edificação |
| **Densidade de vértices** | 1 vértice a cada **8–15 m** em curva; retas longas podem ter até 60 m entre vértices. Denso o bastante para a interpolação da §12.1 não "cortar" a curva |
| **Esquinas** | Ângulo real da via, com `stroke-linejoin: round` — o raio do arredondamento é a espessura do traço, não uma curva de Bézier inventada |
| **Espessura** | 5 px (inalterada), `stroke-linecap: round` |
| **Cor** | `verde/rota` `#3ED97F` à frente · `neutro/400` a 50% no trecho consumido (§12.1) |
| **Sentido** | Respeita mão única. Se a origem e o destino estão na mesma rua de sentido único, a rota **dá a volta** — e isso é bom: é o tipo de detalhe que a banca nota |
| **Contorno** | Traço `#FFFFFF` de 8 px por baixo do verde (halo), para a rota não sumir sobre áreas verdes ou avenidas claras do mapa |

**O halo branco é obrigatório.** Sem ele, a rota verde sobre um parque no mapa base desaparece — e o parque é exatamente onde o traçado mais chama atenção.

### Marcadores nas pontas

Com a rota aderente, os pins passam a ancorar no **ponto de acesso da via**, não no centroide do endereço. Na prática: o pin fica na guia da calçada, sobre a rua, alinhado ao primeiro/último vértice da polyline. Um pin flutuando no meio do quarteirão com a linha começando 20 m ao lado entrega a costura tanto quanto a linha reta entregava.

---

## 13.2 Como obter o traçado

Três caminhos, do mais adequado ao protótipo ao mais adequado ao app. **Para a apresentação, use o A.**

### A — Rota pré-calculada e embutida *(recomendado para o protótipo)*

Calcule a rota **uma vez**, fora do protótipo, e embuta o resultado como um array de coordenadas no próprio arquivo.

1. Obtenha a geometria em qualquer serviço de rotas — o projeto **OSRM** mantém um servidor de demonstração público e gratuito, e o **openrouteservice** oferece plano gratuito com chave. Ambos devolvem GeoJSON com a geometria completa
2. Salve o array de `[lng, lat]` num arquivo `rotas.json` do protótipo
3. Renderize com `<polyline>` SVG sobre o mapa, convertendo lat/lng → pixel pela mesma projeção do mapa base

**Vantagens:** zero latência, zero chave de API, zero custo, funciona offline na hora da apresentação — e isso último não é detalhe: **o wi-fi da sala é o ponto de falha mais comum de uma demo**. Uma rota embutida não depende de rede.

Prepare **3 a 5 rotas** entre pares de endereços plausíveis e sorteie uma por oferta. Cinco trajetos distintos já dão a impressão de sistema vivo sem que ninguém perceba a repetição numa apresentação de 10 minutos.

### B — Roteamento em tempo real

Chamar a API a cada oferta. Cabe se o protótipo for demonstrar a integração em si, mas acrescenta latência, chave e dependência de rede. **Não vale o risco numa banca.**

### C — Implementação em React Native *(para quando sair do protótipo)*

| Opção | Observação |
|---|---|
| **Google Directions API** | mesma chave do Maps SDK que a §10 do `ARQUITETURA.md` já pede; retorna `overview_polyline` codificada |
| **OSRM / openrouteservice** | gratuitos, sem cartão; formato GeoJSON direto |

Decodifique com `@mapbox/polyline` e alimente o `<Polyline coordinates={...}>` do `react-native-maps`. Guarde os vértices no `corridaStore` — a §12.1 já os consome para o piloto automático.

```
servicos/rotas.ts
  buscarRota(origem, destino) → { vertices: LatLng[], distanciaKm, duracaoMin }
```

**Use `distanciaKm` e `duracaoMin` da rota real para preencher o card de oferta.** Hoje esses números são inventados pelo simulador; com a rota aderente eles passam a bater com o desenho. Um avaliador atento vai conferir — e o protótipo passa no teste.

---

## 13.3 Efeito na §12.1

A mecânica do piloto automático **não muda**, mas ganha precisão:

- A interpolação passa a percorrer dezenas de vértices em vez de meia dúzia, então o movimento fica naturalmente curvo sem nenhum easing adicional
- O **bearing** passa a ser o da via — a seta do ponteiro gira nas esquinas de forma reconhecível, e é isso que faz o movimento parecer navegação em vez de deslize
- A velocidade deve ser constante em **distância percorrida**, não em vértices por segundo. Vértices são mais densos nas curvas; avançar um por tick faria o ponteiro **frear em toda esquina**. Interpole por comprimento de arco acumulado

Esse último ponto é o erro mais provável da implementação. Sintoma: o ponteiro desacelera nas curvas e dispara nas retas.

---

## 13.4 Prompt para o Claude Design

**Prompt 24 — Trajeto aderente às ruas** *(refina os Prompts 10 e 22)*
> Nas telas de oferta e de corrida em andamento, a rota **não pode ser uma curva livre desenhada sobre o mapa**: ela precisa seguir a malha viária do mapa base. Trace a linha verde exclusivamente sobre ruas e avenidas, entrando e saindo delas em esquinas de ângulo real, contornando quarteirões, sem nunca cruzar uma quadra, praça, parque, rio ou edificação. Use `stroke-linejoin: round` e `stroke-linecap: round` com 5 px de espessura em verde #3ED97F, e adicione por baixo um contorno branco de 8 px para a rota permanecer visível sobre áreas verdes e avenidas claras. A linha deve ter vértices densos — um a cada 8 a 15 metros nas curvas — de modo que o marcador do motorista percorra o caminho suavemente e sua seta gire nas esquinas seguindo a direção da via. Ancore o pin verde de origem e o pin laranja de destino sobre a via, no ponto de acesso da rua, alinhados ao primeiro e ao último vértice da linha — nunca flutuando no meio do quarteirão. Prepare de 3 a 5 trajetos distintos entre endereços diferentes e alterne entre eles a cada nova oferta. O marcador deve avançar com velocidade constante em distância percorrida, e não em vértices por segundo, para não desacelerar nas curvas.

---

## 13.5 Checklist adicional (v6)

- [ ] A rota segue **apenas ruas** — nenhum segmento cruza quadra, praça, parque, rio ou prédio
- [ ] As esquinas têm ângulo real da via, com junção arredondada pela espessura do traço
- [ ] Há **halo branco de 8 px** por baixo do traço verde
- [ ] Os pins de origem e destino ancoram **sobre a via**, alinhados às pontas da linha
- [ ] Vértices densos o bastante para o movimento não "cortar" curvas
- [ ] O ponteiro avança em **velocidade constante de distância**, sem frear nas esquinas
- [ ] A seta gira nas esquinas seguindo o bearing da via
- [ ] Existem **3 a 5 trajetos** distintos, alternando entre ofertas
- [ ] As rotas estão **embutidas no protótipo**, sem depender de rede na hora da apresentação
- [ ] `distanciaKm` e `duracaoMin` do card de oferta batem com o traçado desenhado
- [ ] O trecho percorrido continua virando cinza e o ponteiro continua por cima (§12.1, R3/R10)
- [ ] Nenhuma cor, fonte, token ou curva de animação foi alterada nesta versão

---

# 14. Léxico v7 — a palavra "rota" sai da interface

**Precedência atualizada:** v7 (§14) > v6 (§13) > v5 (§12) > v4 (§11) > v3 (§10) > v2 (§9) > v1 (§1–§8).

**Regra única:** **nenhuma string visível do protótipo contém "rota" ou "rotas".** Onde a palavra aparecia, fica **99**. Nada de layout, cor, fonte, token, animação ou posição muda — é troca de texto.

Onde a substituição deixaria o rótulo truncado ou sem sentido, o **99 absorve o lugar da palavra inteira**, não vira prefixo. `Rota99` → `99`, não `9999`.

---

## 14.1 Tabela de substituição — strings visíveis

| Onde aparece | Antes | Depois |
|---|---|---|
| Pill do menu lateral (§4.3, Prompt 2) | `Rota 99 Moto ›` | **`99 Moto ›`** |
| Pill do menu, variantes por veículo (§11.9) | `Rota 99 Carro` · `Rota 99 Bike` | **`99 Carro`** · **`99 Bike`** |
| Faixa da Central de ganhos (§11.7, Prompt 18) | `Rota99 (Veja mais)` | **`99 (Veja mais)`** |
| Tokens de cor (§2.1) | *descrição citando a pill* | atualizado |
| Assets de marca (§2.9) | *rótulo listado* | atualizado |

Todas as cinco já estão corrigidas no corpo deste documento. A tabela existe para conferência e para o caso de o Claude Design gerar variações novas.

---

## 14.2 Palavras que **não** podem ser trocadas

Substituição cega quebra o protótipo. Estes casos contêm a sequência de letras mas **não são a palavra**:

| String | Por que fica | Onde |
|---|---|---|
| **Rotação** (2 dedos) | é "rotação", gesto de mapa — não é "rota" | §11.3 |
| **rotativo**, **rotina**, qualquer derivado | mesma razão | onde ocorrer |

Faça a troca por **palavra inteira**, respeitando fronteira de token (`\brota s?\b`, sem sensibilidade a maiúsculas), e revise `Rotação` manualmente antes de fechar.

---

## 14.3 Vocabulário técnico interno

O documento continua usando "rota" na **prosa de especificação** — "a rota segue a malha viária", "vértices da rota", `servicos/rotas.ts`. Isso é correto e não muda: é vocabulário de engenharia, não texto de tela. Ninguém na apresentação vê o nome de um arquivo.

Dito isso, há um risco real: um identificador chamado `RotaPreview` convida a virar rótulo por descuido, e aí a palavra reaparece numa tela. Duas defesas, em ordem de esforço:

1. **Mínima (obrigatória):** nenhuma string literal do protótipo — label, título, placeholder, `aria-label`, `alt`, tooltip — contém a palavra. Só identificadores de código podem
2. **Recomendada:** renomeie também os identificadores, e o risco desaparece na origem

| Identificador atual | Sugerido |
|---|---|
| `RotaPreview` (§9.3) | `Trajeto99` |
| `servicos/rotas.ts` (§13.2) | `servicos/trajeto99.ts` |
| `rotas.json` (§13.2) | `trajetos99.json` |
| `buscarRota()` | `buscarTrajeto()` |
| `verde/rota` (token, §9.2) | `verde/trajeto` |

Se renomear o token `verde/rota`, renomeie em **todas** as ocorrências de uma vez — ele aparece nas §9.2, §12.1 e §13.1. Um token com dois nomes é pior que um token com nome ruim.

---

## 14.4 Prompt para o Claude Design

**Prompt 25 — Passe de léxico** *(aplicar por último, sobre todas as telas prontas)*
> Faça um passe de revisão textual em todas as telas do protótipo. Nenhum texto visível ao usuário pode conter as palavras "rota" ou "rotas" — nem em títulos, rótulos de botão, itens de menu, cabeçalhos, placeholders de campo, textos de apoio, legendas ou rótulos de acessibilidade. Onde a palavra aparecer, substitua-a por "99", absorvendo a palavra inteira em vez de virar prefixo: a pill do menu lateral passa de "Rota 99 Moto ›" para **"99 Moto ›"** (e suas variantes por veículo para "99 Carro" e "99 Bike"), e o card da Central de ganhos passa de "Rota99 (Veja mais)" para **"99 (Veja mais)"**. **Atenção:** não altere a palavra "Rotação", que descreve o gesto de girar o mapa e não é a mesma palavra — a troca deve respeitar fronteira de palavra inteira. Nenhum layout, cor, fonte, tamanho, espaçamento ou animação pode mudar neste passe: é exclusivamente troca de texto. Se a substituição encurtar um rótulo a ponto de desalinhar um elemento centralizado, recentralize — sem alterar o tamanho do contêiner.

---

## 14.5 Checklist adicional (v7)

- [ ] Busca por "rota" em todo o texto **visível** do protótipo retorna **zero** resultados
- [ ] A busca foi feita incluindo `aria-label`, `alt`, `title` e placeholders
- [ ] Pill do menu lateral lê **`99 Moto ›`** e acompanha o veículo ativo (`99 Carro`, `99 Bike`)
- [ ] Card da Central de ganhos lê **`99 (Veja mais)`**
- [ ] **"Rotação"** continua intacta na especificação de gestos do mapa (§11.3)
- [ ] Nenhum rótulo ficou como `9999` ou com "99" duplicado
- [ ] Rótulos centralizados que encurtaram foram recentralizados, sem mudar o contêiner
- [ ] Nenhum layout, cor, fonte, token ou animação mudou neste passe

---

# 15. Ícone v8 — o protótipo na tela de início

**Precedência atualizada:** v8 (§15) > v7 (§14) > … > v1.

O protótipo passa a se instalar como app: adicionado à tela de início pelo navegador, ganha ícone próprio, nome próprio e abre **em tela cheia, sem barra de endereço**. Isso muda o que a banca vê antes mesmo de o protótipo abrir — em vez de um atalho genérico de site, um ícone que parece um app instalado.

**Vale a pena pelo que remove:** a barra de endereço do navegador denuncia "isto é uma página web" em todo screenshot e em toda demonstração ao vivo. Em modo `standalone` ela some, e o protótipo ocupa a tela inteira do aparelho como qualquer outro app.

---

## 15.1 O ícone

**Arte:** o wordmark **99** em gradiente âmbar sobre fundo branco, sem moldura própria — o sistema operacional aplica o arredondamento e a sombra.

| Propriedade | Valor |
|---|---|
| Fundo | `#FFFFFF` sólido, sem transparência |
| Gradiente do 99 | `#FADB68` (topo) → `#F0A630` (base), vertical |
| Ocupação do glifo | **46%** da largura no ícone normal · **34%** no maskable |
| Formato | quadrado, sangria total, **sem cantos arredondados no arquivo** |

**Por que sem cantos no arquivo:** iOS e Android aplicam a própria máscara. Um ícone que já vem arredondado é arredondado duas vezes e aparece com uma borda branca fantasma em volta. Entregue o quadrado cheio.

**Por que duas versões:** o Android recorta o ícone em círculo, losango ou squircle conforme o fabricante, cortando até 20% de cada borda. O ícone `maskable` traz o 99 menor (34%) para sobreviver a qualquer recorte; o `any` traz maior (46%) porque não será cortado. Sem a versão maskable, o 99 aparece decapitado em vários aparelhos Android.

### Arquivos gerados

```
assets/icons/
├── icon-1024.png            master
├── icon-512.png             PWA any
├── icon-192.png             PWA any
├── icon-maskable-512.png    Android, safe zone
├── icon-maskable-192.png    Android, safe zone
├── apple-touch-icon.png     180×180 — iOS
├── favicon-32.png
├── favicon-16.png
└── favicon.ico              16/32/48/64
```

Todos foram reconstruídos a partir da imagem original com o glifo vetorizado e reamostrado — não são upscale borrado do arquivo de 182 px. As bordas ficam limpas a 1024.

---

## 15.2 Manifest e `<head>`

`manifest.json` na raiz do protótipo:

| Campo | Valor | Por quê |
|---|---|---|
| `name` | `99 Motorista` | nome na tela de instalação |
| `short_name` | `99` | rótulo sob o ícone — **precisa ser curto**, o sistema trunca acima de ~12 caracteres |
| `display` | `standalone` | tela cheia, sem barra de endereço — é o ponto |
| `orientation` | `portrait` | o protótipo é de celular |
| `background_color` | `#FFFFFF` | tela de abertura enquanto carrega |
| `theme_color` | `#FBE300` | tinge a barra de status no Android |
| `start_url` | `./index.html` | relativo, para funcionar em subpasta |

**O Safari ignora o manifest para o ícone.** No iOS, o que vale é a tag `apple-touch-icon` — sem ela, o iPhone gera o ícone tirando um *print da página*, e o resultado é um retângulo ilegível. Esta é a falha mais comum de PWA em apresentação, e é silenciosa: funciona no Android e quebra só no iPhone.

O arquivo `head-snippet.html` entregue junto traz as tags prontas. Cole no `<head>` do protótipo.

---

## 15.3 Como instalar na apresentação

**iOS (Safari — e só Safari; Chrome no iPhone não instala):** abrir o protótipo → botão Compartilhar → *Adicionar à Tela de Início* → o nome já vem preenchido como "99 Motorista" → Adicionar.

**Android (Chrome):** abrir → menu ⋮ → *Instalar aplicativo* ou *Adicionar à tela inicial*.

> **Instale antes da apresentação, não durante.** O ícone é cacheado no momento em que se adiciona; se você publicar uma versão nova depois, o ícone antigo permanece até remover e adicionar de novo. E teste no aparelho que vai ser usado — o recorte do Android varia por fabricante.

---

## 15.4 Checklist adicional (v8)

- [ ] Os nove arquivos de `assets/icons/` estão publicados junto do protótipo
- [ ] `manifest.json` está na raiz e é referenciado no `<head>`
- [ ] A tag `apple-touch-icon` existe — sem ela o iPhone usa um print da página
- [ ] `display: standalone` — o protótipo abre **sem barra de endereço**
- [ ] `short_name` é `99`, curto o bastante para não truncar
- [ ] O ícone **não** tem cantos arredondados no arquivo
- [ ] O maskable tem o 99 menor e sobrevive ao recorte circular
- [ ] Instalado e conferido **no aparelho da apresentação**, antes dela
- [ ] Nenhum token, cor, fonte ou tela do protótipo mudou nesta versão
