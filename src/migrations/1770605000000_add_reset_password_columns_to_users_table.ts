import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Adicionar campos de reset de senha na tabela usuarios
  pgm.addColumns('usuarios', {
    reset_token: {
      type: 'varchar(255)',
      notNull: false,
      comment: 'Token único para validação de reset de senha'
    },
    reset_token_expires: {
      type: 'timestamp',
      notNull: false,
      comment: 'Data e hora de expiração do token de reset'
    },
    reset_requested_at: {
      type: 'timestamp',
      notNull: false,
      comment: 'Data e hora da última solicitação de reset'
    }
  });

  // Criar índice para otimizar busca por token
  pgm.createIndex('usuarios', 'reset_token', {
    name: 'idx_usuarios_reset_token',
    unique: false
  });

  // Criar índice composto para busca eficiente de tokens válidos
  pgm.createIndex('usuarios', ['reset_token', 'reset_token_expires'], {
    name: 'idx_usuarios_reset_token_valid',
    unique: false
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remover índices na ordem inversa
  pgm.dropIndex('usuarios', ['reset_token', 'reset_token_expires'], {
    name: 'idx_usuarios_reset_token_valid'
  });

  pgm.dropIndex('usuarios', 'reset_token', {
    name: 'idx_usuarios_reset_token'
  });

  // Remover colunas na ordem inversa
  pgm.dropColumns('usuarios', [
    'reset_requested_at',
    'reset_token_expires',
    'reset_token'
  ]);
}