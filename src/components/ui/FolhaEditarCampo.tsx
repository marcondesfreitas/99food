/**
 * FolhaEditarCampo — a folha que edita um campo pessoal da tela de
 * Perfil › Configurações (B21).
 *
 * Funcionalidade **nova**: no protótipo as linhas de `camposPessoais` não têm
 * `onClick` (`.design-import/RotaFacil Motorista v6.dc.html`, bloco
 * `telaConfig`) — o `‹` é decorativo e nada é editável.
 *
 * A escolha de folha (e não de uma tela empurrada por campo) segue o que o
 * app já faz com a foto de perfil em `FolhaFotoPerfil`: mesma moldura, mesmo
 * overlay, mesmo "Cancelar" separado embaixo. Um campo por vez, com o valor
 * atual já preenchido e selecionável — que é como os apps de verdade tratam
 * uma lista de dados cadastrais.
 *
 * Regras de cada campo (rótulo, teclado, validação, normalização) vêm de
 * `src/servicos/campoConta.ts`; esta folha não sabe o que é um e-mail válido,
 * só desenha o que aquele módulo manda.
 *
 * Estado: o rascunho é local (`useState`), como no resto do app — a store só
 * recebe o valor no toque em "Salvar". Fechar sem salvar descarta.
 */

import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Botao } from '@/components/ui/Botao';
import { CAMPOS_CONTA, type CampoConta } from '@/servicos/campoConta';
import { useMotoristaStore } from '@/state/motoristaStore';
import { cores } from '@/tema/cores';
import { espacamento, raioCard } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

const ALTURA_INPUT = 52;

export type FolhaEditarCampoProps = {
  /** Campo em edição. `null` fecha a folha. */
  campo: CampoConta | null;
  /** Valor atual guardado na store; ignorado quando o campo é secreto. */
  valorAtual: string;
  onFechar: () => void;
};

