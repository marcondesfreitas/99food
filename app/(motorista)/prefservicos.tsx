/**
 * B15 — Tela "Preferências de serviços".
 *
 * Tela empurrada a partir de Preferências de Solicitações (B14). Lista as
 * categorias de serviço do **veículo ativo** e deixa o motorista ligar/desligar
 * cada uma. É a interação R8 do DESIGN_SYSTEM.md §11.9 ("a lista muda conforme
 * o veículo ativo"): trocar o veículo em Veículos (B23) re-renderiza esta tela
 * inteira, porque a lista sai de `CATEGORIAS[tipoAtivo]`.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco
 * `telaPrefServicos` (linhas 546-569) e `.design-import/logic.js`:
 * - `categorias` (linhas 524-530) — monta `{ nome, bg, pos, toggle }` a partir
 *   de `CATEGORIAS[tipoAtivo]` e de `catsOff`
 * - `voltarPush()` (linhas 279-286) — daqui volta para `prefsolic`, não ao mapa
 * - `tipoAtivo` (linha 509) — `'MOTO'` → `'Moto'` no texto do aviso
 *
 * Nada de estado local: a lista desligada é `motoristaStore.categoriasDesativadas`
 * (o `catsOff` do protótipo) e o toggle é `motoristaStore.toggleCategoria`.
 *
 * DIVERGÊNCIAS REGISTRADAS (protótipo v6 vence, conforme nota em `src/tema/cores.ts`):
 * 1. DESIGN_SYSTEM.md §11.9 pede header **claro** com o subtítulo dentro de uma
 *    faixa `neutro/secao`. O v6 usa o mesmo header **escuro** de 115px da tela
 *    B14 e imprime o subtítulo direto sobre o fundo `neutro50`, sem faixa.
 *    Seguimos o v6 (e a tabela de variantes do `CabecalhoPush`).
 * 2. DESIGN_SYSTEM.md §3.15 pede `amarelo500` no trilho ligado; o v6 pinta o
 *    trilho desta lista com `#1C1A1F`. Seguimos o v6 via `corLigado`
 *    (ver comentário no JSX).
 * 3. O rótulo da linha usa `tipografia.corpoLg` (17px semibold) porque o
 *    §11.9 nomeia `corpo/lg`; o inline style do v6 só fixa `font-size: 17px` e
 *    herda o peso, então não há conflito real — o DS preenche a lacuna.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import CabecalhoPush from '@/components/ui/CabecalhoPush';
import { Toggle } from '@/components/ui/Toggle';
import { CATEGORIAS, useMotoristaStore } from '@/state/motoristaStore';
import type { TipoVeiculo } from '@/state/tipos';
import { voltarDe } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioCard } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

/** `height: 62px` das linhas de categoria (DESIGN_SYSTEM.md §11.9 e v6). */
const ALTURA_LINHA = 62;

/** `padding: 0 14px` dentro do card branco. */
const PADDING_LINHA = 14;

/** `letter-spacing: .06em` sobre 12px = 0,72px. */
const ESPACAMENTO_ROTULO = 0.72;

/** Cross-fade da lista quando o veículo ativo muda (R8). */
const DURACAO_TROCA = 180;

/** `'MOTO'` → `'Moto'` — logic.js linha 509. */
function rotuloTipo(tipo: TipoVeiculo): string {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase();
}

