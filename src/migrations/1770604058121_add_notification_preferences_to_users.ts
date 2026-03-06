import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Adicionar colunas de preferências de notificação
  pgm.addColumns('usuarios', {
    notificacoes_ativadas: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Indica se o usuário ativou as notificações'
    },
    notificar_prazo: {
      type: 'boolean',
      notNull: true,
      default: true,
      comment: 'Notificar quando uma atividade está próxima do prazo'
    },
    notificar_conclusao: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Notificar quando uma atividade for concluída'
    },
    tempo_antecedencia: {
      type: 'integer',
      notNull: true,
      default: 30,
      comment: 'Tempo em minutos de antecedência para notificar sobre prazos'
    },
    horario_notificacao_inicio: {
      type: 'time',
      notNull: false,
      default: '08:00:00',
      comment: 'Horário de início para envio de notificações'
    },
    horario_notificacao_fim: {
      type: 'time',
      notNull: false,
      default: '22:00:00',
      comment: 'Horário de fim para envio de notificações'
    }
  });

  // Criar índice para otimizar consultas de usuários com notificações ativadas
  pgm.createIndex('usuarios', 'notificacoes_ativadas', {
    name: 'idx_usuarios_notificacoes_ativadas',
    where: 'notificacoes_ativadas = true'
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Remover índice
  pgm.dropIndex('usuarios', 'notificacoes_ativadas', {
    name: 'idx_usuarios_notificacoes_ativadas'
  });

  // Remover colunas na ordem inversa
  pgm.dropColumns('usuarios', [
    'horario_notificacao_fim',
    'horario_notificacao_inicio',
    'tempo_antecedencia',
    'notificar_conclusao',
    'notificar_prazo',
    'notificacoes_ativadas'
  ]);
}