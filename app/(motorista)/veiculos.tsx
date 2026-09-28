/**
 * B23 — Tela de Veículos.
 *
 * Lista os veículos cadastrados; tocar num card o ativa. Botão fixo no rodapé
 * abre o modal de adicionar (`ModalAdicionarVeiculo`).
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaVeiculos`
 * (linhas 1007-1034) e `.design-import/logic.js`: o `map` de `veiculos`
 * (linhas 579-586) e `salvarVeiculo` (600-608).
 *
 * Trocar o veículo ativo **zera as categorias desativadas** — é o que
 * `ativarVeiculo` (B03) faz, porque as categorias dependem do tipo de veículo.
 * Isso re-renderiza a tela de Preferências de serviços (B15), que lista
 * `CATEGORIAS[tipoAtivo]`: é a cadeia que o DESIGN_SYSTEM §11.9 descreve como
 * "o usuário quer ver a cadeia funcionando".
 *
 * Os veículos iniciais do protótipo tinham modelo/placa possivelmente reais
 * (DESIGN_SYSTEM §2.9); a store já usa fictícios genéricos. Nada é hardcodado
 * aqui — tudo vem de `motoristaStore.veiculos`.
 *
 * ## O que foi ALÉM do protótipo: excluir veículo
 *
 * Em `.dc.html` a lista só cresce — há "Adicionar" e nada que remova. Cada
 * card ganhou uma lixeira no canto superior direito, que pede confirmação
 * antes de apagar (`FolhaConfirmar`).
 *
 * Duas decisões que valem ler junto do código:
 *
 * 1. **A lixeira não é filha do card.** O card inteiro é um `Pressable` que
 *    ativa o veículo; um `Pressable` dentro do outro se resolve bem no touch
 *    nativo, mas no React Native Web o clique sobe e dispararia os dois — o
 *    veículo seria ativado no mesmo toque que pede para excluí-lo. Posicionada
 *    como irmã absoluta por cima, a lixeira recebe o toque sozinha em qualquer
 *    plataforma.
 * 2. **Ela some quando resta um veículo.** `veiculoAtivo` é um índice e todo o
 *    app assume que existe um veículo ativo (o pill do menu, as categorias de
 *    B15). Um botão visível que recusa o toque não explica nada; não oferecer
 *    a ação é mais honesto — e a lixeira reaparece assim que existem dois.
 */

import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { CabecalhoPush } from '@/components/ui/CabecalhoPush';
import { FolhaConfirmar } from '@/components/ui/FolhaConfirmar';
import { Icone } from '@/components/ui/Icones';
import { ModalAdicionarVeiculo } from '@/components/veiculos/ModalAdicionarVeiculo';
import { useMotoristaStore } from '@/state/motoristaStore';
import type { TipoVeiculo, Veiculo } from '@/state/tipos';
import { voltarDe } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

/**
 * A arte de cada tipo de veículo, na miniatura de 64×52 do card.
 *
 * No protótipo esse quadrado é um listrado a 135° com o rótulo "foto moto" /
 * "foto carro" / "foto bike" escrito por cima (`.dc.html` linha 1025) — um
 * marcador de "aqui vai a imagem do veículo". Estas são as imagens.
 *
 * `require` estático de propósito: o Metro precisa resolver o asset em tempo
 * de bundling, então o caminho não pode ser montado em runtime — é a mesma
 * razão pela qual `src/servicos/som.ts` lista os `.wav` um a um.
 *
 * A chave é o `tipo`, e não o campo `arte`, porque `tipo` é o dado de verdade:
 * `arte` é uma string de rótulo derivada dele (`arteDoTipo`, em
 * `ModalAdicionarVeiculo`), então indexar por ela seria depender de um texto
 * de interface. Assim, um veículo recém-cadastrado já nasce com a imagem certa.
 *
 * BIKE ficou de fora — não veio imagem para ela, e o `Partial` é o que permite
 * essa ausência sem mentir no tipo: o card cai de volta no rótulo de texto do
 * protótipo. Basta acrescentar a linha aqui no dia em que houver a arte.
 */
const ARTE_DO_TIPO: Partial<Record<TipoVeiculo, ImageSourcePropType>> = {
  MOTO: require('../../assets/imagens/moto.png'),
  CARRO: require('../../assets/imagens/carro.png'),
};

/** `padding: 59px 0 110px` — os 110 de baixo abrem espaço para o botão fixo. */
const ESPACO_BOTAO_FIXO = 110;
const ALTURA_BOTAO = 56;

