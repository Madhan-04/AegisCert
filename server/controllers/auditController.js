import { getDbConnection } from '../config/database.js';
import crypto from 'crypto';

export async function getAll(req, res, next) {
  try {
    const db = await getDbConnection();
    let logs = [];
    if (req.user.role === 'admin') {
      logs = await db.all('SELECT * FROM audit_logs WHERE deletedAt IS NULL ORDER BY createdAt DESC');
    } else if (req.user.role === 'institution') {
      // Show logs concerning users of their institution or certificates issued by them
      logs = await db.all(
        `SELECT a.* FROM audit_logs a 
         LEFT JOIN users u ON a.userId = u.id 
         WHERE (u.institutionId = ? OR a.createdBy = ?) AND a.deletedAt IS NULL 
         ORDER BY a.createdAt DESC`,
        [req.user.institutionId, req.user.username]
      );
    } else {
      logs = await db.all('SELECT * FROM audit_logs WHERE userId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [req.user.id]);
    }
    return res.sendSuccess(logs);
  } catch (e) {
    next(e);
  }
}

export async function write(req, res, next) {
  try {
    const { action, details, riskScore } = req.body;
    const db = await getDbConnection();
    const id = crypto.randomUUID();
    await db.run(
      `INSERT INTO audit_logs (id, userId, userName, userRole, action, details, riskScore, ipAddress, deviceFingerprint, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        req.user.name,
        req.user.role,
        action,
        details,
        riskScore || 0,
        req.ip || '127.0.0.1',
        req.headers['user-agent'] || 'unknown',
        req.user.username
      ]
    );
    const newLog = await db.get('SELECT * FROM audit_logs WHERE id = ?', [id]);
    return res.sendSuccess(newLog);
  } catch (e) {
    next(e);
  }
}
