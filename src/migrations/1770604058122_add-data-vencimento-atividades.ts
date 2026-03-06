import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Adicionar coluna data_vencimento na tabela atividades
  pgm.addColumn('atividades', {
    data_vencimento: { 
      type: 'timestamp',
      notNull: false
    }
  });

  // Criar índice para otimizar consultas por data de vencimento
  pgm.createIndex('atividades', 'data_vencimento', {
    name: 'idx_atividades_data_vencimento'
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remover índice
  pgm.dropIndex('atividades', 'data_vencimento', {
    name: 'idx_atividades_data_vencimento'
  });

  // Remover coluna data_vencimento
  pgm.dropColumn('atividades', 'data_vencimento');
}