import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, adminOnly } from '../middleware/auth';

const gantt = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Tutte le routes richiedono autenticazione
gantt.use('/*', authMiddleware);

/**
 * GET /api/gantt/project/:id
 * Ottieni dati Gantt per un progetto specifico
 */
gantt.get('/project/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    // Verifica permessi sul progetto
    const project = await c.env.DB.prepare(
      'SELECT * FROM projects WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verifica permessi area
    if (user.role !== 'admin') {
      const hasPermission = user.permissions && user.permissions[project.area as string];
      if (!hasPermission) {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    // Carica task del progetto con utenti assegnati
    const { results: tasks } = await c.env.DB.prepare(
      `SELECT 
        t.*,
        u.name as assigned_to_name,
        u.email as assigned_to_email
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.due_date ASC, t.priority DESC`
    )
      .bind(id)
      .all();

    // Calcola date range del progetto
    let minDate = project.start_date || new Date().toISOString().split('T')[0];
    let maxDate = project.end_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Aggiungi date delle task se disponibili
    tasks.forEach((task: any) => {
      if (task.due_date) {
        if (task.due_date < minDate) minDate = task.due_date;
        if (task.due_date > maxDate) maxDate = task.due_date;
      }
    });

    return c.json({
      project: {
        id: project.id,
        name: project.name,
        client_id: project.client_id,
        area: project.area,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date
      },
      tasks,
      timeline: {
        start: minDate,
        end: maxDate
      }
    });
  } catch (error) {
    console.error('Gantt project error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/gantt/workload
 * Vista carico lavoro di tutti gli utenti (admin only)
 */
gantt.get('/workload', adminOnly, async (c) => {
  try {
    const startDate = c.req.query('start') || new Date().toISOString().split('T')[0];
    const endDate = c.req.query('end') || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Carica tutti gli utenti attivi
    const { results: users } = await c.env.DB.prepare(
      'SELECT id, name, email, role, permissions FROM users WHERE is_active = 1 AND role = "collaborator" ORDER BY name'
    ).all();

    // Per ogni utente, carica le task assegnate nel range
    const workloadData = await Promise.all(
      users.map(async (user: any) => {
        const { results: tasks } = await c.env.DB.prepare(
          `SELECT 
            t.*,
            p.name as project_name,
            p.area as project_area,
            c.name as client_name
           FROM tasks t
           LEFT JOIN projects p ON t.project_id = p.id
           LEFT JOIN clients c ON p.client_id = c.id
           WHERE t.assigned_to = ?
           AND (t.due_date >= ? OR t.due_date IS NULL)
           AND (t.due_date <= ? OR t.status != 'completed')
           ORDER BY t.due_date ASC`
        )
          .bind(user.id, startDate, endDate)
          .all();

        // Calcola statistiche
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
        const pendingTasks = tasks.filter((t: any) => t.status === 'pending').length;
        const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
        const overdueTasks = tasks.filter((t: any) => 
          t.status !== 'completed' && t.due_date && t.due_date < new Date().toISOString().split('T')[0]
        ).length;

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions
          },
          stats: {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            in_progress: inProgressTasks,
            overdue: overdueTasks
          },
          tasks
        };
      })
    );

    return c.json({
      timeline: {
        start: startDate,
        end: endDate
      },
      workload: workloadData
    });
  } catch (error) {
    console.error('Workload error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/gantt/overview
 * Vista overview di tutti i progetti in corso (admin only)
 */
gantt.get('/overview', adminOnly, async (c) => {
  try {
    const status = c.req.query('status') || 'active';
    const area = c.req.query('area');

    let query = `
      SELECT 
        p.*,
        c.name as client_name,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'pending') as pending_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'in_progress') as in_progress_tasks,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status != 'completed' AND due_date < date('now')) as overdue_tasks
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.status = ?
    `;

    const bindings: any[] = [status];

    if (area) {
      query += ' AND p.area = ?';
      bindings.push(area);
    }

    query += ' ORDER BY p.created_at DESC';

    const { results: projects } = await c.env.DB.prepare(query)
      .bind(...bindings)
      .all();

    // Per ogni progetto, carica le task con assignee
    const projectsWithTasks = await Promise.all(
      projects.map(async (project: any) => {
        const { results: tasks } = await c.env.DB.prepare(
          `SELECT 
            t.id,
            t.title,
            t.status,
            t.priority,
            t.due_date,
            t.assigned_to,
            u.name as assigned_to_name
           FROM tasks t
           LEFT JOIN users u ON t.assigned_to = u.id
           WHERE t.project_id = ?
           ORDER BY t.due_date ASC`
        )
          .bind(project.id)
          .all();

        return {
          ...project,
          tasks
        };
      })
    );

    // Statistiche globali
    const totalProjects = projectsWithTasks.length;
    const totalTasks = projectsWithTasks.reduce((sum, p: any) => sum + (p.total_tasks || 0), 0);
    const completedTasks = projectsWithTasks.reduce((sum, p: any) => sum + (p.completed_tasks || 0), 0);
    const overdueTasks = projectsWithTasks.reduce((sum, p: any) => sum + (p.overdue_tasks || 0), 0);

    return c.json({
      stats: {
        total_projects: totalProjects,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        overdue_tasks: overdueTasks,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      projects: projectsWithTasks
    });
  } catch (error) {
    console.error('Overview error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/gantt/user/:userId
 * Vista Gantt per un utente specifico
 */
gantt.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const user = c.get('user');

    // Solo admin o l'utente stesso può vedere
    if (user.role !== 'admin' && user.id.toString() !== userId) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const startDate = c.req.query('start') || new Date().toISOString().split('T')[0];
    const endDate = c.req.query('end') || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Carica task dell'utente
    const { results: tasks } = await c.env.DB.prepare(
      `SELECT 
        t.*,
        p.name as project_name,
        p.area as project_area,
        c.name as client_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE t.assigned_to = ?
       AND (t.due_date >= ? OR t.due_date IS NULL)
       AND (t.due_date <= ? OR t.status != 'completed')
       ORDER BY t.due_date ASC, t.priority DESC`
    )
      .bind(userId, startDate, endDate)
      .all();

    // Raggruppa per progetto
    const projectGroups: any = {};
    tasks.forEach((task: any) => {
      if (!projectGroups[task.project_id]) {
        projectGroups[task.project_id] = {
          project_id: task.project_id,
          project_name: task.project_name,
          project_area: task.project_area,
          client_name: task.client_name,
          tasks: []
        };
      }
      projectGroups[task.project_id].tasks.push(task);
    });

    return c.json({
      timeline: {
        start: startDate,
        end: endDate
      },
      projects: Object.values(projectGroups)
    });
  } catch (error) {
    console.error('User gantt error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default gantt;
