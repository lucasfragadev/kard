import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Criar tabela de blacklist de tokens
  pgm.createTable('token_blacklist', {
    id: {
      type: 'serial',
      primaryKey: true
    },
    token_hash: {
      type: 'varchar(64)',
      notNull: true,
      unique: true
    },
    revoked_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()')
    },
    expires_at: {
      type: 'timestamp',
      notNull: true
    }
  });

  // Criar índice para busca rápida por hash
  pgm.createIndex('token_blacklist', 'token_hash', {
    name: 'idx_token_blacklist_hash'
  });

  // Criar índice para limpeza de tokens expirados
  pgm.createIndex('token_blacklist', 'expires_at', {
    name: 'idx_token_blacklist_expires_at'
  });

  // Adicionar comentário na tabela
  pgm.sql(`
    COMMENT ON TABLE token_blacklist IS 'Armazena tokens JWT revogados para impedir reutilização';
  `);

  pgm.sql(`
    COMMENT ON COLUMN token_blacklist.token_hash IS 'Hash SHA256 do token revogado';
  `);

  pgm.sql(`
    COMMENT ON COLUMN token_blacklist.revoked_at IS 'Data e hora da revogação';
  `);

  pgm.sql(`
    COMMENT ON COLUMN token_blacklist.expires_at IS 'Data e hora de expiração do token (após essa data pode ser removido da blacklist)';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remover índices
  pgm.dropIndex('token_blacklist', 'expires_at', {
    name: 'idx_token_blacklist_expires_at'
  });

  pgm.dropIndex('token_blacklist', 'token_hash', {
    name: 'idx_token_blacklist_hash'
  });

  // Remover tabela
  pgm.dropTable('token_blacklist');
}