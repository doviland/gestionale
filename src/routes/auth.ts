import { Hono } from 'hono';
import { Bindings, LoginRequest, CreateUserRequest } from '../types';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { authMiddleware, adminOnly } from '../middleware/auth';

const auth = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/auth/login
 * Login utente e generazione JWT token
 */
auth.post('/login', async (c) => {
  try {
    const body: LoginRequest = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Trova utente
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    )
      .bind(email)
      .first();

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verifica password
    const isValid = await comparePassword(password, user.password_hash as string);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Genera token JWT
    const jwtSecret = c.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-123456789';
    const token = await generateToken({ userId: user.id, email: user.email }, jwtSecret);

    // Parse permissions
    const permissions = typeof user.permissions === 'string' 
      ? JSON.parse(user.permissions) 
      : user.permissions;

    // Rimuovi password_hash dalla risposta
    const { password_hash, ...userWithoutPassword } = user;
    const userData = { ...userWithoutPassword, permissions };

    return c.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/auth/me
 * Ottieni informazioni utente corrente
 */
auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({ user });
});

/**
 * POST /api/auth/register
 * Registra nuovo utente (solo admin)
 */
auth.post('/register', authMiddleware, adminOnly, async (c) => {
  try {
    const body: CreateUserRequest = await c.req.json();
    const { email, password, name, role, permissions } = body;

    if (!email || !password || !name || !role) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Verifica se email già esiste
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    )
      .bind(email)
      .first();

    if (existing) {
      return c.json({ error: 'Email already exists' }, 400);
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Inserisci utente
    const result = await c.env.DB.prepare(
      `INSERT INTO users (email, password_hash, name, role, permissions, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`
    )
      .bind(
        email,
        password_hash,
        name,
        role,
        JSON.stringify(permissions || { copywriting: false, video: false, adv: false, grafica: false })
      )
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    // Log activity
    const currentUser = c.get('user');
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'user', ?, 'created', ?)`
    )
      .bind(currentUser.id, result.meta.last_row_id, `Created user: ${name}`)
      .run();

    return c.json({
      message: 'User created successfully',
      id: result.meta.last_row_id
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/auth/users
 * Ottieni lista utenti (solo admin)
 */
auth.get('/users', authMiddleware, adminOnly, async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, email, name, role, permissions, is_active, created_at FROM users ORDER BY created_at DESC'
    ).all();

    const users = results.map(user => ({
      ...user,
      permissions: typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : user.permissions
    }));

    return c.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * PUT /api/auth/users/:id
 * Aggiorna utente (solo admin)
 */
auth.put('/users/:id', authMiddleware, adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const { name, role, permissions, is_active } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (permissions !== undefined) {
      updates.push('permissions = ?');
      values.push(JSON.stringify(permissions));
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
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    )
      .bind(...values)
      .run();

    if (!result.success) {
      return c.json({ error: 'Failed to update user' }, 500);
    }

    // Log activity
    const currentUser = c.get('user');
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'user', ?, 'updated', ?)`
    )
      .bind(currentUser.id, id, `Updated user settings`)
      .run();

    return c.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * DELETE /api/auth/users/:id
 * Elimina utente (solo admin)
 */
auth.delete('/users/:id', adminOnly, async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');
    
    // Non puoi eliminare te stesso
    if (parseInt(id) === currentUser.id) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }
    
    // Verifica che l'utente esista
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    )
      .bind(id)
      .first();
    
    if (!existing) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Elimina utente
    const result = await c.env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    )
      .bind(id)
      .run();
    
    if (!result.success) {
      return c.json({ error: 'Failed to delete user' }, 500);
    }
    
    // Log activity
    await c.env.DB.prepare(
      `INSERT INTO activity_log (user_id, entity_type, entity_id, action, details)
       VALUES (?, 'user', ?, 'deleted', ?)`
    )
      .bind(currentUser.id, id, 'Deleted user')
      .run();
    
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default auth;
