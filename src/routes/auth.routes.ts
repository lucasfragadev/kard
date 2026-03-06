import { Router, Request, Response, NextFunction } from 'express';
import { 
  registro, 
  login,
  me,
  changePassword,
  deleteAccount
} from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { 
  validarRegistro, 
  validarLogin,
  validarAlteracaoSenha
} from '../validators/auth.validator.js';

const router = Router();

// ========================================
// INTERFACES
// ========================================
interface RegistroRequestBody {
  nome: string;
  email: string;
  senha: string;
}

interface LoginRequestBody {
  email: string;
  senha: string;
}

interface ChangePasswordRequestBody {
  senhaAtual: string;
  novaSenha: string;
  confirmacaoSenha: string;
}

// ========================================
// MIDDLEWARES DE VALIDAÇÃO
// ========================================
const validateRegistro = (req: Request<{}, {}, RegistroRequestBody>, res: Response, next: NextFunction) => {
  const validacao = validarRegistro(req.body);
  
  if (!validacao.success) {
    return res.status(400).json({
      success: false,
      error: validacao.error
    });
  }
  
  next();
};

const validateLogin = (req: Request<{}, {}, LoginRequestBody>, res: Response, next: NextFunction) => {
  const validacao = validarLogin(req.body);
  
  if (!validacao.success) {
    return res.status(400).json({
      success: false,
      error: validacao.error
    });
  }
  
  next();
};

const validateChangePassword = (req: Request<{}, {}, ChangePasswordRequestBody>, res: Response, next: NextFunction) => {
  const validacao = validarAlteracaoSenha(req.body);
  
  if (!validacao.success) {
    return res.status(400).json({
      success: false,
      error: validacao.error
    });
  }
  
  next();
};

// ========================================
// HELPER PARA ASYNC HANDLERS
// ========================================
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ========================================
// ROTAS PÚBLICAS
// ========================================

// POST /api/v1/auth/registro - Registrar novo usuário
router.post('/registro', validateRegistro, asyncHandler(registro));

// POST /api/v1/auth/login - Login de usuário
router.post('/login', validateLogin, asyncHandler(login));

// ========================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ========================================

// GET /api/v1/auth/me - Obter dados do usuário logado
router.get('/me', authenticateToken, asyncHandler(me));

// POST /api/v1/auth/change-password - Alterar senha
router.post('/change-password', authenticateToken, validateChangePassword, asyncHandler(changePassword));

// DELETE /api/v1/auth/delete-account - Excluir conta
router.delete('/delete-account', authenticateToken, asyncHandler(deleteAccount));

export default router;