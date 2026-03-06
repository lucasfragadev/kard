import validator from 'validator';
import { z } from 'zod';
import { PROFILE_ERRORS } from '../constants/errors.js';
import { UpdateProfileDto, ValidationResult } from '../dtos/perfil.dto.js';

// Schema de validação para preferências usando Zod
const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto', 'high-contrast']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    deadline: z.boolean().optional(),
  }).optional(),
  language: z.string().max(5).optional(),
}).strict();

/**
 * Valida URL de foto removendo query parameters e fragments
 */
const validateFotoUrl = (foto: string | null): string | null => {
  if (foto === null) {
    return null;
  }

  if (typeof foto !== 'string') {
    return PROFILE_ERRORS.INVALID_PHOTO_URL;
  }

  if (!validator.isURL(foto, { require_protocol: true })) {
    return PROFILE_ERRORS.PHOTO_URL_PROTOCOL_REQUIRED;
  }

  if (foto.length > 2048) {
    return PROFILE_ERRORS.PHOTO_URL_TOO_LONG;
  }

  // Validar extensão da imagem removendo query params e fragments
  try {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const url = new URL(foto);
    const pathname = url.pathname.toLowerCase();
    
    // Remover query e fragment para validação segura
    const cleanPath = pathname.split('?')[0].split('#')[0];
    const hasImageExtension = imageExtensions.some(ext => cleanPath.endsWith(ext));
    
    if (!hasImageExtension) {
      return PROFILE_ERRORS.INVALID_IMAGE_EXTENSION;
    }
  } catch (error) {
    return PROFILE_ERRORS.INVALID_PHOTO_URL;
  }

  return null;
};

/**
 * Valida os dados de atualização de perfil
 */
export const validateUpdateProfile = (data: UpdateProfileDto): ValidationResult => {
  const errors: string[] = [];

  // Validar se há campos para atualizar
  if (!data.nome && !data.foto && !data.bio && data.preferencias === undefined) {
    return {
      valid: false,
      errors: [PROFILE_ERRORS.NO_FIELDS_TO_UPDATE]
    };
  }

  // Validar nome
  if (data.nome !== undefined) {
    if (typeof data.nome !== 'string' || data.nome.trim().length === 0) {
      errors.push(PROFILE_ERRORS.INVALID_NAME);
    } else if (data.nome.trim().length < 3) {
      errors.push(PROFILE_ERRORS.NAME_TOO_SHORT);
    } else if (data.nome.trim().length > 255) {
      errors.push(PROFILE_ERRORS.NAME_TOO_LONG);
    }
  }

  // Validar foto
  if (data.foto !== undefined) {
    const fotoError = validateFotoUrl(data.foto);
    if (fotoError) {
      errors.push(fotoError);
    }
  }

  // Validar bio
  if (data.bio !== undefined) {
    if (data.bio !== null && typeof data.bio !== 'string') {
      errors.push(PROFILE_ERRORS.INVALID_BIO);
    } else if (data.bio !== null && data.bio.trim().length > 500) {
      errors.push(PROFILE_ERRORS.BIO_TOO_LONG);
    }
  }

  // Validar preferencias
  if (data.preferencias !== undefined) {
    if (typeof data.preferencias !== 'object' || Array.isArray(data.preferencias)) {
      errors.push(PROFILE_ERRORS.INVALID_PREFERENCES);
    } else {
      const validation = PreferencesSchema.safeParse(data.preferencias);
      if (!validation.success) {
        errors.push(PROFILE_ERRORS.INVALID_PREFERENCES_STRUCTURE);
      }
    }
  }

  return errors.length > 0 
    ? { valid: false, errors } 
    : { valid: true };
};

/**
 * Valida apenas as preferências
 */
export const validatePreferences = (preferencias: any): boolean => {
  if (typeof preferencias !== 'object' || Array.isArray(preferencias)) {
    return false;
  }
  
  const validation = PreferencesSchema.safeParse(preferencias);
  return validation.success;
};