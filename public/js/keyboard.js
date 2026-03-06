// ==========================================
// KARD - Gerenciador de Atalhos de Teclado
// ==========================================

/**
 * Mapa de atalhos disponíveis
 */
const shortcuts = {
    'ctrl+n': { action: 'newTask', description: 'Nova Tarefa' },
    'ctrl+s': { action: 'saveEdit', description: 'Salvar Edição' },
    'escape': { action: 'cancelEdit', description: 'Cancelar' },
    'enter': { action: 'confirmAction', description: 'Confirmar' },
    'ctrl+k': { action: 'focusSearch', description: 'Buscar' },
    'ctrl+/': { action: 'showShortcuts', description: 'Ver Atalhos' }
};

/**
 * Estado atual do gerenciador
 */
let isEditing = false;
let focusedElement = null;

/**
 * Inicializar o gerenciador de atalhos
 */
function initKeyboardShortcuts() {
    // Event listener principal
    document.addEventListener('keydown', handleKeyPress);
    
    // Adicionar indicadores visuais
    addKeyboardHints();
    
    // Observar mudanças de estado
    observeEditState();
    
    console.log('⌨️ Atalhos de teclado inicializados');
}

/**
 * Gerenciar pressionar de teclas
 */
function handleKeyPress(e) {
    const key = getKeyCombo(e);
    
    // Ignorar se estiver em input/textarea (exceto Escape e Enter em alguns casos)
    const isInputActive = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
    
    // Ctrl+N - Nova Tarefa
    if (key === 'ctrl+n') {
        e.preventDefault();
        if (!isEditing) {
            openNewTaskForm();
        }
        return;
    }
    
    // Ctrl+S - Salvar Edição
    if (key === 'ctrl+s') {
        e.preventDefault();
        if (isEditing) {
            saveCurrentEdit();
        }
        return;
    }
    
    // Escape - Cancelar
    if (key === 'escape') {
        e.preventDefault();
        cancelCurrentAction();
        return;
    }
    
    // Enter - Confirmar (em modais e formulários específicos)
    if (key === 'enter' && isInputActive) {
        const form = e.target.closest('form');
        if (form && (form.id === 'task-form' || form.id === 'edit-form')) {
            e.preventDefault();
            confirmFormAction(form);
        }
        return;
    }
    
    // Ctrl+K - Focar busca
    if (key === 'ctrl+k') {
        e.preventDefault();
        focusSearchInput();
        return;
    }
    
    // Ctrl+/ - Mostrar atalhos
    if (key === 'ctrl+/') {
        e.preventDefault();
        toggleShortcutsPanel();
        return;
    }
}

/**
 * Obter combinação de teclas pressionadas
 */
function getKeyCombo(e) {
    const keys = [];
    
    if (e.ctrlKey || e.metaKey) keys.push('ctrl');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    
    const key = e.key.toLowerCase();
    
    // Normalizar nomes de teclas especiais
    const specialKeys = {
        'escape': 'escape',
        'enter': 'enter',
        '/': '/'
    };
    
    keys.push(specialKeys[key] || key);
    
    return keys.join('+');
}

/**
 * Abrir formulário de nova tarefa
 */
function openNewTaskForm() {
    const addBtn = document.getElementById('add-btn');
    if (addBtn) {
        addBtn.click();
        
        // Focar no primeiro campo após um pequeno delay
        setTimeout(() => {
            const dateInput = document.getElementById('task-date');
            if (dateInput) dateInput.focus();
        }, 100);
        
        showToast('Nova tarefa - Preencha os campos', 'info');
    }
}

/**
 * Salvar edição atual
 */
function saveCurrentEdit() {
    const saveBtn = document.getElementById('save-btn');
    const submitBtn = document.querySelector('#task-form button[type="submit"]');
    
    if (saveBtn && !saveBtn.disabled) {
        saveBtn.click();
        showToast('Salvando alterações...', 'success');
    } else if (submitBtn) {
        submitBtn.click();
        showToast('Criando tarefa...', 'success');
    }
}

/**
 * Cancelar ação atual
 */
