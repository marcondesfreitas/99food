/**
 * FolhaFotoPerfil — a folha de opções da foto de perfil.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html` linhas 1065-1080
 * (`sheetFoto`), com "Foto de perfil" como título, "Tirar foto", "Escolher da
 * galeria", "Remover foto atual" (só quando há foto) e "Cancelar".
 *
 * No protótipo ela é aberta por duas telas — o avatar do Perfil (linha 884) e o
 * avatar de "Editar conta" (linha 994) — e é por isso que vive aqui e não
 * dentro de uma delas.
 *
 * Diferença em relação ao protótipo: lá os dois primeiros itens chamam o mesmo
 * `tirarFoto` falso. Aqui cada um abre a sua origem de verdade (câmera ou
 * galeria), via `src/servicos/imagemPerfil.ts`.
 *
 * A visibilidade continua sendo estado local de quem usa (`useState`), não da
 * store — decisão de B03: a store guarda o *status* da foto, a tela decide
 * quando a folha aparece.
 */

import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useMotoristaStore } from '@/state/motoristaStore';
import {
  escolherFotoDePerfil,
  type OrigemFoto,
} from '@/servicos/imagemPerfil';
import { cores } from '@/tema/cores';
import { familiaInter, tipografia } from '@/tema/tipografia';

export type FolhaFotoPerfilProps = {
  visivel: boolean;
  onFechar: () => void;
};

export function FolhaFotoPerfil({ visivel, onFechar }: FolhaFotoPerfilProps) {
  const foto = useMotoristaStore((s) => s.foto);
  const definirFoto = useMotoristaStore((s) => s.definirFoto);
  const removerFoto = useMotoristaStore((s) => s.removerFoto);

  /** `temFoto` — logic.js linha 546. Controla o item "Remover foto atual". */
  const temFoto = foto === 'ok';

  /**
   * A folha fecha **antes** de abrir o picker: as duas são telas de sistema, e
   * empilhar uma sobre a outra pisca no Android e, no iOS, chega a impedir o
   * picker de aparecer.
   */
  const escolher = async (origem: OrigemFoto) => {
    onFechar();
    const uri = await escolherFotoDePerfil(origem);
    // `null` = cancelou ou negou a permissão. Nada muda e nenhum erro aparece:
    // cancelar é uma escolha, não uma falha.
    if (uri) definirFoto(uri);
  };

  const remover = () => {
    onFechar();
    removerFoto();
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

      <View style={estilos.folha}>
        <View style={estilos.grupo}>
          <View style={estilos.titulo}>
            <Text style={estilos.textoTitulo}>Foto de perfil</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => escolher('camera')}
            style={({ pressed }) => [
              estilos.item,
              estilos.itemComBorda,
              pressed && estilos.itemPressionado,
            ]}
          >
            <Text style={estilos.textoItem}>Tirar foto</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => escolher('galeria')}
            style={({ pressed }) => [
              estilos.item,
              pressed && estilos.itemPressionado,
            ]}
          >
            <Text style={estilos.textoItem}>Escolher da galeria</Text>
          </Pressable>

          {temFoto ? (
            <Pressable
              accessibilityRole="button"
              onPress={remover}
              style={({ pressed }) => [
                estilos.item,
                estilos.itemComBordaTopo,
                pressed && estilos.itemPressionado,
              ]}
            >
              <Text style={[estilos.textoItem, estilos.textoRemover]}>
                Remover foto atual
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onFechar}
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
  // left:10; right:10; bottom:34
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
  titulo: {
    padding: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro100,
  },
  textoTitulo: {
    ...tipografia.corpoSm,
    color: cores.neutro600,
    textAlign: 'center',
  },
  item: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemComBorda: {
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro100,
  },
  itemComBordaTopo: {
    borderTopWidth: 1,
    borderTopColor: cores.neutro100,
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
  textoRemover: {
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
