import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { TokenBlacklistService } from './services/token-blacklist.service.js';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        nome: string;
        email?: string;
      };
      token?: string;
    }
  }
}

const tokenBlacklistService = new TokenBlacklistService();

// Proteção contra timing attacks ao comparar tokens
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Validar estrutura do token JWT
function isValidTokenStructure(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}

// Verificar expiração do token de forma robusta
function isTokenExpired(decoded: any): boolean {
  if (!decoded.exp) {
    return true;
  }
  
  const now = Math.floor(Date.now() / 1000);
  const expirationTime = decoded.exp;
  
  // Adicionar margem de segurança de 5 segundos para evitar problemas de sincronização
  return now >= (expirationTime + 5);
}

// Middleware de autenticação principal
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Token de acesso requerido.' 
      });
    }

    // Validar estrutura do token
    if (!isValidTokenStructure(token)) {
      return res.status(401).json({ 
        success: false,
        error: 'Formato de token inválido.' 
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET não configurado!');
      return res.status(500).json({ 
        success: false,
        error: 'Erro de configuração do servidor.' 
      });
    }

    // Verificar se o token está na blacklist
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      return res.status(403).json({ 
        success: false,
        error: 'Token revogado.' 
      });
    }

    // Verificar token
    jwt.verify(token, process.env.JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        // Diferenciar tipos de erro
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false,
            error: 'Token expirado.',
            code: 'TOKEN_EXPIRED'
          });
        } else if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ 
            success: false,
            error: 'Token inválido.',
            code: 'TOKEN_INVALID'
          });
        } else {
          return res.status(403).json({ 
            success: false,
            error: 'Falha na autenticação.',
            code: 'AUTH_FAILED'
          });
        }
      }

      // Verificação adicional de expiração
      if (isTokenExpired(decoded)) {
        return res.status(401).json({ 
          success: false,
          error: 'Token expirado.',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Validar campos obrigatórios do payload
      if (!decoded.id || typeof decoded.id !== 'number') {
        return res.status(403).json({ 
          success: false,
          error: 'Token com payload inválido.' 
        });
      }

      req.user = {
        id: decoded.id,
        nome: decoded.nome,
        email: decoded.email
      };
      
      req.token = token;
      
      next();
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno ao processar autenticação.' 
    });
  }
};

// Middleware para validar refresh token
export const authenticateRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ 
        success: false,
        error: 'Refresh token requerido.' 
      });
    }

    // Validar estrutura do token
    if (!isValidTokenStructure(refreshToken)) {
      return res.status(401).json({ 
        success: false,
        error: 'Formato de refresh token inválido.' 
      });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      console.error('JWT_REFRESH_SECRET não configurado!');
      return res.status(500).json({ 
        success: false,
        error: 'Erro de configuração do servidor.' 
      });
    }

    // Verificar se o refresh token está na blacklist
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      return res.status(403).json({ 
        success: false,
        error: 'Refresh token revogado.' 
      });
    }

    // Verificar refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err: any, decoded: any) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false,
            error: 'Refresh token expirado.',
            code: 'REFRESH_TOKEN_EXPIRED'
          });
        } else {
          return res.status(403).json({ 
            success: false,
            error: 'Refresh token inválido.',
            code: 'REFRESH_TOKEN_INVALID'
          });
        }
      }

      // Verificação adicional de expiração
      if (isTokenExpired(decoded)) {
        return res.status(401).json({ 
          success: false,
          error: 'Refresh token expirado.',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }

      // Validar campos obrigatórios
      if (!decoded.id || typeof decoded.id !== 'number') {
        return res.status(403).json({ 
          success: false,
          error: 'Refresh token com payload inválido.' 
        });
      }

      req.user = {
        id: decoded.id,
        nome: decoded.nome,
        email: decoded.email
      };

      req.token = refreshToken;
      
      next();
    });
  } catch (error) {
    console.error('Erro no middleware de refresh token:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro interno ao processar refresh token.' 
    });
  }
};

// Middleware para revogar token atual
export const revokeToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.token;
    
    if (!token) {
      return res.status(400).json({ 
        success: false,
        error: 'Token não encontrado na requisição.' 
      });
    }

    // Adicionar token à blacklist
    await tokenBlacklistService.addToBlacklist(token);
    
    next();
  } catch (error) {
    console.error('Erro ao revogar token:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Erro ao revogar token.' 
    });
  }
};