// ========================================
// PROJECT GANTT HORIZONTAL WORKFLOW
// Visualizzazione Gantt orizzontale con task collegate
// ========================================

/**
 * Mostra Gantt orizzontale del progetto
 */
async function showProjectGantt(projectId) {
    console.log('📊 Apertura Gantt progetto:', projectId);
    
    try {
        // Carica dettagli progetto e task
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const { project, tasks } = response.data;
        
        console.log('✅ Progetto caricato per Gantt:', project);
        console.log('📝 Task:', tasks);
        
        // Mostra modal Gantt
        showGanttModal(project, tasks);
        
    } catch (error) {
        console.error('❌ Errore caricamento Gantt:', error);
        showNotification('Errore nel caricamento del Gantt', 'error');
    }
}

/**
 * Modal Gantt orizzontale
 */
function showGanttModal(project, tasks) {
    // Calcola date min/max dal progetto
    let startDate = project.start_date ? new Date(project.start_date) : new Date();
    let endDate = project.end_date ? new Date(project.end_date) : new Date();
    
    // Se non ci sono date nel progetto, usa le task
    if (!project.start_date && tasks.length > 0) {
        const taskDates = tasks
            .filter(t => t.due_date)
            .map(t => new Date(t.due_date));
        
        if (taskDates.length > 0) {
            startDate = new Date(Math.min(...taskDates));
            endDate = new Date(Math.max(...taskDates));
        }
    }
    
    // Aggiungi margine
    startDate.setDate(startDate.getDate() - 5);
    endDate.setDate(endDate.getDate() + 5);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg w-full h-[90vh] max-w-7xl overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex-shrink-0">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-3xl font-bold mb-2">
                            <i class="fas fa-chart-gantt mr-2"></i>Gantt Workflow
                        </h2>
                        <p class="text-indigo-100">${project.name} - ${project.client_name}</p>
                        <div class="mt-2 flex gap-2">
                            ${getAreaBadge(project.area)}
                            ${getStatusBadge(project.status)}
                        </div>
                    </div>
                    <button onclick="closeGanttModal()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Gantt Content -->
            <div class="flex-1 overflow-auto p-6 bg-gray-50">
                ${tasks.length === 0 ? `
                    <div class="text-center py-20">
                        <i class="fas fa-tasks text-6xl text-gray-300 mb-4"></i>
                        <p class="text-xl text-gray-500">Nessuna task in questo progetto</p>
                        <p class="text-gray-400 mt-2">Aggiungi task dal dettaglio progetto</p>
                    </div>
                ` : renderGanttChart(tasks, startDate, endDate)}
            </div>
            
            <!-- Footer -->
            <div class="flex-shrink-0 bg-white border-t p-4 flex justify-between items-center">
                <div class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-2"></i>
                    ${tasks.length} task totali • 
                    ${tasks.filter(t => t.status === 'completed').length} completate • 
                    ${tasks.filter(t => t.status === 'in_progress').length} in corso
                </div>
                <button onclick="closeGanttModal()" class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg">
                    <i class="fas fa-times mr-2"></i>Chiudi
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Se ci sono task connesse, disegna le frecce dopo render
    setTimeout(() => drawTaskConnections(tasks), 100);
}

/**
 * Render del Gantt chart orizzontale
 */
function renderGanttChart(tasks, startDate, endDate) {
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    const dayWidth = Math.max(40, Math.min(100, 4000 / totalDays)); // Adattivo
    
    // Ordina task per priorità e data
    const sortedTasks = [...tasks].sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.due_date && b.due_date) {
            return new Date(a.due_date) - new Date(b.due_date);
        }
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
            <div class="space-y-4 relative" id="gantt-task-container">
                ${sortedTasks.map((task, index) => renderGanttTask(task, index, startDate, totalDays, dayWidth)).join('')}
            </div>
            
            <!-- Canvas per frecce connessioni -->
            <canvas id="gantt-connections-canvas" class="absolute top-0 left-0 pointer-events-none" style="z-index: 1;"></canvas>
        </div>
    `;
}

/**
 * Generate timeline header con giorni/settimane
 */
function generateTimelineHeader(startDate, endDate, dayWidth) {
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const isWeekStart = currentDate.getDay() === 1; // Lunedì
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
 * Render singola task nel Gantt
 */
function renderGanttTask(task, index, startDate, totalDays, dayWidth) {
    // Calcola posizione e larghezza
    let taskStart = task.due_date ? new Date(task.due_date) : null;
    let taskDuration = task.estimated_hours ? Math.ceil(task.estimated_hours / 8) : 1; // Converti ore in giorni
    
    if (!taskStart) {
        // Task senza data: posiziona all'inizio
        taskStart = new Date(startDate);
        taskDuration = 1;
    }
    
    const daysFromStart = Math.floor((taskStart - startDate) / (1000 * 60 * 60 * 24));
    const position = Math.max(0, daysFromStart * dayWidth);
    const width = taskDuration * dayWidth;
    
    // Colore barra in base allo stato
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
    
    // Opacità in base alla priorità
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
            
            <!-- Timeline Bar -->
            <div class="flex-1 relative" style="min-width: ${totalDays * dayWidth}px; height: 40px;">
                <div 
                    class="absolute ${barColor} ${barBorder} ${opacity} border-2 rounded-lg shadow-md cursor-pointer transition-all hover:scale-105"
                    style="left: ${position}px; width: ${width}px; height: 32px; top: 4px;"
                    data-task-id="${task.id}"
                    onclick="viewTaskTooltip(event, ${task.id})"
                    title="${task.title}"
                >
                    <div class="px-3 py-1 text-white text-xs font-medium truncate">
                        ${task.title}
                    </div>
                    
                    <!-- Connettore destro (per frecce) -->
                    <div class="task-connector-right absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white border-2 ${barBorder} rounded-full opacity-0 group-hover:opacity-100"></div>
                </div>
            </div>
        </div>
    `;
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
 * Disegna connessioni tra task (frecce)
 * Basato su sequenza temporale
 */
