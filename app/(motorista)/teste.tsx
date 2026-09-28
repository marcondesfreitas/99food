/**
 * B16 — Tela "Teste de status".
 *
 * Tela empurrada que roda uma checagem simulada de 6 itens. É pura máquina de
 * tempo: o estado é um único inteiro (`passo`, de 0 a 6) que sobe de um em um
 * a cada 1150ms, e tudo na tela — anel, checklist, bloco de resultado — é
 * função desse inteiro.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaTeste`
 * (linhas 570-643) e `.design-import/logic.js`:
 * - `CHECK` (linha 2) — os 6 rótulos, já portados em `@/servicos/mapaFalso`
 * - `rodarTeste()` (linha 314) — `for (i = 1..6) at(() => setState({testeStep: i}), i * 1150)`
 * - `testeRodando` / `testeCompleto` / `anelOffset` / `anelTexto` /
 *   `checklist` / `reiniciarTeste` (linhas 531-537)
 *
 * O `at()` do protótipo registra o timer numa lista que `limpar()` esvazia a
 * cada troca de tela. Aqui o equivalente é o cleanup do `useEffect`: os 6
 * `setTimeout` são guardados num array e todos limpos ao desmontar (ou ao
 * reiniciar), para que nenhum `setPasso` dispare depois que a tela sai.
 */

import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Polygon } from 'react-native-svg';

import { AnelProgresso } from '@/components/ui/AnelProgresso';
import { CabecalhoPush } from '@/components/ui/CabecalhoPush';
import { Card } from '@/components/ui/Card';
import { LinhaChecklist, type EstadoChecklist } from '@/components/ui/LinhaChecklist';
import { CHECK } from '@/servicos/mapaFalso';
import { voltarDe, voltarMapa } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill } from '@/tema/espacamento';
import { tipografia } from '@/tema/tipografia';

/** `rodarTeste()` — logic.js linha 314: um item a cada 1150ms. */
const INTERVALO_ITEM = 1150;

/** 6 itens = 6 timers = ~6,9s de teste. */
const TOTAL_ITENS = CHECK.length;

const TAMANHO_ANEL = 130;

/** Arco de resultado: `viewBox="0 0 200 108"`, `stroke-width="14"`. */
const ARCO_LARGURA = 200;
const ARCO_ALTURA = 108;
const ARCO_ESPESSURA = 14;
const ARCO_PATH = 'M14 100 A86 86 0 0 1 186 100';

// ---- Peças locais ------------------------------------------------------------

/**
 * `‹span›` de 7-8px com duas bordas girado -45°: o chevron "›" do protótipo.
 * Não vale um componente compartilhado — as outras telas o desenham com
 * tamanhos e cores próprios.
 */
function Chevron({ tamanho, cor }: { tamanho: number; cor: string }) {
  return (
    <View
      style={[
        estilos.chevron,
        { width: tamanho, height: tamanho, borderTopColor: cor, borderRightColor: cor },
      ]}
    />
  );
}

/**
 * Raio do card "Vá até uma área de alta demanda". No protótipo é um
 * `clip-path: polygon(...)` de 10×16; em RN vira um `<Polygon>` com os
 * mesmos vértices já convertidos de porcentagem para px.
 */
function IconeRaio() {
  return (
    <Svg width={10} height={16} viewBox="0 0 10 16">
      <Polygon
        points="5.8,0 10,0 4.2,7.04 9.2,7.04 1.2,16 4,8.32 0,8.32"
        fill={cores.dinamicoFaixaTexto}
      />
    </Svg>
  );
}

/** Pill "⟳ Tentar novamente" da direita do header (`reiniciarTeste`). */
function BotaoTentarNovamente({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Tentar novamente"
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [estilos.pillTentar, pressed && estilos.pressionado]}
    >
      {/* 12,5px no protótipo; `labelChip` (12) é o token mais próximo. */}
      <Text style={estilos.pillTentarTexto}>⟳ Tentar novamente</Text>
    </Pressable>
  );
}

// ---- Tela --------------------------------------------------------------------

