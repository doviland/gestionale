import { Context, Next } from 'hono';
import { Bindings, Variables } from '../types';
import { verifyToken } from '../utils/auth';

/**
 * Authentication middleware
 * Verifica il token JWT e carica l'utente nel context
 */
export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing token' }, 401);
  }

  const token = authHeader.substring(7);
  const jwtSecret = c.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-123456789';

  try {
    const decoded = await verifyToken(token, jwtSecret);
    
    // Carica utente dal database
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, role, permissions, is_active FROM users WHERE id = ? AND is_active = 1'
    )
      .bind(decoded.userId)
      .first();

    if (!user) {
      return c.json({ error: 'Unauthorized: User not found' }, 401);
    }

    // Parse permissions JSON
    const userData = {
      ...user,
      permissions: typeof user.permissions === 'string' 
        ? JSON.parse(user.permissions) 
        : user.permissions
    };

    c.set('user', userData as any);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
}

/**
 * Admin-only middleware
 * Verifica che l'utente sia un amministratore
 */
export async function adminOnly(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const user = c.get('user');
  
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden: Admin access required' }, 403);
  }

  await next();
}

/**
 * Check area permission middleware
 * Verifica che l'utente abbia permessi per una specifica area
 */
export function requireAreaPermission(area: string) {
  return async (
    c: Context<{ Bindings: Bindings; Variables: Variables }>,
    next: Next
  ) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Admin ha sempre tutti i permessi
    if (user.role === 'admin') {
      await next();
      return;
    }

    // Verifica permessi per l'area specifica
    const permissions = user.permissions;
    if (!permissions || !permissions[area]) {
      return c.json({ 
        error: `Forbidden: No permission for area '${area}'` 
      }, 403);
    }

    await next();
  };
}
