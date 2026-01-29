// ========================================
// FUNZIONI DI MODIFICA E GESTIONE
// ========================================

/**
 * Visualizza dettaglio progetto con possibilità di modifica
 */
async function viewProjectDetail(projectId) {
    try {
        showNotification('Caricamento progetto...', 'info');
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const { project, tasks } = response.data;
        
        // Mostra modal con dettagli
        showProjectDetailModal(project, tasks);
    } catch (error) {
        console.error('Error loading project:', error);
        showNotification('Errore nel caricamento del progetto', 'error');
    }
}

/**
 * Modal dettaglio progetto
 */
function showProjectDetailModal(project, tasks) {
    const isAdmin = APP.user && APP.user.role === 'admin';
    
    const tasksHtml = tasks.map(task => `
        <div class="border-b border-gray-200 py-3 hover:bg-gray-50">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-medium">${task.title}</span>
                        <span class="px-2 py-1 text-xs rounded ${getStatusBadgeClass(task.status)}">
                            ${getStatusLabel(task.status)}
                        </span>
                        <span class="px-2 py-1 text-xs rounded ${getPriorityBadgeClass(task.priority)}">
                            ${getPriorityLabel(task.priority)}
                        </span>
                    </div>
                    ${task.description ? `<p class="text-sm text-gray-600 mt-1">${task.description}</p>` : ''}
                    <div class="text-xs text-gray-500 mt-1">
                        ${task.assigned_to_name ? `👤 ${task.assigned_to_name}` : '⚠️ Non assegnata'}
                        ${task.due_date ? ` | 📅 ${formatDate(task.due_date)}` : ''}
                    </div>
                </div>
                ${isAdmin ? `
                <div class="flex gap-2">
                    <button onclick="editTask(${task.id})" 
                            class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-edit"></i> Modifica
                    </button>
                    <button onclick="deleteTask(${task.id}, ${project.id})" 
                            class="text-red-600 hover:text-red-800 text-sm">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    const modalHtml = `
        <div id="modal-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeModal(event)">
            <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">${project.name}</h2>
                        <p class="text-gray-600 mt-1">Cliente: ${project.client_name}</p>
                        <span class="px-3 py-1 text-sm rounded area-badge-${project.area} inline-block mt-2">
                            ${getAreaLabel(project.area)}
                        </span>
                    </div>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                ${project.description ? `
                <div class="mb-6">
                    <h3 class="font-semibold mb-2">Descrizione:</h3>
                    <p class="text-gray-700">${project.description}</p>
                </div>
                ` : ''}
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <span class="text-sm text-gray-600">Stato:</span>
                        <span class="ml-2 px-2 py-1 text-sm rounded ${getStatusBadgeClass(project.status)}">
                            ${getStatusLabel(project.status)}
                        </span>
                    </div>
                    <div>
                        <span class="text-sm text-gray-600">Progresso:</span>
                        <span class="ml-2 font-semibold">${project.completed_tasks}/${project.total_tasks} task completate</span>
                    </div>
                    <div>
                        <span class="text-sm text-gray-600">Data Inizio:</span>
                        <span class="ml-2">${formatDate(project.start_date)}</span>
                    </div>
                    <div>
                        <span class="text-sm text-gray-600">Data Fine:</span>
                        <span class="ml-2">${formatDate(project.end_date)}</span>
                    </div>
                </div>
                
                ${isAdmin ? `
                <div class="flex gap-2 mb-6">
                    <button onclick="editProject(${project.id})" 
                            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        <i class="fas fa-edit"></i> Modifica Progetto
                    </button>
                    <button onclick="showCreateTaskModal(${project.id})" 
                            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        <i class="fas fa-plus"></i> Aggiungi Task
                    </button>
                    <button onclick="deleteProject(${project.id})" 
                            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                        <i class="fas fa-trash"></i> Elimina Progetto
                    </button>
                </div>
                ` : ''}
                
                <div class="mt-6">
                    <h3 class="text-xl font-bold mb-4">Task del Progetto (${tasks.length})</h3>
                    ${tasks.length > 0 ? tasksHtml : '<p class="text-gray-500">Nessuna task in questo progetto</p>'}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Modifica progetto
 */
async function editProject(projectId) {
    try {
        const response = await axios.get(`${API_URL}/projects/${projectId}`);
        const { project } = response.data;
        
        // Carica lista clienti
        const clientsResponse = await axios.get(`${API_URL}/clients`);
        const clients = clientsResponse.data.clients;
        
        const clientOptions = clients.map(c => 
            `<option value="${c.id}" ${c.id === project.client_id ? 'selected' : ''}>${c.name}</option>`
        ).join('');
        
        const modalHtml = `
            <div id="edit-modal-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeEditModal(event)">
                <div class="bg-white rounded-lg p-6 max-w-2xl w-full" onclick="event.stopPropagation()">
                    <h2 class="text-2xl font-bold mb-6">Modifica Progetto</h2>
                    <form id="edit-project-form" onsubmit="submitEditProject(event, ${projectId})">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Cliente *</label>
                                <select name="client_id" required class="w-full p-2 border rounded">
                                    ${clientOptions}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Nome Progetto *</label>
                                <input type="text" name="name" value="${project.name}" required class="w-full p-2 border rounded">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Descrizione</label>
                                <textarea name="description" rows="3" class="w-full p-2 border rounded">${project.description || ''}</textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Area *</label>
                                    <select name="area" required class="w-full p-2 border rounded">
                                        <option value="copywriting" ${project.area === 'copywriting' ? 'selected' : ''}>📝 Copywriting</option>
                                        <option value="video" ${project.area === 'video' ? 'selected' : ''}>🎬 Video</option>
                                        <option value="adv" ${project.area === 'adv' ? 'selected' : ''}>📢 ADV</option>
                                        <option value="grafica" ${project.area === 'grafica' ? 'selected' : ''}>🎨 Grafica</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Stato *</label>
                                    <select name="status" required class="w-full p-2 border rounded">
                                        <option value="pending" ${project.status === 'pending' ? 'selected' : ''}>In Attesa</option>
                                        <option value="active" ${project.status === 'active' ? 'selected' : ''}>Attivo</option>
                                        <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completato</option>
                                        <option value="on_hold" ${project.status === 'on_hold' ? 'selected' : ''}>In Pausa</option>
                                        <option value="cancelled" ${project.status === 'cancelled' ? 'selected' : ''}>Cancellato</option>
                                    </select>
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Data Inizio</label>
                                    <input type="date" name="start_date" value="${project.start_date || ''}" class="w-full p-2 border rounded">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Data Fine</label>
                                    <input type="date" name="end_date" value="${project.end_date || ''}" class="w-full p-2 border rounded">
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-6">
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                <i class="fas fa-save"></i> Salva Modifiche
                            </button>
                            <button type="button" onclick="closeEditModal()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        closeModal(); // Chiudi modal dettaglio
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error('Error loading project for edit:', error);
        showNotification('Errore nel caricamento', 'error');
    }
}

