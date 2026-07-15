import { Router } from 'express';
import crypto from 'crypto';
import { getDbConnection } from '../config/database.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Allowed tables for generic CRUD mapping (excluding core auth / user operations which have specific controllers)
const CRUD_TABLES = [
  'institutions', 'certificates', 'audit_logs', 'blockchain_ledger',
  'fraud_reports', 'soc_events', 'notifications', 'sessions', 'otp',
  'biometrics', 'fingerprint_templates', 'support_tickets', 'backups',
  'api_keys', 'campuses', 'departments', 'help_articles', 'faqs',
  'troubleshooting_guides', 'recent_searches', 'feedback'
];

function validateTableName(req, res, next) {
  const table = req.params.table;
  if (!CRUD_TABLES.includes(table)) {
    return res.status(404).json({
      success: false,
      message: `Table "${table}" is either protected or does not exist.`,
      error: 'TABLE_NOT_FOUND'
    });
  }
  next();
}

// 1. GET ALL
router.get('/:table', authenticate, validateTableName, async (req, res, next) => {
  try {
    const table = req.params.table;
    const db = await getDbConnection();
    
    let query = `SELECT * FROM ${table} WHERE deletedAt IS NULL`;
    const params = [];

    // Tenant Isolation logic
    if (req.user.role !== 'admin') {
      const tableInfo = await db.all(`PRAGMA table_info(${table})`);
      const hasInstId = tableInfo.some(col => col.name === 'institutionId');
      const hasUserId = tableInfo.some(col => col.name === 'userId');

      if (hasInstId && req.user.institutionId) {
        query += ` AND institutionId = ?`;
        params.push(req.user.institutionId);
      } else if (hasUserId) {
        query += ` AND userId = ?`;
        params.push(req.user.id);
      }
    }

    if (table === 'blockchain_ledger') {
      query += ` ORDER BY number ASC`;
    } else {
      query += ` ORDER BY createdAt DESC`;
    }

    const rows = await db.all(query, params);
    
    // Parse JSON fields where applicable
    const parsed = rows.map(row => {
      const copy = { ...row };
      if (copy.statusHistory) {
        try { copy.statusHistory = JSON.parse(copy.statusHistory); } catch (e) {}
      }
      if (copy.transactions) {
        try { copy.transactions = JSON.parse(copy.transactions); } catch (e) {}
      }
      if (copy.replies) {
        try { copy.replies = JSON.parse(copy.replies); } catch (e) {}
      }
      if (copy.keywords) {
        try { copy.keywords = JSON.parse(copy.keywords); } catch (e) {}
      }
      if (copy.relatedRoutes) {
        try { copy.relatedRoutes = JSON.parse(copy.relatedRoutes); } catch (e) {}
      }
      return copy;
    });

    return res.sendSuccess(parsed);
  } catch (e) {
    next(e);
  }
});

// 2. GET BY ID
router.get('/:table/:id', authenticate, validateTableName, async (req, res, next) => {
  try {
    const { table, id } = req.params;
    const db = await getDbConnection();

    const row = await db.get(`SELECT * FROM ${table} WHERE id = ? AND deletedAt IS NULL`, [id]);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Resource not found.', error: 'NOT_FOUND' });
    }

    // Tenant Isolation
    if (req.user.role !== 'admin') {
      if (row.institutionId && row.institutionId !== req.user.institutionId) {
        return res.status(403).json({ success: false, message: 'Tenant isolation violation.', error: 'FORBIDDEN' });
      }
      if (row.userId && row.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Resource ownership mismatch.', error: 'FORBIDDEN' });
      }
    }

    if (row.statusHistory) {
      try { row.statusHistory = JSON.parse(row.statusHistory); } catch (e) {}
    }
    if (row.transactions) {
      try { row.transactions = JSON.parse(row.transactions); } catch (e) {}
    }
    if (row.replies) {
      try { row.replies = JSON.parse(row.replies); } catch (e) {}
    }
    if (row.keywords) {
      try { row.keywords = JSON.parse(row.keywords); } catch (e) {}
    }
    if (row.relatedRoutes) {
      try { row.relatedRoutes = JSON.parse(row.relatedRoutes); } catch (e) {}
    }

    return res.sendSuccess(row);
  } catch (e) {
    next(e);
  }
});

