const themeToggleBtn = document.getElementById('theme-toggle');
const html = document.documentElement;

// SVGs da Lucide
const iconSun = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const iconMoon = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

// 1. Ao carregar: Verifica se tem tema salvo ou preferência do sistema
const savedTheme = localStorage.getItem('kard_theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
    html.classList.add('dark');
} else {
    html.classList.remove('dark');
}

updateIcon();

// 2. Ao clicar no botão
themeToggleBtn?.addEventListener('click', () => {
    html.classList.toggle('dark');
    
    if (html.classList.contains('dark')) {
        localStorage.setItem('kard_theme', 'dark');
    } else {
        localStorage.setItem('kard_theme', 'light');
    }
    updateIcon();
});

function updateIcon() {
    if (!themeToggleBtn) return;
    const isDark = html.classList.contains('dark');
    // Injeta o SVG ao invés do emoji
    themeToggleBtn.innerHTML = isDark ? iconSun : iconMoon;
}