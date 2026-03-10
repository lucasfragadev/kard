import 'dotenv/config';
import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from './database.js';
import { authenticateToken } from './auth.middleware.js';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Configuração de Segurança (Helmet + CORS)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "https://cdn.quilljs.com", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.quilljs.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "https://cdn.quilljs.com", "https://cdn.jsdelivr.net"],
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Rate Limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/auth/registro', async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  try {
    // 1. Verifica se já existe
    const userCheck = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    // 2. Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // 3. Cria o usuário
    const query = `
      INSERT INTO usuarios (nome, email, senha) 
      VALUES ($1, $2, $3) 
      RETURNING id, nome, email;
    `;
    const result = await pool.query(query, [nome.trim(), email.toLowerCase().trim(), senhaHash]);

    return res.status(201).json({
      message: 'Usuário criado com sucesso!',
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase().trim()]);
    const usuario = result.rows[0];
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, process.env.JWT_SECRET!, { expiresIn: '8h' });
    return res.json({ token, usuario: { id: usuario.id, nome: usuario.nome } });
  } catch (error) { return res.status(500).json({ error: 'Erro no login.' }); }
});

// --- ROTAS DE ATIVIDADES ---

// GET: Listar
app.get('/atividades', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM atividades 
      WHERE usuario_id = $1 
      ORDER BY importante DESC, id DESC
    `;
    const result = await pool.query(query, [req.user!.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar atividades" });
  }
});

// POST: Criar (Agora com Titulo e Descricao)
app.post('/atividades', authenticateToken, async (req, res) => {
  const { titulo, descricao, categoria, data } = req.body;

  // Validação básica
  if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' });

  const query = `
    INSERT INTO atividades (titulo, descricao, categoria, data, usuario_id, importante, finalizada) 
    VALUES ($1, $2, $3, $4, $5, false, false) 
    RETURNING *`;

  try {
    const result = await pool.query(query, [titulo, descricao || '', categoria, data, req.user!.id]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Erro ao criar" }); }
});

// PUT: Editar (NOVA ROTA)
app.put('/atividades/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, categoria, data } = req.body;

  const query = `
    UPDATE atividades 
    SET titulo = $1, descricao = $2, categoria = $3, data = $4
    WHERE id = $5 AND usuario_id = $6
    RETURNING *`;

  try {
    const result = await pool.query(query, [titulo, descricao, categoria, data, id, req.user!.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Atividade não encontrada." });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Erro ao editar" }); }
});

// PATCH: Finalizar/Reabrir
app.patch('/atividades/:id/finalizar', authenticateToken, async (req, res) => {
  await pool.query('UPDATE atividades SET finalizada = NOT finalizada WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user!.id]);
  res.sendStatus(200);
});

// PATCH: Prioridade
app.patch('/atividades/:id/prioridade', authenticateToken, async (req, res) => {
  await pool.query('UPDATE atividades SET importante = NOT importante WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user!.id]);
  res.sendStatus(200);
});

// DELETE: Excluir
app.delete('/atividades/:id', authenticateToken, async (req, res) => {
  await pool.query('DELETE FROM atividades WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user!.id]);
  res.sendStatus(200);
});

app.listen(port, () => console.log(`🚀 Server rodando em http://localhost:${port}`));