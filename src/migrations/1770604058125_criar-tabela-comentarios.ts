import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('comentarios', {
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
      comment: 'ID do usuário que criou o comentário'
    },
    conteudo: {
      type: 'text',
      notNull: true,
      comment: 'Conteúdo do comentário'
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
  pgm.createIndex('comentarios', 'atividade_id', {
    name: 'idx_comentarios_atividade_id'
  });

  pgm.createIndex('comentarios', 'usuario_id', {
    name: 'idx_comentarios_usuario_id'
  });

  pgm.createIndex('comentarios', 'created_at', {
    name: 'idx_comentarios_created_at'
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remover índices
  pgm.dropIndex('comentarios', 'created_at', {
    name: 'idx_comentarios_created_at'
  });

  pgm.dropIndex('comentarios', 'usuario_id', {
    name: 'idx_comentarios_usuario_id'
  });

  pgm.dropIndex('comentarios', 'atividade_id', {
    name: 'idx_comentarios_atividade_id'
  });

  // Remover tabela
  pgm.dropTable('comentarios');
}