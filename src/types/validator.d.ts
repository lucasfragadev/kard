declare module 'validator' {
  export function isEmail(str: string): boolean;
  export function isURL(str: string, options?: any): boolean;
  export function isNumeric(str: string): boolean;
  export function isAlphanumeric(str: string, locale?: string): boolean;
  export function isLength(str: string, options: { min?: number; max?: number }): boolean;
  export function trim(str: string): string;
  export function escape(str: string): string;
  export function unescape(str: string): string;
  export function normalizeEmail(email: string, options?: any): string | false;
  export default {
    isEmail,
    isURL,
    isNumeric,
    isAlphanumeric,
    isLength,
    trim,
    escape,
    unescape,
    normalizeEmail,
  };
}