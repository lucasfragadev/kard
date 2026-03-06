/**
 * Gerenciador de Temas do Kard
 * Suporta: light, dark, auto, high-contrast
 */

// Constantes
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
  HIGH_CONTRAST: 'high-contrast'
};

const THEME_ICONS = {
  [THEMES.LIGHT]: '☀️',
  [THEMES.DARK]: '🌙',
  [THEMES.AUTO]: '🔄',
  [THEMES.HIGH_CONTRAST]: '◐'
};

const STORAGE_KEY = 'kard_theme';

// Elementos DOM
const themeToggleBtn = document.getElementById('theme-toggle');
const html = document.documentElement;

// Media queries
const systemDarkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

/**
 * Classe para gerenciar temas
 */
class ThemeManager {
  constructor() {
    this.currentTheme = this.getSavedTheme();
    this.init();
  }

  /**
   * Inicializa o gerenciador de temas
   */
  init() {
    // Aplicar tema inicial
    this.applyTheme(this.currentTheme);

    // Event listeners
    this.setupEventListeners();

    // Atualizar ícone
    this.updateIcon();

    console.log('🎨 Gerenciador de temas inicializado:', this.currentTheme);
  }

  /**
   * Obtém o tema salvo no localStorage
   */
  getSavedTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    // Validar tema salvo
    if (saved && Object.values(THEMES).includes(saved)) {
      return saved;
    }

    // Se não houver tema salvo, usar auto
    return THEMES.AUTO;
  }

  /**
   * Salva o tema no localStorage
   */
  saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    this.currentTheme = theme;
  }

  /**
   * Aplica o tema no documento
   */
  applyTheme(theme) {
    // Remover todas as classes de tema
    html.classList.remove('dark', 'high-contrast');

    switch (theme) {
      case THEMES.LIGHT:
        // Modo claro padrão, sem classes adicionais
        break;

      case THEMES.DARK:
        html.classList.add('dark');
        break;

      case THEMES.HIGH_CONTRAST:
        html.classList.add('high-contrast');
        // Verificar se deve usar tema escuro junto com alto contraste
        if (systemDarkModeQuery.matches) {
          html.classList.add('dark');
        }
        break;

      case THEMES.AUTO:
        // Aplicar baseado na preferência do sistema
        if (highContrastQuery.matches) {
          html.classList.add('high-contrast');
        }
        if (systemDarkModeQuery.matches) {
          html.classList.add('dark');
        }
        break;

      default:
        console.warn('Tema desconhecido:', theme);
    }

    // Atualizar atributo data-theme para CSS
    html.setAttribute('data-theme', theme);
  }

  /**
   * Alterna para o próximo tema na sequência
   */
  cycleTheme() {
    const themes = Object.values(THEMES);
    const currentIndex = themes.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];

    this.setTheme(nextTheme);
  }

  /**
   * Define um tema específico
   */
  setTheme(theme) {
    if (!Object.values(THEMES).includes(theme)) {
      console.error('Tema inválido:', theme);
      return;
    }

    this.saveTheme(theme);
    this.applyTheme(theme);
    this.updateIcon();

    // Disparar evento customizado
    this.dispatchThemeChangeEvent(theme);
  }

  /**
   * Atualiza o ícone do botão de tema
   */
  updateIcon() {
    if (!themeToggleBtn) return;

    const icon = THEME_ICONS[this.currentTheme] || '🎨';
    const themeName = this.getThemeName(this.currentTheme);

    themeToggleBtn.innerHTML = icon;
    themeToggleBtn.setAttribute('aria-label', `Tema atual: ${themeName}. Clique para alternar.`);
    themeToggleBtn.setAttribute('title', `Tema: ${themeName}`);
  }

  /**
   * Retorna o nome amigável do tema
   */
  getThemeName(theme) {
    const names = {
      [THEMES.LIGHT]: 'Claro',
      [THEMES.DARK]: 'Escuro',
      [THEMES.AUTO]: 'Automático',
      [THEMES.HIGH_CONTRAST]: 'Alto Contraste'
    };
    return names[theme] || theme;
  }

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Click no botão de tema
    themeToggleBtn?.addEventListener('click', () => {
      this.cycleTheme();
    });

    // Monitorar mudanças na preferência do sistema (apenas em modo auto)
    systemDarkModeQuery.addEventListener('change', (e) => {
      if (this.currentTheme === THEMES.AUTO) {
        this.applyTheme(THEMES.AUTO);
        console.log('🔄 Preferência do sistema alterada:', e.matches ? 'dark' : 'light');
      }
    });

    // Monitorar mudanças na preferência de contraste (apenas em modo auto)
    highContrastQuery.addEventListener('change', (e) => {
      if (this.currentTheme === THEMES.AUTO) {
        this.applyTheme(THEMES.AUTO);
        console.log('🔄 Preferência de contraste alterada:', e.matches ? 'high' : 'normal');
      }
    });

    // Atalho de teclado: Ctrl+Shift+T para alternar tema
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.cycleTheme();
      }
    });
  }

  /**
   * Dispara evento customizado quando o tema muda
   */
  dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent('themechange', {
      detail: {
        theme: theme,
        isDark: html.classList.contains('dark'),
        isHighContrast: html.classList.contains('high-contrast')
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Retorna informações sobre o tema atual
   */
  getThemeInfo() {
    return {
      current: this.currentTheme,
      applied: {
        isDark: html.classList.contains('dark'),
        isHighContrast: html.classList.contains('high-contrast')
      },
      system: {
        prefersDark: systemDarkModeQuery.matches,
        prefersHighContrast: highContrastQuery.matches
      }
    };
  }
}

// Inicializar gerenciador de temas
const themeManager = new ThemeManager();

// Expor API global (para uso em outros scripts)
window.KardTheme = {
  setTheme: (theme) => themeManager.setTheme(theme),
  getTheme: () => themeManager.currentTheme,
  cycleTheme: () => themeManager.cycleTheme(),
  getInfo: () => themeManager.getThemeInfo(),
  THEMES: THEMES
};

// Event listener para mostrar informações do tema (debug)
document.addEventListener('themechange', (e) => {
  console.log('🎨 Tema alterado:', e.detail);
});