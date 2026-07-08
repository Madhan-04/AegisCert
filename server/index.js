import express from 'express';
import cors from 'cors';
import { initializeDatabase, getDbConnection } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize SQLite tables & seeds on startup
initializeDatabase().catch(err => {
  console.error('Failed to initialize SQLite database:', err);
});

// Single-fetch synchronization API to load database state into memory cache
app.get('/api/initialize', async (req, res) => {
  const db = await getDbConnection();
  try {
    const users = await db.all('SELECT * FROM users');
    const institutions = await db.all('SELECT * FROM institutions');
    
    const rawCerts = await db.all('SELECT * FROM certificates');
    const certificates = rawCerts.map(c => ({
      ...c,
      statusHistory: c.statusHistory ? JSON.parse(c.statusHistory) : []
    }));

    const auditLogs = await db.all('SELECT * FROM audit_logs');
    const socEvents = await db.all('SELECT * FROM soc_events');
    const loginHistory = await db.all('SELECT * FROM login_history');
    const activeSessions = await db.all('SELECT * FROM active_sessions');
    
    const rawSettings = await db.all('SELECT * FROM settings');
    const settings = {};
    rawSettings.forEach(s => {
      if (s.value === 'true') settings[s.key] = true;
      else if (s.value === 'false') settings[s.key] = false;
      else settings[s.key] = s.value;
    });

    const campuses = await db.all('SELECT * FROM campuses');
    const departments = await db.all('SELECT * FROM departments');
    const apiKeys = await db.all('SELECT * FROM api_keys');
    const apiLogs = await db.all('SELECT * FROM api_logs');
    
    const rawOcr = await db.all('SELECT * FROM ocr_reports');
    const ocrReports = rawOcr.map(r => ({
      ...r,
      detailedAnalyses: r.detailedAnalyses ? JSON.parse(r.detailedAnalyses) : {}
    }));

    const backupSnapshots = await db.all('SELECT * FROM backup_snapshots');
    const recoveryLogs = await db.all('SELECT * FROM recovery_logs');
    const deviceRegistrations = await db.all('SELECT * FROM device_registrations');
    const notifications = await db.all('SELECT * FROM notifications');
    
    const rawHelp = await db.all('SELECT * FROM help_articles');
    const helpArticles = rawHelp.map(a => ({
      ...a,
      keywords: a.keywords ? JSON.parse(a.keywords) : [],
      relatedRoutes: a.relatedRoutes ? JSON.parse(a.relatedRoutes) : []
    }));

    const faqs = await db.all('SELECT * FROM faqs');

    const rawSupport = await db.all('SELECT * FROM support_tickets');
    const supportTickets = rawSupport.map(t => ({
      ...t,
      replies: t.replies ? JSON.parse(t.replies) : []
    }));

    const feedback = await db.all('SELECT * FROM feedback');
    const troubleshootingGuides = await db.all('SELECT * FROM troubleshooting_guides');
    const recentSearches = await db.all('SELECT * FROM recent_searches');

    const rawBlocks = await db.all('SELECT * FROM blockchain_ledger');
    const blockchainLedger = rawBlocks.map(b => ({
      ...b,
      transactions: b.transactions ? JSON.parse(b.transactions) : []
    }));

    await db.close();
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
      supportTickets,
      feedback,
      troubleshootingGuides,
      recentSearches,
      blockchainLedger
    });
  } catch (error) {
    console.error('Initialization error:', error);
    try { await db.close(); } catch (e) {}
    res.status(500).json({ error: error.message });
  }
});

