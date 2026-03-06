/**
 * KARD - Dashboard Script
 * Gráficos e métricas de produtividade
 */

const token = localStorage.getItem('kard_token');
if (!token) window.location.href = '/login.html';

let tasksCache = [];
let currentPeriod = 7; // dias
let charts = {};

// --- UTILITY FUNCTIONS ---

function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function parseDate(dateStr) {
    if (!dateStr) return null;
    
    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(`${y}-${m}-${d}`);
    } else if (dateStr.includes('-')) {
        return new Date(dateStr);
    }
    
    return null;
}

function formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isWithinPeriod(dateStr, days) {
    if (!dateStr) return false;
    
    const taskDate = parseDate(dateStr);
    if (!taskDate) return false;
    
    const now = new Date();
    const periodStart = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return taskDate >= periodStart && taskDate <= now;
}

// --- DATA FETCHING ---

async function fetchTasks() {
    showLoading();
    
    try {
        const res = await fetch('/atividades', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 401) {
            localStorage.removeItem('kard_token');
            window.location.href = '/login.html';
            return;
        }
        
        const data = await res.json();
        tasksCache = data;
        
        calculateMetrics();
        renderCharts();
    } catch (err) {
        console.error('Erro ao buscar tarefas:', err);
        alert('Erro ao carregar dados do dashboard');
    } finally {
        hideLoading();
    }
}

// --- METRICS CALCULATION ---

function calculateMetrics() {
    let filteredTasks = tasksCache;
    
    // Filtrar por período se não for "all"
    if (currentPeriod !== 'all') {
        filteredTasks = tasksCache.filter(t => isWithinPeriod(t.data, currentPeriod));
    }
    
    // Total de tarefas
    const totalTasks = filteredTasks.length;
    
    // Concluídas
    const completedTasks = filteredTasks.filter(t => t.finalizada).length;
    
    // Pendentes
    const pendingTasks = filteredTasks.filter(t => !t.finalizada).length;
    
    // Alta prioridade
    const priorityTasks = filteredTasks.filter(t => t.importante && !t.finalizada).length;
    
    // Taxa de conclusão
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Atualizar cards
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('pending-tasks').textContent = pendingTasks;
    document.getElementById('priority-tasks').textContent = priorityTasks;
    
    const completionRateEl = document.getElementById('completion-rate');
    if (completionRateEl) {
        completionRateEl.textContent = `${completionRate}%`;
    }
}

// --- CHART RENDERING ---

function getChartColors() {
    const isDark = document.documentElement.classList.contains('dark');
    
    return {
        primary: isDark ? '#818cf8' : '#4f46e5',
        success: isDark ? '#4ade80' : '#10b981',
        warning: isDark ? '#fbbf24' : '#f59e0b',
        danger: isDark ? '#f87171' : '#ef4444',
        text: isDark ? '#e2e8f0' : '#1e293b',
        grid: isDark ? '#334155' : '#e2e8f0',
        background: isDark ? '#1e293b' : '#ffffff'
    };
}

function getChartDefaults() {
    const colors = getChartColors();
    
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: colors.text,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: { color: colors.text },
                grid: { color: colors.grid }
            },
            y: {
                ticks: { color: colors.text },
                grid: { color: colors.grid }
            }
        }
    };
}

function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

function renderCharts() {
    renderStatusChart();
    renderPriorityChart();
    renderCategoryChart();
    renderProductivityChart();
    renderCompletionTrendChart();
}

// 1. Gráfico de Status (Concluídas vs Pendentes)
function renderStatusChart() {
    destroyChart('statusChart');
    
    let filteredTasks = tasksCache;
    if (currentPeriod !== 'all') {
        filteredTasks = tasksCache.filter(t => isWithinPeriod(t.data, currentPeriod));
    }
    
    const completed = filteredTasks.filter(t => t.finalizada).length;
    const pending = filteredTasks.filter(t => !t.finalizada).length;
    
    const colors = getChartColors();
    const ctx = document.getElementById('statusChart');
    if (!ctx) return;
    
    charts.statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Concluídas', 'Pendentes'],
            datasets: [{
                data: [completed, pending],
                backgroundColor: [colors.success, colors.warning],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        padding: 15,
                        font: { size: 13, weight: 'bold' }
                    }
                }
            }
        }
    });
}

// 2. Gráfico de Prioridade
function renderPriorityChart() {
    destroyChart('priorityChart');
    
    let filteredTasks = tasksCache;
    if (currentPeriod !== 'all') {
        filteredTasks = tasksCache.filter(t => isWithinPeriod(t.data, currentPeriod));
    }
    
    const important = filteredTasks.filter(t => t.importante).length;
    const normal = filteredTasks.filter(t => !t.importante).length;
    
    const colors = getChartColors();
    const ctx = document.getElementById('priorityChart');
    if (!ctx) return;
    
    charts.priorityChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Alta Prioridade', 'Normal'],
            datasets: [{
                data: [important, normal],
                backgroundColor: [colors.danger, colors.primary],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        padding: 15,
                        font: { size: 13, weight: 'bold' }
                    }
                }
            }
        }
    });
}

