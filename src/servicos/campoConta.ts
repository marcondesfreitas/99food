/**
 * Especificação dos campos pessoais editáveis da tela de Perfil › Configurações
 * (B21) — rótulo, teclado, normalização e validação de cada um.
 *
 * Funcionalidade **nova**: no protótipo (`.design-import/logic.js` linha 567)
 * `camposPessoais` é uma lista morta — cada linha tem um `‹` desenhado mas
 * nenhum `onClick`, e "Cidade" é a string `'São Paulo'` cravada no template.
 * Nada ali é editável e não existe campo de nome.
 *
 * Este módulo existe separado da tela por dois motivos:
 *
 * 1. A tela precisa da lista para **desenhar** as linhas (rótulo + valor atual)
 *    e a folha de edição precisa da mesma entrada para **validar** o que foi
 *    digitado. Uma fonte só evita as duas cópias divergirem — foi o mesmo
 *    raciocínio que manteve `pixValido` exportado da store em vez de copiado
 *    dentro da tela de Pix (B19).
 * 2. Validação e formatação são lógica pura, testável sem montar componente.
 *
 * O tipo `KeyboardTypeOptions` e afins vêm do React Native, mas nada aqui
 * renderiza: são só os valores que a tela repassa ao `TextInput`.
 */

import type { KeyboardTypeOptions, TextInputProps } from 'react-native';

/**
 * Os campos editáveis. `senha` está na mesma lista porque ocupa uma linha
 * igual às outras na tela, mas é o único que **não** guarda o valor digitado
 * (ver `EspecCampo.segredo` e `motoristaStore.definirSenha`).
 */
export type CampoConta = 'nome' | 'tel' | 'email' | 'cidade' | 'senha';

export type EspecCampo = {
  /** Rótulo da linha na lista e título da folha de edição. */
  rotulo: string;
  /** Linha de apoio dentro da folha, explicando a regra do campo. */
  ajuda: string;
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
  autoCapitalize: TextInputProps['autoCapitalize'];
  autoComplete: TextInputProps['autoComplete'];
  maxLength: number;
  /**
   * Campo de senha: entrada mascarada, segunda caixa de confirmação e valor
   * **descartado** depois de validado (a store só registra que houve troca).
   */
  segredo?: boolean;
  /** Rótulo da caixa de confirmação. Só faz sentido junto de `segredo`. */
  confirmacao?: string;
  /**
   * Arruma o que foi digitado no momento de salvar — nunca a cada tecla, para
   * o cursor não pular enquanto a pessoa edita o meio do texto.
   */
  normalizar: (bruto: string) => string;
  /** `null` = válido. Qualquer string é a mensagem mostrada sob o campo. */
  validar: (valor: string) => string | null;
};

// ---- Auxiliares ---------------------------------------------------------------

/** Colapsa espaços repetidos e apara as pontas. */
function espacoUnico(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ');
}

/** Só os algarismos, na ordem em que aparecem. */
export function apenasDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

/**
 * Devolve os dígitos do número **sem** o código do país.
 *
 * Aceita as três formas que uma pessoa digita na prática: `11912345678`,
 * `5511912345678` e `+55 11 91234-5678`. O `55` só é descartado quando sobra
 * um número plausível sem ele (10 ou 11 dígitos) — assim um fixo de Brasília
 * começando por 55 não perde os dois primeiros algarismos.
 */
function digitosLocais(bruto: string): string {
  const digitos = apenasDigitos(bruto);
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) {
    return digitos.slice(2);
  }
  return digitos;
}

/**
 * `+55 11 91234-5678` (celular, 11 dígitos) ou `+55 11 2345-6789` (fixo, 10).
 * É o formato que a store já usava no valor inicial, mantido para o telefone
 * digitado sair igual ao que veio de fábrica.
 */
export function formatarTelefone(bruto: string): string {
  const d = digitosLocais(bruto);
  if (d.length !== 10 && d.length !== 11) return espacoUnico(bruto);
  const ddd = d.slice(0, 2);
  const corpo = d.slice(2);
  const corte = corpo.length - 4;
  return `+55 ${ddd} ${corpo.slice(0, corte)}-${corpo.slice(corte)}`;
}

// ---- Especificações -----------------------------------------------------------

