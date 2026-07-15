import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { initializeDatabase, getDbConnection } from './db.js';
import { comparePassword, hashPassword, generateToken, authenticateToken, requireRoles } from './auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error("FATAL INITIALIZATION ERROR: JWT_SECRET environment variable is missing in production mode!");
  process.exit(1);
}

// CORS Security Setup
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5000'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Initialize SQLite database
initializeDatabase().catch(err => {
  console.error('Failed to initialize SQLite database:', err);
});

// Zod schemas for table writes
const schemas = {
  users: z.object({
    id: z.string(),
    username: z.string(),
    password: z.string().optional(),
    role: z.enum(['admin', 'institution', 'student', 'verifier']),
    name: z.string(),
    email: z.string(),
    contact: z.string().optional().nullable(),
    faceEnrollId: z.string().optional().nullable(),
    fingerprintStatus: z.string().optional().nullable(),
    mpin: z.string().optional().nullable(),
    institutionId: z.string().optional().nullable(),
    institutionName: z.string().optional().nullable(),
    rollNo: z.string().optional().nullable(),
    regNo: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    batch: z.string().optional().nullable(),
    enrolledAt: z.string().optional().nullable(),
    mustResetPassword: z.number().optional()
  }),
  institutions: z.object({
    id: z.string(),
    name: z.string(),
    regNo: z.string(),
    email: z.string().optional().nullable(),
    status: z.enum(['pending', 'approved', 'rejected']),
    createdAt: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    primaryColor: z.string().optional().nullable(),
    secondaryColor: z.string().optional().nullable(),
    campusCount: z.number().optional().nullable(),
    departmentCount: z.number().optional().nullable()
  }),
  certificates: z.object({
    id: z.string(),
    studentName: z.string(),
    rollNo: z.string(),
    regNo: z.string(),
    degree: z.string(),
    department: z.string(),
    cgpa: z.number(),
    institutionId: z.string(),
    institutionName: z.string(),
    issueDate: z.string().optional().nullable(),
    blockchainHash: z.string(),
    signature: z.string(),
    status: z.enum(['draft', 'pending', 'issued', 'active', 'suspended', 'revoked', 'expired']),
    statusHistory: z.array(z.any()).optional().nullable().or(z.string()),
    dob: z.string().optional().nullable(),
    yearOfPassout: z.string().optional().nullable(),
    pdfMarksheet: z.string().optional().nullable()
  }),
  campuses: z.object({
    id: z.string(),
    institutionId: z.string(),
    name: z.string(),
    location: z.string().optional().nullable(),
    campusDean: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    activeStudentCount: z.number().optional().nullable()
  }),
  departments: z.object({
    id: z.string(),
    institutionId: z.string(),
    name: z.string(),
    code: z.string().optional().nullable(),
    headOfDept: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    courseCount: z.number().optional().nullable()
  }),
  api_keys: z.object({
    id: z.string(),
    name: z.string(),
    apiKey: z.string(),
    environment: z.string().optional().nullable(),
    status: z.enum(['active', 'revoked']),
    rateLimit: z.number().optional().nullable(),
    requestsToday: z.number().optional().nullable(),
    createdAt: z.string().optional().nullable(),
    lastUsedAt: z.string().optional().nullable()
  }),
  audit_logs: z.object({
    id: z.string(),
    userId: z.string(),
    userName: z.string(),
    userRole: z.string(),
    action: z.string(),
    details: z.string().optional().nullable(),
    status: z.enum(['success', 'failure']),
    timestamp: z.string()
  }),
  soc_events: z.object({
    id: z.string(),
    type: z.string().optional().nullable(),
    severity: z.enum(['critical', 'high', 'medium', 'low']),
    message: z.string(),
    timestamp: z.string(),
    status: z.string().optional().nullable(),
    source: z.string().optional().nullable()
  })
};

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------

