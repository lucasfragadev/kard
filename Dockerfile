# ========================================
# Stage 1: Builder - Compilação do TypeScript
# ========================================
FROM node:20-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema necessárias para compilação
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY src ./src
COPY public ./public

# Compilar TypeScript e minificar assets
RUN npm run build

# Remover devDependencies
RUN npm prune --production

# ========================================
# Stage 2: Runner - Imagem de produção
# ========================================
FROM node:20-alpine

# Metadados da imagem
LABEL maintainer="Kard Team"
LABEL description="Kard - Sistema de Gerenciamento de Atividades"
LABEL version="1.0.0"

# Instalar apenas dependências de runtime necessárias
RUN apk add --no-cache \
    tini \
    curl

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar dependências do stage builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copiar código compilado
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copiar arquivos públicos
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Copiar migrations
COPY --chown=nodejs:nodejs src/migrations ./src/migrations

# Criar diretórios necessários
RUN mkdir -p /app/uploads /app/logs /app/backups && \
    chown -R nodejs:nodejs /app/uploads /app/logs /app/backups

# Mudar para usuário não-root
USER nodejs

# Expor porta da aplicação
EXPOSE 3000

# Configurar variáveis de ambiente padrão
ENV NODE_ENV=production \
    PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Usar tini para gerenciar processos corretamente
ENTRYPOINT ["/sbin/tini", "--"]

# Comando para iniciar a aplicação
CMD ["node", "dist/server.js"]