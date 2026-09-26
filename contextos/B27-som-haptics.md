# B27 — Som e vibração

**Onda:** 5 (paralelo com B28, B29)
**Depende de:** B26 (fluxo completo já funcionando, para saber onde plugar os disparos)
**Bloqueia:** nada

## Objetivo

Adicionar feedback sonoro/tátil que o protótipo web não tinha (não roda áudio/
vibração em HTML), mas que `ARQUITETURA.md §3` (tela 4) e `§7` já previam como
parte do app: som de alerta + vibração quando chega uma oferta.

## Arquivos a criar

```
src/servicos/som.ts
```

## Especificação

- `expo-audio` (hook `useAudioPlayer`) — carregar o som de "nova corrida" **uma
  única vez** na montagem do app, não a cada oferta (`ARQUITETURA.md §7`,
  armadilha nº citada explicitamente: "carregue o som uma vez na montagem, não
  a cada oferta").
- Tocar em: nova oferta chega (`corridaStore.gerarOferta`), chegada no
  embarque/destino (`chegar()`), corrida finalizada (opcional, som de sucesso).
- `expo-haptics`: vibração ao chegar oferta (`Haptics.notificationAsync` tipo
  Warning ou Success), e feedback leve em toques importantes (aceitar oferta,
  deslizar para finalizar completar).
- Assets de som ficam em `assets/sons/` (`nova-corrida.mp3`, `chegada.mp3`,
  `sucesso.mp3` — `ARQUITETURA.md §4`, não existem ainda, precisam ser
  adicionados ou gerados/licenciados à parte — **fora do escopo deste bloco
  conseguir os arquivos de áudio em si**, só a integração).

## Notas de tradução Web → RN

- Não há "tradução" — o protótipo não tinha som nem vibração (limitação de
  rodar em navegador via `.dc.html`); isso é funcionalidade nova sobre a base portada.

## Critério de aceite

- Som de alerta toca exatamente quando uma oferta aparece, sem recarregar o
  arquivo a cada vez (mudança de oferta não deve causar delay perceptível).
- Vibração dispara junto com a oferta.