export default function TesteDeStatus() {
  /** `testeStep` — 0 a 6. Item `i` está aprovado quando `i < passo`. */
  const [passo, setPasso] = useState(0);

  /**
   * Contador de execuções. Trocar seu valor é o gatilho de "rodar de novo":
   * o efeito abaixo depende dele, então o React limpa os timers da rodada
   * anterior (cleanup) antes de agendar a nova — que é exatamente o
   * `limpar()` + `rodarTeste()` do `reiniciarTeste` (logic.js linha 537).
   */
  const [rodada, setRodada] = useState(0);

  useEffect(() => {
    setPasso(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= TOTAL_ITENS; i += 1) {
      timers.push(setTimeout(() => setPasso(i), i * INTERVALO_ITEM));
    }

    // Nenhum timer sobrevive à saída da tela nem a um "Tentar novamente".
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [rodada]);

  const reiniciar = useCallback(() => setRodada((n) => n + 1), []);

  /**
   * Esta é a única tela cujo `‹` chama `voltarPush` diretamente no protótipo
   * (`.dc.html` linha 573) — ou seja, vai para Preferências de solicitações
   * **sempre**, inclusive quando a tela foi aberta pelo FAB do mapa.
   *
   * Não é `back()`: `voltarDe` reproduz a tabela de `voltarPush`, e o
   * `dismissTo` por baixo substitui a tela atual quando `prefsolic` não está
   * na pilha (que é justamente o caso do FAB). Nesse caminho o gesto nativo de
   * borda continua desempilhando para o mapa, então gesto e botão discordam —
   * ver o cabeçalho de `src/servicos/navegacao.ts`.
   */
  const voltar = useCallback(() => voltarDe('teste'), []);

  /** `voltarMapa` — CTA "Vá até uma área de alta demanda" (`.dc.html` 630). */
  const irParaMapa = useCallback(() => voltarMapa(), []);

  const completo = passo >= TOTAL_ITENS;

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      {/*
        No protótipo o header rola junto com o conteúdo (`overflow: auto` no
        container que também tem o `padding-top: 59`). Aqui ele fica fixo — o
        `TOPO_PUSH` do CabecalhoPush já embute o mesmo respiro.
      */}
      <CabecalhoPush
        titulo="Teste de status"
        centralizado
        onVoltar={voltar}
        direita={<BotaoTentarNovamente onPress={reiniciar} />}
      />

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Resultado: anel enquanto roda, arco quando termina ----------- */}
        {completo ? (
          <View style={estilos.blocoArco}>
            <View style={estilos.arco}>
              <Svg
                width={ARCO_LARGURA}
                height={ARCO_ALTURA}
                viewBox={`0 0 ${ARCO_LARGURA} ${ARCO_ALTURA}`}
              >
                <Path
                  d={ARCO_PATH}
                  fill="none"
                  stroke={cores.neutro100}
                  strokeWidth={ARCO_ESPESSURA}
                  strokeLinecap="round"
                />
                <Path
                  d={ARCO_PATH}
                  fill="none"
                  stroke={cores.verdeAnel}
                  strokeWidth={ARCO_ESPESSURA}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={estilos.arcoTexto} pointerEvents="none">
                <Text style={estilos.arcoTitulo}>Ótimo</Text>
                <Text style={estilos.legenda}>Tudo certo</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={estilos.blocoAnel}>
            <AnelProgresso
              progresso={passo / TOTAL_ITENS}
              valor={`${passo}/${TOTAL_ITENS}`}
              tamanho={TAMANHO_ANEL}
              // Verde exclusivo deste anel — não é o `sucesso500`
              // (DESIGN_SYSTEM.md §11.2).
              cor={cores.verdeAnel}
              testID="anel-teste"
            />
            <Text style={[estilos.legenda, estilos.legendaTestando]}>Testando</Text>
          </View>
        )}

        {/* --- Checklist dos 6 itens --------------------------------------- */}
        <Card borda padding={0} estilo={estilos.cardLista}>
          {completo ? (
            <View style={estilos.linhaAprovados}>
              <Text style={estilos.tituloAprovados}>Testes aprovados</Text>
              <Chevron tamanho={8} cor={cores.neutro600} />
            </View>
          ) : null}

          {CHECK.map((nome, i) => (
            <LinhaChecklist
              key={nome}
              rotulo={nome}
              estado={estadoDoItem(i, passo)}
              divisor={i < TOTAL_ITENS - 1}
            />
          ))}
        </Card>

        {/* --- Dica de fim de tela ------------------------------------------ */}
        <Card borda padding={0} estilo={estilos.cardDica}>
          <Text style={estilos.tituloDica}>Como receber chamadas mais rápido?</Text>

          <Pressable
            accessibilityRole="button"
            onPress={irParaMapa}
            style={({ pressed }) => [estilos.linhaDica, pressed && estilos.pressionado]}
          >
            <View style={estilos.bolhaRaio}>
              <IconeRaio />
            </View>
            <View style={estilos.textoDica}>
              <Text style={estilos.dicaTitulo}>Vá até uma área de alta demanda</Text>
              <Text style={estilos.dicaSub}>
                Vá para área de alta demanda no Mapa de Chamadas e receba corridas mais
                rápido
              </Text>
            </View>
            <Chevron tamanho={7} cor={cores.neutro400} />
          </Pressable>
        </Card>
      </ScrollView>
    </View>
  );
}

