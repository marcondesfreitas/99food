/**
 * B21 — Tela de Configurações de perfil.
 *
 * Lista de ajustes em duas seções ("INFORMAÇÕES PESSOAIS" e "GERENCIAMENTO DE
 * PERFIL"), cada uma com faixa de cabeçalho e linhas de 64px com chevron.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaConfig`
 * (linhas 931-970) e `.design-import/logic.js`: `camposPessoais` (linha 567),
 * `avatarBg`/`avatarMini` (linhas 546-547).
 *
 * NOTA DE TÍTULO: o header desta tela diz **"Perfil"** no protótipo, não
 * "Configurações" — o nome do bloco no plano é B21 "Configurações de perfil",
 * mas a string visível segue o protótipo, que é a fonte de verdade.
 *
 * O header tem TRÊS elementos: `‹` à esquerda (volta ao Perfil), título
 * centralizado e um `✕` à direita que fecha a pilha inteira e volta ao mapa
 * (`voltarMapa`, logic.js linha 934) — não é o mesmo destino do `‹`.
 *
 * Dados pessoais vêm sempre de `motoristaStore`; nada é hardcodado (os do
 * protótipo eram de uma pessoa real do vídeo original, DESIGN_SYSTEM §2.9).
 *
 * ## O que foi ALÉM do protótipo: os campos passaram a ser editáveis
 *
 * Em `.dc.html` estas linhas são uma vitrine — têm o `‹` desenhado e nenhum
 * `onClick`; "Cidade" é a string `'São Paulo'` cravada no template e não
 * existe linha de nome. Aqui cada linha de "INFORMAÇÕES PESSOAIS" abre
 * `FolhaEditarCampo`, com validação por campo (`src/servicos/campoConta.ts`) e
 * gravação em disco (B28) — inclusive o **Nome**, que é uma linha nova: é ele
 * que faz o app deixar de ser de uma pessoa só. Trocá-lo aqui muda de uma vez
 * o nome do Perfil (B20), as iniciais do avatar e o cabeçalho do menu lateral
 * (B24), porque todos já liam `contaNome` da store.
 *
 * As duas linhas de "GERENCIAMENTO DE PERFIL" continuam inertes de propósito:
 * "Documentos pendentes" e "Gestão de dispositivo" não são campos, são portas
 * para fluxos que não existem nem no protótipo nem aqui.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { CabecalhoPush } from '@/components/ui/CabecalhoPush';
import { FolhaEditarCampo } from '@/components/ui/FolhaEditarCampo';
import { FotoPerfil, iniciaisDe } from '@/components/ui/FotoPerfil';
import { Icone, type NomeIcone } from '@/components/ui/Icones';
import {
  CAMPOS_CONTA,
  MASCARA_SENHA,
  ORDEM_CAMPOS,
  type CampoConta,
} from '@/servicos/campoConta';
import { useMotoristaStore } from '@/state/motoristaStore';
import { voltarDe, voltarMapa } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioPill } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

/** O desenho que vai no quadrado de 32px de cada campo pessoal. */
const ICONE_DO_CAMPO: Record<CampoConta, NomeIcone> = {
  nome: 'usuario',
  tel: 'telefone',
  email: 'envelope',
  cidade: 'local',
  senha: 'cadeado',
};

const ALTURA_FAIXA_SECAO = 36;
const ALTURA_LINHA = 64;
const TAMANHO_ICONE = 32;

/** Chevron `›`: quadrado de 7px com duas bordas, girado -45°. */
function Chevron() {
  return <View style={estilos.chevron} />;
}

/**
 * `dd/mm/aaaa` a partir do ISO gravado em `senhaAtualizadaEm`.
 *
 * Escrito à mão em vez de `toLocaleDateString('pt-BR')` porque o suporte a
 * `Intl` no Hermes varia com a build do app, e uma data que às vezes sai no
 * formato americano seria pior do que não mostrar data nenhuma.
 */
