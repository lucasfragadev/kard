import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pool } from '../database.js';

// Configurações de upload
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  // Imagens
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Texto
  'text/plain',
  'text/csv',
  // Outros
  'application/zip',
  'application/x-zip-compressed',
  'application/json'
];

// Interface para dados do arquivo
export interface FileData {
  fieldName: string;
  originalName: string;
  encoding: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
}

// Interface para anexo salvo
export interface Anexo {
  id?: number;
  atividade_id: number;
  usuario_id: number;
  nome_arquivo: string;
  nome_armazenado: string;
  tipo_arquivo: string;
  tamanho: number;
  caminho: string;
  descricao?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Garantir que o diretório de uploads existe
function ensureUploadDirectory(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`📁 Diretório de uploads criado: ${UPLOAD_DIR}`);
  }
}

// Gerar nome único para o arquivo
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitizedBaseName}_${timestamp}_${randomString}${extension}`;
}

// Validar tipo de arquivo
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

// Validar tamanho do arquivo
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

// Obter extensão do arquivo baseado no MIME type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: { [key: string]: string } = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'application/zip': '.zip',
    'application/x-zip-compressed': '.zip',
    'application/json': '.json'
  };
  
  return mimeMap[mimeType] || '';
}

// Salvar arquivo no sistema de arquivos
export async function saveFile(fileData: FileData): Promise<{ fileName: string; filePath: string }> {
  ensureUploadDirectory();
  
  // Validar tipo de arquivo
  if (!validateFileType(fileData.mimeType)) {
    throw new Error(`Tipo de arquivo não permitido: ${fileData.mimeType}`);
  }
  
  // Validar tamanho do arquivo
  if (!validateFileSize(fileData.size)) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  // Gerar nome único
  const uniqueFileName = generateUniqueFileName(fileData.originalName);
  const filePath = path.join(UPLOAD_DIR, uniqueFileName);
  
  // Salvar arquivo
  await fs.promises.writeFile(filePath, fileData.buffer);
  
  console.log(`📁 Arquivo salvo: ${uniqueFileName}`);
  
  return {
    fileName: uniqueFileName,
    filePath: filePath
  };
}

// Criar registro de anexo no banco de dados
export async function criarAnexo(dados: Omit<Anexo, 'id' | 'created_at' | 'updated_at'>): Promise<Anexo> {
  const query = `
    INSERT INTO anexos (
      atividade_id, usuario_id, nome_arquivo, nome_armazenado, 
      tipo_arquivo, tamanho, caminho, descricao
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, atividade_id, usuario_id, nome_arquivo, nome_armazenado, 
              tipo_arquivo, tamanho, caminho, descricao, created_at, updated_at
  `;
  
  const valores = [
    dados.atividade_id,
    dados.usuario_id,
    dados.nome_arquivo,
    dados.nome_armazenado,
    dados.tipo_arquivo,
    dados.tamanho,
    dados.caminho,
    dados.descricao || null
  ];
  
  const result = await pool.query(query, valores);
  return result.rows[0];
}

// Buscar anexos por atividade
export async function buscarAnexosPorAtividade(atividadeId: number, usuarioId: number): Promise<Anexo[]> {
  const query = `
    SELECT id, atividade_id, usuario_id, nome_arquivo, nome_armazenado, 
           tipo_arquivo, tamanho, caminho, descricao, created_at, updated_at
    FROM anexos
    WHERE atividade_id = $1 AND usuario_id = $2
    ORDER BY created_at DESC
  `;
  
  const result = await pool.query(query, [atividadeId, usuarioId]);
  return result.rows;
}

// Buscar anexo por ID
export async function buscarAnexoPorId(anexoId: number, usuarioId: number): Promise<Anexo | null> {
  const query = `
    SELECT id, atividade_id, usuario_id, nome_arquivo, nome_armazenado, 
           tipo_arquivo, tamanho, caminho, descricao, created_at, updated_at
    FROM anexos
    WHERE id = $1 AND usuario_id = $2
  `;
  
  const result = await pool.query(query, [anexoId, usuarioId]);
  return result.rows[0] || null;
}

// Excluir anexo
export async function excluirAnexo(anexoId: number, usuarioId: number): Promise<boolean> {
  // Buscar anexo para obter o caminho do arquivo
  const anexo = await buscarAnexoPorId(anexoId, usuarioId);
  
  if (!anexo) {
    throw new Error('Anexo não encontrado');
  }
  
  // Excluir arquivo do sistema de arquivos
  try {
    if (fs.existsSync(anexo.caminho)) {
      await fs.promises.unlink(anexo.caminho);
      console.log(`🗑️ Arquivo excluído: ${anexo.nome_armazenado}`);
    }
  } catch (error) {
    console.error('Erro ao excluir arquivo do sistema:', error);
  }
  
  // Excluir registro do banco de dados
  const query = `
    DELETE FROM anexos
    WHERE id = $1 AND usuario_id = $2
  `;
  
  const result = await pool.query(query, [anexoId, usuarioId]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Obter caminho completo do arquivo
export function getFilePath(nomeArmazenado: string): string {
  return path.join(UPLOAD_DIR, nomeArmazenado);
}

// Verificar se arquivo existe
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

// Obter informações do arquivo
export async function getFileInfo(filePath: string): Promise<fs.Stats> {
  return await fs.promises.stat(filePath);
}

// Limpar anexos órfãos (arquivos sem registro no BD)
export async function limparAnexosOrfaos(): Promise<number> {
  ensureUploadDirectory();
  
  let removidos = 0;
  
  try {
    // Obter todos os arquivos do diretório
    const files = await fs.promises.readdir(UPLOAD_DIR);
    
    // Obter todos os nomes armazenados do banco
    const query = 'SELECT nome_armazenado FROM anexos';
    const result = await pool.query(query);
    const nomesArmazenados = new Set(result.rows.map((row: any) => row.nome_armazenado));
    
    // Remover arquivos que não estão no banco
    for (const file of files) {
      if (!nomesArmazenados.has(file)) {
        const filePath = path.join(UPLOAD_DIR, file);
        await fs.promises.unlink(filePath);
        removidos++;
        console.log(`🗑️ Arquivo órfão removido: ${file}`);
      }
    }
    
    console.log(`✅ Limpeza concluída. ${removidos} arquivo(s) órfão(s) removido(s).`);
  } catch (error) {
    console.error('Erro ao limpar anexos órfãos:', error);
    throw error;
  }
  
  return removidos;
}

// Obter tamanho total dos uploads de um usuário
export async function getTamanhoTotalUsuario(usuarioId: number): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(tamanho), 0) as total
    FROM anexos
    WHERE usuario_id = $1
  `;
  
  const result = await pool.query(query, [usuarioId]);
  return parseInt(result.rows[0].total);
}

