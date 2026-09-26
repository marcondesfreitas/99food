# B03 — motoristaStore

**Onda:** 1 (paralelo com B01, B02, B04)
**Depende de:** B00 (e conceitualmente de B02 para os tipos, mas pode começar em paralelo e importar os tipos quando prontos)
**Bloqueia:** B08, B24 (e a maioria das telas da Onda 3, via `src/state/tipos.ts`)

## Objetivo

Portar a fatia do estado do protótipo que **não é a corrida em si** — sessão do
motorista, ganhos, histórico, perfil, veículos, conta, Pix, preferências,
banner/camada. No protótipo tudo mora numa classe só (`Component.state`); aqui
vira uma store Zustand dedicada, seguindo `ARQUITETURA.md §4` (`motoristaStore.ts`).

## Arquivos a criar

```
src/state/motoristaStore.ts
```

## Fonte no protótipo

`.design-import/logic.js`:
- Estado inicial: linhas 123–140 (campos: `ganhos, dinamico, historico, foto,
  sheetFoto, modalVeiculo, catsOff, veiculos, ativo, novoTipo/novoPlaca/novoModelo/novoCor,
  contaNome/contaEmail/contaTel/contaSalvo, pixNome/pixCpf/pixConta/pixDigito/pixAgencia/pixTipo,
  banner, camada`)
- Ações espalhadas em `renderVals()` (linhas 402–655): `fecharBanner`, `toggleCamada`,
  `tirarFoto`/`removerFoto` (linhas 552–553), `salvarConta` (578), `ativar` veículo (585),
  `salvarVeiculo` (600–608), `enviarPix` (620), toggle de categorias (524–530).
- `finalizar()` (linhas 367–392) também escreve em `ganhos`, `dinamico`, `historico` —
  **mas a lógica de finalizar a corrida em si pertence a B04**; este bloco só
  precisa expor as ações `registrarGanho(valor, dinamico, item)` e
  `adicionarHistorico(item)` que B04 vai chamar.

## Especificação

Estado e ações (nomes sugeridos, mantendo o português do protótipo):

```ts
type MotoristaState = {
  ganhos: number; dinamico: number;
  historico: { hora: string; endereco: string; valorFmt: string; valor: number; h: number }[];
  foto: 'ok' | 'vazio' | 'enviando';
  banner: boolean; camada: boolean;
  veiculos: Veiculo[]; veiculoAtivo: number;
  contaNome: string; contaEmail: string; contaTel: string;
  pix: { nome: string; cpf: string; conta: string; digito: string; agencia: string; tipo: string };
  categoriasDesativadas: string[]; // catsOff

  registrarGanho: (valor: number, dinamico: number, item: HistoricoItem) => void;
  fecharBanner: () => void;
  toggleCamada: () => void;
  tirarFoto: () => void;      // seta 'enviando' e depois 'ok' após 1.4s (setTimeout)
  removerFoto: () => void;
  ativarVeiculo: (i: number) => void;
  adicionarVeiculo: (v: Veiculo) => void;
  salvarConta: (dados) => void;
  enviarPix: (dados) => boolean;   // valida antes (nome>2, cpf>5, conta>3 chars — regra exata do protótipo linha 444)
  toggleCategoria: (nome: string) => void;
};
```

- `CATEGORIAS`, `TIPOS_CONTA`, `TILES` (constantes, vêm de B02/`mapaFalso.ts` —
  reexportar ou importar de lá, não duplicar).
- Veículo inicial: os 3 do protótipo (linha 132–136) — moto/carro/bike de exemplo.
  **Trocar dados pessoais fictícios do protótipo** (`Diogo Marques`, placas) por
  outros nomes fictícios — o `DESIGN_SYSTEM.md §2.9` já avisa para não vazar
  dado de quem gravou o vídeo original; use qualquer nome genérico.

## Notas de tradução Web → RN

- `setState({ foto: 'enviando' }); setTimeout(() => setState({ foto: 'ok' }), 1400)`
  vira uma ação Zustand que dispara um `setTimeout` — lembrar de não vazar o
  timer (não há "unmount" de store, mas evite race condition se a ação for
  chamada de novo antes do timeout resolver).
- Formatação de moeda: usar a mesma função `fmt()` de B02, não `Intl.NumberFormat`
  solto (o protótipo usa `toFixed(2).replace('.', ',')`; manter idêntico para
  bater com os valores exibidos no card de oferta gerados por B04).

## Critério de aceite

- Store importável e testável fora de componente (`motoristaStore.getState().registrarGanho(...)`
  atualiza `ganhos`/`historico` corretamente).
- Nenhuma referência a `corridaStatus`, `oferta`, `zonas` aqui — isso é B04.
