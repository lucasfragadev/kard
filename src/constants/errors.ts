/**
 * Mensagens de erro centralizadas
 * Facilita internacionalização e manutenção
 */

export const PROFILE_ERRORS = {
  NO_FIELDS_TO_UPDATE: 'Nenhum campo para atualizar foi fornecido',
  INVALID_NAME: 'Nome inválido',
  NAME_TOO_SHORT: 'Nome deve ter pelo menos 3 caracteres',
  NAME_TOO_LONG: 'Nome deve ter no máximo 255 caracteres',
  INVALID_PHOTO_URL: 'URL da foto inválida',
  PHOTO_URL_PROTOCOL_REQUIRED: 'URL da foto deve conter protocolo (http:// ou https://)',
  PHOTO_URL_TOO_LONG: 'URL da foto muito longa (máximo 2048 caracteres)',
  INVALID_IMAGE_EXTENSION: 'URL da foto deve apontar para uma imagem válida (.jpg, .jpeg, .png, .gif, .webp, .svg)',
  INVALID_BIO: 'Bio inválida',
  BIO_TOO_LONG: 'Bio deve ter no máximo 500 caracteres',
  INVALID_PREFERENCES: 'Preferências devem ser um objeto válido',
  INVALID_PREFERENCES_STRUCTURE: 'Estrutura de preferências inválida. Verifique os campos: theme (light|dark|auto|high-contrast), notifications (email, push, deadline), language',
  USER_NOT_FOUND: 'Usuário não encontrado',
  PROFILE_UPDATE_SUCCESS: 'Perfil atualizado com sucesso',
  CORRUPTED_PREFERENCES_DATA: 'Dados de preferências corrompidos no banco de dados',
};

export const AUTH_ERRORS = {
  INVALID_TOKEN: 'Token inválido',
  TOKEN_EXPIRED: 'Token expirado',
  UNAUTHORIZED: 'Não autorizado',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  EMAIL_IN_USE: 'Este email já está em uso',
  USER_NOT_FOUND: 'Usuário não encontrado',
};

export const GENERIC_ERRORS = {
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor',
  DATABASE_ERROR: 'Erro ao acessar banco de dados',
  VALIDATION_ERROR: 'Erro de validação',
};