// Sync endpoint to write arrays back to specific SQLite tables
app.post('/api/sync', async (req, res) => {
  const { table, data } = req.body;
  const db = await getDbConnection();
  try {
    if (table === 'users') {
      await db.run('DELETE FROM users');
      for (const u of data) {
        await db.run(
          `INSERT INTO users (id, username, password, role, name, email, contact, faceEnrollId, fingerprintStatus, mpin, institutionId, institutionName, rollNo, regNo, department, batch, enrolledAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [u.id, u.username, u.password, u.role, u.name, u.email, u.contact || '', u.faceEnrollId || '', u.fingerprintStatus || '', u.mpin || '', u.institutionId || '', u.institutionName || '', u.rollNo || '', u.regNo || '', u.department || '', u.batch || '', u.enrolledAt || '']
        );
      }
    } else if (table === 'institutions') {
      await db.run('DELETE FROM institutions');
      for (const inst of data) {
        await db.run(
          `INSERT INTO institutions (id, name, regNo, email, status, createdAt, logoUrl, primaryColor, secondaryColor, campusCount, departmentCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [inst.id, inst.name, inst.regNo, inst.email, inst.status, inst.createdAt, inst.logoUrl, inst.primaryColor, inst.secondaryColor, inst.campusCount, inst.departmentCount]
        );
      }
    } else if (table === 'certificates') {
      await db.run('DELETE FROM certificates');
      for (const c of data) {
        await db.run(
          `INSERT INTO certificates (id, studentName, rollNo, regNo, degree, department, cgpa, institutionId, institutionName, issueDate, blockchainHash, signature, status, statusHistory, dob, yearOfPassout, pdfMarksheet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.studentName, c.rollNo, c.regNo, c.degree, c.department, c.cgpa, c.institutionId, c.institutionName, c.issueDate, c.blockchainHash, c.signature, c.status, JSON.stringify(c.statusHistory), c.dob, c.yearOfPassout, c.pdfMarksheet]
        );
      }
    } else if (table === 'auditLogs') {
      await db.run('DELETE FROM audit_logs');
      for (const l of data) {
        await db.run(
          `INSERT INTO audit_logs (id, userId, userName, userRole, action, details, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.userId, l.userName, l.userRole, l.action, l.details, l.status, l.timestamp]
        );
      }
    } else if (table === 'socEvents') {
      await db.run('DELETE FROM soc_events');
      for (const e of data) {
        await db.run(
          `INSERT INTO soc_events (id, type, severity, message, timestamp, status, source) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [e.id, e.type, e.severity, e.message, e.timestamp, e.status, e.source]
        );
      }
    } else if (table === 'loginHistory') {
      await db.run('DELETE FROM login_history');
      for (const h of data) {
        await db.run(
          `INSERT INTO login_history (id, userId, username, timestamp, ipAddress, deviceType, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [h.id, h.userId, h.username, h.timestamp, h.ipAddress, h.deviceType, h.status]
        );
      }
    } else if (table === 'activeSessions') {
      await db.run('DELETE FROM active_sessions');
      for (const s of data) {
        await db.run(
          `INSERT INTO active_sessions (id, userId, userName, userRole, device, ipAddress, loginTime, lastActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.userId, s.userName, s.userRole, s.device, s.ipAddress, s.loginTime, s.lastActive]
        );
      }
    } else if (table === 'settings') {
      await db.run('DELETE FROM settings');
      for (const key of Object.keys(data)) {
        await db.run(
          `INSERT INTO settings (key, value) VALUES (?, ?)`,
          [key, data[key].toString()]
        );
      }
    } else if (table === 'campuses') {
      await db.run('DELETE FROM campuses');
      for (const c of data) {
        await db.run(
          `INSERT INTO campuses (id, institutionId, name, location, campusDean, status, activeStudentCount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.institutionId, c.name, c.location, c.campusDean, c.status, c.activeStudentCount]
        );
      }
    } else if (table === 'departments') {
      await db.run('DELETE FROM departments');
      for (const d of data) {
        await db.run(
          `INSERT INTO departments (id, institutionId, name, code, headOfDept, status, courseCount) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [d.id, d.institutionId, d.name, d.code, d.headOfDept, d.status, d.courseCount]
        );
      }
    } else if (table === 'apiKeys') {
      await db.run('DELETE FROM api_keys');
      for (const k of data) {
        await db.run(
          `INSERT INTO api_keys (id, name, apiKey, environment, status, rateLimit, requestsToday, createdAt, lastUsedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [k.id, k.name, k.apiKey, k.environment, k.status, k.rateLimit, k.requestsToday, k.createdAt, k.lastUsedAt]
        );
      }
    } else if (table === 'apiLogs') {
      await db.run('DELETE FROM api_logs');
      for (const l of data) {
        await db.run(
          `INSERT INTO api_logs (id, timestamp, path, method, statusCode, latency, clientIp, apiKeyName) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.timestamp, l.path, l.method, l.statusCode, l.latency, l.clientIp, l.apiKeyName]
        );
      }
    } else if (table === 'ocrReports') {
      await db.run('DELETE FROM ocr_reports');
      for (const r of data) {
        await db.run(
          `INSERT INTO ocr_reports (id, timestamp, fileName, fileSize, status, authenticityScore, verifiedAddress, alertsCount, detailedAnalyses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.timestamp, r.fileName, r.fileSize, r.status, r.authenticityScore, r.verifiedAddress, r.alertsCount, JSON.stringify(r.detailedAnalyses)]
        );
      }
    } else if (table === 'backupSnapshots') {
      await db.run('DELETE FROM backup_snapshots');
      for (const s of data) {
        await db.run(
          `INSERT INTO backup_snapshots (id, timestamp, type, size, blockHeight, transactionCount, checksum, status, hashIntegrity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [s.id, s.timestamp, s.type, s.size, s.blockHeight, s.transactionCount, s.checksum, s.status, s.hashIntegrity]
        );
      }
    } else if (table === 'recoveryLogs') {
      await db.run('DELETE FROM recovery_logs');
      for (const l of data) {
        await db.run(
          `INSERT INTO recovery_logs (id, timestamp, type, snapshotId, status, details, operator, hashCheck) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.timestamp, l.type, l.snapshotId, l.status, l.details, l.operator, l.hashCheck]
        );
      }
    } else if (table === 'deviceRegistrations') {
      await db.run('DELETE FROM device_registrations');
      for (const r of data) {
        await db.run(
          `INSERT INTO device_registrations (id, userId, deviceName, type, status, ipAddress, enrolledAt, lastActivity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.id, r.userId, r.deviceName, r.type, r.status, r.ipAddress, r.enrolledAt, r.lastActivity]
        );
      }
    } else if (table === 'notifications') {
      await db.run('DELETE FROM notifications');
      for (const n of data) {
        await db.run(
          `INSERT INTO notifications (id, timestamp, type, title, message, read, severity, audience) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [n.id, n.timestamp, n.type, n.title, n.message, n.read ? 1 : 0, n.severity, n.audience]
        );
      }
    } else if (table === 'helpArticles') {
      await db.run('DELETE FROM help_articles');
      for (const a of data) {
        await db.run(
          `INSERT INTO help_articles (id, category, title, body, keywords, relatedRoutes) VALUES (?, ?, ?, ?, ?, ?)`,
          [a.id, a.category, a.title, a.body, JSON.stringify(a.keywords), JSON.stringify(a.relatedRoutes)]
        );
      }
    } else if (table === 'faqs') {
      await db.run('DELETE FROM faqs');
      for (const f of data) {
        await db.run(
          `INSERT INTO faqs (id, question, answer, category) VALUES (?, ?, ?, ?)`,
          [f.id, f.question, f.answer, f.category]
        );
      }
    } else if (table === 'supportTickets') {
      await db.run('DELETE FROM support_tickets');
      for (const t of data) {
        await db.run(
          `INSERT INTO support_tickets (id, userId, userName, userRole, category, subject, message, status, timestamp, replies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.userId, t.userName, t.userRole, t.category, t.subject, t.message, t.status, t.timestamp, JSON.stringify(t.replies)]
        );
      }
    } else if (table === 'feedback') {
      await db.run('DELETE FROM feedback');
      for (const f of data) {
        await db.run(
          `INSERT INTO feedback (id, userId, userName, type, title, description, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [f.id, f.userId, f.userName, f.type, f.title, f.description, f.timestamp, f.status]
        );
      }
    } else if (table === 'troubleshootingGuides') {
      await db.run('DELETE FROM troubleshooting_guides');
      for (const g of data) {
        await db.run(
          `INSERT INTO troubleshooting_guides (id, problem, reason, resolution, recommendedAction) VALUES (?, ?, ?, ?, ?)`,
          [g.id, g.problem, g.reason, g.resolution, g.recommendedAction]
        );
      }
    } else if (table === 'recentSearches') {
      await db.run('DELETE FROM recent_searches');
      for (const s of data) {
        await db.run(
          `INSERT INTO recent_searches (id, userId, query, timestamp) VALUES (?, ?, ?, ?)`,
          [s.id, s.userId, s.query, s.timestamp]
        );
      }
    } else if (table === 'blockchainLedger') {
      await db.run('DELETE FROM blockchain_ledger');
      for (const b of data) {
        await db.run(
          `INSERT INTO blockchain_ledger (number, hash, parentHash, timestamp, transactions, nonce, difficulty, gasUsed, gasLimit, miner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [b.number, b.hash, b.parentHash, b.timestamp, JSON.stringify(b.transactions), b.nonce, b.difficulty, b.gasUsed, b.gasLimit, b.miner]
        );
      }
    }
    await db.close();
    res.json({ success: true });
  } catch (error) {
    console.error(`Sync error on table ${table}:`, error);
    try { await db.close(); } catch (e) {}
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AegisCert database server running on http://localhost:${PORT}`);
});
