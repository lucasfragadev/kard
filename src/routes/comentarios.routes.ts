import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import * as comentariosController from '../controllers/comentarios.controller.js';

const router = Router();

// Todas as rotas de comentários requerem autenticação
router.use(authenticateToken);

// GET /api/v1/comentarios/atividade/:atividadeId - Listar comentários de uma atividade
router.get('/atividade/:atividadeId', comentariosController.listar);

// GET /api/v1/comentarios/atividade/:atividadeId/count - Contar comentários de uma atividade
router.get('/atividade/:atividadeId/count', comentariosController.contar);

// POST /api/v1/comentarios/atividade/:atividadeId - Criar comentário
router.post('/atividade/:atividadeId', comentariosController.criar);

// PUT /api/v1/comentarios/:id - Atualizar comentário
router.put('/:id', comentariosController.atualizar);

// DELETE /api/v1/comentarios/:id - Remover comentário
router.delete('/:id', comentariosController.remover);

export default router;