export default function Veiculos() {
  const veiculos = useMotoristaStore((s) => s.veiculos);
  const veiculoAtivo = useMotoristaStore((s) => s.veiculoAtivo);
  const ativarVeiculo = useMotoristaStore((s) => s.ativarVeiculo);
  const adicionarVeiculo = useMotoristaStore((s) => s.adicionarVeiculo);
  const removerVeiculo = useMotoristaStore((s) => s.removerVeiculo);

  const [modalAberto, setModalAberto] = useState(false);
  /** Índice do veículo aguardando confirmação de exclusão; `null` = nenhum. */
  const [paraExcluir, setParaExcluir] = useState<number | null>(null);

  /** Ver o item 2 do cabeçalho: o último veículo não pode ser removido. */
  const podeExcluir = veiculos.length > 1;

  const aoSalvar = (novo: Veiculo) => {
    // `adicionarVeiculo` já acrescenta, ativa o novo e zera as categorias.
    adicionarVeiculo(novo);
    setModalAberto(false);
  };

  const veiculoParaExcluir =
    paraExcluir === null ? null : (veiculos[paraExcluir] ?? null);

  const confirmarExclusao = () => {
    if (paraExcluir !== null) removerVeiculo(paraExcluir);
    setParaExcluir(null);
  };

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      {/* `voltarMapa` — .dc.html linha 1010: esta tela volta ao mapa. */}
      <CabecalhoPush titulo="Veículo" onVoltar={() => voltarDe('veiculos')} />

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {veiculos.map((v, i) => {
          const ativo = i === veiculoAtivo;
          const arte = ARTE_DO_TIPO[v.tipo];
          return (
            /* O envelope existe só para ancorar a lixeira por cima do card
               sem torná-la filha dele — ver item 1 do cabeçalho. */
            <View key={`${v.tipo}-${v.placa}-${i}`} style={estilos.envelope}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: ativo }}
                accessibilityLabel={`${v.modelo}, ${v.placa}${ativo ? ', veículo ativo' : ''}`}
                onPress={() => ativarVeiculo(i)}
                style={({ pressed }) => [
                  estilos.card,
                  // `v.borda` (logic.js 581): amarela no ativo, neutra nos demais.
                  { borderColor: ativo ? cores.amarelo500 : cores.neutro200 },
                  pressed && estilos.cardPressionado,
                ]}
              >
                {/* Chips de tipo e aprovação */}
                <View style={estilos.linhaChips}>
                  <View style={estilos.chipTipo}>
                    <Text style={estilos.textoChipTipo}>{v.tipo}</Text>
                  </View>
                  <View style={estilos.chipAprovado}>
                    <Text style={estilos.textoChipAprovado}>Aprovado</Text>
                  </View>
                </View>

                {/* Modelo/placa + miniatura */}
                <View style={estilos.linhaModelo}>
                  <View style={estilos.blocoModelo}>
                    <Text style={estilos.modelo}>{v.modelo}</Text>
                    <Text style={estilos.placa}>{v.placa}</Text>
                  </View>
                  <View
                    style={[
                      estilos.miniatura,
                      // As artes têm fundo branco; o cinza do placeholder
                      // apareceria como uma moldura em volta delas.
                      arte ? estilos.miniaturaComArte : null,
                    ]}
                  >
                    {arte ? (
                      <Image
                        source={arte}
                        style={estilos.arte}
                        // `contain`: a moto é bem mais larga que alta e o
                        // quadro de 64×52 é quase quadrado — em `cover` ela
                        // sairia com as rodas cortadas, e em `stretch`,
                        // achatada.
                        resizeMode="contain"
                        accessibilityIgnoresInvertColors
                      />
                    ) : (
                      <Text style={estilos.textoMiniatura}>{v.arte}</Text>
                    )}
                  </View>
                </View>

                <View style={estilos.divisor} />

                {/* `v.status`/`v.corStatus`/`v.pesoStatus` — logic.js 583-584 */}
                <Text
                  style={[
                    estilos.status,
                    ativo ? estilos.statusAtivo : estilos.statusInativo,
                  ]}
                >
                  {ativo ? 'Veículo ativo' : 'Tocar para ativar'}
                </Text>
              </Pressable>

              {podeExcluir ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir ${v.modelo}, ${v.placa}`}
                  hitSlop={10}
                  onPress={() => setParaExcluir(i)}
                  style={({ pressed }) => [
                    estilos.botaoLixeira,
                    pressed && estilos.lixeiraPressionada,
                  ]}
                >
                  <Icone nome="lixeira" tamanho={19} cor={cores.neutro400} />
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Botão fixo — `left:16; right:16; bottom:34` no protótipo. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setModalAberto(true)}
        style={({ pressed }) => [
          estilos.botaoAdicionar,
          pressed && estilos.botaoAdicionarPressionado,
        ]}
      >
        <Text style={estilos.textoAdicionar}>Adicionar</Text>
      </Pressable>

      <ModalAdicionarVeiculo
        visivel={modalAberto}
        onFechar={() => setModalAberto(false)}
        onSalvar={aoSalvar}
      />

      <FolhaConfirmar
        visivel={veiculoParaExcluir !== null}
        titulo="Excluir veículo"
        // O modelo e a placa entram no texto porque a folha cobre a lista: sem
        // eles, a pessoa confirmaria sem ver qual card está prestes a sumir.
        mensagem={
          veiculoParaExcluir
            ? `${veiculoParaExcluir.modelo} · ${veiculoParaExcluir.placa} será removido do seu cadastro.`
            : undefined
        }
        rotuloConfirmar="Excluir veículo"
        destrutivo
        onConfirmar={confirmarExclusao}
        onCancelar={() => setParaExcluir(null)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro50,
  },
  // gap:12; padding:4px 16px 0 (+ o respiro do botão fixo)
  conteudo: {
    gap: 12,
    paddingTop: 4,
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: ESPACO_BOTAO_FIXO,
  },

  /** Só posiciona: a lixeira é `absolute` em relação a ele. */
  envelope: {
    position: 'relative',
  },
  /**
   * Alinhada com o padding de 16 do card, na altura da linha de chips. O
   * `hitSlop` de 10 completa o alvo de toque sem alargar o desenho.
   */
  botaoLixeira: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lixeiraPressionada: {
    backgroundColor: cores.neutro100,
  },

  // padding:16; radius:12; background:#FFF; borda 1px
  card: {
    width: '100%',
    padding: espacamento.cardPadding,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
  },
  cardPressionado: {
    opacity: 0.85,
  },

  linhaChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // padding:4px 10px; radius:999; borda #9D9CA1; 12/600; #5D5B61
  chipTipo: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: raioPill,
    borderWidth: 1,
    borderColor: cores.neutro400,
  },
  textoChipTipo: {
    ...tipografia.labelChip,
    color: cores.neutro600,
  },
  // padding:4px 10px; radius:999; background:#E6F9EC; 12/700; #24D279
  chipAprovado: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: raioPill,
    backgroundColor: cores.sucesso100,
  },
  textoChipAprovado: {
    ...tipografia.labelChip,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.sucesso500,
  },

  // margin-top:14; space-between; gap:12
  linhaModelo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
  },
  blocoModelo: {
    flex: 1,
  },
  // font-size:22; font-weight:700; line-height:27
  modelo: {
    fontFamily: familiaInter.bold,
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '700',
    color: cores.neutro900,
  },
  // font-size:13; color:#5D5B61; margin-top:2
  placa: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
    marginTop: 2,
  },
  // 64×52; radius:8 — no protótipo é um listrado a 135° entre
  // `veiculoArteFaixaClara` e `veiculoArteFaixaEscura`. Sem gradiente
  // repetido em RN, fica o tom claro chapado como placeholder até existir
  // foto real do veículo (a faixa escura segue disponível como token).
  miniatura: {
    width: 64,
    height: 52,
    borderRadius: 8,
    backgroundColor: cores.veiculoArteFaixaClara,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniaturaComArte: {
    backgroundColor: cores.neutro0,
    overflow: 'hidden',
  },
  arte: {
    width: '100%',
    height: '100%',
  },
  textoMiniatura: {
    fontSize: 8,
    lineHeight: 11,
    color: cores.neutro400,
    textAlign: 'center',
  },

  // height:1; background:#EFEDF1; margin:14px 0
  divisor: {
    height: 1,
    backgroundColor: cores.neutro100,
    marginVertical: 14,
  },

  status: {
    ...tipografia.corpoSm,
  },
  statusAtivo: {
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.sucesso500,
  },
  statusInativo: {
    color: cores.neutro400,
  },

  botaoAdicionar: {
    position: 'absolute',
    left: espacamento.telaLateral,
    right: espacamento.telaLateral,
    bottom: 34,
    height: ALTURA_BOTAO,
    borderRadius: raioPill,
    backgroundColor: cores.amarelo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAdicionarPressionado: {
    backgroundColor: cores.amarelo600,
  },
  textoAdicionar: {
    ...tipografia.labelBtn,
    color: cores.neutro900,
  },
});