/**
 * Submit modifica progetto
 */
async function submitEditProject(event, projectId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        client_id: parseInt(formData.get('client_id')),
        name: formData.get('name'),
        description: formData.get('description'),
        area: formData.get('area'),
        status: formData.get('status'),
        start_date: formData.get('start_date') || null,
        end_date: formData.get('end_date') || null
    };
    
    try {
        await axios.put(`${API_URL}/projects/${projectId}`, data);
        showNotification('Progetto aggiornato con successo!', 'success');
        closeEditModal();
        
        // Ricarica la vista corrente
        if (APP.currentView === 'projects') {
            await loadProjects();
            renderView('projects');
        } else if (APP.currentView === 'gantt') {
            renderView('gantt');
        }
    } catch (error) {
        console.error('Error updating project:', error);
        showNotification('Errore nell\'aggiornamento', 'error');
    }
}

/**
 * Elimina progetto
 */
async function deleteProject(projectId) {
    if (!confirm('Sei sicuro di voler eliminare questo progetto? Verranno eliminate anche tutte le task associate.')) {
        return;
    }
    
    try {
        await axios.delete(`${API_URL}/projects/${projectId}`);
        showNotification('Progetto eliminato con successo!', 'success');
        closeModal();
        
        // Ricarica la vista
        if (APP.currentView === 'projects') {
            await loadProjects();
            renderView('projects');
        } else if (APP.currentView === 'gantt') {
            renderView('gantt');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        showNotification('Errore nell\'eliminazione', 'error');
    }
}

/**
 * Modifica task
 */
async function editTask(taskId) {
    try {
        const response = await axios.get(`${API_URL}/tasks/${taskId}`);
        const task = response.data.task;
        
        // Carica utenti per assegnazione
        const usersResponse = await axios.get(`${API_URL}/auth/users`);
        const users = usersResponse.data.users;
        
        const userOptions = users.map(u => 
            `<option value="${u.id}" ${u.id === task.assigned_to ? 'selected' : ''}>${u.name} (${u.role})</option>`
        ).join('');
        
        const modalHtml = `
            <div id="edit-task-modal-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="closeEditTaskModal(event)">
                <div class="bg-white rounded-lg p-6 max-w-2xl w-full" onclick="event.stopPropagation()">
                    <h2 class="text-2xl font-bold mb-6">Modifica Task</h2>
                    <form id="edit-task-form" onsubmit="submitEditTask(event, ${taskId})">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Titolo *</label>
                                <input type="text" name="title" value="${task.title}" required class="w-full p-2 border rounded">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Descrizione</label>
                                <textarea name="description" rows="3" class="w-full p-2 border rounded">${task.description || ''}</textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Area *</label>
                                    <select name="area" required class="w-full p-2 border rounded">
                                        <option value="copywriting" ${task.area === 'copywriting' ? 'selected' : ''}>📝 Copywriting</option>
                                        <option value="video" ${task.area === 'video' ? 'selected' : ''}>🎬 Video</option>
                                        <option value="adv" ${task.area === 'adv' ? 'selected' : ''}>📢 ADV</option>
                                        <option value="grafica" ${task.area === 'grafica' ? 'selected' : ''}>🎨 Grafica</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Assegnata a</label>
                                    <select name="assigned_to" class="w-full p-2 border rounded">
                                        <option value="">Non assegnata</option>
                                        ${userOptions}
                                    </select>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-1">Stato *</label>
                                    <select name="status" required class="w-full p-2 border rounded">
                                        <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Da Fare</option>
                                        <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Corso</option>
                                        <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completata</option>
                                        <option value="blocked" ${task.status === 'blocked' ? 'selected' : ''}>Bloccata</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Priorità *</label>
                                    <select name="priority" required class="w-full p-2 border rounded">
                                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Bassa</option>
                                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Media</option>
                                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Alta</option>
                                        <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium mb-1">Ore Stimate</label>
                                    <input type="number" name="estimated_hours" value="${task.estimated_hours || ''}" min="0" step="0.5" class="w-full p-2 border rounded">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Data Scadenza</label>
                                <input type="date" name="due_date" value="${task.due_date || ''}" class="w-full p-2 border rounded">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Note</label>
                                <textarea name="notes" rows="2" class="w-full p-2 border rounded">${task.notes || ''}</textarea>
                            </div>
                        </div>
                        <div class="flex gap-2 mt-6">
                            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                <i class="fas fa-save"></i> Salva Modifiche
                            </button>
                            <button type="button" onclick="closeEditTaskModal()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error('Error loading task for edit:', error);
        showNotification('Errore nel caricamento', 'error');
    }
}

/**
 * Submit modifica task
 */
async function submitEditTask(event, taskId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        area: formData.get('area'),
        assigned_to: formData.get('assigned_to') ? parseInt(formData.get('assigned_to')) : null,
        status: formData.get('status'),
        priority: formData.get('priority'),
        estimated_hours: formData.get('estimated_hours') ? parseFloat(formData.get('estimated_hours')) : null,
        due_date: formData.get('due_date') || null,
        notes: formData.get('notes')
    };
    
    try {
        await axios.put(`${API_URL}/tasks/${taskId}`, data);
        showNotification('Task aggiornata con successo!', 'success');
        closeEditTaskModal();
        
        // Ricarica la vista corrente
        const currentTask = APP.tasks.find(t => t.id === taskId);
        if (currentTask) {
            await viewProjectDetail(currentTask.project_id);
        } else {
            if (APP.currentView === 'tasks' || APP.currentView === 'my-tasks') {
                await loadTasks();
                renderView(APP.currentView);
            }
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('Errore nell\'aggiornamento', 'error');
    }
}

/**
 * Elimina task
 */
async function deleteTask(taskId, projectId) {
    if (!confirm('Sei sicuro di voler eliminare questa task?')) {
        return;
    }
    
    try {
        await axios.delete(`${API_URL}/tasks/${taskId}`);
        showNotification('Task eliminata con successo!', 'success');
        
        // Ricarica dettaglio progetto
        if (projectId) {
            await viewProjectDetail(projectId);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Errore nell\'eliminazione', 'error');
    }
}

/**
 * Helper functions per chiudere modal
 */
function closeModal(event) {
    if (!event || event.target.id === 'modal-overlay') {
        const modal = document.getElementById('modal-overlay');
        if (modal) modal.remove();
    }
}

function closeEditModal(event) {
    if (!event || event.target.id === 'edit-modal-overlay') {
        const modal = document.getElementById('edit-modal-overlay');
        if (modal) modal.remove();
    }
}

function closeEditTaskModal(event) {
    if (!event || event.target.id === 'edit-task-modal-overlay') {
        const modal = document.getElementById('edit-task-modal-overlay');
        if (modal) modal.remove();
    }
}

/**
 * Helper per classi badge
 */
function getStatusBadgeClass(status) {
    const classes = {
        pending: 'bg-yellow-100 text-yellow-800',
        in_progress: 'bg-blue-100 text-blue-800',
        completed: 'bg-green-100 text-green-800',
        blocked: 'bg-red-100 text-red-800',
        active: 'bg-green-100 text-green-800',
        on_hold: 'bg-orange-100 text-orange-800',
        cancelled: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status) {
    const labels = {
        pending: 'Da Fare',
        in_progress: 'In Corso',
        completed: 'Completata',
        blocked: 'Bloccata',
        active: 'Attivo',
        on_hold: 'In Pausa',
        cancelled: 'Cancellato'
    };
    return labels[status] || status;
}

function getPriorityBadgeClass(priority) {
    const classes = {
        low: 'bg-gray-100 text-gray-800',
        medium: 'bg-blue-100 text-blue-800',
        high: 'bg-orange-100 text-orange-800',
        urgent: 'bg-red-100 text-red-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
}

function getPriorityLabel(priority) {
    const labels = {
        low: 'Bassa',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente'
    };
    return labels[priority] || priority;
}

function getAreaLabel(area) {
    const labels = {
        copywriting: '📝 Copywriting',
        video: '🎬 Video',
        adv: '📢 ADV',
        grafica: '🎨 Grafica'
    };
    return labels[area] || area;
}

console.log('✅ Edit functions loaded');