// 3. CREATE
router.post('/:table', authenticate, validateTableName, async (req, res, next) => {
  const db = await getDbConnection();
  await db.exec('BEGIN TRANSACTION;');

  try {
    const table = req.params.table;
    const payload = { ...req.body };

    // Standard columns inject
    if (!payload.id) {
      payload.id = crypto.randomUUID();
    }
    payload.createdBy = req.user.username;
    payload.createdAt = new Date().toISOString();
    payload.updatedAt = new Date().toISOString();

    // Force institution ID constraints for tenant routes
    if (req.user.role !== 'admin' && req.user.institutionId) {
      const tableInfo = await db.all(`PRAGMA table_info(${table})`);
      const hasInstId = tableInfo.some(col => col.name === 'institutionId');
      if (hasInstId) {
        payload.institutionId = req.user.institutionId;
      }
    }

    // Convert object fields to JSON strings
    const stringifyFields = ['statusHistory', 'transactions', 'replies', 'keywords', 'relatedRoutes'];
    for (const f of stringifyFields) {
      if (payload[f] !== undefined && typeof payload[f] !== 'string') {
        payload[f] = JSON.stringify(payload[f]);
      }
    }

    const columns = Object.keys(payload);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(payload);

    await db.run(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    );

    // Audit Log insert
    if (table !== 'audit_logs') {
      const auditId = crypto.randomUUID();
      await db.run(
        `INSERT INTO audit_logs (id, userId, userName, userRole, action, details, riskScore, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          req.user.id,
          req.user.name,
          req.user.role,
          `${table.toUpperCase()}_CREATE`,
          `Created entry ${payload.id} in ${table}`,
          2,
          req.user.username
        ]
      );
    }

    await db.exec('COMMIT;');
    
    const created = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [payload.id]);
    return res.sendSuccess(created);
  } catch (err) {
    await db.exec('ROLLBACK;');
    next(err);
  }
});

// 4. UPDATE
router.patch('/:table/:id', authenticate, validateTableName, async (req, res, next) => {
  const db = await getDbConnection();
  await db.exec('BEGIN TRANSACTION;');

  try {
    const { table, id } = req.params;
    const payload = { ...req.body };

    const existing = await db.get(`SELECT * FROM ${table} WHERE id = ? AND deletedAt IS NULL`, [id]);
    if (!existing) {
      await db.exec('ROLLBACK;');
      return res.status(404).json({ success: false, message: 'Resource not found.', error: 'NOT_FOUND' });
    }

    // Tenant Check
    if (req.user.role !== 'admin') {
      if (existing.institutionId && existing.institutionId !== req.user.institutionId) {
        await db.exec('ROLLBACK;');
        return res.status(403).json({ success: false, message: 'Tenant isolation violation.', error: 'FORBIDDEN' });
      }
      if (existing.userId && existing.userId !== req.user.id) {
        await db.exec('ROLLBACK;');
        return res.status(403).json({ success: false, message: 'Resource ownership violation.', error: 'FORBIDDEN' });
      }
    }

    // Convert object fields to JSON strings
    const stringifyFields = ['statusHistory', 'transactions', 'replies', 'keywords', 'relatedRoutes'];
    for (const f of stringifyFields) {
      if (payload[f] !== undefined && typeof payload[f] !== 'string') {
        payload[f] = JSON.stringify(payload[f]);
      }
    }

    // Ensure metadata columns are handled
    payload.updatedAt = new Date().toISOString();
    delete payload.id;
    delete payload.createdAt;
    delete payload.createdBy;

    const fields = Object.keys(payload).map(col => `${col} = ?`).join(', ');
    const values = Object.values(payload);
    values.push(id);

    await db.run(
      `UPDATE ${table} SET ${fields} WHERE id = ?`,
      values
    );

    // Audit Log insert
    if (table !== 'audit_logs') {
      const auditId = crypto.randomUUID();
      await db.run(
        `INSERT INTO audit_logs (id, userId, userName, userRole, action, details, riskScore, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          req.user.id,
          req.user.name,
          req.user.role,
          `${table.toUpperCase()}_UPDATE`,
          `Updated entry ${id} in ${table}`,
          4,
          req.user.username
        ]
      );
    }

    await db.exec('COMMIT;');
    const updated = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return res.sendSuccess(updated);
  } catch (err) {
    await db.exec('ROLLBACK;');
    next(err);
  }
});

// 5. DELETE (Soft delete)
router.delete('/:table/:id', authenticate, validateTableName, async (req, res, next) => {
  const db = await getDbConnection();
  await db.exec('BEGIN TRANSACTION;');

  try {
    const { table, id } = req.params;

    const existing = await db.get(`SELECT * FROM ${table} WHERE id = ? AND deletedAt IS NULL`, [id]);
    if (!existing) {
      await db.exec('ROLLBACK;');
      return res.status(404).json({ success: false, message: 'Resource not found.', error: 'NOT_FOUND' });
    }

    // Tenant check
    if (req.user.role !== 'admin') {
      if (existing.institutionId && existing.institutionId !== req.user.institutionId) {
        await db.exec('ROLLBACK;');
        return res.status(403).json({ success: false, message: 'Tenant isolation violation.', error: 'FORBIDDEN' });
      }
      if (existing.userId && existing.userId !== req.user.id) {
        await db.exec('ROLLBACK;');
        return res.status(403).json({ success: false, message: 'Resource ownership violation.', error: 'FORBIDDEN' });
      }
    }

    // Update deletedAt instead of hard deleting
    await db.run(
      `UPDATE ${table} SET deletedAt = datetime('now'), status = 'deleted' WHERE id = ?`,
      [id]
    );

    // Audit Log insert
    if (table !== 'audit_logs') {
      const auditId = crypto.randomUUID();
      await db.run(
        `INSERT INTO audit_logs (id, userId, userName, userRole, action, details, riskScore, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          req.user.id,
          req.user.name,
          req.user.role,
          `${table.toUpperCase()}_DELETE`,
          `Soft-deleted entry ${id} in ${table}`,
          10,
          req.user.username
        ]
      );
    }

    await db.exec('COMMIT;');
    return res.sendSuccess({ success: true, message: 'Resource soft-deleted successfully.' });
  } catch (err) {
    await db.exec('ROLLBACK;');
    next(err);
  }
});

export default router;