function drawTaskConnections(tasks) {
    const canvas = document.getElementById('gantt-connections-canvas');
    if (!canvas) return;
    
    const container = document.getElementById('gantt-task-container');
    if (!container) return;
    
    // Setup canvas size
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ordina task per data
    const sortedTasks = [...tasks]
        .filter(t => t.due_date)
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    
    // Disegna frecce tra task sequenziali
    for (let i = 0; i < sortedTasks.length - 1; i++) {
        const task1 = sortedTasks[i];
        const task2 = sortedTasks[i + 1];
        
        const el1 = document.querySelector(`[data-task-id="${task1.id}"] > div:last-child > div`);
        const el2 = document.querySelector(`[data-task-id="${task2.id}"] > div:last-child > div`);
        
        if (el1 && el2) {
            const rect1 = el1.getBoundingClientRect();
            const rect2 = el2.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            const x1 = rect1.right - containerRect.left;
            const y1 = rect1.top + rect1.height / 2 - containerRect.top;
            const x2 = rect2.left - containerRect.left;
            const y2 = rect2.top + rect2.height / 2 - containerRect.top;
            
            // Disegna freccia curva
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            
            // Curva bezier
            const cp1x = x1 + (x2 - x1) / 3;
            const cp2x = x1 + 2 * (x2 - x1) / 3;
            ctx.bezierCurveTo(cp1x, y1, cp2x, y2, x2, y2);
            
            ctx.stroke();
            
            // Punta freccia
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - 8, y2 - 4);
            ctx.lineTo(x2 - 8, y2 + 4);
            ctx.closePath();
            ctx.fillStyle = '#94a3b8';
            ctx.fill();
        }
    }
}

/**
 * Mostra tooltip task al click
 */
function viewTaskTooltip(event, taskId) {
    event.stopPropagation();
    
    // Rimuovi tooltip esistenti
    document.querySelectorAll('.task-tooltip').forEach(t => t.remove());
    
    // Cerca task nei dati
    const taskElement = event.currentTarget;
    const taskRow = taskElement.closest('[data-task-id]');
    
    // Crea tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'task-tooltip absolute bg-white border-2 border-gray-300 rounded-lg shadow-2xl p-4 z-50';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY - 50}px`;
    tooltip.innerHTML = `
        <div class="text-sm space-y-2">
            <div class="font-bold text-gray-900">Task ID: ${taskId}</div>
            <div class="flex gap-2">
                <button onclick="editTask(${taskId}); document.querySelectorAll('.task-tooltip').forEach(t => t.remove());" class="px-3 py-1 bg-blue-600 text-white rounded text-xs">
                    <i class="fas fa-edit mr-1"></i>Modifica
                </button>
                <button onclick="document.querySelectorAll('.task-tooltip').forEach(t => t.remove());" class="px-3 py-1 bg-gray-600 text-white rounded text-xs">
                    Chiudi
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(tooltip);
    
    // Chiudi al click fuori
    setTimeout(() => {
        document.addEventListener('click', function closeTooltip(e) {
            if (!tooltip.contains(e.target)) {
                tooltip.remove();
                document.removeEventListener('click', closeTooltip);
            }
        });
    }, 100);
}

/**
 * Chiudi modal Gantt
 */
function closeGanttModal() {
    const modals = document.querySelectorAll('.fixed.inset-0');
    modals.forEach(modal => modal.remove());
}

console.log('✅ Project Gantt Horizontal Workflow module loaded');
