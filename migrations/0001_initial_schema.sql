-- ========================================
-- GESTIONALE AGENZIA - DATABASE SCHEMA
-- ========================================

-- USERS TABLE: Amministratori e collaboratori
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'collaborator')),
  -- Permessi per area: JSON {copywriting: true, video: false, adv: true, grafica: false}
  permissions TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CLIENTS TABLE: Clienti dell'agenzia
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- PROJECT_TEMPLATES TABLE: Template riutilizzabili per progetti
CREATE TABLE IF NOT EXISTS project_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  area TEXT NOT NULL CHECK(area IN ('copywriting', 'video', 'adv', 'grafica')),
  -- Tasks predefinite: JSON array [{title, description, priority, estimated_hours}]
  default_tasks TEXT NOT NULL DEFAULT '[]',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- PROJECTS TABLE: Progetti assegnati ai clienti
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  template_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  area TEXT NOT NULL CHECK(area IN ('copywriting', 'video', 'adv', 'grafica')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('pending', 'active', 'completed', 'on_hold', 'cancelled')),
  start_date DATE,
  end_date DATE,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES project_templates(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- TASKS TABLE: Attività dei progetti
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  area TEXT NOT NULL CHECK(area IN ('copywriting', 'video', 'adv', 'grafica')),
  assigned_to INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  completed_at DATETIME,
  estimated_hours REAL,
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- TASK_RECURRENCE TABLE: Configurazione ripetizioni automatiche
CREATE TABLE IF NOT EXISTS task_recurrence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  frequency TEXT NOT NULL CHECK(frequency IN ('monthly', 'quarterly', 'yearly')),
  next_execution_date DATE NOT NULL,
  last_execution_date DATE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ACTIVITY_LOG TABLE: Log delle attività per tracking
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL CHECK(entity_type IN ('user', 'client', 'project', 'task', 'template')),
  entity_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('created', 'updated', 'deleted', 'completed', 'assigned')),
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ========================================
-- INDEXES for better performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);

CREATE INDEX IF NOT EXISTS idx_templates_area ON project_templates(area);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON project_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_area ON projects(area);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_area ON tasks(area);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_recurrence_project_id ON task_recurrence(project_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_next_execution ON task_recurrence(next_execution_date);

CREATE INDEX IF NOT EXISTS idx_activity_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at);