/**
 * `checklist` — logic.js linha 533: aprovado abaixo do passo atual, testando
 * exatamente no passo, pendente acima.
 */
function estadoDoItem(indice: number, passo: number): EstadoChecklist {
  if (indice < passo) return 'aprovado';
  if (indice === passo) return 'testando';
  return 'pendente';
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro50,
  },
  conteudo: {
    paddingBottom: 28,
  },

  // ---- Header ---------------------------------------------------------------
  // padding: 7px 12px; border-radius: 999px; border: 1px solid #DCDAE0
  pillTentar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: raioPill,
    borderWidth: 1,
    borderColor: cores.neutro200,
  },
  pillTentarTexto: {
    ...tipografia.labelChip,
    color: cores.neutro900,
  },
  pressionado: {
    opacity: 0.6,
  },

  // ---- Anel / arco ----------------------------------------------------------
  // padding: 26px 0 22px
  blocoAnel: {
    alignItems: 'center',
    paddingTop: 26,
    paddingBottom: 22,
  },
  legenda: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  legendaTestando: {
    marginTop: 12,
  },
  // padding: 30px 0 10px
  blocoArco: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 10,
  },
  arco: {
    width: ARCO_LARGURA,
    height: ARCO_ALTURA,
  },
  // position: absolute; left: 0; right: 0; bottom: 6px
  arcoTexto: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: 'center',
  },
  arcoTitulo: {
    ...tipografia.tituloLg,
    color: cores.neutro900,
  },

  // ---- Checklist ------------------------------------------------------------
  // margin: 8px 16px 0
  cardLista: {
    marginTop: 8,
    marginHorizontal: espacamento.telaLateral,
    borderRadius: raioCard,
    overflow: 'hidden',
  },
  // padding: 14px 16px; border-bottom: 1px solid #EFEDF1
  linhaAprovados: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: espacamento.telaLateral,
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro100,
  },
  tituloAprovados: {
    ...tipografia.corpoLg,
    fontSize: 15,
    lineHeight: 20,
    color: cores.neutro900,
  },
  // border-top + border-right girados -45° = "›"
  chevron: {
    borderTopWidth: 2,
    borderRightWidth: 2,
    transform: [{ rotate: '-45deg' }],
  },

  // ---- Card de dica ---------------------------------------------------------
  // margin: 16px 16px 28px; padding: 16px 14px
  cardDica: {
    marginTop: espacamento.telaLateral,
    marginHorizontal: espacamento.telaLateral,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  // font-size: 15px; font-weight: 700 — `labelBtn` é o token bold, em 15/20.
  tituloDica: {
    ...tipografia.labelBtn,
    fontSize: 15,
    lineHeight: 20,
    color: cores.neutro900,
  },
  linhaDica: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  bolhaRaio: {
    width: 36,
    height: 36,
    borderRadius: raioPill,
    backgroundColor: cores.amarelo100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoDica: {
    flex: 1,
  },
  dicaTitulo: {
    ...tipografia.corpoLg,
    fontSize: 15,
    lineHeight: 20,
    color: cores.neutro900,
  },
  dicaSub: {
    ...tipografia.corpoSm,
    lineHeight: 17,
    color: cores.neutro600,
  },
});
