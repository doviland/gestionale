import { Hono } from 'hono';
import { Bindings, Variables, DashboardStats } from '../types';
import { authMiddleware } from '../middleware/auth';

const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Tutte le routes richiedono autenticazione
dashboard.use('/*', authMiddleware);

/**
 * GET /api/dashboard/stats
 * Ottieni statistiche dashboard
 */
dashboard.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    
    // Costruisci filtro area in base ai permessi
    let areaFilter = '';
    const areaBindings: string[] = [];
    
    if (user.role !== 'admin') {
      const allowedAreas: string[] = [];
      if (user.permissions.copywriting) allowedAreas.push('copywriting');
      if (user.permissions.video) allowedAreas.push('video');
      if (user.permissions.adv) allowedAreas.push('adv');
      if (user.permissions.grafica) allowedAreas.push('grafica');

      if (allowedAreas.length > 0) {
        areaFilter = ` AND area IN (${allowedAreas.map(() => '?').join(',')})`;
        areaBindings.push(...allowedAreas);
      }
    }

    // Total projects
    const totalProjectsStmt = c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM projects WHERE 1=1${areaFilter}`
    );
    const totalProjects = areaBindings.length > 0
      ? await totalProjectsStmt.bind(...areaBindings).first()
      : await totalProjectsStmt.first();

    // Active projects
    const activeProjectsStmt = c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM projects WHERE status = 'active'${areaFilter}`
    );
    const activeProjects = areaBindings.length > 0
      ? await activeProjectsStmt.bind(...areaBindings).first()
      : await activeProjectsStmt.first();

    // Completed tasks
    const completedTasksStmt = c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'${areaFilter}`
    );
    const completedTasks = areaBindings.length > 0
      ? await completedTasksStmt.bind(...areaBindings).first()
      : await completedTasksStmt.first();

    // Pending tasks
    const pendingTasksStmt = c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'${areaFilter}`
    );
    const pendingTasks = areaBindings.length > 0
      ? await pendingTasksStmt.bind(...areaBindings).first()
      : await pendingTasksStmt.first();

    // Total clients (solo admin)
    let totalClients = { count: 0 };
    if (user.role === 'admin') {
      totalClients = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM clients WHERE status = "active"'
      ).first() as any;
    }

    // Tasks by area
    const tasksByAreaStmt = c.env.DB.prepare(
      `SELECT area, COUNT(*) as count FROM tasks WHERE 1=1${areaFilter} GROUP BY area`
    );
    const tasksByAreaResult = areaBindings.length > 0
      ? await tasksByAreaStmt.bind(...areaBindings).all()
      : await tasksByAreaStmt.all();

    const tasksByArea: Record<string, number> = {
      copywriting: 0,
      video: 0,
      adv: 0,
      grafica: 0
    };
    
    tasksByAreaResult.results.forEach((row: any) => {
      tasksByArea[row.area] = row.count;
    });

    // Recent activity
    const recentActivityStmt = c.env.DB.prepare(
      `SELECT a.*, u.name as user_name
       FROM activity_log a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT 20`
    );
    const { results: recentActivity } = await recentActivityStmt.all();

    const stats: DashboardStats = {
      total_projects: totalProjects?.count || 0,
      active_projects: activeProjects?.count || 0,
      completed_tasks: completedTasks?.count || 0,
      pending_tasks: pendingTasks?.count || 0,
      total_clients: totalClients?.count || 0,
      tasks_by_area: tasksByArea as any,
      recent_activity: recentActivity as any[]
    };

    return c.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/dashboard/monthly-activities
 * Ottieni attività mensili per area
 */
dashboard.get('/monthly-activities', async (c) => {
  try {
    const user = c.get('user');
    const month = c.req.query('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Costruisci filtro area
    let areaFilter = '';
    const bindings: any[] = [month];
    
    if (user.role !== 'admin') {
      const allowedAreas: string[] = [];
      if (user.permissions.copywriting) allowedAreas.push('copywriting');
      if (user.permissions.video) allowedAreas.push('video');
      if (user.permissions.adv) allowedAreas.push('adv');
      if (user.permissions.grafica) allowedAreas.push('grafica');

      if (allowedAreas.length > 0) {
        areaFilter = ` AND area IN (${allowedAreas.map(() => '?').join(',')})`;
        bindings.push(...allowedAreas);
      }
    }

    // Tasks create nel mese per area
    const { results } = await c.env.DB.prepare(
      `SELECT 
        area,
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks
       FROM tasks
       WHERE strftime('%Y-%m', created_at) = ?${areaFilter}
       GROUP BY area`
    )
      .bind(...bindings)
      .all();

    return c.json({ month, activities: results });
  } catch (error) {
    console.error('Monthly activities error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/dashboard/my-tasks-summary
 * Riepilogo task personali dell'utente corrente
 */
dashboard.get('/my-tasks-summary', async (c) => {
  try {
    const user = c.get('user');

    // Total my tasks
    const totalTasks = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ?'
    )
      .bind(user.id)
      .first();

    // Completed my tasks
    const completedTasks = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = "completed"'
    )
      .bind(user.id)
      .first();

    // Pending my tasks
    const pendingTasks = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = "pending"'
    )
      .bind(user.id)
      .first();

    // In progress my tasks
    const inProgressTasks = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = "in_progress"'
    )
      .bind(user.id)
      .first();

    // Overdue tasks
    const overdueTasks = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE assigned_to = ? 
       AND status != 'completed' 
       AND due_date < date('now')`
    )
      .bind(user.id)
      .first();

    // Today's tasks
    const todayTasks = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM tasks 
       WHERE assigned_to = ? 
       AND status != 'completed' 
       AND due_date = date('now')`
    )
      .bind(user.id)
      .first();

    return c.json({
      total: totalTasks?.count || 0,
      completed: completedTasks?.count || 0,
      pending: pendingTasks?.count || 0,
      in_progress: inProgressTasks?.count || 0,
      overdue: overdueTasks?.count || 0,
      today: todayTasks?.count || 0
    });
  } catch (error) {
    console.error('My tasks summary error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/dashboard/projects-by-client
 * Progetti raggruppati per cliente
 */
dashboard.get('/projects-by-client', async (c) => {
  try {
    const user = c.get('user');

    let query = `
      SELECT 
        c.id as client_id,
        c.name as client_name,
        COUNT(p.id) as total_projects,
        SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_projects,
        SUM(CASE WHEN p.status = 'completed' THEN 1 ELSE 0 END) as completed_projects
      FROM clients c
      LEFT JOIN projects p ON c.id = p.client_id
    `;

    const bindings: any[] = [];

    // Filtro per permessi (collaboratori)
    if (user.role !== 'admin') {
      const allowedAreas: string[] = [];
      if (user.permissions.copywriting) allowedAreas.push('copywriting');
      if (user.permissions.video) allowedAreas.push('video');
      if (user.permissions.adv) allowedAreas.push('adv');
      if (user.permissions.grafica) allowedAreas.push('grafica');

      if (allowedAreas.length > 0) {
        query += ` AND (p.area IS NULL OR p.area IN (${allowedAreas.map(() => '?').join(',')}))`;
        bindings.push(...allowedAreas);
      }
    }

    query += ' GROUP BY c.id, c.name ORDER BY active_projects DESC, total_projects DESC';

    const stmt = c.env.DB.prepare(query);
    const { results } = bindings.length > 0
      ? await stmt.bind(...bindings).all()
      : await stmt.all();

    return c.json({ clients: results });
  } catch (error) {
    console.error('Projects by client error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default dashboard;
