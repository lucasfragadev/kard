/**
 * KARD - Main Script V12 (Com Notificações)
 */

const token = localStorage.getItem('kard_token');
if (!token) window.location.href = '/login.html';

let tasksCache = [];
let currentFilters = JSON.parse(localStorage.getItem('kard_filters')) || { status: 'all', priority: 'all', category: 'all', sort: 'date' };
let searchTerm = '';
let currentPage = 0;
const PAGE_SIZE = 20;
let isLoading = false;
let hasMore = true;

// --- LOADING INDICATORS ---

function showLoading(target = 'task-list') {
    const element = document.getElementById(target);
    if (!element) return;
    
    const skeleton = `
        <div class="loading-skeleton animate-pulse space-y-3">
            ${Array(3).fill(0).map(() => `
                <div class="bg-slate-200 dark:bg-slate-700 p-5 rounded-lg">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                        <div class="flex-1 h-5 bg-slate-300 dark:bg-slate-600 rounded"></div>
                        <div class="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
                    </div>
                    <div class="space-y-2 pl-9">
                        <div class="h-3 bg-slate-300 dark:bg-slate-600 rounded w-full"></div>
                        <div class="h-3 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    if (currentPage === 0) {
        element.innerHTML = skeleton;
    } else {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-more';
        loadingDiv.innerHTML = skeleton;
        element.appendChild(loadingDiv);
    }
}

function hideLoading() {
    const loadingEl = document.getElementById('loading-more');
    if (loadingEl) loadingEl.remove();
}

// --- TOOLTIPS ---

function initializeTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const text = e.target.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip fixed bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50';
    tooltip.textContent = text;
    tooltip.id = 'active-tooltip';
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById('active-tooltip');
    if (tooltip) tooltip.remove();
}

// --- CONFIRM DIALOG ---

function showConfirmDialog(message, confirmText = 'Confirmar', cancelText = 'Cancelar') {
    return new Promise((resolve) => {
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in';
        dialog.innerHTML = `
            <div class="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-2xl animate-scale-in">
                <p class="text-slate-800 dark:text-slate-200 mb-6">${message}</p>
                <div class="flex gap-3 justify-end">
                    <button id="dialog-cancel" class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded font-medium">
                        ${cancelText}
                    </button>
                    <button id="dialog-confirm" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        document.getElementById('dialog-confirm').onclick = () => {
            dialog.remove();
            resolve(true);
        };
        
        document.getElementById('dialog-cancel').onclick = () => {
            dialog.remove();
            resolve(false);
        };
    });
}

// --- SEARCH WITH DEBOUNCE ---

let searchDebounceTimer;

function searchTasks(term) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        searchTerm = term.toLowerCase();
        currentPage = 0;
        hasMore = true;
        renderFilteredTasks();
    }, 300);
}

function highlightSearchTerm(text, term) {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-600">$1</mark>');
}

// --- FILTERS AND SORTING ---

function filterTasks(tasks) {
    let filtered = [...tasks];
    
    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(t => 
            (t.titulo && t.titulo.toLowerCase().includes(searchTerm)) ||
            (t.descricao && t.descricao.toLowerCase().includes(searchTerm)) ||
            (t.categoria && t.categoria.toLowerCase().includes(searchTerm))
        );
    }
    
    // Status filter
    if (currentFilters.status === 'completed') {
        filtered = filtered.filter(t => t.finalizada);
    } else if (currentFilters.status === 'pending') {
        filtered = filtered.filter(t => !t.finalizada);
    }
    
    // Priority filter
    if (currentFilters.priority === 'important') {
        filtered = filtered.filter(t => t.importante);
    }
    
    // Category filter
    if (currentFilters.category !== 'all') {
        filtered = filtered.filter(t => t.categoria === currentFilters.category);
    }
    
    return filtered;
}

function sortTasks(tasks) {
    const sorted = [...tasks];
    
    switch (currentFilters.sort) {
        case 'priority':
            return sorted.sort((a, b) => {
                if (a.importante && !b.importante) return -1;
                if (!a.importante && b.importante) return 1;
                return 0;
            });
        
        case 'title':
            return sorted.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || ''));
        
        case 'category':
            return sorted.sort((a, b) => (a.categoria || '').localeCompare(b.categoria || ''));
        
        case 'date':
        default:
            return sorted.sort((a, b) => {
                const dateA = a.data ? new Date(a.data.split('/').reverse().join('-')) : new Date(0);
                const dateB = b.data ? new Date(b.data.split('/').reverse().join('-')) : new Date(0);
                return dateB - dateA;
            });
    }
}

function updateFilters(filterType, value) {
    currentFilters[filterType] = value;
    localStorage.setItem('kard_filters', JSON.stringify(currentFilters));
    currentPage = 0;
    hasMore = true;
    renderFilteredTasks();
}

function renderFilteredTasks() {
    let filtered = filterTasks(tasksCache);
    filtered = sortTasks(filtered);
    renderTasks(filtered);
}

// --- PAGINATION & INFINITE SCROLL ---

function setupInfiniteScroll() {
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.className = 'h-10';
    document.getElementById('task-list').appendChild(sentinel);
    
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            loadMoreTasks();
        }
    }, { threshold: 0.1 });
    
    observer.observe(sentinel);
}

async function loadMoreTasks() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    currentPage++;
    showLoading();
    
    try {
        const res = await fetch(`/atividades?limit=${PAGE_SIZE}&offset=${currentPage * PAGE_SIZE}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) return logout();
        
        const newTasks = await res.json();
        
        if (newTasks.length < PAGE_SIZE) {
            hasMore = false;
        }
        
        tasksCache = [...tasksCache, ...newTasks];
        renderFilteredTasks();
    } catch (err) {
        console.error(err);
    } finally {
        isLoading = false;
        hideLoading();
    }
}

