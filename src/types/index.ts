// Types per TypeScript e Cloudflare bindings

export type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

export type Variables = {
  user: User | null;
};

// Database Models
export interface User {
  id: number;
  email: string;
  password_hash?: string;
  name: string;
  role: 'admin' | 'collaborator';
  permissions: UserPermissions;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface UserPermissions {
  copywriting: boolean;
  video: boolean;
  adv: boolean;
  grafica: boolean;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'archived';
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectTemplate {
  id: number;
  name: string;
  description?: string;
  area: Area;
  default_tasks: TaskTemplate[];
  is_active: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TaskTemplate {
  title: string;
  description: string;
  priority: Priority;
  estimated_hours: number;
}

export interface Project {
  id: number;
  client_id: number;
  template_id?: number;
  name: string;
  description?: string;
  area: Area;
  status: 'pending' | 'active' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description?: string;
  area: Area;
  assigned_to?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: Priority;
  due_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TaskRecurrence {
  id: number;
  project_id: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  next_execution_date: string;
  last_execution_date?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  entity_type: 'user' | 'client' | 'project' | 'task' | 'template';
  entity_id: number;
  action: 'created' | 'updated' | 'deleted' | 'completed' | 'assigned';
  details?: string;
  created_at: string;
}

export type Area = 'copywriting' | 'video' | 'adv' | 'grafica';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

// API Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'collaborator';
  permissions: UserPermissions;
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'archived';
}

export interface CreateProjectRequest {
  client_id: number;
  template_id?: number;
  name: string;
  description?: string;
  area: Area;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateTaskRequest {
  project_id: number;
  title: string;
  description?: string;
  area: Area;
  assigned_to?: number;
  status?: string;
  priority?: Priority;
  due_date?: string;
  estimated_hours?: number;
  notes?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  area?: Area;
  assigned_to?: number;
  status?: string;
  priority?: Priority;
  due_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  notes?: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  area: Area;
  default_tasks: TaskTemplate[];
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_tasks: number;
  pending_tasks: number;
  total_clients: number;
  tasks_by_area: Record<Area, number>;
  recent_activity: ActivityLog[];
}
