-- ======================================================
-- AegisCert Supabase PostgreSQL Database Schema (vFinal)
-- Copy and paste this script into your Supabase SQL Editor.
-- ======================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT CHECK (role IN ('admin', 'institution', 'student', 'verifier')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
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
    enrolledAt TEXT
);

-- 2. Create Institutions Table
CREATE TABLE IF NOT EXISTS institutions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    regNo TEXT UNIQUE,
    email TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
    createdAt TEXT,
    logoUrl TEXT,
    primaryColor TEXT,
    secondaryColor TEXT,
    campusCount INTEGER DEFAULT 1,
    departmentCount INTEGER DEFAULT 1
);

-- 3. Create Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    studentName TEXT NOT NULL,
    rollNo TEXT NOT NULL,
    regNo TEXT NOT NULL,
    degree TEXT NOT NULL,
    department TEXT NOT NULL,
    cgpa NUMERIC(3,2) NOT NULL,
    institutionId TEXT NOT NULL,
    institutionName TEXT NOT NULL,
    issueDate TEXT,
    blockchainHash TEXT UNIQUE NOT NULL,
    signature TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft', 'pending', 'issued', 'active', 'suspended', 'revoked', 'expired')),
    statusHistory JSONB DEFAULT '[]'::jsonb,
    dob TEXT,
    yearOfPassout TEXT,
    pdfMarksheet TEXT
);

-- 4. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    userRole TEXT,
    action TEXT NOT NULL,
    details TEXT,
    status TEXT CHECK (status IN ('success', 'failure')),
    timestamp TEXT NOT NULL
);

-- 5. Create SOC Events Table
CREATE TABLE IF NOT EXISTS soc_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    message TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT,
    source TEXT
);

-- 6. Create Login History Table
CREATE TABLE IF NOT EXISTS login_history (
    id TEXT PRIMARY KEY,
    userId TEXT,
    username TEXT,
    timestamp TEXT NOT NULL,
    ipAddress TEXT,
    deviceType TEXT,
    status TEXT
);

-- 7. Create Active Sessions Table
CREATE TABLE IF NOT EXISTS active_sessions (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    userRole TEXT,
    device TEXT,
    ipAddress TEXT,
    loginTime TEXT,
    lastActive TEXT
);

-- 8. Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 9. Create Campuses Table
CREATE TABLE IF NOT EXISTS campuses (
    id TEXT PRIMARY KEY,
    institutionId TEXT,
    name TEXT NOT NULL,
    location TEXT,
    campusDean TEXT,
    status TEXT,
    activeStudentCount INTEGER DEFAULT 0
);

-- 10. Create Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    institutionId TEXT,
    name TEXT NOT NULL,
    code TEXT,
    headOfDept TEXT,
    status TEXT,
    courseCount INTEGER DEFAULT 0
);

-- 11. Create API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    apiKey TEXT UNIQUE NOT NULL,
    environment TEXT,
    status TEXT CHECK (status IN ('active', 'revoked')),
    rateLimit INTEGER DEFAULT 1000,
    requestsToday INTEGER DEFAULT 0,
    createdAt TEXT,
    lastUsedAt TEXT
);

-- 12. Create API Logs Table
CREATE TABLE IF NOT EXISTS api_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    path TEXT,
    method TEXT,
    statusCode INTEGER,
    latency INTEGER,
    clientIp TEXT,
    apiKeyName TEXT
);

-- 13. Create OCR Reports Table
CREATE TABLE IF NOT EXISTS ocr_reports (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    fileName TEXT,
    fileSize TEXT,
    status TEXT,
    authenticityScore INTEGER DEFAULT 0,
    verifiedAddress TEXT,
    alertsCount INTEGER DEFAULT 0,
    detailedAnalyses JSONB DEFAULT '{}'::jsonb
);

-- 14. Create Backup Snapshots Table
CREATE TABLE IF NOT EXISTS backup_snapshots (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    type TEXT,
    size TEXT,
    blockHeight INTEGER,
    transactionCount INTEGER,
    checksum TEXT,
    status TEXT,
    hashIntegrity TEXT
);

-- 15. Create Recovery Logs Table
CREATE TABLE IF NOT EXISTS recovery_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    type TEXT,
    snapshotId TEXT,
    status TEXT,
    details TEXT,
    operator TEXT,
    hashCheck TEXT
);

-- 16. Create Device Registrations Table
CREATE TABLE IF NOT EXISTS device_registrations (
    id TEXT PRIMARY KEY,
    userId TEXT,
    deviceName TEXT,
    type TEXT,
    status TEXT,
    ipAddress TEXT,
    enrolledAt TEXT,
    lastActivity TEXT
);

-- 17. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    type TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    severity TEXT,
    audience TEXT
);

-- 18. Create Help Articles Table
CREATE TABLE IF NOT EXISTS help_articles (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    keywords JSONB DEFAULT '[]'::jsonb,
    relatedRoutes JSONB DEFAULT '[]'::jsonb
);

