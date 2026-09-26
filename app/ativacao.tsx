/**
 * Tela de ativação — o portão que fica entre a splash e o mapa.
 *
 * Funcionalidade **nova**, sem correspondente no protótipo Claude Design:
 * recriada a partir de uma captura fornecida. Enquanto o app não está ativado,
 * é ela que `app/index.tsx` abre; ativado, o encaminhamento vai direto para o
 * mapa e esta tela não chega a montar.
 *
 * ## A splash continua aparecendo primeiro
 *
 * `CoberturaSplash` é renderizada aqui por cima, exatamente como em
 * `mapa.tsx`. O componente guarda num `let` de módulo se já se exibiu no
 * processo, então ela aparece **uma vez por abertura do app**, seja o destino
 * o mapa (já ativado) ou esta tela — e some com o mesmo fade, revelando o
 * formulário já montado por baixo.
 *
 * ## Medidas
 *
 * Vieram da captura (iPhone a 2x: valor em px ÷ 2). Os números que fogem dos
 * tokens do design system estão nas constantes abaixo, cada um com o porquê —
 * o principal é a margem lateral de 24, e não os 16 de `espacamento.telaLateral`
 * que o resto do app usa: a captura mostra uma coluna mais estreita, que é o
 * que dá à tela a leitura de "cartaz", diferente das telas de lista.
 *
 * ## O que a tela NÃO faz
 *
 * Validar de verdade. Não há servidor: a conferência é local, contra a lista
 * de `@/servicos/ativacao`. Ver o cabeçalho daquele arquivo.
 */

import { useCallback, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoberturaSplash } from '@/components/splash/CoberturaSplash';
import { Botao } from '@/components/ui/Botao';
import { ativarComToken, DIAS_VALIDADE_PADRAO } from '@/servicos/ativacao';
import { ROTAS } from '@/servicos/navegacao';
import { cores } from '@/tema/cores';
import { raioCard, raioPill } from '@/tema/espacamento';
import { familiaInter, tipografia } from '@/tema/tipografia';

// ---------------------------------------------------------------------------
// Medidas da captura
// ---------------------------------------------------------------------------

/** Coluna de conteúdo. Ver "Medidas" no cabeçalho. */
const MARGEM_LATERAL = 24;

/** Disco do logo: 156px na captura. */
const DIAMETRO_LOGO = 78;

/**
 * "99" dentro do disco. `tipografia.displayLg` é 34 e ficaria pequeno para um
 * disco de 78 — na captura o monograma ocupa quase toda a largura útil. O peso
 * 800 é o mesmo da splash, pelo mesmo motivo: é o monograma da marca.
 */
const FONTE_LOGO = 36;

/** Altura do campo e do botão: 107px na captura, iguais entre si. */
const ALTURA_CAMPO = 54;

/** Raio do campo — retângulo bem arredondado, não pill (o botão é que é pill). */
const RAIO_CAMPO = 16;

/** Espaçamento entre o topo da tela e o logo, e entre logo e título. */
const ESPACO_TOPO = 72;
const ESPACO_APOS_LOGO = 28;

/** Recuo do bloco de aviso em relação à base. */
const ESPACO_BASE_AVISO = 24;

/** Disco do ícone "i" do aviso: 56px na captura. */
const DIAMETRO_ICONE_AVISO = 28;

/**
 * Brilho amarelo em volta do logo e do botão. Na captura os dois têm um halo
 * difuso da própria cor — é o que dá o ar de "botão aceso". Não é a
 * `sombraFlutuante` do design system (preta, para elevação); esta é colorida e
 * decorativa, então mora aqui.
 */
const BRILHO_AMARELO = {
  shadowColor: cores.amarelo500,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.55,
  shadowRadius: 18,
  elevation: 0,
} as const;

const BRILHO_LARANJA = {
  shadowColor: cores.amareloSplash,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.45,
  shadowRadius: 20,
  elevation: 0,
} as const;