// --- DATE VALIDATION ---

function isDateOverdue(dateStr) {
    if (!dateStr) return false;
    const [d, m, y] = dateStr.split('/');
    const taskDate = new Date(`${y}-${m}-${d}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return taskDate < today;
}

function isDateSoon(dateStr) {
    if (!dateStr) return false;
    const [d, m, y] = dateStr.split('/');
    const taskDate = new Date(`${y}-${m}-${d}`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDays = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    return taskDate >= today && taskDate <= threeDays;
}

function validateDate(dateInput) {
    const selectedDate = new Date(dateInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        dateInput.setCustomValidity('Data não pode ser no passado');
        return false;
    } else {
        dateInput.setCustomValidity('');
        return true;
    }
}

// --- EXPORT DATA ---

function exportData(format) {
    const filtered = filterTasks(tasksCache);
    
    switch (format) {
        case 'json':
            exportJSON(filtered);
            break;
        case 'csv':
            exportCSV(filtered);
            break;
        case 'pdf':
            exportPDF(filtered);
            break;
    }
}

function exportJSON(tasks) {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    downloadFile(dataBlob, `kard-export-${Date.now()}.json`);
}

function exportCSV(tasks) {
    const headers = ['ID', 'Título', 'Categoria', 'Descrição', 'Data', 'Importante', 'Finalizada'];
    const rows = tasks.map(t => [
        t.id,
        t.titulo || '',
        t.categoria || '',
        (t.descricao || '').replace(/\n/g, ' '),
        t.data || '',
        t.importante ? 'Sim' : 'Não',
        t.finalizada ? 'Sim' : 'Não'
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(dataBlob, `kard-export-${Date.now()}.csv`);
}

function exportPDF(tasks) {
    // Simplified PDF export using HTML
    const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>KARD Export</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #4f46e5; }
                .task { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
                .task-title { font-weight: bold; font-size: 16px; }
                .task-meta { color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>KARD - Exportação de Tarefas</h1>
            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
            ${tasks.map(t => `
                <div class="task">
                    <div class="task-title">${t.titulo || 'Sem título'}</div>
                    <div class="task-meta">
                        Categoria: ${t.categoria || 'Geral'} | 
                        Data: ${t.data || 'N/A'} | 
                        ${t.importante ? '⭐ Importante' : ''} | 
                        ${t.finalizada ? '✅ Concluída' : '⭕ Pendente'}
                    </div>
                    <p>${t.descricao || ''}</p>
                </div>
            `).join('')}
        </body>
        </html>
    `;
    
    const dataBlob = new Blob([content], { type: 'text/html' });
    downloadFile(dataBlob, `kard-export-${Date.now()}.html`);
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- IMPORT DATA ---

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    input.onchange = handleImportFile;
    input.click();
}

async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            let tasks = [];
            
            if (file.name.endsWith('.json')) {
                tasks = JSON.parse(event.target.result);
            } else if (file.name.endsWith('.csv')) {
                tasks = parseCSV(event.target.result);
            }
            
            for (const task of tasks) {
                await fetch('/atividades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        titulo: task.titulo,
                        categoria: task.categoria,
                        descricao: task.descricao,
                        data: task.data,
                        importante: task.importante
                    })
                });
            }
            
            alert('Importação concluída com sucesso!');
            fetchTasks();
        } catch (err) {
            alert('Erro ao importar arquivo: ' + err.message);
        }
    };
    reader.readAsText(file);
}