function dataCurta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getFullYear()}`;
}

function FaixaSecao({ titulo }: { titulo: string }) {
  return (
    <View style={estilos.faixaSecao}>
      <Text style={estilos.textoFaixaSecao}>{titulo}</Text>
    </View>
  );
}

type LinhaProps = {
  nome: string;
  valor?: string;
  onPress?: () => void;
  comBorda?: boolean;
  /** Desenho dentro do quadrado de 32px da esquerda. */
  nomeIcone?: NomeIcone;
  /** Conteúdo à esquerda inteiro; sobrepõe `nomeIcone` (usado pelo avatar). */
  icone?: React.ReactNode;
};

function Linha({
  nome,
  valor,
  onPress,
  comBorda = true,
  nomeIcone,
  icone,
}: LinhaProps) {
  const conteudo = (
    <>
      {/* O quadrado de 32 é do protótipo; no `.dc.html` ele fica vazio. */}
      {icone ?? (
        <View style={estilos.iconePlaceholder}>
          {nomeIcone ? (
            <Icone nome={nomeIcone} tamanho={18} cor={cores.neutro600} />
          ) : null}
        </View>
      )}
      <View style={estilos.textoLinha}>
        <Text style={estilos.nomeLinha}>{nome}</Text>
        {valor ? <Text style={estilos.valorLinha}>{valor}</Text> : null}
      </View>
      <Chevron />
    </>
  );

  if (!onPress) {
    return (
      <View style={[estilos.linha, comBorda && estilos.linhaComBorda]}>
        {conteudo}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        estilos.linha,
        comBorda && estilos.linhaComBorda,
        pressed && estilos.linhaPressionada,
      ]}
    >
      {conteudo}
    </Pressable>
  );
}

export default function Config() {
  const contaNome = useMotoristaStore((s) => s.contaNome);
  const contaEmail = useMotoristaStore((s) => s.contaEmail);
  const contaTel = useMotoristaStore((s) => s.contaTel);
  const contaCidade = useMotoristaStore((s) => s.contaCidade);
  const senhaAtualizadaEm = useMotoristaStore((s) => s.senhaAtualizadaEm);
  const foto = useMotoristaStore((s) => s.foto);
  const fotoUri = useMotoristaStore((s) => s.fotoUri);

  /** Campo aberto na folha de edição; `null` = folha fechada. */
  const [emEdicao, setEmEdicao] = useState<CampoConta | null>(null);

  const temFoto = foto === 'ok';

  /** `avatarMini` (logic.js 547): iniciais quando não há foto. */
  const iniciais = useMemo(() => iniciaisDe(contaNome), [contaNome]);

  /**
   * O valor guardado de cada campo. A senha não tem valor a exibir: mostra a
   * máscara enquanto nunca foi trocada e, depois disso, a data da troca — que
   * é também o único retorno visível de que o "Salvar" funcionou, já que o
   * conteúdo em si não pode aparecer.
   */
  const valorDoCampo: Record<CampoConta, string> = {
    nome: contaNome,
    tel: contaTel,
    email: contaEmail,
    cidade: contaCidade,
    senha: senhaAtualizadaEm
      ? `Alterada em ${dataCurta(senhaAtualizadaEm)}`
      : MASCARA_SENHA,
  };

  /** `camposPessoais` — logic.js linha 567, agora com "Nome" e editáveis. */
  const camposPessoais = ORDEM_CAMPOS.map((campo) => ({
    campo,
    nome: CAMPOS_CONTA[campo].rotulo,
    valor: valorDoCampo[campo],
  }));

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      <CabecalhoPush
        titulo="Perfil"
        centralizado
        fundo={cores.neutro0}
        // `irPerfil` — `voltarPush` manda `config` → `perfil` (logic.js 283).
        onVoltar={() => voltarDe('config')}
        direita={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar"
            // O `✕` do protótipo é `voltarMapa` (`.dc.html` linha 936) — fecha
            // a pilha inteira, não volta um nível.
            onPress={voltarMapa}
            hitSlop={12}
            style={({ pressed }) => [pressed && estilos.linhaPressionada]}
          >
            <Text style={estilos.fechar}>✕</Text>
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={estilos.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <FaixaSecao titulo="INFORMAÇÕES PESSOAIS" />

        <View style={estilos.grupo}>
          <Linha
            nome="Foto de perfil"
            // B20 é dona da folha de opções de foto; aqui o toque leva ao
            // Perfil, onde ela vive — mesmo destino do `‹`.
            onPress={() => voltarDe('config')}
            icone={
              <View
                style={[
                  estilos.avatarMini,
                  { backgroundColor: temFoto ? cores.neutro200 : cores.sheetFundo },
                ]}
              >
                <FotoPerfil
                  uri={fotoUri}
                  temFoto={temFoto}
                  iniciais={iniciais}
                  estiloIniciais={estilos.avatarMiniTexto}
                />
              </View>
            }
          />

          {camposPessoais.map((item, i) => (
            <Linha
              key={item.campo}
              nome={item.nome}
              valor={item.valor}
              nomeIcone={ICONE_DO_CAMPO[item.campo]}
              onPress={() => setEmEdicao(item.campo)}
              comBorda={i < camposPessoais.length - 1}
            />
          ))}
        </View>

        <FaixaSecao titulo="GERENCIAMENTO DE PERFIL" />

        <View style={[estilos.grupo, estilos.ultimoGrupo]}>
          <Linha nome="Documentos pendentes" nomeIcone="documento" />
          <Linha nome="Gestão de dispositivo" nomeIcone="dispositivo" comBorda={false} />
        </View>
      </ScrollView>

      <FolhaEditarCampo
        campo={emEdicao}
        // A senha não tem valor para pré-preencher; a folha ignora este texto
        // quando o campo é secreto.
        valorAtual={emEdicao ? valorDoCampo[emEdicao] : ''}
        onFechar={() => setEmEdicao(null)}
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
    paddingBottom: 28,
  },

  // font-size:16; font-weight:700; à direita
  fechar: {
    fontFamily: familiaInter.bold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: cores.neutro900,
    textAlign: 'right',
  },

  // height:36; background:#EFEFF1; 12/700; letter-spacing:.06em; #9D9CA1
  faixaSecao: {
    height: ALTURA_FAIXA_SECAO,
    backgroundColor: cores.neutro100,
    justifyContent: 'center',
    paddingHorizontal: espacamento.telaLateral,
  },
  textoFaixaSecao: {
    fontFamily: familiaInter.bold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.72,
    color: cores.neutro400,
  },

  grupo: {
    backgroundColor: cores.neutro0,
  },
  ultimoGrupo: {
    marginBottom: 28,
  },

  // height:64; padding:0 16; gap:12; border-bottom 1px #EFEDF1
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ALTURA_LINHA,
    paddingHorizontal: espacamento.telaLateral,
  },
  linhaComBorda: {
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro100,
  },
  linhaPressionada: {
    opacity: 0.6,
  },
  // 32×32 radius 8, fundo `neutroCampo` — placeholder de ícone do protótipo.
  iconePlaceholder: {
    width: TAMANHO_ICONE,
    height: TAMANHO_ICONE,
    borderRadius: 8,
    backgroundColor: cores.neutroCampo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMini: {
    width: TAMANHO_ICONE,
    height: TAMANHO_ICONE,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
    // Recorta a foto no círculo — sem isto o <Image> absoluto vaza no Android.
    overflow: 'hidden',
  },
  avatarMiniTexto: {
    fontFamily: familiaInter.bold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: cores.neutro0,
  },
  textoLinha: {
    flex: 1,
  },
  // font-size:17
  nomeLinha: {
    ...tipografia.corpoLg,
    fontFamily: familiaInter.regular,
    fontWeight: '400',
    color: cores.neutro900,
  },
  // font-size:13; color:#5D5B61
  valorLinha: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
  },
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: cores.neutro400,
    transform: [{ rotate: '-45deg' }],
  },
});
