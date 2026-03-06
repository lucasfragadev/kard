import { Request, Response, NextFunction } from 'express';

// Classes de erro customizadas
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Erro de validação') {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso não encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflito de dados') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Erro no banco de dados') {
    super(message, 503, false);
    this.name = 'DatabaseError';
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Requisição inválida') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Erro interno do servidor') {
    super(message, 500, false);
    this.name = 'InternalServerError';
  }
}

// Middleware de tratamento de erros
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log do erro para debug (em produção, usar um logger apropriado)
  if (process.env.NODE_ENV !== 'production') {
    console.error('🔴 Erro capturado:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Se for um erro customizado da aplicação
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
    return;
  }

  // Tratamento específico para erros de validação do Express
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Tratamento para erros de JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Token inválido',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expirado',
    });
    return;
  }

  // Tratamento para erros de sintaxe JSON
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'JSON inválido',
    });
    return;
  }

  // Erros de banco de dados PostgreSQL
  if ('code' in err) {
    const pgError = err as any;
    
    switch (pgError.code) {
      case '23505': // unique_violation
        res.status(409).json({
          success: false,
          error: 'Este registro já existe no sistema',
        });
        return;
      
      case '23503': // foreign_key_violation
        res.status(400).json({
          success: false,
          error: 'Referência inválida no banco de dados',
        });
        return;
      
      case '23502': // not_null_violation
        res.status(400).json({
          success: false,
          error: 'Campo obrigatório não foi fornecido',
        });
        return;
      
      case '22P02': // invalid_text_representation
        res.status(400).json({
          success: false,
          error: 'Formato de dados inválido',
        });
        return;
      
      case 'ECONNREFUSED':
        res.status(503).json({
          success: false,
          error: 'Não foi possível conectar ao banco de dados',
        });
        return;
    }
  }

  // Erro padrão não tratado
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// Helper para async/await em rotas Express
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};