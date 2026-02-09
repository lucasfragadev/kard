import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn('atividades', {
    titulo: { type: 'varchar(255)' }
  });

  pgm.sql('UPDATE atividades SET titulo = descricao');
  
  }

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('atividades', 'titulo');
}