import { verifyAccessToken } from '../config/jwt.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Authentication token required.',
      error: 'UNAUTHORIZED'
    });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Invalid or expired session token.',
      error: 'EXPIRED_TOKEN'
    });
  }

  req.user = decoded;
  next();
}
