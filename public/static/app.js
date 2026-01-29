// ========================================
// GESTIONALE AGENZIA - Frontend Application
// Version: 1.0.2 - Build: 2026-01-29-v2
// ========================================

console.log('🚀 GESTIONALE AGENZIA v1.0.2 LOADED');

// Global state
const APP = {
    user: null,
    token: null,
    currentView: 'login',
    projects: [],
    clients: [],
    tasks: [],
    templates: [],
    users: [],
    stats: null
};

// API Base URL
const API_URL = '/api';
console.log('📡 API URL:', API_URL);

// ========================================
// UTILITY FUNCTIONS
// ========================================

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    console.log('💾 Salvataggio token:', token ? 'Token presente' : 'Token mancante!');
    localStorage.setItem('token', token);
    APP.token = token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('✅ Token salvato in localStorage e header Axios configurato');
}

function clearToken() {
    localStorage.removeItem('token');
    APP.token = null;
    APP.user = null;
    delete axios.defaults.headers.common['Authorization'];
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('it-IT');
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">In Attesa</span>',
        'in_progress': '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">In Corso</span>',
        'completed': '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Completato</span>',
        'blocked': '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Bloccato</span>',
        'active': '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Attivo</span>',
        'on_hold': '<span class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">In Pausa</span>',
        'cancelled': '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Annullato</span>',
        'inactive': '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Inattivo</span>',
        'archived': '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Archiviato</span>'
    };
    return badges[status] || status;
}

function getAreaBadge(area) {
    const badges = {
        'copywriting': '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"><i class="fas fa-pen mr-1"></i>Copywriting</span>',
        'video': '<span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"><i class="fas fa-video mr-1"></i>Video</span>',
        'adv': '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800"><i class="fas fa-bullhorn mr-1"></i>ADV</span>',
        'grafica': '<span class="px-2 py-1 text-xs rounded-full bg-pink-100 text-pink-800"><i class="fas fa-palette mr-1"></i>Grafica</span>'
    };
    return badges[area] || area;
}

function getPriorityBadge(priority) {
    const badges = {
        'low': '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Bassa</span>',
        'medium': '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Media</span>',
        'high': '<span class="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Alta</span>',
        'urgent': '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Urgente</span>'
    };
    return badges[priority] || priority;
}

function showNotification(message, type = 'success') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function hasPermission(area) {
    if (!APP.user) return false;
    if (APP.user.role === 'admin') return true;
    return APP.user.permissions && APP.user.permissions[area] === true;
}

function getAreaIcon(area) {
    const icons = {
        'copywriting': 'fa-pen',
        'video': 'fa-video',
        'adv': 'fa-bullhorn',
        'grafica': 'fa-palette'
    };
    return icons[area] || 'fa-folder';
}

// ========================================
// API CALLS
// ========================================

async function login(email, password) {
    console.log('🔐 Tentativo login per:', email);
    try {
        console.log('📤 Invio richiesta a:', `${API_URL}/auth/login`);
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        console.log('✅ Login riuscito! Response:', response.data);
        
        const { token, user } = response.data;
        console.log('🎫 Token ricevuto:', token ? 'SI' : 'NO');
        console.log('👤 User ricevuto:', user);
        
        setToken(token);
        APP.user = user;
        console.log('💾 Token salvato in localStorage');
        console.log('✨ APP.user impostato:', APP.user);
        
        return true;
    } catch (error) {
        console.error('❌ Login error:', error);
        console.error('❌ Response data:', error.response?.data);
        console.error('❌ Status code:', error.response?.status);
        throw error;
    }
}

async function loadCurrentUser() {
    try {
        const response = await axios.get(`${API_URL}/auth/me`);
        APP.user = response.data.user;
    } catch (error) {
        console.error('Load user error:', error);
        clearToken();
    }
}

async function loadDashboardStats() {
    try {
        const response = await axios.get(`${API_URL}/dashboard/stats`);
        APP.stats = response.data;
        return response.data;
    } catch (error) {
        console.error('Load stats error:', error);
        throw error;
    }
}

async function loadProjects(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const response = await axios.get(`${API_URL}/projects?${params}`);
        APP.projects = response.data.projects;
        return response.data.projects;
    } catch (error) {
        console.error('Load projects error:', error);
        throw error;
    }
}

async function loadProject(id) {
    try {
        const response = await axios.get(`${API_URL}/projects/${id}`);
        return response.data;
    } catch (error) {
        console.error('Load project error:', error);
        throw error;
    }
}

async function loadClients() {
    try {
        const response = await axios.get(`${API_URL}/clients`);
        APP.clients = response.data.clients;
        return response.data.clients;
    } catch (error) {
        console.error('Load clients error:', error);
        throw error;
    }
}

async function loadTemplates(area = null) {
    try {
        const params = area ? `?area=${area}` : '';
        const response = await axios.get(`${API_URL}/templates${params}`);
        APP.templates = response.data.templates;
        return response.data.templates;
    } catch (error) {
        console.error('Load templates error:', error);
        throw error;
    }
}

async function loadTasks(filters = {}) {
    try {
        const params = new URLSearchParams(filters);
        const response = await axios.get(`${API_URL}/tasks?${params}`);
        APP.tasks = response.data.tasks;
        return response.data.tasks;
    } catch (error) {
        console.error('Load tasks error:', error);
        throw error;
    }
}

async function loadMyTasks() {
    try {
        const response = await axios.get(`${API_URL}/tasks/my`);
        return response.data.tasks;
    } catch (error) {
        console.error('Load my tasks error:', error);
        throw error;
    }
}

async function loadUsers() {
    try {
        const response = await axios.get(`${API_URL}/auth/users`);
        APP.users = response.data.users;
        return response.data.users;
    } catch (error) {
        console.error('Load users error:', error);
        throw error;
    }
}

