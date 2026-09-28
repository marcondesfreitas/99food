/**
 * B22 — Tela de Editar conta.
 *
 * Avatar tocável, três campos (nome do perfil, e-mail, telefone) e um botão
 * que troca de rótulo depois de salvar.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaConta`
 * (linhas 972-1005) e `.design-import/logic.js`: `salvarConta` (linha 578),
 * `rotuloSalvarConta` (linha 577), `avatarBg`/`avatarConteudo` (546-547).
 *
 * NOTA DE TÍTULO: o header desta tela diz **"Horas Dirigidas"** no protótipo
 * (linha 975) — que é também o nome do item do drawer que leva até ela. O
 * bloco se chama "Editar conta" no plano, mas a string visível segue o
 * protótipo, que é a fonte de verdade.
 *
 * A validação/gravação mora em `motoristaStore.salvarConta`; aqui só há o
 * rascunho local dos campos. Os dados pessoais do protótipo eram de uma pessoa
 * real do vídeo original (DESIGN_SYSTEM §2.9) — nada é hardcodado, tudo vem
 * da store, que já usa fictícios genéricos.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { CabecalhoPush } from '@/components/ui/CabecalhoPush';
import { FolhaFotoPerfil } from '@/components/ui/FolhaFotoPerfil';
import { FotoPerfil, iniciaisDe } from '@/components/ui/FotoPerfil';
import { useMotoristaStore } from '@/state/motoristaStore';
import { voltarDe } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

const TAMANHO_AVATAR = 88;
const ALTURA_INPUT = 52;
const ALTURA_BOTAO = 56;

export default function Conta() {
  const contaNome = useMotoristaStore((s) => s.contaNome);
  const contaEmail = useMotoristaStore((s) => s.contaEmail);
  const contaTel = useMotoristaStore((s) => s.contaTel);
  const contaSalvo = useMotoristaStore((s) => s.contaSalvo);
  const foto = useMotoristaStore((s) => s.foto);
  const fotoUri = useMotoristaStore((s) => s.fotoUri);
  const salvarConta = useMotoristaStore((s) => s.salvarConta);

  // Rascunho local: a store guarda o que foi confirmado; o que está sendo
  // digitado fica aqui até o toque em "Salvar Alterações".
  const [nome, setNome] = useState(contaNome);
  const [email, setEmail] = useState(contaEmail);
  const [tel, setTel] = useState(contaTel);
  const [folhaAberta, setFolhaAberta] = useState(false);

  const refEmail = useRef<TextInput>(null);
  const refTel = useRef<TextInput>(null);

  const temFoto = foto === 'ok';

  /**
   * `avatarConteudo` (logic.js 547): iniciais quando não há foto. Derivadas do
   * campo `nome` em edição, e não de `contaNome`, para as iniciais
   * acompanharem o que está sendo digitado antes de salvar.
   */
  const iniciais = useMemo(() => iniciaisDe(nome), [nome]);

  /**
   * `rotuloSalvarConta` — logic.js linha 577. O protótipo troca o rótulo e
   * nunca volta atrás; aqui o "✓" some assim que o motorista edita de novo,
   * senão o botão mentiria sobre haver alterações pendentes.
   */
  const alterado =
    nome !== contaNome || email !== contaEmail || tel !== contaTel;
  const rotuloBotao =
    contaSalvo && !alterado ? 'Alterações salvas ✓' : 'Salvar Alterações';

  // Se a store mudar por fora (ex.: outra tela), o rascunho acompanha.
  useEffect(() => {
    setNome(contaNome);
    setEmail(contaEmail);
    setTel(contaTel);
  }, [contaNome, contaEmail, contaTel]);

  const salvar = () => {
    salvarConta({ nome, email, tel });
  };

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={estilos.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* `voltarMapa` — .dc.html linha 975: esta tela volta ao mapa. */}
        <CabecalhoPush titulo="Horas Dirigidas" onVoltar={() => voltarDe('conta')} />

        <ScrollView
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Card do avatar ---- */}
          <View style={estilos.cardAvatar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Alterar foto de perfil"
              // `abrirSheetFoto` — .dc.html linha 994. Esta tela abre a mesma
              // folha do Perfil, como no protótipo; antes ela só empurrava
              // para o Perfil, o que contradizia a própria dica logo abaixo
              // ("Toque no ícone para mudar a foto").
              onPress={() => setFolhaAberta(true)}
              style={({ pressed }) => [
                estilos.areaAvatar,
                pressed && estilos.avatarPressionado,
              ]}
            >
              <View
                style={[
                  estilos.avatar,
                  { backgroundColor: temFoto ? cores.neutro200 : cores.sheetFundo },
                ]}
              >
                <FotoPerfil
                  uri={fotoUri}
                  temFoto={temFoto}
                  iniciais={iniciais}
                  estiloIniciais={estilos.iniciais}
                />
              </View>

              <View style={estilos.badgeCamera}>
                <View style={estilos.iconeCamera} />
              </View>
            </Pressable>

            <Text style={estilos.dicaFoto}>
              Toque no ícone para mudar a foto
            </Text>
          </View>

          {/* ---- Card dos campos ---- */}
          <View style={estilos.cardCampos}>
            <View>
              <Text style={estilos.rotuloCampo}>Nome do Perfil</Text>
              <TextInput
                value={nome}
                onChangeText={setNome}
                style={estilos.input}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                onSubmitEditing={() => refEmail.current?.focus()}
              />
            </View>

            <View>
              <Text style={estilos.rotuloCampo}>E-mail</Text>
              <TextInput
                ref={refEmail}
                value={email}
                onChangeText={setEmail}
                style={estilos.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => refTel.current?.focus()}
              />
            </View>

            <View>
              <Text style={estilos.rotuloCampo}>Número de Telefone</Text>
              <TextInput
                ref={refTel}
                value={tel}
                onChangeText={setTel}
                style={estilos.input}
                keyboardType="phone-pad"
                autoComplete="tel"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* ---- Botão salvar ---- */}
          <View style={estilos.areaBotao}>
            <Pressable
              accessibilityRole="button"
              onPress={salvar}
              style={({ pressed }) => [
                estilos.botaoSalvar,
                pressed && estilos.botaoSalvarPressionado,
              ]}
            >
              <Text style={estilos.textoBotaoSalvar}>{rotuloBotao}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* A mesma folha do Perfil (`abrirSheetFoto`, .dc.html linha 994). */}
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
    paddingBottom: 30,
  },

  // margin:12 16 0; padding:24; radius:12; borda #DCDAE0; gap:10
  cardAvatar: {
    marginTop: 12,
    marginHorizontal: espacamento.telaLateral,
    padding: 24,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
    alignItems: 'center',
    gap: 10,
  },
  areaAvatar: {
    width: TAMANHO_AVATAR,
    height: TAMANHO_AVATAR,
  },
  avatarPressionado: {
    transform: [{ scale: 0.97 }],
  },
  // borda de 3px AMARELA nesta tela (na de Perfil é branca).
  avatar: {
    ...StyleSheet.absoluteFill,
    borderRadius: raioPill,
    borderWidth: 3,
    borderColor: cores.amarelo500,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iniciais: {
    fontFamily: familiaInter.bold,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: cores.neutro0,
  },
  // 30×30 PRETO aqui (na de Perfil é amarelo), com borda branca.
  badgeCamera: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: raioPill,
    backgroundColor: cores.neutro900,
    borderWidth: 2,
    borderColor: cores.neutro0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeCamera: {
    width: 14,
    height: 11,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: cores.neutro0,
  },
  dicaFoto: {
    ...tipografia.corpoMd,
    color: cores.neutro600,
    textAlign: 'center',
  },

  // margin:12 16 0; padding:16; radius:12; gap:14
  cardCampos: {
    marginTop: 12,
    marginHorizontal: espacamento.telaLateral,
    padding: espacamento.cardPadding,
    borderRadius: raioCard,
    backgroundColor: cores.neutro0,
    borderWidth: 1,
    borderColor: cores.neutro200,
    gap: 14,
  },
  // font-size:13; font-weight:700
  rotuloCampo: {
    ...tipografia.corpoSm,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
  },
  // height:52; margin-top:6; padding:0 12; radius:12; borda #DCDAE0; 16px
  input: {
    height: ALTURA_INPUT,
    marginTop: 6,
    paddingHorizontal: 12,
    borderRadius: raioCard,
    borderWidth: 1,
    borderColor: cores.neutro200,
    fontFamily: familiaInter.regular,
    fontSize: 16,
    color: cores.neutro900,
    backgroundColor: cores.neutro0,
  },

  // padding:16 16 30
  areaBotao: {
    padding: espacamento.telaLateral,
    paddingBottom: 30,
  },
  botaoSalvar: {
    width: '100%',
    height: ALTURA_BOTAO,
    borderRadius: raioPill,
    backgroundColor: cores.amarelo500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoSalvarPressionado: {
    backgroundColor: cores.amarelo600,
  },
  textoBotaoSalvar: {
    ...tipografia.labelBtn,
    color: cores.neutro900,
  },
});