function parseCSV(content) {
    const lines = content.split('\n').slice(1); // Skip header
    return lines.map(line => {
        const [id, titulo, categoria, descricao, data, importante, finalizada] = line.split(',').map(cell => cell.replace(/^"|"$/g, ''));
        return {
            titulo,
            categoria,
            descricao,
            data,
            importante: importante === 'Sim'
        };
    }).filter(t => t.titulo);
}

// --- LAZY LOAD ---

function setupLazyLoad() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                card.classList.add('loaded');
                observer.unobserve(card);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.task-card').forEach(card => {
        observer.observe(card);
    });
}

// --- ATTACHMENTS ---

let currentAttachments = [];

function handleAttachmentUpload(taskId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx,.txt';
    input.onchange = (e) => uploadAttachments(taskId, e.target.files);
    input.click();
}

async function uploadAttachments(taskId, files) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    for (const file of files) {
        if (file.size > maxSize) {
            alert(`Arquivo ${file.name} é muito grande. Máximo: 5MB`);
            continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId);
        
        try {
            await fetch('/api/attachments', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
        } catch (err) {
            console.error('Erro ao fazer upload:', err);
        }
    }
    
    alert('Arquivos enviados com sucesso!');
}

// --- COMMENTS ---

async function addComment(taskId, commentText) {
    if (!commentText.trim()) return;
    
    try {
        await fetch(`/api/atividades/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ text: commentText })
        });
        
        fetchComments(taskId);
    } catch (err) {
        console.error(err);
    }
}

async function fetchComments(taskId) {
    try {
        const res = await fetch(`/api/atividades/${taskId}/comments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const comments = await res.json();
        renderComments(taskId, comments);
    } catch (err) {
        console.error(err);
    }
}

function renderComments(taskId, comments) {
    const container = document.getElementById(`comments-${taskId}`);
    if (!container) return;
    
    container.innerHTML = comments.map(c => `
        <div class="comment border-l-2 border-indigo-500 pl-3 py-2 mb-2">
            <div class="text-xs text-slate-500 mb-1">${new Date(c.created_at).toLocaleString('pt-BR')}</div>
            <div class="text-sm text-slate-700 dark:text-slate-300">${c.text}</div>
            <button onclick="deleteComment(${taskId}, ${c.id})" class="text-xs text-red-500 hover:text-red-700 mt-1">Remover</button>
        </div>
    `).join('');
}

async function deleteComment(taskId, commentId) {
    const confirmed = await showConfirmDialog('Deseja remover este comentário?', 'Remover');
    if (!confirmed) return;
    
    try {
        await fetch(`/api/atividades/${taskId}/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        fetchComments(taskId);
    } catch (err) {
        console.error(err);
    }
}

// --- CATEGORIES ---

function getUniqueCategories() {
    const categories = tasksCache.map(t => t.categoria).filter(Boolean);
    return ['Todas', ...new Set(categories)];
}

function renderCategoryFilter() {
    const categories = getUniqueCategories();
    const select = document.getElementById('category-filter');
    if (!select) return;
    
    select.innerHTML = categories.map(cat => 
        `<option value="${cat === 'Todas' ? 'all' : cat}">${cat}</option>`
    ).join('');
}

// --- NOTIFICATIONS ---

function initializeNotifications() {
    if (!window.notificationManager) {
        console.warn('Notification Manager não encontrado');
        return;
    }

    const notifBtn = document.getElementById('btn-enable-notifications');
    if (notifBtn) {
        notifBtn.addEventListener('click', async () => {
            const granted = await window.notificationManager.requestPermission();
            if (granted) {
                notifBtn.classList.add('hidden');
                startNotificationService();
            }
        });
    }

    if (window.notificationManager.permission === 'granted') {
        if (notifBtn) notifBtn.classList.add('hidden');
        startNotificationService();
    }
}

function startNotificationService() {
    if (!window.notificationManager) return;
    
    window.notificationManager.startPeriodicCheck(() => tasksCache);
    console.log('🔔 Serviço de notificações iniciado');
}

// --- API ---

async function fetchTasks() {
    showLoading();
    try {
        const res = await fetch('/atividades', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) return logout();
        
        let data = await res.json();

        tasksCache = data;
        currentPage = 0;
        hasMore = data.length >= PAGE_SIZE;
        
        renderFilteredTasks();
        renderCategoryFilter();
        initializeTooltips();
        
        if (window.notificationManager && window.notificationManager.permission === 'granted') {
            window.notificationManager.checkTasksAndNotify(tasksCache);
        }
    } catch (err) { 
        console.error(err); 
    } finally {
        hideLoading();
    }
}

// --- RENDERIZAÇÃO INTELIGENTE ---

function renderTasks(tasks) {
    const list = document.getElementById('task-list');
    
    const activeTasks = tasks.filter(t => !t.finalizada);
    const completedTasks = tasks.filter(t => t.finalizada);

    let htmlContent = '';

    if (activeTasks.length > 0) {
        htmlContent += activeTasks.map(t => createTaskCard(t)).join('');
    } else if (completedTasks.length === 0) {
        htmlContent = `<div class="text-center py-10 text-slate-500 dark:text-slate-500">Nenhuma tarefa encontrada.</div>`;
    } else {
        htmlContent = `<div class="text-center py-6 text-slate-400 dark:text-slate-600 text-sm">Tudo feito por aqui! 🎉</div>`;
    }

    if (completedTasks.length > 0) {
        htmlContent += `
            <div class="mt-10 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2 flex justify-between items-end animate-fade-in">
                <h3 class="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest">
                    Tarefas Concluídas (${completedTasks.length})
                </h3>
            </div>
            <div class="opacity-75 hover:opacity-100 transition-opacity duration-300">
                ${completedTasks.map(t => createTaskCard(t)).join('')}
            </div>
        `;
    }

    list.innerHTML = htmlContent;
    initializeTooltips();
    setupLazyLoad();
    
    // Inicializa drag and drop após renderizar
    if (window.dragDropManager) {
        window.dragDropManager.enableAllCards();
    }
}

// Função auxiliar para gerar o HTML do card
function createTaskCard(t) {
    const isOverdue = !t.finalizada && isDateOverdue(t.data);
    const isSoon = !t.finalizada && isDateSoon(t.data);
    const titulo = highlightSearchTerm(t.titulo || 'Sem Título', searchTerm);
    const descricao = highlightSearchTerm(t.descricao || '', searchTerm);
    
    return `
        <div id="card-${t.id}" class="task-card mb-3 bg-white dark:bg-slate-800 p-5 rounded-lg border-2 transition-all duration-300 relative group
            ${t.importante 
                ? 'border-orange-500 dark:border-yellow-400 shadow-[0_4px_15px_-3px_rgba(249,115,22,0.4)] dark:shadow-[0_4px_20px_-3px_rgba(250,204,21,0.5)]' 
                : 'border-slate-200 dark:border-slate-700'} 
            ${t.finalizada ? 'grayscale-[0.8] opacity-80' : ''}
            ${isOverdue ? 'border-red-500 dark:border-red-400' : ''}
            ${isSoon ? 'border-amber-500 dark:border-amber-400' : ''}">
            
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3 w-full">
                    <button onclick="toggleTask(${t.id})" class="text-2xl hover:scale-110 transition-transform flex-shrink-0" data-tooltip="${t.finalizada ? 'Marcar como pendente' : 'Marcar como concluída'}">
                        ${t.finalizada ? '✅' : '⭕'}
                    </button>
                    
                    <div class="w-full pr-4">
                        <h3 class="${t.finalizada ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'} font-bold text-lg leading-tight break-all">
                            ${titulo} 
                        </h3>
                        <span class="text-[10px] uppercase tracking-widest text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-slate-900 px-2 py-0.5 rounded mt-1 inline-block border border-indigo-100 dark:border-indigo-900/50">
                            ${highlightSearchTerm(t.categoria || 'GERAL', searchTerm)}
                        </span>
                    </div>
                </div>
                <button onclick="togglePriority(${t.id})" class="text-lg ${t.importante ? '' : 'grayscale opacity-45 hover:opacity-100'} transition-all" data-tooltip="Marcar como importante">⭐</button>
            </div>

            ${descricao ? renderDescriptionLog(descricao) : ''}

            <div class="flex justify-between items-center pl-11 pt-2 border-t border-slate-100 dark:border-slate-700/30 mt-2">
                <span class="text-xs ${isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : isSoon ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-500'} font-mono flex items-center gap-1">
                    📅 ${t.data} ${isOverdue ? '(Atrasada!)' : isSoon ? '(Próxima!)' : ''}
                </span>
                <div class="flex gap-4">
                    <button onclick="enableEditMode(${t.id})" class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 text-sm font-bold group-hover:opacity-100 opacity-60" data-tooltip="Editar tarefa">
                        ✏️ Editar
                    </button>
                    <button onclick="deleteTask(${t.id})" class="text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors group-hover:opacity-100 opacity-60" data-tooltip="Deletar tarefa">🗑️</button>
                </div>
            </div>
        </div>
    `;
}

function renderDescriptionLog(desc) {
    if (!desc) return '';
    return `<div class="pl-11 mb-4 text-sm text-slate-600 dark:text-slate-300 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
        ${desc.split('\n').map(line => line.trim() ? `<p class="border-l-2 border-slate-300 dark:border-slate-600 pl-2 hover:border-indigo-500 transition-colors">${line}</p>` : '').join('')}
    </div>`;
}

// --- MODO DE EDIÇÃO ---

function enableEditMode(id) {
    const task = tasksCache.find(t => t.id === id);
    if (!task) return;

    const card = document.getElementById(`card-${id}`);
    
    let dateVal = '';
    if (task.data && task.data.includes('/')) {
        const [d, m, y] = task.data.split('/');
        dateVal = `${y}-${m}-${d}`;
    }

    card.innerHTML = `
        <div class="animate-fade-in bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg mb-3 border border-indigo-200 dark:border-slate-700">
            <h4 class="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase mb-3 tracking-widest">Modo de Edição</h4>
            
            <div class="flex flex-col gap-3 mb-3">
                <div>
                    <label class="text-[10px] uppercase text-slate-500 font-bold">Título</label>
                    <input type="text" id="edit-title-${id}" value="${task.titulo || ''}" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-indigo-500 outline-none">
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-[10px] uppercase text-slate-500 font-bold">Categoria</label>
                        <input type="text" id="edit-cat-${id}" value="${task.categoria || ''}" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-800 dark:text-white focus:border-indigo-500 outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase text-slate-500 font-bold">Data</label>
                        <input type="date" id="edit-date-${id}" value="${dateVal}" min="${new Date().toISOString().split('T')[0]}" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-600 dark:text-slate-300 focus:border-indigo-500 outline-none">
                    </div>
                </div>

                <div>
                    <label class="text-[10px] uppercase text-slate-500 font-bold">Histórico</label>
                    <textarea id="edit-history-${id}" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-700 dark:text-slate-300 text-sm h-32 focus:border-indigo-500 outline-none leading-relaxed">${task.descricao || ''}</textarea>
                </div>

                <div class="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded border border-indigo-200 dark:border-indigo-500/20 mt-2">
                    <label class="text-[10px] uppercase text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                        <span>✨ Adicionar Nota Rápida</span>
                    </label>
                    <textarea id="edit-new-log-${id}" placeholder="Escreva uma atualização rápida..." class="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-500/30 rounded p-2 text-slate-800 dark:text-white text-sm h-16 focus:ring-2 focus:ring-indigo-500 outline-none mt-1"></textarea>
                </div>
                
                <div>
                    <label class="text-[10px] uppercase text-slate-500 font-bold block mb-2">Comentários</label>
                    <div id="comments-${id}" class="mb-2"></div>
                    <div class="flex gap-2">
                        <input type="text" id="new-comment-${id}" placeholder="Adicionar comentário..." class="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm">
                        <button onclick="addComment(${id}, document.getElementById('new-comment-${id}').value); document.getElementById('new-comment-${id}').value='';" class="px-3 py-1 bg-indigo-600 text-white rounded text-sm">💬</button>
                    </div>
                </div>
            </div>

            <div class="flex gap-2 justify-end mt-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button onclick="cancelEdit()" class="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-sm font-bold">Cancelar</button>
                <button onclick="saveEdit(${id})" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow-lg flex items-center gap-2">
                    <span>Salvar Tudo</span>
                </button>
            </div>
        </div>
    `;
    
    fetchComments(id);
}

function cancelEdit() {
    renderFilteredTasks();
}

async function saveEdit(id) {
    showLoading();
    
    const titulo = document.getElementById(`edit-title-${id}`).value;
    const categoria = document.getElementById(`edit-cat-${id}`).value;
    const dateRaw = document.getElementById(`edit-date-${id}`).value;
    
    let historyContent = document.getElementById(`edit-history-${id}`).value;
    
    const newLog = document.getElementById(`edit-new-log-${id}`).value;

    let dataFinal = dateRaw;
    if (dateRaw.includes('-')) {
        const [y, m, d] = dateRaw.split('-');
        dataFinal = `${d}/${m}/${y}`;
    }

    if (newLog.trim()) {
        const now = new Date();
        const timeStamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} às ${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}min`;
        const logEntry = `[${timeStamp}] ${newLog.trim()}`;
        historyContent = historyContent.trim() ? `${historyContent.trim()}\n${logEntry}` : logEntry;
    }

    try {
        const res = await fetch(`/atividades/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                titulo, 
                categoria, 
                data: dataFinal, 
                descricao: historyContent 
            })
        });

        if (res.ok) fetchTasks();
    } catch (err) { 
        console.error(err); 
    } finally {
        hideLoading();
    }
}

// --- CRIAÇÃO DE NOVA TAREFA ---

async function handleNewTask() {
    const titulo = document.getElementById('task-title').value.trim();
    const categoria = document.getElementById('task-category').value.trim() || 'Geral';
    const descricao = document.getElementById('task-desc').value.trim(); 
    let data = document.getElementById('task-date').value;
    
    const dateInput = document.getElementById('task-date');

    if (!titulo) return alert("Título obrigatório");
    
    if (!validateDate(dateInput)) {
        alert('Data não pode ser no passado');
        return;
    }

    if (data.includes('-')) {
        const [y, m, d] = data.split('-');
        data = `${d}/${m}/${y}`;
    }

    showLoading();

    try {
        await fetch('/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ titulo, categoria, descricao, data })
        });
        
        document.getElementById('task-title').value = '';
        document.getElementById('task-category').value = '';
        document.getElementById('task-desc').value = '';
        document.getElementById('task-date').value = new Date().toISOString().split('T')[0];
        
        fetchTasks();
    } catch (err) { 
        console.error(err); 
    } finally {
        hideLoading();
    }
}

// --- AÇÕES GLOBAIS ---
async function toggleTask(id) {
    showLoading();
    await fetch(`/atividades/${id}/finalizar`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
    fetchTasks();
}

async function togglePriority(id) {
    showLoading();
    await fetch(`/atividades/${id}/prioridade`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
    fetchTasks();
}

async function deleteTask(id) {
    const confirmed = await showConfirmDialog('Deseja realmente deletar esta tarefa?', 'Deletar', 'Cancelar');
    if (!confirmed) return;
    
    showLoading();
    await fetch(`/atividades/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    fetchTasks();
}

function logout() { 
    localStorage.removeItem('kard_token'); 
    window.location.href = '/login.html'; 
}

// --- INIT ---

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-logout')?.addEventListener('click', logout);
    document.getElementById('btn-save')?.addEventListener('click', handleNewTask);
    
    const dateInput = document.getElementById('task-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
        dateInput.min = new Date().toISOString().split('T')[0];
        dateInput.addEventListener('change', () => validateDate(dateInput));
    }
    
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchTasks(e.target.value));
    }
    
    // Filters
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.value = currentFilters.status;
        statusFilter.addEventListener('change', (e) => updateFilters('status', e.target.value));
    }
    
    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) {
        priorityFilter.value = currentFilters.priority;
        priorityFilter.addEventListener('change', (e) => updateFilters('priority', e.target.value));
    }
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => updateFilters('category', e.target.value));
    }
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.value = currentFilters.sort;
        sortSelect.addEventListener('change', (e) => updateFilters('sort', e.target.value));
    }
    
    // Export/Import
    document.getElementById('btn-export-json')?.addEventListener('click', () => exportData('json'));
    document.getElementById('btn-export-csv')?.addEventListener('click', () => exportData('csv'));
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => exportData('pdf'));
    document.getElementById('btn-import')?.addEventListener('click', importData);

    fetchTasks();
    setupInfiniteScroll();
    
    // Inicializa drag and drop
    if (window.dragDropManager) {
        window.dragDropManager.init();
    }
    
    // Inicializa notificações
    initializeNotifications();
});

// Global functions
window.toggleTask = toggleTask;
window.togglePriority = togglePriority;
window.deleteTask = deleteTask;
window.enableEditMode = enableEditMode;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.addComment = addComment;
window.deleteComment = deleteComment;
window.handleAttachmentUpload = handleAttachmentUpload;