// Obter estatísticas de uploads
export async function getEstatisticasUpload(usuarioId: number): Promise<{
  total_arquivos: number;
  tamanho_total: number;
  tamanho_medio: number;
  tipos_arquivo: { tipo: string; quantidade: number }[];
}> {
  const queryTotal = `
    SELECT 
      COUNT(*) as total_arquivos,
      COALESCE(SUM(tamanho), 0) as tamanho_total,
      COALESCE(AVG(tamanho), 0) as tamanho_medio
    FROM anexos
    WHERE usuario_id = $1
  `;
  
  const queryTipos = `
    SELECT tipo_arquivo as tipo, COUNT(*) as quantidade
    FROM anexos
    WHERE usuario_id = $1
    GROUP BY tipo_arquivo
    ORDER BY quantidade DESC
  `;
  
  const resultTotal = await pool.query(queryTotal, [usuarioId]);
  const resultTipos = await pool.query(queryTipos, [usuarioId]);
  
  return {
    total_arquivos: parseInt(resultTotal.rows[0].total_arquivos),
    tamanho_total: parseInt(resultTotal.rows[0].tamanho_total),
    tamanho_medio: parseFloat(resultTotal.rows[0].tamanho_medio),
    tipos_arquivo: resultTipos.rows
  };
}

// Inicializar serviço de upload
export function initUploadService(): void {
  ensureUploadDirectory();
  console.log('📁 Serviço de upload inicializado');
  console.log(`📁 Diretório de uploads: ${UPLOAD_DIR}`);
  console.log(`📁 Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  console.log(`📁 Tipos permitidos: ${ALLOWED_MIME_TYPES.length} tipos`);
}