import { Request, Response, NextFunction } from 'express';
import {
  criarComentario,
  buscarComentariosPorAtividade,
  buscarComentarioPorId,
  atualizarComentario,
  excluirComentario,
  contarComentariosPorAtividade
} from '../services/comentarios.service.js';

// Listar comentários de uma atividade
export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const atividadeIdParam = req.params.atividadeId;
    const atividadeId = parseInt(Array.isArray(atividadeIdParam) ? atividadeIdParam[0] : atividadeIdParam);

    if (isNaN(atividadeId)) {
      res.status(400).json({
        success: false,
        error: 'ID da atividade inválido.'
      });
      return;
    }

    const comentarios = await buscarComentariosPorAtividade(atividadeId);

    res.status(200).json({
      success: true,
      data: comentarios,
      message: 'Comentários recuperados com sucesso.'
    });
  } catch (error) {
    next(error);
  }
}

// Criar comentário
export async function criar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuarioId = (req as any).user.id;
    const atividadeIdParam = req.params.atividadeId;
    const atividadeId = parseInt(Array.isArray(atividadeIdParam) ? atividadeIdParam[0] : atividadeIdParam);
    const { conteudo } = req.body;

    // Validações
    if (isNaN(atividadeId)) {
      res.status(400).json({
        success: false,
        error: 'ID da atividade inválido.'
      });
      return;
    }

    if (!conteudo || conteudo.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'O conteúdo do comentário é obrigatório.'
      });
      return;
    }

    if (conteudo.length > 1000) {
      res.status(400).json({
        success: false,
        error: 'O comentário não pode ter mais de 1000 caracteres.'
      });
      return;
    }

    const comentario = await criarComentario({
      atividade_id: atividadeId,
      usuario_id: usuarioId,
      conteudo: conteudo.trim()
    });

    res.status(201).json({
      success: true,
      data: comentario,
      message: 'Comentário criado com sucesso.'
    });
  } catch (error) {
    next(error);
  }
}

// Atualizar comentário
export async function atualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuarioId = (req as any).user.id;
    const comentarioIdParam = req.params.id;
    const comentarioId = parseInt(Array.isArray(comentarioIdParam) ? comentarioIdParam[0] : comentarioIdParam);
    const { conteudo } = req.body;

    // Validações
    if (isNaN(comentarioId)) {
      res.status(400).json({
        success: false,
        error: 'ID do comentário inválido.'
      });
      return;
    }

    if (!conteudo || conteudo.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: 'O conteúdo do comentário é obrigatório.'
      });
      return;
    }

    if (conteudo.length > 1000) {
      res.status(400).json({
        success: false,
        error: 'O comentário não pode ter mais de 1000 caracteres.'
      });
      return;
    }

    const comentario = await atualizarComentario(comentarioId, usuarioId, conteudo.trim());

    if (!comentario) {
      res.status(404).json({
        success: false,
        error: 'Comentário não encontrado ou você não tem permissão para editá-lo.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: comentario,
      message: 'Comentário atualizado com sucesso.'
    });
  } catch (error) {
    next(error);
  }
}

// Remover comentário
export async function remover(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const usuarioId = (req as any).user.id;
    const comentarioIdParam = req.params.id;
    const comentarioId = parseInt(Array.isArray(comentarioIdParam) ? comentarioIdParam[0] : comentarioIdParam);

    if (isNaN(comentarioId)) {
      res.status(400).json({
        success: false,
        error: 'ID do comentário inválido.'
      });
      return;
    }

    const removido = await excluirComentario(comentarioId, usuarioId);

    if (!removido) {
      res.status(404).json({
        success: false,
        error: 'Comentário não encontrado ou você não tem permissão para excluí-lo.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Comentário removido com sucesso.'
    });
  } catch (error) {
    next(error);
  }
}

// Contar comentários de uma atividade
export async function contar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const atividadeIdParam = req.params.atividadeId;
    const atividadeId = parseInt(Array.isArray(atividadeIdParam) ? atividadeIdParam[0] : atividadeIdParam);

    if (isNaN(atividadeId)) {
      res.status(400).json({
        success: false,
        error: 'ID da atividade inválido.'
      });
      return;
    }

    const total = await contarComentariosPorAtividade(atividadeId);

    res.status(200).json({
      success: true,
      data: { total },
      message: 'Total de comentários recuperado com sucesso.'
    });
  } catch (error) {
    next(error);
  }
}