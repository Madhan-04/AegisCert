import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { getDbConnection } from './config/database.js';
import { initializeDatabase } from './services/dbInitService.js';

// Middlewares
import { logger } from './middleware/logger.js';
import { generateRequestId, errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/authenticate.js';

// Routers
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import certificatesRouter from './routes/certificates.js';
import institutionsRouter from './routes/institutions.js';
import biometricsRouter from './routes/biometrics.js';
import auditRouter from './routes/audit.js';
import resourcesRouter from './routes/resources.js';

const app = express();

// 1. Hardening & Security Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());

// Dynamic CORS configuration based on environment settings
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.ALLOWED_ORIGINS.includes(origin) || env.ALLOWED_ORIGINS.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy: origin not allowed.'));
    }
  },
  credentials: true
}));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
    error: 'TOO_MANY_REQUESTS'
  }
});
app.use('/api/', apiLimiter);

// 2. Request Trace and Logging Middleware
app.use(generateRequestId);
app.use(logger);

// 3. Setup Database Schema and Migrations
initializeDatabase().catch(err => {
  console.error('[DATABASE INIT ERROR] Failed to seed schemas:', err);
});

// 4. REST API Routing Maps
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/certificates', certificatesRouter);
app.use('/api/institutions', institutionsRouter);
app.use('/api/biometrics', biometricsRouter);
app.use('/api/audit', auditRouter);

// Generic REST endpoints supporting automated cache replication
app.use('/api/resources', resourcesRouter);

// Retrofitted GET /api/initialize endpoint returning user-scoped cached indexes
app.get('/api/initialize', authenticate, async (req, res, next) => {
  try {
    const db = await getDbConnection();
    const result = { success: true };
    const tables = [
      'users', 'institutions', 'certificates', 'audit_logs', 'blockchain_ledger',
      'fraud_reports', 'soc_events', 'notifications', 'sessions', 'otp',
      'biometrics', 'fingerprint_templates', 'support_tickets', 'backups',
      'api_keys', 'campuses', 'departments', 'help_articles', 'faqs',
      'troubleshooting_guides', 'recent_searches', 'feedback'
    ];

    for (const table of tables) {
      let query = `SELECT * FROM ${table} WHERE deletedAt IS NULL`;
      const params = [];

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

      const rows = await db.all(query, params);

      // Parse JSON strings to keep frontend type interfaces consistent
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

      let key = table;
      if (table === 'audit_logs') key = 'auditLogs';
      if (table === 'blockchain_ledger') key = 'blockchainLedger';
      if (table === 'fraud_reports') key = 'fraudReports';
      if (table === 'soc_events') key = 'socEvents';
      if (table === 'help_articles') key = 'helpArticles';
      if (table === 'troubleshooting_guides') key = 'troubleshootingGuides';
      if (table === 'recent_searches') key = 'recentSearches';
      if (table === 'api_keys') key = 'apiKeys';
      if (table === 'support_tickets') key = 'supportTickets';
      if (table === 'ocr_reports') key = 'ocrReports';

      result[key] = parsed;
    }

    return res.json(result);
  } catch (e) {
    next(e);
  }
});

// Retrofitted Settings endpoints
app.put('/api/settings', authenticate, async (req, res, next) => {
  try {
    const db = await getDbConnection();
    const settings = req.body;
    await db.exec('BEGIN TRANSACTION;');
    for (const key of Object.keys(settings)) {
      await db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
        [key, settings[key].toString(), settings[key].toString()]
      );
    }
    await db.exec('COMMIT;');
    return res.sendSuccess({ message: 'Settings saved successfully.' });
  } catch (e) {
    next(e);
  }
});

// 5. Catch-all Global Error Middleware
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`[AegisCert REST Server] Listening on port ${env.PORT} (Env: ${env.NODE_ENV})`);
});
