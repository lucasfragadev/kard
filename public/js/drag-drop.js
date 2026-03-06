/**
 * KARD - Drag and Drop Module
 * Gerencia funcionalidade de arrastar e soltar tarefas para reordenação
 */

class DragDropManager {
    constructor() {
        this.draggedElement = null;
        this.draggedTaskId = null;
        this.placeholder = null;
        this.isDragging = false;
    }

    /**
     * Inicializa o drag and drop para todos os cards de tarefas
     */
    init() {
        this.setupEventListeners();
        this.createPlaceholder();
    }

    /**
     * Cria elemento placeholder para visualização durante o drag
     */
    createPlaceholder() {
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'drag-placeholder bg-indigo-100 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-400 rounded-lg mb-3 transition-all duration-200';
        this.placeholder.style.height = '100px';
        this.placeholder.innerHTML = '<div class="flex items-center justify-center h-full text-indigo-600 dark:text-indigo-400 text-sm">Solte aqui</div>';
    }

    /**
     * Configura event listeners globais
     */
    setupEventListeners() {
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
    }

    /**
     * Torna os cards arrastáveis
     * @param {HTMLElement} taskCard - Card da tarefa
     * @param {number} taskId - ID da tarefa
     */
    makeTaskDraggable(taskCard, taskId) {
        if (!taskCard) return;

        taskCard.setAttribute('draggable', 'true');
        taskCard.style.cursor = 'grab';

        taskCard.addEventListener('dragstart', (e) => this.handleDragStart(e, taskCard, taskId));
        taskCard.addEventListener('dragend', (e) => this.handleDragEnd(e, taskCard));
        taskCard.addEventListener('dragenter', (e) => this.handleDragEnter(e, taskCard));
        taskCard.addEventListener('dragleave', (e) => this.handleDragLeave(e, taskCard));
    }

    /**
     * Handler para início do drag
     */
    handleDragStart(e, element, taskId) {
        this.isDragging = true;
        this.draggedElement = element;
        this.draggedTaskId = taskId;

        element.style.opacity = '0.5';
        element.style.cursor = 'grabbing';
        element.classList.add('dragging');

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', element.innerHTML);

        // Adiciona feedback visual
        setTimeout(() => {
            element.classList.add('scale-95');
        }, 0);
    }

    /**
     * Handler para fim do drag
     */
    handleDragEnd(e, element) {
        this.isDragging = false;
        element.style.opacity = '1';
        element.style.cursor = 'grab';
        element.classList.remove('dragging', 'scale-95');

        // Remove placeholder se existir
        if (this.placeholder && this.placeholder.parentNode) {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }

        // Remove todos os indicadores visuais
        document.querySelectorAll('.task-card').forEach(card => {
            card.classList.remove('drag-over', 'border-indigo-500');
        });
    }

    /**
     * Handler para drag over
     */
    handleDragOver(e) {
        if (!this.isDragging) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const targetCard = e.target.closest('.task-card');
        if (targetCard && targetCard !== this.draggedElement) {
            const rect = targetCard.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const insertBefore = e.clientY < midpoint;

            if (this.placeholder.parentNode) {
                this.placeholder.parentNode.removeChild(this.placeholder);
            }

            if (insertBefore) {
                targetCard.parentNode.insertBefore(this.placeholder, targetCard);
            } else {
                targetCard.parentNode.insertBefore(this.placeholder, targetCard.nextSibling);
            }
        }
    }

    /**
     * Handler para drag enter
     */
    handleDragEnter(e, element) {
        if (!this.isDragging || element === this.draggedElement) return;
        element.classList.add('drag-over', 'border-indigo-500');
    }

    /**
     * Handler para drag leave
     */
    handleDragLeave(e, element) {
        if (!this.isDragging) return;
        element.classList.remove('drag-over', 'border-indigo-500');
    }

    /**
     * Handler para drop
     */
    async handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!this.isDragging || !this.draggedElement) return;

        const targetCard = e.target.closest('.task-card');
        if (!targetCard || targetCard === this.draggedElement) {
            this.handleDragEnd(e, this.draggedElement);
            return;
        }

        // Determina a nova posição
        const allCards = Array.from(document.querySelectorAll('.task-card:not(.dragging)'));
        const targetIndex = allCards.indexOf(targetCard);
        const draggedIndex = allCards.indexOf(this.draggedElement);

        if (targetIndex === -1 || draggedIndex === -1) {
            this.handleDragEnd(e, this.draggedElement);
            return;
        }

        // Move visualmente
        const rect = targetCard.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const insertBefore = e.clientY < midpoint;

        if (insertBefore) {
            targetCard.parentNode.insertBefore(this.draggedElement, targetCard);
        } else {
            targetCard.parentNode.insertBefore(this.draggedElement, targetCard.nextSibling);
        }

        // Salva a nova ordem no backend
        await this.saveNewOrder();

        this.handleDragEnd(e, this.draggedElement);
    }

    /**
     * Salva a nova ordem das tarefas no backend
     */
    async saveNewOrder() {
        const token = localStorage.getItem('kard_token');
        if (!token) return;

        const taskCards = Array.from(document.querySelectorAll('.task-card'));
        const newOrder = taskCards.map((card, index) => {
            const cardId = card.id.replace('card-', '');
            return { id: parseInt(cardId), ordem: index };
        });

        try {
            await fetch('/api/atividades/reorder', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ order: newOrder })
            });
        } catch (err) {
            console.error('Erro ao salvar ordem:', err);
        }
    }

    /**
     * Habilita drag and drop em todos os cards visíveis
     */
    enableAllCards() {
        document.querySelectorAll('.task-card').forEach(card => {
            const taskId = card.id.replace('card-', '');
            if (taskId && !isNaN(taskId)) {
                this.makeTaskDraggable(card, parseInt(taskId));
            }
        });
    }

    /**
     * Desabilita drag and drop
     */
    disableAllCards() {
        document.querySelectorAll('.task-card').forEach(card => {
            card.setAttribute('draggable', 'false');
            card.style.cursor = 'default';
        });
    }

    /**
     * Destroy - remove todos os event listeners
     */
    destroy() {
        this.disableAllCards();
        this.draggedElement = null;
        this.draggedTaskId = null;
        this.isDragging = false;
    }
}

// Instância global
const dragDropManager = new DragDropManager();

// Export para uso global
window.dragDropManager = dragDropManager;