async function toggleTaskStatus(taskId) {
    try {
        const response = await axios.post(`${API_URL}/tasks/${taskId}/toggle`);
        showNotification('Task aggiornata', 'success');
        return response.data;
    } catch (error) {
        console.error('Toggle task error:', error);
        showNotification('Errore aggiornamento task', 'error');
        throw error;
    }
}

async function createClient(data) {
    try {
        const response = await axios.post(`${API_URL}/clients`, data);
        showNotification('Cliente creato con successo', 'success');
        return response.data;
    } catch (error) {
        console.error('Create client error:', error);
        showNotification('Errore creazione cliente', 'error');
        throw error;
    }
}

async function createProject(data) {
    try {
        const response = await axios.post(`${API_URL}/projects`, data);
        showNotification('Progetto creato con successo', 'success');
        return response.data;
    } catch (error) {
        console.error('Create project error:', error);
        showNotification('Errore creazione progetto', 'error');
        throw error;
    }
}

async function createTask(data) {
    try {
        const response = await axios.post(`${API_URL}/tasks`, data);
        showNotification('Task creata con successo', 'success');
        return response.data;
    } catch (error) {
        console.error('Create task error:', error);
        showNotification('Errore creazione task', 'error');
        throw error;
    }
}

async function updateTask(id, data) {
    try {
        const response = await axios.put(`${API_URL}/tasks/${id}`, data);
        showNotification('Task aggiornata con successo', 'success');
        return response.data;
    } catch (error) {
        console.error('Update task error:', error);
        showNotification('Errore aggiornamento task', 'error');
        throw error;
    }
}

async function createTemplate(data) {
    try {
        const response = await axios.post(`${API_URL}/templates`, data);
        showNotification('Template creato con successo', 'success');
        return response.data;
    } catch (error) {
        console.error('Create template error:', error);
        showNotification('Errore creazione template', 'error');
        throw error;
    }
}

async function createUser(data) {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, data);
        showNotification('Utente creato con successo', 'success');
        return response.data;
    } catch (error) {
        console.error('Create user error:', error);
        showNotification('Errore creazione utente', 'error');
        throw error;
    }
}

// Gantt API functions
async function loadProjectGantt(projectId) {
    try {
        const response = await axios.get(`${API_URL}/gantt/project/${projectId}`);
        return response.data;
    } catch (error) {
        console.error('Load project gantt error:', error);
        throw error;
    }
}

async function loadWorkload(start, end) {
    try {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        const response = await axios.get(`${API_URL}/gantt/workload?${params}`);
        return response.data;
    } catch (error) {
        console.error('Load workload error:', error);
        throw error;
    }
}

async function loadGanttOverview(status = 'active', area = null) {
    try {
        const params = new URLSearchParams({ status });
        if (area) params.append('area', area);
        const response = await axios.get(`${API_URL}/gantt/overview?${params}`);
        return response.data;
    } catch (error) {
        console.error('Load gantt overview error:', error);
        throw error;
    }
}

async function loadUserGantt(userId, start, end) {
    try {
        const params = new URLSearchParams();
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        const response = await axios.get(`${API_URL}/gantt/user/${userId}?${params}`);
        return response.data;
    } catch (error) {
        console.error('Load user gantt error:', error);
        throw error;
    }
}

// ========================================
// VIEWS / UI RENDERING
// ========================================

function renderApp() {
    const app = document.getElementById('app');
    
    if (!APP.user) {
        renderLoginView();
        return;
    }
    
    // Render main layout
    app.innerHTML = `
        <div class="min-h-screen flex">
            <!-- Sidebar -->
            <aside id="sidebar" class="w-64 bg-gray-900 text-white flex flex-col">
                <div class="p-6">
                    <h1 class="text-2xl font-bold">
                        <i class="fas fa-briefcase mr-2"></i>
                        Gestionale
                    </h1>
                    <p class="text-sm text-gray-400 mt-1">${APP.user.name}</p>
                    <p class="text-xs text-gray-500">${APP.user.role === 'admin' ? 'Amministratore' : 'Collaboratore'}</p>
                </div>
                
                <nav class="flex-1 px-4" id="nav-menu"></nav>
                
                <div class="p-4 border-t border-gray-800">
                    <button onclick="logout()" class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm">
                        <i class="fas fa-sign-out-alt mr-2"></i>Esci
                    </button>
                </div>
            </aside>
            
            <!-- Main Content -->
            <main class="flex-1 overflow-y-auto">
                <div id="main-content" class="p-8"></div>
            </main>
        </div>
    `;
    
    renderNavMenu();
    renderView(APP.currentView);
}

function renderNavMenu() {
    const nav = document.getElementById('nav-menu');
    const isAdmin = APP.user.role === 'admin';
    
    const menuItems = [
        { id: 'dashboard', icon: 'fa-home', label: 'Dashboard', show: true },
        { id: 'gantt-overview', icon: 'fa-chart-gantt', label: 'Vista Gantt', show: isAdmin },
        { id: 'workload', icon: 'fa-users-cog', label: 'Carico Lavoro', show: isAdmin },
        { id: 'projects', icon: 'fa-folder', label: 'Progetti', show: true },
        { id: 'tasks', icon: 'fa-tasks', label: 'Attività', show: true },
        { id: 'my-tasks', icon: 'fa-user-check', label: 'Le Mie Task', show: !isAdmin },
        { id: 'clients', icon: 'fa-users', label: 'Clienti', show: isAdmin },
        { id: 'templates', icon: 'fa-file-alt', label: 'Template', show: isAdmin },
        { id: 'users', icon: 'fa-user-cog', label: 'Utenti', show: isAdmin }
    ];
    
    nav.innerHTML = menuItems
        .filter(item => item.show)
        .map(item => `
            <button 
                onclick="navigateTo('${item.id}')"
                class="w-full text-left px-4 py-3 mb-2 rounded hover:bg-gray-800 transition ${APP.currentView === item.id ? 'bg-gray-800' : ''}"
            >
                <i class="fas ${item.icon} mr-3"></i>${item.label}
            </button>
        `)
        .join('');
}