function cancelCurrentAction() {
    // Fechar modais
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        if (!modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
        }
    });
    
    // Cancelar edição
    const cancelBtn = document.getElementById('btn-cancel');
    if (cancelBtn && !cancelBtn.classList.contains('hidden')) {
        cancelBtn.click();
    }
    
    // Remover foco de inputs
    if (document.activeElement && document.activeElement.tagName !== 'BODY') {
        document.activeElement.blur();
    }
    
    showToast('Ação cancelada', 'warning');
}

/**
 * Confirmar ação de formulário
 */
function confirmFormAction(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
    }
}

/**
 * Focar no campo de busca
 */
function focusSearchInput() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
        showToast('Buscar tarefas', 'info');
    }
}

/**
 * Mostrar/ocultar painel de atalhos
 */
function toggleShortcutsPanel() {
    let panel = document.getElementById('shortcuts-panel');
    
    if (!panel) {
        panel = createShortcutsPanel();
        document.body.appendChild(panel);
    }
    
    panel.classList.toggle('hidden');
}

/**
 * Criar painel de atalhos
 */
function createShortcutsPanel() {
    const panel = document.createElement('div');
    panel.id = 'shortcuts-panel';
    panel.className = 'hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center';
    panel.onclick = (e) => {
        if (e.target === panel) panel.classList.add('hidden');
    };
    
    const content = document.createElement('div');
    content.className = 'bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto';
    
    content.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-800 dark:text-white">⌨️ Atalhos de Teclado</h3>
            <button onclick="document.getElementById('shortcuts-panel').classList.add('hidden')" 
                    class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                ✕
            </button>
        </div>
        <div class="space-y-3">
            ${Object.entries(shortcuts).map(([key, data]) => `
                <div class="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                    <span class="text-sm text-slate-600 dark:text-slate-400">${data.description}</span>
                    <kbd class="px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
                        ${formatKeyCombo(key)}
                    </kbd>
                </div>
            `).join('')}
        </div>
    `;
    
    panel.appendChild(content);
    return panel;
}

/**
 * Formatar combinação de teclas para exibição
 */
function formatKeyCombo(combo) {
    return combo
        .split('+')
        .map(key => {
            const labels = {
                'ctrl': 'Ctrl',
                'shift': 'Shift',
                'alt': 'Alt',
                'enter': 'Enter',
                'escape': 'Esc',
                '/': '/'
            };
            return labels[key] || key.toUpperCase();
        })
        .join(' + ');
}

/**
 * Adicionar indicadores visuais de atalhos
 */
function addKeyboardHints() {
    // Adicionar tooltip ao botão de nova tarefa
    const addBtn = document.getElementById('add-btn');
    if (addBtn) {
        addBtn.title = 'Nova Tarefa (Ctrl+N)';
        addBtn.setAttribute('data-shortcut', 'Ctrl+N');
    }
    
    // Adicionar tooltip ao botão de salvar
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.title = 'Salvar (Ctrl+S)';
        saveBtn.setAttribute('data-shortcut', 'Ctrl+S');
    }
    
    // Adicionar tooltip ao botão de cancelar
    const cancelBtn = document.getElementById('btn-cancel');
    if (cancelBtn) {
        cancelBtn.title = 'Cancelar (Esc)';
        cancelBtn.setAttribute('data-shortcut', 'Esc');
    }
    
    // Adicionar indicador no rodapé
    addFooterHint();
}

/**
 * Adicionar indicador de atalhos no rodapé
 */
function addFooterHint() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    const hint = document.createElement('div');
    hint.className = 'text-center text-xs text-slate-400 dark:text-slate-600 mt-2';
    hint.innerHTML = `
        Pressione <kbd class="px-1 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">Ctrl+/</kbd> para ver todos os atalhos
    `;
    
    footer.appendChild(hint);
}

/**
 * Observar mudanças no estado de edição
 */
function observeEditState() {
    // Observar mudanças no formulário
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'task-form' || target.closest('#task-form')) {
                    isEditing = !target.classList.contains('hidden');
                }
            }
        });
    });
    
    const formContainer = document.getElementById('task-form');
    if (formContainer) {
        observer.observe(formContainer, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true
        });
    }
}

/**
 * Mostrar toast de notificação
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 text-white text-sm ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKeyboardShortcuts);
} else {
    initKeyboardShortcuts();
}