import { Request, Response, NextFunction } from 'express';

/**
 * Middleware global de tratamento de erros
 * Deve ser registrado como último middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('🔥 Erro capturado:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Erro de validação do JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido',
      message: 'Autenticação falhou'
    });
  }

  // Token expirado
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado',
      message: 'Por favor, faça login novamente'
    });
  }

  // Erro de sintaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: 'JSON inválido',
      message: 'Corpo da requisição contém JSON malformado'
    });
  }

  // Erro de banco de dados
  if (error.message.includes('database') || error.message.includes('query')) {
    return res.status(503).json({
      success: false,
      error: 'Erro no banco de dados',
      message: 'Erro ao processar sua requisição'
    });
  }

  // Erro genérico
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Ocorreu um erro ao processar sua requisição',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};