function renderView(view) {
    APP.currentView = view;
    renderNavMenu();
    
    const content = document.getElementById('main-content');
    
    switch(view) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'gantt-overview':
            renderGanttOverview();
            break;
        case 'workload':
            renderWorkload();
            break;
        case 'projects':
            renderProjects();
            break;
        case 'tasks':
            renderTasks();
            break;
        case 'my-tasks':
            renderMyTasks();
            break;
        case 'clients':
            renderClients();
            break;
        case 'templates':
            renderTemplates();
            break;
        case 'users':
            renderUsers();
            break;
        default:
            content.innerHTML = '<p>View not found</p>';
    }
}

function renderLoginView() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <div class="bg-white p-8 rounded-lg shadow-2xl w-96">
                <div class="text-center mb-8">
                    <i class="fas fa-briefcase text-5xl text-blue-600 mb-4"></i>
                    <h1 class="text-3xl font-bold text-gray-800">Gestionale Agenzia</h1>
                    <p class="text-gray-600 mt-2">Accedi al tuo account</p>
                </div>
                
                <form id="login-form" onsubmit="handleLogin(event)" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input 
                            type="email" 
                            id="login-email" 
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="admin@agenzia.it"
                        />
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input 
                            type="password" 
                            id="login-password" 
                            required
                            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
                    >
                        <i class="fas fa-sign-in-alt mr-2"></i>Accedi
                    </button>
                </form>
                
                <div class="mt-6 p-4 bg-gray-50 rounded text-sm text-gray-600">
                    <p class="font-semibold mb-2">Credenziali di test:</p>
                    <p><strong>Admin:</strong> admin@agenzia.it / admin123</p>
                    <p><strong>Collaboratore:</strong> copywriter@agenzia.it / password123</p>
                </div>
            </div>
        </div>
    `;
}

function renderDashboard() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    loadDashboardStats().then(stats => {
        const isAdmin = APP.user.role === 'admin';
        
        content.innerHTML = `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-home mr-3"></i>Dashboard
                </h1>
                <p class="text-gray-600 mt-2">Benvenuto, ${APP.user.name}</p>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${isAdmin ? '5' : '4'} gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Progetti Totali</p>
                            <p class="text-3xl font-bold text-gray-800">${stats.total_projects}</p>
                        </div>
                        <div class="bg-blue-100 p-3 rounded-full">
                            <i class="fas fa-folder text-2xl text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Progetti Attivi</p>
                            <p class="text-3xl font-bold text-green-600">${stats.active_projects}</p>
                        </div>
                        <div class="bg-green-100 p-3 rounded-full">
                            <i class="fas fa-check-circle text-2xl text-green-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Task Completate</p>
                            <p class="text-3xl font-bold text-purple-600">${stats.completed_tasks}</p>
                        </div>
                        <div class="bg-purple-100 p-3 rounded-full">
                            <i class="fas fa-tasks text-2xl text-purple-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Task Pending</p>
                            <p class="text-3xl font-bold text-yellow-600">${stats.pending_tasks}</p>
                        </div>
                        <div class="bg-yellow-100 p-3 rounded-full">
                            <i class="fas fa-clock text-2xl text-yellow-600"></i>
                        </div>
                    </div>
                </div>
                
                ${isAdmin ? `
                <div class="bg-white p-6 rounded-lg shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600">Clienti Attivi</p>
                            <p class="text-3xl font-bold text-indigo-600">${stats.total_clients}</p>
                        </div>
                        <div class="bg-indigo-100 p-3 rounded-full">
                            <i class="fas fa-users text-2xl text-indigo-600"></i>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <!-- Tasks by Area -->
            <div class="bg-white p-6 rounded-lg shadow mb-8">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-bar mr-2"></i>Task per Area
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center p-4 bg-blue-50 rounded">
                        <i class="fas fa-pen text-3xl text-blue-600 mb-2"></i>
                        <p class="text-sm text-gray-600">Copywriting</p>
                        <p class="text-2xl font-bold text-blue-600">${stats.tasks_by_area.copywriting || 0}</p>
                    </div>
                    <div class="text-center p-4 bg-purple-50 rounded">
                        <i class="fas fa-video text-3xl text-purple-600 mb-2"></i>
                        <p class="text-sm text-gray-600">Video</p>
                        <p class="text-2xl font-bold text-purple-600">${stats.tasks_by_area.video || 0}</p>
                    </div>
                    <div class="text-center p-4 bg-green-50 rounded">
                        <i class="fas fa-bullhorn text-3xl text-green-600 mb-2"></i>
                        <p class="text-sm text-gray-600">ADV</p>
                        <p class="text-2xl font-bold text-green-600">${stats.tasks_by_area.adv || 0}</p>
                    </div>
                    <div class="text-center p-4 bg-pink-50 rounded">
                        <i class="fas fa-palette text-3xl text-pink-600 mb-2"></i>
                        <p class="text-sm text-gray-600">Grafica</p>
                        <p class="text-2xl font-bold text-pink-600">${stats.tasks_by_area.grafica || 0}</p>
                    </div>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-history mr-2"></i>Attività Recenti
                </h2>
                <div class="space-y-3">
                    ${stats.recent_activity.slice(0, 10).map(activity => `
                        <div class="flex items-start p-3 bg-gray-50 rounded">
                            <div class="flex-1">
                                <p class="text-sm text-gray-800">${activity.user_name || 'System'}</p>
                                <p class="text-xs text-gray-600">${activity.action} ${activity.entity_type} - ${activity.details || ''}</p>
                                <p class="text-xs text-gray-400 mt-1">${formatDateTime(activity.created_at)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).catch(error => {
        content.innerHTML = '<div class="text-center text-red-600">Errore caricamento dashboard</div>';
    });
}

