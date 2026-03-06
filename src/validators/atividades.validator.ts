interface ValidationResult {
  success: boolean;
  error?: string;
}

/**
 * Valida os dados para criação de atividade
 */
export function validarCriacaoAtividade(dados: {
  data: string;
  categoria: string;
  descricao: string;
  importante?: boolean;
}): ValidationResult {
  const { data, categoria, descricao, importante } = dados;

  // Validar data
  if (!data || data.trim() === '') {
    return {
      success: false,
      error: 'Data é obrigatória.'
    };
  }

  // Validar formato de data (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data)) {
    return {
      success: false,
      error: 'Data deve estar no formato YYYY-MM-DD.'
    };
  }

  // Validar categoria
  if (!categoria || categoria.trim() === '') {
    return {
      success: false,
      error: 'Categoria é obrigatória.'
    };
  }

  if (categoria.trim().length < 3) {
    return {
      success: false,
      error: 'Categoria deve ter no mínimo 3 caracteres.'
    };
  }

  if (categoria.trim().length > 50) {
    return {
      success: false,
      error: 'Categoria deve ter no máximo 50 caracteres.'
    };
  }

  // Validar descrição
  if (!descricao || descricao.trim() === '') {
    return {
      success: false,
      error: 'Descrição é obrigatória.'
    };
  }

  if (descricao.trim().length < 5) {
    return {
      success: false,
      error: 'Descrição deve ter no mínimo 5 caracteres.'
    };
  }

  if (descricao.trim().length > 500) {
    return {
      success: false,
      error: 'Descrição deve ter no máximo 500 caracteres.'
    };
  }

  // Validar importante (se fornecido)
  if (importante !== undefined && typeof importante !== 'boolean') {
    return {
      success: false,
      error: 'O campo "importante" deve ser booleano.'
    };
  }

  return { success: true };
}

/**
 * Valida os dados para atualização de atividade
 */
export function validarAtualizacaoAtividade(dados: {
  data?: string;
  categoria?: string;
  descricao?: string;
  importante?: boolean;
}): ValidationResult {
  const { data, categoria, descricao, importante } = dados;

  // Verificar se pelo menos um campo foi fornecido
  if (data === undefined && categoria === undefined && descricao === undefined && importante === undefined) {
    return {
      success: false,
      error: 'Nenhum campo para atualizar foi fornecido.'
    };
  }

  // Validar data (se fornecida)
  if (data !== undefined) {
    if (data.trim() === '') {
      return {
        success: false,
        error: 'Data não pode ser vazia.'
      };
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data)) {
      return {
        success: false,
        error: 'Data deve estar no formato YYYY-MM-DD.'
      };
    }
  }

  // Validar categoria (se fornecida)
  if (categoria !== undefined) {
    if (categoria.trim() === '') {
      return {
        success: false,
        error: 'Categoria não pode ser vazia.'
      };
    }

    if (categoria.trim().length < 3) {
      return {
        success: false,
        error: 'Categoria deve ter no mínimo 3 caracteres.'
      };
    }

    if (categoria.trim().length > 50) {
      return {
        success: false,
        error: 'Categoria deve ter no máximo 50 caracteres.'
      };
    }
  }

  // Validar descrição (se fornecida)
  if (descricao !== undefined) {
    if (descricao.trim() === '') {
      return {
        success: false,
        error: 'Descrição não pode ser vazia.'
      };
    }

    if (descricao.trim().length < 5) {
      return {
        success: false,
        error: 'Descrição deve ter no mínimo 5 caracteres.'
      };
    }

    if (descricao.trim().length > 500) {
      return {
        success: false,
        error: 'Descrição deve ter no máximo 500 caracteres.'
      };
    }
  }

  // Validar importante (se fornecido)
  if (importante !== undefined && typeof importante !== 'boolean') {
    return {
      success: false,
      error: 'O campo "importante" deve ser booleano.'
    };
  }

  return { success: true };
}