export const CAMPOS_CONTA: Record<CampoConta, EspecCampo> = {
  nome: {
    rotulo: 'Nome',
    ajuda: 'É o nome que aparece no seu perfil e para os passageiros.',
    placeholder: 'Nome e sobrenome',
    keyboardType: 'default',
    autoCapitalize: 'words',
    autoComplete: 'name',
    maxLength: 60,
    normalizar: espacoUnico,
    validar: (valor) => {
      const limpo = espacoUnico(valor);
      if (limpo.length < 2) return 'Informe seu nome.';
      // Dígito em nome quase sempre é engano de teclado, não um nome válido.
      if (/\d/.test(limpo)) return 'Nome não pode conter números.';
      if (!limpo.includes(' ')) return 'Informe nome e sobrenome.';
      return null;
    },
  },

  tel: {
    rotulo: 'Número de telefone',
    ajuda: 'Com DDD. É por ele que o passageiro entra em contato.',
    placeholder: '+55 11 91234-5678',
    keyboardType: 'phone-pad',
    autoCapitalize: 'none',
    autoComplete: 'tel',
    maxLength: 20,
    normalizar: formatarTelefone,
    validar: (valor) => {
      const d = digitosLocais(valor);
      if (d.length === 0) return 'Informe seu telefone.';
      if (d.length !== 10 && d.length !== 11) {
        return 'Informe DDD e número (10 ou 11 dígitos).';
      }
      // DDD brasileiro nunca começa em 0 e não existe DDD 10..19 exceto 11..19
      // válidos; a regra simples que pega o erro real de digitação é o zero.
      if (d[0] === '0') return 'DDD inválido.';
      return null;
    },
  },

  email: {
    rotulo: 'E-mail',
    ajuda: 'Usado para avisos da conta e recuperação de senha.',
    placeholder: 'voce@exemplo.com',
    keyboardType: 'email-address',
    autoCapitalize: 'none',
    autoComplete: 'email',
    maxLength: 80,
    normalizar: (bruto) => bruto.trim().toLowerCase(),
    validar: (valor) => {
      const limpo = valor.trim();
      if (limpo.length === 0) return 'Informe seu e-mail.';
      // Deliberadamente frouxa: validar e-mail por regex "de verdade" é uma
      // caça impossível, e o que interessa aqui é pegar o erro de digitação
      // óbvio — sem @, sem domínio, com espaço no meio.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpo)) {
        return 'E-mail inválido.';
      }
      return null;
    },
  },

  cidade: {
    rotulo: 'Cidade',
    ajuda: 'A cidade onde você roda. Aparece no seu cadastro.',
    placeholder: 'São Paulo',
    keyboardType: 'default',
    autoCapitalize: 'words',
    autoComplete: 'off',
    maxLength: 40,
    normalizar: espacoUnico,
    validar: (valor) => {
      const limpo = espacoUnico(valor);
      if (limpo.length < 2) return 'Informe sua cidade.';
      if (/\d/.test(limpo)) return 'Cidade não pode conter números.';
      return null;
    },
  },

  senha: {
    rotulo: 'Senha',
    ajuda: 'Mínimo de 8 caracteres, com pelo menos uma letra e um número.',
    placeholder: 'Nova senha',
    keyboardType: 'default',
    autoCapitalize: 'none',
    autoComplete: 'new-password',
    maxLength: 64,
    segredo: true,
    confirmacao: 'Confirmar nova senha',
    // Senha é usada exatamente como digitada — aparar espaços mudaria a senha
    // sem a pessoa saber.
    normalizar: (bruto) => bruto,
    validar: (valor) => {
      if (valor.length === 0) return 'Informe a nova senha.';
      if (valor.length < 8) return 'A senha precisa de pelo menos 8 caracteres.';
      if (!/[A-Za-zÀ-ÿ]/.test(valor)) return 'Inclua pelo menos uma letra.';
      if (!/\d/.test(valor)) return 'Inclua pelo menos um número.';
      return null;
    },
  },
};

/** Ordem em que os campos aparecem na lista de "INFORMAÇÕES PESSOAIS". */
export const ORDEM_CAMPOS: CampoConta[] = ['nome', 'tel', 'email', 'cidade', 'senha'];

/** O que a linha mostra no lugar do valor quando o campo é secreto. */
export const MASCARA_SENHA = '••••••••';
