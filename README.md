# 📋 Kard - Sistema de Gerenciamento de Atividades

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-blue.svg)

Sistema inteligente de gerenciamento de atividades e tarefas desenvolvido com Node.js, TypeScript, Express e PostgreSQL. Organize seu dia com facilidade, produtividade e uma interface moderna e responsiva.

## 📸 Screenshots

> *Adicione aqui screenshots do seu projeto*

## ✨ Features

### Gerenciamento de Atividades
- ✅ Criar, editar, excluir e listar atividades
- 🎯 Marcar atividades como importantes (prioridade)
- ✔️ Marcar atividades como concluídas
- 📅 Definir datas e prazos para atividades
- 🔄 Arrastar e soltar para reordenar tarefas (Drag & Drop)
- 📊 Dashboard com estatísticas e gráficos de produtividade

### Organização e Filtros
- 🏷️ Categorias personalizáveis com cores e ícones
- 🔍 Sistema de busca avançado
- 🎨 Filtros por status, prioridade, categoria e data
- 📈 Ordenação flexível (data, prioridade, categoria)
- 📄 Paginação e carregamento incremental (Infinite Scroll)

### Colaboração e Documentação
- 💬 Sistema de comentários em atividades
- 📎 Anexos de arquivos (imagens, documentos, PDFs)
- 📋 Histórico de atividades
- 🔔 Notificações de prazos próximos

### Importação e Exportação
- 📥 Importar atividades (JSON, CSV)
- 📤 Exportar atividades (JSON, CSV, PDF)
- 💾 Backup automático de dados

### Autenticação e Segurança
- 🔐 Sistema de autenticação JWT
- 👤 Gerenciamento de perfil de usuário
- 🛡️ Rate limiting para proteção contra ataques
- 🔒 Blacklist de tokens
- 🔄 Refresh tokens

### Interface e UX
- 🎨 3 temas (Claro, Escuro, Alto Contraste)
- 📱 Design totalmente responsivo (Mobile-first)
- ⌨️ Atalhos de teclado
- ♿ Acessibilidade (ARIA, WCAG)
- 🚀 PWA com suporte offline
- 🔄 Service Worker para cache e sincronização
- ⚡ Performance otimizada com cache
- 🌐 Internacionalização (i18n) pronta

### Infraestrutura
- 📝 Sistema de logs com Winston
- 🐳 Suporte completo a Docker
- 📊 Health check endpoint
- 🔄 Graceful shutdown
- 📦 Migrations automáticas de banco de dados
- 🎯 API RESTful documentada com Swagger

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **TypeScript** - Superset JavaScript com tipagem estática
- **Express** - Framework web minimalista
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticação baseada em tokens
- **Bcrypt** - Hash de senhas
- **Winston** - Sistema de logs
- **PDFKit** - Geração de PDFs

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização avançada
- **JavaScript (ES6+)** - Lógica do cliente
- **Tailwind CSS** - Framework CSS utility-first
- **Service Worker** - Funcionalidades PWA

### DevOps e Ferramentas
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **ESLint** - Linting de código
- **Prettier** - Formatação de código
- **Husky** - Git hooks
- **node-pg-migrate** - Migrations de banco de dados
- **Terser** - Minificação de JavaScript
- **CSSnano** - Minificação de CSS

## 📋 Requisitos

### Obrigatórios
- Node.js >= 18.0.0
- PostgreSQL >= 12.0
- npm >= 8.0.0 ou yarn >= 1.22.0

### Opcionais
- Docker >= 20.10.0
- Docker Compose >= 2.0.0

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd kard
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
PORT=3000
NODE_ENV=development
API_VERSION=1.0.0

# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/kard
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kard
DB_USER=usuario
DB_PASSWORD=senha

# JWT
JWT_SECRET=seu_secret_muito_seguro_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_muito_seguro_aqui
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Limites
MAX_FILE_SIZE=10485760
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache
CACHE_TTL=60000

# Logs
LOG_LEVEL=info
```

### 4. Configure o banco de dados

#### Opção A: PostgreSQL local

Crie o banco de dados:

```bash
createdb kard
```

Execute as migrations:

```bash
npm run migrate
```

#### Opção B: Docker

```bash
npm run docker:up
```

### 5. Inicie o servidor

#### Desenvolvimento

```bash
npm run dev
```

#### Produção

```bash
npm run build
npm start
```

O servidor estará disponível em `http://localhost:3000`

## 🐳 Docker

### Construir a imagem

```bash
npm run docker:build
```

### Executar com Docker Compose

```bash
# Iniciar serviços
npm run docker:up

# Ver logs
npm run docker:logs

# Parar serviços
npm run docker:down

# Reiniciar serviços
npm run docker:restart

# Reconstruir e iniciar
npm run docker:rebuild
```

## 📦 Comandos Disponíveis

### Desenvolvimento

```bash
npm run dev              # Inicia servidor em modo desenvolvimento com hot-reload
npm run type-check       # Verifica tipos TypeScript sem compilar
```

