import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'aegiscert-fallback-secure-development-secret-key-19028';

/**
 * Hash password with bcrypt cost factor 12
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

/**
 * Compare plain password against bcrypt hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate signed JWT
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Middleware to verify JWT and attach user context to req.user
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired access token.' });
    }
    req.user = user;
    next();
  });
}

/**
 * Middleware to require specific roles
 */
export function requireRoles(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized: insufficient permissions for this operation.' });
    }
    next();
  };
}
