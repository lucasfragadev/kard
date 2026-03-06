import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Criar tabela anexos
  pgm.createTable('anexos', {
    id: 'id',
    atividade_id: {
      type: 'integer',
      notNull: true,
      references: 'atividades(id)',
      onDelete: 'CASCADE',
      comment: 'ID da atividade relacionada'
    },
    usuario_id: {
      type: 'integer',
      notNull: true,
      references: 'usuarios(id)',
      onDelete: 'CASCADE',
      comment: 'ID do usuário que fez o upload'
    },
    nome_arquivo: {
      type: 'varchar(255)',
      notNull: true,
      comment: 'Nome original do arquivo'
    },
    nome_armazenado: {
      type: 'varchar(255)',
      notNull: true,
      comment: 'Nome do arquivo armazenado no sistema'
    },
    tipo_arquivo: {
      type: 'varchar(100)',
      notNull: true,
      comment: 'MIME type do arquivo'
    },
    tamanho: {
      type: 'integer',
      notNull: true,
      comment: 'Tamanho do arquivo em bytes'
    },
    caminho: {
      type: 'varchar(500)',
      notNull: true,
      comment: 'Caminho ou URL do arquivo armazenado'
    },
    descricao: {
      type: 'text',
      notNull: false,
      comment: 'Descrição opcional do anexo'
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp')
    }
  });

  // Criar índices para otimização
  pgm.createIndex('anexos', 'atividade_id', {
    name: 'idx_anexos_atividade_id'
  });

  pgm.createIndex('anexos', 'usuario_id', {
    name: 'idx_anexos_usuario_id'
  });

  pgm.createIndex('anexos', 'created_at', {
    name: 'idx_anexos_created_at'
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remover índices
  pgm.dropIndex('anexos', 'created_at', {
    name: 'idx_anexos_created_at'
  });

  pgm.dropIndex('anexos', 'usuario_id', {
    name: 'idx_anexos_usuario_id'
  });

  pgm.dropIndex('anexos', 'atividade_id', {
    name: 'idx_anexos_atividade_id'
  });

  // Remover tabela
  pgm.dropTable('anexos');
}