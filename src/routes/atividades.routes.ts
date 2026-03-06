import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { 
  listar, 
  criar, 
  atualizar, 
  remover, 
  toggleStatus, 
  togglePrioridade,
  exportar,
  importar,
  reordenar
} from '../controllers/atividades.controller.js';
import { 
  validarCriacaoAtividade, 
  validarAtualizacaoAtividade 
} from '../validators/atividades.validator.js';
import { atividadesRateLimiter } from '../middlewares/rate-limit.middleware.js';

const router = Router();

// Aplicar autenticação e rate limiting em todas as rotas
router.use(authenticateToken);
router.use(atividadesRateLimiter);

// Middleware de validação para criação
const validateCreate = (req: Request, res: Response, next: NextFunction) => {
  const validacao = validarCriacaoAtividade(req.body);
  
  if (!validacao.success) {
    return res.status(400).json({
      success: false,
      error: validacao.error
    });
  }
  
  next();
};

// Middleware de validação para atualização
const validateUpdate = (req: Request, res: Response, next: NextFunction) => {
  const validacao = validarAtualizacaoAtividade(req.body);
  
  if (!validacao.success) {
    return res.status(400).json({
      success: false,
      error: validacao.error
    });
  }
  
  next();
};

// Middleware de validação de ID
const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido'
    });
  }
  
  next();
};

// Rotas de atividades
// GET /api/v1/atividades - Listar todas as atividades do usuário autenticado
router.get('/', listar);

// POST /api/v1/atividades - Criar nova atividade
router.post('/', validateCreate, criar);

// PUT /api/v1/atividades/:id - Atualizar atividade
router.put('/:id', validateId, validateUpdate, atualizar);

// DELETE /api/v1/atividades/:id - Remover atividade
router.delete('/:id', validateId, remover);

// PATCH /api/v1/atividades/:id/toggle - Alternar status de conclusão
router.patch('/:id/toggle', validateId, toggleStatus);

// PATCH /api/v1/atividades/:id/priority - Alternar prioridade
router.patch('/:id/priority', validateId, togglePrioridade);

// POST /api/v1/atividades/reorder - Reordenar atividades
router.post('/reorder', reordenar);

// GET /api/v1/atividades/export - Exportar atividades
router.get('/export', exportar);

// POST /api/v1/atividades/import - Importar atividades
router.post('/import', importar);

export default router;