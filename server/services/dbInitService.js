import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDbConnection } from '../config/database.js';

export async function initializeDatabase() {
  const db = await getDbConnection();

  console.log('Initializing SQLite database schema...');

  // Helper to add standard audit columns
  const standardFields = `
    id TEXT PRIMARY KEY,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    createdBy TEXT,
    status TEXT DEFAULT 'active',
    deletedAt TEXT
  `;

  // 1. Create Institutions Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS institutions (
      ${standardFields},
      name TEXT UNIQUE,
      regNo TEXT UNIQUE,
      email TEXT,
      logoUrl TEXT,
      primaryColor TEXT,
      secondaryColor TEXT,
      campusCount INTEGER DEFAULT 0,
      departmentCount INTEGER DEFAULT 0
    )
  `);

  // 2. Create Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      ${standardFields},
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT,
      email TEXT,
      contact TEXT,
      faceEnrollId TEXT,
      fingerprintStatus TEXT DEFAULT 'pending',
      mpin TEXT,
      institutionId TEXT,
      institutionName TEXT,
      rollNo TEXT,
      regNo TEXT,
      department TEXT,
      batch TEXT,
      enrolledAt TEXT,
      mustResetPassword INTEGER DEFAULT 1,
      failedLoginAttempts INTEGER DEFAULT 0,
      lockedUntil TEXT,
      FOREIGN KEY (institutionId) REFERENCES institutions (id) ON DELETE SET NULL
    )
  `);

  // 3. Create Certificates Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS certificates (
      ${standardFields},
      studentName TEXT,
      rollNo TEXT,
      regNo TEXT,
      degree TEXT,
      department TEXT,
      cgpa REAL,
      institutionId TEXT,
      institutionName TEXT,
      issueDate TEXT,
      blockchainHash TEXT UNIQUE,
      signature TEXT,
      statusHistory TEXT,
      dob TEXT,
      yearOfPassout TEXT,
      pdfMarksheet TEXT,
      FOREIGN KEY (institutionId) REFERENCES institutions (id) ON DELETE CASCADE
    )
  `);

  // 4. Create Audit Logs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      ${standardFields},
      userId TEXT,
      userName TEXT,
      userRole TEXT,
      action TEXT,
      details TEXT,
      riskScore INTEGER DEFAULT 0,
      ipAddress TEXT,
      deviceFingerprint TEXT
    )
  `);

  // 5. Create Blockchain Ledger Blocks Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_ledger (
      number INTEGER PRIMARY KEY,
      hash TEXT UNIQUE,
      parentHash TEXT,
      timestamp TEXT,
      transactions TEXT,
      nonce TEXT,
      difficulty TEXT,
      gasUsed INTEGER DEFAULT 0,
      gasLimit INTEGER DEFAULT 30000000,
      miner TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      deletedAt TEXT
    )
  `);

  // 6. Create Fraud Reports Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS fraud_reports (
      ${standardFields},
      type TEXT,
      severity TEXT,
      details TEXT,
      resolved INTEGER DEFAULT 0
    )
  `);

  // 7. Create SOC Events Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS soc_events (
      ${standardFields},
      type TEXT,
      severity TEXT,
      message TEXT,
      source TEXT
    )
  `);

  // 8. Create Notifications Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      ${standardFields},
      timestamp TEXT,
      type TEXT,
      title TEXT,
      message TEXT,
      read INTEGER DEFAULT 0,
      severity TEXT,
      audience TEXT
    )
  `);

  // 9. Create Sessions (Refresh Tokens) Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      ${standardFields},
      userId TEXT,
      refreshToken TEXT UNIQUE,
      device TEXT,
      ipAddress TEXT,
      expiresAt TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 10. Create OTP Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS otp (
      ${standardFields},
      userId TEXT,
      code TEXT,
      expiresAt TEXT,
      verified INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 11. Create Biometrics Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS biometrics (
      ${standardFields},
      userId TEXT,
      biometricType TEXT,
      enrollmentData TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 12. Create Fingerprint Templates Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS fingerprint_templates (
      ${standardFields},
      userId TEXT,
      enrollId TEXT,
      templateName TEXT,
      templateHash TEXT,
      deviceId TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 13. Create Support Tickets Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      ${standardFields},
      userId TEXT,
      userName TEXT,
      userRole TEXT,
      category TEXT,
      subject TEXT,
      message TEXT,
      replies TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 14. Create Backups Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS backups (
      ${standardFields},
      timestamp TEXT,
      type TEXT,
      size TEXT,
      checksum TEXT
    )
  `);

  // 15. Create API Keys Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      ${standardFields},
      name TEXT,
      apiKey TEXT UNIQUE,
      environment TEXT,
      rateLimit INTEGER DEFAULT 1000,
      requestsToday INTEGER DEFAULT 0,
      lastUsedAt TEXT,
      institutionId TEXT,
      FOREIGN KEY (institutionId) REFERENCES institutions (id) ON DELETE CASCADE
    )
  `);

  // 16. Create Campuses Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS campuses (
      ${standardFields},
      institutionId TEXT,
      name TEXT,
      location TEXT,
      campusDean TEXT,
      activeStudentCount INTEGER DEFAULT 0,
      FOREIGN KEY (institutionId) REFERENCES institutions (id) ON DELETE CASCADE
    )
  `);

  // 17. Create Departments Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      ${standardFields},
      institutionId TEXT,
      name TEXT,
      code TEXT,
      headOfDept TEXT,
      courseCount INTEGER DEFAULT 0,
      FOREIGN KEY (institutionId) REFERENCES institutions (id) ON DELETE CASCADE
    )
  `);

  // 18. Create Help Articles Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS help_articles (
      ${standardFields},
      category TEXT,
      title TEXT,
      body TEXT,
      keywords TEXT,
      relatedRoutes TEXT
    )
  `);

  // 19. Create FAQs Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS faqs (
      ${standardFields},
      question TEXT,
      answer TEXT,
      category TEXT
    )
  `);

  // 20. Create Troubleshooting Guides Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS troubleshooting_guides (
      ${standardFields},
      problem TEXT,
      reason TEXT,
      resolution TEXT,
      recommendedAction TEXT
    )
  `);

  // 21. Create Recent Searches Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recent_searches (
      ${standardFields},
      userId TEXT,
      query TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // 22. Create Feedback Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      ${standardFields},
      userId TEXT,
      userName TEXT,
      type TEXT,
      title TEXT,
      description TEXT,
      FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // ----------------------------------------------------
  // MIGRATIONS & DATA SEEDING
  // ----------------------------------------------------

  // 1. Seed Institutions
  const instCount = await db.get('SELECT COUNT(*) as count FROM institutions WHERE deletedAt IS NULL');
  if (instCount.count === 0) {
    console.log('Seeding default approved institutions...');
    const defaultInsts = [
      { id: 'inst-mit', name: 'Massachusetts Institute of Technology', regNo: 'US-MIT-1002', email: 'credentials@mit.edu', status: 'approved', logoUrl: '/logo.jpg', primaryColor: '#6C63FF', secondaryColor: '#4F46E5', campusCount: 3, departmentCount: 4 },
      { id: 'inst-stanford', name: 'Stanford University', regNo: 'US-STAN-1003', email: 'credentials@stanford.edu', status: 'approved', logoUrl: '/logo.jpg', primaryColor: '#8C1515', secondaryColor: '#4F46E5', campusCount: 4, departmentCount: 6 },
      { id: 'inst-harvard', name: 'Harvard University', regNo: 'US-HARV-1004', email: 'credentials@harvard.edu', status: 'approved', logoUrl: '/logo.jpg', primaryColor: '#A51C30', secondaryColor: '#4F46E5', campusCount: 5, departmentCount: 8 },
      { id: 'inst-caltech', name: 'California Institute of Technology', regNo: 'US-CALT-1005', email: 'credentials@caltech.edu', status: 'approved', logoUrl: '/logo.jpg', primaryColor: '#FF6600', secondaryColor: '#4F46E5', campusCount: 2, departmentCount: 3 },
      { id: 'inst-oxford', name: 'University of Oxford', regNo: 'UK-OXFD-1006', email: 'credentials@ox.ac.uk', status: 'approved', logoUrl: '/logo.jpg', primaryColor: '#002147', secondaryColor: '#4F46E5', campusCount: 6, departmentCount: 12 },
      { id: 'inst-cambridge', name: 'University of Cambridge', regNo: 'UK-CAMB-1007', email: 'credentials@cam.ac.uk', status: 'approved', logoUrl: '/logo.jpg', primaryColor: '#00BFFF', secondaryColor: '#4F46E5', campusCount: 6, departmentCount: 11 }
    ];
    for (const inst of defaultInsts) {
      await db.run(
        `INSERT INTO institutions (id, name, regNo, email, status, logoUrl, primaryColor, secondaryColor, campusCount, departmentCount, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [inst.id, inst.name, inst.regNo, inst.email, inst.status, inst.logoUrl, inst.primaryColor, inst.secondaryColor, inst.campusCount, inst.departmentCount, 'system']
      );
    }
  }

  // 2. Seed Users with UNIQUE passwords
  const userCount = await db.get('SELECT COUNT(*) as count FROM users WHERE deletedAt IS NULL');
  if (userCount.count === 0) {
    console.log('Seeding initial user ledger with unique random passwords...');
    const seedUserRecords = [
      { id: 'usr-madhan', username: 'madhan', role: 'admin', name: 'Mr. MADHAN', email: 'madhan@aegiscert.gov', contact: '+1 (555) 019-8822', faceEnrollId: '', fingerprintStatus: 'pending', mpin: '', institutionId: null, institutionName: null },
      { id: 'usr-honeytoken-1', username: 'backup_root', role: 'admin', name: 'Backup System Root Daemon', email: 'honeypot.root@aegiscert.gov', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '' },
      { id: 'usr-honeytoken-2', username: 'database_root', role: 'admin', name: 'Database Administrator Daemon', email: 'honeypot.db@aegiscert.gov', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '' },
      { id: 'usr-mit', username: 'mit', role: 'institution', name: 'MIT Registrar Office', email: 'registrar@mit.edu', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '123456', institutionId: 'inst-mit', institutionName: 'Massachusetts Institute of Technology' },
      { id: 'usr-stanford', username: 'stanford', role: 'institution', name: 'Stanford Registrar Office', email: 'registrar@stanford.edu', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '123456', institutionId: 'inst-stanford', institutionName: 'Stanford University' },
      { id: 'usr-harvard', username: 'harvard', role: 'institution', name: 'Harvard Registrar Office', email: 'registrar@harvard.edu', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '123456', institutionId: 'inst-harvard', institutionName: 'Harvard University' },
      { id: 'usr-caltech', username: 'caltech', role: 'institution', name: 'Caltech Registrar Office', email: 'registrar@caltech.edu', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '123456', institutionId: 'inst-caltech', institutionName: 'California Institute of Technology' },
      { id: 'usr-oxford', username: 'oxford', role: 'institution', name: 'Oxford Registrar Office', email: 'registrar@ox.ac.uk', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '123456', institutionId: 'inst-oxford', institutionName: 'University of Oxford' },
      { id: 'usr-cambridge', username: 'cambridge', role: 'institution', name: 'Cambridge Registrar Office', email: 'registrar@cam.ac.uk', contact: '', faceEnrollId: '', fingerprintStatus: '', mpin: '123456', institutionId: 'inst-cambridge', institutionName: 'University of Cambridge' },
      { id: 'usr-student', username: 'student', role: 'student', name: 'Alex Johnson', email: 'alex.j@student.mit.edu', contact: '+1 (555) 012-3810', faceEnrollId: 'face-mock-alex-johnson-2026', fingerprintStatus: 'enrolled', mpin: '123456', institutionId: 'inst-mit', institutionName: 'Massachusetts Institute of Technology', rollNo: 'MIT-2024-082', regNo: 'REG-9923881', department: 'Computer Science', batch: '2024', enrolledAt: '2026-06-21T09:00:00Z' }
    ];

    for (const u of seedUserRecords) {
      // Generate a secure random password for each seed user record
      const tempPass = crypto.randomUUID().slice(0, 10);
      const hashedPassword = bcrypt.hashSync(tempPass, 12);
      const hashedMpin = u.mpin ? bcrypt.hashSync(u.mpin, 12) : null;

      console.log(`[SEED USER] Username: "${u.username}" | Temporary Password: "${tempPass}"`);

      await db.run(
        `INSERT INTO users (id, username, password, role, name, email, contact, faceEnrollId, fingerprintStatus, mpin, institutionId, institutionName, rollNo, regNo, department, batch, enrolledAt, mustResetPassword, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.username, hashedPassword, u.role, u.name, u.email, u.contact || '', u.faceEnrollId || '', u.fingerprintStatus || 'pending', hashedMpin, u.institutionId || null, u.institutionName || null, u.rollNo || '', u.regNo || '', u.department || '', u.batch || '', u.enrolledAt || '', 1, 'system']
      );
    }
  }

  // 3. Seed Genesis Block
  const blockCount = await db.get('SELECT COUNT(*) as count FROM blockchain_ledger');
  if (blockCount.count === 0) {
    console.log('Seeding genesis block into ledger...');
    const genesisBlock = {
      number: 0,
      hash: '0x0000a3f9e8d1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: new Date('2026-06-20T08:00:00Z').toISOString(),
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

  console.log('Database schemas & seed migrations configured successfully.');
}