-- 19. Create FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL
);

-- 20. Create Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    userName TEXT,
    userRole TEXT,
    category TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT CHECK (status IN ('open', 'pending', 'resolved')),
    timestamp TEXT NOT NULL,
    replies JSONB DEFAULT '[]'::jsonb
);

-- 21. Create Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    userName TEXT,
    type TEXT CHECK (type IN ('bug', 'feature', 'suggestion')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    status TEXT DEFAULT 'open'
);

-- 22. Create Troubleshooting Guides Table
CREATE TABLE IF NOT EXISTS troubleshooting_guides (
    id TEXT PRIMARY KEY,
    problem TEXT NOT NULL,
    reason TEXT,
    resolution TEXT,
    recommendedAction TEXT
);

-- 23. Create Recent Searches Table
CREATE TABLE IF NOT EXISTS recent_searches (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    query TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- 24. Create Blockchain Ledger blocks Table
CREATE TABLE IF NOT EXISTS blockchain_ledger (
    number INTEGER PRIMARY KEY,
    hash TEXT UNIQUE NOT NULL,
    parentHash TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    transactions JSONB DEFAULT '[]'::jsonb,
    nonce TEXT NOT NULL,
    difficulty TEXT,
    gasUsed INTEGER DEFAULT 0,
    gasLimit INTEGER DEFAULT 30000000,
    miner TEXT
);

-- ----------------------------------------------------
-- SEED DEFAULT DATA SETS
-- ----------------------------------------------------

-- Seed Institutions
INSERT INTO institutions (id, name, regNo, email, status, createdAt, logoUrl, primaryColor, secondaryColor, campusCount, departmentCount) VALUES
('inst-mit', 'Massachusetts Institute of Technology', 'US-MIT-1002', 'credentials@mit.edu', 'approved', '2026-06-20T08:00:00Z', '/logo.jpg', '#6C63FF', '#4F46E5', 3, 4),
('inst-stanford', 'Stanford University', 'US-STAN-1003', 'credentials@stanford.edu', 'approved', '2026-06-20T08:00:00Z', '/logo.jpg', '#8C1515', '#4F46E5', 4, 6),
('inst-harvard', 'Harvard University', 'US-HARV-1004', 'credentials@harvard.edu', 'approved', '2026-06-20T08:00:00Z', '/logo.jpg', '#A51C30', '#4F46E5', 5, 8),
('inst-caltech', 'California Institute of Technology', 'US-CALT-1005', 'credentials@caltech.edu', 'approved', '2026-06-20T08:00:00Z', '/logo.jpg', '#FF6600', '#4F46E5', 2, 3),
('inst-oxford', 'University of Oxford', 'UK-OXFD-1006', 'credentials@ox.ac.uk', 'approved', '2026-06-20T08:00:00Z', '/logo.jpg', '#002147', '#4F46E5', 6, 12),
('inst-cambridge', 'University of Cambridge', 'UK-CAMB-1007', 'credentials@cam.ac.uk', 'approved', '2026-06-20T08:00:00Z', '/logo.jpg', '#00BFFF', '#4F46E5', 6, 11)
ON CONFLICT (id) DO NOTHING;

-- Seed Users
INSERT INTO users (id, username, password, role, name, email, contact, faceEnrollId, fingerprintStatus, mpin, institutionId, institutionName, rollNo, regNo, department, batch, enrolledAt) VALUES
('usr-madhan', 'madhan', 'bcrypt$12$62637279707424313224376161313437', 'admin', 'Mr. MADHAN', 'madhan@aegiscert.gov', '+1 (555) 019-8822', '', 'pending', '', '', '', '', '', '', '', ''),
('usr-honeytoken-1', 'backup_root', 'bcrypt$12$62637279707424313224376161313437', 'admin', 'Backup System Root Daemon', 'honeypot.root@aegiscert.gov', '', '', '', '', '', '', '', '', '', '', ''),
('usr-honeytoken-2', 'database_root', 'bcrypt$12$62637279707424313224376161313437', 'admin', 'Database Administrator Daemon', 'honeypot.db@aegiscert.gov', '', '', '', '', '', '', '', '', '', '', ''),
('usr-mit', 'mit', 'bcrypt$12$62637279707424313224376161313437', 'institution', 'MIT Registrar Office', 'registrar@mit.edu', '', '', '', 'bcrypt$12$62637279707424313224376161313437', 'inst-mit', 'Massachusetts Institute of Technology', '', '', '', '', ''),
('usr-stanford', 'stanford', 'bcrypt$12$62637279707424313224376161313437', 'institution', 'Stanford Registrar Office', 'registrar@stanford.edu', '', '', '', 'bcrypt$12$62637279707424313224376161313437', 'inst-stanford', 'Stanford University', '', '', '', '', ''),
('usr-harvard', 'harvard', 'bcrypt$12$62637279707424313224376161313437', 'institution', 'Harvard Registrar Office', 'registrar@harvard.edu', '', '', '', 'bcrypt$12$62637279707424313224376161313437', 'inst-harvard', 'Harvard University', '', '', '', '', ''),
('usr-caltech', 'caltech', 'bcrypt$12$62637279707424313224376161313437', 'institution', 'Caltech Registrar Office', 'registrar@caltech.edu', '', '', '', 'bcrypt$12$62637279707424313224376161313437', 'inst-caltech', 'California Institute of Technology', '', '', '', '', ''),
('usr-oxford', 'oxford', 'bcrypt$12$62637279707424313224376161313437', 'institution', 'Oxford Registrar Office', 'registrar@ox.ac.uk', '', '', '', 'bcrypt$12$62637279707424313224376161313437', 'inst-oxford', 'University of Oxford', '', '', '', '', ''),
('usr-cambridge', 'cambridge', 'bcrypt$12$62637279707424313224376161313437', 'institution', 'Cambridge Registrar Office', 'registrar@cam.ac.uk', '', '', '', 'bcrypt$12$62637279707424313224376161313437', 'inst-cambridge', 'University of Cambridge', '', '', '', '', ''),
('usr-student', 'student', 'bcrypt$12$62637279707424313224376161313437', 'student', 'Alex Johnson', 'alex.j@student.mit.edu', '+1 (555) 012-3810', 'face-mock-alex-johnson-2026', 'enrolled', 'bcrypt$12$62637279707424313224376161313437', 'inst-mit', 'Massachusetts Institute of Technology', 'MIT-2024-082', 'REG-9923881', 'Computer Science', '2024', '2026-06-21T09:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Seed Settings
INSERT INTO settings (key, value) VALUES
('killSwitchActive', 'false'),
('dbIntegrityHash', 'sha256-merkle-initial-hash-000000')
ON CONFLICT (key) DO NOTHING;

-- Seed Help Articles
INSERT INTO help_articles (id, category, title, body, keywords, relatedRoutes) VALUES
('art-login', 'Getting Started', 'Troubleshooting Gateway Sign In', 'Ensure your 6-digit MPIN aligns with credential codes.\nAccounts freeze for 15 minutes after 5 consecutive failed attempts to thwart dictionary triggers.', '["signin", "lockout", "mpin"]', '["login"]'),
('art-issuance', 'Certificates', 'Registrar Certificate Anchoring Process', '1. Select Roll and Name parameter entries.\n2. Digital signatures are calculated using private keys.\n3. PoW nodes mine the ledger blocks to broadcast hashes.', '["issuance", "mining", "ledger"]', '["issuance"]'),
('art-biometrics', 'Biometrics', 'Resolving Biometric Ridges Matching Failures', 'Confirm Mantra MFS100 RD services driver daemon is online.\nIf minutiae detection errors occur, clean the lens surface.', '["fingerprint", "mfs100", "ridges"]', '["fingerprint"]'),
('art-blockchain', 'Blockchain', 'Ledger Audit Trail Inspections', 'The verified audit logs track transaction heights.\nSHA-256 blocks maintain absolute immutability against database modification.', '["blockchain", "explorer", "audit"]', '["explorer", "verification"]')
ON CONFLICT (id) DO NOTHING;

-- Seed FAQs
INSERT INTO faqs (id, question, answer, category) VALUES
('faq-1', 'How is data stored?', 'Your keys and audit trails are structured in a local SQLite relational system.', 'Security'),
('faq-2', 'What is the Emergency Freeze Killswitch?', 'The killswitch locks block mining and certificate issuance in case of security threats.', 'General')
ON CONFLICT (id) DO NOTHING;

-- Seed Troubleshooting Guides
INSERT INTO troubleshooting_guides (id, problem, reason, resolution, recommendedAction) VALUES
('trb-1', 'Mantra Scanner Connection Failed', 'RD service port 11100 blocked or daemon offline.', 'Confirm MFS100 USB plug status and restart Mantra RD service manager.', 'Restart RD service port 11100'),
('trb-2', 'Consensus Block Mining Stalled', 'Emergency Killswitch lock is active.', 'Admin must revoke the freeze toggle in Super Admin control settings.', 'Check Emergency Killswitch status')
ON CONFLICT (id) DO NOTHING;

-- Seed Genesis Block
INSERT INTO blockchain_ledger (number, hash, parentHash, timestamp, transactions, nonce, difficulty, gasUsed, gasLimit, miner) VALUES
(0, '0x0000a3f9e8d1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7', '0x0000000000000000000000000000000000000000000000000000000000000000', '2026-06-20T08:00:00Z', '[]', '0x2c', '14,839,281,992 Ghash', 0, 30000000, '0x0000000000000000000000000000000000000000')
ON CONFLICT (number) DO NOTHING;
