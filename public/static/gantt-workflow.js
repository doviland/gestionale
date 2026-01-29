// ========================================
// GANTT WORKFLOW INTERATTIVO CON DRAG & DROP
// Versione 2.0 con spostamento manuale task
// ========================================

/**
 * State globale per drag & drop
 */
const GANTT_STATE = {
    draggedTask: null,
    dragStartX: 0,
    dragStartDate: null,
    timelineStart: null,
    dayWidth: 0,
    isDragging: false
};

/**
 * Mostra Gantt orizzontale interattivo
 */
async function showProjectGantt(projectId) {
    console.log('📊 Apertura Gantt interattivo progetto:', projectId);
    
    try {
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const { project, tasks } = response.data;
        
        console.log('✅ Progetto caricato per Gantt:', project);
        console.log('📝 Task:', tasks.length);
        
        showGanttModalInteractive(project, tasks);
        
    } catch (error) {
        console.error('❌ Errore caricamento Gantt:', error);
        showNotification('Errore nel caricamento del Gantt', 'error');
    }
}

/**
 * Modal Gantt interattivo
 */
function showGanttModalInteractive(project, tasks) {
    // Calcola date range
    let startDate = project.start_date ? new Date(project.start_date) : new Date();
    let endDate = project.end_date ? new Date(project.end_date) : new Date();
    
    if (!project.start_date && tasks.length > 0) {
        const taskDates = tasks.filter(t => t.due_date).map(t => new Date(t.due_date));
        if (taskDates.length > 0) {
            startDate = new Date(Math.min(...taskDates));
            endDate = new Date(Math.max(...taskDates));
        }
    }
    
    startDate.setDate(startDate.getDate() - 5);
    endDate.setDate(endDate.getDate() + 15);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.id = 'gantt-modal';
    modal.innerHTML = `
        <div class="bg-white rounded-lg w-full h-[90vh] max-w-7xl overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-3xl font-bold mb-2">
                            <i class="fas fa-chart-gantt mr-2"></i>Gantt Workflow Interattivo
                        </h2>
                        <p class="text-indigo-100">${project.name} - ${project.client_name}</p>
                        <div class="mt-2 flex gap-2 items-center">
                            ${getAreaBadge(project.area)}
                            ${getStatusBadge(project.status)}
                            <span class="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs">
                                <i class="fas fa-mouse-pointer mr-1"></i>Trascina le barre per spostare le task
                            </span>
                        </div>
                    </div>
                    <button onclick="closeGanttModal()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Gantt Content -->
            <div class="flex-1 overflow-auto p-6 bg-gray-50" id="gantt-scroll-container">
                ${tasks.length === 0 ? `
                    <div class="text-center py-20">
                        <i class="fas fa-tasks text-6xl text-gray-300 mb-4"></i>
                        <p class="text-xl text-gray-500">Nessuna task in questo progetto</p>
                    </div>
                ` : renderGanttChartInteractive(tasks, startDate, endDate, project.id)}
            </div>
            
            <!-- Footer -->
            <div class="flex-shrink-0 bg-white border-t p-4 flex justify-between items-center">
                <div class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-2"></i>
                    ${tasks.length} task • 
                    ${tasks.filter(t => t.status === 'completed').length} completate
                    <span class="ml-4 text-indigo-600">
                        <i class="fas fa-hand-pointer mr-1"></i>
                        Trascina le barre per modificare le date
                    </span>
                </div>
                <button onclick="closeGanttModal()" class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
                    <i class="fas fa-times mr-2"></i>Chiudi
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Salva dati per accesso globale
    window.GANTT_PROJECT = project;
    window.GANTT_TASKS = tasks;
    window.GANTT_START_DATE = startDate;
    window.GANTT_END_DATE = endDate;
    
    // Setup drag & drop dopo render
    setTimeout(() => setupDragAndDrop(startDate, tasks), 100);
}

/**
 * Render Gantt interattivo
 */
function renderGanttChartInteractive(tasks, startDate, endDate, projectId) {
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const dayWidth = Math.max(40, Math.min(100, 4000 / totalDays));
    
    // Salva per drag & drop
    GANTT_STATE.dayWidth = dayWidth;
    GANTT_STATE.timelineStart = startDate;
    
    const sortedTasks = [...tasks].sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
        return 0;
    });
    
    return `
        <div class="bg-white rounded-lg shadow-lg p-6">
            <!-- Timeline Header -->
            <div class="mb-6 overflow-x-auto">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-64 flex-shrink-0 font-bold text-gray-700">Task</div>
                    <div class="flex-1 flex border-b-2 border-gray-300" style="min-width: ${totalDays * dayWidth}px;">
                        ${generateTimelineHeader(startDate, endDate, dayWidth)}
                    </div>
                </div>
            </div>
            
            <!-- Task Rows -->
            <div class="space-y-4 relative" id="gantt-task-container" data-project-id="${projectId}">
                ${sortedTasks.map((task, index) => renderGanttTaskDraggable(task, index, startDate, totalDays, dayWidth)).join('')}
            </div>
        </div>
    `;
}

/**
 * Timeline header
 */
function generateTimelineHeader(startDate, endDate, dayWidth) {
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const isWeekStart = currentDate.getDay() === 1;
        const dayLabel = currentDate.getDate();
        const monthLabel = currentDate.toLocaleDateString('it-IT', { month: 'short' });
        
        days.push(`
            <div style="width: ${dayWidth}px;" class="text-center border-r border-gray-200 py-2 ${isWeekStart ? 'bg-blue-50' : 'bg-white'}">
                <div class="text-xs font-semibold ${isWeekStart ? 'text-blue-600' : 'text-gray-600'}">${dayLabel}</div>
                ${dayLabel === 1 ? `<div class="text-xs text-gray-500">${monthLabel}</div>` : ''}
            </div>
        `);
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days.join('');
}

/**
 * Render task draggable
 */
function renderGanttTaskDraggable(task, index, startDate, totalDays, dayWidth) {
    let taskStart = task.due_date ? new Date(task.due_date) : null;
    let taskDuration = task.estimated_hours ? Math.ceil(task.estimated_hours / 8) : 1;
    
    if (!taskStart) {
        taskStart = new Date(startDate);
        taskDuration = 1;
    }
    
    const daysFromStart = Math.floor((taskStart - startDate) / (1000 * 60 * 60 * 24));
    const position = Math.max(0, daysFromStart * dayWidth);
    const width = taskDuration * dayWidth;
    
    let barColor = 'bg-blue-500';
    let barBorder = 'border-blue-600';
    if (task.status === 'completed') {
        barColor = 'bg-green-500';
        barBorder = 'border-green-600';
    } else if (task.status === 'in_progress') {
        barColor = 'bg-yellow-500';
        barBorder = 'border-yellow-600';
    } else if (task.status === 'blocked') {
        barColor = 'bg-red-500';
        barBorder = 'border-red-600';
    }
    
    let opacity = 'opacity-90';
    if (task.priority === 'urgent') opacity = 'opacity-100';
    if (task.priority === 'low') opacity = 'opacity-70';
    
    return `
        <div class="flex items-center gap-4 hover:bg-gray-50 p-2 rounded relative" data-task-id="${task.id}" data-task-index="${index}">
            <!-- Task Info -->
            <div class="w-64 flex-shrink-0">
                <div class="flex items-center gap-2">
                    ${getPriorityIcon(task.priority)}
                    <div class="flex-1">
                        <div class="font-semibold text-sm text-gray-900 truncate" title="${task.title}">
                            ${task.title}
                        </div>
                        <div class="text-xs text-gray-500">
                            ${task.assigned_to_name || 'Non assegnata'}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Timeline Bar (DRAGGABLE) -->
            <div class="flex-1 relative" style="min-width: ${totalDays * dayWidth}px; height: 40px;">
                <div 
                    class="gantt-bar absolute ${barColor} ${barBorder} ${opacity} border-2 rounded-lg shadow-md cursor-move transition-shadow hover:shadow-xl"
                    style="left: ${position}px; width: ${width}px; height: 32px; top: 4px;"
                    data-task-id="${task.id}"
                    data-initial-left="${position}"
                    data-task-duration="${taskDuration}"
                    draggable="true"
                    title="Trascina per spostare • ${task.title}"
                >
                    <div class="px-3 py-1 text-white text-xs font-medium truncate pointer-events-none">
                        <i class="fas fa-grip-vertical mr-2"></i>${task.title}
                    </div>
                    
                    <!-- Resize handle destro -->
                    <div class="resize-handle absolute right-0 top-0 h-full w-2 cursor-ew-resize bg-white bg-opacity-50 hover:bg-opacity-100" data-task-id="${task.id}"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Setup Drag & Drop
 */
function setupDragAndDrop(startDate, tasks) {
    const container = document.getElementById('gantt-task-container');
    if (!container) return;
    
    const bars = container.querySelectorAll('.gantt-bar');
    
    bars.forEach(bar => {
        // Drag start
        bar.addEventListener('dragstart', (e) => {
            const taskId = parseInt(bar.getAttribute('data-task-id'));
            GANTT_STATE.draggedTask = tasks.find(t => t.id === taskId);
            GANTT_STATE.dragStartX = e.clientX;
            GANTT_STATE.isDragging = true;
            
            bar.style.opacity = '0.5';
            console.log('🖱️ Drag started:', GANTT_STATE.draggedTask.title);
        });
        
        // Drag end
        bar.addEventListener('dragend', async (e) => {
            bar.style.opacity = '1';
            
            if (!GANTT_STATE.isDragging || !GANTT_STATE.draggedTask) return;
            
            const deltaX = e.clientX - GANTT_STATE.dragStartX;
            const daysMoved = Math.round(deltaX / GANTT_STATE.dayWidth);
            
            if (daysMoved === 0) {
                console.log('❌ Nessun movimento');
                GANTT_STATE.isDragging = false;
                return;
            }
            
            console.log('📅 Giorni spostati:', daysMoved);
            
            // Calcola nuova data
            const oldDate = new Date(GANTT_STATE.draggedTask.due_date || startDate);
            const newDate = new Date(oldDate);
            newDate.setDate(newDate.getDate() + daysMoved);
            
            console.log('📆 Nuova data:', newDate.toISOString().split('T')[0]);
            
            // Aggiorna task
            await updateTaskDate(GANTT_STATE.draggedTask.id, newDate.toISOString().split('T')[0]);
            
            GANTT_STATE.isDragging = false;
            GANTT_STATE.draggedTask = null;
        });
        
        // Drag over (per permettere drop)
        bar.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    });
    
    // Setup resize handles
    setupResizeHandles(startDate, tasks);
}

/**
 * Setup resize handles per modificare durata
 */
function setupResizeHandles(startDate, tasks) {
    const handles = document.querySelectorAll('.resize-handle');
    
    handles.forEach(handle => {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        let bar = null;
        
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            isResizing = true;
            startX = e.clientX;
            bar = handle.closest('.gantt-bar');
            startWidth = bar.offsetWidth;
            
            console.log('↔️ Resize started');
            
            const mousemove = (e) => {
                if (!isResizing) return;
                
                const deltaX = e.clientX - startX;
                const newWidth = Math.max(GANTT_STATE.dayWidth, startWidth + deltaX);
                bar.style.width = `${newWidth}px`;
            };
            
            const mouseup = async (e) => {
                if (!isResizing) return;
                
                isResizing = false;
                document.removeEventListener('mousemove', mousemove);
                document.removeEventListener('mouseup', mouseup);
                
                const deltaX = e.clientX - startX;
                const newWidth = Math.max(GANTT_STATE.dayWidth, startWidth + deltaX);
                const newDuration = Math.max(1, Math.round(newWidth / GANTT_STATE.dayWidth));
                
                console.log('⏱️ Nuova durata (giorni):', newDuration);
                
                const taskId = parseInt(bar.getAttribute('data-task-id'));
                const task = tasks.find(t => t.id === taskId);
                const newEstimatedHours = newDuration * 8;
                
                await updateTaskDuration(taskId, newEstimatedHours);
            };
            
            document.addEventListener('mousemove', mousemove);
            document.addEventListener('mouseup', mouseup);
        });
    });
}

