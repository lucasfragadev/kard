import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import * as categoriasController from '../controllers/categorias.controller.js';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar todas as categorias do usuário
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoriasController.listar(req, res);
  } catch (error) {
    next(error);
  }
});

// Buscar categoria por ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoriasController.buscarPorId(req, res);
  } catch (error) {
    next(error);
  }
});

// Criar nova categoria
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoriasController.criar(req, res);
  } catch (error) {
    next(error);
  }
});

// Atualizar categoria
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoriasController.atualizar(req, res);
  } catch (error) {
    next(error);
  }
});

// Deletar categoria
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoriasController.deletar(req, res);
  } catch (error) {
    next(error);
  }
});

// Ativar/Desativar categoria
router.patch('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoriasController.toggleAtiva(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;