function renderProjects() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    Promise.all([loadProjects(), loadClients()]).then(() => {
        const isAdmin = APP.user.role === 'admin';
        
        content.innerHTML = `
            <div class="mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-folder mr-3"></i>Progetti
                    </h1>
                    <p class="text-gray-600 mt-2">Gestisci i progetti dell'agenzia</p>
                </div>
                ${isAdmin ? `
                <button onclick="showCreateProjectModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Nuovo Progetto
                </button>
                ` : ''}
            </div>
            
            <!-- Filters -->
            <div class="bg-white p-4 rounded-lg shadow mb-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select id="filter-area" onchange="filterProjects()" class="px-4 py-2 border rounded">
                        <option value="">Tutte le aree</option>
                        <option value="copywriting">Copywriting</option>
                        <option value="video">Video</option>
                        <option value="adv">ADV</option>
                        <option value="grafica">Grafica</option>
                    </select>
                    <select id="filter-status" onchange="filterProjects()" class="px-4 py-2 border rounded">
                        <option value="">Tutti gli stati</option>
                        <option value="active">Attivi</option>
                        <option value="completed">Completati</option>
                        <option value="on_hold">In Pausa</option>
                    </select>
                    ${isAdmin ? `
                    <select id="filter-client" onchange="filterProjects()" class="px-4 py-2 border rounded">
                        <option value="">Tutti i clienti</option>
                        ${APP.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                    </select>
                    ` : '<div></div>'}
                </div>
            </div>
            
            <!-- Projects Grid -->
            <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        `;
        
        displayProjects(APP.projects);
    });
}

function displayProjects(projects) {
    const grid = document.getElementById('projects-grid');
    
    if (projects.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-600 py-12">Nessun progetto trovato</div>';
        return;
    }
    
    grid.innerHTML = projects.map(project => `
        <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div class="flex justify-between items-start mb-4">
                <h3 class="font-bold text-lg text-gray-800">${project.name}</h3>
                ${getAreaBadge(project.area)}
            </div>
            <p class="text-sm text-gray-600 mb-3">${project.client_name}</p>
            <p class="text-sm text-gray-500 mb-4 line-clamp-2">${project.description || 'Nessuna descrizione'}</p>
            
            <div class="flex justify-between items-center mb-4">
                ${getStatusBadge(project.status)}
                <span class="text-sm text-gray-600">
                    ${project.completed_tasks}/${project.total_tasks} task
                </span>
            </div>
            
            ${project.start_date ? `
            <div class="mb-4 text-xs text-gray-500">
                <i class="fas fa-calendar mr-1"></i>${formatDate(project.start_date)}
                ${project.end_date ? ` → ${formatDate(project.end_date)}` : ''}
            </div>
            ` : ''}
            
            <button onclick="viewProjectDetail(${project.id})" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
                <i class="fas fa-eye mr-2"></i>Visualizza Dettagli
            </button>
        </div>
    `).join('');
}

function filterProjects() {
    const area = document.getElementById('filter-area')?.value;
    const status = document.getElementById('filter-status')?.value;
    const clientId = document.getElementById('filter-client')?.value;
    
    const filters = {};
    if (area) filters.area = area;
    if (status) filters.status = status;
    if (clientId) filters.client_id = clientId;
    
    loadProjects(filters).then(projects => displayProjects(projects));
}

function renderTasks() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    loadTasks().then(tasks => {
        content.innerHTML = `
            <div class="mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-tasks mr-3"></i>Tutte le Attività
                    </h1>
                    <p class="text-gray-600 mt-2">Visualizza e gestisci tutte le task</p>
                </div>
            </div>
            
            <!-- Task List -->
            <div class="bg-white rounded-lg shadow">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 border-b">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progetto</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assegnato a</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorità</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scadenza</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azioni</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${tasks.map(task => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4">
                                        <div class="font-medium text-gray-900">${task.title}</div>
                                        ${task.description ? `<div class="text-sm text-gray-500">${task.description.substring(0, 50)}...</div>` : ''}
                                    </td>
                                    <td class="px-6 py-4 text-sm text-gray-900">${task.project_name}</td>
                                    <td class="px-6 py-4">${getAreaBadge(task.area)}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">${task.assigned_to_name || '-'}</td>
                                    <td class="px-6 py-4">${getStatusBadge(task.status)}</td>
                                    <td class="px-6 py-4">${getPriorityBadge(task.priority)}</td>
                                    <td class="px-6 py-4 text-sm text-gray-900">${formatDate(task.due_date)}</td>
                                    <td class="px-6 py-4">
                                        <div class="flex gap-2">
                                            <button onclick="editTask(${task.id})" 
                                                    class="text-blue-600 hover:text-blue-800" title="Modifica">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="toggleTaskStatus(${task.id}).then(() => renderTasks())" 
                                                    class="text-green-600 hover:text-green-800" title="Toggle completamento">
                                                <i class="fas ${task.status === 'completed' ? 'fa-undo' : 'fa-check'}"></i>
                                            </button>
                                            ${APP.user.role === 'admin' ? `
                                            <button onclick="deleteTask(${task.id}, null)" 
                                                    class="text-red-600 hover:text-red-800" title="Elimina">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });
}

