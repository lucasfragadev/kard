/**
 * KARD - Main Script V5
 */

const token = localStorage.getItem('kard_token');
if (!token) window.location.href = '/login.html';

let tasksCache = [];

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
        tasksCache = await res.json();
        renderTasks(tasksCache);
    } catch (err) { console.error(err); }
}

// --- RENDERIZAÇÃO ---

function renderTasks(tasks) {
    const list = document.getElementById('task-list');
    
    if (tasks.length === 0) {
        list.innerHTML = `<div class="text-center py-10 text-slate-500">Nenhuma tarefa encontrada.</div>`;
        return;
    }

    list.innerHTML = tasks.map(t => `
        <div id="card-${t.id}" class="bg-slate-800 p-5 rounded-lg border-2 transition-all duration-300 relative group
            ${t.importante ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-slate-700'} 
            ${t.finalizada ? 'opacity-60 grayscale-[0.8]' : ''}">
            
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-3 w-full">
                    <button onclick="toggleTask(${t.id})" class="text-2xl hover:scale-110 transition-transform flex-shrink-0">
                        ${t.finalizada ? '✅' : '⭕'}
                    </button>
                    
                    <div class="w-full pr-4">
                        <h3 class="${t.finalizada ? 'line-through text-slate-500' : 'text-slate-100'} font-bold text-lg leading-tight break-all">
                            ${t.titulo || 'Sem Título'} 
                        </h3>
                        <span class="text-[10px] uppercase tracking-widest text-indigo-400 font-bold bg-slate-900 px-2 py-0.5 rounded mt-1 inline-block border border-indigo-900/50">
                            ${t.categoria || 'GERAL'}
                        </span>
                    </div>
                </div>
                <button onclick="togglePriority(${t.id})" class="text-lg ${t.importante ? '' : 'grayscale opacity-20 hover:opacity-100'} transition-all">⭐</button>
            </div>

            ${renderDescriptionLog(t.descricao)}

            <div class="flex justify-between items-center pl-11 pt-2 border-t border-slate-700/30 mt-2">
                <span class="text-xs text-slate-500 font-mono flex items-center gap-1">📅 ${t.data}</span>
                <div class="flex gap-4">
                    <button onclick="enableEditMode(${t.id})" class="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-1 text-sm font-bold group-hover:opacity-100 opacity-60">
                        ✏️ Editar / Atualizar
                    </button>
                    <button onclick="deleteTask(${t.id})" class="text-slate-400 hover:text-red-400 transition-colors group-hover:opacity-100 opacity-60">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderDescriptionLog(desc) {
    if (!desc) return '';
    return `<div class="pl-11 mb-4 text-sm text-slate-300 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
        ${desc.split('\n').map(line => line.trim() ? `<p class="border-l-2 border-slate-600 pl-2 hover:border-indigo-500 transition-colors">${line}</p>` : '').join('')}
    </div>`;
}

// --- MODO DE EDIÇÃO ---

function enableEditMode(id) {
    const task = tasksCache.find(t => t.id === id);
    if (!task) return;

    const card = document.getElementById(`card-${id}`);
    
    // Converte data para o input
    let dateVal = '';
    if (task.data && task.data.includes('/')) {
        const [d, m, y] = task.data.split('/');
        dateVal = `${y}-${m}-${d}`;
    }

    card.innerHTML = `
        <div class="animate-fade-in bg-slate-900/50 p-4 -m-4 rounded-lg">
            <h4 class="text-indigo-400 text-xs font-bold uppercase mb-3 tracking-widest">Modo de Edição</h4>
            
            <div class="flex flex-col gap-3 mb-3">
                <div>
                    <label class="text-[10px] uppercase text-slate-500 font-bold">Título</label>
                    <input type="text" id="edit-title-${id}" value="${task.titulo || ''}" class="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-indigo-500 outline-none">
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="text-[10px] uppercase text-slate-500 font-bold">Categoria</label>
                        <input type="text" id="edit-cat-${id}" value="${task.categoria || ''}" class="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-indigo-500 outline-none">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase text-slate-500 font-bold">Data</label>
                        <input type="date" id="edit-date-${id}" value="${dateVal}" class="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-300 focus:border-indigo-500 outline-none">
                    </div>
                </div>

                <div>
                    <label class="text-[10px] uppercase text-slate-500 font-bold">Descrição / Histórico (Corrija o que quiser aqui)</label>
                    <textarea id="edit-history-${id}" class="w-full bg-slate-800 border border-slate-600 rounded p-2 text-slate-300 text-sm h-32 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed">${task.descricao || ''}</textarea>
                </div>

                <div class="bg-indigo-900/10 p-2 rounded border border-indigo-500/20 mt-2">
                    <label class="text-[10px] uppercase text-indigo-400 font-bold flex items-center gap-1">
                        <span>✨ Adicionar Nota Rápida</span>
                        <span class="text-slate-600 font-normal normal-case">(Será adicionada ao fim com data/hora)</span>
                    </label>
                    <textarea id="edit-new-log-${id}" placeholder="Escreva uma atualização rápida..." class="w-full bg-slate-800 border border-indigo-500/30 rounded p-2 text-white text-sm h-16 focus:ring-2 focus:ring-indigo-500 outline-none mt-1"></textarea>
                </div>
            </div>

            <div class="flex gap-2 justify-end mt-4 pt-2 border-t border-slate-700">
                <button onclick="cancelEdit()" class="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">Cancelar</button>
                <button onclick="saveEdit(${id})" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-sm shadow-lg flex items-center gap-2">
                    <span>Salvar Tudo</span>
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
        
        const dia = String(now.getDate()).padStart(2, '0');
        const mes = String(now.getMonth() + 1).padStart(2, '0');
        const hora = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');

        const timeStamp = `${dia}/${mes} às ${hora}h${min}min`;
        
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