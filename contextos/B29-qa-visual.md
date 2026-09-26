# B29 — QA visual contra os checklists do DESIGN_SYSTEM

**Onda:** 5 (paralelo com B27, B28)
**Depende de:** B26
**Bloqueia:** nada (última etapa)

## Objetivo

Comparar o app rodando (dispositivo/simulador) lado a lado com o protótipo
original (`.design-import/RotaFacil Motorista v6.dc.html`, aberto num
navegador via servidor estático simples) e riscar os checklists já escritos no
`DESIGN_SYSTEM.md`, que cobrem exatamente as armadilhas mais prováveis de cada
versão do protótipo.

## Fonte

`DESIGN_SYSTEM.md`:
- §8 — Checklist de verificação do protótipo (geral)
- §9.7, §10.7, §11.14, §12.4 — checklists incrementais de v2 a v5
- **§13.5 — Checklist v6 (o mais relevante para este plano)**, cobre especificamente:
  - rota só sobre ruas, nunca cruza quadra/praça/parque/rio/prédio
  - esquinas em ângulo real, junção arredondada
  - halo branco de 8px sob o traço verde
  - pins ancorados sobre a via, não flutuando
  - vértices densos o bastante para não "cortar" curvas
  - ponteiro em velocidade constante de distância (não de vértices/segundo)
  - seta gira nas esquinas seguindo o bearing
  - 3 a 5 trajetos distintos alternando entre ofertas
  - rotas embutidas, sem depender de rede
  - `distanciaKm`/`duracaoMin` do card batem com o traçado
  - trecho percorrido fica cinza, ponteiro por cima
  - nenhuma cor/fonte/token/curva de animação alterada nesta versão

## Objetivo prático deste bloco

1. Rodar o app num dispositivo/simulador.
2. Abrir `.design-import/RotaFacil Motorista v6.dc.html` num navegador (ex.:
   `npx serve .design-import` e abrir o arquivo).
3. Percorrer cada item de cada checklist marcando ✅/❌, com nota de qual bloco
   (B-número) precisa de correção quando ❌.
4. Prestar atenção especial a:
   - Timings exatos (1200ms splash, 6100ms facial, 15s oferta, 12s/20s
     indo-buscar/em-viagem, 900ms resumo) — fáceis de "arredondar" sem querer
     durante a implementação.
   - Cores exatas (usar o color picker do navegador no `.dc.html` vs. o app).
   - O erro mais citado no design system: ponteiro "freando nas esquinas"
     (sintoma de interpolar por vértice em vez de por comprimento de arco — ver
     nota de B02/B04).

## Critério de aceite

- Todos os itens do checklist §13.5 marcados ✅, com qualquer ❌ documentado
  como um item de retrabalho apontando para o bloco responsável.