function renderMyTasks() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    loadMyTasks().then(tasks => {
        const pending = tasks.filter(t => t.status === 'pending');
        const inProgress = tasks.filter(t => t.status === 'in_progress');
        const completed = tasks.filter(t => t.status === 'completed');
        
        content.innerHTML = `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-user-check mr-3"></i>Le Mie Task
                </h1>
                <p class="text-gray-600 mt-2">Task assegnate a te</p>
            </div>
            
            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <p class="text-sm text-yellow-800 font-medium">Da Fare</p>
                    <p class="text-3xl font-bold text-yellow-600">${pending.length}</p>
                </div>
                <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <p class="text-sm text-blue-800 font-medium">In Corso</p>
                    <p class="text-3xl font-bold text-blue-600">${inProgress.length}</p>
                </div>
                <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                    <p class="text-sm text-green-800 font-medium">Completate</p>
                    <p class="text-3xl font-bold text-green-600">${completed.length}</p>
                </div>
            </div>
            
            <!-- Tasks by status -->
            <div class="space-y-6">
                ${renderTaskSection('Da Fare', pending, 'yellow')}
                ${renderTaskSection('In Corso', inProgress, 'blue')}
                ${renderTaskSection('Completate', completed, 'green')}
            </div>
        `;
    });
}

function renderTaskSection(title, tasks, color) {
    if (tasks.length === 0) return '';
    
    return `
        <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
                <h2 class="text-xl font-bold text-gray-800">${title} (${tasks.length})</h2>
            </div>
            <div class="p-6 space-y-4">
                ${tasks.map(task => `
                    <div class="border border-${color}-200 bg-${color}-50 p-4 rounded-lg">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-gray-800">${task.title}</h3>
                            ${getAreaBadge(task.area)}
                        </div>
                        <p class="text-sm text-gray-600 mb-2">${task.project_name} - ${task.client_name}</p>
                        ${task.description ? `<p class="text-sm text-gray-600 mb-3">${task.description}</p>` : ''}
                        <div class="flex justify-between items-center">
                            <div class="text-sm">
                                ${getPriorityBadge(task.priority)}
                                ${task.due_date ? `<span class="ml-2 text-gray-600"><i class="fas fa-calendar mr-1"></i>${formatDate(task.due_date)}</span>` : ''}
                            </div>
                            <button onclick="toggleTaskStatus(${task.id}).then(() => renderMyTasks())" 
                                    class="px-4 py-2 bg-${color}-600 hover:bg-${color}-700 text-white rounded text-sm">
                                <i class="fas ${task.status === 'completed' ? 'fa-undo' : 'fa-check'} mr-1"></i>
                                ${task.status === 'completed' ? 'Riapri' : 'Completa'}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderClients() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    loadClients().then(clients => {
        content.innerHTML = `
            <div class="mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-users mr-3"></i>Clienti
                    </h1>
                    <p class="text-gray-600 mt-2">Gestisci i clienti dell'agenzia</p>
                </div>
                <button onclick="showCreateClientModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Nuovo Cliente
                </button>
            </div>
            
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azienda</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefono</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Creazione</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${clients.map(client => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 font-medium text-gray-900">${client.name}</td>
                                <td class="px-6 py-4 text-sm text-gray-900">${client.company || '-'}</td>
                                <td class="px-6 py-4 text-sm text-gray-900">${client.email || '-'}</td>
                                <td class="px-6 py-4 text-sm text-gray-900">${client.phone || '-'}</td>
                                <td class="px-6 py-4">${getStatusBadge(client.status)}</td>
                                <td class="px-6 py-4 text-sm text-gray-500">${formatDate(client.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });
}

function renderTemplates() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    loadTemplates().then(templates => {
        content.innerHTML = `
            <div class="mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-file-alt mr-3"></i>Template Progetti
                    </h1>
                    <p class="text-gray-600 mt-2">Gestisci i template riutilizzabili</p>
                </div>
                <button onclick="showCreateTemplateModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Nuovo Template
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${templates.map(template => `
                    <div class="bg-white p-6 rounded-lg shadow">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="font-bold text-lg text-gray-800">${template.name}</h3>
                            ${getAreaBadge(template.area)}
                        </div>
                        <p class="text-sm text-gray-600 mb-4">${template.description || 'Nessuna descrizione'}</p>
                        <div class="border-t pt-4">
                            <p class="text-sm font-medium text-gray-700 mb-2">${template.default_tasks.length} Task Predefinite:</p>
                            <ul class="text-sm text-gray-600 space-y-1">
                                ${template.default_tasks.slice(0, 3).map(task => `
                                    <li><i class="fas fa-check-circle text-green-600 mr-2"></i>${task.title}</li>
                                `).join('')}
                                ${template.default_tasks.length > 3 ? `<li class="text-gray-400">... e altre ${template.default_tasks.length - 3}</li>` : ''}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    });
}

function renderUsers() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    loadUsers().then(users => {
        content.innerHTML = `
            <div class="mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-user-cog mr-3"></i>Utenti
                    </h1>
                    <p class="text-gray-600 mt-2">Gestisci gli utenti del sistema</p>
                </div>
                <button onclick="showCreateUserModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                    <i class="fas fa-plus mr-2"></i>Nuovo Utente
                </button>
            </div>
            
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permessi Aree</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stato</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
                        ${users.map(user => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 font-medium text-gray-900">${user.name}</td>
                                <td class="px-6 py-4 text-sm text-gray-900">${user.email}</td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
                                        ${user.role === 'admin' ? 'Admin' : 'Collaboratore'}
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex gap-1">
                                        ${user.permissions.copywriting ? getAreaBadge('copywriting') : ''}
                                        ${user.permissions.video ? getAreaBadge('video') : ''}
                                        ${user.permissions.adv ? getAreaBadge('adv') : ''}
                                        ${user.permissions.grafica ? getAreaBadge('grafica') : ''}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <span class="px-2 py-1 text-xs rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                        ${user.is_active ? 'Attivo' : 'Inattivo'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    });
}

// ========================================
// EVENT HANDLERS
// ========================================

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await login(email, password);
        renderApp();
    } catch (error) {
        showNotification('Credenziali non valide', 'error');
    }
}

function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        clearToken();
        renderApp();
    }
}

function navigateTo(view) {
    renderView(view);
}

function viewProject(id) {
    // In una versione completa, apriresti una vista dettaglio
    showNotification('Funzionalità in arrivo: Vista dettaglio progetto', 'info');
}

// ========================================
// MODALS
// ========================================

function showCreateClientModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-lg w-full max-w-md">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Nuovo Cliente</h2>
            <form id="create-client-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input type="text" id="client-name" required class="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Azienda</label>
                    <input type="text" id="client-company" class="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" id="client-email" class="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Telefono</label>
                    <input type="tel" id="client-phone" class="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Note</label>
                    <textarea id="client-notes" rows="3" class="w-full px-4 py-2 border rounded-lg"></textarea>
                </div>
                <div class="flex gap-4">
                    <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                        Crea Cliente
                    </button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg">
                        Annulla
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('create-client-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('client-name').value,
            company: document.getElementById('client-company').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value,
            notes: document.getElementById('client-notes').value,
        };
        
        try {
            await createClient(data);
            modal.remove();
            renderClients();
        } catch (error) {
            // Error già gestito nella funzione createClient
        }
    };
}

