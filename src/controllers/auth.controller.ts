import { Request, Response, NextFunction } from 'express';
import { 
  registrarUsuario, 
  autenticarUsuario, 
  alterarSenha,
  excluirConta
} from '../services/auth.service.js';
import { logger } from '../utils/logger.js';

// Registro de usuário
export const registro = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nome, email, senha } = req.body;

    // Validações básicas
    if (!nome || !email || !senha) {
      res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios.'
      });
      return;
    }

    if (senha.length < 6) {
      res.status(400).json({
        success: false,
        error: 'A senha deve ter no mínimo 6 caracteres.'
      });
      return;
    }

    // Registrar usuário
    const usuario = await registrarUsuario({ nome, email, senha });

    logger.info('Novo usuário registrado', { userId: usuario.id, email: usuario.email });

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso!',
      data: {
        usuario
      }
    });
  } catch (error: any) {
    logger.error('Erro no registro', { error: error.message });
    next(error);
  }
};

// Login de usuário
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, senha } = req.body;

    // Validações básicas
    if (!email || !senha) {
      res.status(400).json({
        success: false,
        error: 'E-mail e senha são obrigatórios.'
      });
      return;
    }

    // Autenticar usuário
    const { usuario, token, refreshToken } = await autenticarUsuario({ email, senha });

    logger.info('Login realizado', { userId: usuario.id, email: usuario.email });

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        usuario,
        token,
        refreshToken
      }
    });
  } catch (error: any) {
    logger.error('Erro no login', { error: error.message });
    next(error);
  }
};

// Obter dados do usuário logado
export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = (req as any).user.id;

    const query = 'SELECT id, nome, email, created_at, updated_at FROM usuarios WHERE id = $1';
    const { pool } = await import('../database.js');
    const result = await pool.query(query, [usuarioId]);

    if (!result.rows[0]) {
      res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    logger.error('Erro ao obter dados do usuário', { error: error.message });
    next(error);
  }
};

// Alterar senha
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = (req as any).user.id;
    const { senhaAtual, novaSenha, confirmacaoSenha } = req.body;

    // Validações
    if (!senhaAtual || !novaSenha || !confirmacaoSenha) {
      res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      });
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      res.status(400).json({
        success: false,
        error: 'As senhas não coincidem'
      });
      return;
    }

    await alterarSenha(usuarioId, senhaAtual, novaSenha);

    logger.info('Senha alterada', { userId: usuarioId });

    res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error: any) {
    logger.error('Erro ao alterar senha', { error: error.message });
    next(error);
  }
};

// Excluir conta
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const usuarioId = (req as any).user.id;
    const { senha } = req.body;

    if (!senha) {
      res.status(400).json({
        success: false,
        error: 'Senha é obrigatória para excluir a conta'
      });
      return;
    }

    await excluirConta(usuarioId, senha);

    logger.info('Conta excluída', { userId: usuarioId });

    res.status(200).json({
      success: true,
      message: 'Conta excluída com sucesso'
    });
  } catch (error: any) {
    logger.error('Erro ao excluir conta', { error: error.message });
    next(error);
  }
};