/**
 * B20 — Tela de Perfil.
 *
 * Avatar com foto de perfil (tocável, abre a folha de opções), nome, botão
 * "Ver perfil público", dois cards de métrica e o card de avaliação com a
 * distribuição de notas.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaPerfil`
 * (linhas 878-929) e a folha de foto `sheetFoto` (linhas 1065-1080).
 * `.design-import/logic.js`: `avatarBg`/`avatarConteudo`/`avatarOpacidade`
 * (linhas 546-548), `abrirSheetFoto`/`tirarFoto`/`removerFoto` (550-553),
 * `distribuicao` (linha 566).
 *
 * O `sheetFoto` é estado de UI local (`useState`), não da store — foi uma
 * decisão deliberada de B03: a store guarda o *status* da foto
 * (`ok`/`vazio`/`enviando`), a visibilidade da folha é da tela.
 *
 * MARCA: o protótipo estampa o nome de uma pessoa real do vídeo original
 * (DESIGN_SYSTEM.md §2.9). Aqui o nome vem sempre de `motoristaStore.contaNome`,
 * que já foi trocado por um fictício genérico. Nada é hardcodado.
 */

import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { CabecalhoPush } from '@/components/ui/CabecalhoPush';
import {
  DistribuicaoEstrelas,
  IconeEstrela,
  type ContagensPorEstrela,
} from '@/components/ui/Estrelas';
import { FolhaFotoPerfil } from '@/components/ui/FolhaFotoPerfil';
import { Icone } from '@/components/ui/Icones';
import { FotoPerfil, iniciaisDe } from '@/components/ui/FotoPerfil';
import { useMotoristaStore } from '@/state/motoristaStore';
import { irConfig, voltarDe } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill } from '@/tema/espacamento';
import { familiaInter, numeroTabular, tipografia } from '@/tema/tipografia';

/**
 * Contagens por estrela, indexadas de 1★ a 5★. O `DistribuicaoEstrelas` (B05)
 * calcula a proporção sozinho a partir delas.
 *
 * DESVIO DELIBERADO do protótipo, a pedido: `logic.js` linha 566 traz
 * `[[5,92,94],[4,6,6],[3,2,2],[2,0,0],[1,0,0]]` — 100 avaliações distribuídas.
 * Aqui a conta é zerada: a tela passa a mostrar uma pessoa recém-cadastrada,
 * sem nenhuma avaliação recebida ainda. `DistribuicaoEstrelas` já trata o
 * total zero (divide por `maior` só quando `maior > 0`), então as cinco barras
 * ficam vazias em vez de quebrar.
 */
const CONTAGENS: ContagensPorEstrela = [0, 0, 0, 0, 0];

/**
 * Nota exibida no título do card. Também desvio deliberado: o protótipo fixa
 * `4.92`; a pedido, uma conta sem avaliações entra com a nota cheia.
 */
const NOTA_MEDIA = '5.00';

const TAMANHO_AVATAR = 96;
const TAMANHO_BADGE_CAMERA = 32;

