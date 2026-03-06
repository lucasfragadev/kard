import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Criar índice para usuario_id
  pgm.createIndex('atividades', 'usuario_id', {
    name: 'idx_atividades_usuario_id'
  });

  // Criar índice para concluida (finalizada)
  pgm.createIndex('atividades', 'finalizada', {
    name: 'idx_atividades_concluida'
  });

  // Criar índice para prioridade (importante)
  pgm.createIndex('atividades', 'importante', {
    name: 'idx_atividades_prioridade'
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remover índices na ordem inversa
  pgm.dropIndex('atividades', 'importante', {
    name: 'idx_atividades_prioridade'
  });

  pgm.dropIndex('atividades', 'finalizada', {
    name: 'idx_atividades_concluida'
  });

  pgm.dropIndex('atividades', 'usuario_id', {
    name: 'idx_atividades_usuario_id'
  });
}