function showCreateProjectModal() {
    loadClients().then(() => {
        loadTemplates().then(() => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto';
            modal.innerHTML = `
                <div class="bg-white p-8 rounded-lg w-full max-w-2xl my-8">
                    <h2 class="text-2xl font-bold text-gray-800 mb-6">Nuovo Progetto</h2>
                    <form id="create-project-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                                <select id="project-client" required class="w-full px-4 py-2 border rounded-lg">
                                    <option value="">Seleziona cliente</option>
                                    ${APP.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                                <select id="project-area" required class="w-full px-4 py-2 border rounded-lg" onchange="filterTemplatesByArea()">
                                    <option value="">Seleziona area</option>
                                    <option value="copywriting">Copywriting</option>
                                    <option value="video">Video</option>
                                    <option value="adv">ADV</option>
                                    <option value="grafica">Grafica</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Template (opzionale)</label>
                            <select id="project-template" class="w-full px-4 py-2 border rounded-lg">
                                <option value="">Nessun template</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nome Progetto *</label>
                            <input type="text" id="project-name" required class="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                            <textarea id="project-description" rows="3" class="w-full px-4 py-2 border rounded-lg"></textarea>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Data Inizio</label>
                                <input type="date" id="project-start" class="w-full px-4 py-2 border rounded-lg" />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Data Fine</label>
                                <input type="date" id="project-end" class="w-full px-4 py-2 border rounded-lg" />
                            </div>
                        </div>
                        <div class="flex gap-4 pt-4">
                            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                                Crea Progetto
                            </button>
                            <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg">
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            window.filterTemplatesByArea = () => {
                const area = document.getElementById('project-area').value;
                const templateSelect = document.getElementById('project-template');
                templateSelect.innerHTML = '<option value="">Nessun template</option>';
                
                if (area) {
                    const filtered = APP.templates.filter(t => t.area === area);
                    filtered.forEach(t => {
                        templateSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`;
                    });
                }
            };
            
            document.getElementById('create-project-form').onsubmit = async (e) => {
                e.preventDefault();
                const data = {
                    client_id: parseInt(document.getElementById('project-client').value),
                    area: document.getElementById('project-area').value,
                    template_id: document.getElementById('project-template').value ? parseInt(document.getElementById('project-template').value) : undefined,
                    name: document.getElementById('project-name').value,
                    description: document.getElementById('project-description').value,
                    start_date: document.getElementById('project-start').value || undefined,
                    end_date: document.getElementById('project-end').value || undefined,
                };
                
                try {
                    await createProject(data);
                    modal.remove();
                    renderProjects();
                } catch (error) {
                    // Error già gestito
                }
            };
        });
    });
}

function showCreateTemplateModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto';
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-lg w-full max-w-3xl my-8">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Nuovo Template</h2>
            <form id="create-template-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nome Template *</label>
                        <input type="text" id="template-name" required class="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Area *</label>
                        <select id="template-area" required class="w-full px-4 py-2 border rounded-lg">
                            <option value="">Seleziona area</option>
                            <option value="copywriting">Copywriting</option>
                            <option value="video">Video</option>
                            <option value="adv">ADV</option>
                            <option value="grafica">Grafica</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                    <textarea id="template-description" rows="2" class="w-full px-4 py-2 border rounded-lg"></textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Task Predefinite</label>
                    <div id="template-tasks" class="space-y-2 mb-2"></div>
                    <button type="button" onclick="addTemplateTask()" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
                        <i class="fas fa-plus mr-2"></i>Aggiungi Task
                    </button>
                </div>
                <div class="flex gap-4 pt-4">
                    <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                        Crea Template
                    </button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg">
                        Annulla
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Aggiungi prima task di default
    addTemplateTask();
    
    document.getElementById('create-template-form').onsubmit = async (e) => {
        e.preventDefault();
        
        const tasks = [];
        document.querySelectorAll('.template-task-row').forEach(row => {
            const title = row.querySelector('.task-title').value;
            const description = row.querySelector('.task-description').value;
            const priority = row.querySelector('.task-priority').value;
            const hours = row.querySelector('.task-hours').value;
            
            if (title) {
                tasks.push({
                    title,
                    description,
                    priority,
                    estimated_hours: hours ? parseFloat(hours) : 0
                });
            }
        });
        
        const data = {
            name: document.getElementById('template-name').value,
            description: document.getElementById('template-description').value,
            area: document.getElementById('template-area').value,
            default_tasks: tasks
        };
        
        try {
            await createTemplate(data);
            modal.remove();
            renderTemplates();
        } catch (error) {
            // Error già gestito
        }
    };
}

