import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');

export async function getDbConnection() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function initializeDatabase() {
  const db = await getDbConnection();

  // Drop users and certificates if schema update is needed to prevent drift
  try {
    const info = await db.all("PRAGMA table_info(users)");
    const hasMustReset = info.some(c => c.name === 'mustResetPassword');
    if (info.length > 0 && !hasMustReset) {
      console.log("Upgrading users table: dropping users to re-seed...");
      await db.exec("DROP TABLE IF EXISTS users");
      await db.exec("DROP TABLE IF EXISTS certificates");
    }
  } catch (e) {}

  // Create Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT,
      email TEXT,
      contact TEXT,
      faceEnrollId TEXT,
      fingerprintStatus TEXT,
      mpin TEXT,
      institutionId TEXT,
      institutionName TEXT,
      rollNo TEXT,
      regNo TEXT,
      department TEXT,
      batch TEXT,
      enrolledAt TEXT,
      mustResetPassword INTEGER DEFAULT 1
    )
  `);

  // Create Institutions Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      id TEXT PRIMARY KEY,
      name TEXT,
      regNo TEXT,
      email TEXT,
      status TEXT,
      createdAt TEXT,
      logoUrl TEXT,
      primaryColor TEXT,
      secondaryColor TEXT,
      campusCount INTEGER,
      departmentCount INTEGER
    )
  `);

  // Create Certificates Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      studentName TEXT,
      rollNo TEXT,
      regNo TEXT,
      degree TEXT,
      department TEXT,
      cgpa REAL,
      institutionId TEXT,
      institutionName TEXT,
      issueDate TEXT,
      blockchainHash TEXT,
      signature TEXT,
      status TEXT,
      statusHistory TEXT,
      dob TEXT,
      yearOfPassout TEXT,
      pdfMarksheet TEXT
    )
  `);

  // Create Audit Logs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      userRole TEXT,
      action TEXT,
      details TEXT,
      status TEXT,
      timestamp TEXT
    )
  `);

  // Create SOC Events Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS soc_events (
      id TEXT PRIMARY KEY,
      type TEXT,
      severity TEXT,
      message TEXT,
      timestamp TEXT,
      status TEXT,
      source TEXT
    )
  `);

  // Create Login History Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS login_history (
      id TEXT PRIMARY KEY,
      userId TEXT,
      username TEXT,
      timestamp TEXT,
      ipAddress TEXT,
      deviceType TEXT,
      status TEXT
    )
  `);

  // Create Active Sessions Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      userRole TEXT,
      device TEXT,
      ipAddress TEXT,
      loginTime TEXT,
      lastActive TEXT
    )
  `);

  // Create Settings Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Create Campuses Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS campuses (
      id TEXT PRIMARY KEY,
      institutionId TEXT,
      name TEXT,
      location TEXT,
      campusDean TEXT,
      status TEXT,
      activeStudentCount INTEGER
    )
  `);

  // Create Departments Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      institutionId TEXT,
      name TEXT,
      code TEXT,
      headOfDept TEXT,
      status TEXT,
      courseCount INTEGER
    )
  `);

  // Create API Keys Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT,
      apiKey TEXT,
      environment TEXT,
      status TEXT,
      rateLimit INTEGER,
      requestsToday INTEGER,
      createdAt TEXT,
      lastUsedAt TEXT
    )
  `);

  // Create API Logs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS api_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      path TEXT,
      method TEXT,
      statusCode INTEGER,
      latency INTEGER,
      clientIp TEXT,
      apiKeyName TEXT
    )
  `);

  // Create OCR Reports Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ocr_reports (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      fileName TEXT,
      fileSize TEXT,
      status TEXT,
      authenticityScore INTEGER,
      verifiedAddress TEXT,
      alertsCount INTEGER,
      detailedAnalyses TEXT
    )
  `);

  // Create Backup Snapshots Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS backup_snapshots (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      type TEXT,
      size TEXT,
      blockHeight INTEGER,
      transactionCount INTEGER,
      checksum TEXT,
      status TEXT,
      hashIntegrity TEXT
    )
  `);

  // Create Recovery Logs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recovery_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      type TEXT,
      snapshotId TEXT,
      status TEXT,
      details TEXT,
      operator TEXT,
      hashCheck TEXT
    )
  `);

  // Create Device Registrations Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS device_registrations (
      id TEXT PRIMARY KEY,
      userId TEXT,
      deviceName TEXT,
      type TEXT,
      status TEXT,
      ipAddress TEXT,
      enrolledAt TEXT,
      lastActivity TEXT
    )
  `);

  // Create Notifications Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      type TEXT,
      title TEXT,
      message TEXT,
      read INTEGER,
      severity TEXT,
      audience TEXT
    )
  `);

  // Create Help Articles Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS help_articles (
      id TEXT PRIMARY KEY,
      category TEXT,
      title TEXT,
      body TEXT,
      keywords TEXT,
      relatedRoutes TEXT
    )
  `);

  // Create FAQs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      id TEXT PRIMARY KEY,
      question TEXT,
      answer TEXT,
      category TEXT
    )
  `);

  // Create Support Tickets Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      userRole TEXT,
      category TEXT,
      subject TEXT,
      message TEXT,
      status TEXT,
      timestamp TEXT,
      replies TEXT
    )
  `);

  // Create Feedback Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      userId TEXT,
      userName TEXT,
      type TEXT,
      title TEXT,
      description TEXT,
      timestamp TEXT,
      status TEXT
    )
  `);

  // Create Troubleshooting Guides Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS troubleshooting_guides (
      id TEXT PRIMARY KEY,
      problem TEXT,
      reason TEXT,
      resolution TEXT,
      recommendedAction TEXT
    )
  `);

  // Create Recent Searches Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recent_searches (
      id TEXT PRIMARY KEY,
      userId TEXT,
      query TEXT,
      timestamp TEXT
    )
  `);

  // Create Blockchain Ledger Blocks Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_ledger (
      number INTEGER PRIMARY KEY,
      hash TEXT,
      parentHash TEXT,
      timestamp TEXT,
      transactions TEXT,
      nonce TEXT,
      difficulty TEXT,
      gasUsed INTEGER,
      gasLimit INTEGER,
      miner TEXT
    )
  `);

  // ----------------------------------------------------
  // SEED DEFAULT SEEDS IF EMPTY
  // ----------------------------------------------------

  // 1. Seed Institutions
  const instCount = await db.get('SELECT COUNT(*) as count FROM institutions');
  if (instCount.count === 0) {
    const defaultInsts = [
      { id: 'inst-mit', name: 'Massachusetts Institute of Technology', regNo: 'US-MIT-1002', email: 'credentials@mit.edu', status: 'approved', createdAt: '2026-06-20T08:00:00Z', logoUrl: '/logo.jpg', primaryColor: '#6C63FF', secondaryColor: '#4F46E5', campusCount: 3, departmentCount: 4 },
      { id: 'inst-stanford', name: 'Stanford University', regNo: 'US-STAN-1003', email: 'credentials@stanford.edu', status: 'approved', createdAt: '2026-06-20T08:00:00Z', logoUrl: '/logo.jpg', primaryColor: '#8C1515', secondaryColor: '#4F46E5', campusCount: 4, departmentCount: 6 },
      { id: 'inst-harvard', name: 'Harvard University', regNo: 'US-HARV-1004', email: 'credentials@harvard.edu', status: 'approved', createdAt: '2026-06-20T08:00:00Z', logoUrl: '/logo.jpg', primaryColor: '#A51C30', secondaryColor: '#4F46E5', campusCount: 5, departmentCount: 8 },
      { id: 'inst-caltech', name: 'California Institute of Technology', regNo: 'US-CALT-1005', email: 'credentials@caltech.edu', status: 'approved', createdAt: '2026-06-20T08:00:00Z', logoUrl: '/logo.jpg', primaryColor: '#FF6600', secondaryColor: '#4F46E5', campusCount: 2, departmentCount: 3 },
      { id: 'inst-oxford', name: 'University of Oxford', regNo: 'UK-OXFD-1006', email: 'credentials@ox.ac.uk', status: 'approved', createdAt: '2026-06-20T08:00:00Z', logoUrl: '/logo.jpg', primaryColor: '#002147', secondaryColor: '#4F46E5', campusCount: 6, departmentCount: 12 },
      { id: 'inst-cambridge', name: 'University of Cambridge', regNo: 'UK-CAMB-1007', email: 'credentials@cam.ac.uk', status: 'approved', createdAt: '2026-06-20T08:00:00Z', logoUrl: '/logo.jpg', primaryColor: '#00BFFF', secondaryColor: '#4F46E5', campusCount: 6, departmentCount: 11 }
    ];
    for (const inst of defaultInsts) {
      await db.run(
        `INSERT INTO institutions (id, name, regNo, email, status, createdAt, logoUrl, primaryColor, secondaryColor, campusCount, departmentCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [inst.id, inst.name, inst.regNo, inst.email, inst.status, inst.createdAt, inst.logoUrl, inst.primaryColor, inst.secondaryColor, inst.campusCount, inst.departmentCount]
      );
    }
  }

  // 2. Seed Users
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const hash = (p) => bcrypt.hashSync(p, 12);
    const defaultUsers = [
      { id: 'usr-madhan', username: 'madhan', password: hash('password123'), role: 'admin', name: 'Mr. MADHAN', email: 'madhan@aegiscert.gov', contact: '+1 (555) 019-8822', faceEnrollId: '', fingerprintStatus: 'pending', mpin: '', mustResetPassword: 1 },
      { id: 'usr-honeytoken-1', username: 'backup_root', password: hash('locked_root_bypass_trap_9918'), role: 'admin', name: 'Backup System Root Daemon', email: 'honeypot.root@aegiscert.gov', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '', mustResetPassword: 1 },
      { id: 'usr-honeytoken-2', username: 'database_root', password: hash('locked_database_bypass_trap_1029'), role: 'admin', name: 'Database Administrator Daemon', email: 'honeypot.db@aegiscert.gov', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '', mustResetPassword: 1 },
      { id: 'usr-mit', username: 'mit', password: hash('password123'), role: 'institution', name: 'MIT Registrar Office', email: 'registrar@mit.edu', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: hash('123456'), institutionId: 'inst-mit', institutionName: 'Massachusetts Institute of Technology', mustResetPassword: 1 },
      { id: 'usr-stanford', username: 'stanford', password: hash('password123'), role: 'institution', name: 'Stanford Registrar Office', email: 'registrar@stanford.edu', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: hash('123456'), institutionId: 'inst-stanford', institutionName: 'Stanford University', mustResetPassword: 1 },
      { id: 'usr-harvard', username: 'harvard', password: hash('password123'), role: 'institution', name: 'Harvard Registrar Office', email: 'registrar@harvard.edu', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: hash('123456'), institutionId: 'inst-harvard', institutionName: 'Harvard University', mustResetPassword: 1 },
      { id: 'usr-caltech', username: 'caltech', password: hash('password123'), role: 'institution', name: 'Caltech Registrar Office', email: 'registrar@caltech.edu', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: hash('123456'), institutionId: 'inst-caltech', institutionName: 'California Institute of Technology', mustResetPassword: 1 },
      { id: 'usr-oxford', username: 'oxford', password: hash('password123'), role: 'institution', name: 'Oxford Registrar Office', email: 'registrar@ox.ac.uk', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: hash('123456'), institutionId: 'inst-oxford', institutionName: 'University of Oxford', mustResetPassword: 1 },
      { id: 'usr-cambridge', username: 'cambridge', password: hash('password123'), role: 'institution', name: 'Cambridge Registrar Office', email: 'registrar@cam.ac.uk', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: hash('123456'), institutionId: 'inst-cambridge', institutionName: 'University of Cambridge', mustResetPassword: 1 },
      { id: 'usr-student', username: 'student', password: hash('password123'), role: 'student', name: 'Alex Johnson', email: 'alex.j@student.mit.edu', contact: '+1 (555) 012-3810', faceEnrollId: 'face-mock-alex-johnson-2026', fingerprintStatus: 'enrolled', mpin: hash('123456'), institutionId: 'inst-mit', institutionName: 'Massachusetts Institute of Technology', rollNo: 'MIT-2024-082', regNo: 'REG-9923881', department: 'Computer Science', batch: '2024', enrolledAt: '2026-06-21T09:00:00Z', mustResetPassword: 1 }
    ];
    for (const u of defaultUsers) {
      await db.run(
        `INSERT INTO users (id, username, password, role, name, email, contact, faceEnrollId, fingerprintStatus, mpin, institutionId, institutionName, rollNo, regNo, department, batch, enrolledAt, mustResetPassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.username, u.password, u.role, u.name, u.email, u.contact || '', u.faceEnrollId || '', u.fingerprintStatus || '', u.mpin || '', u.institutionId || '', u.institutionName || '', u.rollNo || '', u.regNo || '', u.department || '', u.batch || '', u.enrolledAt || '', u.mustResetPassword]
      );
    }
  }

  // 3. Seed Certificates
  const certCount = await db.get('SELECT COUNT(*) as count FROM certificates');
  if (certCount.count === 0) {
    const defaultCerts = [
      {
        id: 'CERT-2024-8192',
        studentName: 'Alex Johnson',
        rollNo: 'MIT-2024-082',
        regNo: 'REG-9923881',
        degree: 'Bachelor of Science',
        department: 'Computer Science',
        cgpa: 3.92,
        institutionId: 'inst-mit',
        institutionName: 'Massachusetts Institute of Technology',
        issueDate: '2026-06-22T10:00:00Z',
        blockchainHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        signature: 'SIG_0x54FB...855',
        status: 'active',
        statusHistory: JSON.stringify([{ status: 'active', timestamp: '2026-06-22T10:00:00Z', updatedBy: 'MIT Registrar Office', reason: 'Initial degree certificate issue' }]),
        dob: '2002-11-14',
        yearOfPassout: '2024',
        pdfMarksheet: 'Alex_Johnson_Marksheet.pdf'
      }
    ];
    for (const c of defaultCerts) {
      await db.run(
        `INSERT INTO certificates (id, studentName, rollNo, regNo, degree, department, cgpa, institutionId, institutionName, issueDate, blockchainHash, signature, status, statusHistory, dob, yearOfPassout, pdfMarksheet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.studentName, c.rollNo, c.regNo, c.degree, c.department, c.cgpa, c.institutionId, c.institutionName, c.issueDate, c.blockchainHash, c.signature, c.status, c.statusHistory, c.dob, c.yearOfPassout, c.pdfMarksheet]
      );
    }
  }

  // 4. Seed Settings
  const settingsCount = await db.get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    await db.run(`INSERT INTO settings (key, value) VALUES ('killSwitchActive', 'false')`);
    await db.run(`INSERT INTO settings (key, value) VALUES ('dbIntegrityHash', 'sha256-merkle-initial-hash-000000')`);
  }

  // 5. Seed Help Articles
  const helpCount = await db.get('SELECT COUNT(*) as count FROM help_articles');
  if (helpCount.count === 0) {
    const defaultArticles = [
      { id: 'art-login', category: 'Getting Started', title: 'Troubleshooting Gateway Sign In', body: 'Ensure your 6-digit MPIN aligns with credential codes.\nAccounts freeze for 15 minutes after 5 consecutive failed attempts to thwart dictionary triggers.', keywords: JSON.stringify(['signin', 'lockout', 'mpin']), relatedRoutes: JSON.stringify(['login']) },
      { id: 'art-issuance', category: 'Certificates', title: 'Registrar Certificate Anchoring Process', body: '1. Select Roll and Name parameter entries.\n2. Digital signatures are calculated using private keys.\n3. PoW nodes mine the ledger blocks to broadcast hashes.', keywords: JSON.stringify(['issuance', 'mining', 'ledger']), relatedRoutes: JSON.stringify(['issuance']) },
      { id: 'art-biometrics', category: 'Biometrics', title: 'Resolving Biometric Ridges Matching Failures', body: 'Confirm Mantra MFS100 RD services driver daemon is online.\nIf minutiae detection errors occur, clean the lens surface.', keywords: JSON.stringify(['fingerprint', 'mfs100', 'ridges']), relatedRoutes: JSON.stringify(['fingerprint']) },
      { id: 'art-blockchain', category: 'Blockchain', title: 'Ledger Audit Trail Inspections', body: 'The verified audit logs track transaction heights.\nSHA-256 blocks maintain absolute immutability against database modification.', keywords: JSON.stringify(['blockchain', 'explorer', 'audit']), relatedRoutes: JSON.stringify(['explorer', 'verification']) }
    ];
    for (const art of defaultArticles) {
      await db.run(
        `INSERT INTO help_articles (id, category, title, body, keywords, relatedRoutes) VALUES (?, ?, ?, ?, ?, ?)`,
        [art.id, art.category, art.title, art.body, art.keywords, art.relatedRoutes]
      );
    }
  }

  // 6. Seed FAQs
  const faqCount = await db.get('SELECT COUNT(*) as count FROM faqs');
  if (faqCount.count === 0) {
    const defaultFAQs = [
      { id: 'faq-1', question: 'How is data stored?', answer: 'Your keys and audit trails are structured in a local SQLite relational system.', category: 'Security' },
      { id: 'faq-2', question: 'What is the Emergency Freeze Killswitch?', answer: 'The killswitch locks block mining and certificate issuance in case of security threats.', category: 'General' }
    ];
    for (const f of defaultFAQs) {
      await db.run(
        `INSERT INTO faqs (id, question, answer, category) VALUES (?, ?, ?, ?)`,
        [f.id, f.question, f.answer, f.category]
      );
    }
  }

  // 7. Seed Troubleshooting Guides
  const trbCount = await db.get('SELECT COUNT(*) as count FROM troubleshooting_guides');
  if (trbCount.count === 0) {
    const defaultGuides = [
      { id: 'trb-1', problem: 'Mantra Scanner Connection Failed', reason: 'RD service port 11100 blocked or daemon offline.', resolution: 'Confirm MFS100 USB plug status and restart Mantra RD service manager.', recommendedAction: 'Restart RD service port 11100' },
      { id: 'trb-2', problem: 'Consensus Block Mining Stalled', reason: 'Emergency Killswitch lock is active.', resolution: 'Admin must revoke the freeze toggle in Super Admin control settings.', recommendedAction: 'Check Emergency Killswitch status' }
    ];
    for (const g of defaultGuides) {
      await db.run(
        `INSERT INTO troubleshooting_guides (id, problem, reason, resolution, recommendedAction) VALUES (?, ?, ?, ?, ?)`,
        [g.id, g.problem, g.reason, g.resolution, g.recommendedAction]
      );
    }
  }

  // 8. Seed Blockchain Ledger Blocks
  const blockCount = await db.get('SELECT COUNT(*) as count FROM blockchain_ledger');
  if (blockCount.count === 0) {
    const genesisBlock = {
      number: 0,
      hash: '0x0000a3f9e8d1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: '2026-06-20T08:00:00Z',
      transactions: JSON.stringify([]),
      nonce: '0x2c',
      difficulty: '14,839,281,992 Ghash',
      gasUsed: 0,
      gasLimit: 30000000,
      miner: '0x0000000000000000000000000000000000000000'
    };
    await db.run(
      `INSERT INTO blockchain_ledger (number, hash, parentHash, timestamp, transactions, nonce, difficulty, gasUsed, gasLimit, miner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [genesisBlock.number, genesisBlock.hash, genesisBlock.parentHash, genesisBlock.timestamp, genesisBlock.transactions, genesisBlock.nonce, genesisBlock.difficulty, genesisBlock.gasUsed, genesisBlock.gasLimit, genesisBlock.miner]
    );
  }

  await db.close();
  console.log('SQLite database schema & pre-seeds initialized successfully.');
}
