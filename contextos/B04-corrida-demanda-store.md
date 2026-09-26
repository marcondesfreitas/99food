# B04 — corridaStore + demandaStore

**Onda:** 1 (paralelo com B01, B02, B03)
**Depende de:** B00 (usa tipos/geometria de B02 — pode começar em paralelo e integrar depois)
**Bloqueia:** B07, B08 (e via eles, B11)

## Objetivo

Portar o coração do app: a máquina de estados da corrida (oferta → aceitar →
indo buscar → aguardando → em viagem → resumo) e o simulador de demanda
(zonas, multiplicador de preço dinâmico). É o bloco de estado mais crítico —
**ler `ARQUITETURA.md §2` e `§6` inteiros antes de implementar**, eles já
descrevem a máquina de estados e o algoritmo de surge em português.

## Arquivos a criar

```
src/state/corridaStore.ts
src/state/demandaStore.ts
```//ou um único arquivo se preferir, mas mantenha as duas responsabilidades separadas internamente

## Fonte no protótipo

`.design-import/logic.js`, métodos da classe `Component`:
- `criarZonas()` linha 154, `tickDemanda()` linhas 156–169, `faixaDe(z)` linha 171–174, `zonaQuente()` linha 175
- `trajeto()`/`prepAtual()` linhas 177–178
- `iniciarLoop()` linhas 185–215 (**o loop do piloto automático**, roda em `requestAnimationFrame`)
- `chegar()` linhas 217–221
- `gerarOferta()` linhas 317–339, `recusar()` linha 341, `aceitar()` linhas 343–350
- `avancarCorrida()` linhas 352–365, `finalizar()` linhas 367–392

## Especificação

### `demandaStore`
```ts
type ZonaDemanda = { id, x, y, cells, base, pax, mot, mult };
state: { zonas: ZonaDemanda[]; chuva: boolean; evento: boolean }
ações:
  tickDemanda()        // recalcula pax/mot/mult de cada zona a cada ~2.4s (setInterval)
  toggleChuva()         // multiplica demanda por 1.7 — útil como botão de debug (ver B29)
  toggleEvento()        // zona índice 1 recebe fator 3x — evento pontual
  faixaDe(zona) → [min, max]     // faixa de multiplicador exibida (pill do mapa)
  zonaQuente() → ZonaDemanda      // zona com maior `mult`
```
A fórmula de `tickDemanda` (linha 156-169) já está descrita em prosa em
`ARQUITETURA.md §6.3` (log + teto 2.5x + suavização 25% por tick) — **usar a
fórmula do `logic.js`, que é a implementação real, o markdown é só explicação**.

### `corridaStore`
```ts
type StatusCorrida = 'INDO_BUSCAR' | 'AGUARDANDO' | 'EM_VIAGEM'; // ver ARQUITETURA §5
state: {
  oferta: Oferta | null; fase: 'ativo' | 'expirando';
  corrida: Corrida | null; corridaStatus: StatusCorrida | null;
  rotaIdx: number; prog: number; ang: number; chegada: 'pulse'|'pin'|'botao'|null;
}
ações:
  gerarOferta()        // sorteia trajeto+passageiro, calcula valor com multiplicador da zona mais quente,
                        // agenda expiração (dur - 3s → 'expirando', dur → recusar())
  recusar()
  aceitar()             // começa iniciarLoop()
  avancarCorrida()      // INDO_BUSCAR->AGUARDANDO->EM_VIAGEM
  finalizar()           // chama motoristaStore.registrarGanho(...) — integração entre stores aqui
  iniciarLoop()/pararLoop()  // o rAF do piloto automático — ver nota de tradução abaixo
```

- `gerarOferta()` usa `demandaStore.zonaQuente()` e `faixaDe()` para calcular o
  multiplicador — dependência direta entre as duas stores, por isso ficam juntas
  neste bloco.
- `finalizar()` precisa chamar `motoristaStore.getState().registrarGanho(valor, dinamico, item)`
  (de B03) — se B03 ainda não estiver pronto quando este bloco for feito, deixar
  a chamada como TODO com o tipo esperado documentado, não bloquear o resto.

## Notas de tradução Web → RN — a parte mais delicada do plano inteiro

1. **`requestAnimationFrame` existe em RN** (via `react-native-reanimated` ou
   diretamente, o RN moderno tem polyfill de rAF), mas rodar `setState` do
   Zustand a cada frame (60x/s) pode ser pesado. Duas opções:
   - (a) manter o loop em rAF chamando `set()` do Zustand a cada frame (mais
     simples, igual ao protótipo) e otimizar depois se houver jank;
   - (b) mover a interpolação de posição para um `useSharedValue` do Reanimated
     e deixar a store só com `prog`/`corridaStatus` (mais performático, mas
     muda a arquitetura). **Comece com (a)** — é a tradução mais fiel e mais
     simples; só migre para (b) se B29 (QA) detectar jank real no dispositivo.
2. `cancelAnimationFrame`/`clearInterval` precisam ser limpos em
   `componentWillUnmount`/`useEffect cleanup` — no protótipo isso é manual
   (`this.timers`, `this.loopId`, `this.demandaId`); replicar o padrão de "lista
   de timers para limpar" dentro da store ou no componente que a consome.
3. O `bearing` (ângulo do marcador) suaviza com
   `ang = ang + delta * (1 - Math.exp(-dt/0.12))` — é um filtro exponencial
   simples, não precisa de biblioteca, só cuidado para não perder o sinal do
   menor ângulo (`((bearing - ang + 540) % 360) - 180`, linha 200 do logic.js) —
   copiar essa conta exatamente, é fácil errar o wrap-around de 360°.
4. `performance.now()` existe em RN; usar normalmente.

## Critério de aceite

- `corridaStore.gerarOferta()` popula `oferta` com valor coerente (bate com
  `base * mult`, arredondado a 0.05).
- `aceitar()` → `corridaStatus === 'INDO_BUSCAR'` e o loop começa a incrementar `prog`.
- `finalizar()` zera `corrida`/`corridaStatus` e credita em `motoristaStore`.
- `demandaStore.tickDemanda()` chamado repetidamente nunca deixa `mult` passar de 2.5 nem oscilar bruscamente (suavização visível).
