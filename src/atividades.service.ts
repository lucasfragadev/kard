import { pool } from './database.js';
import { QueryResult } from 'pg';

export interface Atividade {
  id: number;
  data: string;
  categoria: string;
  descricao: string;
  importante: boolean;
  finalizada: boolean;
  ordem: number;
  usuario_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface FiltrosAtividade {
  categoria?: string;
  finalizada?: boolean;
  importante?: boolean;
  data?: string;
}

// Cache simples para otimização
let cacheAtividades: Map<number, { data: Atividade[], timestamp: number }> = new Map();
const CACHE_TTL = 60000; // 1 minuto

function limparCache(usuarioId: number): void {
  cacheAtividades.delete(usuarioId);
}

function obterCache(usuarioId: number): Atividade[] | null {
  const cached = cacheAtividades.get(usuarioId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function salvarCache(usuarioId: number, data: Atividade[]): void {
  cacheAtividades.set(usuarioId, { data, timestamp: Date.now() });
}

export async function buscarAtividades(usuarioId: number): Promise<Atividade[]> {
  // Verificar cache
  const cached = obterCache(usuarioId);
  if (cached) {
    return cached;
  }

  const query = `
    SELECT id, data, categoria, descricao, importante, finalizada, ordem, usuario_id, created_at, updated_at
    FROM atividades
    WHERE usuario_id = $1
    ORDER BY ordem ASC, created_at DESC
  `;
  
  const result: QueryResult<Atividade> = await pool.query(query, [usuarioId]);
  const atividades: Atividade[] = result.rows;
  
  // Salvar no cache
  salvarCache(usuarioId, atividades);
  
  return atividades;
}

export async function buscarAtividadesComFiltros(
  usuarioId: number,
  filtros: FiltrosAtividade
): Promise<Atividade[]> {
  const conditions: string[] = ['usuario_id = $1'];
  const valores: any[] = [usuarioId];
  let paramIndex = 2;

  if (filtros.categoria) {
    conditions.push(`categoria = $${paramIndex}`);
    valores.push(filtros.categoria);
    paramIndex++;
  }

  if (filtros.finalizada !== undefined) {
    conditions.push(`finalizada = $${paramIndex}`);
    valores.push(filtros.finalizada);
    paramIndex++;
  }

  if (filtros.importante !== undefined) {
    conditions.push(`importante = $${paramIndex}`);
    valores.push(filtros.importante);
    paramIndex++;
  }

  if (filtros.data) {
    conditions.push(`data = $${paramIndex}`);
    valores.push(filtros.data);
    paramIndex++;
  }

  const query = `
    SELECT id, data, categoria, descricao, importante, finalizada, ordem, usuario_id, created_at, updated_at
    FROM atividades
    WHERE ${conditions.join(' AND ')}
    ORDER BY ordem ASC, created_at DESC
  `;

  const result: QueryResult<Atividade> = await pool.query(query, valores);
  const atividades: Atividade[] = result.rows;
  
  return atividades;
}

export async function buscarAtividadePorId(id: number, usuarioId: number): Promise<Atividade | null> {
  const query = `
    SELECT id, data, categoria, descricao, importante, finalizada, ordem, usuario_id, created_at, updated_at
    FROM atividades
    WHERE id = $1 AND usuario_id = $2
  `;
  
  const result: QueryResult<Atividade> = await pool.query(query, [id, usuarioId]);
  
  return result.rows[0] || null;
}

export async function criarAtividade(dados: Omit<Atividade, 'id' | 'created_at' | 'updated_at'>, usuarioId: number): Promise<Atividade> {
  // Buscar maior ordem para adicionar no final
  const maxOrdemResult = await pool.query(
    'SELECT COALESCE(MAX(ordem), 0) as max_ordem FROM atividades WHERE usuario_id = $1',
    [usuarioId]
  );
  
  const novaOrdem = (maxOrdemResult.rows[0]?.max_ordem || 0) + 1;

  const query = `
    INSERT INTO atividades (data, categoria, descricao, importante, finalizada, ordem, usuario_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, data, categoria, descricao, importante, finalizada, ordem, usuario_id, created_at, updated_at
  `;
  
  const valores = [
    dados.data,
    dados.categoria,
    dados.descricao,
    dados.importante || false,
    dados.finalizada || false,
    dados.ordem || novaOrdem,
    usuarioId
  ];

  const result: QueryResult<Atividade> = await pool.query(query, valores);
  
  // Limpar cache
  limparCache(usuarioId);
  
  return result.rows[0];
}

export async function atualizarAtividade(
  id: number,
  dados: Partial<Omit<Atividade, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>>,
  usuarioId: number
): Promise<Atividade | null> {
  const campos: string[] = [];
  const valores: any[] = [];
  let paramIndex = 1;

  if (dados.data !== undefined) {
    campos.push(`data = $${paramIndex}`);
    valores.push(dados.data);
    paramIndex++;
  }

  if (dados.categoria !== undefined) {
    campos.push(`categoria = $${paramIndex}`);
    valores.push(dados.categoria);
    paramIndex++;
  }

  if (dados.descricao !== undefined) {
    campos.push(`descricao = $${paramIndex}`);
    valores.push(dados.descricao);
    paramIndex++;
  }

  if (dados.importante !== undefined) {
    campos.push(`importante = $${paramIndex}`);
    valores.push(dados.importante);
    paramIndex++;
  }

  if (dados.finalizada !== undefined) {
    campos.push(`finalizada = $${paramIndex}`);
    valores.push(dados.finalizada);
    paramIndex++;
  }

  if (dados.ordem !== undefined) {
    campos.push(`ordem = $${paramIndex}`);
    valores.push(dados.ordem);
    paramIndex++;
  }

  if (campos.length === 0) {
    return await buscarAtividadePorId(id, usuarioId);
  }

  campos.push(`updated_at = NOW()`);
  valores.push(id, usuarioId);

  const query = `
    UPDATE atividades
    SET ${campos.join(', ')}
    WHERE id = $${paramIndex} AND usuario_id = $${paramIndex + 1}
    RETURNING id, data, categoria, descricao, importante, finalizada, ordem, usuario_id, created_at, updated_at
  `;

  const result: QueryResult<Atividade> = await pool.query(query, valores);
  
  // Limpar cache
  limparCache(usuarioId);
  
  return result.rows[0] || null;
}

export async function toggleAtividade(id: number, usuarioId: number): Promise<Atividade | null> {
  const query = `
    UPDATE atividades
    SET finalizada = NOT finalizada, updated_at = NOW()
    WHERE id = $1 AND usuario_id = $2
    RETURNING id, data, categoria, descricao, importante, finalizada, ordem, usuario_id, created_at, updated_at
  `;

  const result: QueryResult<Atividade> = await pool.query(query, [id, usuarioId]);
  
  // Limpar cache
  limparCache(usuarioId);
  
  return result.rows[0] || null;
}

export async function atualizarPrioridade(id: number, importante: boolean, usuarioId: number): Promise<Atividade | null> {
  const query = `
    UPDATE atividades
    SET importante = $1, updated_at = NOW()
    WHERE id = $2 AND usuario_id = $3
    RETURNING id, data, categoria, descricao, importante, finalizada, ordem, usuario_id, created_at, updated_at
  `;

  const result: QueryResult<Atividade> = await pool.query(query, [importante, id, usuarioId]);
  
  // Limpar cache
  limparCache(usuarioId);
  
  return result.rows[0] || null;
}

export async function removerAtividade(id: number, usuarioId: number): Promise<boolean> {
  const query = `
    DELETE FROM atividades
    WHERE id = $1 AND usuario_id = $2
    RETURNING id
  `;

  const result = await pool.query(query, [id, usuarioId]);
  
  // Limpar cache
  limparCache(usuarioId);
  
  return result.rowCount !== null && result.rowCount > 0;
}

export async function reordenarAtividades(usuarioId: number, ordens: { id: number; ordem: number }[]): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    for (const item of ordens) {
      await client.query(
        'UPDATE atividades SET ordem = $1, updated_at = NOW() WHERE id = $2 AND usuario_id = $3',
        [item.ordem, item.id, usuarioId]
      );
    }

    await client.query('COMMIT');
    
    // Limpar cache
    limparCache(usuarioId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}