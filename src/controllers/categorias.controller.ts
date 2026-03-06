import { Request, Response } from 'express';
import * as categoriasService from '../services/categorias.service.js';
import { validarCriacaoCategoria, validarAtualizacaoCategoria } from '../validators/categorias.validator.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const usuarioId = (req as any).user.id;

  const categorias = await categoriasService.buscarCategorias(usuarioId);

  res.status(200).json({
    success: true,
    data: categorias,
    message: 'Categorias recuperadas com sucesso'
  });
}

export async function buscarPorId(req: Request, res: Response): Promise<void> {
  const usuarioId = (req as any).user.id;
  const categoriaId = parseInt(req.params.id);

  if (isNaN(categoriaId)) {
    res.status(400).json({
      success: false,
      error: 'ID da categoria inválido'
    });
    return;
  }

  const categoria = await categoriasService.buscarCategoriaPorId(categoriaId, usuarioId);

  if (!categoria) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: categoria,
    message: 'Categoria recuperada com sucesso'
  });
}

export async function criar(req: Request, res: Response): Promise<void> {
  const usuarioId = (req as any).user.id;
  const { nome, cor, icone, descricao } = req.body;

  // Validar dados
  const validacao = validarCriacaoCategoria({ nome, cor, icone, descricao });
  if (!validacao.success) {
    res.status(400).json({
      success: false,
      error: validacao.error
    });
    return;
  }

  // Verificar se já existe categoria com mesmo nome para o usuário
  const categoriaExistente = await categoriasService.buscarCategoriaPorNome(nome, usuarioId);
  if (categoriaExistente) {
    res.status(409).json({
      success: false,
      error: 'Já existe uma categoria com este nome'
    });
    return;
  }

  const novaCategoria = await categoriasService.criarCategoria({
    nome,
    cor,
    icone,
    descricao,
    usuario_id: usuarioId
  });

  res.status(201).json({
    success: true,
    data: novaCategoria,
    message: 'Categoria criada com sucesso'
  });
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const usuarioId = (req as any).user.id;
  const categoriaId = parseInt(req.params.id);
  const { nome, cor, icone, descricao, ativa } = req.body;

  if (isNaN(categoriaId)) {
    res.status(400).json({
      success: false,
      error: 'ID da categoria inválido'
    });
    return;
  }

  // Validar dados
  const validacao = validarAtualizacaoCategoria({ nome, cor, icone, descricao, ativa });
  if (!validacao.success) {
    res.status(400).json({
      success: false,
      error: validacao.error
    });
    return;
  }

  // Verificar se categoria existe e pertence ao usuário
  const categoriaExistente = await categoriasService.buscarCategoriaPorId(categoriaId, usuarioId);
  if (!categoriaExistente) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }

  // Se está alterando o nome, verificar se não há conflito
  if (nome && nome !== categoriaExistente.nome) {
    const categoriaComMesmoNome = await categoriasService.buscarCategoriaPorNome(nome, usuarioId);
    if (categoriaComMesmoNome && categoriaComMesmoNome.id !== categoriaId) {
      res.status(409).json({
        success: false,
        error: 'Já existe uma categoria com este nome'
      });
      return;
    }
  }

  const categoriaAtualizada = await categoriasService.atualizarCategoria(categoriaId, usuarioId, {
    nome,
    cor,
    icone,
    descricao,
    ativa
  });

  res.status(200).json({
    success: true,
    data: categoriaAtualizada,
    message: 'Categoria atualizada com sucesso'
  });
}

export async function deletar(req: Request, res: Response): Promise<void> {
  const usuarioId = (req as any).user.id;
  const categoriaId = parseInt(req.params.id);

  if (isNaN(categoriaId)) {
    res.status(400).json({
      success: false,
      error: 'ID da categoria inválido'
    });
    return;
  }

  // Verificar se categoria existe e pertence ao usuário
  const categoriaExistente = await categoriasService.buscarCategoriaPorId(categoriaId, usuarioId);
  if (!categoriaExistente) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }

  const deletado = await categoriasService.deletarCategoria(categoriaId, usuarioId);

  if (!deletado) {
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar categoria'
    });
    return;
  }

  res.status(200).json({
    success: true,
    message: 'Categoria deletada com sucesso'
  });
}

export async function toggleAtiva(req: Request, res: Response): Promise<void> {
  const usuarioId = (req as any).user.id;
  const categoriaId = parseInt(req.params.id);

  if (isNaN(categoriaId)) {
    res.status(400).json({
      success: false,
      error: 'ID da categoria inválido'
    });
    return;
  }

  // Verificar se categoria existe e pertence ao usuário
  const categoriaExistente = await categoriasService.buscarCategoriaPorId(categoriaId, usuarioId);
  if (!categoriaExistente) {
    res.status(404).json({
      success: false,
      error: 'Categoria não encontrada'
    });
    return;
  }

  const categoriaAtualizada = await categoriasService.toggleAtiva(categoriaId, usuarioId);

  res.status(200).json({
    success: true,
    data: categoriaAtualizada,
    message: `Categoria ${categoriaAtualizada?.ativa ? 'ativada' : 'desativada'} com sucesso`
  });
}