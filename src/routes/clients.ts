import { Hono } from 'hono';
import { Bindings, Variables, CreateClientRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

const clients = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Tutte le routes richiedono autenticazione
clients.use('/*', authMiddleware);

/**
 * GET /api/clients
 * Ottieni lista clienti
 */
clients.get('/', async (c) => {
  try {
    const user = c.get('user');
    
    // Admin vede tutti i clienti, collaboratori solo i loro
    let query = `
      SELECT c.*, u.name as created_by_name
      FROM clients c
      LEFT JOIN users u ON c.created_by = u.id
    `;
    
    if (user.role !== 'admin') {
      query += ' WHERE c.created_by = ?';
    }
    
    query += ' ORDER BY c.created_at DESC';

    const stmt = c.env.DB.prepare(query);
    const { results } = user.role === 'admin' 
      ? await stmt.all()
      : await stmt.bind(user.id).all();

    return c.json({ clients: results });
  } catch (error) {
    console.error('Get clients error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/clients/:id
 * Ottieni dettagli cliente specifico
 */
clients.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    let query = `
      SELECT c.*, u.name as created_by_name,
             (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as projects_count,
             (SELECT COUNT(*) FROM projects WHERE client_id = c.id AND status = 'active') as active_projects_count
      FROM clients c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `;

    // Collaboratori possono vedere solo i loro clienti
    if (user.role !== 'admin') {
      query += ' AND c.created_by = ?';
    }

    const stmt = c.env.DB.prepare(query);
    const client = user.role === 'admin'
      ? await stmt.bind(id).first()
      : await stmt.bind(id, user.id).first();

    if (!client) {
      return c.json({ error: 'Client not found' }, 404);
    }

    return c.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/clients
 * Crea nuovo cliente
 */
clients.post('/', async (c) => {
  try {
    const body: CreateClientRequest = await c.req.json();
    const user = c.get('user');
    const { name, email, phone, company, notes, status } = body;

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    const result = await c.env.DB.prepare(
      `INSERT INTO clients (name, email, phone, company, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        name,
        email || null,
        phone || null,
        company || null,
        notes || null,
        status || 'active',
        user.id
      )
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to create client' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'client', ?, 'created', ?)`
    )
      .bind(user.id, result.meta.last_row_id, `Created client: ${name}`)
      .run();

    return c.json({
      message: 'Client created successfully',
      id: result.meta.last_row_id
    }, 201);
  } catch (error) {
    console.error('Create client error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /api/clients/:id
 * Aggiorna cliente
 */
clients.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const user = c.get('user');

    // Verifica permessi
    if (user.role !== 'admin') {
      const client = await c.env.DB.prepare(
        'SELECT created_by FROM clients WHERE id = ?'
      )
        .bind(id)
        .first();

      if (!client || client.created_by !== user.id) {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }

    const { name, email, phone, company, notes, status } = body;
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email || null);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone || null);
    }
    if (company !== undefined) {
      updates.push('company = ?');
      values.push(company || null);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes || null);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await c.env.DB.prepare(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to update client' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'client', ?, 'updated', ?)`
    )
      .bind(user.id, id, 'Updated client information')
      .run();

    return c.json({ message: 'Client updated successfully' });
  } catch (error) {
    console.error('Update client error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/clients/:id
 * Elimina cliente (solo admin)
 */
clients.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    if (user.role !== 'admin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    // Verifica se ha progetti associati
    const projects = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM projects WHERE client_id = ?'
    )
      .bind(id)
      .first();

    if (projects && projects.count > 0) {
      return c.json({ 
        error: 'Cannot delete client with associated projects' 
      }, 400);
    }

    const result = await c.env.DB.prepare(
      'DELETE FROM clients WHERE id = ?'
    )
      .bind(id)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to delete client' }, 500);
    }

    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'client', ?, 'deleted', ?)`
    )
      .bind(user.id, id, 'Deleted client')
      .run();

    return c.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default clients;