/**
 * Aggiorna data task sul backend
 */
async function updateTaskDate(taskId, newDate) {
    console.log('💾 Aggiornamento data task:', taskId, '→', newDate);
    
    try {
        await axios.put(`${API_URL}/tasks/${taskId}`, {
            due_date: newDate
        });
        
        showNotification('Data task aggiornata!', 'success');
        
        // Ricarica Gantt
        const projectId = document.getElementById('gantt-task-container').getAttribute('data-project-id');
        closeGanttModal();
        setTimeout(() => showProjectGantt(projectId), 300);
        
    } catch (error) {
        console.error('❌ Errore aggiornamento data:', error);
        showNotification('Errore nell\'aggiornamento della data', 'error');
    }
}

/**
 * Aggiorna durata task sul backend
 */
async function updateTaskDuration(taskId, newEstimatedHours) {
    console.log('💾 Aggiornamento durata task:', taskId, '→', newEstimatedHours, 'ore');
    
    try {
        await axios.put(`${API_URL}/tasks/${taskId}`, {
            estimated_hours: newEstimatedHours
        });
        
        showNotification(`Durata aggiornata: ${newEstimatedHours}h (${Math.ceil(newEstimatedHours / 8)} giorni)`, 'success');
        
        // Ricarica Gantt
        const projectId = document.getElementById('gantt-task-container').getAttribute('data-project-id');
        closeGanttModal();
        setTimeout(() => showProjectGantt(projectId), 300);
        
    } catch (error) {
        console.error('❌ Errore aggiornamento durata:', error);
        showNotification('Errore nell\'aggiornamento della durata', 'error');
    }
}

/**
 * Icona priorità
 */
function getPriorityIcon(priority) {
    const icons = {
        urgent: '<i class="fas fa-exclamation-circle text-red-600" title="Urgente"></i>',
        high: '<i class="fas fa-arrow-up text-orange-600" title="Alta"></i>',
        medium: '<i class="fas fa-minus text-blue-600" title="Media"></i>',
        low: '<i class="fas fa-arrow-down text-gray-400" title="Bassa"></i>'
    };
    return icons[priority] || icons.medium;
}

/**
 * Chiudi modal Gantt
 */
function closeGanttModal() {
    const modal = document.getElementById('gantt-modal');
    if (modal) {
        modal.remove();
    }
    
    // Cleanup state
    GANTT_STATE.draggedTask = null;
    GANTT_STATE.isDragging = false;
    window.GANTT_PROJECT = null;
    window.GANTT_TASKS = null;
}

console.log('✅ Gantt Workflow Interattivo v2.0 loaded - Drag & Drop enabled');
