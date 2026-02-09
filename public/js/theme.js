const themeToggleBtn = document.getElementById('theme-toggle');
const html = document.documentElement;

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
    themeToggleBtn.innerHTML = isDark ? '☀️' : '🌙';
}