### Build

```bash
npm run build            # Build completo (limpa, compila TS, CSS e JS)
npm run build:clean      # Remove diretório dist
npm run build:ts         # Compila TypeScript
npm run build:css        # Compila e minifica CSS
npm run build:js         # Minifica JavaScript
npm run minify:css       # Minifica arquivos CSS
npm run minify:js        # Minifica arquivos JavaScript
```

### Produção

```bash
npm start                # Inicia servidor em produção
npm run start:prod       # Inicia servidor com NODE_ENV=production
```

### Banco de Dados

```bash
npm run migrate          # Executa migrations pendentes
npm run migrate:down     # Reverte última migration
npm run migrate:create   # Cria nova migration
```

### Qualidade de Código

```bash
npm run lint             # Verifica problemas de linting
npm run lint:fix         # Corrige problemas de linting automaticamente
npm run format           # Formata código com Prettier
npm run format:check     # Verifica formatação sem modificar
```

### Docker

```bash
npm run docker:build     # Constrói imagem Docker
npm run docker:run       # Executa container standalone
npm run docker:up        # Inicia serviços com Docker Compose
npm run docker:down      # Para serviços Docker Compose
npm run docker:logs      # Visualiza logs dos containers
npm run docker:restart   # Reinicia serviços
npm run docker:rebuild   # Reconstrói e reinicia serviços
```

## 📁 Estrutura de Pastas

```
kard/
├── public/                      # Arquivos públicos (frontend)
│   ├── css/                    # Estilos CSS
│   ├── js/                     # Scripts JavaScript
│   │   ├── main.js            # Script principal
│   │   ├── auth.js            # Autenticação
│   │   ├── theme.js           # Gerenciamento de temas
│   │   ├── keyboard.js        # Atalhos de teclado
│   │   ├── drag-drop.js       # Drag and drop
│   │   ├── notifications.js   # Notificações
│   │   ├── dashboard.js       # Dashboard
│   │   └── perfil.js          # Perfil do usuário
│   ├── icons/                  # Ícones PWA
│   ├── screenshots/            # Screenshots do app
│   ├── index.html             # Página principal
│   ├── login.html             # Página de login
│   ├── registro.html          # Página de registro
│   ├── dashboard.html         # Dashboard
│   ├── perfil.html            # Perfil do usuário
│   ├── manifest.json          # Manifest PWA
│   └── sw.js                  # Service Worker
├── src/                        # Código fonte (backend)
│   ├── controllers/           # Controladores
│   │   ├── atividades.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── comentarios.controller.ts
│   │   └── perfil.controller.ts
│   ├── services/              # Serviços de negócio
│   │   ├── atividades.service.ts
│   │   ├── auth.service.ts
│   │   ├── comentarios.service.ts
│   │   ├── token.service.ts
│   │   ├── token-blacklist.service.ts
│   │   └── upload.service.ts
│   ├── routes/                # Rotas da API
│   │   ├── atividades.routes.ts
│   │   ├── auth.routes.ts
│   │   └── comentarios.routes.ts
│   ├── middlewares/           # Middlewares
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── errorHandler.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── versionHeader.ts
│   ├── validators/            # Validadores
│   │   ├── atividades.validator.ts
│   │   ├── auth.validator.ts
│   │   └── perfil.validator.ts
│   ├── migrations/            # Migrations do banco
│   ├── utils/                 # Utilitários
│   │   ├── logger.ts
│   │   ├── exporter.ts
│   │   └── queryBuilder.ts
│   ├── cache/                 # Sistema de cache
│   │   └── cache.service.ts
│   ├── docs/                  # Documentação
│   │   └── swagger.ts
│   ├── config/                # Configurações
│   │   └── env.ts
│   ├── constants/             # Constantes
│   │   └── errors.ts
│   ├── dtos/                  # DTOs
│   │   └── perfil.dto.ts
│   ├── database.ts            # Configuração do banco
│   └── server.ts              # Entrada do servidor
├── scripts/                    # Scripts auxiliares
│   ├── minify-css.js
│   └── minify-js.js
├── logs/                       # Arquivos de log
├── uploads/                    # Arquivos enviados
├── dist/                       # Build de produção
├── .env                        # Variáveis de ambiente
├── .env.example               # Exemplo de variáveis
├── .eslintrc.json             # Configuração ESLint
├── .prettierrc                # Configuração Prettier
├── tsconfig.json              # Configuração TypeScript
├── tailwind.config.js         # Configuração Tailwind
├── docker-compose.yml         # Docker Compose
├── Dockerfile                 # Dockerfile
├── package.json               # Dependências e scripts
└── README.md                  # Este arquivo
```

## 🔌 API Endpoints

### Autenticação

