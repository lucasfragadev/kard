import { pool } from '../database.js';

export interface Comentario {
  id?: number;
  atividade_id: number;
  usuario_id: number;
  conteudo: string;
  created_at?: Date;
  updated_at?: Date;
}

// Criar comentário
export async function criarComentario(dados: Omit<Comentario, 'id' | 'created_at' | 'updated_at'>): Promise<Comentario> {
  const query = `
    INSERT INTO comentarios (atividade_id, usuario_id, conteudo)
    VALUES ($1, $2, $3)
    RETURNING id, atividade_id, usuario_id, conteudo, created_at, updated_at
  `;

  const valores = [dados.atividade_id, dados.usuario_id, dados.conteudo];
  const result = await pool.query(query, valores);

  return result.rows[0];
}

// Buscar comentários por atividade
export async function buscarComentariosPorAtividade(atividadeId: number): Promise<Comentario[]> {
  const query = `
    SELECT c.id, c.atividade_id, c.usuario_id, c.conteudo, c.created_at, c.updated_at,
           u.nome as usuario_nome, u.email as usuario_email
    FROM comentarios c
    INNER JOIN usuarios u ON c.usuario_id = u.id
    WHERE c.atividade_id = $1
    ORDER BY c.created_at DESC
  `;

  const result = await pool.query(query, [atividadeId]);
  return result.rows;
}

// Buscar comentário por ID
export async function buscarComentarioPorId(comentarioId: number, usuarioId: number): Promise<Comentario | null> {
  const query = `
    SELECT id, atividade_id, usuario_id, conteudo, created_at, updated_at
    FROM comentarios
    WHERE id = $1 AND usuario_id = $2
  `;

  const result = await pool.query(query, [comentarioId, usuarioId]);
  return result.rows[0] || null;
}

// Atualizar comentário
export async function atualizarComentario(
  comentarioId: number,
  usuarioId: number,
  conteudo: string
): Promise<Comentario | null> {
  const query = `
    UPDATE comentarios
    SET conteudo = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND usuario_id = $3
    RETURNING id, atividade_id, usuario_id, conteudo, created_at, updated_at
  `;

  const result = await pool.query(query, [conteudo, comentarioId, usuarioId]);
  return result.rows[0] || null;
}

// Excluir comentário
export async function excluirComentario(comentarioId: number, usuarioId: number): Promise<boolean> {
  const query = `
    DELETE FROM comentarios
    WHERE id = $1 AND usuario_id = $2
  `;

  const result = await pool.query(query, [comentarioId, usuarioId]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Contar comentários por atividade
export async function contarComentariosPorAtividade(atividadeId: number): Promise<number> {
  const query = `
    SELECT COUNT(*) as total
    FROM comentarios
    WHERE atividade_id = $1
  `;

  const result = await pool.query(query, [atividadeId]);
  return parseInt(result.rows[0].total);
}