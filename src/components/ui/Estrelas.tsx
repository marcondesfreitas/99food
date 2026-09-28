import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { cores } from '@/tema/cores';
import { raioPill } from '@/tema/espacamento';
import { tipografia } from '@/tema/tipografia';

/**
 * Estrelas de avaliação.
 *
 * - `Estrelas` — seletor tocável de 1 a 5, usado na tela de Resumo.
 *   Fonte: `.design-import/RotaFacil Motorista v6.dc.html` bloco `telaResumo`
 *   (botões 48×48, gap 10) + `logic.js` (`estrelasLista`: cheia `#F8D60B`,
 *   vazia `#DCDAE0`).
 * - `DistribuicaoEstrelas` — leitura apenas, cinco linhas 5→1 no Perfil.
 *   Fonte: DESIGN_SYSTEM.md §3.10.
 */

/** Estrela de 5 pontas desenhada em SVG (viewBox 24×24). */
const CAMINHO_ESTRELA =
  'M12 2.2l3.02 6.12 6.76.98-4.89 4.77 1.15 6.73L12 17.62l-6.04 3.18 1.15-6.73L2.22 9.3l6.76-.98z';

export type IconeEstrelaProps = {
  tamanho: number;
  cor: string;
};

export function IconeEstrela({ tamanho, cor }: IconeEstrelaProps) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <Path d={CAMINHO_ESTRELA} fill={cor} />
    </Svg>
  );
}

// ---- Seletor tocável ----------------------------------------------------------

const NOTAS = [1, 2, 3, 4, 5] as const;

export type EstrelasProps = {
  /** Nota atual, de 0 (nenhuma) a 5. */
  valor: number;
  onChange?: (nota: number) => void;
  /** Área tocável de cada estrela. Padrão 48 (valor do protótipo). */
  alvo?: number;
  /** Tamanho do glifo desenhado dentro do alvo. Padrão 32. */
  tamanhoEstrela?: number;
  /** Espaço entre estrelas. Padrão 10. */
  espaco?: number;
  somenteLeitura?: boolean;
  estilo?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Estrelas({
  valor,
  onChange,
  alvo = 48,
  tamanhoEstrela = 32,
  espaco = 10,
  somenteLeitura = false,
  estilo,
  testID,
}: EstrelasProps) {
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Avaliação da viagem"
      accessibilityValue={{ min: 0, max: 5, now: valor }}
      testID={testID}
      style={[estilos.linhaEstrelas, { gap: espaco }, estilo]}
    >
      {NOTAS.map((nota) => (
        <Pressable
          key={nota}
          accessibilityRole="button"
          accessibilityLabel={`${nota} ${nota === 1 ? 'estrela' : 'estrelas'}`}
          disabled={somenteLeitura}
          onPress={() => onChange?.(nota)}
          style={[estilos.alvoEstrela, { width: alvo, height: alvo }]}
        >
          <IconeEstrela
            tamanho={tamanhoEstrela}
            cor={nota <= valor ? cores.amarelo500 : cores.neutro200}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ---- Distribuição (somente leitura) -------------------------------------------

/**
 * Quantidade de avaliações por nota, do índice 0 (**1 estrela**) ao índice 4
 * (**5 estrelas**). A renderização inverte para exibir de 5 a 1.
 */
export type ContagensPorEstrela = readonly [
  umaEstrela: number,
  duasEstrelas: number,
  tresEstrelas: number,
  quatroEstrelas: number,
  cincoEstrelas: number,
];

export type DistribuicaoEstrelasProps = {
  contagens: ContagensPorEstrela;
  estilo?: StyleProp<ViewStyle>;
  testID?: string;
};

const ALTURA_BARRA = 8;

export function DistribuicaoEstrelas({
  contagens,
  estilo,
  testID,
}: DistribuicaoEstrelasProps) {
  const maior = Math.max(...contagens, 0);

  return (
    <View testID={testID} style={[estilos.distribuicao, estilo]}>
      {[5, 4, 3, 2, 1].map((nota) => {
        const total = contagens[nota - 1] ?? 0;
        const fracao = maior > 0 ? total / maior : 0;

        return (
          <View
            key={nota}
            accessibilityRole="text"
            accessibilityLabel={`${nota} ${nota === 1 ? 'estrela' : 'estrelas'}: ${total}`}
            style={estilos.linhaDistribuicao}
          >
            <Text style={[tipografia.corpoMd, estilos.notaDistribuicao]}>{nota}</Text>
            <IconeEstrela tamanho={16} cor={cores.amarelo500} />
            <View style={estilos.trilhoBarra}>
              <View
                style={[
                  estilos.preenchimentoBarra,
                  // `flex` em vez de `%` para evitar arredondamento de largura.
                  { flex: fracao },
                ]}
              />
              <View style={{ flex: 1 - fracao }} />
            </View>
            <Text style={[tipografia.corpoMd, estilos.totalDistribuicao]}>{total}</Text>
          </View>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  linhaEstrelas: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alvoEstrela: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  distribuicao: {
    gap: 8,
  },
  linhaDistribuicao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notaDistribuicao: {
    color: cores.neutro900,
    minWidth: 10,
    textAlign: 'center',
  },
  trilhoBarra: {
    flex: 1,
    flexDirection: 'row',
    height: ALTURA_BARRA,
    borderRadius: raioPill,
    backgroundColor: cores.neutro100,
    overflow: 'hidden',
  },
  preenchimentoBarra: {
    borderRadius: raioPill,
    backgroundColor: cores.amarelo500,
  },
  totalDistribuicao: {
    color: cores.neutro600,
    minWidth: 28,
    textAlign: 'right',
  },
});