function addTemplateTask() {
    const container = document.getElementById('template-tasks');
    const taskRow = document.createElement('div');
    taskRow.className = 'template-task-row border p-4 rounded-lg bg-gray-50';
    taskRow.innerHTML = `
        <div class="grid grid-cols-2 gap-2 mb-2">
            <input type="text" placeholder="Titolo task *" class="task-title px-3 py-2 border rounded" required />
            <div class="grid grid-cols-2 gap-2">
                <select class="task-priority px-3 py-2 border rounded">
                    <option value="low">Bassa</option>
                    <option value="medium" selected>Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                </select>
                <input type="number" placeholder="Ore" class="task-hours px-3 py-2 border rounded" step="0.5" min="0" />
            </div>
        </div>
        <textarea placeholder="Descrizione" class="task-description w-full px-3 py-2 border rounded" rows="2"></textarea>
        <button type="button" onclick="this.closest('.template-task-row').remove()" class="mt-2 text-red-600 hover:text-red-800 text-sm">
            <i class="fas fa-trash mr-1"></i>Rimuovi
        </button>
    `;
    container.appendChild(taskRow);
}

function showCreateUserModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white p-8 rounded-lg w-full max-w-md">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Nuovo Utente</h2>
            <form id="create-user-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input type="text" id="user-name" required class="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input type="email" id="user-email" required class="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input type="password" id="user-password" required class="w-full px-4 py-2 border rounded-lg" />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ruolo *</label>
                    <select id="user-role" required class="w-full px-4 py-2 border rounded-lg">
                        <option value="collaborator">Collaboratore</option>
                        <option value="admin">Amministratore</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Permessi Aree</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="checkbox" id="perm-copywriting" class="mr-2" />
                            <span>Copywriting</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="perm-video" class="mr-2" />
                            <span>Video</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="perm-adv" class="mr-2" />
                            <span>ADV</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="perm-grafica" class="mr-2" />
                            <span>Grafica</span>
                        </label>
                    </div>
                </div>
                <div class="flex gap-4">
                    <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg">
                        Crea Utente
                    </button>
                    <button type="button" onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg">
                        Annulla
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('create-user-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            password: document.getElementById('user-password').value,
            role: document.getElementById('user-role').value,
            permissions: {
                copywriting: document.getElementById('perm-copywriting').checked,
                video: document.getElementById('perm-video').checked,
                adv: document.getElementById('perm-adv').checked,
                grafica: document.getElementById('perm-grafica').checked
            }
        };
        
        try {
            await createUser(data);
            modal.remove();
            renderUsers();
        } catch (error) {
            // Error già gestito
        }
    };
}

// ========================================
// GANTT VIEWS
// ========================================

function renderGanttOverview() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    loadGanttOverview('active').then(data => {
        content.innerHTML = `
            <div class="mb-8 flex justify-between items-center">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800">
                        <i class="fas fa-chart-gantt mr-3"></i>Vista Gantt - Tutti i Progetti
                    </h1>
                    <p class="text-gray-600 mt-2">Timeline completa di tutti i progetti attivi</p>
                </div>
                <div class="flex gap-2">
                    <select id="gantt-area-filter" onchange="filterGanttOverview()" class="px-4 py-2 border rounded-lg">
                        <option value="">Tutte le aree</option>
                        <option value="copywriting">Copywriting</option>
                        <option value="video">Video</option>
                        <option value="adv">ADV</option>
                        <option value="grafica">Grafica</option>
                    </select>
                </div>
            </div>
            
            <!-- Stats Summary -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <p class="text-sm text-blue-800 font-medium">Progetti Attivi</p>
                    <p class="text-3xl font-bold text-blue-600">${data.stats.total_projects}</p>
                </div>
                <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <p class="text-sm text-purple-800 font-medium">Task Totali</p>
                    <p class="text-3xl font-bold text-purple-600">${data.stats.total_tasks}</p>
                </div>
                <div class="bg-green-50 p-6 rounded-lg border border-green-200">
                    <p class="text-sm text-green-800 font-medium">Completamento</p>
                    <p class="text-3xl font-bold text-green-600">${data.stats.completion_rate}%</p>
                </div>
                <div class="bg-red-50 p-6 rounded-lg border border-red-200">
                    <p class="text-sm text-red-800 font-medium">Task Scadute</p>
                    <p class="text-3xl font-bold text-red-600">${data.stats.overdue_tasks}</p>
                </div>
            </div>
            
            <!-- Projects Gantt -->
            <div class="space-y-6">
                ${data.projects.map(project => renderProjectGanttCard(project)).join('')}
            </div>
        `;
    });
}

