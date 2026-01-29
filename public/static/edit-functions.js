// ========================================
// PROJECT DETAIL & EDITING - Gestionale Agenzia
// ========================================

/**
 * Visualizza dettaglio progetto con possibilità di editing
 */
async function viewProjectDetail(projectId) {
    console.log('📋 Apertura dettaglio progetto:', projectId);
    
    try {
        // Carica dettagli progetto
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const { project, tasks, recurrence } = response.data;
        
        console.log('✅ Progetto caricato:', project);
        console.log('📝 Task del progetto:', tasks);
        
        // Mostra modal dettaglio
        showProjectDetailModal(project, tasks, recurrence);
        
    } catch (error) {
        console.error('❌ Errore caricamento progetto:', error);
        showNotification('Errore nel caricamento del progetto', 'error');
    }
}

/**
 * Modal dettaglio progetto con tabs
 */
function showProjectDetailModal(project, tasks, recurrence) {
    const isAdmin = APP.user.role === 'admin';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold mb-2">${project.name}</h2>
                        <p class="text-blue-100">${project.client_name}</p>
                        <div class="mt-3 flex gap-2">
                            ${getAreaBadge(project.area)}
                            ${getStatusBadge(project.status)}
                        </div>
                    </div>
                    <button onclick="closeProjectDetailModal()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Tabs -->
            <div class="border-b">
                <div class="flex">
                    <button onclick="switchProjectTab('info')" id="tab-info" class="px-6 py-3 font-semibold border-b-2 border-blue-600 text-blue-600">
                        <i class="fas fa-info-circle mr-2"></i>Informazioni
                    </button>
                    <button onclick="switchProjectTab('tasks')" id="tab-tasks" class="px-6 py-3 font-semibold text-gray-600 hover:text-blue-600">
                        <i class="fas fa-tasks mr-2"></i>Task (${tasks.length})
                    </button>
                    ${isAdmin ? `
                    <button onclick="switchProjectTab('edit')" id="tab-edit" class="px-6 py-3 font-semibold text-gray-600 hover:text-blue-600">
                        <i class="fas fa-edit mr-2"></i>Modifica
                    </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 250px);">
                <div id="project-tab-content"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Salva dati nel modal per accesso facile
    modal.projectData = { project, tasks, recurrence };
    
    // Mostra tab info di default
    switchProjectTab('info');
}

/**
 * Chiudi modal dettaglio
 */
function closeProjectDetailModal() {
    const modals = document.querySelectorAll('.fixed.inset-0');
    modals.forEach(modal => modal.remove());
    
    // Ricarica lista progetti per vedere modifiche
    if (APP.currentView === 'projects') {
        loadProjects().then(projects => displayProjects(projects));
    }
}

/**
 * Switch tra tabs
 */
function switchProjectTab(tabName) {
    // Update tab buttons
    ['info', 'tasks', 'edit'].forEach(tab => {
        const btn = document.getElementById(`tab-${tab}`);
        if (btn) {
            if (tab === tabName) {
                btn.className = 'px-6 py-3 font-semibold border-b-2 border-blue-600 text-blue-600';
            } else {
                btn.className = 'px-6 py-3 font-semibold text-gray-600 hover:text-blue-600';
            }
        }
    });
    
    // Get data from modal
    const modal = document.querySelector('.fixed.inset-0');
    const { project, tasks, recurrence } = modal.projectData;
    
    // Render content
    const content = document.getElementById('project-tab-content');
    
    switch(tabName) {
        case 'info':
            content.innerHTML = renderProjectInfoTab(project, tasks, recurrence);
            break;
        case 'tasks':
            content.innerHTML = renderProjectTasksTab(project, tasks);
            break;
        case 'edit':
            content.innerHTML = renderProjectEditTab(project);
            break;
    }
}

/**
 * Tab informazioni progetto
 */
function renderProjectInfoTab(project, tasks, recurrence) {
    const completionRate = project.total_tasks > 0 
        ? Math.round((project.completed_tasks / project.total_tasks) * 100) 
        : 0;
    
    return `
        <div class="space-y-6">
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Task Totali</div>
                    <div class="text-3xl font-bold text-blue-600">${project.total_tasks}</div>
                </div>
                <div class="bg-green-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Task Completate</div>
                    <div class="text-3xl font-bold text-green-600">${project.completed_tasks}</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Completamento</div>
                    <div class="text-3xl font-bold text-purple-600">${completionRate}%</div>
                </div>
            </div>
            
            <!-- Pulsante Gantt -->
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
                <button onclick="closeProjectDetailModal(); showProjectGantt(${project.id});" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-lg">
                    <i class="fas fa-chart-gantt mr-2"></i>Visualizza Gantt Workflow
                </button>
                <p class="text-sm text-gray-600 mt-2 text-center">
                    <i class="fas fa-info-circle mr-1"></i>
                    Timeline orizzontale con task collegate in sequenza
                </p>
            </div>
            
            <!-- Progress Bar -->
            <div>
                <div class="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progresso</span>
                    <span>${completionRate}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all" style="width: ${completionRate}%"></div>
                </div>
            </div>
            
            <!-- Dettagli -->
            <div class="bg-gray-50 p-4 rounded-lg space-y-3">
                <div class="flex items-start">
                    <i class="fas fa-folder text-gray-400 mt-1 mr-3 w-5"></i>
                    <div class="flex-1">
                        <div class="text-sm text-gray-600">Nome Progetto</div>
                        <div class="font-semibold">${project.name}</div>
                    </div>
                </div>
                
                <div class="flex items-start">
                    <i class="fas fa-user text-gray-400 mt-1 mr-3 w-5"></i>
                    <div class="flex-1">
                        <div class="text-sm text-gray-600">Cliente</div>
                        <div class="font-semibold">${project.client_name}</div>
                    </div>
                </div>
                
                <div class="flex items-start">
                    <i class="fas fa-align-left text-gray-400 mt-1 mr-3 w-5"></i>
                    <div class="flex-1">
                        <div class="text-sm text-gray-600">Descrizione</div>
                        <div class="text-gray-800">${project.description || 'Nessuna descrizione'}</div>
                    </div>
                </div>
                
                <div class="flex items-start">
                    <i class="fas fa-tag text-gray-400 mt-1 mr-3 w-5"></i>
                    <div class="flex-1">
                        <div class="text-sm text-gray-600">Area</div>
                        <div>${getAreaBadge(project.area)}</div>
                    </div>
                </div>
                
                <div class="flex items-start">
                    <i class="fas fa-info-circle text-gray-400 mt-1 mr-3 w-5"></i>
                    <div class="flex-1">
                        <div class="text-sm text-gray-600">Stato</div>
                        <div>${getStatusBadge(project.status)}</div>
                    </div>
                </div>
                
                ${project.start_date ? `
                <div class="flex items-start">
                    <i class="fas fa-calendar text-gray-400 mt-1 mr-3 w-5"></i>
                    <div class="flex-1">
                        <div class="text-sm text-gray-600">Date</div>
                        <div class="font-semibold">
                            ${formatDate(project.start_date)}
                            ${project.end_date ? ` → ${formatDate(project.end_date)}` : ''}
                        </div>
                    </div>
                </div>
                ` : ''}
                
                <div class="flex items-start">
                    <i class="fas fa-clock text-gray-400 mt-1 mr-3 w-5"></i>
                    <div class="flex-1">
                        <div class="text-sm text-gray-600">Creato</div>
                        <div class="text-sm">${formatDateTime(project.created_at)}</div>
                        <div class="text-xs text-gray-500">da ${project.created_by_name}</div>
                    </div>
                </div>
            </div>
            
            ${recurrence ? `
            <div class="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div class="flex items-center mb-2">
                    <i class="fas fa-sync text-yellow-600 mr-2"></i>
                    <span class="font-semibold text-yellow-800">Ricorrenza Attiva</span>
                </div>
                <div class="text-sm text-gray-700">
                    Frequenza: <strong>${recurrence.frequency === 'monthly' ? 'Mensile' : 'Trimestrale'}</strong><br>
                    Prossima esecuzione: <strong>${formatDate(recurrence.next_execution_date)}</strong>
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Tab task del progetto con editing inline
 */
function renderProjectTasksTab(project, tasks) {
    const isAdmin = APP.user.role === 'admin';
    
    return `
        <div class="space-y-4">
            ${isAdmin ? `
            <div class="flex justify-end">
                <button onclick="showAddTaskToProject(${project.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Aggiungi Task
                </button>
            </div>
            ` : ''}
            
            ${tasks.length === 0 ? `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-tasks text-4xl mb-3"></i>
                    <p>Nessuna task in questo progetto</p>
                </div>
            ` : `
                <div class="space-y-3">
                    ${tasks.map(task => `
                        <div class="bg-white border rounded-lg p-4 hover:shadow-md transition">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <h4 class="font-semibold text-gray-900">${task.title}</h4>
                                        ${getAreaBadge(task.area)}
                                        ${getStatusBadge(task.status)}
                                        ${getPriorityBadge(task.priority)}
                                    </div>
                                    
                                    ${task.description ? `
                                    <p class="text-sm text-gray-600 mb-2">${task.description}</p>
                                    ` : ''}
                                    
                                    <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                                        ${task.assigned_to_name ? `
                                        <div>
                                            <i class="fas fa-user mr-1"></i>
                                            <span>${task.assigned_to_name}</span>
                                        </div>
                                        ` : ''}
                                        
                                        ${task.due_date ? `
                                        <div>
                                            <i class="fas fa-calendar mr-1"></i>
                                            <span>${formatDate(task.due_date)}</span>
                                        </div>
                                        ` : ''}
                                        
                                        ${task.estimated_hours ? `
                                        <div>
                                            <i class="fas fa-clock mr-1"></i>
                                            <span>${task.estimated_hours}h stimate</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                                
                                <div class="flex gap-2 ml-4">
                                    ${isAdmin ? `
                                    <button onclick="editTask(${task.id})" class="text-blue-600 hover:text-blue-700 p-2" title="Modifica">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteTask(${task.id}, ${project.id})" class="text-red-600 hover:text-red-700 p-2" title="Elimina">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    ` : ''}
                                    
                                    <button onclick="toggleTaskStatusInline(${task.id}, ${project.id})" class="text-green-600 hover:text-green-700 p-2" title="Toggle Completamento">
                                        <i class="fas fa-${task.status === 'completed' ? 'undo' : 'check'}"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

/**
 * Tab modifica progetto
 */
function renderProjectEditTab(project) {
    return `
        <form id="edit-project-form" onsubmit="saveProjectEdit(event, ${project.id})" class="space-y-6">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nome Progetto *</label>
                <input 
                    type="text" 
                    name="name" 
                    value="${project.name}" 
                    required
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                <textarea 
                    name="description" 
                    rows="3"
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >${project.description || ''}</textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                    <select name="area" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="copywriting" ${project.area === 'copywriting' ? 'selected' : ''}>Copywriting</option>
                        <option value="video" ${project.area === 'video' ? 'selected' : ''}>Video</option>
                        <option value="adv" ${project.area === 'adv' ? 'selected' : ''}>ADV</option>
                        <option value="grafica" ${project.area === 'grafica' ? 'selected' : ''}>Grafica</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Stato *</label>
                    <select name="status" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="active" ${project.status === 'active' ? 'selected' : ''}>Attivo</option>
                        <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completato</option>
                        <option value="on_hold" ${project.status === 'on_hold' ? 'selected' : ''}>In Pausa</option>
                        <option value="cancelled" ${project.status === 'cancelled' ? 'selected' : ''}>Cancellato</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Data Inizio</label>
                    <input 
                        type="date" 
                        name="start_date" 
                        value="${project.start_date || ''}"
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Data Fine</label>
                    <input 
                        type="date" 
                        name="end_date" 
                        value="${project.end_date || ''}"
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            
            <div class="flex gap-3 justify-end pt-4 border-t">
                <button type="button" onclick="closeProjectDetailModal()" class="px-6 py-2 border rounded-lg hover:bg-gray-50">
                    Annulla
                </button>
                <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    <i class="fas fa-save mr-2"></i>Salva Modifiche
                </button>
            </div>
        </form>
    `;
}

/**
 * Salva modifiche progetto
 */
async function saveProjectEdit(event, projectId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        area: formData.get('area'),
        status: formData.get('status'),
        start_date: formData.get('start_date') || null,
        end_date: formData.get('end_date') || null
    };
    
    console.log('💾 Salvataggio modifiche progetto:', data);
    
    try {
        await axios.put(`${API_URL}/projects/${projectId}`, data);
        showNotification('Progetto aggiornato con successo!', 'success');
        
        // Ricarica i dati del progetto
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const modal = document.querySelector('.fixed.inset-0');
        modal.projectData = response.data;
        
        // Torna al tab info
        switchProjectTab('info');
        
    } catch (error) {
        console.error('❌ Errore salvataggio:', error);
        showNotification('Errore nel salvataggio del progetto', 'error');
    }
}

/**
 * Mostra modal per aggiungere task al progetto
 */
async function showAddTaskToProject(projectId) {
    console.log('➕ Aggiungi task al progetto:', projectId);
    
    // Carica utenti per assegnazione
    await loadUsers();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 class="text-2xl font-bold mb-6">
                <i class="fas fa-plus-circle mr-2 text-blue-600"></i>Nuova Task
            </h3>
            
            <form id="add-task-form" onsubmit="saveNewTask(event, ${projectId})" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Titolo *</label>
                    <input 
                        type="text" 
                        name="title" 
                        required
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                    <textarea 
                        name="description" 
                        rows="3"
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                        <select name="area" required class="w-full px-4 py-2 border rounded-lg">
                            <option value="copywriting">Copywriting</option>
                            <option value="video">Video</option>
                            <option value="adv">ADV</option>
                            <option value="grafica">Grafica</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Priorità</label>
                        <select name="priority" class="w-full px-4 py-2 border rounded-lg">
                            <option value="low">Bassa</option>
                            <option value="medium" selected>Media</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Assegna a</label>
                        <select name="assigned_to" class="w-full px-4 py-2 border rounded-lg">
                            <option value="">Non assegnata</option>
                            ${APP.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Scadenza</label>
                        <input 
                            type="date" 
                            name="due_date"
                            class="w-full px-4 py-2 border rounded-lg"
                        />
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ore Stimate</label>
                    <input 
                        type="number" 
                        name="estimated_hours"
                        min="0"
                        step="0.5"
                        class="w-full px-4 py-2 border rounded-lg"
                    />
                </div>
                
                <div class="flex gap-3 justify-end pt-4 border-t">
                    <button type="button" onclick="this.closest('.fixed').remove()" class="px-6 py-2 border rounded-lg hover:bg-gray-50">
                        Annulla
                    </button>
                    <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        <i class="fas fa-save mr-2"></i>Crea Task
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Salva nuova task
 */
async function saveNewTask(event, projectId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        project_id: projectId,
        title: formData.get('title'),
        description: formData.get('description') || null,
        area: formData.get('area'),
        priority: formData.get('priority'),
        assigned_to: formData.get('assigned_to') || null,
        due_date: formData.get('due_date') || null,
        estimated_hours: formData.get('estimated_hours') || null
    };
    
    console.log('💾 Creazione nuova task:', data);
    
    try {
        await axios.post(`${API_URL}/tasks`, data);
        showNotification('Task creata con successo!', 'success');
        
        // Chiudi modal add task
        form.closest('.fixed').remove();
        
        // Ricarica progetto
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const modal = document.querySelector('.fixed.inset-0');
        modal.projectData = response.data;
        
        // Aggiorna vista tasks
        switchProjectTab('tasks');
        
    } catch (error) {
        console.error('❌ Errore creazione task:', error);
        showNotification('Errore nella creazione della task', 'error');
    }
}

/**
 * Modifica task
 */
async function editTask(taskId) {
    console.log('✏️ Modifica task:', taskId);
    
    try {
        // Carica dettagli task
        const response = await axios.get(`${API_URL}/tasks/${taskId}`);
        const task = response.data.task;
        
        // Carica utenti
        await loadUsers();
        
        // Mostra modal edit
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full p-6">
                <h3 class="text-2xl font-bold mb-6">
                    <i class="fas fa-edit mr-2 text-blue-600"></i>Modifica Task
                </h3>
                
                <form id="edit-task-form" onsubmit="saveTaskEdit(event, ${taskId})" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Titolo *</label>
                        <input 
                            type="text" 
                            name="title" 
                            value="${task.title}"
                            required
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                        <textarea 
                            name="description" 
                            rows="3"
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        >${task.description || ''}</textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                            <select name="area" required class="w-full px-4 py-2 border rounded-lg">
                                <option value="copywriting" ${task.area === 'copywriting' ? 'selected' : ''}>Copywriting</option>
                                <option value="video" ${task.area === 'video' ? 'selected' : ''}>Video</option>
                                <option value="adv" ${task.area === 'adv' ? 'selected' : ''}>ADV</option>
                                <option value="grafica" ${task.area === 'grafica' ? 'selected' : ''}>Grafica</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Stato *</label>
                            <select name="status" required class="w-full px-4 py-2 border rounded-lg">
                                <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Da Fare</option>
                                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Corso</option>
                                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completata</option>
                                <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Bloccata</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Priorità</label>
                            <select name="priority" class="w-full px-4 py-2 border rounded-lg">
                                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Bassa</option>
                                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Media</option>
                                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Alta</option>
                                <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgente</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Assegna a</label>
                            <select name="assigned_to" class="w-full px-4 py-2 border rounded-lg">
                                <option value="">Non assegnata</option>
                                ${APP.users.map(u => `<option value="${u.id}" ${task.assigned_to == u.id ? 'selected' : ''}>${u.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Scadenza</label>
                            <input 
                                type="date" 
                                name="due_date"
                                value="${task.due_date || ''}"
                                class="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Ore Stimate</label>
                            <input 
                                type="number" 
                                name="estimated_hours"
                                value="${task.estimated_hours || ''}"
                                min="0"
                                step="0.5"
                                class="w-full px-4 py-2 border rounded-lg"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Note</label>
                        <textarea 
                            name="notes" 
                            rows="2"
                            class="w-full px-4 py-2 border rounded-lg"
                        >${task.notes || ''}</textarea>
                    </div>
                    
                    <div class="flex gap-3 justify-end pt-4 border-t">
                        <button type="button" onclick="this.closest('.fixed').remove()" class="px-6 py-2 border rounded-lg hover:bg-gray-50">
                            Annulla
                        </button>
                        <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                            <i class="fas fa-save mr-2"></i>Salva Modifiche
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('❌ Errore caricamento task:', error);
        showNotification('Errore nel caricamento della task', 'error');
    }
}

/**
 * Salva modifiche task
 */
async function saveTaskEdit(event, taskId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        title: formData.get('title'),
        description: formData.get('description') || null,
        area: formData.get('area'),
        status: formData.get('status'),
        priority: formData.get('priority'),
        assigned_to: formData.get('assigned_to') || null,
        due_date: formData.get('due_date') || null,
        estimated_hours: formData.get('estimated_hours') || null,
        notes: formData.get('notes') || null
    };
    
    console.log('💾 Salvataggio modifiche task:', data);
    
    try {
        await axios.put(`${API_URL}/tasks/${taskId}`, data);
        showNotification('Task aggiornata con successo!', 'success');
        
        // Chiudi modal edit
        form.closest('.fixed').remove();
        
        // Ricarica progetto (prendi projectId dal modal principale)
        const mainModal = document.querySelectorAll('.fixed.inset-0')[0];
        const projectId = mainModal.projectData.project.id;
        
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        mainModal.projectData = response.data;
        
        // Aggiorna vista tasks
        switchProjectTab('tasks');
        
    } catch (error) {
        console.error('❌ Errore salvataggio task:', error);
        showNotification('Errore nel salvataggio della task', 'error');
    }
}

/**
 * Elimina task
 */
async function deleteTask(taskId, projectId) {
    if (!confirm('Sei sicuro di voler eliminare questa task?')) {
        return;
    }
    
    console.log('🗑️ Eliminazione task:', taskId);
    
    try {
        await axios.delete(`${API_URL}/tasks/${taskId}`);
        showNotification('Task eliminata con successo!', 'success');
        
        // Ricarica progetto
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const modal = document.querySelector('.fixed.inset-0');
        modal.projectData = response.data;
        
        // Aggiorna vista tasks
        switchProjectTab('tasks');
        
    } catch (error) {
        console.error('❌ Errore eliminazione task:', error);
        showNotification('Errore nell\'eliminazione della task', 'error');
    }
}

/**
 * Toggle stato task inline
 */
async function toggleTaskStatusInline(taskId, projectId) {
    console.log('🔄 Toggle stato task:', taskId);
    
    try {
        await axios.post(`${API_URL}/tasks/${taskId}/toggle`);
        showNotification('Stato task aggiornato!', 'success');
        
        // Ricarica progetto
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const modal = document.querySelector('.fixed.inset-0');
        modal.projectData = response.data;
        
        // Aggiorna vista tasks
        switchProjectTab('tasks');
        
    } catch (error) {
        console.error('❌ Errore toggle task:', error);
        showNotification('Errore nell\'aggiornamento dello stato', 'error');
    }
}

console.log('✅ Project detail & editing module loaded');
