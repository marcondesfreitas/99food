/**
 * B19 — Tela Transferência Pix.
 *
 * Formulário empurrado a partir da Carteira (B18): nome, CPF/CNPJ, conta,
 * dígito, agência, instituição e tipo de conta, com um botão "Continuar" que
 * só habilita quando os três campos mínimos passam da validação.
 *
 * Fonte: `.design-import/RotaFacil Motorista v6.dc.html`, bloco `telaPix`
 * (linhas 822-877) e `.design-import/logic.js`:
 * - `pixNome/pixCpf/pixConta/pixDigito/pixAgencia` + setters (linhas 609-618).
 * - `tiposConta` (linhas 615-618) — os quatro rádios, com anel `#1C1A1F`
 *   (`neutro900`) quando marcado e `#DCDAE0` (`neutro200`) quando não.
 * - `bgContinuar`/`corContinuar` (linha 619) — amarelo/`neutro900` quando
 *   válido, `neutro200`/`neutro400` quando não. É exatamente o par
 *   normal/`desabilitado` do `Botao` de B05, então a tela não repinta nada.
 * - `enviarPix` (linha 620) — `if (pixOk) this.push('carteira')`.
 *
 * A REGRA de validação (`pixOk`, logic.js linha 444) mora em
 * `motoristaStore` e não é reescrita aqui: quem grava é `enviarPix`, e a cor
 * do botão vem do predicado `pixValido`, exportado pela mesma store e usado
 * internamente por `enviarPix`. Uma definição só, dois consumidores.
 *
 * Notas de tradução Web → RN:
 * - Os `<label>` com `<input>` de borda inferior viram `Text` + `TextInput`
 *   com `borderBottomWidth: 1`.
 * - O `›` da linha "Instituição" é um quadrado de 7px com duas bordas e
 *   `rotate(-45deg)` no CSS; portado literalmente como `View` rotacionada,
 *   igual ao que a Carteira (B18) faz.
 * - Sem máscara de CPF/conta: o protótipo não tem nenhuma (os placeholders
 *   `000.000.000-00` / `0001` são só dica visual). Fidelidade primeiro.
 * - O protótipo é uma página web com `overflow: auto` e sem teclado virtual;
 *   aqui entra `KeyboardAvoidingView` + `ScrollView` para os campos de baixo
 *   não ficarem embaixo do teclado. O botão fica no fim do fluxo de rolagem,
 *   como no protótipo (o `<div>` do "Continuar" está dentro do container
 *   rolável).
 *
 * MARCA (PLANO_IMPLEMENTACAO_V6.md §5): o placeholder do nome no protótipo é
 * o nome de uma pessoa real do vídeo original; aqui usa-se o mesmo nome
 * fictício do titular da conta em `motoristaStore` (DESIGN_SYSTEM.md §2.9).
 */

