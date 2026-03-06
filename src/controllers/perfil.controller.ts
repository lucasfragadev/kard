import { Request, Response, NextFunction } from 'express';
import { pool } from '../database.js';
import { validatePreferences } from '../validators/perfil.validator.js';
import logger from '../utils/logger.js';
import { generalCache } from '../cache/cache.service.js';
import { buildUpdateQuery, validateFieldSizes } from '../utils/queryBuilder.js';
import { UpdateProfileDto, UserProfileDto } from '../dtos/perfil.dto.js';

/**
 * Obter perfil do usuário autenticado
 */
export const obterPerfil = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const usuarioId = (req as any).user.id;
    const cacheKey = `user:profile:${usuarioId}`;

    // Tentar obter do cache
    const cached = generalCache.get<UserProfileDto>(cacheKey);
    if (cached) {
      logger.info('Perfil obtido do cache', { userId: usuarioId });
      res.status(200).json({
        success: true,
        data: cached
      });
      return;
    }

    const query = `
      SELECT id, nome, email, foto, bio, preferencias, created_at, updated_at
      FROM usuarios
      WHERE id = $1
      LIMIT 1
    `;
    
    const result = await pool.query(query, [usuarioId]);
    const usuario = result.rows[0];

    if (!usuario) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
      return;
    }

    // Garantir que preferencias seja um objeto
    if (typeof usuario.preferencias === 'string') {
      try {
        usuario.preferencias = JSON.parse(usuario.preferencias);
      } catch (e) {
        logger.warn('Erro ao fazer parse de preferencias', {
          userId: usuarioId,
          error: (e as Error).message,
          rawValue: usuario.preferencias
        });
        usuario.preferencias = {};
      }
    }

    // Salvar no cache (5 minutos)
    generalCache.set(cacheKey, usuario, { ttl: 300 });

    logger.info('Perfil obtido com sucesso', { userId: usuarioId });

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    logger.error('Erro ao obter perfil', {
      userId: (req as any).user?.id,
      errorMessage: (error as Error).message,
      errorCode: (error as any).code
    });
    next(error);
  }
};

/**
 * Atualizar perfil do usuário autenticado
 */
export const atualizarPerfil = async (
  req: Request<{}, {}, UpdateProfileDto>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let client;

  try {
    client = await pool.connect();
    const usuarioId = (req as any).user.id;
    const { nome, foto, bio, preferencias } = req.body;

    // Validações básicas
    if (!nome && !foto && bio === undefined && preferencias === undefined) {
      res.status(400).json({
        success: false,
        error: 'Nenhum campo para atualizar foi fornecido'
      });
      return;
    }

    // Validar tamanhos de campos
    if (nome !== undefined) {
      const validation = validateFieldSizes.nome(nome);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: validation.error
        });
        return;
      }
    }

    if (bio !== undefined && bio !== null) {
      const validation = validateFieldSizes.bio(bio);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: validation.error
        });
        return;
      }
    }

    if (foto !== undefined && foto !== null) {
      const validation = validateFieldSizes.foto(foto);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: validation.error
        });
        return;
      }
    }

    // Validar estrutura de preferencias
    if (preferencias !== undefined) {
      if (typeof preferencias !== 'object' || Array.isArray(preferencias)) {
        res.status(400).json({
          success: false,
          error: 'Preferências devem ser um objeto válido'
        });
        return;
      }

      if (!validatePreferences(preferencias)) {
        res.status(400).json({
          success: false,
          error: 'Estrutura de preferências inválida. Verifique os campos: theme (light|dark|auto|high-contrast), notifications (email, push, deadline), language'
        });
        return;
      }
    }

    await client.query('BEGIN');

    // Construir query dinamicamente usando query builder
    const { query, values } = buildUpdateQuery(
      'usuarios',
      {
        nome,
        foto,
        bio,
        preferencias: preferencias ? JSON.stringify(preferencias) : undefined
      },
      'id',
      usuarioId
    );

    const result = await client.query(query, values);

    if (!result.rows[0]) {
      await client.query('ROLLBACK');
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
      return;
    }

    await client.query('COMMIT');

    const usuarioAtualizado = result.rows[0];

    // Parse de preferencias
    if (typeof usuarioAtualizado.preferencias === 'string') {
      try {
        usuarioAtualizado.preferencias = JSON.parse(usuarioAtualizado.preferencias);
      } catch (e) {
        logger.warn('Erro ao fazer parse de preferencias após update', {
          userId: usuarioId,
          error: (e as Error).message,
          rawValue: usuarioAtualizado.preferencias
        });
        usuarioAtualizado.preferencias = {};
      }
    }

    // Invalidar cache
    const cacheKey = `user:profile:${usuarioId}`;
    generalCache.delete(cacheKey);

    logger.info('Perfil atualizado com sucesso', { 
      userId: usuarioId,
      updatedFields: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: usuarioAtualizado
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }

    // Tratar erros específicos do PostgreSQL
    const pgError = error as any;

    if (pgError.code === '23505') {
      // Violação de constraint único
      res.status(409).json({
        success: false,
        error: 'Conflito: valor duplicado'
      });
      return;
    }

    if (pgError.code === '23503') {
      // Violação de foreign key
      res.status(400).json({
        success: false,
        error: 'Referência inválida'
      });
      return;
    }

    logger.error('Erro ao atualizar perfil', {
      userId: (req as any).user?.id,
      errorMessage: (error as Error).message,
      errorCode: pgError.code
    });

    next(error);
  } finally {
    if (client) {
      client.release();
    }
  }
};