export default function PrefServicos() {
  const veiculos = useMotoristaStore((s) => s.veiculos);
  const veiculoAtivo = useMotoristaStore((s) => s.veiculoAtivo);
  const categoriasDesativadas = useMotoristaStore((s) => s.categoriasDesativadas);
  const toggleCategoria = useMotoristaStore((s) => s.toggleCategoria);

  const tipo: TipoVeiculo = veiculos[veiculoAtivo]?.tipo ?? 'MOTO';
  const categorias = CATEGORIAS[tipo];

  /**
   * A troca de veículo troca a lista inteira. Um cross-fade curto evita que as
   * linhas simplesmente "pulem" de 5 para 2 itens. Começa em 1 e só anima nas
   * trocas seguintes: a entrada da tela é a transição de push, que é de B25 —
   * animar aqui também daria fade duplo.
   */
  const opacidadeLista = useRef(new Animated.Value(1)).current;
  const tipoAnterior = useRef<TipoVeiculo>(tipo);

  useEffect(() => {
    if (tipoAnterior.current === tipo) return;
    tipoAnterior.current = tipo;

    opacidadeLista.setValue(0);
    const animacao = Animated.timing(opacidadeLista, {
      toValue: 1,
      duration: DURACAO_TROCA,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    animacao.start();
    return () => animacao.stop();
  }, [tipo, opacidadeLista]);

  /**
   * `voltarPush()` (logic.js 279-286) manda `prefservicos` → `prefsolic`, e
   * NÃO ao mapa. `voltarDe` carrega essa tabela e, via `dismissTo`, dá o mesmo
   * resultado tanto pelo caminho normal (empurrada a partir de `prefsolic`)
   * quanto num deep link direto nesta rota.
   */
  const voltar = () => {
    voltarDe('prefservicos');
  };

  return (
    <View style={estilos.tela}>
      {/* Header escuro de 115px → ícones da barra de status em claro. */}
      <StatusBar style="dark" />

      <CabecalhoPush
        titulo="Preferências de serviços"
        variante="escuro"
        onVoltar={voltar}
      />

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* `padding: 20px 16px 0` */}
        <View style={estilos.blocoTitulo}>
          <Text style={estilos.rotuloSecao}>PREFERÊNCIAS DE SOLICITAÇÕES</Text>
          <Text style={estilos.subtitulo}>
            Selecione quais tipos de solicitação você quer receber
          </Text>
        </View>

        {/* `margin: 12px 16px; border-radius: 12px; background: #FFFFFF` */}
        <Animated.View style={[estilos.card, { opacity: opacidadeLista }]}>
          {categorias.map((nome) => {
            // `const on = s.catsOff.indexOf(nome) === -1` — logic.js linha 526.
            const ligada = !categoriasDesativadas.includes(nome);

            return (
              <View key={nome} style={estilos.linha}>
                <Text style={estilos.nomeCategoria}>{nome}</Text>

                {/*
                  `bg: on ? '#1C1A1F' : '#DCDAE0'` (logic.js 527). O default do
                  componente é `amarelo500` (DESIGN_SYSTEM.md §3.15); aqui
                  passamos `neutro900` porque o protótipo v6 — fonte de verdade
                  quando os dois divergem — pinta o trilho ligado desta lista de
                  preto. O off (`neutro200`) é o mesmo nos dois.
                */}
                <Toggle
                  valor={ligada}
                  onChange={() => toggleCategoria(nome)}
                  corLigado={cores.neutro900}
                  rotuloAcessibilidade={nome}
                  testID={`toggle-categoria-${nome}`}
                />
              </View>
            );
          })}
        </Animated.View>

        {/* Aviso amarelo: `margin: 0 16px 24px; padding: 14px; background: #FEF8CC` */}
        <View style={estilos.aviso}>
          <Text style={estilos.textoAviso}>
            A lista acompanha o veículo ativo — hoje{' '}
            <Text style={estilos.textoAvisoForte}>{rotuloTipo(tipo)}</Text>. Troque o
            veículo em Veículos para ver as outras listas.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  // `position: absolute; inset: 0; background: #F9F7FA; overflow: auto`.
  // No RN a tela já ocupa o Slot inteiro — `flex: 1` basta, sem absoluteFill.
  tela: {
    flex: 1,
    backgroundColor: cores.neutro50,
  },
  /**
   * No v6 o header rola junto (o `overflow: auto` está no container externo).
   * Aqui ele fica fixo e só o corpo rola: com no máximo 5 categorias o
   * conteúdo nunca passa da dobra, então não há diferença visual, e um header
   * escuro fixo é o comportamento esperado numa tela empurrada de verdade.
   */
  conteudo: {
    paddingBottom: 24,
  },
  // `padding: 20px 16px 0`
  blocoTitulo: {
    paddingTop: 20,
    paddingHorizontal: espacamento.telaLateral,
  },
  // `font-size: 12px; font-weight: 700; letter-spacing: .06em; color: #9D9CA1`
  rotuloSecao: {
    ...tipografia.labelChip,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    letterSpacing: ESPACAMENTO_ROTULO,
    color: cores.neutro400,
  },
  // `font-size: 13px; color: #5D5B61; margin-top: 3px`
  subtitulo: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
    marginTop: 3,
  },
  // `margin: 12px 16px; border-radius: 12px; background: #FFFFFF; overflow: hidden`
  card: {
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: espacamento.telaLateral,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    overflow: 'hidden',
  },
  /**
   * `height: 62px; padding: 0 14px; gap: 12px; border-bottom: 1px solid #EFEDF1`.
   * A borda vai em TODAS as linhas, inclusive a última — é literalmente o que o
   * v6 faz (a hairline aparece rente à base do card arredondado).
   */
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ALTURA_LINHA,
    paddingHorizontal: PADDING_LINHA,
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro100,
  },
  // `flex: 1; font-size: 17px` — `corpo/lg` (DESIGN_SYSTEM.md §11.9).
  nomeCategoria: {
    ...tipografia.corpoLg,
    flex: 1,
    color: cores.neutro900,
  },
  // `margin: 0 16px 24px; padding: 14px; border-radius: 12px; background: #FEF8CC`
  aviso: {
    marginHorizontal: espacamento.telaLateral,
    padding: PADDING_LINHA,
    borderRadius: raioCard,
    backgroundColor: cores.amarelo100,
  },
  /**
   * `font-size: 13px; line-height: 18px; color: #7a6a00`. É o mesmo papel do
   * token `dinamicoFaixaTexto` (#7A6A00): texto escuro sobre `amarelo100`.
   * Reaproveitado em vez de criar um segundo token com o mesmo valor.
   */
  textoAviso: {
    ...tipografia.corpoSm,
    color: cores.dinamicoFaixaTexto,
  },
  // `<strong style="font-weight: 700">`
  textoAvisoForte: {
    fontFamily: familiaInter.bold,
    fontWeight: '700',
  },
});
