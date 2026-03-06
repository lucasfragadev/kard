import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Interface para tipagem das variáveis de ambiente
 */
interface EnvConfig {
  // Servidor
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  API_VERSION: string;
  
  // Banco de dados
  DATABASE_URL: string;
  DEBUG_SQL: boolean;
  
  // JWT
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // SMTP
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM_NAME: string;
  SMTP_SECURE: boolean;
  
  // URLs
  FRONTEND_URL: string;
  
  // Upload
  MAX_FILE_SIZE: number;
  UPLOAD_DIR: string;
  
  // Cache
  CACHE_TTL: number;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  AUTH_RATE_LIMIT_WINDOW_MS: number;
  AUTH_RATE_LIMIT_MAX_REQUESTS: number;
  
  // Logs
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
  
  // CORS
  CORS_ORIGIN: string;
  
  // Reset de senha
  RESET_TOKEN_EXPIRES_IN: number;
  RESET_REQUEST_INTERVAL: number;
  
  // Notificações
  NOTIFICATION_ADVANCE_TIME: number;
  
  // Backup
  BACKUP_DIR: string;
  BACKUP_FREQUENCY: number;
  
  // Swagger
  ENABLE_SWAGGER_IN_PRODUCTION: boolean;
}

/**
 * Validar variável de ambiente obrigatória
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  
  if (!value || value.trim() === '') {
    throw new Error(`❌ Variável de ambiente obrigatória não definida: ${key}`);
  }
  
  return value;
}

/**
 * Validar variável de ambiente opcional com valor padrão
 */
function getOptionalEnv(key: string, defaultValue: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : defaultValue;
}

/**
 * Converter string para número e validar
 */
function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new Error(`❌ Variável de ambiente ${key} deve ser um número válido. Valor recebido: ${value}`);
  }
  
  return parsed;
}

/**
 * Converter string para boolean
 */
function getBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  
  const normalizedValue = value.toLowerCase().trim();
  
  if (normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'yes') {
    return true;
  }
  
  if (normalizedValue === 'false' || normalizedValue === '0' || normalizedValue === 'no') {
    return false;
  }
  
  return defaultValue;
}

/**
 * Validar NODE_ENV
 */
function validateNodeEnv(): 'development' | 'production' | 'test' {
  const env = getOptionalEnv('NODE_ENV', 'development');
  
  if (!['development', 'production', 'test'].includes(env)) {
    throw new Error(`❌ NODE_ENV inválido: ${env}. Valores aceitos: development, production, test`);
  }
  
  return env as 'development' | 'production' | 'test';
}

/**
 * Validar LOG_LEVEL
 */
function validateLogLevel(): 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly' {
  const level = getOptionalEnv('LOG_LEVEL', 'info');
  const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  
  if (!validLevels.includes(level)) {
    throw new Error(`❌ LOG_LEVEL inválido: ${level}. Valores aceitos: ${validLevels.join(', ')}`);
  }
  
  return level as 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
}

/**
 * Validar JWT_SECRET
 */
function validateJWTSecret(secret: string, secretName: string): void {
  if (secret.length < 32) {
    throw new Error(`❌ ${secretName} deve ter no mínimo 32 caracteres para ser seguro`);
  }
}

/**
 * Validar DATABASE_URL
 */
function validateDatabaseUrl(url: string): void {
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    throw new Error('❌ DATABASE_URL deve ser uma URL válida do PostgreSQL (postgresql:// ou postgres://)');
  }
}

/**
 * Carregar e validar todas as variáveis de ambiente
 */
