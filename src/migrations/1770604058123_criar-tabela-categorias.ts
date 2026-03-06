import { MigrationBuilder } from 'node-pg-migrate';

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Criar tabela categorias
  pgm.createTable('categorias', {
    id: 'id',
    nome: { 
      type: 'varchar(100)', 
      notNull: true 
    },
    cor: { 
      type: 'varchar(7)', 
      notNull: false,
      comment: 'Cor em formato hexadecimal (ex: #FF5733)'
    },
    icone: { 
      type: 'varchar(50)', 
      notNull: false,
      comment: 'Nome do ícone ou emoji'
    },
    descricao: { 
      type: 'text', 
      notNull: false 
    },
    usuario_id: {
      type: 'integer',
      notNull: true,
      references: 'usuarios(id)',
      onDelete: 'CASCADE'
    },
    ativa: {
      type: 'boolean',
      notNull: true,
      default: true
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
  pgm.createIndex('categorias', 'usuario_id', {
    name: 'idx_categorias_usuario_id'
  });

  pgm.createIndex('categorias', ['usuario_id', 'nome'], {
    name: 'idx_categorias_usuario_nome',
    unique: true
  });

  // Adicionar coluna categoria_id na tabela atividades
  pgm.addColumn('atividades', {
    categoria_id: {
      type: 'integer',
      notNull: false,
      references: 'categorias(id)',
      onDelete: 'SET NULL'
    }
  });

  // Criar índice para categoria_id em atividades
  pgm.createIndex('atividades', 'categoria_id', {
    name: 'idx_atividades_categoria_id'
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remover índice de categoria_id em atividades
  pgm.dropIndex('atividades', 'categoria_id', {
    name: 'idx_atividades_categoria_id'
  });

  // Remover coluna categoria_id da tabela atividades
  pgm.dropColumn('atividades', 'categoria_id');

  // Remover índices da tabela categorias
  pgm.dropIndex('categorias', ['usuario_id', 'nome'], {
    name: 'idx_categorias_usuario_nome'
  });

  pgm.dropIndex('categorias', 'usuario_id', {
    name: 'idx_categorias_usuario_id'
  });

  // Remover tabela categorias
  pgm.dropTable('categorias');
}