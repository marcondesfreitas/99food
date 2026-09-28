/**
 * B18 — Tela Carteira ("Conta 99").
 *
 * Tela empurrada de saldo/conta digital, aberta a partir da Central de Ganhos
 * (B17). Conteúdo estático + navegação: bloco amarelo no topo (aviso do Banco
 * Central, saldo, faixa "Adicionar cartão", três ações) e um sheet branco com
 * "Serviços gerais", histórico de transações e "Destaques".
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaCarteira`
 * (linhas 751-821) e `.design-import/logic.js`:
 * - `saldoFmt` linha 486 — `s.ganhos.toFixed(2).replace('.', ',')`, SEM o
 *   prefixo "R$" (a moeda já está no rótulo "Minha Carteira(R$)"). Por isso
 *   esta tela não usa o `fmt()` de `@/servicos/mapaFalso`, que sempre prefixa.
 * - `irPix` linha 631 — `push('pix')` (B19).
 * - `voltarPush` linha 282 — de `carteira` volta sempre para `central` (B17).
 * - `TILES` linha 57 — os quatro tiles de "Serviços gerais", já portados em
 *   `@/servicos/mapaFalso`.
 *
 * MARCA (PLANO_IMPLEMENTACAO_V6.md §5): o protótipo diz "Conta RF" (linha 756)
 * e "RF Pay Informe" (linha 815). O app se chama "99", então viram "Conta 99"
 * e "99 Pay".
 *
 * ## Ícones
 *
 * O protótipo não tem nenhum: no lugar deles há quadrados cinza vazios (os
 * tiles de "Serviços gerais", o histórico), retângulos de contorno vazios (as
 * ações de boleto e Receber Pix) e dois caracteres soltos — `◈` para o Pix
 * (linha 778) e `✦` para "Adicionar cartão" (linha 771). Todos foram
 * preenchidos com desenhos de `@/components/ui/Icones`. As **molduras**
 * continuam sendo as do protótipo (o quadrado de 30 com borda de 2, o círculo,
 * o quadrado branco de 36 dentro do tile); o que entrou foi o desenho que
 * faltava dentro delas.
 *
 * Notas de tradução Web → RN:
 * - O "olho" do saldo era um `border-radius: 999px / 60%` (raio elíptico) no
 *   CSS, que o RN não tem — virava uma pill achatada. Agora é o ícone `olho`.
 * - Os `›` do protótipo são quadrados de 7-9px com duas bordas e
 *   `rotate(-45deg)`; portados literalmente como `View` rotacionada.
 * - O grid de 3 colunas (`grid-template-columns: repeat(3, 1fr)`) não existe no
 *   RN: a largura do tile é calculada a partir de `useWindowDimensions()`.
 */

import { useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { CabecalhoPush } from '@/components/ui/CabecalhoPush';
import { Icone, type NomeIcone } from '@/components/ui/Icones';
import { TILES } from '@/servicos/mapaFalso';
import { useMotoristaStore } from '@/state/motoristaStore';
import { irPix, voltarDe } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill, raioSheet } from '@/tema/espacamento';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

/**
 * O ícone de cada tile de "Serviços gerais".
 *
 * Fica indexado pelo **rótulo** porque é assim que `TILES` identifica o
 * serviço (`src/servicos/mapaFalso.ts` linha 157) — a lista veio do protótipo
 * como `[nome, destaque]`, sem id. O `Record` completo faz o TypeScript cobrar
 * um ícone novo no dia em que um quinto serviço entrar na lista, em vez de
 * deixar um quadrado vazio aparecer calado na tela.
 */
const ICONE_DO_TILE: Record<string, NomeIcone> = {
  'Pagar boleto': 'boleto',
  Transferências: 'transferencia',
  'Recarregar celular': 'celular',
  'Gift Card': 'presente',
};

/** `gap: 10px` entre os tiles de "Serviços gerais". */
const GAP_TILE = 10;
/** `grid-template-columns: repeat(3, 1fr)`. */
const COLUNAS_TILE = 3;
/** Duração do fade do aviso do Banco Central ao ser fechado. */
const DUR_FECHAR_AVISO = 180;

