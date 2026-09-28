/**
 * FolhaConfirmar — a folha de "tem certeza?" para ações que não dão para
 * desfazer.
 *
 * Funcionalidade nova: o protótipo não tem nenhuma ação destrutiva, então não
 * tem confirmação de nada. A moldura é a mesma de `FolhaFotoPerfil` (grupo
 * branco arredondado, "Cancelar" solto embaixo) — é o idioma que o app já usa
 * para decisão em folha, e repeti-lo é o que faz a confirmação parecer parte
 * do app e não um `Alert` do sistema.
 *
 * Deliberadamente sem `Alert.alert`: o texto do sistema não passa pelos tokens
 * de tipografia e cor do app, e no React Native Web ele nem aparece do mesmo
 * jeito. Uma folha própria fica igual nas três plataformas.
 *
 * O componente é burro por opção: não conhece veículo, store nem navegação —
 * quem chama decide o que a confirmação significa.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '@/tema/cores';
import { espacamento } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

export type FolhaConfirmarProps = {
  visivel: boolean;
  titulo: string;
  /** Linha de apoio: o que exatamente acontece ao confirmar. */
  mensagem?: string;
  rotuloConfirmar: string;
  /** Pinta a ação de vermelho. Use para o que apaga dados. */
  destrutivo?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export function FolhaConfirmar({
  visivel,
  titulo,
  mensagem,
  rotuloConfirmar,
  destrutivo = false,
  onConfirmar,
  onCancelar,
}: FolhaConfirmarProps) {
  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onCancelar}
      statusBarTranslucent
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        style={estilos.overlay}
        onPress={onCancelar}
      />

      <View style={estilos.folha}>
        <View style={estilos.grupo}>
          <View style={estilos.cabecalho}>
            <Text style={estilos.titulo}>{titulo}</Text>
            {mensagem ? <Text style={estilos.mensagem}>{mensagem}</Text> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onConfirmar}
            style={({ pressed }) => [
              estilos.item,
              pressed && estilos.itemPressionado,
            ]}
          >
            <Text
              style={[
                estilos.textoItem,
                destrutivo && estilos.textoDestrutivo,
              ]}
            >
              {rotuloConfirmar}
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onCancelar}
          style={({ pressed }) => [
            estilos.botaoCancelar,
            pressed && estilos.itemPressionado,
          ]}
        >
          <Text style={estilos.textoCancelar}>Cancelar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: cores.overlayFolhaFoto,
  },
  folha: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 34,
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
  mensagem: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
    textAlign: 'center',
    marginTop: 4,
  },
  item: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressionado: {
    backgroundColor: cores.neutro50,
  },
  textoItem: {
    ...tipografia.corpoLg,
    fontFamily: familiaInter.regular,
    fontWeight: '400',
    color: cores.neutro900,
  },
  textoDestrutivo: {
    fontFamily: familiaInter.semiBold,
    fontWeight: '600',
    color: cores.erro500,
  },
  botaoCancelar: {
    height: 56,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: cores.neutro0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCancelar: {
    ...tipografia.corpoLg,
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
  },
});
