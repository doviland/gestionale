import { Hono } from 'hono';
import { Bindings, Variables, CreateTemplateRequest } from '../types';
import { authMiddleware, adminOnly } from '../middleware/auth';

const templates = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Tutte le routes richiedono autenticazione
templates.use('/*', authMiddleware);

/**
 * GET /api/templates
 * Ottieni lista template
 */
templates.get('/', async (c) => {
  try {
    const area = c.req.query('area'); // Filtra per area opzionale
    
    let query = `
      SELECT t.*, u.name as created_by_name
      FROM project_templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.is_active = 1
    `;
    
    const bindings: any[] = [];
    if (area) {
      query += ' AND t.area = ?';
      bindings.push(area);
    }
    
    query += ' ORDER BY t.created_at DESC';

    const stmt = c.env.DB.prepare(query);
    const { results } = bindings.length > 0 
      ? await stmt.bind(...bindings).all()
      : await stmt.all();

    // Parse default_tasks JSON
    const templatesWithParsedTasks = results.map(template => ({
      ...template,
      default_tasks: typeof template.default_tasks === 'string'
        ? JSON.parse(template.default_tasks)
        : template.default_tasks
    }));

    return c.json({ templates: templatesWithParsedTasks });
  } catch (error) {
    console.error('Get templates error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/templates/:id
 * Ottieni dettagli template specifico
 */
templates.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const template = await c.env.DB.prepare(
      `SELECT t.*, u.name as created_by_name
       FROM project_templates t
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = ? AND t.is_active = 1`
    )
      .bind(id)
      .first();

    if (!template) {
      return c.json({ error: 'Template not found' }, 404);
    }

    // Parse default_tasks JSON
    const templateWithParsedTasks = {
      ...template,
      default_tasks: typeof template.default_tasks === 'string'
        ? JSON.parse(template.default_tasks)
        : template.default_tasks
    };

    return c.json({ template: templateWithParsedTasks });
  } catch (error) {
    console.error('Get template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/templates
 * Crea nuovo template (solo admin)
 */
templates.post('/', adminOnly, async (c) => {
  try {
    const body: CreateTemplateRequest = await c.req.json();
    const user = c.get('user');
    const { name, description, area, default_tasks } = body;

    if (!name || !area || !default_tasks || !Array.isArray(default_tasks)) {
      return c.json({ 
        error: 'Name, area, and default_tasks (array) are required' 
      }, 400);
    }

    // Valida area
    const validAreas = ['copywriting', 'video', 'adv', 'grafica'];
    if (!validAreas.includes(area)) {
      return c.json({ error: 'Invalid area' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO project_templates (name, description, area, default_tasks, is_active, created_by)
       VALUES (?, ?, ?, ?, 1, ?)`
    )
      .bind(
        name,
        description || null,
        area,
        JSON.stringify(default_tasks),
        user.id
      )
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to create template' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'template', ?, 'created', ?)`
    )
      .bind(user.id, result.meta.last_row_id, `Created template: ${name}`)
      .run();

    return c.json({
      message: 'Template created successfully',
      id: result.meta.last_row_id
    }, 201);
  } catch (error) {
    console.error('Create template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /api/templates/:id
 * Aggiorna template (solo admin)
 */
templates.put('/:id', adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const user = c.get('user');
    const { name, description, area, default_tasks, is_active } = body;

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
      const validAreas = ['copywriting', 'video', 'adv', 'grafica'];
      if (!validAreas.includes(area)) {
        return c.json({ error: 'Invalid area' }, 400);
      }
      updates.push('area = ?');
      values.push(area);
    }
    if (default_tasks !== undefined) {
      if (!Array.isArray(default_tasks)) {
        return c.json({ error: 'default_tasks must be an array' }, 400);
      }
      updates.push('default_tasks = ?');
      values.push(JSON.stringify(default_tasks));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await c.env.DB.prepare(
      `UPDATE project_templates SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to update template' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'template', ?, 'updated', ?)`
    )
      .bind(user.id, id, 'Updated template')
      .run();

    return c.json({ message: 'Template updated successfully' });
  } catch (error) {
    console.error('Update template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/templates/:id
 * Elimina template (soft delete - solo admin)
 */
templates.delete('/:id', adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    // Soft delete: imposta is_active = 0
    const result = await c.env.DB.prepare(
      'UPDATE project_templates SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    )
      .bind(id)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to delete template' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'template', ?, 'deleted', ?)`
    )
      .bind(user.id, id, 'Deleted template')
      .run();

    return c.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default templates;
