/**
 * FotoPerfil — o miolo de qualquer avatar do app.
 *
 * Existe porque o avatar aparece em cinco lugares (Perfil, Editar conta,
 * Configurações, menu lateral e a miniatura de "foto do cadastro" da
 * verificação facial) e os cinco precisam decidir a mesma coisa de três
 * maneiras possíveis:
 *
 * | Situação | O que aparece |
 * |---|---|
 * | Há foto escolhida (`uri`) | a imagem, recortada em `cover` |
 * | Há foto de cadastro, mas nenhuma escolhida | nada — só o fundo do contêiner |
 * | Não há foto (`temFoto` falso) | as iniciais do nome |
 *
 * O caso do meio é o do protótipo: `avatarBg` (logic.js linha 546) pinta um
 * listrado diagonal para dizer "existe uma foto no cadastro", sem mostrá-la.
 * Aqui isso vira um tom chapado, e **quem** desenha esse fundo continua sendo
 * cada tela — este componente só preenche o miolo, e por isso não conhece
 * tamanho, borda nem cor de fundo.
 *
 * A foto real é funcionalidade nova: o protótipo nunca mostra uma imagem de
 * verdade. Ver `src/servicos/imagemPerfil.ts`.
 */

import { Image, StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

export type FotoPerfilProps = {
  /** `motoristaStore.fotoUri` — a imagem escolhida, se houver. */
  uri: string | null;
  /** `temFoto` do protótipo: `motoristaStore.foto === 'ok'`. */
  temFoto: boolean;
  /** Iniciais já calculadas (use `iniciaisDe`). */
  iniciais: string;
  /** Estilo do texto das iniciais — cada tela tem o seu tamanho. */
  estiloIniciais?: StyleProp<TextStyle>;
};

export function FotoPerfil({
  uri,
  temFoto,
  iniciais,
  estiloIniciais,
}: FotoPerfilProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        // `cover` e não `contain`: o recorte já foi feito em 1:1 na hora de
        // escolher, então preencher o círculo nunca distorce.
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
    );
  }

  if (temFoto) return null;

  return <Text style={estiloIniciais}>{iniciais}</Text>;
}

/**
 * "Bruno Ferreira" → "BF" — `avatarConteudo`, logic.js linha 547.
 *
 * Estava copiado em quatro telas antes deste componente existir. Uma cópia só
 * evita que elas divirjam em casos de canto (nome vazio, nome de uma palavra
 * só, espaços repetidos).
 */
export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '';
  const primeira = partes[0]?.charAt(0) ?? '';
  const ultima =
    partes.length > 1 ? (partes[partes.length - 1]?.charAt(0) ?? '') : '';
  return (primeira + ultima).toUpperCase();
}