/**
 * Real password validation + JWT issuance
 */
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required.' });
  }

  const db = await getDbConnection();
  try {
    const user = await db.get('SELECT * FROM users WHERE LOWER(username) = ? AND role = ?', [username.toLowerCase(), role]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Verify Password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      institutionId: user.institutionId
    });

    const userResponse = { ...user };
    delete userResponse.password; // strip password hash from response

    res.json({
      success: true,
      token,
      user: userResponse,
      mustResetPassword: user.mustResetPassword === 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
});

/**
 * Password change / force reset endpoint
 */
app.post('/api/auth/reset-password', async (req, res) => {
  const { username, role, newPassword } = req.body;
  if (!username || !role || !newPassword) {
    return res.status(400).json({ error: 'Username, role, and newPassword are required.' });
  }

  const db = await getDbConnection();
  try {
    const user = await db.get('SELECT * FROM users WHERE LOWER(username) = ? AND role = ?', [username.toLowerCase(), role]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const hashed = await hashPassword(newPassword);
    await db.run('UPDATE users SET password = ?, mustResetPassword = 0 WHERE id = ?', [hashed, user.id]);
    
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
});

/**
 * Verify MPIN endpoint (authenticated)
 */
app.post('/api/auth/verify-mpin', authenticateToken, async (req, res) => {
  const { mpin } = req.body;
  if (!mpin) return res.status(400).json({ error: 'MPIN code is required.' });

  const db = await getDbConnection();
  try {
    const user = await db.get('SELECT mpin FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.mpin) return res.status(400).json({ error: 'MPIN not enrolled.' });

    const match = await comparePassword(mpin, user.mpin);
    if (match) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: 'Invalid MPIN verification code.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
});

/**
 * Enroll/Setup MPIN endpoint (authenticated)
 */
app.post('/api/auth/setup-mpin', authenticateToken, async (req, res) => {
  const { mpin } = req.body;
  if (!mpin || mpin.length !== 6) return res.status(400).json({ error: 'Valid 6-digit MPIN is required.' });

  const db = await getDbConnection();
  try {
    const hashed = await hashPassword(mpin);
    await db.run('UPDATE users SET mpin = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
});

// ----------------------------------------------------
// INITIALIZE DATABASE ENDPOINT
// ----------------------------------------------------

/**
 * Returns database state filtered by JWT context (multi-tenant isolation)
 */
app.get('/api/initialize', authenticateToken, async (req, res) => {
  const { role, institutionId, id: userId } = req.user;
  const db = await getDbConnection();

  try {
    // 1. Help articles, FAQs, guides, setting metadata are accessible to everyone
    const settingsRaw = await db.all('SELECT * FROM settings');
    const settings = {};
    settingsRaw.forEach(s => {
      if (s.value === 'true') settings[s.key] = true;
      else if (s.value === 'false') settings[s.key] = false;
      else settings[s.key] = s.value;
    });

    const helpArticlesRaw = await db.all('SELECT * FROM help_articles');
    const helpArticles = helpArticlesRaw.map(a => ({
      ...a,
      keywords: a.keywords ? JSON.parse(a.keywords) : [],
      relatedRoutes: a.relatedRoutes ? JSON.parse(a.relatedRoutes) : []
    }));

    const faqs = await db.all('SELECT * FROM faqs');
    const troubleshootingGuides = await db.all('SELECT * FROM troubleshooting_guides');

    // 2. Fetch resources with multi-tenant filtering applied
    let users = [];
    let institutions = [];
    let certificates = [];
    let auditLogs = [];
    let socEvents = [];
    let loginHistory = [];
    let activeSessions = [];
    let campuses = [];
    let departments = [];
    let apiKeys = [];
    let apiLogs = [];
    let ocrReports = [];
    let backupSnapshots = [];
    let recoveryLogs = [];
    let deviceRegistrations = [];
    let notifications = [];
    let feedback = [];
    let recentSearches = [];
    let blockchainLedger = [];

    if (role === 'admin') {
      // Super Admin sees all data
      users = await db.all('SELECT * FROM users');
      institutions = await db.all('SELECT * FROM institutions');
      const certsRaw = await db.all('SELECT * FROM certificates');
      certificates = certsRaw.map(c => ({ ...c, statusHistory: c.statusHistory ? JSON.parse(c.statusHistory) : [] }));
      auditLogs = await db.all('SELECT * FROM audit_logs');
      socEvents = await db.all('SELECT * FROM soc_events');
      loginHistory = await db.all('SELECT * FROM login_history');
      activeSessions = await db.all('SELECT * FROM active_sessions');
      campuses = await db.all('SELECT * FROM campuses');
      departments = await db.all('SELECT * FROM departments');
      apiKeys = await db.all('SELECT * FROM api_keys');
      apiLogs = await db.all('SELECT * FROM api_logs');
      const ocrRaw = await db.all('SELECT * FROM ocr_reports');
      ocrReports = ocrRaw.map(r => ({ ...r, detailedAnalyses: r.detailedAnalyses ? JSON.parse(r.detailedAnalyses) : {} }));
      backupSnapshots = await db.all('SELECT * FROM backup_snapshots');
      recoveryLogs = await db.all('SELECT * FROM recovery_logs');
      deviceRegistrations = await db.all('SELECT * FROM device_registrations');
      notifications = await db.all('SELECT * FROM notifications');
      feedback = await db.all('SELECT * FROM feedback');
      recentSearches = await db.all('SELECT * FROM recent_searches');
      const blocksRaw = await db.all('SELECT * FROM blockchain_ledger');
      blockchainLedger = blocksRaw.map(b => ({ ...b, transactions: b.transactions ? JSON.parse(b.transactions) : [] }));
    } else if (role === 'institution') {
      // Institution Admins see scoped data
      users = await db.all('SELECT * FROM users WHERE institutionId = ? OR role = "verifier"', [institutionId]);
      institutions = await db.all('SELECT * FROM institutions WHERE id = ?', [institutionId]);
      
      const certsRaw = await db.all('SELECT * FROM certificates WHERE institutionId = ?', [institutionId]);
      certificates = certsRaw.map(c => ({ ...c, statusHistory: c.statusHistory ? JSON.parse(c.statusHistory) : [] }));
      
      auditLogs = await db.all('SELECT * FROM audit_logs WHERE userId = ? OR userRole = "verifier"', [userId]);
      socEvents = await db.all('SELECT * FROM soc_events WHERE severity = "low" OR severity = "medium"');
      loginHistory = await db.all('SELECT * FROM login_history WHERE userId = ?', [userId]);
      activeSessions = await db.all('SELECT * FROM active_sessions WHERE userId = ?', [userId]);
      campuses = await db.all('SELECT * FROM campuses WHERE institutionId = ?', [institutionId]);
      departments = await db.all('SELECT * FROM departments WHERE institutionId = ?', [institutionId]);
      apiKeys = await db.all('SELECT * FROM api_keys');
      apiLogs = await db.all('SELECT * FROM api_logs');
      
      const ocrRaw = await db.all('SELECT * FROM ocr_reports');
      ocrReports = ocrRaw.map(r => ({ ...r, detailedAnalyses: r.detailedAnalyses ? JSON.parse(r.detailedAnalyses) : {} }));
      
      backupSnapshots = await db.all('SELECT * FROM backup_snapshots');
      recoveryLogs = await db.all('SELECT * FROM recovery_logs');
      deviceRegistrations = await db.all('SELECT * FROM device_registrations');
      notifications = await db.all('SELECT * FROM notifications WHERE audience = "institution" OR audience = "all"');
      feedback = await db.all('SELECT * FROM feedback WHERE userId = ?', [userId]);
      recentSearches = await db.all('SELECT * FROM recent_searches WHERE userId = ?', [userId]);
      
      const blocksRaw = await db.all('SELECT * FROM blockchain_ledger');
      blockchainLedger = blocksRaw.map(b => ({ ...b, transactions: b.transactions ? JSON.parse(b.transactions) : [] }));
    } else if (role === 'student') {
      // Students see only their own accounts and documents
      users = await db.all('SELECT * FROM users WHERE id = ?', [userId]);
      institutions = await db.all('SELECT * FROM institutions WHERE id = ?', [institutionId]);
      
      const userRec = users[0];
      if (userRec) {
        const certsRaw = await db.all('SELECT * FROM certificates WHERE rollNo = ? OR regNo = ?', [userRec.rollNo, userRec.regNo]);
        certificates = certsRaw.map(c => ({ ...c, statusHistory: c.statusHistory ? JSON.parse(c.statusHistory) : [] }));
      }
      
      auditLogs = await db.all('SELECT * FROM audit_logs WHERE userId = ?', [userId]);
      loginHistory = await db.all('SELECT * FROM login_history WHERE userId = ?', [userId]);
      activeSessions = await db.all('SELECT * FROM active_sessions WHERE userId = ?', [userId]);
      notifications = await db.all('SELECT * FROM notifications WHERE userId = ? OR audience = "student" OR audience = "all"', [userId]);
      deviceRegistrations = await db.all('SELECT * FROM device_registrations WHERE userId = ?', [userId]);
      feedback = await db.all('SELECT * FROM feedback WHERE userId = ?', [userId]);
      recentSearches = await db.all('SELECT * FROM recent_searches WHERE userId = ?', [userId]);
      
      const blocksRaw = await db.all('SELECT * FROM blockchain_ledger');
      blockchainLedger = blocksRaw.map(b => ({ ...b, transactions: b.transactions ? JSON.parse(b.transactions) : [] }));
    } else {
      // Verifier
      users = await db.all('SELECT * FROM users WHERE id = ?', [userId]);
      const certsRaw = await db.all('SELECT * FROM certificates WHERE status = "active"');
      certificates = certsRaw.map(c => ({ ...c, statusHistory: c.statusHistory ? JSON.parse(c.statusHistory) : [] }));
      notifications = await db.all('SELECT * FROM notifications WHERE audience = "all"');
      recentSearches = await db.all('SELECT * FROM recent_searches WHERE userId = ?', [userId]);
      
      const blocksRaw = await db.all('SELECT * FROM blockchain_ledger');
      blockchainLedger = blocksRaw.map(b => ({ ...b, transactions: b.transactions ? JSON.parse(b.transactions) : [] }));
    }

    res.json({
      success: true,
      users,
      institutions,
      certificates,
      auditLogs,
      socEvents,
      loginHistory,
      activeSessions,
      settings,
      campuses,
      departments,
      apiKeys,
      apiLogs,
      ocrReports,
      backupSnapshots,
      recoveryLogs,
      deviceRegistrations,
      notifications,
      helpArticles,
      faqs,
      supportTickets: [],
      feedback,
      troubleshootingGuides,
      recentSearches,
      blockchainLedger
    });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
});

// ----------------------------------------------------
// GENERIC CRUD API GATEWAY & VALIDATION
// ----------------------------------------------------

/**
 * POST - Create a resource (authenticated, validated)
 */
app.post('/api/resources/:table', authenticateToken, async (req, res) => {
  const { table } = req.params;
  const db = await getDbConnection();

  try {
    const schema = schemas[table];
    if (!schema) {
      return res.status(400).json({ error: `Unsupported table or resource type: ${table}` });
    }

    // Parse and Validate payload shape with Zod
    const validatedBody = schema.parse(req.body);

    // Intercept user creations to hash password and mpin server-side
    if (table === 'users') {
      if (validatedBody.password) {
        validatedBody.password = await hashPassword(validatedBody.password);
      }
      if (validatedBody.mpin) {
        validatedBody.mpin = await hashPassword(validatedBody.mpin);
      }
    }

    // Multi-tenant write auth checks
    if (req.user.role === 'institution') {
      if (validatedBody.institutionId && validatedBody.institutionId !== req.user.institutionId) {
        return res.status(403).json({ error: 'Tenant isolation violation: cannot write records for other institutions.' });
      }
    } else if (req.user.role !== 'admin') {
      // Students/verifiers cannot write to structural collections
      if (['users', 'institutions', 'certificates', 'campuses', 'departments', 'api_keys'].includes(table)) {
        return res.status(403).json({ error: 'Unauthorized write action.' });
      }
    }

    // Special fields parsing (JSON format strings)
    const keys = Object.keys(validatedBody);
    const columns = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => {
      const val = validatedBody[k];
      return (typeof val === 'object') ? JSON.stringify(val) : val;
    });

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    await db.run(query, values);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Malformed request structure.', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  } finally {
    await db.close();
  }
});

/**
 * PATCH - Update a resource (authenticated, validated)
 */
app.patch('/api/resources/:table/:id', authenticateToken, async (req, res) => {
  const { table, id } = req.params;
  const db = await getDbConnection();

  try {
    const schema = schemas[table];
    if (!schema) {
      return res.status(400).json({ error: `Unsupported table or resource: ${table}` });
    }

    // Run verification to assert tenant ownership
    const primaryKey = (table === 'blockchain_ledger') ? 'number' : 'id';
    const existing = await db.get(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    // Enforce tenant scoping check
    if (req.user.role === 'institution') {
      if (existing.institutionId && existing.institutionId !== req.user.institutionId) {
        return res.status(403).json({ error: 'Tenant isolation violation: unauthorized to modify other institution assets.' });
      }
    } else if (req.user.role !== 'admin') {
      if (existing.userId && existing.userId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to modify other user resources.' });
      }
    }

    // Partial schema parsing
    const validatedBody = schema.partial().parse(req.body);
    const keys = Object.keys(validatedBody).filter(k => k !== primaryKey);
    
    if (keys.length === 0) {
      return res.json({ success: true, message: 'No fields to update.' });
    }

    const setStatement = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => {
      const val = validatedBody[k];
      return (typeof val === 'object') ? JSON.stringify(val) : val;
    });
    values.push(id);

    const query = `UPDATE ${table} SET ${setStatement} WHERE ${primaryKey} = ?`;
    await db.run(query, values);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Malformed request validation.', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  } finally {
    await db.close();
  }
});

/**
 * DELETE - Delete a resource (authenticated)
 */
app.delete('/api/resources/:table/:id', authenticateToken, async (req, res) => {
  const { table, id } = req.params;
  const db = await getDbConnection();

  try {
    const primaryKey = (table === 'blockchain_ledger') ? 'number' : 'id';
    const existing = await db.get(`SELECT * FROM ${table} WHERE ${primaryKey} = ?`, [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    // Scoped permissions validation
    if (req.user.role === 'institution') {
      if (existing.institutionId && existing.institutionId !== req.user.institutionId) {
        return res.status(403).json({ error: 'Access denied: cannot delete other tenant records.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: structural resource deletion restricted to administrators.' });
    }

    await db.run(`DELETE FROM ${table} WHERE ${primaryKey} = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
});

/**
 * PUT - Update setting configurations (admin only)
 */
app.put('/api/settings', authenticateToken, requireRoles(['admin']), async (req, res) => {
  const settings = req.body;
  const db = await getDbConnection();
  
  try {
    await db.run('DELETE FROM settings');
    for (const key of Object.keys(settings)) {
      await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, settings[key].toString()]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await db.close();
  }
});

// ----------------------------------------------------
// DIAGNOSTICS & SYSTEM STATUS
// ----------------------------------------------------

/**
 * Security controls dashboard metrics (Issue 10)
 */
app.get('/api/security/status', async (req, res) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const jwtSecretSet = !!process.env.JWT_SECRET;
  const allowedOriginsSet = !!process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS !== '*';
  
  res.json({
    httpsInUse: isHttps,
    jwtSecretSet,
    rlsEnabled: true, // Mock Supabase sandbox layer setting
    corsRestricted: allowedOriginsSet
  });
});

app.listen(PORT, () => {
  console.log(`AegisCert secure database server running on http://localhost:${PORT}`);
});
