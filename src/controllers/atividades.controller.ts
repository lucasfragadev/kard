import { Request, Response, NextFunction } from 'express';
import {
  buscarAtividades,
  buscarAtividadesComFiltros,
  criarAtividade,
  atualizarAtividade,
  removerAtividade,
  toggleStatusAtividade,
  togglePrioridadeAtividade,
  reordenarAtividades,
} from '../services/atividades.service.js';
import { validarCriacaoAtividade, validarAtualizacaoAtividade } from '../validators/atividades.validator.js';
import { exportToJSON, exportToCSV, exportToPDF } from '../utils/exporter.js';
import logger from '../utils/logger.js';

const MAX_EXPORT_RECORDS = 10000;

export const listar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const { categoria, finalizada, importante, data } = req.query;

    const categoriaStr = Array.isArray(categoria) ? categoria[0] : categoria;
    const finalizadaStr = Array.isArray(finalizada) ? finalizada[0] : finalizada;
    const importanteStr = Array.isArray(importante) ? importante[0] : importante;
    const dataStr = Array.isArray(data) ? data[0] : data;

    let atividades;

    if (categoriaStr || finalizadaStr !== undefined || importanteStr !== undefined || dataStr) {
      atividades = await buscarAtividadesComFiltros(usuarioId, {
        categoria: categoriaStr as string,
        finalizada: finalizadaStr === 'true',
        importante: importanteStr === 'true',
        data: dataStr as string,
      });
    } else {
      atividades = await buscarAtividades(usuarioId);
    }

    res.status(200).json({
      success: true,
      data: atividades,
      message: 'Atividades recuperadas com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const criar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const { data, categoria, descricao, importante = false } = req.body;

    const validacao = validarCriacaoAtividade({ data, categoria, descricao, importante });

    if (!validacao.success) {
      res.status(400).json({
        success: false,
        error: validacao.error,
      });
      return;
    }

    const novaAtividade = await criarAtividade({
      data,
      categoria,
      descricao,
      importante: importante || false,
      usuario_id: usuarioId,
    });

    res.status(201).json({
      success: true,
      data: novaAtividade,
      message: 'Atividade criada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const atualizar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const atividadeId = parseInt(idParam);
    const { data, categoria, descricao, importante } = req.body;

    const validacao = validarAtualizacaoAtividade({ data, categoria, descricao, importante });

    if (!validacao.success) {
      res.status(400).json({
        success: false,
        error: validacao.error,
      });
      return;
    }

    const atividadeAtualizada = await atualizarAtividade(atividadeId, usuarioId, {
      data,
      categoria,
      descricao,
      importante,
    });

    if (!atividadeAtualizada) {
      res.status(404).json({
        success: false,
        error: 'Atividade não encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: atividadeAtualizada,
      message: 'Atividade atualizada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const remover = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const atividadeId = parseInt(idParam);

    const removida = await removerAtividade(atividadeId, usuarioId);

    if (!removida) {
      res.status(404).json({
        success: false,
        error: 'Atividade não encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Atividade removida com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const atividadeId = parseInt(idParam);

    const atividadeAtualizada = await toggleStatusAtividade(atividadeId, usuarioId);

    if (!atividadeAtualizada) {
      res.status(404).json({
        success: false,
        error: 'Atividade não encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: atividadeAtualizada,
      message: 'Status da atividade atualizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const togglePrioridade = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const atividadeId = parseInt(idParam);

    const atividadeAtualizada = await togglePrioridadeAtividade(atividadeId, usuarioId);

    if (!atividadeAtualizada) {
      res.status(404).json({
        success: false,
        error: 'Atividade não encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: atividadeAtualizada,
      message: 'Prioridade da atividade atualizada com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const reordenar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const { ordens } = req.body;

    if (!ordens || !Array.isArray(ordens)) {
      res.status(400).json({
        success: false,
        error: 'Ordens inválidas',
      });
      return;
    }

    await reordenarAtividades(usuarioId, ordens);

    res.status(200).json({
      success: true,
      message: 'Atividades reordenadas com sucesso',
    });
  } catch (error) {
    next(error);
  }
};

export const exportar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const formatQuery = req.query.format;
    const formatStr = Array.isArray(formatQuery) ? formatQuery[0] : formatQuery;
    const format = (typeof formatStr === 'string' ? formatStr.toLowerCase() : 'json');
    const { categoria, finalizada, importante, data } = req.query;

    const categoriaStr = Array.isArray(categoria) ? categoria[0] : categoria;
    const finalizadaStr = Array.isArray(finalizada) ? finalizada[0] : finalizada;
    const importanteStr = Array.isArray(importante) ? importante[0] : importante;
    const dataStr = Array.isArray(data) ? data[0] : data;

    logger.info('Exportação iniciada', {
      usuarioId,
      format,
      filters: { categoria: categoriaStr, finalizada: finalizadaStr, importante: importanteStr, data: dataStr },
    });

    let atividades;

    if (categoriaStr || finalizadaStr !== undefined || importanteStr !== undefined || dataStr) {
      atividades = await buscarAtividadesComFiltros(usuarioId, {
        categoria: categoriaStr as string,
        finalizada: finalizadaStr === 'true',
        importante: importanteStr === 'true',
        data: dataStr as string,
      });
    } else {
      atividades = await buscarAtividades(usuarioId);
    }

    if (atividades.length > MAX_EXPORT_RECORDS) {
      logger.warn('Tentativa de exportar muitos registros', {
        usuarioId,
        totalAtividades: atividades.length,
        limite: MAX_EXPORT_RECORDS,
      });

      return res.status(400).json({
        success: false,
        error: `Número de registros excede o limite de ${MAX_EXPORT_RECORDS}. Use filtros para reduzir a quantidade.`,
      });
    }

    switch (format) {
      case 'json':
        try {
          const jsonData = exportToJSON(atividades);
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', 'attachment; filename=atividades.json');
          res.status(200).send(jsonData);
          logger.info('Exportação JSON concluída', {
            usuarioId,
            format,
            totalAtividades: atividades.length,
          });
        } catch (error) {
          throw new Error(`Erro ao gerar JSON: ${(error as Error).message}`);
        }
        break;

      case 'csv':
        try {
          const csvData = exportToCSV(atividades);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=atividades.csv');
          res.status(200).send(csvData);
          logger.info('Exportação CSV concluída', {
            usuarioId,
            format,
            totalAtividades: atividades.length,
          });
        } catch (error) {
          throw new Error(`Erro ao gerar CSV: ${(error as Error).message}`);
        }
        break;

      case 'pdf':
        try {
          const pdfBuffer = await exportToPDF(atividades);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=atividades.pdf');
          res.status(200).send(pdfBuffer);
          logger.info('Exportação PDF concluída', {
            usuarioId,
            format,
            totalAtividades: atividades.length,
          });
        } catch (error) {
          throw new Error(`Erro ao gerar PDF: ${(error as Error).message}`);
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Formato inválido. Use: json, csv ou pdf',
        });
    }
  } catch (error) {
    logger.error('Erro na exportação', {
      usuarioId: (req as any).user?.id,
      format: req.query.format,
      error: (error as Error).message,
    });
    next(error);
  }
};

export const importar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = (req as any).user.id;
    const { format, data } = req.body || {};

    if (!format || !data) {
      res.status(400).json({
        success: false,
        error: 'Formato e dados são obrigatórios',
      });
      return;
    }

    res.status(501).json({
      success: false,
      message: 'Funcionalidade de importação ainda não implementada',
    });
  } catch (error) {
    next(error);
  }
};