/**
 * ModalAdicionarVeiculo — folha inferior do "Adicionar veículo" (B23).
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco
 * `modalVeiculo` (linhas 1040-1061) e `.design-import/logic.js`:
 * `abasVeiculo` (linhas 589-595) e `salvarVeiculo` (linhas 600-608).
 *
 * Apresentacional: não lê nem escreve store. Monta o `Veiculo` seguindo as
 * mesmas regras do protótipo e entrega por `onSalvar`; quem persiste é a tela
 * (via `motoristaStore.adicionarVeiculo`).
 */

import { useEffect, useState } from 'react';
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

import type { TipoVeiculo, Veiculo } from '@/state/tipos';
import { cores } from '@/tema/cores';
import { espacamento, raioCard, raioPill, raioSheet } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

const TIPOS: TipoVeiculo[] = ['MOTO', 'CARRO', 'BIKE'];

/** `nome: x.charAt(0) + x.slice(1).toLowerCase()` — logic.js linha 590. */
function rotuloTipo(tipo: TipoVeiculo): string {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase();
}

/** `arte` — logic.js linha 602. */
function arteDoTipo(tipo: TipoVeiculo): string {
  return tipo === 'CARRO' ? 'foto carro' : tipo === 'BIKE' ? 'foto bike' : 'foto moto';
}

export type ModalAdicionarVeiculoProps = {
  visivel: boolean;
  onFechar: () => void;
  onSalvar: (veiculo: Veiculo) => void;
};

export function ModalAdicionarVeiculo({
  visivel,
  onFechar,
  onSalvar,
}: ModalAdicionarVeiculoProps) {
  const [tipo, setTipo] = useState<TipoVeiculo>('MOTO');
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');

  /**
   * `abrirModalVeiculo` (logic.js 588) limpa os campos ao abrir — replicado
   * aqui para o modal nunca reabrir com o rascunho anterior.
   */
  useEffect(() => {
    if (!visivel) return;
    setTipo('MOTO');
    setPlaca('');
    setModelo('');
    setCor('');
  }, [visivel]);

  /** `salvarVeiculo` — logic.js linhas 600-608, com os mesmos fallbacks. */
  const salvar = () => {
    const placaFinal = (placa || 'NOVO000').toUpperCase();
    const sufixoCor = cor ? ` (${cor.toUpperCase()})` : '';
    onSalvar({
      tipo,
      modelo: modelo || 'Sem modelo',
      placa: placaFinal + sufixoCor,
      arte: arteDoTipo(tipo),
    });
  };

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onFechar}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        style={estilos.overlay}
        onPress={onFechar}
      />

      <KeyboardAvoidingView
        style={estilos.ancora}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={estilos.folha}>
          <Text style={estilos.titulo}>Adicionar veículo</Text>

          {/* Abas de tipo — pill de 48px com fundo `neutroCampo`. */}
          <View style={estilos.abas}>
            {TIPOS.map((t) => {
              const ativa = t === tipo;
              return (
                <Pressable
                  key={t}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativa }}
                  onPress={() => setTipo(t)}
                  style={[estilos.aba, ativa && estilos.abaAtiva]}
                >
                  <Text style={[estilos.textoAba, ativa && estilos.textoAbaAtiva]}>
                    {rotuloTipo(t)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={estilos.campos}>
            <TextInput
              value={placa}
              onChangeText={setPlaca}
              placeholder="Placa"
              placeholderTextColor={cores.neutro400}
              style={estilos.input}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
            />
            <TextInput
              value={modelo}
              onChangeText={setModelo}
              placeholder="Modelo (ex: HONDA CG)"
              placeholderTextColor={cores.neutro400}
              style={estilos.input}
              autoCapitalize="characters"
              returnKeyType="next"
            />
            <TextInput
              value={cor}
              onChangeText={setCor}
              placeholder="Cor"
              placeholderTextColor={cores.neutro400}
              style={estilos.input}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={salvar}
            />
          </View>

          <View style={estilos.rodape}>
            <Pressable
              accessibilityRole="button"
              onPress={onFechar}
              style={({ pressed }) => [
                estilos.botao,
                estilos.botaoCancelar,
                pressed && estilos.pressionado,
              ]}
            >
              <Text style={estilos.textoCancelar}>Cancelar</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={salvar}
              style={({ pressed }) => [
                estilos.botao,
                estilos.botaoSalvar,
                pressed && estilos.botaoSalvarPressionado,
              ]}
            >
              <Text style={estilos.textoSalvar}>Salvar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: cores.overlayModal,
  },
  ancora: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  // radius: 20px 20px 0 0; padding: 18px 16px 34px
  folha: {
    borderTopLeftRadius: raioSheet,
    borderTopRightRadius: raioSheet,
    backgroundColor: cores.neutro0,
    paddingTop: 18,
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 34,
  },
  titulo: {
    ...tipografia.tituloMd,
    color: cores.neutro900,
    textAlign: 'center',
  },

  // height:48; padding:4; radius:999; background:#F5F5F7; gap:4
  abas: {
    flexDirection: 'row',
    gap: 4,
    height: 48,
    padding: 4,
    marginTop: espacamento.telaLateral,
    borderRadius: raioPill,
    backgroundColor: cores.neutroCampo,
  },
  aba: {
    flex: 1,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A aba ativa ganha fundo branco + sombra sutil (`0 1px 3px rgba(0,0,0,.16)`).
  abaAtiva: {
    backgroundColor: cores.neutro0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  textoAba: {
    fontFamily: familiaInter.medium,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: cores.neutro400,
  },
  textoAbaAtiva: {
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
  },

  campos: {
    gap: 10,
    marginTop: espacamento.telaLateral,
  },
  // height:56; padding:0 14; radius:12; background:#F5F5F7; 16px; sem borda
  input: {
    height: 56,
    paddingHorizontal: 14,
    borderRadius: raioCard,
    backgroundColor: cores.neutroCampo,
    fontFamily: familiaInter.regular,
    fontSize: 16,
    color: cores.neutro900,
  },

  rodape: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  botao: {
    flex: 1,
    height: 52,
    borderRadius: raioPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoCancelar: {
    backgroundColor: cores.neutroCampo,
  },
  botaoSalvar: {
    backgroundColor: cores.amarelo500,
  },
  botaoSalvarPressionado: {
    backgroundColor: cores.amarelo600,
  },
  pressionado: {
    opacity: 0.7,
  },
  textoCancelar: {
    fontFamily: familiaInter.semiBold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    color: cores.neutro900,
  },
  textoSalvar: {
    fontFamily: familiaInter.bold,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    color: cores.neutro900,
  },
});

export default ModalAdicionarVeiculo;
