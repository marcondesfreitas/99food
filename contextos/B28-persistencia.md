# B28 — Persistência (AsyncStorage)

**Onda:** 5 (paralelo com B27, B29)
**Depende de:** B26 (stores finais já estáveis)
**Bloqueia:** nada

## Objetivo

Persistir localmente o que deve sobreviver a fechar/reabrir o app — no
protótipo web nada persiste (é um estado em memória que reseta ao recarregar
a página), mas `ARQUITETURA.md §12` ("Como saber que terminou") exige
explicitamente: *"fechar o app, reabrir, e o histórico de ganhos continuar lá"*.

## Arquivos a criar

```
src/servicos/armazenamento.ts
```

## Especificação

- Persistir via `@react-native-async-storage/async-storage`:
  - `motoristaStore`: `historico`, `ganhos`, `dinamico`, `veiculos`,
    `veiculoAtivo`, dados de conta/perfil, `categoriasDesativadas`.
  - Preferência de tema (claro/escuro), se/quando implementado (não existe no
    protótipo v6 — está fora deste plano, mas o `armazenamento.ts` já pode
    prever o campo).
- **Não persistir** estado de corrida em andamento (`corridaStore`) nem estado
  de demanda (`demandaStore`) — são efêmeros/simulados, recomeçam do zero a
  cada abertura do app, igual ao protótipo (`resetar()`, `logic.js` linha 649-653,
  mostra exatamente o que deveria voltar ao zero: ganhos, histórico, zonas,
  etc. — usar como checklist inverso do que persistir vs. resetar).
- Usar o padrão `persist` middleware do Zustand (`zustand/middleware`) em vez
  de salvar manualmente a cada ação, se possível — mais simples e menos
  propenso a esquecer um campo.

## Notas de tradução Web → RN

- Não há tradução — funcionalidade nova.

## Critério de aceite

- Fechar o app depois de completar algumas corridas e reabrir mantém
  `ganhos`/`historico`/`veiculos` intactos.
- `corridaStore` sempre volta limpo (sem oferta/corrida pendurada) na abertura.
