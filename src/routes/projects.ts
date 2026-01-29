import { Hono } from 'hono';
import { Bindings, Variables, CreateProjectRequest } from '../types';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { hasPermission, formatDate, addMonths } from '../utils/auth';

const projects = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Tutte le routes richiedono autenticazione
projects.use('/*', authMiddleware);

/**
 * GET /api/projects
 * Ottieni lista progetti con filtri
 */
projects.get('/', async (c) => {
  try {
    const user = c.get('user');
    const clientId = c.req.query('client_id');
    const area = c.req.query('area');
    const status = c.req.query('status');

    let query = `
      SELECT p.*, c.name as client_name, u.name as created_by_name,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
             (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    
    const bindings: any[] = [];

    // Filtro per permessi area (collaboratori)
    if (user.role !== 'admin') {
      const allowedAreas: string[] = [];
      if (user.permissions.copywriting) allowedAreas.push('copywriting');
      if (user.permissions.video) allowedAreas.push('video');
      if (user.permissions.adv) allowedAreas.push('adv');
      if (user.permissions.grafica) allowedAreas.push('grafica');

      if (allowedAreas.length > 0) {
        query += ` AND p.area IN (${allowedAreas.map(() => '?').join(',')})`;
        bindings.push(...allowedAreas);
      } else {
        // Nessun permesso, non può vedere nulla
        return c.json({ projects: [] });
      }
    }

    if (clientId) {
      query += ' AND p.client_id = ?';
      bindings.push(clientId);
    }
    if (area) {
      query += ' AND p.area = ?';
      bindings.push(area);
    }
    if (status) {
      query += ' AND p.status = ?';
      bindings.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const stmt = c.env.DB.prepare(query);
    const { results } = bindings.length > 0 
      ? await stmt.bind(...bindings).all()
      : await stmt.all();

    return c.json({ projects: results });
  } catch (error) {
    console.error('Get projects error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/projects/:id
 * Ottieni dettagli progetto con task
 */
projects.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    const project = await c.env.DB.prepare(
      `SELECT p.*, c.name as client_name, c.email as client_email,
              u.name as created_by_name,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as total_tasks,
              (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'completed') as completed_tasks
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`
    )
      .bind(id)
      .first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verifica permessi area
    if (user.role !== 'admin' && !hasPermission(user, project.area)) {
      return c.json({ error: 'Forbidden: No permission for this area' }, 403);
    }

    // Carica task del progetto
    const { results: tasks } = await c.env.DB.prepare(
      `SELECT t.*, u.name as assigned_to_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.priority DESC, t.due_date ASC`
    )
      .bind(id)
      .all();

    // Carica configurazione ricorrenza se esiste
    const recurrence = await c.env.DB.prepare(
      'SELECT * FROM task_recurrence WHERE project_id = ? AND is_active = 1'
    )
      .bind(id)
      .first();

    return c.json({ 
      project,
      tasks,
      recurrence
    });
  } catch (error) {
    console.error('Get project error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/projects
 * Crea nuovo progetto (opzionalmente da template)
 */
projects.post('/', async (c) => {
  try {
    const body: CreateProjectRequest = await c.req.json();
    const user = c.get('user');
    const { client_id, template_id, name, description, area, status, start_date, end_date } = body;

    if (!client_id || !name || !area) {
      return c.json({ error: 'client_id, name, and area are required' }, 400);
    }

    // Verifica permessi area
    if (user.role !== 'admin' && !hasPermission(user, area)) {
      return c.json({ error: 'Forbidden: No permission for this area' }, 403);
    }

    // Verifica che il cliente esista
    const client = await c.env.DB.prepare(
      'SELECT id FROM clients WHERE id = ?'
    )
      .bind(client_id)
      .first();

    if (!client) {
      return c.json({ error: 'Client not found' }, 404);
    }

    // Crea progetto
    const projectResult = await c.env.DB.prepare(
      `INSERT INTO projects (client_id, template_id, name, description, area, status, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        client_id,
        template_id || null,
        name,
        description || null,
        area,
        status || 'active',
        start_date || null,
        end_date || null,
        user.id
      )
      .run();

    if (!projectResult.success) {
      return c.json({ error: 'Failed to create project' }, 500);
    }

    const projectId = projectResult.meta.last_row_id;

    // Se c'è un template, crea le task dal template
    if (template_id) {
      const template = await c.env.DB.prepare(
        'SELECT default_tasks FROM project_templates WHERE id = ? AND is_active = 1'
      )
        .bind(template_id)
        .first();

      if (template && template.default_tasks) {
        const defaultTasks = typeof template.default_tasks === 'string'
          ? JSON.parse(template.default_tasks)
          : template.default_tasks;

        // Crea task per ogni task del template
        for (const taskTemplate of defaultTasks) {
          await c.env.DB.prepare(
            `INSERT INTO tasks (project_id, title, description, area, status, priority, estimated_hours, created_by)
             VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`
          )
            .bind(
              projectId,
              taskTemplate.title,
              taskTemplate.description || null,
              area,
              taskTemplate.priority || 'medium',
              taskTemplate.estimated_hours || null,
              user.id
            )
            .run();
        }
      }
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'project', ?, 'created', ?)`
    )
      .bind(user.id, projectId, `Created project: ${name}`)
      .run();

    return c.json({
      message: 'Project created successfully',
      id: projectId
    }, 201);
  } catch (error) {
    console.error('Create project error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /api/projects/:id
 * Aggiorna progetto
 */
projects.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const user = c.get('user');

    // Verifica che il progetto esista
    const existing = await c.env.DB.prepare(
      'SELECT area FROM projects WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verifica permessi area
    if (user.role !== 'admin' && !hasPermission(user, existing.area as string)) {
      return c.json({ error: 'Forbidden: No permission for this area' }, 403);
    }

    const { name, description, area, status, start_date, end_date } = body;
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }
    if (area !== undefined) {
      // Verifica permessi per la nuova area
      if (user.role !== 'admin' && !hasPermission(user, area)) {
        return c.json({ error: 'Forbidden: No permission for this area' }, 403);
      }
      updates.push('area = ?');
      values.push(area);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date || null);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date || null);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await c.env.DB.prepare(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to update project' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'project', ?, 'updated', ?)`
    )
      .bind(user.id, id, 'Updated project')
      .run();

    return c.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/projects/:id
 * Elimina progetto (solo admin)
 */
projects.delete('/:id', adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    // Elimina progetto (cascade elimina anche le task)
    const result = await c.env.DB.prepare(
      'DELETE FROM projects WHERE id = ?'
    )
      .bind(id)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to delete project' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'project', ?, 'deleted', ?)`
    )
      .bind(user.id, id, 'Deleted project')
      .run();

    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/projects/:id/recurrence
 * Configura ricorrenza automatica task (mensile/trimestrale)
 */
projects.post('/:id/recurrence', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const user = c.get('user');
    const { frequency } = body; // 'monthly' | 'quarterly'

    if (!frequency || !['monthly', 'quarterly', 'yearly'].includes(frequency)) {
      return c.json({ 
        error: 'Valid frequency required (monthly, quarterly, yearly)' 
      }, 400);
    }

    // Verifica che il progetto esista
    const project = await c.env.DB.prepare(
      'SELECT area FROM projects WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Verifica permessi
    if (user.role !== 'admin' && !hasPermission(user, project.area as string)) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    // Calcola next_execution_date
    const nextDate = new Date();
    if (frequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (frequency === 'quarterly') {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (frequency === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    // Verifica se esiste già una configurazione
    const existing = await c.env.DB.prepare(
      'SELECT id FROM task_recurrence WHERE project_id = ?'
    )
      .bind(id)
      .first();

    if (existing) {
      // Aggiorna esistente
      await c.env.DB.prepare(
        `UPDATE task_recurrence 
         SET frequency = ?, next_execution_date = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
         WHERE project_id = ?`
      )
        .bind(frequency, formatDate(nextDate), id)
        .run();
    } else {
      // Crea nuova
      await c.env.DB.prepare(
        `INSERT INTO task_recurrence (project_id, frequency, next_execution_date, is_active)
         VALUES (?, ?, ?, 1)`
      )
        .bind(id, frequency, formatDate(nextDate))
        .run();
    }

    return c.json({
      message: 'Recurrence configured successfully',
      next_execution_date: formatDate(nextDate)
    });
  } catch (error) {
    console.error('Configure recurrence error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default projects;
