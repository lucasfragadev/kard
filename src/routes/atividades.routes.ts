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

router.use(authenticateToken);
router.use(atividadesRateLimiter);

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

const validateId = (req: Request, res: Response, next: NextFunction) => {
  const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(idParam);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido'
    });
  }
  
  next();
};

router.get('/', listar);
router.post('/', validateCreate, criar);
router.put('/:id', validateId, validateUpdate, atualizar);
router.delete('/:id', validateId, remover);
router.patch('/:id/toggle', validateId, toggleStatus);
router.patch('/:id/priority', validateId, togglePrioridade);
router.post('/reorder', reordenar);
router.get('/export', exportar);
router.post('/import', importar);

export default router;