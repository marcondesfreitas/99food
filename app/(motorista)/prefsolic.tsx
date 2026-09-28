/**
 * B14 — Tela "Preferências de solicitações".
 *
 * Tela empurrada (desliza da direita sobre o mapa; a transição em si é do
 * B25). Funciona como o menu das ferramentas de aceitação: o toggle
 * "Definir meu destino" e os atalhos para Preferências de serviços (B15),
 * Teste de status (B16) e Eventos futuros.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaPrefSolic`
 * (linhas 498-545) e `.design-import/logic.js`:
 * - `destinoOn` (linha 129), `corToggle`/`posToggle` (511) e `toggleDestino` (512)
 * - `irPrefServicos` / `irTeste` (linhas 630-633)
 * - `claro = tela === 'prefsolic' || 'prefservicos'` (421) + `corStatusBar`
 *   (622): nesta tela os ícones da barra de status são BRANCOS, porque o
 *   header de 115px é `neutro900`. (`contextos/B14-…md` diz "fundo claro /
 *   ícones escuros"; o protótipo mostra o contrário — `corStatusBar` é a cor
 *   dos ícones, e vale `#FFFFFF` aqui.)
 *
 * DIVERGÊNCIA REGISTRADA: `contextos/B14-tela-pref-solicitacoes.md` descreve
 * esta tela como a lista de categorias do veículo ativo
 * (`CATEGORIAS[tipoAtivo]` + `toggleCategoria`). No protótipo v6 essa lista
 * NÃO está em `telaPrefSolic` — está em `telaPrefServicos` (linhas 546-570),
 * que é a tela do B15 (`prefservicos.tsx`). O próprio contexto manda
 * "conferir o botão exato no template"; o template resolve a dúvida: aqui só
 * existe o atalho para aquela tela. Seguimos o protótipo, que é a fonte de
 * verdade, e `categoriasDesativadas`/`toggleCategoria` ficam com o B15.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';

import CabecalhoPush from '@/components/ui/CabecalhoPush';
import { Toggle } from '@/components/ui/Toggle';
import { irPrefServicos, irTeste, voltarDe } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioCard } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

/** `height: 58px` das linhas dos dois cards. */
const ALTURA_LINHA = 58;
/** `padding: 0 14px` interno do card (o card já está dentro dos 16 da tela). */
const PADDING_LINHA = 14;
/** `width/height: 24px` dos ícones à esquerda. */
const ICONE = 24;
/** `gap: 12px` entre ícone, rótulo e ação. */
const GAP_LINHA = 12;
/** `margin-left: 50px` do divisor = 14 (padding) + 24 (ícone) + 12 (gap). */
const RECUO_DIVISOR = PADDING_LINHA + ICONE + GAP_LINHA;
/** `border: 1.5px solid` dos ícones vazados. */
const TRACO_ICONE = 1.5;
/** `width/height: 7px` + bordas de 2px do chevron `›` das linhas de atalho. */
const CHEVRON = 7;
const TRACO_CHEVRON = 2;

// ---- Ícones ----------------------------------------------------------------
// Todos são desenhados com Views/Svg porque no protótipo são divs — não há
// biblioteca de ícones no projeto.

/**
 * Círculo vazado com o "brilho" de 9×9 no centro (linha "Definir meu
 * destino"). O protótipo usa `clip-path: polygon(50% 0, 68% 62%, 100% 50%,
 * 32% 100%, 50% 38%, 0 50%)`, que não existe no RN — os mesmos seis pontos
 * viram um `Path` de SVG em um viewBox de 9×9.
 */
function IconeDestino() {
  return (
    <View style={[estilos.icone, estilos.iconeCirculo]}>
      <Svg width={9} height={9} viewBox="0 0 9 9">
        <Path
          d="M4.5 0 L6.12 5.58 L9 4.5 L2.88 9 L4.5 3.42 L0 4.5 Z"
          fill={cores.neutro900}
        />
      </Svg>
    </View>
  );
}

/** Círculo vazado com um glifo dentro (`?` e `✓` do protótipo). */
function IconeGlifo({ glifo, tamanho }: { glifo: string; tamanho: number }) {
  return (
    <View style={[estilos.icone, estilos.iconeCirculo]}>
      <Text style={[estilos.glifo, { fontSize: tamanho }]}>{glifo}</Text>
    </View>
  );
}

/** Quadrado arredondado com uma barra e um retângulo — "Eventos futuros". */
function IconeEventos() {
  return (
    <View style={[estilos.icone, estilos.iconeQuadrado]}>
      <View style={estilos.eventosBarra} />
      <View style={estilos.eventosCorpo} />
    </View>
  );
}

/** `border-right/bottom` de 2px girados -45° = seta `›` de navegação. */
function Chevron() {
  return <View style={estilos.chevron} />;
}

// ---- Linhas ----------------------------------------------------------------

