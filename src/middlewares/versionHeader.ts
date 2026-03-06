import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que adiciona header de versão da API em todas as respostas
 */
export const versionHeader = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const version = process.env.API_VERSION || '1.0.0';
  res.setHeader('X-API-Version', version);
  res.setHeader('X-Powered-By', 'Kard API');
  next();
};