export default function Perfil() {
  const contaNome = useMotoristaStore((s) => s.contaNome);
  const foto = useMotoristaStore((s) => s.foto);
  const fotoUri = useMotoristaStore((s) => s.fotoUri);
  const historico = useMotoristaStore((s) => s.historico);

  const [folhaAberta, setFolhaAberta] = useState(false);

  // `temFoto`/`fotoEnviando` — logic.js linhas 546-548.
  const temFoto = foto === 'ok';
  const enviando = foto === 'enviando';

  /** `avatarConteudo` (linha 547): iniciais quando não há foto. */
  const iniciais = useMemo(() => iniciaisDe(contaNome), [contaNome]);

  /** `totalCorridas` — logic.js linha 560. */
  const totalCorridas = historico.length;

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      {/* Header sem título: só o ‹ e o ícone de configurações. */}
      <CabecalhoPush
        onVoltar={() => voltarDe('perfil')}
        direita={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Configurações de perfil"
            // B25: `irConfig` (logic.js 632) empurra a tela de Config (B21).
            onPress={irConfig}
            hitSlop={12}
            style={({ pressed }) => [
              estilos.botaoConfig,
              pressed && estilos.pressionado,
            ]}
          >
            {/* Era um círculo de 24 com um miolo de 8, também de borda — o
                jeito do protótipo de sugerir uma engrenagem sem desenhar uma. */}
            <Icone nome="engrenagem" tamanho={24} traco={1.6} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Avatar + nome + "Ver perfil público" ---- */}
        <View style={estilos.blocoAvatar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alterar foto de perfil"
            onPress={() => setFolhaAberta(true)}
            style={({ pressed }) => [
              estilos.areaAvatar,
              pressed && estilos.avatarPressionado,
            ]}
          >
            <View
              style={[
                estilos.avatar,
                // `avatarBg` (linha 546): listrado quando há foto, `sheetFundo`
                // quando não. O listrado é um placeholder do protótipo — aqui
                // fica um tom chapado, e some assim que existe foto de verdade.
                { backgroundColor: temFoto ? cores.neutro200 : cores.sheetFundo },
                // `avatarOpacidade` (linha 548).
                enviando && estilos.avatarEnviando,
              ]}
            >
              <FotoPerfil
                uri={fotoUri}
                temFoto={temFoto}
                iniciais={iniciais}
                estiloIniciais={estilos.iniciais}
              />
            </View>

            {/* Anel de "enviando" — no protótipo é um spinner (`animation: spin`).
                Aqui fica um anel estático com o topo destacado; a animação de
                rotação não agrega no 1,4s do upload simulado. */}
            {enviando ? <View style={estilos.anelEnviando} /> : null}

            <View style={estilos.badgeCamera}>
              <View style={estilos.iconeCamera} />
            </View>
          </Pressable>

          <Text style={estilos.nome}>{contaNome.toUpperCase()}</Text>

          <Pressable
            accessibilityRole="button"
            // Sem destino: o `<button>` de "Ver perfil público" no protótipo
            // não tem `onClick` e não existe tela de perfil público. Inerte de
            // propósito — inventar um destino seria fugir da fonte.
            onPress={() => {}}
            style={({ pressed }) => [
              estilos.botaoPerfilPublico,
              pressed && estilos.pressionado,
            ]}
          >
            <Text style={estilos.textoPerfilPublico}>Ver perfil público</Text>
          </Pressable>
        </View>

        {/* ---- Dois cards de métrica ---- */}
        <View style={estilos.linhaMetricas}>
          <View style={estilos.cardMetrica}>
            <Text style={estilos.metricaValor}>{totalCorridas}</Text>
            <Text style={estilos.metricaRotulo}>Corridas hoje</Text>
          </View>
          <View style={estilos.cardMetrica}>
            <Text style={estilos.metricaValor}>1</Text>
            <Text style={estilos.metricaRotulo}>Dia</Text>
          </View>
        </View>

        {/* ---- Card de avaliação ---- */}
        <View style={estilos.cardAvaliacao}>
          <View style={estilos.linhaTituloAvaliacao}>
            <View style={estilos.tituloComEstrela}>
              <Text style={estilos.tituloAvaliacao}>Avaliação {NOTA_MEDIA} </Text>
              <IconeEstrela tamanho={18} cor={cores.amarelo500} />
            </View>
            <Text style={estilos.comoFunciona}>Como funciona ›</Text>
          </View>

          <Text style={estilos.legendaAvaliacao}>
            Média das 100 últimas avaliações de corridas
          </Text>

          <DistribuicaoEstrelas
            contagens={CONTAGENS}
            estilo={estilos.distribuicao}
          />
        </View>
      </ScrollView>

      {/* Folha de opções da foto (`sheetFoto`, .dc.html linhas 1065-1080).
          Vive em `@/components/ui/FolhaFotoPerfil` porque a tela de Editar
          conta abre a mesma folha, como no protótipo. */}
      <FolhaFotoPerfil
        visivel={folhaAberta}
        onFechar={() => setFolhaAberta(false)}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro50,
  },
  conteudo: {
    paddingBottom: 24,
  },
  pressionado: {
    opacity: 0.6,
  },

  // A área tocável mantém os 24×24 do protótipo; o desenho agora é o ícone.
  botaoConfig: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // padding: 12px 16px 20px; gap: 10; centralizado
  blocoAvatar: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 20,
  },
  areaAvatar: {
    width: TAMANHO_AVATAR,
    height: TAMANHO_AVATAR,
  },
  avatarPressionado: {
    transform: [{ scale: 0.97 }],
  },
  avatar: {
    ...StyleSheet.absoluteFill,
    borderRadius: raioPill,
    borderWidth: 3,
    borderColor: cores.neutro0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarEnviando: {
    opacity: 0.5,
  },
  iniciais: {
    fontFamily: familiaInter.bold,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: cores.neutro0,
  },
  // `inset: -5px` no protótipo.
  anelEnviando: {
    position: 'absolute',
    left: -5,
    right: -5,
    top: -5,
    bottom: -5,
    borderRadius: raioPill,
    borderWidth: 3,
    borderColor: cores.neutro100,
    borderTopColor: cores.info500,
  },
  // 32×32 amarelo no canto inferior direito, com borda branca.
  badgeCamera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: TAMANHO_BADGE_CAMERA,
    height: TAMANHO_BADGE_CAMERA,
    borderRadius: raioPill,
    backgroundColor: cores.amarelo500,
    borderWidth: 2,
    borderColor: cores.neutro0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeCamera: {
    width: 15,
    height: 12,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: cores.neutro900,
  },

  // font-size:22; font-weight:700; letter-spacing:.01em
  nome: {
    ...tipografia.tituloLg,
    color: cores.neutro900,
    letterSpacing: 0.22,
    textAlign: 'center',
  },
  // padding:9px 18px; radius:999; borda #DCDAE0; fundo branco
  botaoPerfilPublico: {
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: raioPill,
    borderWidth: 1,
    borderColor: cores.neutro200,
    backgroundColor: cores.neutro0,
  },
  textoPerfilPublico: {
    ...tipografia.corpoSm,
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.neutro900,
  },

  // gap:12; padding:0 16
  linhaMetricas: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: espacamento.telaLateral,
  },
  cardMetrica: {
    flex: 1,
    padding: 14,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
  },
  metricaValor: {
    ...tipografia.tituloLg,
    color: cores.neutro900,
    ...numeroTabular,
  },
  metricaRotulo: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },

  // margin:16 16 24; padding:16 14; radius:12; borda #DCDAE0
  cardAvaliacao: {
    marginTop: espacamento.telaLateral,
    marginHorizontal: espacamento.telaLateral,
    marginBottom: 24,
    paddingVertical: espacamento.cardPadding,
    paddingHorizontal: 14,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
  },
  linhaTituloAvaliacao: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  tituloComEstrela: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tituloAvaliacao: {
    ...tipografia.tituloLg,
    color: cores.neutro900,
  },
  comoFunciona: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  legendaAvaliacao: {
    ...tipografia.corpoSm,
    color: cores.neutro400,
    marginTop: 4,
  },
  distribuicao: {
    marginTop: espacamento.telaLateral,
  },

});
