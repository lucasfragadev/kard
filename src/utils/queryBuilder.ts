/**
 * Query Builder - Utilitário para construção dinâmica de queries SQL
 * Facilita a criação de queries UPDATE com campos opcionais
 */

export interface QueryBuilder {
  query: string;
  values: any[];
}

/**
 * Constrói uma query UPDATE dinâmica
 * @param tableName - Nome da tabela
 * @param fields - Objeto com campos a serem atualizados
 * @param whereField - Campo da cláusula WHERE
 * @param whereValue - Valor da cláusula WHERE
 * @returns Query SQL e array de valores
 */
export function buildUpdateQuery(
  tableName: string,
  fields: Record<string, any>,
  whereField: string,
  whereValue: any
): QueryBuilder {
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  // Adicionar updated_at automaticamente
  updates.push('updated_at = CURRENT_TIMESTAMP');

  const query = `
    UPDATE ${tableName}
    SET ${updates.join(', ')}
    WHERE ${whereField} = $${paramIndex}
    RETURNING *
  `;
  
  values.push(whereValue);

  return { query, values };
}

/**
 * Valida tamanhos de campos
 */
export const validateFieldSizes = {
  nome: (value: string): { valid: boolean; error?: string } => {
    if (value.trim().length > 255) {
      return { valid: false, error: 'Nome deve ter no máximo 255 caracteres' };
    }
    return { valid: true };
  },
  
  bio: (value: string): { valid: boolean; error?: string } => {
    if (value.length > 1000) {
      return { valid: false, error: 'Bio deve ter no máximo 1000 caracteres' };
    }
    return { valid: true };
  },
  
  foto: (value: string): { valid: boolean; error?: string } => {
    if (value.length > 2048) {
      return { valid: false, error: 'URL da foto muito longa (máximo 2048 caracteres)' };
    }
    return { valid: true };
  }
};