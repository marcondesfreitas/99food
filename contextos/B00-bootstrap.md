# B00 — Bootstrap do projeto Expo

**Onda:** 0 (sequencial, bloqueia todos os outros blocos)
**Depende de:** nada
**Bloqueia:** B01, B02, B03, B04 (e por consequência, tudo mais)

## Objetivo

Criar o esqueleto do projeto Expo/React Native descrito em `ARQUITETURA.md §4`,
sem nenhuma tela funcional ainda — só a base para os outros blocos escreverem
arquivos sem conflito de configuração.

## Arquivos a criar

```
99motorista/
├── app/
│   ├── _layout.tsx            # layout raiz vazio (Slot do Expo Router)
│   └── (motorista)/
│       └── _layout.tsx        # placeholder
├── src/
│   ├── components/{mapa,demanda,corrida,ui}/.gitkeep
│   ├── state/.gitkeep
│   ├── servicos/.gitkeep
│   ├── tema/.gitkeep
│   └── utils/.gitkeep
├── assets/{sons,imagens,fontes}/.gitkeep
├── app.json
├── babel.config.js
├── tsconfig.json
└── package.json
```

## Especificação

- **Stack:** React Native + Expo (SDK 57 / RN 0.86 / React 19.2), conforme `ARQUITETURA.md §1`.
- Instalar com `npx expo install`, nunca `npm install`, para casar versões com o SDK.
- Dependências a instalar (todas usadas por blocos futuros — instalar tudo agora evita retrabalho):
  - `zustand` (estado — B03/B04)
  - `@react-native-async-storage/async-storage` (B28)
  - `react-native-reanimated` + `react-native-gesture-handler` (animações e pan/zoom — B06/B08/B11)
  - `react-native-svg` (rota com halo, moldura facial — B06/B09)
  - `expo-haptics` (B27)
  - `expo-audio` (B27)
  - `expo-camera` (preview da câmera na tela facial — B12; neste protótipo a detecção é **simulada**, não precisa de ML Kit)
  - `@expo/vector-icons` (já incluso no template Expo)
- `babel.config.js`: plugin do Reanimated deve ser o **último** da lista (armadilha comum, ver `ARQUITETURA.md §11.5`).
- Roteamento: **Expo Router** (arquivo `app/_layout.tsx` como raiz; grupo `(motorista)` para a área logada, igual ao plano do ARQUITETURA). A composição fina das rotas (quais telas existem) é responsabilidade de B25 — aqui só o layout vazio.
- `tsconfig.json`: strict mode ligado (o projeto é 100% TypeScript, incluindo os stores e modelos de dados).

## Notas de tradução Web → RN

- Não há tradução aqui — é puro setup de projeto.

## Critério de aceite

- `npx expo start` sobe sem erro, mostra uma tela em branco.
- `npx tsc --noEmit` passa sem erros.
- Estrutura de pastas bate exatamente com `ARQUITETURA.md §4`.