// 3. Gráfico por Categoria
function renderCategoryChart() {
    destroyChart('categoryChart');
    
    let filteredTasks = tasksCache;
    if (currentPeriod !== 'all') {
        filteredTasks = tasksCache.filter(t => isWithinPeriod(t.data, currentPeriod));
    }
    
    const categoryCounts = {};
    filteredTasks.forEach(t => {
        const cat = t.categoria || 'Sem Categoria';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    
    const colors = getChartColors();
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    charts.categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tarefas por Categoria',
                data: data,
                backgroundColor: colors.primary,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: colors.text },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: colors.text,
                        stepSize: 1
                    },
                    grid: { color: colors.grid }
                }
            }
        }
    });
}

// 4. Gráfico de Produtividade ao Longo do Tempo
function renderProductivityChart() {
    destroyChart('productivityChart');
    
    let filteredTasks = tasksCache;
    const days = currentPeriod === 'all' ? 30 : currentPeriod;
    
    if (currentPeriod !== 'all') {
        filteredTasks = tasksCache.filter(t => isWithinPeriod(t.data, currentPeriod));
    }
    
    // Agrupar tarefas por data
    const tasksByDate = {};
    const completedByDate = {};
    
    filteredTasks.forEach(t => {
        if (!t.data) return;
        
        const date = parseDate(t.data);
        if (!date) return;
        
        const dateKey = formatDate(date);
        
        tasksByDate[dateKey] = (tasksByDate[dateKey] || 0) + 1;
        
        if (t.finalizada) {
            completedByDate[dateKey] = (completedByDate[dateKey] || 0) + 1;
        }
    });
    
    // Ordenar datas
    const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
        const [dA, mA, yA] = a.split('/');
        const [dB, mB, yB] = b.split('/');
        return new Date(`${yA}-${mA}-${dA}`) - new Date(`${yB}-${mB}-${dB}`);
    });
    
    const labels = sortedDates.slice(-days);
    const totalData = labels.map(date => tasksByDate[date] || 0);
    const completedData = labels.map(date => completedByDate[date] || 0);
    
    const colors = getChartColors();
    const ctx = document.getElementById('productivityChart');
    if (!ctx) return;
    
    charts.productivityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total de Tarefas',
                    data: totalData,
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '20',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Tarefas Concluídas',
                    data: completedData,
                    borderColor: colors.success,
                    backgroundColor: colors.success + '20',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.text,
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: colors.text,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { color: colors.grid }
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: colors.text,
                        stepSize: 1
                    },
                    grid: { color: colors.grid }
                }
            }
        }
    });
}

// 5. Gráfico de Tendência de Conclusão
function renderCompletionTrendChart() {
    destroyChart('completionTrendChart');
    
    let filteredTasks = tasksCache;
    const days = currentPeriod === 'all' ? 30 : currentPeriod;
    
    if (currentPeriod !== 'all') {
        filteredTasks = tasksCache.filter(t => isWithinPeriod(t.data, currentPeriod));
    }
    
    // Calcular taxa de conclusão por dia
    const tasksByDate = {};
    const completedByDate = {};
    
    filteredTasks.forEach(t => {
        if (!t.data) return;
        
        const date = parseDate(t.data);
        if (!date) return;
        
        const dateKey = formatDate(date);
        
        tasksByDate[dateKey] = (tasksByDate[dateKey] || 0) + 1;
        
        if (t.finalizada) {
            completedByDate[dateKey] = (completedByDate[dateKey] || 0) + 1;
        }
    });
    
    const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
        const [dA, mA, yA] = a.split('/');
        const [dB, mB, yB] = b.split('/');
        return new Date(`${yA}-${mA}-${dA}`) - new Date(`${yB}-${mB}-${dB}`);
    });
    
    const labels = sortedDates.slice(-days);
    const completionRates = labels.map(date => {
        const total = tasksByDate[date] || 0;
        const completed = completedByDate[date] || 0;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    });
    
    const colors = getChartColors();
    const ctx = document.getElementById('completionTrendChart');
    if (!ctx) return;
    
    charts.completionTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Taxa de Conclusão (%)',
                data: completionRates,
                borderColor: colors.success,
                backgroundColor: colors.success + '30',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: colors.success,
                pointBorderColor: colors.background,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    ticks: { 
                        color: colors.text,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: { color: colors.grid }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { 
                        color: colors.text,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: { color: colors.grid }
                }
            }
        }
    });
}

// --- PERIOD FILTER ---

function changePeriod(days) {
    currentPeriod = days;
    
    // Atualizar botões
    document.querySelectorAll('.period-btn').forEach(btn => {
        if (btn.getAttribute('data-period') == days) {
            btn.classList.remove('bg-gray-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
            btn.classList.add('bg-indigo-600', 'text-white');
        } else {
            btn.classList.remove('bg-indigo-600', 'text-white');
            btn.classList.add('bg-gray-200', 'dark:bg-slate-700', 'text-slate-700', 'dark:text-slate-300');
        }
    });
    
    calculateMetrics();
    renderCharts();
}

// --- THEME CHANGE HANDLER ---

function handleThemeChange() {
    renderCharts();
}

// --- INIT ---

document.addEventListener('DOMContentLoaded', () => {
    // Period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const period = btn.getAttribute('data-period');
            changePeriod(period === 'all' ? 'all' : parseInt(period));
        });
    });
    
    // Logout button
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.removeItem('kard_token');
        window.location.href = '/login.html';
    });
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                handleThemeChange();
            }
        });
    });
    
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });
    
    // Initial fetch
    fetchTasks();
});

// Global functions
window.changePeriod = changePeriod;