import NodeCache from 'node-cache';

/**
 * Configurações do cache
 */
interface CacheConfig {
  ttl?: number; // Time to live em segundos
  checkperiod?: number; // Período de verificação de expiração em segundos
  useClones?: boolean; // Se deve clonar os objetos ao armazenar/recuperar
}

/**
 * Opções para operações de cache
 */
interface CacheOptions {
  ttl?: number; // TTL específico para esta operação
}

/**
 * Serviço de cache centralizado usando node-cache
 */
class CacheService {
  private cache: NodeCache;
  private defaultTTL: number;

  constructor(config: CacheConfig = {}) {
    const {
      ttl = 60, // 1 minuto por padrão
      checkperiod = 120, // Verifica itens expirados a cada 2 minutos
      useClones = false // Não clonar por padrão para melhor performance
    } = config;

    this.defaultTTL = ttl;
    this.cache = new NodeCache({
      stdTTL: ttl,
      checkperiod: checkperiod,
      useClones: useClones,
      deleteOnExpire: true
    });

    // Log quando itens expiram
    this.cache.on('expired', (key: string, value: any) => {
      console.log(`🗑️  Cache expired: ${key}`);
    });

    // Log quando itens são deletados
    this.cache.on('del', (key: string, value: any) => {
      console.log(`🗑️  Cache deleted: ${key}`);
    });
  }

  /**
   * Armazena um valor no cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): boolean {
    try {
      const ttl = options?.ttl || this.defaultTTL;
      const success = this.cache.set(key, value, ttl);
      
      if (success) {
        console.log(`✅ Cache set: ${key} (TTL: ${ttl}s)`);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Recupera um valor do cache
   */
  get<T>(key: string): T | undefined {
    try {
      const value = this.cache.get<T>(key);
      
      if (value !== undefined) {
        console.log(`✅ Cache hit: ${key}`);
      } else {
        console.log(`❌ Cache miss: ${key}`);
      }
      
      return value;
    } catch (error) {
      console.error(`❌ Error getting cache for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Remove um valor do cache
   */
  del(key: string | string[]): number {
    try {
      return this.cache.del(key);
    } catch (error) {
      console.error(`❌ Error deleting cache for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Verifica se uma chave existe no cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    try {
      this.cache.flushAll();
      console.log('🗑️  Cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  /**
   * Obtém todas as chaves armazenadas
   */
  keys(): string[] {
    return this.cache.keys();
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Obtém o TTL de uma chave específica
   */
  getTtl(key: string): number | undefined {
    return this.cache.getTtl(key);
  }

  /**
   * Atualiza o TTL de uma chave existente
   */
  updateTtl(key: string, ttl: number): boolean {
    return this.cache.ttl(key, ttl);
  }

  /**
   * Obtém múltiplos valores de uma vez
   */
  mget<T>(keys: string[]): { [key: string]: T } {
    return this.cache.mget(keys) as { [key: string]: T };
  }

  /**
   * Define múltiplos valores de uma vez
   */
  mset<T>(items: Array<{ key: string; val: T; ttl?: number }>): boolean {
    try {
      return this.cache.mset(items);
    } catch (error) {
      console.error('❌ Error setting multiple cache items:', error);
      return false;
    }
  }

  /**
   * Wrapper para operações com cache
   * Se o valor não estiver no cache, executa a função e armazena o resultado
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Tentar obter do cache primeiro
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Se não estiver no cache, executar a função
    const value = await fn();
    
    // Armazenar no cache
    this.set(key, value, options);
    
    return value;
  }

  /**
   * Gera uma chave de cache baseada em múltiplos parâmetros
   */
  static generateKey(...parts: (string | number | boolean | undefined | null)[]): string {
    return parts
      .filter(part => part !== undefined && part !== null)
      .map(part => String(part))
      .join(':');
  }
}

// Instâncias pré-configuradas para diferentes tipos de cache
export const atividadesCache = new CacheService({
  ttl: 60, // 1 minuto
  checkperiod: 120
});

export const authCache = new CacheService({
  ttl: 300, // 5 minutos
  checkperiod: 600
});

export const generalCache = new CacheService({
  ttl: 180, // 3 minutos
  checkperiod: 360
});

// Exportar a classe para uso personalizado
export { CacheService };
export default CacheService;