function loadEnvConfig(): EnvConfig {
  console.log('🔍 Validando variáveis de ambiente...');
  
  try {
    // NODE_ENV
    const NODE_ENV = validateNodeEnv();
    
    // Servidor
    const PORT = getNumberEnv('PORT', 3000);
    const API_VERSION = getOptionalEnv('API_VERSION', '1.0.0');
    
    // Banco de dados
    const DATABASE_URL = getRequiredEnv('DATABASE_URL');
    validateDatabaseUrl(DATABASE_URL);
    const DEBUG_SQL = getBooleanEnv('DEBUG_SQL', false);
    
    // JWT
    const JWT_SECRET = getRequiredEnv('JWT_SECRET');
    validateJWTSecret(JWT_SECRET, 'JWT_SECRET');
    
    const JWT_REFRESH_SECRET = getRequiredEnv('JWT_REFRESH_SECRET');
    validateJWTSecret(JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
    
    const JWT_EXPIRES_IN = getOptionalEnv('JWT_EXPIRES_IN', '1h');
    const JWT_REFRESH_EXPIRES_IN = getOptionalEnv('JWT_REFRESH_EXPIRES_IN', '7d');
    
    // SMTP (opcional em desenvolvimento)
    const SMTP_HOST = getOptionalEnv('SMTP_HOST', 'smtp.gmail.com');
    const SMTP_PORT = getNumberEnv('SMTP_PORT', 587);
    const SMTP_USER = getOptionalEnv('SMTP_USER', '');
    const SMTP_PASS = getOptionalEnv('SMTP_PASS', '');
    const SMTP_FROM_NAME = getOptionalEnv('SMTP_FROM_NAME', 'Kard');
    const SMTP_SECURE = getBooleanEnv('SMTP_SECURE', false);
    
    // URLs
    const FRONTEND_URL = getOptionalEnv('FRONTEND_URL', 'http://localhost:3000');
    
    // Upload
    const MAX_FILE_SIZE = getNumberEnv('MAX_FILE_SIZE', 10);
    const UPLOAD_DIR = getOptionalEnv('UPLOAD_DIR', path.join(process.cwd(), 'uploads'));
    
    // Cache
    const CACHE_TTL = getNumberEnv('CACHE_TTL', 60000);
    
    // Rate Limiting
    const RATE_LIMIT_WINDOW_MS = getNumberEnv('RATE_LIMIT_WINDOW_MS', 60000);
    const RATE_LIMIT_MAX_REQUESTS = getNumberEnv('RATE_LIMIT_MAX_REQUESTS', 100);
    const AUTH_RATE_LIMIT_WINDOW_MS = getNumberEnv('AUTH_RATE_LIMIT_WINDOW_MS', 3600000);
    const AUTH_RATE_LIMIT_MAX_REQUESTS = getNumberEnv('AUTH_RATE_LIMIT_MAX_REQUESTS', 5);
    
    // Logs
    const LOG_LEVEL = validateLogLevel();
    
    // CORS
    const CORS_ORIGIN = getOptionalEnv('CORS_ORIGIN', 'http://localhost:3000');
    
    // Reset de senha
    const RESET_TOKEN_EXPIRES_IN = getNumberEnv('RESET_TOKEN_EXPIRES_IN', 1);
    const RESET_REQUEST_INTERVAL = getNumberEnv('RESET_REQUEST_INTERVAL', 15);
    
    // Notificações
    const NOTIFICATION_ADVANCE_TIME = getNumberEnv('NOTIFICATION_ADVANCE_TIME', 30);
    
    // Backup
    const BACKUP_DIR = getOptionalEnv('BACKUP_DIR', path.join(process.cwd(), 'backups'));
    const BACKUP_FREQUENCY = getNumberEnv('BACKUP_FREQUENCY', 24);
    
    // Swagger
    const ENABLE_SWAGGER_IN_PRODUCTION = getBooleanEnv('ENABLE_SWAGGER_IN_PRODUCTION', false);
    
    console.log('✅ Variáveis de ambiente validadas com sucesso!');
    console.log(`📊 Ambiente: ${NODE_ENV}`);
    console.log(`🚀 Porta: ${PORT}`);
    console.log(`🔖 Versão da API: ${API_VERSION}`);
    
    return {
      NODE_ENV,
      PORT,
      API_VERSION,
      DATABASE_URL,
      DEBUG_SQL,
      JWT_SECRET,
      JWT_REFRESH_SECRET,
      JWT_EXPIRES_IN,
      JWT_REFRESH_EXPIRES_IN,
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_FROM_NAME,
      SMTP_SECURE,
      FRONTEND_URL,
      MAX_FILE_SIZE,
      UPLOAD_DIR,
      CACHE_TTL,
      RATE_LIMIT_WINDOW_MS,
      RATE_LIMIT_MAX_REQUESTS,
      AUTH_RATE_LIMIT_WINDOW_MS,
      AUTH_RATE_LIMIT_MAX_REQUESTS,
      LOG_LEVEL,
      CORS_ORIGIN,
      RESET_TOKEN_EXPIRES_IN,
      RESET_REQUEST_INTERVAL,
      NOTIFICATION_ADVANCE_TIME,
      BACKUP_DIR,
      BACKUP_FREQUENCY,
      ENABLE_SWAGGER_IN_PRODUCTION,
    };
  } catch (error) {
    console.error('❌ Erro ao validar variáveis de ambiente:', error);
    
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    
    console.error('\n💡 Dica: Verifique se o arquivo .env existe e está configurado corretamente.');
    console.error('   Você pode usar o arquivo .env.example como referência.\n');
    
    process.exit(1);
  }
}

// Carregar e exportar a configuração validada
export const env: EnvConfig = loadEnvConfig();

// Exportar tipos para uso em outros arquivos
export type { EnvConfig };

// Helper para verificar se está em produção
export const isProduction = env.NODE_ENV === 'production';

// Helper para verificar se está em desenvolvimento
export const isDevelopment = env.NODE_ENV === 'development';

// Helper para verificar se está em teste
export const isTest = env.NODE_ENV === 'test';

// Helper para verificar se o serviço de email está configurado
export const isEmailConfigured = env.SMTP_USER !== '' && env.SMTP_PASS !== '';

// Helper para obter URL completa da API
export const getApiUrl = (path: string = ''): string => {
  return `${env.FRONTEND_URL}${path}`;
};

// Exportar configuração do banco de dados
export const databaseConfig = {
  url: env.DATABASE_URL,
  debug: env.DEBUG_SQL,
};

// Exportar configuração do JWT
export const jwtConfig = {
  secret: env.JWT_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  expiresIn: env.JWT_EXPIRES_IN,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
};

// Exportar configuração do SMTP
export const smtpConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  user: env.SMTP_USER,
  pass: env.SMTP_PASS,
  fromName: env.SMTP_FROM_NAME,
  secure: env.SMTP_SECURE,
};

// Exportar configuração de upload
export const uploadConfig = {
  maxFileSize: env.MAX_FILE_SIZE * 1024 * 1024, // Converter para bytes
  uploadDir: env.UPLOAD_DIR,
};

// Exportar configuração de rate limiting
export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  authWindowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  authMaxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
};

// Exportar configuração de cache
export const cacheConfig = {
  ttl: env.CACHE_TTL,
};

// Exportar configuração de reset de senha
export const resetPasswordConfig = {
  tokenExpiresIn: env.RESET_TOKEN_EXPIRES_IN,
  requestInterval: env.RESET_REQUEST_INTERVAL,
};

// Exportar configuração de notificações
export const notificationConfig = {
  advanceTime: env.NOTIFICATION_ADVANCE_TIME,
};

// Exportar configuração de backup
export const backupConfig = {
  dir: env.BACKUP_DIR,
  frequency: env.BACKUP_FREQUENCY,
};

export default env;