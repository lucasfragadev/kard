/** @type {import('tailwindcss').Config} */
module.exports = {
  // Configuração de purge/content para remover CSS não utilizado
  content: [
    "./public/**/*.{html,js}",
    "./public/js/**/*.js",
    "./src/**/*.{ts,tsx}",
    "./index.html"
  ],
  
  // Modo escuro baseado em classe
  darkMode: 'class',
  
  theme: {
    extend: {
      // Cores customizadas do tema Kard
      colors: {
        // Cores primárias
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', // Cor principal (indigo-600)
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Cores de fundo escuro
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b', // bg-secondary dark
          900: '#0f172a', // bg-primary dark
          950: '#020617',
        },
        // Cores de sucesso
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Cores de erro
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Cores de aviso
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      
      // Espaçamentos customizados
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      
      // Fontes customizadas
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
      
      // Sombras customizadas
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 25px rgba(0, 0, 0, 0.12)',
        'strong': '0 10px 40px rgba(0, 0, 0, 0.15)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      
      // Border radius customizados
      borderRadius: {
        '4xl': '2rem',
      },
      
      // Animações customizadas
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-out': 'slideOut 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // Transições customizadas
      transitionDuration: {
        '2000': '2000ms',
      },
    },
  },
  
  // Plugins úteis para melhorar UX/UI
  plugins: [
    // Plugin para forms - melhora estilização de inputs, selects, etc
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    
    // Plugin para typography - melhora estilização de textos
    require('@tailwindcss/typography'),
    
    // Plugin para aspect-ratio
    require('@tailwindcss/aspect-ratio'),
    
    // Plugin para line-clamp (truncar textos)
    require('@tailwindcss/line-clamp'),
    
    // Plugin customizado para utilitários adicionais
    function({ addUtilities, addComponents, theme }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scrollbar-default': {
          '-ms-overflow-style': 'auto',
          'scrollbar-width': 'auto',
          '&::-webkit-scrollbar': {
            display: 'block'
          }
        },
        '.touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
        },
      }
      
      addUtilities(newUtilities, ['responsive', 'hover'])
    },
  ],
  
  // Otimizações para produção
  safelist: [
    // Classes dinâmicas que não devem ser removidas
    'bg-red-600',
    'bg-yellow-600',
    'bg-green-600',
    'bg-blue-600',
    'text-red-600',
    'text-yellow-600',
    'text-green-600',
    'text-blue-600',
    'border-red-600',
    'border-yellow-600',
    'border-green-600',
    'border-blue-600',
    // Classes de animação
    'animate-fade-in',
    'animate-fade-out',
    'animate-slide-in',
    'animate-slide-out',
    'animate-scale-in',
  ],
  
  // Futuro: Configuração adicional
  future: {
    hoverOnlyWhenSupported: true,
  },
  
  // Otimizações experimentais
  experimental: {
    optimizeUniversalDefaults: true,
  },
}