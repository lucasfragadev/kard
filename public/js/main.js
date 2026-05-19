/**
 * KARD - Main Script V12
 */

const token = localStorage.getItem('kard_token');
if (!token) window.location.href = '/login.html';

let tasksCache = [];
let mainEditor;
let activeFilter = null;
let completedCollapsed = localStorage.getItem('kard_completed_collapsed') === 'true';

const LucideIcons = {
    square: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`,
    checkSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`,
    flag: (active) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    note: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
    send: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
    chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
};

const quillToolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'],
    ['link'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean']
];

// --- MODAL DE CONFIRMAÇÃO ---

let pendingDeleteId = null;

function openConfirmModal(id, titulo) {
    pendingDeleteId = id;
    const modal = document.getElementById('confirm-modal');
    const text = document.getElementById('confirm-modal-text');
    const btn = document.getElementById('confirm-modal-btn');
    if (!modal || !text || !btn) return;

    text.textContent = titulo ? `"${titulo}" será removida permanentemente.` : 'Esta tarefa será removida permanentemente.';
    btn.onclick = () => confirmDelete();
    modal.classList.remove('hidden');
    modal.addEventListener('click', handleModalBackdrop);
}

function closeConfirmModal() {
    pendingDeleteId = null;
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.removeEventListener('click', handleModalBackdrop);
}

function handleModalBackdrop(e) {
    if (e.target === document.getElementById('confirm-modal')) closeConfirmModal();
}

