/**
 * KARD - Main Script V10 (UI/UX Limpo com Ícones Lucide)
 */

const token = localStorage.getItem('kard_token');
if (!token) window.location.href = '/login.html';

let tasksCache = [];

// --- BIBLIOTECA DE ÍCONES (LUCIDE) ---
const LucideIcons = {
    square: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`,
    checkSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`,
    flag: (active) => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    note: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-logout')?.addEventListener('click', logout);
    document.getElementById('btn-save')?.addEventListener('click', handleNewTask);
    
    const dateInput = document.getElementById('task-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

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

            const dateA = a.data ? new Date(a.data.split('/').reverse().join('-')) : new Date(0);
            const dateB = b.data ? new Date(b.data.split('/').reverse().join('-')) : new Date(0);

            return dateB - dateA;
        });

        renderTasks(tasksCache);
    } catch (err) { console.error(err); }
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
        htmlContent = `<div class="text-center py-6 text-slate-400 dark:text-slate-600 text-sm italic">Tudo feito por aqui! 🎉</div>`;
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
}

// Função auxiliar para gerar o HTML do card
function createTaskCard(t) {
    return `
        <div id="card-${t.id}" class="mb-3 bg-white dark:bg-slate-800 p-5 rounded-lg border-2 transition-all duration-300 relative group
            ${t.importante 
                ? 'border-orange-500 dark:border-yellow-400 shadow-[0_4px_15px_-3px_rgba(249,115,22,0.4)] dark:shadow-[0_4px_20px_-3px_rgba(250,204,21,0.5)]' 
                : 'border-slate-200 dark:border-slate-700'} 
            ${t.finalizada ? 'grayscale-[0.8] opacity-80' : ''}">
            
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3 w-full">
                    
                    <button onclick="toggleTask(${t.id})" class="flex-shrink-0 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 ${t.finalizada ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}" title="${t.finalizada ? 'Reabrir Tarefa' : 'Concluir Tarefa'}">
                        ${t.finalizada ? LucideIcons.checkSquare : LucideIcons.square}
                    </button>
                    
                    <div class="w-full pr-4">
                        <h3 class="${t.finalizada ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'} font-bold text-lg leading-tight break-all cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" onclick="toggleTask(${t.id})">
                            ${t.titulo || 'Sem Título'} 
                        </h3>
                        <span class="text-[10px] uppercase tracking-widest text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-slate-900 px-2 py-0.5 rounded mt-1 inline-block border border-indigo-100 dark:border-indigo-900/50">
                            ${t.categoria || 'GERAL'}
                        </span>
                    </div>
                </div>
                
                <button onclick="togglePriority(${t.id})" class="transition-all hover:scale-110 ${t.importante ? 'text-orange-500 dark:text-yellow-400' : 'text-slate-300 dark:text-slate-600 hover:text-orange-400 dark:hover:text-yellow-500'}" title="Marcar Prioridade">
                    ${LucideIcons.flag(t.importante)}
                </button>
            </div>

            ${renderDescriptionLog(t.descricao)}

            <div class="flex justify-between items-center pl-9 pt-2 border-t border-slate-100 dark:border-slate-700/30 mt-2">
                <span class="text-xs text-slate-500 dark:text-slate-500 font-mono flex items-center gap-1.5">
                    ${LucideIcons.calendar} ${t.data}
                </span>
                <div class="flex gap-4">
                    <button onclick="enableEditMode(${t.id})" class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 text-sm font-bold group-hover:opacity-100 opacity-60">
                        ${LucideIcons.edit} Editar
                    </button>
                    <button onclick="deleteTask(${t.id})" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm font-bold group-hover:opacity-100 opacity-60">
                        ${LucideIcons.trash}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderDescriptionLog(desc) {
    if (!desc) return '';
    return `<div class="pl-9 mb-4 text-sm text-slate-600 dark:text-slate-300 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
        ${desc.split('\n').map(line => line.trim() ? `<p class="border-l-2 border-slate-300 dark:border-slate-600 pl-3 hover:border-indigo-500 transition-colors">${line}</p>` : '').join('')}
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

                <div>
                    <label class="text-[10px] uppercase text-slate-500 font-bold">Histórico</label>
                    <textarea id="edit-history-${id}" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-700 dark:text-slate-300 text-sm h-32 focus:border-indigo-500 outline-none leading-relaxed">${task.descricao || ''}</textarea>
                </div>

                <div class="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded border border-indigo-200 dark:border-indigo-500/20 mt-2">
                    <label class="text-[10px] uppercase text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 mb-2">
                        ${LucideIcons.note} <span>Adicionar Nota Rápida</span>
                    </label>
                    <textarea id="edit-new-log-${id}" placeholder="Escreva uma atualização rápida..." class="w-full bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-500/30 rounded p-2 text-slate-800 dark:text-white text-sm h-16 focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                </div>
            </div>

            <div class="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button onclick="cancelEdit()" class="px-4 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-sm font-bold transition-colors">Cancelar</button>
                <button onclick="saveEdit(${id})" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow-md transition-colors">
                    Salvar Tudo
                </button>
            </div>
        </div>
    `;
}

function cancelEdit() {
    renderTasks(tasksCache);
}

async function saveEdit(id) {
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
    } catch (err) { console.error(err); }
}

// --- CRIAÇÃO DE NOVA TAREFA ---

async function handleNewTask() {
    const titulo = document.getElementById('task-title').value.trim();
    const categoria = document.getElementById('task-category').value.trim() || 'Geral';
    const descricao = document.getElementById('task-desc').value.trim(); 
    let data = document.getElementById('task-date').value;

    if (!titulo) return alert("Título obrigatório");

    if (data.includes('-')) {
        const [y, m, d] = data.split('-');
        data = `${d}/${m}/${y}`;
    }

    try {
        await fetch('/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ titulo, categoria, descricao, data })
        });
        
        document.getElementById('task-title').value = '';
        document.getElementById('task-category').value = '';
        document.getElementById('task-desc').value = '';
        fetchTasks();
    } catch (err) { console.error(err); }
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
async function deleteTask(id) {
    if (confirm("Deletar tarefa?")) {
        await fetch(`/atividades/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        fetchTasks();
    }
}
function logout() { localStorage.removeItem('kard_token'); window.location.href = '/login.html'; }

window.toggleTask = toggleTask;
window.togglePriority = togglePriority;
window.deleteTask = deleteTask;
window.enableEditMode = enableEditMode;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;