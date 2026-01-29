import { Hono } from 'hono';
import { Bindings, Variables, CreateTaskRequest, UpdateTaskRequest } from '../types';
import { authMiddleware } from '../middleware/auth';
import { hasPermission } from '../utils/auth';

const tasks = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Tutte le routes richiedono autenticazione
tasks.use('/*', authMiddleware);

/**
 * GET /api/tasks
 * Ottieni lista task con filtri
 */
tasks.get('/', async (c) => {
  try {
    const user = c.get('user');
    const projectId = c.req.query('project_id');
    const assignedTo = c.req.query('assigned_to');
    const status = c.req.query('status');
    const area = c.req.query('area');
    const month = c.req.query('month'); // YYYY-MM

    let query = `
      SELECT t.*, p.name as project_name, p.client_id, c.name as client_name,
             u.name as assigned_to_name, creator.name as created_by_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
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
        query += ` AND t.area IN (${allowedAreas.map(() => '?').join(',')})`;
        bindings.push(...allowedAreas);
      } else {
        return c.json({ tasks: [] });
      }
    }

    if (projectId) {
      query += ' AND t.project_id = ?';
      bindings.push(projectId);
    }
    if (assignedTo) {
      query += ' AND t.assigned_to = ?';
      bindings.push(assignedTo);
    }
    if (status) {
      query += ' AND t.status = ?';
      bindings.push(status);
    }
    if (area) {
      query += ' AND t.area = ?';
      bindings.push(area);
    }
    if (month) {
      // Filtra per mese (es: '2026-01')
      query += " AND strftime('%Y-%m', t.created_at) = ?";
      bindings.push(month);
    }

    query += ' ORDER BY t.priority DESC, t.due_date ASC, t.created_at DESC';

    const stmt = c.env.DB.prepare(query);
    const { results } = bindings.length > 0 
      ? await stmt.bind(...bindings).all()
      : await stmt.all();

    return c.json({ tasks: results });
  } catch (error) {
    console.error('Get tasks error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/tasks/my
 * Ottieni task assegnate all'utente corrente
 */
tasks.get('/my', async (c) => {
  try {
    const user = c.get('user');
    const status = c.req.query('status');

    let query = `
      SELECT t.*, p.name as project_name, c.name as client_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE t.assigned_to = ?
    `;
    
    const bindings: any[] = [user.id];

    if (status) {
      query += ' AND t.status = ?';
      bindings.push(status);
    }

    query += ' ORDER BY t.priority DESC, t.due_date ASC';

    const { results } = await c.env.DB.prepare(query).bind(...bindings).all();

    return c.json({ tasks: results });
  } catch (error) {
    console.error('Get my tasks error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/tasks/:id
 * Ottieni dettagli task specifica
 */
tasks.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    const task = await c.env.DB.prepare(
      `SELECT t.*, p.name as project_name, p.area as project_area, 
              c.name as client_name, u.name as assigned_to_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = ?`
    )
      .bind(id)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verifica permessi area
    if (user.role !== 'admin' && !hasPermission(user, task.area as string)) {
      return c.json({ error: 'Forbidden: No permission for this area' }, 403);
    }

    return c.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/tasks
 * Crea nuova task
 */
tasks.post('/', async (c) => {
  try {
    const body: CreateTaskRequest = await c.req.json();
    const user = c.get('user');
    const { 
      project_id, title, description, area, assigned_to, 
      status, priority, due_date, estimated_hours, notes 
    } = body;

    if (!project_id || !title || !area) {
      return c.json({ error: 'project_id, title, and area are required' }, 400);
    }

    // Verifica permessi area
    if (user.role !== 'admin' && !hasPermission(user, area)) {
      return c.json({ error: 'Forbidden: No permission for this area' }, 403);
    }

    // Verifica che il progetto esista
    const project = await c.env.DB.prepare(
      'SELECT id FROM projects WHERE id = ?'
    )
      .bind(project_id)
      .first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Crea task
    const result = await c.env.DB.prepare(
      `INSERT INTO tasks (
        project_id, title, description, area, assigned_to, 
        status, priority, due_date, estimated_hours, notes, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        project_id,
        title,
        description || null,
        area,
        assigned_to || null,
        status || 'pending',
        priority || 'medium',
        due_date || null,
        estimated_hours || null,
        notes || null,
        user.id
      )
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to create task' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'task', ?, 'created', ?)`
    )
      .bind(user.id, result.meta.last_row_id, `Created task: ${title}`)
      .run();

    // Se assegnata, log anche l'assegnazione
    if (assigned_to) {
      await c.env.DB.prepare(
        `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
         VALUES (?, 'task', ?, 'assigned', ?)`
      )
        .bind(user.id, result.meta.last_row_id, `Assigned task to user ${assigned_to}`)
        .run();
    }

    return c.json({
      message: 'Task created successfully',
      id: result.meta.last_row_id
    }, 201);
  } catch (error) {
    console.error('Create task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /api/tasks/:id
 * Aggiorna task
 */
tasks.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body: UpdateTaskRequest = await c.req.json();
    const user = c.get('user');

    // Verifica che la task esista e prendi area
    const existing = await c.env.DB.prepare(
      'SELECT area, status, assigned_to FROM tasks WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!existing) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verifica permessi area
    if (user.role !== 'admin' && !hasPermission(user, existing.area as string)) {
      return c.json({ error: 'Forbidden: No permission for this area' }, 403);
    }

    const { 
      title, description, area, assigned_to, status, 
      priority, due_date, completed_at, estimated_hours, notes 
    } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let statusChanged = false;
    let assignmentChanged = false;

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
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
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(assigned_to || null);
      if (assigned_to !== existing.assigned_to) {
        assignmentChanged = true;
      }
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      if (status !== existing.status) {
        statusChanged = true;
      }
      // Se completata, imposta completed_at
      if (status === 'completed' && !completed_at) {
        updates.push('completed_at = CURRENT_TIMESTAMP');
      }
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date || null);
    }
    if (completed_at !== undefined) {
      updates.push('completed_at = ?');
      values.push(completed_at || null);
    }
    if (estimated_hours !== undefined) {
      updates.push('estimated_hours = ?');
      values.push(estimated_hours || null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes || null);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await c.env.DB.prepare(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to update task' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'task', ?, 'updated', ?)`
    )
      .bind(user.id, id, 'Updated task')
      .run();

    // Log specifici per cambio status o assegnazione
    if (statusChanged && status === 'completed') {
      await c.env.DB.prepare(
        `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
         VALUES (?, 'task', ?, 'completed', ?)`
      )
        .bind(user.id, id, 'Task completed')
        .run();
    }

    if (assignmentChanged && assigned_to) {
      await c.env.DB.prepare(
        `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
         VALUES (?, 'task', ?, 'assigned', ?)`
      )
        .bind(user.id, id, `Assigned task to user ${assigned_to}`)
        .run();
    }

    return c.json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Update task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/tasks/:id
 * Elimina task
 */
tasks.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    // Verifica permessi
    const task = await c.env.DB.prepare(
      'SELECT area FROM tasks WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    if (user.role !== 'admin' && !hasPermission(user, task.area as string)) {
      return c.json({ error: 'Forbidden: No permission for this area' }, 403);
    }

    const result = await c.env.DB.prepare(
      'DELETE FROM tasks WHERE id = ?'
    )
      .bind(id)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to delete task' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'task', ?, 'deleted', ?)`
    )
      .bind(user.id, id, 'Deleted task')
      .run();

    return c.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/tasks/:id/toggle
 * Toggle task status (pending <-> completed) - quick action
 */
tasks.post('/:id/toggle', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    const task = await c.env.DB.prepare(
      'SELECT status, area FROM tasks WHERE id = ?'
    )
      .bind(id)
      .first();

    if (!task) {
      return c.json({ error: 'Task not found' }, 404);
    }

    // Verifica permessi
    if (user.role !== 'admin' && !hasPermission(user, task.area as string)) {
      return c.json({ error: 'Forbidden: No permission for this area' }, 403);
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    const completedAt = newStatus === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL';

    await c.env.DB.prepare(
      `UPDATE tasks SET status = ?, completed_at = ${completedAt}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    )
      .bind(newStatus, id)
      .run();

    // Log activity
    if (newStatus === 'completed') {
      await c.env.DB.prepare(
        `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
         VALUES (?, 'task', ?, 'completed', ?)`
      )
        .bind(user.id, id, 'Task marked as completed')
        .run();
    }

    return c.json({ 
      message: 'Task status toggled',
      new_status: newStatus
    });
  } catch (error) {
    console.error('Toggle task error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default tasks;
