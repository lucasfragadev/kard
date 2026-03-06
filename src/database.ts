import { Pool, PoolConfig, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configurações do pool de conexões
const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Limites de conexões
  min: 2, // Mínimo de conexões mantidas no pool
  max: 10, // Máximo de conexões simultâneas
  
  // Timeouts
  connectionTimeoutMillis: 5000, // Tempo máximo para obter uma conexão do pool
  idleTimeoutMillis: 30000, // Tempo que uma conexão pode ficar ociosa antes de ser fechada
  
  // Configurações adicionais
  allowExitOnIdle: false, // Não permite que o processo termine se houver conexões ociosas
};

export const pool = new Pool(poolConfig);

// Variável para controlar tentativas de reconexão
let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 segundos

// Função de retry logic para reconexão
async function retryConnection(): Promise<void> {
  if (isReconnecting) {
    return;
  }

  isReconnecting = true;

  while (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    try {
      reconnectAttempts++;
      console.log(`🔄 Tentando reconectar ao banco de dados... (Tentativa ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      
      await pool.query('SELECT 1');
      
      console.log('✅ Reconexão com o banco de dados estabelecida com sucesso!');
      reconnectAttempts = 0;
      isReconnecting = false;
      return;
    } catch (error) {
      console.error(`❌ Falha na tentativa ${reconnectAttempts}:`, error);
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Número máximo de tentativas de reconexão atingido.');
        isReconnecting = false;
        throw new Error('Não foi possível reconectar ao banco de dados após múltiplas tentativas.');
      }
      
      await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY));
    }
  }
}

// Event listeners para o pool
pool.on('connect', (client: PoolClient) => {
  console.log('🔌 Nova conexão estabelecida com o banco de dados');
  reconnectAttempts = 0; // Reset do contador em caso de sucesso
});

pool.on('error', (err: Error, client: PoolClient) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  
  // Tentar reconectar em caso de erro
  retryConnection().catch(error => {
    console.error('❌ Erro crítico ao tentar reconectar:', error);
  });
});

pool.on('remove', (client: PoolClient) => {
  console.log('🔌 Conexão removida do pool');
});

// Health check para verificar status do banco de dados
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: {
    totalConnections: number;
    idleConnections: number;
    waitingClients: number;
  };
}> {
  try {
    const startTime = Date.now();
    
    // Tentar executar uma query simples
    await pool.query('SELECT 1');
    
    const responseTime = Date.now() - startTime;
    
    // Obter informações do pool
    const totalConnections = pool.totalCount;
    const idleConnections = pool.idleCount;
    const waitingClients = pool.waitingCount;
    
    return {
      status: 'healthy',
      message: `Banco de dados operacional (${responseTime}ms)`,
      details: {
        totalConnections,
        idleConnections,
        waitingClients
      }
    };
  } catch (error) {
    console.error('❌ Health check falhou:', error);
    
    // Tentar reconectar
    retryConnection().catch(err => {
      console.error('❌ Falha ao tentar reconectar durante health check:', err);
    });
    
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Erro desconhecido ao conectar com o banco de dados'
    };
  }
}

// Função para testar a conexão inicial
export async function testDatabaseConnection(): Promise<void> {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    console.log(`📅 Timestamp do servidor: ${result.rows[0].now}`);
    
    client.release();
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    
    // Tentar reconectar
    await retryConnection();
  }
}

// Graceful shutdown - encerrar conexões adequadamente
export async function closeDatabaseConnection(): Promise<void> {
  try {
    console.log('🔌 Encerrando conexões com o banco de dados...');
    await pool.end();
    console.log('✅ Todas as conexões foram encerradas com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao encerrar conexões:', error);
    throw error;
  }
}

// Capturar sinais de término do processo para fazer graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n📛 Recebido SIGINT. Encerrando aplicação...');
  await closeDatabaseConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n📛 Recebido SIGTERM. Encerrando aplicação...');
  await closeDatabaseConnection();
  process.exit(0);
});