function renderProjectGanttCard(project) {
    const completionRate = project.total_tasks > 0 
        ? Math.round((project.completed_tasks / project.total_tasks) * 100) 
        : 0;
    
    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="p-6 border-b bg-gray-50">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h3 class="text-xl font-bold text-gray-800">${project.name}</h3>
                            ${getAreaBadge(project.area)}
                            ${getStatusBadge(project.status)}
                        </div>
                        <p class="text-sm text-gray-600">
                            <i class="fas fa-user mr-1"></i>${project.client_name}
                            ${project.start_date ? `<span class="ml-4"><i class="fas fa-calendar mr-1"></i>${formatDate(project.start_date)} → ${formatDate(project.end_date)}</span>` : ''}
                        </p>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-gray-800">${completionRate}%</div>
                        <div class="text-xs text-gray-600">${project.completed_tasks}/${project.total_tasks} task</div>
                        ${project.overdue_tasks > 0 ? `<div class="text-xs text-red-600 mt-1"><i class="fas fa-exclamation-triangle mr-1"></i>${project.overdue_tasks} scadute</div>` : ''}
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="mt-4">
                    <div class="w-full bg-gray-200 rounded-full h-3">
                        <div class="bg-green-600 h-3 rounded-full transition-all" style="width: ${completionRate}%"></div>
                    </div>
                </div>
            </div>
            
            <!-- Tasks Timeline -->
            <div class="p-6">
                <h4 class="font-semibold text-gray-700 mb-4">Timeline Task</h4>
                <div class="space-y-3">
                    ${project.tasks.slice(0, 10).map(task => `
                        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                            <div class="flex-shrink-0">
                                <i class="fas ${task.status === 'completed' ? 'fa-check-circle text-green-600' : task.status === 'in_progress' ? 'fa-circle-notch text-blue-600' : 'fa-circle text-gray-400'}"></i>
                            </div>
                            <div class="flex-1">
                                <div class="font-medium text-gray-800">${task.title}</div>
                                <div class="text-xs text-gray-600">
                                    ${task.assigned_to_name ? `<i class="fas fa-user mr-1"></i>${task.assigned_to_name}` : '<i class="fas fa-user-slash mr-1"></i>Non assegnata'}
                                </div>
                            </div>
                            <div class="flex-shrink-0 text-right">
                                ${getPriorityBadge(task.priority)}
                                ${task.due_date ? `<div class="text-xs text-gray-600 mt-1">${formatDate(task.due_date)}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                    ${project.tasks.length > 10 ? `<div class="text-center text-sm text-gray-500 pt-2">... e altre ${project.tasks.length - 10} task</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderWorkload() {
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    // Default: prossimi 90 giorni
    const today = new Date();
    const start = today.toISOString().split('T')[0];
    const endDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    const end = endDate.toISOString().split('T')[0];
    
    loadWorkload(start, end).then(data => {
        content.innerHTML = `
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800">
                    <i class="fas fa-users-cog mr-3"></i>Carico Lavoro Collaboratori
                </h1>
                <p class="text-gray-600 mt-2">Visualizza il carico di lavoro di ogni collaboratore nei prossimi 90 giorni</p>
                <p class="text-sm text-gray-500 mt-1">
                    <i class="fas fa-calendar mr-1"></i>
                    Dal ${formatDate(data.timeline.start)} al ${formatDate(data.timeline.end)}
                </p>
            </div>
            
            <!-- Workload Cards -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${data.workload.map(w => renderWorkloadCard(w)).join('')}
            </div>
        `;
    });
}

function renderWorkloadCard(workload) {
    const user = workload.user;
    const stats = workload.stats;
    const tasks = workload.tasks;
    
    // Calcola workload percentuale
    const workloadPercent = stats.total > 0 ? Math.round(((stats.pending + stats.in_progress) / stats.total) * 100) : 0;
    const workloadColor = workloadPercent > 80 ? 'red' : workloadPercent > 50 ? 'yellow' : 'green';
    
    // Filtra aree permesse
    const areas = [];
    if (user.permissions.copywriting) areas.push('Copywriting');
    if (user.permissions.video) areas.push('Video');
    if (user.permissions.adv) areas.push('ADV');
    if (user.permissions.grafica) areas.push('Grafica');
    
    return `
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="p-6 border-b bg-gradient-to-r from-${workloadColor}-50 to-${workloadColor}-100">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${user.name}</h3>
                        <p class="text-sm text-gray-600">${user.email}</p>
                        <div class="flex gap-2 mt-2">
                            ${areas.map(a => `<span class="text-xs px-2 py-1 bg-white rounded">${a}</span>`).join('')}
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-${workloadColor}-600">${stats.total}</div>
                        <div class="text-xs text-gray-600">Task totali</div>
                    </div>
                </div>
                
                <!-- Stats Grid -->
                <div class="grid grid-cols-4 gap-2 text-center">
                    <div class="bg-white p-2 rounded">
                        <div class="text-lg font-bold text-gray-600">${stats.pending}</div>
                        <div class="text-xs text-gray-500">Pending</div>
                    </div>
                    <div class="bg-white p-2 rounded">
                        <div class="text-lg font-bold text-blue-600">${stats.in_progress}</div>
                        <div class="text-xs text-gray-500">In Corso</div>
                    </div>
                    <div class="bg-white p-2 rounded">
                        <div class="text-lg font-bold text-green-600">${stats.completed}</div>
                        <div class="text-xs text-gray-500">Completate</div>
                    </div>
                    <div class="bg-white p-2 rounded">
                        <div class="text-lg font-bold text-red-600">${stats.overdue}</div>
                        <div class="text-xs text-gray-500">Scadute</div>
                    </div>
                </div>
            </div>
            
            <!-- Task List -->
            <div class="p-6 max-h-96 overflow-y-auto">
                <h4 class="font-semibold text-gray-700 mb-3">Task Assegnate</h4>
                ${tasks.length === 0 ? '<p class="text-gray-500 text-center py-4">Nessuna task assegnata</p>' : ''}
                <div class="space-y-2">
                    ${tasks.slice(0, 15).map(task => `
                        <div class="flex items-start gap-2 p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition">
                            <div class="flex-shrink-0 mt-1">
                                ${getStatusBadge(task.status)}
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="font-medium text-gray-800 truncate">${task.title}</div>
                                <div class="text-xs text-gray-600">
                                    ${task.project_name} - ${task.client_name}
                                </div>
                            </div>
                            <div class="flex-shrink-0 text-right">
                                ${getPriorityBadge(task.priority)}
                                ${task.due_date ? `<div class="text-xs text-gray-600 mt-1">${formatDate(task.due_date)}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                    ${tasks.length > 15 ? `<div class="text-center text-xs text-gray-500 pt-2">... e altre ${tasks.length - 15} task</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

function filterGanttOverview() {
    const area = document.getElementById('gantt-area-filter').value;
    const content = document.getElementById('main-content');
    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i></div>';
    
    loadGanttOverview('active', area || null).then(data => {
        // Re-render con gli stessi controlli
        renderGanttOverview();
    });
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if token exists
    const token = getToken();
    if (token) {
        setToken(token);
        loadCurrentUser().then(() => {
            renderApp();
        }).catch(() => {
            renderApp();
        });
    } else {
        renderApp();
    }
});

