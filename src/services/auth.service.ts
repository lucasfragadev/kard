import { pool } from '../database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Buscar usuário por email
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const query = 'SELECT * FROM usuarios WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

// Buscar usuário por ID
export async function buscarUsuarioPorId(id: number): Promise<Usuario | null> {
  const query = 'SELECT id, nome, email, created_at, updated_at FROM usuarios WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// Hash de senha
export async function hashSenha(senha: string): Promise<string> {
  return await bcrypt.hash(senha, 10);
}

// Comparar senha
export async function compararSenha(senha: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(senha, hash);
}

// Gerar token JWT
export function gerarToken(payload: { id: number; email: string }): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
}

// Gerar refresh token
export function gerarRefreshToken(payload: { id: number; email: string }): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
}

// Registrar usuário
export async function registrarUsuario(dados: { nome: string; email: string; senha: string }): Promise<Usuario> {
  const { nome, email, senha } = dados;
  
  // Validações
  if (!nome || !email || !senha) {
    throw new Error('Todos os campos são obrigatórios.');
  }

  if (senha.length < 6) {
    throw new Error('A senha deve ter no mínimo 6 caracteres.');
  }

  // Verificar se o email já existe
  const usuarioExistente = await buscarUsuarioPorEmail(email);
  if (usuarioExistente) {
    throw new Error('Este e-mail já está em uso.');
  }

  // Hash da senha
  const senhaHash = await hashSenha(senha);

  // Inserir no banco
  const query = `
    INSERT INTO usuarios (nome, email, senha)
    VALUES ($1, $2, $3)
    RETURNING id, nome, email, created_at, updated_at
  `;
  
  const result = await pool.query(query, [nome, email, senhaHash]);
  return result.rows[0];
}

// Autenticar usuário
export async function autenticarUsuario(dados: { email: string; senha: string }): Promise<{ usuario: Usuario; token: string; refreshToken: string }> {
  const { email, senha } = dados;
  
  // Validações
  if (!email || !senha) {
    throw new Error('E-mail e senha são obrigatórios.');
  }

  // Buscar usuário
  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario || !usuario.senha) {
    throw new Error('Credenciais inválidas.');
  }

  // Verificar senha
  const senhaValida = await compararSenha(senha, usuario.senha);
  if (!senhaValida) {
    throw new Error('Credenciais inválidas.');
  }

  // Gerar tokens
  const token = gerarToken({ id: usuario.id!, email: usuario.email });
  const refreshToken = gerarRefreshToken({ id: usuario.id!, email: usuario.email });

  // Remover senha do objeto de retorno
  delete usuario.senha;

  return { usuario, token, refreshToken };
}

// Alterar senha (usuário logado)
export async function alterarSenha(usuarioId: number, senhaAtual: string, novaSenha: string): Promise<void> {
  // Validações
  if (!senhaAtual || !novaSenha) {
    throw new Error('Senha atual e nova senha são obrigatórias.');
  }

  if (novaSenha.length < 6) {
    throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  }

  // Buscar usuário
  const query = 'SELECT * FROM usuarios WHERE id = $1';
  const result = await pool.query(query, [usuarioId]);
  const usuario = result.rows[0];

  if (!usuario) {
    throw new Error('Usuário não encontrado.');
  }

  // Verificar senha atual
  const senhaValida = await compararSenha(senhaAtual, usuario.senha);
  if (!senhaValida) {
    throw new Error('Senha atual incorreta.');
  }

  // Hash da nova senha
  const novaSenhaHash = await hashSenha(novaSenha);

  // Atualizar senha
  const updateQuery = 'UPDATE usuarios SET senha = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
  await pool.query(updateQuery, [novaSenhaHash, usuarioId]);
}

// Excluir conta
export async function excluirConta(usuarioId: number, senha: string): Promise<void> {
  // Validar senha
  const query = 'SELECT * FROM usuarios WHERE id = $1';
  const result = await pool.query(query, [usuarioId]);
  const usuario = result.rows[0];

  if (!usuario) {
    throw new Error('Usuário não encontrado.');
  }

  const senhaValida = await compararSenha(senha, usuario.senha);
  if (!senhaValida) {
    throw new Error('Senha incorreta.');
  }

  // Excluir usuário (cascade vai deletar atividades relacionadas)
  const deleteQuery = 'DELETE FROM usuarios WHERE id = $1';
  await pool.query(deleteQuery, [usuarioId]);
}