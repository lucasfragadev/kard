import { pool } from '../database.js';
import crypto from 'crypto';

interface BlacklistedToken {
  id: number;
  token_hash: string;
  revoked_at: Date;
  expires_at: Date;
}

export class TokenBlacklistService {
  // Cache em memória para tokens revogados recentemente (otimização)
  private memoryCache: Map<string, Date> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutos em cache de memória

  // Gerar hash do token para armazenamento seguro
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Verificar se token está na blacklist
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);

      // Verificar cache de memória primeiro
      if (this.memoryCache.has(tokenHash)) {
        const expiresAt = this.memoryCache.get(tokenHash);
        if (expiresAt && expiresAt > new Date()) {
          return true;
        } else {
          this.memoryCache.delete(tokenHash);
        }
      }

      // Verificar no banco de dados
      const query = `
        SELECT id, expires_at 
        FROM token_blacklist 
        WHERE token_hash = $1 
        AND expires_at > NOW()
      `;

      const result = await pool.query(query, [tokenHash]);

      if (result.rows.length > 0) {
        // Adicionar ao cache de memória
        this.memoryCache.set(tokenHash, new Date(result.rows[0].expires_at));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao verificar blacklist:', error);
      // Em caso de erro, negar acesso por segurança
      return true;
    }
  }

  // Adicionar token à blacklist
  async addToBlacklist(token: string, expiresInSeconds: number = 86400): Promise<void> {
    try {
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      const query = `
        INSERT INTO token_blacklist (token_hash, revoked_at, expires_at)
        VALUES ($1, NOW(), $2)
        ON CONFLICT (token_hash) DO UPDATE 
        SET revoked_at = NOW(), expires_at = $2
      `;

      await pool.query(query, [tokenHash, expiresAt]);

      // Adicionar ao cache de memória
      this.memoryCache.set(tokenHash, expiresAt);
    } catch (error) {
      console.error('Erro ao adicionar token à blacklist:', error);
      throw new Error('Falha ao revogar token');
    }
  }

  // Remover tokens expirados da blacklist (limpeza periódica)
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const query = `
        DELETE FROM token_blacklist 
        WHERE expires_at < NOW()
      `;

      const result = await pool.query(query);
      
      // Limpar cache de memória de tokens expirados
      const now = new Date();
      for (const [hash, expiresAt] of this.memoryCache.entries()) {
        if (expiresAt < now) {
          this.memoryCache.delete(hash);
        }
      }

      return result.rowCount || 0;
    } catch (error) {
      console.error('Erro ao limpar tokens expirados:', error);
      return 0;
    }
  }

  // Limpar todo o cache de memória
  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  // Obter estatísticas da blacklist
  async getStats(): Promise<{
    totalBlacklisted: number;
    totalExpired: number;
    inMemoryCache: number;
  }> {
    try {
      const totalQuery = `
        SELECT COUNT(*) as total 
        FROM token_blacklist 
        WHERE expires_at > NOW()
      `;

      const expiredQuery = `
        SELECT COUNT(*) as total 
        FROM token_blacklist 
        WHERE expires_at <= NOW()
      `;

      const [totalResult, expiredResult] = await Promise.all([
        pool.query(totalQuery),
        pool.query(expiredQuery)
      ]);

      return {
        totalBlacklisted: parseInt(totalResult.rows[0].total),
        totalExpired: parseInt(expiredResult.rows[0].total),
        inMemoryCache: this.memoryCache.size
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        totalBlacklisted: 0,
        totalExpired: 0,
        inMemoryCache: this.memoryCache.size
      };
    }
  }
}