async function confirmDelete() {
    const id = pendingDeleteId;
    if (!id) return;
    closeConfirmModal();

    await fetch(`/atividades/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    showToast('Tarefa removida.', 'info');
    fetchTasks();
}

// --- TOAST ---

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
        success: 'bg-emerald-600 text-white',
        error:   'bg-red-600 text-white',
        info:    'bg-indigo-600 text-white',
    };

    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-lg shadow-lg text-sm font-bold transition-all duration-300 opacity-0 translate-y-2 ${colors[type] || colors.success}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    });

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

// --- SANITIZAÇÃO XSS ---

function sanitize(html) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    }
    return html;
}

// --- LOADING STATE ---

function setLoading(btn, isLoading, originalHTML) {
    if (isLoading) {
        btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = '<span class="opacity-60">Salvando...</span>';
        btn.disabled = true;
    } else {
        btn.innerHTML = originalHTML ?? btn.dataset.originalHtml ?? btn.innerHTML;
        btn.disabled = false;
    }
}

// --- STATUS DE DATA ---

function getDateStatus(dataStr) {
    if (!dataStr) return null;

    let date;
    if (dataStr.includes('/')) {
        const [d, m, y] = dataStr.split('/');
        date = new Date(`${y}-${m}-${d}`);
    } else {
        date = new Date(dataStr);
    }

    if (isNaN(date)) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < today) return 'overdue';
    if (date.getTime() === today.getTime()) return 'today';
    return 'future';
}

// --- INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-logout')?.addEventListener('click', logout);
    document.getElementById('btn-save')?.addEventListener('click', handleNewTask);

    const dateInput = document.getElementById('task-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    try {
        if (typeof Quill !== 'undefined' && document.getElementById('editor-container')) {
            mainEditor = new Quill('#editor-container', {
                theme: 'snow',
                placeholder: 'Adicione links, observações, listas...',
                modules: { toolbar: quillToolbarOptions }
            });
        }
    } catch (error) { console.error("Erro ao iniciar o editor:", error); }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            const editingCard = document.querySelector('[id^="edit-editor-"]');
            if (!editingCard) handleNewTask();
        }
    });

    fetchTasks();
});

// --- API ---

async function fetchTasks() {
    try {
        const res = await fetch('/atividades', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.status === 401) return logout();

        let data = await res.json();

        tasksCache = data.sort((a, b) => {
            if (a.importante && !b.importante) return -1;
            if (!a.importante && b.importante) return 1;

            const dateA = a.data ? new Date(a.data.includes('/') ? a.data.split('/').reverse().join('-') : a.data) : new Date(0);
            const dateB = b.data ? new Date(b.data.includes('/') ? b.data.split('/').reverse().join('-') : b.data) : new Date(0);

            return dateB - dateA;
        });

        renderStats();
        renderCategoryFilter();
        renderTasks(tasksCache);
    } catch (err) { console.error("Erro ao buscar tarefas:", err); }
}

// --- STATS ---

function renderStats() {
    const container = document.getElementById('stats-bar');
    if (!container) return;

    const ativas = tasksCache.filter(t => !t.finalizada);
    const atrasadas = ativas.filter(t => getDateStatus(t.data) === 'overdue').length;
    const concluidas = tasksCache.filter(t => t.finalizada).length;

    const stat = (label, value, color) => `
        <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-center">
            <div class="text-2xl font-bold ${color}">${value}</div>
            <div class="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mt-0.5">${label}</div>
        </div>`;

    container.innerHTML =
        stat('Ativas', ativas.length, 'text-indigo-600 dark:text-indigo-400') +
        stat('Atrasadas', atrasadas, atrasadas > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500') +
        stat('Concluídas', concluidas, 'text-emerald-600 dark:text-emerald-400');
}

// --- FILTRO DE CATEGORIAS ---

function renderCategoryFilter() {
    const container = document.getElementById('category-filter');
    if (!container) return;

    const activeTasks = tasksCache.filter(t => !t.finalizada);
    const categories = [...new Set(activeTasks.map(t => t.categoria || 'Geral').filter(Boolean))].sort();

    if (categories.length <= 1) {
        container.innerHTML = '';
        return;
    }

    const btnBase = 'px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer';
    const btnActive = 'bg-indigo-600 text-white border-indigo-600';
    const btnInactive = 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-400';

    const allClass = activeFilter === null ? btnActive : btnInactive;
    let html = `<button class="${btnBase} ${allClass}" onclick="setFilter(null)">Todas</button>`;

    for (const cat of categories) {
        const isActive = activeFilter === cat;
        html += `<button class="${btnBase} ${isActive ? btnActive : btnInactive}" onclick="setFilter('${cat}')">${cat}</button>`;
    }

    container.innerHTML = html;
}

function setFilter(category) {
    activeFilter = category;
    renderCategoryFilter();
    renderTasks(tasksCache);
}

// --- RENDERIZAÇÃO ---

function renderTasks(tasks) {
    const list = document.getElementById('task-list');

    let filtered = tasks;
    if (activeFilter) {
        filtered = tasks.filter(t => (t.categoria || 'Geral') === activeFilter);
    }

    const activeTasks = filtered.filter(t => !t.finalizada);
    const completedTasks = filtered.filter(t => t.finalizada);

    let htmlContent = '';

    if (activeTasks.length > 0) {
        htmlContent += activeTasks.map(t => createTaskCard(t)).join('');
    } else if (completedTasks.length === 0) {
        htmlContent = `<div class="text-center py-10 text-slate-500 dark:text-slate-500">Nenhuma tarefa encontrada.</div>`;
    } else {
        htmlContent = `<div class="text-center py-6 text-slate-400 dark:text-slate-600 text-sm italic">Tudo feito por aqui!</div>`;
    }

    if (completedTasks.length > 0) {
        const chevron = completedCollapsed ? LucideIcons.chevronRight : LucideIcons.chevronDown;
        htmlContent += `
            <div class="mt-10 mb-6 border-b border-slate-200 dark:border-slate-700 pb-2 animate-fade-in">
                <button onclick="toggleCompletedSection()" class="flex justify-between items-center w-full group">
                    <h3 class="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-widest">
                        Tarefas Concluídas (${completedTasks.length})
                    </h3>
                    <span class="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors">${chevron}</span>
                </button>
            </div>
        `;

        if (!completedCollapsed) {
            htmlContent += `
                <div class="opacity-75 hover:opacity-100 transition-opacity duration-300">
                    ${completedTasks.map(t => createTaskCard(t)).join('')}
                </div>
            `;
        }
    }

    list.innerHTML = htmlContent;
}

function toggleCompletedSection() {
    completedCollapsed = !completedCollapsed;
    localStorage.setItem('kard_completed_collapsed', completedCollapsed);
    renderTasks(tasksCache);
}

function createTaskCard(t) {
    const dateStatus = t.finalizada ? null : getDateStatus(t.data);

    const borderClass = t.importante
        ? 'border-orange-500 dark:border-yellow-400 shadow-[0_4px_15px_-3px_rgba(249,115,22,0.4)] dark:shadow-[0_4px_20px_-3px_rgba(250,204,21,0.5)]'
        : dateStatus === 'overdue'
            ? 'border-red-500 dark:border-red-500'
            : dateStatus === 'today'
                ? 'border-yellow-400 dark:border-yellow-400'
                : 'border-slate-200 dark:border-slate-700';

    const dateBadge = dateStatus === 'overdue'
        ? `<span class="ml-2 text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">Atrasada</span>`
        : dateStatus === 'today'
            ? `<span class="ml-2 text-[10px] font-bold uppercase bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded">Hoje</span>`
            : '';

    return `
        <div id="card-${t.id}" class="mb-3 bg-white dark:bg-slate-800 p-5 rounded-lg border-2 transition-all duration-300 relative group
            ${borderClass}
            ${t.finalizada ? 'grayscale-[0.8] opacity-80' : ''}">

            <div class="flex items-start gap-3 w-full">
                <button onclick="toggleTask(${t.id})" class="mt-1 flex-shrink-0 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${t.finalizada ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}" title="${t.finalizada ? 'Reabrir Tarefa' : 'Concluir Tarefa'}">
                    ${t.finalizada ? LucideIcons.checkSquare : LucideIcons.square}
                </button>

                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start gap-4">
                        <h3 class="${t.finalizada ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'} font-bold text-lg leading-tight break-all cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onclick="toggleTask(${t.id})">
                            ${t.titulo || 'Sem Título'}
                        </h3>

                        <button onclick="togglePriority(${t.id})" class="mt-0.5 flex-shrink-0 transition-all hover:scale-110 ${t.importante ? 'text-orange-500 dark:text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-orange-400 dark:hover:text-yellow-500'}" title="Marcar Prioridade">
                            ${LucideIcons.flag(t.importante)}
                        </button>
                    </div>

                    <div class="mt-1.5 mb-3">
                        <span class="text-[10px] uppercase tracking-widest text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-slate-900 px-2 py-0.5 rounded inline-block border border-indigo-100 dark:border-indigo-900/50">
                            ${t.categoria || 'GERAL'}
                        </span>
                    </div>

                    ${renderDescriptionLog(t.descricao)}

                    <div class="flex justify-between items-center">
                        <span class="text-xs text-slate-500 dark:text-slate-500 font-mono flex items-center gap-1.5">
                            ${LucideIcons.calendar} ${t.data || '—'}${dateBadge}
                        </span>
                        <div class="flex gap-4">
                            <button onclick="enableEditMode(${t.id})" class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-sm font-bold group-hover:opacity-100 opacity-60">
                                ${LucideIcons.edit} Editar
                            </button>
                            <button id="del-btn-${t.id}" onclick="deleteTask(${t.id})" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm font-bold group-hover:opacity-100 opacity-60">
                                ${LucideIcons.trash}
                            </button>
                        </div>
                    </div>

                    ${!t.finalizada ? `
                    <div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/30">
                        <label class="text-[10px] uppercase text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 mb-2">
                            ${LucideIcons.note} <span>Adicionar Nota Rápida</span>
                        </label>

                        <div class="flex flex-col items-end gap-2">
                            <textarea id="quick-note-${t.id}" placeholder="Escreva uma atualização rápida..." class="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500 outline-none resize-y transition-colors"></textarea>

                            <button id="note-btn-${t.id}" onclick="saveQuickNote(${t.id})" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow-md transition-colors">
                                Salvar
                            </button>
                        </div>
                    </div>
                    ` : ''}

                </div>
            </div>
        </div>`;
}

function renderDescriptionLog(desc) {
    if (!desc || desc === '<p><br></p>') return '';

    let formattedDesc = desc;
    if (!desc.includes('<p>')) {
        formattedDesc = desc.replace(/\n/g, '<br>');
    }

    return `<div class="mb-2 text-sm text-slate-600 dark:text-slate-300 max-h-60 overflow-y-auto custom-scrollbar">
        <div class="ql-editor p-0 border-l-2 border-slate-300 dark:border-slate-600 pl-3 -ml-3">${formattedDesc}</div>
    </div>`;
}

// --- NOTA RÁPIDA ---

async function saveQuickNote(id) {
    const noteInput = document.getElementById(`quick-note-${id}`);
    const btn = document.getElementById(`note-btn-${id}`);
    if (!noteInput || !btn) return;

    const newLog = noteInput.value.trim();
    if (!newLog) return;

    const task = tasksCache.find(t => t.id === id);
    if (!task) return;

    const now = new Date();
    const timeStamp = `[${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')} às ${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}min]`;

    const newLogHtml = sanitize(newLog.replace(/\n/g, '<br>'));
    const formattedLog = `<p><br></p><p><strong>${timeStamp}</strong><br>${newLogHtml}</p>`;

    let updatedDesc = task.descricao || '';
    if (updatedDesc === '<p><br></p>') updatedDesc = '';
    updatedDesc += formattedLog;

    setLoading(btn, true);

    try {
        const res = await fetch(`/atividades/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                titulo: task.titulo,
                categoria: task.categoria,
                data: task.data,
                descricao: updatedDesc
            })
        });

        if (res.ok) {
            showToast('Nota salva!', 'success');
            fetchTasks();
        } else {
            setLoading(btn, false);
            showToast('Erro ao salvar nota.', 'error');
        }
    } catch (err) {
        console.error(err);
        setLoading(btn, false);
        showToast('Erro ao salvar nota.', 'error');
    }
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
            <div class="flex items-center gap-2 mb-3 text-indigo-600 dark:text-indigo-400">
                ${LucideIcons.edit}
                <h4 class="text-xs font-bold uppercase tracking-widest">Modo de Edição</h4>
            </div>

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
                        <input type="date" id="edit-date-${id}" value="${dateVal}" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-600 dark:text-slate-300 focus:border-indigo-500 outline-none">
                    </div>
                </div>

                <div class="mt-2">
                    <label class="text-[10px] uppercase text-slate-500 font-bold">Descrição / Histórico</label>
                    <div class="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 transition-colors">
                        <div id="edit-editor-${id}" style="height: 150px;"></div>
                    </div>
                </div>
            </div>

            <div class="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button onclick="cancelEdit()" class="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-sm font-bold transition-colors">Cancelar</button>
                <button id="edit-save-btn-${id}" onclick="saveEdit(${id})" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow-md transition-colors">
                    Salvar Tudo
                </button>
            </div>
        </div>
    `;

    try {
        if (typeof Quill !== 'undefined') {
            const editQuill = new Quill(`#edit-editor-${id}`, {
                theme: 'snow',
                modules: { toolbar: quillToolbarOptions }
            });

            let formattedDesc = task.descricao || '';
            if (formattedDesc && !formattedDesc.includes('<p>')) {
                formattedDesc = formattedDesc.replace(/\n/g, '<br>');
            }

            if (formattedDesc) {
                editQuill.clipboard.dangerouslyPasteHTML(formattedDesc);
            }
            window[`editQuill_${id}`] = editQuill;
        } else {
            document.getElementById(`edit-editor-${id}`).innerHTML = `<p class="p-4 text-red-500 text-sm">Erro ao carregar o editor.</p>`;
        }
    } catch (e) { console.error(e); }
}

function cancelEdit() {
    renderTasks(tasksCache);
}

async function saveEdit(id) {
    const titulo = document.getElementById(`edit-title-${id}`).value;
    const categoria = document.getElementById(`edit-cat-${id}`).value;
    const dateRaw = document.getElementById(`edit-date-${id}`).value;
    const btn = document.getElementById(`edit-save-btn-${id}`);

    const editQuill = window[`editQuill_${id}`];
    let historyContent = editQuill ? sanitize(editQuill.root.innerHTML) : '';
    if (historyContent === '<p><br></p>') historyContent = '';

    let dataFinal = dateRaw;
    if (dateRaw.includes('-')) {
        const [y, m, d] = dateRaw.split('-');
        dataFinal = `${d}/${m}/${y}`;
    }

    if (btn) setLoading(btn, true);

    try {
        const res = await fetch(`/atividades/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ titulo, categoria, data: dataFinal, descricao: historyContent })
        });

        delete window[`editQuill_${id}`];

        if (res.ok) {
            showToast('Atividade atualizada!', 'success');
            fetchTasks();
        } else {
            if (btn) setLoading(btn, false);
            showToast('Erro ao salvar.', 'error');
        }
    } catch (err) {
        console.error(err);
        if (btn) setLoading(btn, false);
        showToast('Erro ao salvar.', 'error');
    }
}

// --- CRIAÇÃO DE NOVA TAREFA ---

async function handleNewTask() {
    const titulo = document.getElementById('task-title').value.trim();
    const categoria = document.getElementById('task-category').value.trim() || 'Geral';
    let data = document.getElementById('task-date').value;

    let descricao = '';
    if (mainEditor) {
        descricao = sanitize(mainEditor.root.innerHTML);
        if (descricao === '<p><br></p>') descricao = '';
    }

    if (!titulo) {
        showToast('Título é obrigatório.', 'error');
        return;
    }

    if (data.includes('-')) {
        const [y, m, d] = data.split('-');
        data = `${d}/${m}/${y}`;
    }

    const btn = document.getElementById('btn-save');
    if (btn) setLoading(btn, true);

    try {
        const res = await fetch('/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ titulo, categoria, descricao, data })
        });

        if (res.ok) {
            document.getElementById('task-title').value = '';
            document.getElementById('task-category').value = '';
            if (mainEditor) mainEditor.setContents([]);
            showToast('Atividade salva!', 'success');
            fetchTasks();
        } else {
            showToast('Erro ao criar atividade.', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Erro ao criar atividade.', 'error');
    } finally {
        if (btn) setLoading(btn, false);
    }
}

// --- AÇÕES GLOBAIS ---

async function toggleTask(id) {
    await fetch(`/atividades/${id}/finalizar`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
    fetchTasks();
}

async function togglePriority(id) {
    await fetch(`/atividades/${id}/prioridade`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
    fetchTasks();
}

function deleteTask(id) {
    const task = tasksCache.find(t => t.id === id);
    openConfirmModal(id, task?.titulo || '');
}

function logout() {
    localStorage.removeItem('kard_token');
    window.location.href = '/login.html';
}

window.toggleTask = toggleTask;
window.togglePriority = togglePriority;
window.deleteTask = deleteTask;
window.enableEditMode = enableEditMode;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.saveQuickNote = saveQuickNote;
window.setFilter = setFilter;
window.toggleCompletedSection = toggleCompletedSection;
window.closeConfirmModal = closeConfirmModal;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}