```
POST   /api/v1/auth/registro          # Criar nova conta
POST   /api/v1/auth/login             # Login
POST   /api/v1/auth/refresh           # Renovar token
POST   /api/v1/auth/logout            # Logout
GET    /api/v1/auth/me                # Obter dados do usuário
PUT    /api/v1/auth/profile           # Atualizar perfil
DELETE /api/v1/auth/delete-account    # Excluir conta
```

### Atividades

```
GET    /api/v1/atividades             # Listar atividades
POST   /api/v1/atividades             # Criar atividade
GET    /api/v1/atividades/:id         # Obter atividade
PUT    /api/v1/atividades/:id         # Atualizar atividade
DELETE /api/v1/atividades/:id         # Excluir atividade
PATCH  /api/v1/atividades/:id/toggle  # Toggle status
PATCH  /api/v1/atividades/:id/priority # Alterar prioridade
POST   /api/v1/atividades/export      # Exportar atividades
POST   /api/v1/atividades/import      # Importar atividades
POST   /api/v1/atividades/:id/reorder # Reordenar atividades
```

### Comentários

```
GET    /api/v1/comentarios/atividade/:atividadeId  # Listar comentários
POST   /api/v1/comentarios                         # Criar comentário
PUT    /api/v1/comentarios/:id                     # Atualizar comentário
DELETE /api/v1/comentarios/:id                     # Excluir comentário
GET    /api/v1/comentarios/:id/count               # Contar comentários
```

### Health Check

```
GET    /health                        # Status do servidor
```

## 🔐 Segurança

- **JWT** para autenticação stateless
- **Bcrypt** para hash de senhas (10 rounds)
- **Rate Limiting** para proteção contra força bruta
- **CORS** configurado adequadamente
- **Helmet** para headers de segurança
- **Validação** de entrada em todas as rotas
- **Token Blacklist** para logout seguro
- **HTTPS** recomendado em produção
- **Variáveis de ambiente** para dados sensíveis
- **Proteção contra SQL Injection** com queries parametrizadas
- **Sanitização de inputs** do usuário

## ⚡ Performance

- **Cache em memória** para consultas frequentes (TTL: 1 minuto)
- **Índices otimizados** no PostgreSQL
- **Compressão** de assets (CSS, JS)
- **Lazy loading** de imagens
- **Code splitting** no frontend
- **Service Worker** para cache offline
- **Connection pooling** no PostgreSQL
- **Graceful shutdown** para não perder dados
- **Minificação** de arquivos CSS e JavaScript
- **Paginação** e carregamento incremental

## ♿ Acessibilidade

- **ARIA labels** em todos os elementos interativos
- **Navegação por teclado** completa
- **Atalhos de teclado** para ações principais
- **Modo alto contraste** disponível
- **Tamanhos de fonte** ajustáveis
- **Focus visible** em todos os elementos
- **Screen reader** friendly
- **Conformidade WCAG 2.1 AA**
- **Mensagens de erro** claras e descritivas
- **Touch targets** com tamanho mínimo de 44x44px

## 🌐 Internacionalização

O projeto está preparado para suportar múltiplos idiomas. Atualmente disponível em:
- 🇧🇷 Português (pt-BR)

Adicione novos idiomas facilmente através dos arquivos de tradução.

## 📱 Progressive Web App (PWA)

O Kard é um PWA completo com:
- ✅ Instalável em dispositivos móveis e desktop
- ✅ Funciona offline
- ✅ Sincronização em background
- ✅ Notificações de prazos próximos
- ✅ Ícones e splash screens
- ✅ Manifest completo
- ✅ Service Worker otimizado

## 🧪 Testes

```bash
npm run test              # Executa testes
npm run test:watch        # Testes em modo watch
npm run test:coverage     # Cobertura de testes
```

## 📝 Documentação da API

A documentação completa da API está disponível via Swagger:

```
http://localhost:3000/api-docs
```

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Guias de Contribuição

- Siga os padrões de código (ESLint + Prettier)
- Escreva mensagens de commit claras e descritivas
- Adicione testes para novas funcionalidades
- Atualize a documentação quando necessário
- Mantenha o código simples e legível

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo LICENSE para mais detalhes.

## 👥 Autores

- **Desenvolvedor Principal** - [Seu Nome]

## 🙏 Agradecimentos

- Comunidade Node.js
- Comunidade TypeScript
- Todos os contribuidores do projeto

## 📞 Suporte

Para suporte, abra uma issue no GitHub.

## 🗺️ Roadmap

- [ ] Aplicativo mobile nativo (React Native)
- [ ] Sincronização em tempo real (WebSockets)
- [ ] Integração com Google Calendar
- [ ] Integração com Trello/Notion
- [ ] Suporte a equipes/workspaces
- [ ] Relatórios avançados
- [ ] Machine Learning para sugestões inteligentes
- [ ] API GraphQL
- [ ] Testes automatizados completos
- [ ] CI/CD pipeline
- [ ] Suporte a subtarefas
- [ ] Tags personalizadas
- [ ] Compartilhamento de atividades

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!

Feito com ❤️ e ☕