import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Middleware de rate limiting para prevenir abuso da API
 * Configurações diferentes para cada tipo de rota
 */

// Handler customizado para mensagens de erro de rate limit
const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: 'Muitas requisições. Por favor, tente novamente mais tarde.',
    retryAfter: res.getHeader('Retry-After')
  });
};

// Rate limiter para rotas de autenticação (mais restritivo)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 requisições por windowMs
  message: 'Muitas tentativas de login. Por favor, tente novamente após 15 minutos.',
  standardHeaders: true, // Retorna informações de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita os headers `X-RateLimit-*`
  handler: rateLimitHandler,
  skipSuccessfulRequests: false, // Conta todas as requisições, mesmo as bem-sucedidas
  skipFailedRequests: false, // Conta requisições que falharam
  keyGenerator: (req: Request) => {
    // Usa o IP do cliente como chave
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

// Rate limiter específico para registro (ainda mais restritivo)
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Limite de 3 tentativas de registro por hora
  message: 'Muitas tentativas de registro. Por favor, tente novamente após 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Não conta registros bem-sucedidos
  skipFailedRequests: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

// Rate limiter para rotas de atividades (moderado)
export const atividadesRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por windowMs
  message: 'Muitas requisições. Por favor, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    // Usa combinação de IP e userId (se autenticado) para melhor controle
    const userId = (req as any).user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return userId ? `${ip}:${userId}` : ip;
  }
});

// Rate limiter global para todas as rotas (menos restritivo)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // Limite de 200 requisições por windowMs
  message: 'Muitas requisições. Por favor, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

// Rate limiter para operações sensíveis (ex: alteração de senha, exclusão)
export const sensitiveOperationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Limite de 5 operações por hora
  message: 'Muitas tentativas de operações sensíveis. Por favor, tente novamente após 1 hora.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return userId ? `sensitive:${ip}:${userId}` : `sensitive:${ip}`;
  }
});

export default {
  authRateLimiter,
  registerRateLimiter,
  atividadesRateLimiter,
  globalRateLimiter,
  sensitiveOperationRateLimiter
};