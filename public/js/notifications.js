/**
 * KARD - Notifications Manager
 * Gerencia notificações do browser para tarefas próximas do prazo
 */

class NotificationManager {
    constructor() {
        this.supported = 'Notification' in window;
        this.permission = this.supported ? Notification.permission : 'denied';
        this.checkInterval = 30 * 60 * 1000; // 30 minutos
        this.notifiedTasks = new Set();
        this.intervalId = null;
    }

    /**
     * Verifica se as notificações são suportadas
     */
    isSupported() {
        return this.supported;
    }

    /**
     * Solicita permissão para notificações
     */
    async requestPermission() {
        if (!this.supported) {
            console.warn('Notificações não são suportadas neste navegador');
            return false;
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission === 'denied') {
            console.warn('Permissão para notificações foi negada');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            
            if (permission === 'granted') {
                this.showWelcomeNotification();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erro ao solicitar permissão para notificações:', error);
            return false;
        }
    }

    /**
     * Mostra notificação de boas-vindas
     */
    showWelcomeNotification() {
        this.sendNotification(
            'Notificações Ativadas! 🔔',
            'Você será notificado sobre tarefas próximas do prazo.',
            '/icons/icon-96x96.png'
        );
    }

    /**
     * Envia uma notificação
     */
    sendNotification(title, body, icon = '/icons/icon-96x96.png', data = {}) {
        if (!this.supported || this.permission !== 'granted') {
            return null;
        }

        try {
            const notification = new Notification(title, {
                body,
                icon,
                badge: '/icons/icon-72x72.png',
                tag: data.taskId ? `task-${data.taskId}` : 'kard-notification',
                requireInteraction: false,
                silent: false,
                data,
                vibrate: [200, 100, 200]
            });

            notification.onclick = (event) => {
                event.preventDefault();
                window.focus();
                
                if (data.taskId) {
                    const taskCard = document.getElementById(`card-${data.taskId}`);
                    if (taskCard) {
                        taskCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        taskCard.classList.add('ring-4', 'ring-indigo-500');
                        setTimeout(() => {
                            taskCard.classList.remove('ring-4', 'ring-indigo-500');
                        }, 2000);
                    }
                }
                
                notification.close();
            };

            notification.onerror = (error) => {
                console.error('Erro ao exibir notificação:', error);
            };

            setTimeout(() => notification.close(), 10000);

            return notification;
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
            return null;
        }
    }

    /**
     * Verifica se uma data está próxima (3 dias)
     */
    isDateSoon(dateStr) {
        if (!dateStr) return false;
        
        const [d, m, y] = dateStr.split('/');
        const taskDate = new Date(`${y}-${m}-${d}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const threeDays = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
        
        return taskDate >= today && taskDate <= threeDays;
    }

    /**
     * Verifica se uma data é hoje
     */
    isToday(dateStr) {
        if (!dateStr) return false;
        
        const [d, m, y] = dateStr.split('/');
        const taskDate = new Date(`${y}-${m}-${d}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);
        
        return taskDate.getTime() === today.getTime();
    }

    /**
     * Verifica se uma data é amanhã
     */
    isTomorrow(dateStr) {
        if (!dateStr) return false;
        
        const [d, m, y] = dateStr.split('/');
        const taskDate = new Date(`${y}-${m}-${d}`);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);
        
        return taskDate.getTime() === tomorrow.getTime();
    }

    /**
     * Calcula dias restantes até a data
     */
    getDaysRemaining(dateStr) {
        if (!dateStr) return null;
        
        const [d, m, y] = dateStr.split('/');
        const taskDate = new Date(`${y}-${m}-${d}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);
        
        const diffTime = taskDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    /**
     * Verifica tarefas e envia notificações
     */
    checkTasksAndNotify(tasks) {
        if (!this.supported || this.permission !== 'granted' || !tasks) {
            return;
        }

        const activeTasks = tasks.filter(t => !t.finalizada);
        const tasksToNotify = [];

        activeTasks.forEach(task => {
            if (!task.data) return;

            const taskKey = `${task.id}-${task.data}`;
            
            if (this.notifiedTasks.has(taskKey)) {
                return;
            }

            if (this.isToday(task.data)) {
                tasksToNotify.push({
                    task,
                    priority: 1,
                    message: 'Tarefa para HOJE!'
                });
            } else if (this.isTomorrow(task.data)) {
                tasksToNotify.push({
                    task,
                    priority: 2,
                    message: 'Tarefa para amanhã'
                });
            } else if (this.isDateSoon(task.data)) {
                const days = this.getDaysRemaining(task.data);
                tasksToNotify.push({
                    task,
                    priority: 3,
                    message: `Tarefa em ${days} dias`
                });
            }
        });

        tasksToNotify.sort((a, b) => a.priority - b.priority);

        tasksToNotify.slice(0, 3).forEach(({ task, message }) => {
            const title = task.importante 
                ? `⭐ ${task.titulo || 'Tarefa Importante'}` 
                : task.titulo || 'Tarefa';
            
            const body = `${message}\n${task.categoria || 'Geral'} - ${task.data}`;
            
            this.sendNotification(title, body, '/icons/icon-96x96.png', { taskId: task.id });
            
            this.notifiedTasks.add(`${task.id}-${task.data}`);
        });

        this.cleanupNotifiedTasks(tasks);
    }

    /**
     * Limpa tarefas notificadas antigas
     */
    cleanupNotifiedTasks(tasks) {
        const validKeys = new Set(tasks.map(t => `${t.id}-${t.data}`));
        
        this.notifiedTasks.forEach(key => {
            if (!validKeys.has(key)) {
                this.notifiedTasks.delete(key);
            }
        });
    }

    /**
     * Inicia verificação periódica
     */
    startPeriodicCheck(getTasksFunction) {
        if (this.intervalId) {
            this.stopPeriodicCheck();
        }

        const check = () => {
            const tasks = getTasksFunction();
            if (tasks && tasks.length > 0) {
                this.checkTasksAndNotify(tasks);
            }
        };

        check();

        this.intervalId = setInterval(check, this.checkInterval);
        
        console.log('✅ Verificação periódica de notificações iniciada');
    }

    /**
     * Para verificação periódica
     */
    stopPeriodicCheck() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('⏹️ Verificação periódica de notificações parada');
        }
    }

    /**
     * Envia notificação de teste
     */
    sendTestNotification() {
        this.sendNotification(
            'Teste de Notificação 🔔',
            'As notificações estão funcionando corretamente!',
            '/icons/icon-96x96.png'
        );
    }

    /**
     * Reseta tarefas notificadas
     */
    resetNotifiedTasks() {
        this.notifiedTasks.clear();
        console.log('🔄 Cache de notificações resetado');
    }

    /**
     * Obtém estatísticas
     */
    getStats() {
        return {
            supported: this.supported,
            permission: this.permission,
            notifiedTasksCount: this.notifiedTasks.size,
            isRunning: !!this.intervalId,
            checkInterval: this.checkInterval
        };
    }
}

const notificationManager = new NotificationManager();

window.notificationManager = notificationManager;

console.log('🔔 Notification Manager carregado');