type LinhaProps = {
  icone: ReactNode;
  rotulo: string;
  /** Ação à direita: o `Toggle` da linha de destino. */
  acessorio?: ReactNode;
  /** Quando presente, a linha inteira vira botão e ganha o chevron. */
  onPress?: () => void;
  /** Linha estática que mesmo assim exibe o chevron ("Eventos futuros"). */
  comChevron?: boolean;
};

function Linha({ icone, rotulo, acessorio, onPress, comChevron }: LinhaProps) {
  const conteudo = (
    <>
      {icone}
      <Text style={estilos.rotulo} numberOfLines={1}>
        {rotulo}
      </Text>
      {acessorio}
      {onPress || comChevron ? <Chevron /> : null}
    </>
  );

  if (!onPress) {
    return <View style={estilos.linha}>{conteudo}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [estilos.linha, pressed && estilos.linhaPressionada]}
    >
      {conteudo}
    </Pressable>
  );
}

function Divisor() {
  return <View style={estilos.divisor} />;
}

// ---- Tela ------------------------------------------------------------------

export default function PrefSolic() {
  /**
   * `destinoOn` (logic.js linha 129) é estado local desta tela: nenhuma outra
   * tela do protótipo lê a flag — `toggleDestino` (512) só inverte o valor e
   * repinta o próprio toggle. Se B28 (persistência) precisar guardá-la,
   * é só trocar por um campo do `motoristaStore`.
   */
  const [destinoOn, setDestinoOn] = useState(false);

  return (
    <View style={estilos.tela}>
      {/* Ícones brancos: o header desta tela é `neutro900` (logic.js 622). */}
      <StatusBar style="dark" />

      <CabecalhoPush
        titulo="Preferências de solicitações"
        variante="escuro"
        onVoltar={() => voltarDe('prefsolic')}
      />

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <Text style={estilos.tituloSecao}>Ferramentas de aceitação</Text>

        <View style={estilos.card}>
          <Linha
            icone={<IconeDestino />}
            rotulo="Definir meu destino"
            acessorio={
              <Toggle
                valor={destinoOn}
                onChange={setDestinoOn}
                rotuloAcessibilidade="Definir meu destino"
              />
            }
          />
          <Divisor />
          <Linha
            icone={<IconeGlifo glifo="?" tamanho={13} />}
            rotulo="Preferências de serviços"
            // `irPrefServicos` — logic.js linha 633.
            onPress={irPrefServicos}
          />
        </View>

        <Text style={estilos.tituloSecao}>Status da solicitação</Text>

        <View style={estilos.card}>
          <Linha
            icone={<IconeGlifo glifo="✓" tamanho={12} />}
            rotulo="Teste de status"
            // `irTeste` — logic.js linha 630.
            onPress={irTeste}
          />
          <Divisor />
          {/* No protótipo esta linha é um `div` sem `onClick`: mostra o
              chevron mas não navega (a tela não existe). Mantido igual —
              inerte de propósito. */}
          <Linha icone={<IconeEventos />} rotulo="Eventos futuros" comChevron />
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro50,
  },
  // `padding: 0 16px 28px` do bloco abaixo do header.
  conteudo: {
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 28,
  },
  // font-size:18; font-weight:700; margin: 24px 0 12px
  tituloSecao: {
    ...tipografia.tituloMd,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    overflow: 'hidden',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GAP_LINHA,
    height: ALTURA_LINHA,
    paddingHorizontal: PADDING_LINHA,
  },
  linhaPressionada: {
    backgroundColor: cores.neutro50,
  },
  // font-size:17 no peso padrão do protótipo (Inter 400).
  rotulo: {
    ...tipografia.corpoLg,
    fontFamily: familiaInter.regular,
    fontWeight: '400',
    flex: 1,
    color: cores.neutro900,
  },
  divisor: {
    height: 1,
    marginLeft: RECUO_DIVISOR,
    backgroundColor: cores.neutro100,
  },
  icone: {
    width: ICONE,
    height: ICONE,
    borderWidth: TRACO_ICONE,
    borderColor: cores.neutro900,
    alignItems: 'center',
  },
  iconeCirculo: {
    borderRadius: ICONE / 2,
    justifyContent: 'center',
  },
  // border-radius: 5px; flex-direction: column; padding-top: 3px; gap: 2px
  iconeQuadrado: {
    borderRadius: 5,
    flexDirection: 'column',
    paddingTop: 3,
    gap: 2,
  },
  glifo: {
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
    // Sem `lineHeight` herdado da escala: o glifo precisa caber nos 24px.
    lineHeight: 16,
  },
  eventosBarra: {
    width: 14,
    height: TRACO_ICONE,
    backgroundColor: cores.neutro900,
  },
  eventosCorpo: {
    width: 14,
    height: 8,
    borderTopWidth: TRACO_ICONE,
    borderTopColor: cores.neutro900,
  },
  chevron: {
    width: CHEVRON,
    height: CHEVRON,
    borderRightWidth: TRACO_CHEVRON,
    borderBottomWidth: TRACO_CHEVRON,
    borderColor: cores.neutro400,
    transform: [{ rotate: '-45deg' }],
  },
});