// ---------------------------------------------------------------------------
// Textos (transcritos da captura)
// ---------------------------------------------------------------------------

const TITULO = 'Ativar aplicativo';
const PLACEHOLDER = 'EX: 99MOTORISTA';
const ROTULO_CAMPO = 'TOKEN DE ATIVAÇÃO';
const ROTULO_BOTAO = 'Ativar agora';
const AVISO =
  'Após a ativação, o app abrirá diretamente na próxima vez que você entrar. Sem necessidade de novo token.';

const ERROS: Record<string, string> = {
  vazio: 'Digite o token de ativação.',
  invalido: 'Token inválido. Confira e tente de novo.',
  jaUsado: 'Este token já foi utilizado. Peça um novo token.',
  falhaAoGravar:
    'Não foi possível salvar a ativação neste aparelho. Tente de novo.',
};

// ---------------------------------------------------------------------------

export default function Ativacao() {
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const ativar = useCallback(async () => {
    if (enviando) return;
    Keyboard.dismiss();
    setEnviando(true);
    setErro(null);

    const resultado = await ativarComToken(token);

    if (resultado === 'ok') {
      // `replace`: ativar não é um passo ao qual se volta. Sem isto, o gesto
      // de voltar do Android traria a tela do portão de volta por cima do
      // mapa já liberado.
      router.replace(ROTAS.mapa);
      return;
    }

    setErro(ERROS[resultado] ?? ERROS.invalido);
    setEnviando(false);
  }, [enviando, token]);

  return (
    <View style={estilos.tela}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={estilos.flex}
        // Só o iOS empurra o conteúdo; no Android o `adjustResize` do sistema
        // já cuida disso e somar os dois faz a tela saltar.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={estilos.flex}
          contentContainerStyle={[
            estilos.conteudo,
            {
              paddingTop: insets.top + ESPACO_TOPO,
              paddingBottom: insets.bottom + ESPACO_BASE_AVISO,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          // Em telas baixas com o teclado aberto o formulário precisa rolar;
          // em telas altas ele fica parado, com o aviso empurrado para a base
          // pelo `flexGrow` do `conteudo`.
          showsVerticalScrollIndicator={false}
        >
          {/* ---- Marca ---- */}
          <View style={estilos.logo}>
            <Text style={estilos.logoTexto}>99</Text>
          </View>

          <Text style={estilos.titulo}>{TITULO}</Text>

          <Text style={estilos.subtitulo}>
            Digite o <Text style={estilos.subtituloForte}>token de ativação</Text>{' '}
            para começar a usar o 99 Motorista. Cada token é de uso único e
            válido por {DIAS_VALIDADE_PADRAO} dias.
          </Text>

          {/* ---- Campo ---- */}
          <View style={estilos.blocoCampo}>
            <Text style={estilos.rotuloCampo}>{ROTULO_CAMPO}</Text>

            <TextInput
              value={token}
              onChangeText={(t) => {
                setToken(t);
                if (erro) setErro(null);
              }}
              placeholder={PLACEHOLDER}
              placeholderTextColor={cores.neutro400}
              style={[estilos.campo, erro ? estilos.campoComErro : null]}
              // Token é código: nada de correção, de maiúscula automática de
              // frase nem de sugestão de senha.
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              returnKeyType="go"
              onSubmitEditing={ativar}
              editable={!enviando}
              accessibilityLabel={ROTULO_CAMPO}
            />

            {erro ? (
              <Text style={estilos.erro} accessibilityLiveRegion="polite">
                {erro}
              </Text>
            ) : null}
          </View>

          <Botao
            rotulo={ROTULO_BOTAO}
            onPress={ativar}
            carregando={enviando}
            altura={ALTURA_CAMPO}
            estilo={estilos.botao}
          />

          {/* Empurra o aviso para a base quando sobra altura. */}
          <View style={estilos.espacador} />

          {/* ---- Aviso ---- */}
          <View style={estilos.aviso}>
            <View style={estilos.avisoIcone}>
              <Text style={estilos.avisoIconeTexto}>i</Text>
            </View>
            <Text style={estilos.avisoTexto}>{AVISO}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Splash por cima, como no mapa: aparece uma vez por abertura do app. */}
      <CoberturaSplash />
    </View>
  );
}

// ---------------------------------------------------------------------------

const estilos = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.neutro0,
  },
  flex: {
    flex: 1,
  },
  conteudo: {
    // `flexGrow` e não `flex`: o conteúdo precisa poder crescer além da tela
    // quando o teclado abre, e é isso que faz o `espacador` funcionar.
    flexGrow: 1,
    paddingHorizontal: MARGEM_LATERAL,
  },

  // ---- Marca --------------------------------------------------------------

  logo: {
    alignSelf: 'center',
    width: DIAMETRO_LOGO,
    height: DIAMETRO_LOGO,
    borderRadius: raioPill,
    backgroundColor: cores.amareloSplash,
    alignItems: 'center',
    justifyContent: 'center',
    ...BRILHO_LARANJA,
  },
  logoTexto: {
    fontFamily: familiaInter.extraBold,
    fontSize: FONTE_LOGO,
    fontWeight: '800',
    // -.03em de 36px ≈ -1px, o mesmo aperto do monograma da splash.
    letterSpacing: -1,
    lineHeight: FONTE_LOGO * 1.2,
    color: cores.neutro0,
  },

  titulo: {
    ...tipografia.tituloLg,
    marginTop: ESPACO_APOS_LOGO,
    textAlign: 'center',
    color: cores.neutro900,
  },
  subtitulo: {
    ...tipografia.corpoMd,
    // Entrelinha mais folgada que os 20 do token: são três linhas centradas de
    // texto corrido, e o respiro é o que as mantém legíveis como parágrafo.
    lineHeight: 23,
    marginTop: 12,
    textAlign: 'center',
    color: cores.neutro600,
  },
  subtituloForte: {
    fontFamily: familiaInter.bold,
    fontWeight: '700',
    color: cores.neutro900,
  },

  // ---- Campo --------------------------------------------------------------

  blocoCampo: {
    marginTop: 36,
  },
  rotuloCampo: {
    ...tipografia.labelChip,
    fontSize: 13,
    letterSpacing: 0.8,
    color: cores.neutro600,
  },
  campo: {
    marginTop: 10,
    height: ALTURA_CAMPO,
    borderRadius: RAIO_CAMPO,
    borderWidth: 1,
    borderColor: cores.neutro200,
    backgroundColor: cores.neutroCampo,
    paddingHorizontal: 18,
    ...tipografia.corpoMd,
    letterSpacing: 1.2,
    color: cores.neutro900,
  },
  campoComErro: {
    borderColor: cores.erro500,
  },
  erro: {
    ...tipografia.corpoSm,
    marginTop: 8,
    color: cores.erro500,
  },

  botao: {
    marginTop: 24,
    ...BRILHO_AMARELO,
  },

  espacador: {
    flexGrow: 1,
    // Piso para o aviso não colar no botão em tela curta.
    minHeight: 32,
  },

  // ---- Aviso --------------------------------------------------------------

  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: raioCard,
    backgroundColor: cores.amarelo100,
  },
  avisoIcone: {
    width: DIAMETRO_ICONE_AVISO,
    height: DIAMETRO_ICONE_AVISO,
    borderRadius: raioPill,
    backgroundColor: cores.amareloSplash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoIconeTexto: {
    fontFamily: familiaInter.bold,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 18,
    color: cores.neutro0,
  },
  avisoTexto: {
    ...tipografia.corpoSm,
    flex: 1,
    lineHeight: 19,
    color: cores.dinamicoFaixaTexto,
  },
});