export function FolhaEditarCampo({
  campo,
  valorAtual,
  onFechar,
}: FolhaEditarCampoProps) {
  const salvarCampoConta = useMotoristaStore((s) => s.salvarCampoConta);
  const registrarTrocaDeSenha = useMotoristaStore((s) => s.registrarTrocaDeSenha);

  const [texto, setTexto] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  /**
   * O erro só aparece **depois** da primeira tentativa de salvar. Validar a
   * cada tecla acusaria "E-mail inválido" já na primeira letra digitada, o que
   * é ruído, não ajuda.
   */
  const [tentouSalvar, setTentouSalvar] = useState(false);

  const refConfirmacao = useRef<TextInput>(null);

  const espec = campo ? CAMPOS_CONTA[campo] : null;

  /**
   * Reabrir a folha recomeça do valor guardado. A dependência é `campo`, e não
   * `valorAtual`: se a store mudar enquanto a folha está aberta (não acontece
   * hoje, mas é barato garantir), o que a pessoa está digitando não é
   * atropelado no meio da frase.
   */
  useEffect(() => {
    if (!campo) return;
    setTexto(CAMPOS_CONTA[campo].segredo ? '' : valorAtual);
    setConfirmacao('');
    setTentouSalvar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campo]);

  if (!campo || !espec) return null;

  const erroValor = espec.validar(texto);
  /** Confirmação divergente é erro do segundo campo, não do primeiro. */
  const erroConfirmacao =
    espec.confirmacao && texto !== confirmacao ? 'As senhas não coincidem.' : null;
  const podeSalvar = !erroValor && !erroConfirmacao;

  const salvar = () => {
    setTentouSalvar(true);
    if (!podeSalvar) return;

    // Comparação com o literal, e não `espec.segredo`: é ela que faz o
    // TypeScript estreitar `campo` para `CampoTextoConta` no `else` — a flag
    // do objeto ele não consegue ligar de volta ao tipo do campo.
    if (campo === 'senha') {
      // A senha digitada não vai para lugar nenhum: a store só anota que a
      // troca aconteceu (ver `motoristaStore.senhaAtualizadaEm`).
      registrarTrocaDeSenha();
    } else {
      salvarCampoConta(campo, espec.normalizar(texto));
    }
    onFechar();
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={onFechar}
      // Sem isto o teclado do Android cobre a folha inteira quando ela sobe.
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        style={estilos.overlay}
        onPress={onFechar}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={estilos.ancora}
        pointerEvents="box-none"
      >
        <View style={estilos.folha}>
          <View style={estilos.grupo}>
            <View style={estilos.cabecalho}>
              <Text style={estilos.titulo}>{espec.rotulo}</Text>
              <Text style={estilos.ajuda}>{espec.ajuda}</Text>
            </View>

            <View style={estilos.corpo}>
              <TextInput
                value={texto}
                onChangeText={setTexto}
                style={[
                  estilos.input,
                  tentouSalvar && erroValor ? estilos.inputComErro : null,
                ]}
                placeholder={espec.placeholder}
                placeholderTextColor={cores.neutro400}
                keyboardType={espec.keyboardType}
                autoCapitalize={espec.autoCapitalize}
                autoComplete={espec.autoComplete}
                maxLength={espec.maxLength}
                secureTextEntry={espec.segredo}
                autoFocus
                // Campo comum: o valor já vem preenchido e selecionado, então
                // digitar substitui e não emenda no fim do que já estava lá.
                selectTextOnFocus={!espec.segredo}
                returnKeyType={espec.confirmacao ? 'next' : 'done'}
                onSubmitEditing={() =>
                  espec.confirmacao ? refConfirmacao.current?.focus() : salvar()
                }
              />

              {tentouSalvar && erroValor ? (
                <Text style={estilos.erro}>{erroValor}</Text>
              ) : null}

              {espec.confirmacao ? (
                <>
                  <Text style={estilos.rotuloConfirmacao}>{espec.confirmacao}</Text>
                  <TextInput
                    ref={refConfirmacao}
                    value={confirmacao}
                    onChangeText={setConfirmacao}
                    style={[
                      estilos.input,
                      tentouSalvar && erroConfirmacao ? estilos.inputComErro : null,
                    ]}
                    placeholder={espec.confirmacao}
                    placeholderTextColor={cores.neutro400}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    maxLength={espec.maxLength}
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={salvar}
                  />
                  {tentouSalvar && erroConfirmacao ? (
                    <Text style={estilos.erro}>{erroConfirmacao}</Text>
                  ) : null}
                </>
              ) : null}

              <Botao
                rotulo="Salvar"
                onPress={salvar}
                // Cinza enquanto inválido, como o "Continuar" da tela de Pix
                // (B19) — o toque ainda passa e revela a mensagem de erro, em
                // vez de deixar a pessoa sem saber o que falta.
                variante={podeSalvar ? 'primario' : 'contorno'}
                estilo={estilos.botaoSalvar}
              />
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onFechar}
            style={({ pressed }) => [
              estilos.botaoCancelar,
              pressed && estilos.cancelarPressionado,
            ]}
          >
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: cores.overlayFolhaFoto,
  },
  /**
   * O `KeyboardAvoidingView` precisa ocupar a tela inteira para medir o
   * teclado; `justifyContent: flex-end` é o que mantém a folha colada embaixo,
   * e `box-none` deixa o toque no vazio chegar ao overlay que fecha.
   */
  ancora: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  // Mesmas margens da FolhaFotoPerfil.
  folha: {
    marginHorizontal: 10,
    marginBottom: 34,
  },
  grupo: {
    borderRadius: 16,
    backgroundColor: cores.neutro0,
    overflow: 'hidden',
  },
  cabecalho: {
    paddingHorizontal: espacamento.cardPadding,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro100,
  },
  titulo: {
    ...tipografia.corpoLg,
    color: cores.neutro900,
    textAlign: 'center',
  },
  ajuda: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
    textAlign: 'center',
    marginTop: 4,
  },
  corpo: {
    padding: espacamento.cardPadding,
  },
  // Mesmo input da tela de Editar conta (B22).
  input: {
    height: ALTURA_INPUT,
    paddingHorizontal: 12,
    borderRadius: raioCard,
    borderWidth: 1,
    borderColor: cores.neutro200,
    fontFamily: familiaInter.regular,
    fontSize: 16,
    color: cores.neutro900,
    backgroundColor: cores.neutro0,
  },
  inputComErro: {
    borderColor: cores.erro500,
  },
  erro: {
    ...tipografia.corpoSm,
    color: cores.erro500,
    marginTop: 6,
  },
  rotuloConfirmacao: {
    ...tipografia.corpoSm,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
    marginTop: 14,
    marginBottom: 6,
  },
  botaoSalvar: {
    marginTop: espacamento.cardPadding,
  },
  botaoCancelar: {
    height: 56,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: cores.neutro0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelarPressionado: {
    backgroundColor: cores.neutro50,
  },
  textoCancelar: {
    ...tipografia.corpoLg,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
  },
});