export default function Carteira() {
  const ganhos = useMotoristaStore((s) => s.ganhos);
  const { width } = useWindowDimensions();

  /**
   * O `✕` do aviso regulatório não tem handler no protótipo (é um botão
   * decorativo). Aqui ele fecha de verdade — um botão de fechar que não fecha
   * seria pior que não existir. Estado local: nada além desta tela consome.
   */
  const [avisoVisivel, setAvisoVisivel] = useState(true);
  const opacidadeAviso = useRef(new Animated.Value(1)).current;

  const fecharAviso = () => {
    Animated.timing(opacidadeAviso, {
      toValue: 0,
      duration: DUR_FECHAR_AVISO,
      useNativeDriver: true,
    }).start(() => setAvisoVisivel(false));
  };

  /**
   * `saldoFmt` — logic.js linha 486. Sem prefixo: "R$" já está no rótulo.
   */
  const saldoFmt = ganhos.toFixed(2).replace('.', ',');

  /** Largura do tile: (tela - padding lateral - 2 gaps) / 3. */
  const larguraTile =
    (width - espacamento.telaLateral * 2 - GAP_TILE * (COLUNAS_TILE - 1)) /
    COLUNAS_TILE;

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      <ScrollView
        style={estilos.rolagem}
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Bloco amarelo: `padding: 59px 16px 22px` ------------------ */}
        <View style={estilos.blocoAmarelo}>
          {/*
            O bloco amarelo envolve mais coisa que o header (aviso, saldo,
            ações), então o `CabecalhoPush` entra SEM `fundo` — transparente,
            sobre o amarelo do container. Ele já traz o respiro de 59px
            (`TOPO_PUSH`) e o padding lateral de 16 do protótipo.

            `voltarPush` (logic.js linha 282) manda `carteira` de volta
            para `central` (B17) — é o que `voltarDe('carteira')` faz, e
            aqui coincide com desempilhar um nível.
          */}
          <CabecalhoPush titulo="Conta 99" onVoltar={() => voltarDe('carteira')} />

          {avisoVisivel ? (
            <Animated.View
              style={[estilos.aviso, { opacity: opacidadeAviso }]}
            >
              <Text style={estilos.avisoTexto}>
                De acordo com as exigências regulatórias do Banco Central do
                Brasil, você precisa adicionar seu endereço completo. Toque para
                começar.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar aviso"
                hitSlop={10}
                onPress={fecharAviso}
                style={({ pressed }) => [
                  estilos.avisoFechar,
                  pressed && estilos.pressionado,
                ]}
              >
                <Text style={estilos.avisoFecharTexto}>✕</Text>
              </Pressable>
            </Animated.View>
          ) : null}

          {/* ---- Cartão do saldo (raio só no topo) ---------------------- */}
          <View style={estilos.cartaoSaldo}>
            <View style={estilos.linhaRotuloSaldo}>
              <Text style={estilos.rotuloSaldo}>Minha Carteira(R$)</Text>
              {/* Era uma pill de 18×12 aproximando o `border-radius: 999px/60%`
                  do protótipo (raio elíptico, que o RN não tem). Virou o olho
                  de verdade. */}
              <Icone nome="olho" tamanho={18} cor={cores.neutro600} traco={1.6} />
            </View>

            <View style={estilos.linhaValorSaldo}>
              <Text style={estilos.valorSaldo}>{saldoFmt}</Text>
              <View style={estilos.chevronGrande} />
            </View>
          </View>

          {/* ---- Faixa escura "Adicionar cartão" ------------------------ */}
          <View style={estilos.faixaCartao}>
            <View style={estilos.faixaCartaoEsquerda}>
              {/* O `✦` do protótipo (linha 771) era um caractere de enfeite. */}
              <Icone nome="cartao" tamanho={17} cor={cores.neutro0} traco={1.8} />
              <Text style={estilos.faixaCartaoTexto}>Adicionar cartão</Text>
            </View>
            <Text style={estilos.faixaCartaoDesconto}>Desconto 0 ›</Text>
          </View>

          {/* ---- Três ações -------------------------------------------- */}
          <View style={estilos.linhaAcoes}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Transferir com Pix"
              // `irPix` — .dc.html linha 777.
              onPress={irPix}
              style={({ pressed }) => [
                estilos.acao,
                pressed && estilos.pressionado,
              ]}
            >
              {/* O `◈` do protótipo (linha 778) era um caractere solto no
                  lugar da marca do Pix. */}
              <View style={estilos.iconePix}>
                <Icone nome="pix" tamanho={18} cor={cores.amareloCarteira} traco={2} />
              </View>
              <Text style={[estilos.acaoRotulo, estilos.acaoRotuloAtiva]}>
                Transferir com Pix
              </Text>
            </Pressable>

            {/* As duas seguintes são decorativas no protótipo (`opacity: .55`).
                As molduras continuam sendo o quadrado e o círculo de contorno
                dele; o que entrou foi o desenho que faltava dentro. */}
            <View style={[estilos.acao, estilos.acaoInativa]}>
              <View style={estilos.iconeContorno}>
                <Icone nome="escanear" tamanho={17} traco={1.9} />
              </View>
              <Text style={estilos.acaoRotulo}>Escanear boleto</Text>
            </View>

            <View style={[estilos.acao, estilos.acaoInativa]}>
              <View style={[estilos.iconeContorno, estilos.iconeRedondo]}>
                <Icone nome="qrCode" tamanho={16} traco={2} />
              </View>
              <Text style={estilos.acaoRotulo}>Receber Pix</Text>
            </View>
          </View>
        </View>

        {/* ---- Sheet branco: `margin-top: -12`, raio 20 no topo --------- */}
        <View style={estilos.sheet}>
          <Text style={estilos.tituloSecao}>Serviços gerais</Text>

          <View style={estilos.grade}>
            {TILES.map(([nome, destaque]) => (
              <View
                key={nome}
                style={[estilos.tile, { width: larguraTile }]}
              >
                <View style={estilos.tileIcone}>
                  <Icone nome={ICONE_DO_TILE[nome]} tamanho={20} />
                </View>
                <Text style={estilos.tileRotulo}>{nome}</Text>
                {destaque ? (
                  <View style={estilos.tileBadge}>
                    <Text style={estilos.tileBadgeTexto}>Até 12X</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>

          <View style={estilos.linhaHistorico}>
            <View style={estilos.historicoIcone}>
              <Icone nome="recibo" tamanho={18} cor={cores.neutro600} />
            </View>
            <View style={estilos.historicoTextos}>
              <Text style={estilos.historicoTitulo}>
                Histórico de transações
              </Text>
              <Text style={estilos.historicoSub}>
                Verifique todas as transações e recibos
              </Text>
            </View>
            <View style={estilos.chevronPequeno} />
          </View>

          <Text style={[estilos.tituloSecao, estilos.tituloDestaques]}>
            Destaques
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.faixaDestaques}
          >
            {/* Protótipo linha 815: "RF Pay Informe" → "99 Pay". */}
            <View style={[estilos.destaque, estilos.destaqueComRotulo]}>
              <Text style={estilos.destaqueRotulo}>99 Pay</Text>
            </View>
            <View style={estilos.destaque} />
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro0,
  },
  rolagem: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
  },

  // ---- Bloco amarelo -------------------------------------------------------
  // background:#F5DA0A; padding:59px 16px 22px (o 59 e o 16 do topo vêm do
  // CabecalhoPush; aqui fica o 16 lateral do restante e o 22 de baixo).
  blocoAmarelo: {
    backgroundColor: cores.amareloCarteira,
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 22,
  },

  // margin-top:14 (o CabecalhoPush já entrega 12 de padding-bottom)
  aviso: {
    marginTop: 2,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 34,
    borderRadius: raioCard,
    backgroundColor: cores.amareloAviso,
  },
  // font-size:12.5; line-height:17
  avisoTexto: {
    fontFamily: familiaInter.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: cores.neutro900,
  },
  avisoFechar: {
    position: 'absolute',
    top: 8,
    right: 10,
  },
  avisoFecharTexto: {
    fontFamily: familiaInter.bold,
    fontSize: 12,
    lineHeight: 16,
    color: cores.neutro900,
  },
  pressionado: {
    opacity: 0.6,
  },

  // ---- Cartão do saldo -----------------------------------------------------
  // margin-top:14; padding:16; border-radius:12 12 0 0
  cartaoSaldo: {
    marginTop: 14,
    padding: espacamento.cardPadding,
    borderTopLeftRadius: raioCard,
    borderTopRightRadius: raioCard,
    backgroundColor: cores.neutro0,
  },
  linhaRotuloSaldo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // font-size:15; color:#5D5B61
  rotuloSaldo: {
    ...tipografia.corpoMd,
    color: cores.neutro600,
  },
  linhaValorSaldo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  // font-size:44; font-weight:700; line-height:48; tabular-nums
  valorSaldo: {
    ...tipografia.displayXl,
    ...numeroTabular,
    color: cores.neutro900,
  },
  // width:9; height:9; border-right/bottom 2px #9D9CA1; rotate(-45deg)
  chevronGrande: {
    width: 9,
    height: 9,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: cores.neutro400,
    transform: [{ rotate: '-45deg' }],
  },

  // ---- Faixa "Adicionar cartão" -------------------------------------------
  // padding:12 16; border-radius:0 0 12 12; background:#1E202F
  faixaCartao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: espacamento.cardPadding,
    borderBottomLeftRadius: raioCard,
    borderBottomRightRadius: raioCard,
    backgroundColor: cores.azulCarteira,
  },
  // gap:8 entre o ícone do cartão e o rótulo (o `✦ ` do protótipo era texto).
  faixaCartaoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // font-size:13.5; font-weight:600
  faixaCartaoTexto: {
    fontFamily: familiaInter.semiBold,
    fontSize: 13.5,
    lineHeight: 18,
    color: cores.neutro0,
  },
  // font-size:13
  faixaCartaoDesconto: {
    ...tipografia.corpoSm,
    color: cores.neutro0,
  },

  // ---- Ações ---------------------------------------------------------------
  linhaAcoes: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  acao: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
  },
  acaoInativa: {
    opacity: 0.55,
  },
  // width:30; height:30; border-radius:8; background:#1C1A1F
  iconePix: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: cores.neutro900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeContorno: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: cores.neutro900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeRedondo: {
    borderRadius: raioPill,
  },
  // font-size:12.5; text-align:center
  acaoRotulo: {
    fontFamily: familiaInter.regular,
    fontSize: 12.5,
    lineHeight: 16,
    color: cores.neutro900,
    textAlign: 'center',
  },
  // Só a de Pix é font-weight:600 no protótipo.
  acaoRotuloAtiva: {
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
  },

  // ---- Sheet branco --------------------------------------------------------
  // margin-top:-12; border-radius:20 20 0 0; padding:20 16 28
  sheet: {
    marginTop: -12,
    borderTopLeftRadius: raioSheet,
    borderTopRightRadius: raioSheet,
    backgroundColor: cores.neutro0,
    paddingTop: 20,
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 28,
  },
  // font-size:18; font-weight:700
  tituloSecao: {
    ...tipografia.tituloMd,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
  },
  tituloDestaques: {
    marginTop: 20,
  },

  // ---- Tiles de "Serviços gerais" -----------------------------------------
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP_TILE,
    marginTop: 12,
  },
  // height:100; border-radius:12; background:#F5F5F7
  tile: {
    height: 100,
    borderRadius: raioCard,
    backgroundColor: cores.neutroCampo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
  },
  // width:36; height:36; border-radius:10; background:#FFF; border:1 #DCDAE0
  tileIcone: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // font-size:12; line-height:15; text-align:center
  tileRotulo: {
    fontFamily: familiaInter.regular,
    fontSize: 12,
    lineHeight: 15,
    color: cores.neutro900,
    textAlign: 'center',
  },
  // top:6; right:6; padding:2 6; radius:999; background:#51CD95
  tileBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: raioPill,
    backgroundColor: cores.verdeBadge,
  },
  // font-size:9; font-weight:700; color:#FFF
  tileBadgeTexto: {
    fontFamily: familiaInter.bold,
    fontSize: 9,
    lineHeight: 12,
    color: cores.neutro0,
  },

  // ---- Histórico de transações --------------------------------------------
  // margin-top:16; padding:14; radius:12; border:1 #DCDAE0
  linhaHistorico: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 14,
    borderRadius: raioCard,
    borderWidth: 1,
    borderColor: cores.neutro200,
  },
  historicoIcone: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: cores.neutroCampo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historicoTextos: {
    flex: 1,
  },
  // font-size:15; font-weight:600
  historicoTitulo: {
    ...tipografia.corpoMd,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro900,
  },
  // font-size:13; color:#5D5B61
  historicoSub: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  // width:7; height:7; border-right/bottom 2px #9D9CA1; rotate(-45deg)
  chevronPequeno: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: cores.neutro400,
    transform: [{ rotate: '-45deg' }],
  },

  // ---- Destaques -----------------------------------------------------------
  // gap:10; margin-top:10 — no protótipo é `overflow: hidden`; no RN vira uma
  // faixa rolável horizontal, que é o comportamento nativo equivalente.
  faixaDestaques: {
    gap: GAP_TILE,
    marginTop: 10,
  },
  // width:200; height:96; border-radius:12; background:#F5F5F7
  destaque: {
    width: 200,
    height: 96,
    borderRadius: raioCard,
    backgroundColor: cores.neutroCampo,
  },
  destaqueComRotulo: {
    justifyContent: 'flex-end',
    padding: 12,
  },
  // font-size:13; font-weight:600
  destaqueRotulo: {
    fontFamily: familiaInter.semiBold,
    fontSize: 13,
    lineHeight: 18,
    color: cores.neutro900,
  },
});
