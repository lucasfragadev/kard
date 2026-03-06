import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumn(
    'atividades',
    {
      ordem: {
        type: 'integer',
        notNull: true,
        default: 0
      }
    },
    { ifNotExists: true }
  );

  pgm.sql(`
    UPDATE atividades
    SET ordem = subquery.row_number
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY usuario_id ORDER BY id ASC) AS row_number
      FROM atividades
    ) AS subquery
    WHERE atividades.id = subquery.id
      AND atividades.ordem = 0
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('atividades', 'ordem', { ifExists: true });
}