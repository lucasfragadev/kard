import { pool } from '../database.js';

export interface Categoria {
  id: number;
  nome: string;
  cor?: string;
  icone?: string;
  descricao?: string;
  usuario_id: number;
  ativa: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CriarCategoriaDTO {
  nome: string;
  cor?: string;
  icone?: string;
  descricao?: string;
  usuario_id: number;
}

export interface AtualizarCategoriaDTO {
  nome?: string;
  cor?: string;
  icone?: string;
  descricao?: string;
  ativa?: boolean;
}

/**
 * Buscar todas as categorias de um usuário
 */
export async function buscarCategorias(usuarioId: number): Promise<Categoria[]> {
  const query = `
    SELECT id, nome, cor, icone, descricao, usuario_id, ativa, created_at, updated_at
    FROM categorias
    WHERE usuario_id = $1
    ORDER BY nome ASC
  `;

  const result = await pool.query(query, [usuarioId]);
  return result.rows;
}

/**
 * Buscar categoria por ID
 */
export async function buscarCategoriaPorId(categoriaId: number, usuarioId: number): Promise<Categoria | null> {
  const query = `
    SELECT id, nome, cor, icone, descricao, usuario_id, ativa, created_at, updated_at
    FROM categorias
    WHERE id = $1 AND usuario_id = $2
  `;

  const result = await pool.query(query, [categoriaId, usuarioId]);
  return result.rows[0] || null;
}

/**
 * Buscar categoria por nome
 */
export async function buscarCategoriaPorNome(nome: string, usuarioId: number): Promise<Categoria | null> {
  const query = `
    SELECT id, nome, cor, icone, descricao, usuario_id, ativa, created_at, updated_at
    FROM categorias
    WHERE LOWER(nome) = LOWER($1) AND usuario_id = $2
  `;

  const result = await pool.query(query, [nome, usuarioId]);
  return result.rows[0] || null;
}

/**
 * Criar nova categoria
 */
export async function criarCategoria(dados: CriarCategoriaDTO): Promise<Categoria> {
  const query = `
    INSERT INTO categorias (nome, cor, icone, descricao, usuario_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, nome, cor, icone, descricao, usuario_id, ativa, created_at, updated_at
  `;

  const valores = [
    dados.nome,
    dados.cor || null,
    dados.icone || null,
    dados.descricao || null,
    dados.usuario_id
  ];

  const result = await pool.query(query, valores);
  return result.rows[0];
}

/**
 * Atualizar categoria
 */
export async function atualizarCategoria(
  categoriaId: number,
  usuarioId: number,
  dados: AtualizarCategoriaDTO
): Promise<Categoria | null> {
  const campos: string[] = [];
  const valores: any[] = [];
  let paramIndex = 1;

  if (dados.nome !== undefined) {
    campos.push(`nome = $${paramIndex}`);
    valores.push(dados.nome);
    paramIndex++;
  }

  if (dados.cor !== undefined) {
    campos.push(`cor = $${paramIndex}`);
    valores.push(dados.cor);
    paramIndex++;
  }

  if (dados.icone !== undefined) {
    campos.push(`icone = $${paramIndex}`);
    valores.push(dados.icone);
    paramIndex++;
  }

  if (dados.descricao !== undefined) {
    campos.push(`descricao = $${paramIndex}`);
    valores.push(dados.descricao);
    paramIndex++;
  }

  if (dados.ativa !== undefined) {
    campos.push(`ativa = $${paramIndex}`);
    valores.push(dados.ativa);
    paramIndex++;
  }

  if (campos.length === 0) {
    return await buscarCategoriaPorId(categoriaId, usuarioId);
  }

  campos.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE categorias
    SET ${campos.join(', ')}
    WHERE id = $${paramIndex} AND usuario_id = $${paramIndex + 1}
    RETURNING id, nome, cor, icone, descricao, usuario_id, ativa, created_at, updated_at
  `;

  valores.push(categoriaId, usuarioId);

  const result = await pool.query(query, valores);
  return result.rows[0] || null;
}

/**
 * Deletar categoria
 */
export async function deletarCategoria(categoriaId: number, usuarioId: number): Promise<boolean> {
  const query = `
    DELETE FROM categorias
    WHERE id = $1 AND usuario_id = $2
  `;

  const result = await pool.query(query, [categoriaId, usuarioId]);
  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Ativar/Desativar categoria
 */
export async function toggleAtiva(categoriaId: number, usuarioId: number): Promise<Categoria | null> {
  const query = `
    UPDATE categorias
    SET ativa = NOT ativa, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND usuario_id = $2
    RETURNING id, nome, cor, icone, descricao, usuario_id, ativa, created_at, updated_at
  `;

  const result = await pool.query(query, [categoriaId, usuarioId]);
  return result.rows[0] || null;
}

/**
 * Contar atividades por categoria
 */
export async function contarAtividadesPorCategoria(categoriaId: number, usuarioId: number): Promise<number> {
  const query = `
    SELECT COUNT(*) as total
    FROM atividades
    WHERE categoria_id = $1 AND usuario_id = $2
  `;

  const result = await pool.query(query, [categoriaId, usuarioId]);
  return parseInt(result.rows[0].total);
}