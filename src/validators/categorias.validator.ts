interface ValidationResult {
  success: boolean;
  error?: string;
}

interface CriarCategoriaData {
  nome: string;
  cor?: string;
  icone?: string;
  descricao?: string;
}

interface AtualizarCategoriaData {
  nome?: string;
  cor?: string;
  icone?: string;
  descricao?: string;
  ativa?: boolean;
}

/**
 * Validar formato hexadecimal de cor
 */
function validarCor(cor: string): boolean {
  const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
  return hexColorRegex.test(cor);
}

/**
 * Validar criação de categoria
 */
export function validarCriacaoCategoria(dados: CriarCategoriaData): ValidationResult {
  const { nome, cor, icone, descricao } = dados;

  // Validar nome
  if (!nome || nome.trim().length === 0) {
    return {
      success: false,
      error: 'Nome da categoria é obrigatório.'
    };
  }

  if (nome.length > 100) {
    return {
      success: false,
      error: 'Nome da categoria deve ter no máximo 100 caracteres.'
    };
  }

  // Validar cor (se fornecida)
  if (cor && !validarCor(cor)) {
    return {
      success: false,
      error: 'Cor inválida. Use o formato hexadecimal (ex: #FF5733).'
    };
  }

  // Validar ícone (se fornecido)
  if (icone && icone.length > 50) {
    return {
      success: false,
      error: 'Ícone deve ter no máximo 50 caracteres.'
    };
  }

  // Validar descrição (se fornecida)
  if (descricao && descricao.length > 500) {
    return {
      success: false,
      error: 'Descrição deve ter no máximo 500 caracteres.'
    };
  }

  return { success: true };
}

/**
 * Validar atualização de categoria
 */
export function validarAtualizacaoCategoria(dados: AtualizarCategoriaData): ValidationResult {
  const { nome, cor, icone, descricao, ativa } = dados;

  // Verificar se pelo menos um campo foi fornecido
  if (nome === undefined && cor === undefined && icone === undefined && 
      descricao === undefined && ativa === undefined) {
    return {
      success: false,
      error: 'Nenhum campo para atualizar foi fornecido.'
    };
  }

  // Validar nome (se fornecido)
  if (nome !== undefined) {
    if (!nome || nome.trim().length === 0) {
      return {
        success: false,
        error: 'Nome da categoria não pode ser vazio.'
      };
    }

    if (nome.length > 100) {
      return {
        success: false,
        error: 'Nome da categoria deve ter no máximo 100 caracteres.'
      };
    }
  }

  // Validar cor (se fornecida)
  if (cor !== undefined && cor !== null && cor.trim() !== '' && !validarCor(cor)) {
    return {
      success: false,
      error: 'Cor inválida. Use o formato hexadecimal (ex: #FF5733).'
    };
  }

  // Validar ícone (se fornecido)
  if (icone !== undefined && icone !== null && icone.length > 50) {
    return {
      success: false,
      error: 'Ícone deve ter no máximo 50 caracteres.'
    };
  }

  // Validar descrição (se fornecida)
  if (descricao !== undefined && descricao !== null && descricao.length > 500) {
    return {
      success: false,
      error: 'Descrição deve ter no máximo 500 caracteres.'
    };
  }

  // Validar ativa (se fornecido)
  if (ativa !== undefined && typeof ativa !== 'boolean') {
    return {
      success: false,
      error: 'O campo ativa deve ser um valor booleano.'
    };
  }

  return { success: true };
}