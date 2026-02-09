import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('atividades', {
    usuario_id: {
      type: 'integer',
      notNull: true,
      references: '"usuarios"',
      onDelete: 'CASCADE',   
    },
  });

  pgm.createIndex('atividades', 'usuario_id');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('atividades', 'usuario_id');
}