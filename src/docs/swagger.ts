import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kard API - Sistema de Gerenciamento de Atividades',
      version: process.env.API_VERSION || '1.0.0',
      description: 'API REST para gerenciamento inteligente de atividades e tarefas. Sistema completo com autenticação, CRUD de atividades, comentários, anexos e muito mais.',
      contact: {
        name: 'Equipe Kard',
        email: 'contato@kard.app',
        url: 'https://kard.app'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.kard.app',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido no endpoint de login'
        }
      },
      schemas: {
        // Schema de Usuário
        Usuario: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do usuário',
              example: 1
            },
            nome: {
              type: 'string',
              description: 'Nome completo do usuário',
              example: 'João Silva'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'E-mail do usuário',
              example: 'joao@email.com'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação da conta'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        // Schema de Atividade
        Atividade: {
          type: 'object',
          required: ['data', 'categoria', 'descricao'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único da atividade',
              example: 1
            },
            data: {
              type: 'string',
              format: 'date',
              description: 'Data da atividade (YYYY-MM-DD)',
              example: '2024-01-15'
            },
            categoria: {
              type: 'string',
              description: 'Categoria da atividade',
              example: 'Trabalho',
              enum: ['Trabalho', 'Pessoal', 'Estudos', 'Saúde', 'Outros']
            },
            descricao: {
              type: 'string',
              description: 'Descrição detalhada da atividade',
              example: 'Reunião com equipe de desenvolvimento'
            },
            importante: {
              type: 'boolean',
              description: 'Indica se a atividade é prioritária',
              example: false,
              default: false
            },
            finalizada: {
              type: 'boolean',
              description: 'Indica se a atividade foi concluída',
              example: false,
              default: false
            },
            ordem: {
              type: 'integer',
              description: 'Ordem de exibição da atividade',
              example: 1,
              default: 0
            },
            usuario_id: {
              type: 'integer',
              description: 'ID do usuário proprietário'
            },
            data_vencimento: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de vencimento da atividade',
              nullable: true
            },
            categoria_id: {
              type: 'integer',
              description: 'ID da categoria personalizada',
              nullable: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        // Schema de Comentário
        Comentario: {
          type: 'object',
          required: ['conteudo'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do comentário',
              example: 1
            },
            atividade_id: {
              type: 'integer',
              description: 'ID da atividade relacionada',
              example: 1
            },
            usuario_id: {
              type: 'integer',
              description: 'ID do usuário que criou o comentário',
              example: 1
            },
            conteudo: {
              type: 'string',
              description: 'Conteúdo do comentário',
              example: 'Lembrar de revisar os documentos antes da reunião'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        // Schema de Anexo
        Anexo: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do anexo',
              example: 1
            },
            atividade_id: {
              type: 'integer',
              description: 'ID da atividade relacionada',
              example: 1
            },
            usuario_id: {
              type: 'integer',
              description: 'ID do usuário que fez o upload',
              example: 1
            },
            nome_arquivo: {
              type: 'string',
              description: 'Nome original do arquivo',
              example: 'documento.pdf'
            },
            nome_armazenado: {
              type: 'string',
              description: 'Nome do arquivo no sistema',
              example: 'documento_1234567890_abcd1234.pdf'
            },
            tipo_arquivo: {
              type: 'string',
              description: 'MIME type do arquivo',
              example: 'application/pdf'
            },
            tamanho: {
              type: 'integer',
              description: 'Tamanho do arquivo em bytes',
              example: 1024000
            },
            caminho: {
              type: 'string',
              description: 'Caminho do arquivo no sistema',
              example: '/uploads/documento_1234567890_abcd1234.pdf'
            },
            descricao: {
              type: 'string',
              description: 'Descrição opcional do anexo',
              nullable: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de upload'
            }
          }
        },
        // Schema de Resposta de Sucesso
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operação realizada com sucesso'
            },
            data: {
              type: 'object',
              description: 'Dados retornados pela operação'
            }
          }
        },
        // Schema de Resposta de Erro
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Mensagem de erro'
            },
            code: {
              type: 'string',
              example: 'ERROR_CODE',
              description: 'Código do erro para tratamento programático'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de autenticação inválido ou ausente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Token inválido ou expirado',
                code: 'UNAUTHORIZED'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso não encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Recurso não encontrado',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        ValidationError: {
          description: 'Erro de validação dos dados enviados',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Dados inválidos fornecidos',
                code: 'VALIDATION_ERROR'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints para autenticação e gerenciamento de usuários'
      },
      {
        name: 'Atividades',
        description: 'Endpoints para gerenciamento de atividades e tarefas'
      },
      {
        name: 'Comentários',
        description: 'Endpoints para gerenciamento de comentários em atividades'
      },
      {
        name: 'Anexos',
        description: 'Endpoints para gerenciamento de anexos em atividades'
      },
      {
        name: 'Perfil',
        description: 'Endpoints para gerenciamento do perfil do usuário'
      }
    ],
    paths: {
      // ========== AUTENTICAÇÃO ==========
      '/api/v1/auth/registro': {
        post: {
          tags: ['Autenticação'],
          summary: 'Registrar novo usuário',
          description: 'Cria uma nova conta de usuário no sistema',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nome', 'email', 'senha'],
                  properties: {
                    nome: {
                      type: 'string',
                      minLength: 3,
                      example: 'João Silva'
                    },
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'joao@email.com'
                    },
                    senha: {
                      type: 'string',
                      minLength: 6,
                      example: 'senha123'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Usuário criado com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Usuário criado com sucesso!' },
                      data: {
                        type: 'object',
                        properties: {
                          usuario: { $ref: '#/components/schemas/Usuario' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Autenticação'],
          summary: 'Fazer login',
          description: 'Autentica um usuário e retorna um token JWT',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'senha'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'joao@email.com'
                    },
                    senha: {
                      type: 'string',
                      example: 'senha123'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login realizado com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Login realizado com sucesso!' },
                      data: {
                        type: 'object',
                        properties: {
                          usuario: { $ref: '#/components/schemas/Usuario' },
                          token: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': {
              description: 'Credenciais inválidas',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/forgot-password': {
        post: {
          tags: ['Autenticação'],
          summary: 'Solicitar recuperação de senha',
          description: 'Envia um e-mail com link para redefinição de senha',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'joao@email.com'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'E-mail de recuperação enviado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: {
                        type: 'string',
                        example: 'E-mail de recuperação enviado com sucesso!'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/auth/reset-password': {
        post: {
          tags: ['Autenticação'],
          summary: 'Redefinir senha',
          description: 'Redefine a senha do usuário usando o token recebido por e-mail',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['token', 'novaSenha'],
                  properties: {
                    token: {
                      type: 'string',
                      example: 'abc123...'
                    },
                    novaSenha: {
                      type: 'string',
                      minLength: 6,
                      example: 'novaSenha123'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Senha redefinida com sucesso',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' }
          }
        }
      },
      // ========== ATIVIDADES ==========
      '/api/v1/atividades': {
        get: {
          tags: ['Atividades'],
          summary: 'Listar atividades',
          description: 'Retorna todas as atividades do usuário autenticado com filtros opcionais',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'categoria',
              in: 'query',
              description: 'Filtrar por categoria',
              required: false,
              schema: { type: 'string' }
            },
            {
              name: 'finalizada',
              in: 'query',
              description: 'Filtrar por status de conclusão',
              required: false,
              schema: { type: 'boolean' }
            },
            {
              name: 'importante',
              in: 'query',
              description: 'Filtrar por prioridade',
              required: false,
              schema: { type: 'boolean' }
            },
            {
              name: 'data',
              in: 'query',
              description: 'Filtrar por data específica (YYYY-MM-DD)',
              required: false,
              schema: { type: 'string', format: 'date' }
            }
          ],
          responses: {
            '200': {
              description: 'Lista de atividades retornada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Atividade' }
                      },
                      message: {
                        type: 'string',
                        example: 'Atividades recuperadas com sucesso'
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        },
        post: {
          tags: ['Atividades'],
          summary: 'Criar nova atividade',
          description: 'Cria uma nova atividade para o usuário autenticado',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data', 'categoria', 'descricao'],
                  properties: {
                    data: {
                      type: 'string',
                      format: 'date',
                      example: '2024-01-15'
                    },
                    categoria: {
                      type: 'string',
                      example: 'Trabalho'
                    },
                    descricao: {
                      type: 'string',
                      example: 'Reunião com equipe'
                    },
                    importante: {
                      type: 'boolean',
                      example: false,
                      default: false
                    },
                    data_vencimento: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Atividade criada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Atividade' },
                      message: {
                        type: 'string',
                        example: 'Atividade criada com sucesso'
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/v1/atividades/{id}': {
        put: {
          tags: ['Atividades'],
          summary: 'Atualizar atividade',
          description: 'Atualiza os dados de uma atividade existente',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID da atividade',
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'string', format: 'date' },
                    categoria: { type: 'string' },
                    descricao: { type: 'string' },
                    importante: { type: 'boolean' },
                    data_vencimento: {
                      type: 'string',
                      format: 'date-time',
                      nullable: true
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Atividade atualizada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Atividade' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFoundError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        },
        delete: {
          tags: ['Atividades'],
          summary: 'Excluir atividade',
          description: 'Remove uma atividade do sistema',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID da atividade',
              schema: { type: 'integer' }
            }
          ],
          responses: {
            '200': {
              description: 'Atividade excluída com sucesso',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFoundError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/v1/atividades/{id}/toggle': {
        patch: {
          tags: ['Atividades'],
          summary: 'Alternar status de conclusão',
          description: 'Marca uma atividade como concluída ou não concluída',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID da atividade',
              schema: { type: 'integer' }
            }
          ],
          responses: {
            '200': {
              description: 'Status alterado com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Atividade' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFoundError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/v1/atividades/{id}/priority': {
        patch: {
          tags: ['Atividades'],
          summary: 'Alternar prioridade',
          description: 'Marca uma atividade como importante ou não importante',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID da atividade',
              schema: { type: 'integer' }
            }
          ],
          responses: {
            '200': {
              description: 'Prioridade alterada com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Atividade' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFoundError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/v1/atividades/export': {
        post: {
          tags: ['Atividades'],
          summary: 'Exportar atividades',
          description: 'Exporta as atividades em formato JSON, CSV ou PDF',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['format'],
                  properties: {
                    format: {
                      type: 'string',
                      enum: ['json', 'csv', 'pdf'],
                      example: 'json'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Dados exportados com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { type: 'string' },
                      filename: { type: 'string' }
                    }
                  }
                },
                'text/csv': {
                  schema: {
                    type: 'string',
                    format: 'binary'
                  }
                },
                'application/pdf': {
                  schema: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/v1/atividades/import': {
        post: {
          tags: ['Atividades'],
          summary: 'Importar atividades',
          description: 'Importa atividades de um arquivo JSON ou CSV',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['format', 'data'],
                  properties: {
                    format: {
                      type: 'string',
                      enum: ['json', 'csv'],
                      example: 'json'
                    },
                    data: {
                      type: 'string',
                      description: 'Dados a serem importados'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Dados importados com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: {
                        type: 'string',
                        example: '10 atividades importadas com sucesso'
                      }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },
      // ========== COMENTÁRIOS ==========
      '/api/v1/comentarios/{atividadeId}': {
        get: {
          tags: ['Comentários'],
          summary: 'Listar comentários de uma atividade',
          description: 'Retorna todos os comentários de uma atividade específica',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'atividadeId',
              in: 'path',
              required: true,
              description: 'ID da atividade',
              schema: { type: 'integer' }
            }
          ],
          responses: {
            '200': {
              description: 'Lista de comentários',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Comentario' }
                      }
                    }
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        },
        post: {
          tags: ['Comentários'],
          summary: 'Criar comentário',
          description: 'Adiciona um novo comentário a uma atividade',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'atividadeId',
              in: 'path',
              required: true,
              description: 'ID da atividade',
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['conteudo'],
                  properties: {
                    conteudo: {
                      type: 'string',
                      example: 'Lembrar de revisar os documentos'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Comentário criado com sucesso',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Comentario' }
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      },
      '/api/v1/comentarios/{atividadeId}/{id}': {
        put: {
          tags: ['Comentários'],
          summary: 'Atualizar comentário',
          description: 'Atualiza o conteúdo de um comentário existente',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'atividadeId',
              in: 'path',
              required: true,
              description: 'ID da atividade',
              schema: { type: 'integer' }
            },
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID do comentário',
              schema: { type: 'integer' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['conteudo'],
                  properties: {
                    conteudo: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Comentário atualizado',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Comentario' }
                    }
                  }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFoundError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        },
        delete: {
          tags: ['Comentários'],
          summary: 'Excluir comentário',
          description: 'Remove um comentário',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'atividadeId',
              in: 'path',
              required: true,
              description: 'ID da atividade',
              schema: { type: 'integer' }
            },
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID do comentário',
              schema: { type: 'integer' }
            }
          ],
          responses: {
            '200': {
              description: 'Comentário excluído',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SuccessResponse' }
                }
              }
            },
            '404': { $ref: '#/components/responses/NotFoundError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/services/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Kard API Documentation',
    customfavIcon: '/favicon.ico'
  }));

  // JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log('📚 Swagger documentation disponível em /api-docs');
}

export default swaggerSpec;