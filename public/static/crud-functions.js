// ========================================
// CRUD EDITING - Clienti, Template, Utenti
// ========================================

/**
 * CLIENTI - Edit, Delete
 */

function editClient(clientId) {
    console.log('✏️ Modifica cliente:', clientId);
    
    const client = APP.clients.find(c => c.id === clientId);
    if (!client) {
        showNotification('Cliente non trovato', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 class="text-2xl font-bold mb-6">
                <i class="fas fa-user-edit mr-2 text-blue-600"></i>Modifica Cliente
            </h3>
            
            <form id="edit-client-form" onsubmit="saveClientEdit(event, ${clientId})" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input 
                        type="text" 
                        name="name" 
                        value="${client.name}"
                        required
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                        type="email" 
                        name="email" 
                        value="${client.email}"
                        required
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Telefono</label>
                        <input 
                            type="tel" 
                            name="phone" 
                            value="${client.phone || ''}"
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Azienda</label>
                        <input 
                            type="text" 
                            name="company" 
                            value="${client.company || ''}"
                            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Note</label>
                    <textarea 
                        name="notes" 
                        rows="3"
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >${client.notes || ''}</textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Stato</label>
                    <select name="status" class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="active" ${client.status === 'active' ? 'selected' : ''}>Attivo</option>
                        <option value="inactive" ${client.status === 'inactive' ? 'selected' : ''}>Inattivo</option>
                        <option value="archived" ${client.status === 'archived' ? 'selected' : ''}>Archiviato</option>
                    </select>
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
}

async function saveClientEdit(event, clientId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || null,
        company: formData.get('company') || null,
        notes: formData.get('notes') || null,
        status: formData.get('status')
    };
    
    console.log('💾 Salvataggio cliente:', data);
    
    try {
        await axios.put(`${API_URL}/clients/${clientId}`, data);
        showNotification('Cliente aggiornato con successo!', 'success');
        
        form.closest('.fixed').remove();
        
        // Ricarica clienti
        await loadClients();
        if (APP.currentView === 'clients') {
            renderClients();
        }
        
    } catch (error) {
        console.error('❌ Errore salvataggio cliente:', error);
        showNotification('Errore nel salvataggio del cliente', 'error');
    }
}

async function deleteClient(clientId) {
    if (!confirm('Sei sicuro di voler eliminare questo cliente? Verranno eliminati anche tutti i suoi progetti e task!')) {
        return;
    }
    
    console.log('🗑️ Eliminazione cliente:', clientId);
    
    try {
        await axios.delete(`${API_URL}/clients/${clientId}`);
        showNotification('Cliente eliminato con successo!', 'success');
        
        // Ricarica clienti
        await loadClients();
        if (APP.currentView === 'clients') {
            renderClients();
        }
        
    } catch (error) {
        console.error('❌ Errore eliminazione cliente:', error);
        showNotification('Errore nell\'eliminazione del cliente', 'error');
    }
}

/**
 * TEMPLATE - Edit, Delete
 */

function editTemplate(templateId) {
    console.log('✏️ Modifica template:', templateId);
    
    const template = APP.templates.find(t => t.id === templateId);
    if (!template) {
        showNotification('Template non trovato', 'error');
        return;
    }
    
    const tasks = template.tasks ? JSON.parse(template.tasks) : [];
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div class="flex justify-between items-center">
                    <h3 class="text-2xl font-bold">
                        <i class="fas fa-file-alt mr-2"></i>Modifica Template
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-gray-200">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 150px);">
                <form id="edit-template-form" onsubmit="saveTemplateEdit(event, ${templateId})" class="space-y-6">
                    <!-- Info Base -->
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nome Template *</label>
                            <input 
                                type="text" 
                                name="name" 
                                value="${template.name}"
                                required
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                            <textarea 
                                name="description" 
                                rows="2"
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >${template.description || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                            <select name="area" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="copywriting" ${template.area === 'copywriting' ? 'selected' : ''}>Copywriting</option>
                                <option value="video" ${template.area === 'video' ? 'selected' : ''}>Video</option>
                                <option value="adv" ${template.area === 'adv' ? 'selected' : ''}>ADV</option>
                                <option value="grafica" ${template.area === 'grafica' ? 'selected' : ''}>Grafica</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Task del Template -->
                    <div class="border-t pt-6">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-lg font-bold text-gray-800">Task del Template</h4>
                            <button type="button" onclick="addTemplateTask()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                                <i class="fas fa-plus mr-2"></i>Aggiungi Task
                            </button>
                        </div>
                        
                        <div id="template-tasks-list" class="space-y-3">
                            ${tasks.map((task, index) => renderTemplateTaskItem(task, index)).join('')}
                        </div>
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
        </div>
    `;
    
    document.body.appendChild(modal);
}

function renderTemplateTaskItem(task, index) {
    return `
        <div class="bg-gray-50 border rounded-lg p-4" data-task-index="${index}">
            <div class="flex gap-4 items-start">
                <div class="flex-1 grid grid-cols-2 gap-3">
                    <input 
                        type="text" 
                        placeholder="Titolo task *"
                        value="${task.title || ''}"
                        class="template-task-title px-3 py-2 border rounded"
                        required
                    />
                    <input 
                        type="text" 
                        placeholder="Descrizione"
                        value="${task.description || ''}"
                        class="template-task-description px-3 py-2 border rounded"
                    />
                    <select class="template-task-priority px-3 py-2 border rounded">
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Priorità Bassa</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Priorità Media</option>
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Priorità Alta</option>
                        <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Urgente</option>
                    </select>
                    <input 
                        type="number" 
                        placeholder="Ore stimate"
                        value="${task.estimated_hours || ''}"
                        min="0"
                        step="0.5"
                        class="template-task-hours px-3 py-2 border rounded"
                    />
                </div>
                <button type="button" onclick="removeTemplateTask(${index})" class="text-red-600 hover:text-red-700 p-2">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function addTemplateTask() {
    const list = document.getElementById('template-tasks-list');
    const newIndex = list.children.length;
    
    const newTask = {
        title: '',
        description: '',
        priority: 'medium',
        estimated_hours: null
    };
    
    const div = document.createElement('div');
    div.innerHTML = renderTemplateTaskItem(newTask, newIndex);
    list.appendChild(div.firstElementChild);
}

function removeTemplateTask(index) {
    const taskElement = document.querySelector(`[data-task-index="${index}"]`);
    if (taskElement) {
        taskElement.remove();
        
        // Re-index remaining tasks
        const allTasks = document.querySelectorAll('#template-tasks-list > div');
        allTasks.forEach((task, newIndex) => {
            task.setAttribute('data-task-index', newIndex);
            const removeBtn = task.querySelector('button[onclick^="removeTemplateTask"]');
            if (removeBtn) {
                removeBtn.setAttribute('onclick', `removeTemplateTask(${newIndex})`);
            }
        });
    }
}

async function saveTemplateEdit(event, templateId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Raccogli le task
    const taskElements = document.querySelectorAll('#template-tasks-list > div');
    const tasks = [];
    
    taskElements.forEach(taskEl => {
        const title = taskEl.querySelector('.template-task-title').value.trim();
        if (title) {
            tasks.push({
                title: title,
                description: taskEl.querySelector('.template-task-description').value.trim() || null,
                priority: taskEl.querySelector('.template-task-priority').value,
                estimated_hours: taskEl.querySelector('.template-task-hours').value || null
            });
        }
    });
    
    if (tasks.length === 0) {
        showNotification('Aggiungi almeno una task al template', 'error');
        return;
    }
    
    const data = {
        name: formData.get('name'),
        description: formData.get('description') || null,
        area: formData.get('area'),
        tasks: JSON.stringify(tasks)
    };
    
    console.log('💾 Salvataggio template:', data);
    
    try {
        await axios.put(`${API_URL}/templates/${templateId}`, data);
        showNotification('Template aggiornato con successo!', 'success');
        
        form.closest('.fixed').remove();
        
        // Ricarica templates
        await loadTemplates();
        if (APP.currentView === 'templates') {
            renderTemplates();
        }
        
    } catch (error) {
        console.error('❌ Errore salvataggio template:', error);
        showNotification('Errore nel salvataggio del template', 'error');
    }
}

async function deleteTemplate(templateId) {
    if (!confirm('Sei sicuro di voler eliminare questo template?')) {
        return;
    }
    
    console.log('🗑️ Eliminazione template:', templateId);
    
    try {
        await axios.delete(`${API_URL}/templates/${templateId}`);
        showNotification('Template eliminato con successo!', 'success');
        
        // Ricarica templates
        await loadTemplates();
        if (APP.currentView === 'templates') {
            renderTemplates();
        }
        
    } catch (error) {
        console.error('❌ Errore eliminazione template:', error);
        showNotification('Errore nell\'eliminazione del template', 'error');
    }
}

/**
 * UTENTI - Edit, Delete
 */

function editUser(userId) {
    console.log('✏️ Modifica utente:', userId);
    
    const user = APP.users.find(u => u.id === userId);
    if (!user) {
        showNotification('Utente non trovato', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 class="text-2xl font-bold mb-6">
                <i class="fas fa-user-edit mr-2 text-blue-600"></i>Modifica Utente
            </h3>
            
            <form id="edit-user-form" onsubmit="saveUserEdit(event, ${userId})" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input 
                        type="text" 
                        name="name" 
                        value="${user.name}"
                        required
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                        type="email" 
                        name="email" 
                        value="${user.email}"
                        required
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nuova Password (lascia vuoto per non modificare)</label>
                    <input 
                        type="password" 
                        name="password" 
                        placeholder="••••••••"
                        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ruolo *</label>
                    <select name="role" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="collaborator" ${user.role === 'collaborator' ? 'selected' : ''}>Collaboratore</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Amministratore</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Permessi per Aree</label>
                    <div class="space-y-2 bg-gray-50 p-4 rounded-lg">
                        <label class="flex items-center">
                            <input type="checkbox" name="perm_copywriting" ${user.permissions?.copywriting ? 'checked' : ''} class="mr-2 w-4 h-4">
                            <span>📝 Copywriting</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="perm_video" ${user.permissions?.video ? 'checked' : ''} class="mr-2 w-4 h-4">
                            <span>🎬 Video</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="perm_adv" ${user.permissions?.adv ? 'checked' : ''} class="mr-2 w-4 h-4">
                            <span>📢 ADV</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="perm_grafica" ${user.permissions?.grafica ? 'checked' : ''} class="mr-2 w-4 h-4">
                            <span>🎨 Grafica</span>
                        </label>
                    </div>
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
}

async function saveUserEdit(event, userId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role'),
        permissions: {
            copywriting: formData.get('perm_copywriting') === 'on',
            video: formData.get('perm_video') === 'on',
            adv: formData.get('perm_adv') === 'on',
            grafica: formData.get('perm_grafica') === 'on'
        }
    };
    
    // Aggiungi password solo se fornita
    const password = formData.get('password');
    if (password && password.trim()) {
        data.password = password;
    }
    
    console.log('💾 Salvataggio utente:', data);
    
    try {
        await axios.put(`${API_URL}/auth/users/${userId}`, data);
        showNotification('Utente aggiornato con successo!', 'success');
        
        form.closest('.fixed').remove();
        
        // Ricarica utenti
        await loadUsers();
        if (APP.currentView === 'users') {
            renderUsers();
        }
        
    } catch (error) {
        console.error('❌ Errore salvataggio utente:', error);
        showNotification('Errore nel salvataggio dell\'utente', 'error');
    }
}

async function deleteUser(userId) {
    if (userId === APP.user.id) {
        showNotification('Non puoi eliminare il tuo stesso account!', 'error');
        return;
    }
    
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) {
        return;
    }
    
    console.log('🗑️ Eliminazione utente:', userId);
    
    try {
        await axios.delete(`${API_URL}/auth/users/${userId}`);
        showNotification('Utente eliminato con successo!', 'success');
        
        // Ricarica utenti
        await loadUsers();
        if (APP.currentView === 'users') {
            renderUsers();
        }
        
    } catch (error) {
        console.error('❌ Errore eliminazione utente:', error);
        showNotification('Errore nell\'eliminazione dell\'utente', 'error');
    }
}

console.log('✅ CRUD editing module loaded (Clienti, Template, Utenti)');
