import * as bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token (manual implementation for Cloudflare Workers)
 * Using simple base64 encoding for demo - in production use proper JWT libraries
 */
export async function generateToken(payload: any, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60), // 7 days
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(jwtPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  // Create signature using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureInput);
  const keyData = encoder.encode(secret);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string, secret: string): Promise<any> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error('Invalid token format');
    }

    // Verify signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureInput);
    const keyData = encoder.encode(secret);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Decode signature
    const signatureBytes = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')),
      c => c.charCodeAt(0)
    );
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes,
      data
    );
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }

    // Decode payload
    const payload = JSON.parse(atob(encodedPayload));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format datetime to ISO string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Add months to a date
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Check if user has permission for an area
 */
export function hasPermission(user: any, area: string): boolean {
  if (user.role === 'admin') return true;
  if (!user.permissions) return false;
  return user.permissions[area] === true;
}
