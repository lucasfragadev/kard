// ============================================
// VALIDAÇÃO DE DADOS DE AUTENTICAÇÃO
// ============================================

// Tipo melhorado para resultado de validação usando union types
type ResultadoValidacao = 
  | { success: true }
  | { success: false; error: string };

/**
 * Validar dados de registro de usuário
 * @param dados - Dados do registro (nome, email, senha)
 * @returns Resultado da validação
 */
export function validarRegistro(dados: {
  nome?: string;
  email?: string;
  senha?: string;
}): ResultadoValidacao {
  const { nome, email, senha } = dados;

  // Validar nome
  if (!nome || nome.trim() === '') {
    return {
      success: false,
      error: 'Nome é obrigatório.'
    };
  }

  if (nome.trim().length < 3) {
    return {
      success: false,
      error: 'O nome deve ter no mínimo 3 caracteres.'
    };
  }

  // Validar email
  if (!email || email.trim() === '') {
    return {
      success: false,
      error: 'E-mail é obrigatório.'
    };
  }

  if (!validarEmail(email)) {
    return {
      success: false,
      error: 'E-mail inválido.'
    };
  }

  // Validar senha
  if (!senha || senha.trim() === '') {
    return {
      success: false,
      error: 'Senha é obrigatória.'
    };
  }

  // Validação de força de senha
  const resultadoSenha = validarSenha(senha);
  if (!resultadoSenha.success) {
    return resultadoSenha;
  }

  return { success: true };
}

/**
 * Validar dados de login
 * @param dados - Dados do login (email, senha)
 * @returns Resultado da validação
 */
export function validarLogin(dados: {
  email?: string;
  senha?: string;
}): ResultadoValidacao {
  const { email, senha } = dados;

  // Validar email
  if (!email || email.trim() === '') {
    return {
      success: false,
      error: 'E-mail é obrigatório.'
    };
  }

  if (!validarEmail(email)) {
    return {
      success: false,
      error: 'E-mail inválido.'
    };
  }

  // Validar senha
  if (!senha || senha.trim() === '') {
    return {
      success: false,
      error: 'Senha é obrigatória.'
    };
  }

  return { success: true };
}

/**
 * Validar dados de alteração de senha
 * @param dados - Dados da alteração (senhaAtual, novaSenha, confirmacaoSenha)
 * @returns Resultado da validação
 */
export function validarAlteracaoSenha(dados: {
  senhaAtual?: string;
  novaSenha?: string;
  confirmacaoSenha?: string;
}): ResultadoValidacao {
  const { senhaAtual, novaSenha, confirmacaoSenha } = dados;

  // Validar senha atual
  if (!senhaAtual || senhaAtual.trim() === '') {
    return {
      success: false,
      error: 'Senha atual é obrigatória.'
    };
  }

  // Validar nova senha
  if (!novaSenha || novaSenha.trim() === '') {
    return {
      success: false,
      error: 'Nova senha é obrigatória.'
    };
  }

  // Validação de força da nova senha
  const resultadoSenha = validarSenha(novaSenha);
  if (!resultadoSenha.success) {
    return resultadoSenha;
  }

  // Validar confirmação de senha
  if (!confirmacaoSenha || confirmacaoSenha.trim() === '') {
    return {
      success: false,
      error: 'Confirmação de senha é obrigatória.'
    };
  }

  // Verificar se as senhas coincidem
  if (novaSenha !== confirmacaoSenha) {
    return {
      success: false,
      error: 'As senhas não coincidem.'
    };
  }

  // Verificar se a nova senha é diferente da atual
  if (senhaAtual === novaSenha) {
    return {
      success: false,
      error: 'A nova senha deve ser diferente da senha atual.'
    };
  }

  return { success: true };
}

/**
 * Validar dados de redefinição de senha
 * @param dados - Dados da redefinição (token, novaSenha, confirmacaoSenha)
 * @returns Resultado da validação
 */
export function validarRedefinicaoSenha(dados: {
  token?: string;
  novaSenha?: string;
  confirmacaoSenha?: string;
}): ResultadoValidacao {
  const { token, novaSenha, confirmacaoSenha } = dados;

  // Validar token
  if (!token || token.trim() === '') {
    return {
      success: false,
      error: 'Token é obrigatório.'
    };
  }

  // Validar nova senha
  if (!novaSenha || novaSenha.trim() === '') {
    return {
      success: false,
      error: 'Nova senha é obrigatória.'
    };
  }

  // Validação de força da nova senha
  const resultadoSenha = validarSenha(novaSenha);
  if (!resultadoSenha.success) {
    return resultadoSenha;
  }

  // Validar confirmação de senha
  if (!confirmacaoSenha || confirmacaoSenha.trim() === '') {
    return {
      success: false,
      error: 'Confirmação de senha é obrigatória.'
    };
  }

  // Verificar se as senhas coincidem
  if (novaSenha !== confirmacaoSenha) {
    return {
      success: false,
      error: 'As senhas não coincidem.'
    };
  }

  return { success: true };
}

/**
 * Validar solicitação de recuperação de senha
 * @param dados - Dados da solicitação (email)
 * @returns Resultado da validação
 */
export function validarSolicitacaoRecuperacao(dados: {
  email?: string;
}): ResultadoValidacao {
  const { email } = dados;

  // Validar email
  if (!email || email.trim() === '') {
    return {
      success: false,
      error: 'E-mail é obrigatório.'
    };
  }

  if (!validarEmail(email)) {
    return {
      success: false,
      error: 'E-mail inválido.'
    };
  }

  return { success: true };
}

/**
 * Validar formato de email
 * @param email - Email a ser validado
 * @returns true se o email for válido, false caso contrário
 */
function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar força da senha
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial
 * @param senha - Senha a ser validada
 * @returns Resultado da validação
 */
function validarSenha(senha: string): ResultadoValidacao {
  // Validar tamanho mínimo
  if (senha.length < 8) {
    return {
      success: false,
      error: 'A senha deve ter no mínimo 8 caracteres.'
    };
  }

  // Validar letra maiúscula
  if (!/[A-Z]/.test(senha)) {
    return {
      success: false,
      error: 'A senha deve conter pelo menos uma letra maiúscula.'
    };
  }

  // Validar letra minúscula
  if (!/[a-z]/.test(senha)) {
    return {
      success: false,
      error: 'A senha deve conter pelo menos uma letra minúscula.'
    };
  }

  // Validar número
  if (!/[0-9]/.test(senha)) {
    return {
      success: false,
      error: 'A senha deve conter pelo menos um número.'
    };
  }

  // Validar caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    return {
      success: false,
      error: 'A senha deve conter pelo menos um caractere especial.'
    };
  }

  return { success: true };
}