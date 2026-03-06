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

export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const query = 'SELECT * FROM usuarios WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

export async function buscarUsuarioPorId(id: number): Promise<Usuario | null> {
  const query = 'SELECT id, nome, email, created_at, updated_at FROM usuarios WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function hashSenha(senha: string): Promise<string> {
  return await bcrypt.hash(senha, 10);
}

export async function compararSenha(senha: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(senha, hash);
}

export function gerarToken(payload: { id: number; email: string }): string {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(payload, secret, { expiresIn: expiresIn });
}

export function gerarRefreshToken(payload: { id: number; email: string }): string {
  const secret = process.env.JWT_REFRESH_SECRET as string;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn });
}

export async function registrarUsuario(dados: { nome: string; email: string; senha: string }): Promise<Usuario> {
  const { nome, email, senha } = dados;
  
  if (!nome || !email || !senha) {
    throw new Error('Todos os campos são obrigatórios.');
  }

  if (senha.length < 6) {
    throw new Error('A senha deve ter no mínimo 6 caracteres.');
  }

  const usuarioExistente = await buscarUsuarioPorEmail(email);
  if (usuarioExistente) {
    throw new Error('Este e-mail já está em uso.');
  }

  const senhaHash = await hashSenha(senha);

  const query = `
    INSERT INTO usuarios (nome, email, senha)
    VALUES ($1, $2, $3)
    RETURNING id, nome, email, created_at, updated_at
  `;
  
  const result = await pool.query(query, [nome, email, senhaHash]);
  return result.rows[0];
}

export async function autenticarUsuario(dados: { email: string; senha: string }): Promise<{ usuario: Usuario; token: string; refreshToken: string }> {
  const { email, senha } = dados;
  
  if (!email || !senha) {
    throw new Error('E-mail e senha são obrigatórios.');
  }

  const usuario = await buscarUsuarioPorEmail(email);
  if (!usuario || !usuario.senha) {
    throw new Error('Credenciais inválidas.');
  }

  const senhaValida = await compararSenha(senha, usuario.senha);
  if (!senhaValida) {
    throw new Error('Credenciais inválidas.');
  }

  const token = gerarToken({ id: usuario.id!, email: usuario.email });
  const refreshToken = gerarRefreshToken({ id: usuario.id!, email: usuario.email });

  delete usuario.senha;

  return { usuario, token, refreshToken };
}

export async function alterarSenha(usuarioId: number, senhaAtual: string, novaSenha: string): Promise<void> {
  if (!senhaAtual || !novaSenha) {
    throw new Error('Senha atual e nova senha são obrigatórias.');
  }

  if (novaSenha.length < 6) {
    throw new Error('A nova senha deve ter no mínimo 6 caracteres.');
  }

  const query = 'SELECT * FROM usuarios WHERE id = $1';
  const result = await pool.query(query, [usuarioId]);
  const usuario = result.rows[0];

  if (!usuario) {
    throw new Error('Usuário não encontrado.');
  }

  const senhaValida = await compararSenha(senhaAtual, usuario.senha);
  if (!senhaValida) {
    throw new Error('Senha atual incorreta.');
  }

  const novaSenhaHash = await hashSenha(novaSenha);

  const updateQuery = 'UPDATE usuarios SET senha = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
  await pool.query(updateQuery, [novaSenhaHash, usuarioId]);
}

export async function excluirConta(usuarioId: number, senha: string): Promise<void> {
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

  const deleteQuery = 'DELETE FROM usuarios WHERE id = $1';
  await pool.query(deleteQuery, [usuarioId]);
}