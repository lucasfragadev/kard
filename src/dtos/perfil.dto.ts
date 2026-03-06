/**
 * DTOs para o módulo de perfil
 * Define interfaces para tipagem forte de entrada e saída de dados
 */

export interface UpdateProfileDto {
  nome?: string;
  foto?: string | null;
  bio?: string | null;
  preferencias?: {
    theme?: 'light' | 'dark' | 'auto' | 'high-contrast';
    notifications?: {
      email?: boolean;
      push?: boolean;
      deadline?: boolean;
    };
    language?: string;
  };
}

export interface UserProfileDto {
  id: number;
  nome: string;
  email: string;
  foto: string | null;
  bio: string | null;
  preferencias: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ProfilePreferences {
  theme?: 'light' | 'dark' | 'auto' | 'high-contrast';
  notifications?: {
    email?: boolean;
    push?: boolean;
    deadline?: boolean;
  };
  language?: string;
}