import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Definir o diretório de logs
const logsDir = path.join(process.cwd(), 'logs');

// Definir os níveis de log customizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Definir as cores para cada nível
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Adicionar as cores ao winston
winston.addColors(colors);

// Determinar o nível de log baseado no ambiente
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Formato de timestamp
const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss',
});

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  timestampFormat,
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaString}`;
  })
);

// Formato para arquivos (produção)
const fileFormat = winston.format.combine(
  timestampFormat,
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Transporte para logs de erro com rotação
const errorFileTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

// Transporte para logs combinados com rotação
const combinedFileTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.join(logsDir, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

// Transporte para console
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

// Criar a instância do logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports: [
    errorFileTransport,
    combinedFileTransport,
    consoleTransport,
  ],
  exitOnError: false,
});

// Método auxiliar para logs de requisições HTTP
export const logRequest = (method: string, url: string, statusCode: number, responseTime: number) => {
  logger.http('HTTP Request', {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
  });
};

// Método auxiliar para logs de operações de banco de dados
export const logDatabase = (operation: string, table: string, duration?: number) => {
  logger.debug('Database Operation', {
    operation,
    table,
    duration: duration ? `${duration}ms` : undefined,
  });
};

// Método auxiliar para logs de autenticação
export const logAuth = (event: string, userId?: number, email?: string, success: boolean = true) => {
  logger.info('Auth Event', {
    event,
    userId,
    email,
    success,
  });
};

// Método auxiliar para logs de erros com contexto
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

// Exportar o logger principal
export default logger;