import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface TokenPayload {
  id: number;
  nome: string;
  email: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenService {
  // Tempo de expiração padrão (em segundos)
  private readonly ACCESS_TOKEN_EXPIRY = 900; // 15 minutos
  private readonly REFRESH_TOKEN_EXPIRY = 604800; // 7 dias

  // Gerar par de tokens (access + refresh)
  generateTokenPair(payload: TokenPayload): TokenPair {
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
      throw new Error('Secrets JWT não configurados');
    }

    // Adicionar jti (JWT ID) único para rastreamento
    const jti = crypto.randomBytes(16).toString('hex');

    // Access Token
    const accessToken = jwt.sign(
      {
        ...payload,
        jti,
        type: 'access'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'kard-api',
        audience: 'kard-app'
      }
    );

    // Refresh Token
    const refreshToken = jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        jti,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
        issuer: 'kard-api',
        audience: 'kard-app'
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    };
  }

  // Gerar apenas access token
  generateAccessToken(payload: TokenPayload): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET não configurado');
    }

    const jti = crypto.randomBytes(16).toString('hex');

    return jwt.sign(
      {
        ...payload,
        jti,
        type: 'access'
      },
      process.env.JWT_SECRET,
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
        issuer: 'kard-api',
        audience: 'kard-app'
      }
    );
  }

  // Verificar e decodificar token
  verifyToken(token: string, isRefreshToken: boolean = false): TokenPayload | null {
    try {
      const secret = isRefreshToken 
        ? process.env.JWT_REFRESH_SECRET 
        : process.env.JWT_SECRET;

      if (!secret) {
        throw new Error('Secret JWT não configurado');
      }

      const decoded = jwt.verify(token, secret, {
        issuer: 'kard-api',
        audience: 'kard-app'
      }) as any;

      // Validar tipo de token
      const expectedType = isRefreshToken ? 'refresh' : 'access';
      if (decoded.type !== expectedType) {
        return null;
      }

      return {
        id: decoded.id,
        nome: decoded.nome,
        email: decoded.email
      };
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return null;
    }
  }

  // Extrair tempo de expiração do token
  getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as any;
      return decoded?.exp || null;
    } catch (error) {
      return null;
    }
  }

  // Calcular tempo restante até expiração (em segundos)
  getTimeUntilExpiration(token: string): number | null {
    const exp = this.getTokenExpiration(token);
    if (!exp) return null;

    const now = Math.floor(Date.now() / 1000);
    const timeLeft = exp - now;

    return timeLeft > 0 ? timeLeft : 0;
  }

  // Verificar se token está próximo da expiração (últimos 5 minutos)
  isTokenNearExpiration(token: string): boolean {
    const timeLeft = this.getTimeUntilExpiration(token);
    if (timeLeft === null) return true;

    return timeLeft < 300; // 5 minutos
  }
}

// Instância singleton
export const tokenService = new TokenService();