import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testDatabaseConnection } from './database.js';
import atividadesRoutes from './routes/atividades.routes.js';
import authRoutes from './routes/auth.routes.js';
import comentariosRoutes from './routes/comentarios.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { versionHeader } from './middlewares/versionHeader.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(versionHeader);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

// Rotas V1 (Versão atual)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/atividades', atividadesRoutes);
app.use('/api/v1/comentarios', comentariosRoutes);

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Testar conexão com o banco de dados antes de iniciar o servidor
testDatabaseConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server rodando em http://localhost:${port}`);
      console.log(`📊 Health check disponível em http://localhost:${port}/health`);
      console.log(`🔖 API Version: ${process.env.API_VERSION || '1.0.0'}`);
    });
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    process.exit(1);
  });