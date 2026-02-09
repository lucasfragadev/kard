import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('atividades', {
    id: 'id',
    data: { type: 'varchar(20)', notNull: true },
    categoria: { type: 'varchar(50)' },
    descricao: { type: 'text', notNull: true },
    importante: { type: 'boolean', default: false },
    finalizada: { type: 'boolean', default: false },
    ordem: { type: 'serial' },
    criado_em: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('atividades');
}