import { useRef, useState } from 'react';
import type { RefObject } from 'react';
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
import type { KeyboardTypeOptions, StyleProp, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { Botao } from '@/components/ui/Botao';
import { CabecalhoPush } from '@/components/ui/CabecalhoPush';
import { TIPOS_CONTA } from '@/servicos/mapaFalso';
import { useMotoristaStore, pixValido } from '@/state/motoristaStore';
import type { PixDados } from '@/state/motoristaStore';
import { irCarteiraAposPix, voltarDe } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { espacamento, raioPill } from '@/tema/espacamento';
import { familiaInter } from '@/tema/tipografia';

/** `gap: 18px` entre os grupos de campo. */
const GAP_CAMPOS = 18;
/** `width/height: 22px` do anel do rádio; `border: 2px`. */
const ANEL_RADIO = 22;
const BORDA_RADIO = 2;
/** `width/height: 11px` do ponto interno do rádio. */
const PONTO_RADIO = 11;

export default function Pix() {
  const pixSalvo = useMotoristaStore((s) => s.pix);
  const enviarPix = useMotoristaStore((s) => s.enviarPix);

  /**
   * Rascunho local do formulário: o protótipo escreve direto no estado global
   * a cada tecla, mas `enviarPix` só grava quando válido — então o valor
   * "oficial" da store fica sendo o último Pix confirmado, e o que está sendo
   * digitado vive aqui. Inicializado a partir da store para o formulário voltar
   * preenchido se o motorista sair e entrar de novo.
   */
  const [dados, setDados] = useState<PixDados>(() => ({ ...pixSalvo }));

  const refCpf = useRef<TextInput>(null);
  const refConta = useRef<TextInput>(null);
  const refDigito = useRef<TextInput>(null);
  const refAgencia = useRef<TextInput>(null);

  const atualizar = (campo: keyof PixDados) => (valor: string) => {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  };

  const valido = pixValido(dados);

  const continuar = () => {
    // A ação da store revalida e só grava se passar — o `valido` acima é
    // apenas a pintura do botão.
    if (!enviarPix(dados)) return;
    // `enviarPix` faz `push('carteira')` no protótipo (logic.js linha 620).
    // `irCarteiraAposPix` usa `replace` para a pilha ficar
    // `[mapa, central, carteira]` — ver a nota de `irPix` em
    // `src/servicos/navegacao.ts`.
    irCarteiraAposPix();
  };

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={estilos.tela}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* `voltarPush` (logic.js linha 282) manda `pix` para `central` — e
            NÃO para a Carteira, como faz o `‹` do `.dc.html` linha 825. O
            critério de aceite de B25 é explícito nisso; a divergência está
            registrada no cabeçalho de `src/servicos/navegacao.ts`. */}
        <CabecalhoPush
          titulo="Transferência Pix"
          centralizado
          onVoltar={() => voltarDe('pix')}
        />

        <ScrollView
          style={estilos.rolagem}
          contentContainerStyle={estilos.conteudo}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Campos: `padding: 8px 16px 0`; `gap: 18px` -------------- */}
          <View style={estilos.campos}>
            <Campo
              rotulo="Nome completo"
              valor={dados.nome}
              aoMudar={atualizar('nome')}
              placeholder="Bruno Ferreira"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              aoEnviar={() => refCpf.current?.focus()}
            />

            <Campo
              refInput={refCpf}
              rotulo="CPF/CNPJ"
              valor={dados.cpf}
              aoMudar={atualizar('cpf')}
              placeholder="000.000.000-00"
              keyboardType="numeric"
              returnKeyType="next"
              aoEnviar={() => refConta.current?.focus()}
            />

            {/* `display:flex; gap:12` — conta (flex 7) + dígito (flex 3) */}
            <View style={estilos.linhaConta}>
              <Campo
                refInput={refConta}
                estilo={estilos.flex7}
                rotulo="Número da conta"
                valor={dados.conta}
                aoMudar={atualizar('conta')}
                placeholder="00000000"
                keyboardType="number-pad"
                returnKeyType="next"
                aoEnviar={() => refDigito.current?.focus()}
              />
              <Campo
                refInput={refDigito}
                estilo={estilos.flex3}
                rotulo="Dígito"
                valor={dados.digito}
                aoMudar={atualizar('digito')}
                placeholder="0"
                keyboardType="number-pad"
                returnKeyType="next"
                aoEnviar={() => refAgencia.current?.focus()}
              />
            </View>

            <Campo
              refInput={refAgencia}
              rotulo="Número da agência"
              valor={dados.agencia}
              aoMudar={atualizar('agencia')}
              placeholder="0001"
              keyboardType="number-pad"
              returnKeyType="done"
            />

            {/*
              Linha "Instituição". No protótipo é um `<div>` sem `onClick` —
              decorativo, o seletor de banco não existe. Fica como conteúdo
              estático (um botão que não faz nada seria pior); vira rota
              própria se a lista de instituições algum dia entrar.
            */}
            <View style={estilos.linhaInstituicao}>
              <View>
                <Text style={estilos.rotulo}>Instituição</Text>
                <Text style={estilos.valorInstituicao}>Selecionar</Text>
              </View>
              <View style={estilos.chevron} />
            </View>

            {/* ---- Tipo de conta ---------------------------------------- */}
            <View>
              <Text style={estilos.tituloSecao}>Tipo de conta</Text>
              <View style={estilos.listaTipos}>
                {TIPOS_CONTA.map((tipo) => {
                  const marcado = dados.tipo === tipo;
                  return (
                    <Pressable
                      key={tipo}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: marcado }}
                      accessibilityLabel={tipo}
                      onPress={() => setDados((atual) => ({ ...atual, tipo }))}
                      style={({ pressed }) => [
                        estilos.linhaTipo,
                        pressed && estilos.pressionado,
                      ]}
                    >
                      <View
                        style={[
                          estilos.anelRadio,
                          {
                            borderColor: marcado
                              ? cores.neutro900
                              : cores.neutro200,
                          },
                        ]}
                      >
                        <View
                          style={[
                            estilos.pontoRadio,
                            marcado && estilos.pontoRadioMarcado,
                          ]}
                        />
                      </View>
                      <Text style={estilos.rotuloTipo}>{tipo}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ---- Continuar: `padding: 12px 16px 30px` -------------------- */}
          <View style={estilos.rodape}>
            <Botao
              rotulo="Continuar"
              onPress={continuar}
              desabilitado={!valido}
              testID="pix-continuar"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---- Campo -------------------------------------------------------------------

type CampoProps = {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'name' | 'off';
  returnKeyType?: 'next' | 'done';
  aoEnviar?: () => void;
  refInput?: RefObject<TextInput | null>;
  estilo?: StyleProp<ViewStyle>;
};

/**
 * `<label>` do protótipo: rótulo de 12.5px em `neutro600` + input de 16px com
 * borda inferior de 1px `neutro200`.
 */
function Campo({
  rotulo,
  valor,
  aoMudar,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete = 'off',
  returnKeyType,
  aoEnviar,
  refInput,
  estilo,
}: CampoProps) {
  return (
    <View style={estilo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        ref={refInput}
        value={valor}
        onChangeText={aoMudar}
        placeholder={placeholder}
        placeholderTextColor={cores.neutro400}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={aoEnviar}
        submitBehavior={returnKeyType === 'next' ? 'submit' : 'blurAndSubmit'}
        accessibilityLabel={rotulo}
        style={estilos.entrada}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro0,
  },
  rolagem: {
    flex: 1,
  },
  conteudo: {
    flexGrow: 1,
  },

  // ---- Campos ---------------------------------------------------------------
  // padding: 8px 16px 0; gap: 18px
  campos: {
    paddingTop: 8,
    paddingHorizontal: espacamento.telaLateral,
    gap: GAP_CAMPOS,
  },
  // font-size:12.5; color:#5D5B61
  rotulo: {
    fontFamily: familiaInter.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: cores.neutro600,
  },
  // margin-top:4; padding:8px 0; font-size:16; border-bottom:1px #DCDAE0
  entrada: {
    marginTop: 4,
    paddingVertical: 8,
    // `padding: 8px 0` — o RN põe padding horizontal próprio no Android.
    paddingHorizontal: 0,
    fontFamily: familiaInter.regular,
    fontSize: 16,
    color: cores.neutro900,
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro200,
  },

  // display:flex; gap:12 (conta flex:7 / dígito flex:3)
  linhaConta: {
    flexDirection: 'row',
    gap: 12,
  },
  flex7: {
    flex: 7,
  },
  flex3: {
    flex: 3,
  },

  // ---- Instituição ----------------------------------------------------------
  // align-items:center; justify-content:space-between; padding-bottom:8;
  // border-bottom:1px #DCDAE0
  linhaInstituicao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: cores.neutro200,
  },
  // font-size:16; margin-top:4
  valorInstituicao: {
    marginTop: 4,
    fontFamily: familiaInter.regular,
    fontSize: 16,
    lineHeight: 20,
    color: cores.neutro900,
  },
  // width:7; height:7; border-right/bottom 2px #9D9CA1; rotate(-45deg)
  chevron: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: cores.neutro400,
    transform: [{ rotate: '-45deg' }],
  },

  // ---- Tipo de conta --------------------------------------------------------
  // font-size:15; font-weight:700
  tituloSecao: {
    fontFamily: familiaInter.bold,
    fontSize: 15,
    lineHeight: 20,
    color: cores.neutro900,
  },
  // margin-top:8; gap:2
  listaTipos: {
    marginTop: 8,
    gap: 2,
  },
  // align-items:center; gap:12; padding:12px 0
  linhaTipo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  pressionado: {
    opacity: 0.6,
  },
  anelRadio: {
    width: ANEL_RADIO,
    height: ANEL_RADIO,
    borderRadius: raioPill,
    borderWidth: BORDA_RADIO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // background: transparente quando não marcado
  pontoRadio: {
    width: PONTO_RADIO,
    height: PONTO_RADIO,
    borderRadius: raioPill,
    backgroundColor: 'transparent',
  },
  pontoRadioMarcado: {
    backgroundColor: cores.neutro900,
  },
  // font-size:16; color:#1C1A1F
  rotuloTipo: {
    fontFamily: familiaInter.regular,
    fontSize: 16,
    lineHeight: 20,
    color: cores.neutro900,
  },

  // ---- Rodapé ---------------------------------------------------------------
  // padding: 12px 16px 30px
  rodape: {
    paddingTop: 12,
    paddingHorizontal: espacamento.telaLateral,
    paddingBottom: 30,
    marginTop: 'auto',
  },
});
