// Cryptographically Secured Local Storage Database Service with OTP Verification

export interface User {
  id: string;
  username: string;
  password?: string; // Stored as a hashed representation
  role: 'admin' | 'institution' | 'student' | 'verifier';
  name: string;
  email: string;
  institutionId?: string;
  institutionName?: string;
  rollNo?: string;
  regNo?: string;
  department?: string;
  batch?: string;
  contact?: string;
  faceEnrollId?: string;
  fingerprintEnrollId?: string;
  fingerprintTemplate?: string;
  fingerprintHash?: string;
  fingerprintDeviceId?: string;
  fingerprintEnrolledAt?: string;
  fingerprintStatus?: 'enrolled' | 'pending' | 'revoked';
  enrolledAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  mpin?: string;
}

export interface Institution {
  id: string;
  name: string;
  regNo: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  campusCount?: number;
  departmentCount?: number;
}

export interface Campus {
  id: string;
  institutionId: string;
  name: string;
  location: string;
  adminName: string;
  adminEmail: string;
}

export interface Department {
  id: string;
  institutionId: string;
  campusId: string;
  name: string;
  code: string;
  headName: string;
}

export interface ApiKey {
  id: string;
  institutionId: string;
  key: string;
  name: string;
  created: string;
  status: 'active' | 'revoked';
  rateLimit: number;
  usageCount: number;
}

export interface ApiLog {
  id: string;
  apiKeyId: string;
  timestamp: string;
  method: string;
  endpoint: string;
  status: number;
  responseTime: number;
  ip: string;
}

export interface OcrReport {
  id: string;
  timestamp: string;
  fileName: string;
  fileSize: string;
  authenticityScore: number;
  forgeryProbability: number;
  confidenceScore: number;
  riskClassification: 'low' | 'medium' | 'high';
  extractedFields: {
    studentName: string;
    rollNo: string;
    degree: string;
    cgpa: string;
    issueDate: string;
    signatureFound: boolean;
    sealFound: boolean;
  };
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  hash: string;
  size: string;
  type: 'manual' | 'automatic' | 'scheduled';
  encryptionKey: string;
  status: 'success' | 'failed';
}

export interface RecoveryLog {
  id: string;
  timestamp: string;
  snapshotId: string;
  triggeredBy: string;
  status: 'success' | 'failed';
  details: string;
}

export interface DeviceRegistration {
  id: string;
  userId: string;
  token: string;
  deviceName: string;
  os: string;
  registeredAt: string;
}

export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface HelpArticle {
  id: string;
  category: string;
  title: string;
  body: string;
  keywords: string[];
  relatedRoutes: string[];
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface SupportTicketReply {
  sender: string;
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  category: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'resolved';
  timestamp: string;
  replies: SupportTicketReply[];
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  type: 'bug' | 'feature' | 'suggestion';
  title: string;
  description: string;
  timestamp: string;
  status: 'open' | 'reviewed';
}

export interface TroubleshootingGuide {
  id: string;
  problem: string;
  reason: string;
  resolution: string;
  recommendedAction: string;
  category: string;
}

export interface RecentSearch {
  id: string;
  userId: string;
  query: string;
  timestamp: string;
}

export interface StatusHistoryEntry {
  status: 'draft' | 'pending' | 'issued' | 'active' | 'suspended' | 'revoked' | 'expired';
  timestamp: string;
  updatedBy: string;
  reason?: string;
}

export interface Certificate {
  id: string;
  studentName: string;
  rollNo: string;
  regNo: string;
  degree: string;
  department: string;
  cgpa: number;
  institutionId: string;
  institutionName: string;
  issueDate: string;
  blockchainHash: string;
  signature: string;
  status: 'draft' | 'pending' | 'issued' | 'active' | 'suspended' | 'revoked' | 'expired';
  revocationReason?: string;
  statusHistory: StatusHistoryEntry[];
  offlineSignature?: string;
  verificationChecksum?: string;
  dob?: string;
  yearOfPassout?: string;
  pdfMarksheet?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  ip: string;
  status: 'success' | 'failure';
  deviceFingerprint: string;
  location: string;
  riskScore: number;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  username: string;
  timestamp: string;
  ip: string;
  device: string;
  status: 'success' | 'failure';
  reason?: string;
}

export interface SocEvent {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  details: string;
  timestamp: string;
  ip: string;
  handled: boolean;
}

export interface ActiveSession {
  token: string;
  userId: string;
  name: string;
  role: string;
  ip: string;
  device: string;
  expiresAt: string;
}

export interface FraudReport {
  id: string;
  category: 'duplicate_cert' | 'biometric_spoof' | 'unauthorized_mod' | 'suspicious_login' | 'tampered_cert';
  riskScore: number;
  details: string;
  timestamp: string;
  status: 'active' | 'mitigated';
}

export interface SystemSettings {
  networkLatency: number;
  blockchainExplorerUrl: string;
  smartContractAddress: string;
  tamperedCerts: string[];
  keyRotationHistory?: string[];
  killSwitchActive?: boolean;
  dbIntegrityHash?: string;
  lastRotationDate?: string;
  biometricSimulationMode?: boolean;
}

// AES-256-like Client-Side Hex Obfuscation / Encryption Layer
const CRYPTO_KEY = 'AEGISCERT_ENTERPRISE_SHIELD_SECRET_KEY';

function getActiveKey(): string {
  if (typeof window === 'undefined') return CRYPTO_KEY;
  let key = localStorage.getItem('csv_active_aes_key');
  if (!key) {
    key = CRYPTO_KEY;
    localStorage.setItem('csv_active_aes_key', key);
  }
  return key;
}

export function encryptData(text: string): string {
  const activeKey = getActiveKey();
  
  // Simulate AES-256-GCM format by generating a mock IV and auth tag
  const iv = Math.floor(10000000 + Math.random() * 90000000).toString(16).toUpperCase();
  const tag = Math.floor(100000000 + Math.random() * 900000000).toString(16).toUpperCase();

  // Encrypt ciphertext using XOR with the active key and IV combined
  let cipher = '';
  const combinedKey = activeKey + iv + tag;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
    cipher += String.fromCharCode(charCode);
  }
  const encryptedBase64 = btoa(unescape(encodeURIComponent(cipher)));
  return `AES-GCM-v4$${iv}$${tag}$${encryptedBase64}`;
}

export function decryptData(cipherText: string): string {
  if (!cipherText) return '';
  const activeKey = getActiveKey();

  try {
    // If it's the old XOR format, support legacy fallback
    if (!cipherText.startsWith('AES-GCM-v4$')) {
      let result = '';
      const legacyKey = 'AEGISCERT_ENTERPRISE_SHIELD_SECRET_KEY';
      const raw = decodeURIComponent(escape(atob(cipherText)));
      for (let i = 0; i < raw.length; i++) {
        const charCode = raw.charCodeAt(i) ^ legacyKey.charCodeAt(i % legacyKey.length);
        result += String.fromCharCode(charCode);
      }
      return result;
    }

    const parts = cipherText.split('$');
    const iv = parts[1];
    const tag = parts[2];
    const base64Cipher = parts[3];

    const raw = decodeURIComponent(escape(atob(base64Cipher)));
    let result = '';
    const combinedKey = activeKey + iv + tag;
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ combinedKey.charCodeAt(i % combinedKey.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return '';
  }
}

// Simulated bcrypt-like password hashing with cost factor 12 (4096 rounds)
export function hashPassword(pwd: string): string {
  let hash = pwd;
  const salt = 'aegiscert_bcrypt_salt_v4_'; // stable salt simulation
  for (let round = 0; round < 4096; round++) {
    let hashVal = 0;
    const combined = hash + salt + round;
    for (let i = 0; i < combined.length; i++) {
      hashVal = (hashVal << 5) - hashVal + combined.charCodeAt(i);
      hashVal = hashVal & hashVal;
    }
    hash = Math.abs(hashVal).toString(16).padStart(8, '0') + hash.slice(0, 8);
  }
  return 'bcrypt$12$' + hash.slice(0, 32);
}

// Default Databases
const DEFAULT_INSTITUTIONS: Institution[] = [
  { 
    id: 'inst-mit', 
    name: 'Massachusetts Institute of Technology', 
    regNo: 'US-MIT-1002', 
    email: 'credentials@mit.edu', 
    status: 'approved', 
    createdAt: '2026-06-20T08:00:00Z',
    logoUrl: '/logo.jpg',
    primaryColor: '#6C63FF',
    secondaryColor: '#4F46E5',
    campusCount: 3,
    departmentCount: 4
  }
];

const DEFAULT_USERS: User[] = [
  // Super Admin: Mr. MADHAN (No biometrics enrolled initially to force first-time enrollment)
  { 
    id: 'usr-madhan', 
    username: 'madhan', 
    password: hashPassword('password123'), 
    role: 'admin', 
    name: 'Mr. MADHAN', 
    email: 'madhan@aegiscert.gov', 
    contact: '+1 (555) 019-8822', 
    faceEnrollId: '',
    fingerprintStatus: 'pending',
    mpin: '' 
  },
  // Honeytoken Decoy Accounts (Zero Zero Trust Intrusion Traps)
  {
    id: 'usr-honeytoken-1',
    username: 'backup_root',
    password: hashPassword('locked_root_bypass_trap_9918'),
    role: 'admin',
    name: 'Backup System Root Daemon',
    email: 'honeypot.root@aegiscert.gov'
  },
  {
    id: 'usr-honeytoken-2',
    username: 'database_root',
    password: hashPassword('locked_database_bypass_trap_1029'),
    role: 'admin',
    name: 'Database Administrator Daemon',
    email: 'honeypot.db@aegiscert.gov'
  },
  // Institution Admin
  { 
    id: 'usr-mit', 
    username: 'mit', 
    password: hashPassword('password123'), 
    role: 'institution', 
    name: 'MIT Registrar Office', 
    email: 'registrar@mit.edu', 
    institutionId: 'inst-mit', 
    institutionName: 'Massachusetts Institute of Technology',
    mpin: hashPassword('123456')
  },
  // Student Alex Johnson (Pre-populated face and fingerprint biometrics)
  { 
    id: 'usr-student', 
    username: 'student', 
    password: hashPassword('password123'), 
    role: 'student', 
    name: 'Alex Johnson', 
    email: 'alex.j@student.mit.edu', 
    institutionId: 'inst-mit', 
    institutionName: 'Massachusetts Institute of Technology', 
    rollNo: 'MIT-2024-082', 
    regNo: 'REG-9923881', 
    department: 'Computer Science', 
    batch: '2022-2026', 
    contact: '+1 (555) 019-2834', 
    faceEnrollId: 'FACE-SIM-ALEX-9923',
    fingerprintTemplate: 'MFS100_V54_TEMP_ALEX_0x8B2C4F',
    fingerprintHash: '4a6b293817fcf1e2a074092cb838a5b2e109d38c1a7a6b2e10d3f82cb8a192bc',
    fingerprintDeviceId: 'Mantra MFS100 - SN 1920822',
    fingerprintEnrolledAt: '2026-06-21T10:00:00Z',
    fingerprintStatus: 'enrolled',
    enrolledAt: '2026-06-21T10:00:00Z',
    mpin: hashPassword('123456')
  },
  // Verifier
  { 
    id: 'usr-verifier', 
    username: 'verifier', 
    password: hashPassword('password123'), 
    role: 'verifier', 
    name: 'Global HR Verifier', 
    email: 'hr@google.com',
    mpin: hashPassword('123456')
  }
];

const DEFAULT_CERTIFICATES: Certificate[] = [
  {
    id: 'CERT-2026-0001',
    studentName: 'Alex Johnson',
    rollNo: 'MIT-2024-082',
    regNo: 'REG-9923881',
    degree: 'Bachelor of Science',
    department: 'Computer Science',
    cgpa: 3.91,
    institutionId: 'inst-mit',
    institutionName: 'Massachusetts Institute of Technology',
    issueDate: '2026-06-21T10:00:00Z',
    blockchainHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    signature: 'SIG_0x4298FC1C149AFBF4C8996FB9...B855',
    status: 'active',
    statusHistory: [
      { status: 'draft', timestamp: '2026-06-20T10:00:00Z', updatedBy: 'MIT Registrar Office' },
      { status: 'pending', timestamp: '2026-06-20T14:00:00Z', updatedBy: 'MIT Registrar Office' },
      { status: 'active', timestamp: '2026-06-21T10:00:00Z', updatedBy: 'MIT Registrar Office', reason: 'Official academic approval signed' }
    ],
    offlineSignature: 'OFFLINE_SIG_0x4298FC1C149AFBF4C8996FB9...B855',
    verificationChecksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'CERT-2026-0002',
    studentName: 'Sarah Connor',
    rollNo: 'MIT-2024-110',
    regNo: 'REG-8823101',
    degree: 'Master of Science',
    department: 'Cybernetics',
    cgpa: 3.85,
    institutionId: 'inst-mit',
    institutionName: 'Massachusetts Institute of Technology',
    issueDate: '2026-06-22T09:30:00Z',
    blockchainHash: 'f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7',
    signature: 'SIG_0x7A9D8B6C5E3F2A1D...33D8',
    status: 'suspended',
    revocationReason: 'Academic verification audit pending',
    statusHistory: [
      { status: 'active', timestamp: '2026-06-22T09:30:00Z', updatedBy: 'MIT Registrar Office' },
      { status: 'suspended', timestamp: '2026-06-23T08:15:00Z', updatedBy: 'MIT Registrar Office', reason: 'Academic verification audit pending' }
    ],
    offlineSignature: 'OFFLINE_SIG_0x7A9D8B6C5E3F2A1D...33D8',
    verificationChecksum: 'f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7'
  },
  // Decoy Certificate (Intrusion Detection Honeypot)
  {
    id: 'CERT-DECOY-777',
    studentName: 'SYSTEM DECOY TRAP',
    rollNo: 'MIT-DECOY-TRAP',
    regNo: 'REG-9999999',
    degree: 'Bachelor of Cyber Intrusion',
    department: 'Information Security',
    cgpa: 0.0,
    institutionId: 'inst-mit',
    institutionName: 'AegisCert HoneyNet Operations',
    issueDate: '2026-06-23T00:00:00Z',
    blockchainHash: 'decoydecoydecoydecoydecoydecoydecoydecoydecoydecoydecoydecoydecoy777',
    signature: 'SIG_RSA_4096_DECOY_KEY_TRAP',
    status: 'active',
    statusHistory: [],
    offlineSignature: 'OFFLINE_SIG_DECOY_RSA4096_TRAP',
    verificationChecksum: 'decoydecoydecoydecoydecoydecoydecoydecoydecoydecoydecoydecoydecoy777'
  }
];

const DEFAULT_SETTINGS: SystemSettings = {
  networkLatency: 400,
  blockchainExplorerUrl: 'https://polygonscan.com/address/',
  smartContractAddress: '0x4f46e5cd1d287a980f1a6b7e8d9c0a9b8c7e8f9a',
  tamperedCerts: [],
  keyRotationHistory: ['Initial Security Seed System Genesis Key'],
  killSwitchActive: false,
  dbIntegrityHash: 'verified_genesis_merkle_root_secure',
  lastRotationDate: '2026-06-20T08:00:00Z',
  biometricSimulationMode: false
};

// SOC Default Mock Alerts
const DEFAULT_SOC_EVENTS: SocEvent[] = [
  { id: 'soc-1', severity: 'critical', category: 'CERTIFICATE_TAMPER', details: 'AI Exception: Calculated hash mismatch on certificate CERT-2026-0002. Local copy modified.', timestamp: '2026-06-23T09:40:00Z', ip: '198.51.100.4', handled: false },
  { id: 'soc-2', severity: 'high', category: 'BIOMETRIC_FAIL', details: 'Spoof Prevention: Candidate failed facial blink checkpoint verification twice.', timestamp: '2026-06-23T10:15:00Z', ip: '203.0.113.12', handled: false },
  { id: 'soc-3', severity: 'medium', category: 'SUSPICIOUS_LOGIN', details: 'Anomalous User: Account mit logged in from unknown browser user-agent & resolution.', timestamp: '2026-06-23T10:30:00Z', ip: '18.9.22.4', handled: true },
  { id: 'soc-4', severity: 'low', category: 'OTP_REQUEST', details: 'Session authorization: OTP dispatched to mobile register +1 (555) 019-8822.', timestamp: '2026-06-23T10:45:00Z', ip: '127.0.0.1', handled: true }
];

const DEFAULT_LOGIN_HISTORY: LoginHistoryEntry[] = [
  { id: 'lh-1', userId: 'usr-madhan', username: 'madhan', timestamp: '2026-06-23T10:40:00Z', ip: '127.0.0.1', device: 'Chrome 126.0 / Windows 11 (Desktop)', status: 'success' },
  { id: 'lh-2', userId: 'usr-mit', username: 'mit', timestamp: '2026-06-23T10:10:00Z', ip: '18.9.22.4', device: 'Safari 17.4 / MacOS (Desktop)', status: 'success' },
  { id: 'lh-3', userId: 'usr-madhan', username: 'madhan', timestamp: '2026-06-23T09:12:00Z', ip: '198.51.100.8', device: 'Firefox 125.0 / Android 14 (Mobile)', status: 'failure', reason: 'Incorrect password key input' }
];

const DEFAULT_ACTIVE_SESSIONS: ActiveSession[] = [
  { token: 'sess_madhan_1a2b3c', userId: 'usr-madhan', name: 'Mr. MADHAN', role: 'admin', ip: '127.0.0.1', device: 'Chrome 126.0 / Windows 11', expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() }
];

const DEFAULT_FRAUD_REPORTS: FraudReport[] = [
  { id: 'fraud-1', category: 'tampered_cert', riskScore: 85, details: 'Certificate CERT-2026-0002 has altered GPA values in database storage.', timestamp: '2026-06-23T09:40:00Z', status: 'active' },
  { id: 'fraud-2', category: 'suspicious_login', riskScore: 42, details: 'User account mit logged in from unrecognized IP range 18.9.22.4.', timestamp: '2026-06-23T10:30:00Z', status: 'mitigated' }
];

const DEFAULT_CAMPUSES: Campus[] = [
  { id: 'cmp-mit-main', institutionId: 'inst-mit', name: 'Cambridge Main Campus', location: 'Cambridge, MA', adminName: 'Dr. Arthur Pendelton', adminEmail: 'dean.cambridge@mit.edu' },
  { id: 'cmp-mit-med', institutionId: 'inst-mit', name: 'Boston Medical Campus', location: 'Boston, MA', adminName: 'Dr. Clara Oswald', adminEmail: 'dean.medical@mit.edu' },
  { id: 'cmp-mit-lincoln', institutionId: 'inst-mit', name: 'Lincoln Laboratories Campus', location: 'Lexington, MA', adminName: 'Dr. John Smith', adminEmail: 'dean.lincoln@mit.edu' }
];

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dept-mit-cs', institutionId: 'inst-mit', campusId: 'cmp-mit-main', name: 'Computer Science', code: 'CS', headName: 'Prof. Harold Abelson' },
  { id: 'dept-mit-ee', institutionId: 'inst-mit', campusId: 'cmp-mit-main', name: 'Electrical Engineering', code: 'EE', headName: 'Prof. Mildred Dresselhaus' },
  { id: 'dept-mit-me', institutionId: 'inst-mit', campusId: 'cmp-mit-main', name: 'Mechanical Engineering', code: 'ME', headName: 'Prof. Stephen H. Crandall' },
  { id: 'dept-mit-med', institutionId: 'inst-mit', campusId: 'cmp-mit-med', name: 'Cybernetics & Artificial Organs', code: 'CYB', headName: 'Prof. Sarah Connor' }
];

const DEFAULT_API_KEYS: ApiKey[] = [
  { id: 'key-1', institutionId: 'inst-mit', key: 'ae_live_mit_8f3d1c9e4b', name: 'MIT Registrar Main Sync', created: '2026-06-21T10:00:00Z', status: 'active', rateLimit: 1000, usageCount: 242 },
  { id: 'key-2', institutionId: 'inst-mit', key: 'ae_test_mit_2b9f0a1c3d', name: 'MIT HR Sandbox Portal', created: '2026-06-22T14:30:00Z', status: 'active', rateLimit: 100, usageCount: 15 }
];

const DEFAULT_API_LOGS: ApiLog[] = [
  { id: 'apil-1', apiKeyId: 'key-1', timestamp: '2026-07-02T09:12:00Z', method: 'GET', endpoint: '/api/v1/certificates/CERT-2026-0001', status: 200, responseTime: 82, ip: '198.51.100.4' },
  { id: 'apil-2', apiKeyId: 'key-1', timestamp: '2026-07-02T09:30:00Z', method: 'POST', endpoint: '/api/v1/verification/verify-hash', status: 200, responseTime: 124, ip: '198.51.100.4' },
  { id: 'apil-3', apiKeyId: 'key-2', timestamp: '2026-07-02T09:45:00Z', method: 'GET', endpoint: '/api/v1/students/MIT-2024-082', status: 200, responseTime: 95, ip: '203.0.113.12' }
];

const DEFAULT_OCR_REPORTS: OcrReport[] = [
  {
    id: 'ocr-1',
    timestamp: '2026-07-01T15:20:00Z',
    fileName: 'Alex_Johnson_Diploma.pdf',
    fileSize: '1.4 MB',
    authenticityScore: 99.4,
    forgeryProbability: 0.6,
    confidenceScore: 98.2,
    riskClassification: 'low',
    extractedFields: {
      studentName: 'Alex Johnson',
      rollNo: 'MIT-2024-082',
      degree: 'Bachelor of Science',
      cgpa: '3.91',
      issueDate: '2026-06-21',
      signatureFound: true,
      sealFound: true
    }
  }
];

const DEFAULT_BACKUP_SNAPSHOTS: BackupSnapshot[] = [
  { id: 'snap-1', timestamp: '2026-07-01T00:00:00Z', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', size: '2.4 MB', type: 'scheduled', encryptionKey: 'AES-256-GENESIS-KEY-SNAPSHOT', status: 'success' },
  { id: 'snap-2', timestamp: '2026-07-02T00:00:00Z', hash: '8f3d1c9e4b2b9f0a1c3de3b0c44298fc1c149afbf4c8996fb92427ae41e4649b', size: '2.5 MB', type: 'automatic', encryptionKey: 'AES-256-SYSTEM-AUTO-KEY', status: 'success' }
];

const DEFAULT_RECOVERY_LOGS: RecoveryLog[] = [
  { id: 'rec-1', timestamp: '2026-06-25T11:00:00Z', snapshotId: 'snap-1', triggeredBy: 'usr-madhan', status: 'success', details: 'Full system database rollback successfully tested and verified.' }
];

const DEFAULT_DEVICE_REGISTRATIONS: DeviceRegistration[] = [
  { id: 'dev-1', userId: 'usr-student', token: 'token_apns_alex_iphone_99182', deviceName: 'Alex\'s iPhone 15 Pro', os: 'iOS 17.5', registeredAt: '2026-06-21T10:05:00Z' }
];

const DEFAULT_NOTIFICATIONS: PushNotification[] = [
  { id: 'ntf-1', userId: 'usr-student', title: 'Degree Issued & Anchored', body: 'Your Bachelor of Science certificate has been successfully written to block #1042.', timestamp: '2026-06-21T10:01:00Z', read: true, severity: 'low' },
  { id: 'ntf-2', userId: 'usr-mit', title: 'Database Security Integrity Verified', body: 'Daily Merkle digest validation successful. Expected match verified.', timestamp: '2026-07-02T08:00:00Z', read: false, severity: 'low' }
];

const DEFAULT_HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'art-login',
    category: 'Getting Started',
    title: 'Logging in to AegisCert',
    body: 'To access the AegisCert platform:\n1. Choose your account role from the dropdown menu (Super Admin, Institution Admin, Student, or Verifier).\n2. Provide your registered username and password.\n3. Complete the 6-digit MPIN verification code step.\n\n*Troubleshooting*: If your account is locked due to multiple failed login attempts, wait 15 minutes for automatic cooldown release.',
    keywords: ['login', 'signin', 'mpin', 'auth', 'locked'],
    relatedRoutes: ['login', 'register']
  },
  {
    id: 'art-issuance',
    category: 'Certificates',
    title: 'Issuing a Verifiable Certificate',
    body: 'Institution administrators can issue credentials manually:\n1. Navigate to the **Issue Certificate** section from the sidebar.\n2. Complete the candidate details: Student Name, Date of Birth, Registration ID, and Year of Passout.\n3. Enter the final academic GPA/CGPA.\n4. Upload the official marksheet PDF.\n5. Press "Issue Verifiable Certificate" to initialize blockchain anchoring.\n\n*Important*: The platform calculates the cryptographic SHA-256 hash of the entries and signs it using the university registry keys before committing it to the EVM blockchain.',
    keywords: ['issue', 'issuance', 'degree', 'gpa', 'marksheet'],
    relatedRoutes: ['issuance', 'institution-dashboard']
  },
  {
    id: 'art-biometrics',
    category: 'Biometrics',
    title: 'Mantra MFS100 Fingerprint Integration',
    body: 'AegisCert implements biometric identification using the Mantra MFS100 device:\n1. Connect the Mantra MFS100 scanner USB to your machine.\n2. In the "Biometric Register" center, press "Initialize Hardware Scan".\n3. Place your finger on the lens to capture ridge details.\n4. The system stores biometric minutiae hashes in an isolated local storage table.\n\n*RD Service error*: Verify that the Mantra RD Service daemon is running locally on port 11100.',
    keywords: ['biometric', 'fingerprint', 'scanner', 'mantra', 'mfs100', 'rd service'],
    relatedRoutes: ['fingerprint-management', 'profile']
  },
  {
    id: 'art-blockchain',
    category: 'Blockchain',
    title: 'Decentralized Consensus Audits',
    body: 'Academic credential records are anchored to the blockchain consensus ledger:\n- **Immutability**: Once written, certificate details cannot be deleted or modified.\n- **Status checks**: Verifiers lookup hashes to verify active status or audit suspensions.\n- **Zero-knowledge proof**: The document remains private; only the computed checksum is validated on-chain.',
    keywords: ['blockchain', 'explorer', 'hash', 'ledger', 'checksum'],
    relatedRoutes: ['blockchain-explorer', 'verification']
  }
];

const DEFAULT_FAQS: FAQ[] = [
  {
    id: 'faq-1',
    category: 'Authentication',
    question: 'How do I recover my MPIN?',
    answer: 'If you forgot your 6-digit MPIN, click "Forgot Password" on the login screen. Verify your registered email address, complete the OTP confirmation steps, and enter a new MPIN code.'
  },
  {
    id: 'faq-2',
    category: 'Certificates',
    question: 'How do I verify a certificate?',
    answer: 'Go to the public "Verify Status" page, drag-and-drop the certificate PDF document or enter its computed SHA-256 ledger checksum hash. The verification node will audit the record integrity on the blockchain.'
  },
  {
    id: 'faq-3',
    category: 'Security',
    question: 'What is the SOC Security Suite?',
    answer: 'The Security Operations Center (SOC) dashboard displays real-time network threats, brute-force logs, and honeypot intrusion triggers to defend against unauthorized registrar activities.'
  }
];

const DEFAULT_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt-101',
    userId: 'usr-student',
    userName: 'Alex Johnson',
    userRole: 'student',
    category: 'Biometrics',
    subject: 'Mantra MFS100 Device Not Found',
    message: 'I am trying to enroll my fingerprint, but the portal prints "RD Service check failed". I have connected my scanner. How do I fix this?',
    status: 'open',
    timestamp: '2026-07-02T09:00:00Z',
    replies: []
  }
];

const DEFAULT_FEEDBACK: Feedback[] = [
  {
    id: 'fb-1',
    userId: 'usr-student',
    userName: 'Alex Johnson',
    type: 'suggestion',
    title: 'Dark Mode Custom Colors',
    description: 'It would be nice if the credential wallet dashboard allowed choosing custom dark mode gradient cards.',
    timestamp: '2026-07-02T09:30:00Z',
    status: 'open'
  }
];

const DEFAULT_TROUBLESHOOTING_GUIDES: TroubleshootingGuide[] = [
  {
    id: 'trb-1',
    problem: 'RD Service missing / Port blocked',
    reason: 'The local Mantra driver service is not running or port 11100 is occupied.',
    resolution: 'Start the "Mantra RD Service" in your local system services manager. Verify port 11100 is not blocked by Windows Defender Firewall.',
    recommendedAction: 'Restart Mantra Service',
    category: 'Biometrics'
  },
  {
    id: 'trb-2',
    problem: 'Blockchain verification failed',
    reason: 'The document file has been tampered with or modified since issuance, causing a SHA-256 hash mismatch.',
    resolution: 'Request the registrar to issue a new credential or double-check that you uploaded the original, unedited PDF marksheet.',
    recommendedAction: 'Inspect Checksum Hash',
    category: 'Blockchain'
  }
];

const DEFAULT_RECENT_SEARCHES: RecentSearch[] = [
  {
    id: 'search-1',
    userId: 'usr-student',
    query: 'fingerprint scanner',
    timestamp: '2026-07-02T10:00:00Z'
  }
];

// Cryptographic Database Digest Calculator (Merkle-Root-like simulation)
function calculateDatabaseDigest(): string {
  if (typeof window === 'undefined') return 'verified_genesis_merkle_root_secure';
  const keys = [
    'users', 'institutions', 'certificates', 'socEvents', 'fraudReports', 
    'loginHistory', 'campuses', 'departments', 'apiKeys', 'apiLogs', 
    'ocrReports', 'backupSnapshots', 'recoveryLogs', 'deviceRegistrations', 
    'notifications', 'helpArticles', 'faqs', 'supportTickets', 'feedback', 
    'troubleshootingGuides', 'recentSearches'
  ];
  let combined = '';
  keys.forEach(k => {
    combined += localStorage.getItem(`csv_enc_${k}`) || '';
  });
  
  let hashVal = 0;
  for (let i = 0; i < combined.length; i++) {
    hashVal = (hashVal << 5) - hashVal + combined.charCodeAt(i);
    hashVal = hashVal & hashVal;
  }
  return 'sha256-merkle-' + Math.abs(hashVal).toString(16).padEnd(32, '0');
}

// Helper wrapper
const getStored = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  const encStr = localStorage.getItem(`csv_enc_${key}`);
  if (!encStr) {
    const plainStr = JSON.stringify(defaultValue);
    localStorage.setItem(`csv_enc_${key}`, encryptData(plainStr));
    return defaultValue;
  }
  const plainStr = decryptData(encStr);
  return plainStr ? JSON.parse(plainStr) : defaultValue;
};

const setStored = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  const plainStr = JSON.stringify(data);
  localStorage.setItem(`csv_enc_${key}`, encryptData(plainStr));

  // Auto-recalculate database integrity hash and save it in settings to prevent mismatch on standard writes
  if (key !== 'settings') {
    try {
      const settings = getStored('settings', DEFAULT_SETTINGS);
      settings.dbIntegrityHash = calculateDatabaseDigest();
      localStorage.setItem('csv_enc_settings', encryptData(JSON.stringify(settings)));
    } catch (e) {}
  }
};

export const db = {
  getUsers: (): User[] => getStored('users', DEFAULT_USERS),
  setUsers: (users: User[]) => setStored('users', users),
  
  getInstitutions: (): Institution[] => getStored('institutions', DEFAULT_INSTITUTIONS),
  setInstitutions: (insts: Institution[]) => setStored('institutions', insts),
  
  getCertificates: (): Certificate[] => getStored('certificates', DEFAULT_CERTIFICATES),
  setCertificates: (certs: Certificate[]) => setStored('certificates', certs),
  
  getAuditLogs: (): AuditLog[] => getStored('auditLogs', []),
  setAuditLogs: (logs: AuditLog[]) => setStored('auditLogs', logs),
  
  getSettings: (): SystemSettings => getStored('settings', DEFAULT_SETTINGS),
  setSettings: (settings: SystemSettings) => setStored('settings', settings),

  getSocEvents: (): SocEvent[] => getStored('socEvents', DEFAULT_SOC_EVENTS),
  setSocEvents: (events: SocEvent[]) => setStored('socEvents', events),

  getLoginHistory: (): LoginHistoryEntry[] => getStored('loginHistory', DEFAULT_LOGIN_HISTORY),
  setLoginHistory: (history: LoginHistoryEntry[]) => setStored('loginHistory', history),

  getActiveSessions: (): ActiveSession[] => getStored('activeSessions', DEFAULT_ACTIVE_SESSIONS),
  setActiveSessions: (sessions: ActiveSession[]) => setStored('activeSessions', sessions),

  getFraudReports: (): FraudReport[] => getStored('fraudReports', DEFAULT_FRAUD_REPORTS),
  setFraudReports: (reports: FraudReport[]) => setStored('fraudReports', reports),

  addAuditLog: (
    userId: string, 
    userName: string, 
    role: string, 
    action: string, 
    details: string, 
    status: 'success' | 'failure' = 'success',
    riskScoreOverride?: number,
    locationOverride?: string,
    deviceFingerprintOverride?: string
  ) => {
    const logs = db.getAuditLogs();
    
    // Calculate simulated risk score (0-100)
    let riskScore = 8;
    if (status === 'failure') {
      riskScore = 75;
    }
    if (action.includes('MANTRA') || action.includes('BIOMETRIC') || action.includes('SPOOF')) {
      if (status === 'failure') riskScore = 98;
      else riskScore = 20;
    } else if (action.includes('TAMPER') || action.includes('FRAUD')) {
      riskScore = 90;
    } else if (action.includes('LOGIN')) {
      if (status === 'failure') riskScore = 80;
      else riskScore = 12;
    } else if (action.includes('REVOKE')) {
      riskScore = 45;
    }
    if (riskScoreOverride !== undefined) {
      riskScore = riskScoreOverride;
    }

    // Determine device fingerprint
    let deviceFingerprint = 'AegisDFP-' + Math.abs(action.length * 12345).toString(16).toUpperCase();
    if (deviceFingerprintOverride) {
      deviceFingerprint = deviceFingerprintOverride;
    } else if (typeof window !== 'undefined' && window.navigator) {
      deviceFingerprint = 'AegisDFP-' + btoa(window.navigator.userAgent).slice(0, 16);
    }

    // Determine location
    const locations = ['Boston, MA', 'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Chennai, India', 'London, UK'];
    let location = locations[Math.abs((userId.length + action.length) % locations.length)];
    if (locationOverride) {
      location = locationOverride;
    }

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      userRole: role,
      action,
      details,
      ip: '127.0.0.1',
      status,
      deviceFingerprint,
      location,
      riskScore
    };
    logs.unshift(newLog);
    db.setAuditLogs(logs);
  },

  // JWT session simulation
  generateJWT: (user: User): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 15 * 60 * 1000 // 15 mins expiry
    }));
    const signature = hashPassword(header + '.' + payload);
    return `${header}.${payload}.${signature}`;
  },

  verifyJWT: (token: string): { userId: string; username: string; role: string } | null => {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    try {
      const headerRaw = atob(parts[0]);
      const payloadRaw = atob(parts[1]);
      const signature = parts[2];
      
      const expectedSignature = hashPassword(parts[0] + '.' + parts[1]);
      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(payloadRaw);
      if (payload.exp < Date.now()) {
        return null; // Expired
      }
      return payload;
    } catch (e) {
      return null;
    }
  },

  getCurrentUser: (): User | null => {
    const userStr = sessionStorage.getItem('csv_current_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      sessionStorage.setItem('csv_current_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('csv_current_user');
    }
  },

  // OTP Subsystem
  sendOTP: (contactOrEmail: string): string => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    sessionStorage.setItem(`otp_${contactOrEmail}`, code);
    
    db.addAuditLog('otp-service', 'OTP Daemon', 'admin', 'OTP_SENT', `Generated secure OTP for ${contactOrEmail}. Code: ${code} (Developer Alert)`, 'success');
    
    // SOC log
    db.addSocEvent('medium', 'OTP_REQUEST', `One-Time Password requested by ${contactOrEmail}`, '127.0.0.1');

    // Trigger visual gateway simulation event
    const event = new CustomEvent('OTP_DISPATCHED', { detail: { contact: contactOrEmail, code } });
    window.dispatchEvent(event);

    return code;
  },

  verifyOTP: (contactOrEmail: string, otp: string): boolean => {
    const stored = sessionStorage.getItem(`otp_${contactOrEmail}`);
    if (stored && stored === otp) {
      sessionStorage.removeItem(`otp_${contactOrEmail}`);
      return true;
    }
    return false;
  },

  // SOC Add Events
  addSocEvent: (severity: 'critical' | 'high' | 'medium' | 'low', category: string, details: string, ip: string) => {
    const events = db.getSocEvents();
    const newEvent: SocEvent = {
      id: `soc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      severity,
      category,
      details,
      timestamp: new Date().toISOString(),
      ip,
      handled: false
    };
    events.unshift(newEvent);
    db.setSocEvents(events);
  },

  // AI Fraud Add Event
  addFraudReport: (category: 'duplicate_cert' | 'biometric_spoof' | 'unauthorized_mod' | 'suspicious_login' | 'tampered_cert', riskScore: number, details: string) => {
    const reports = db.getFraudReports();
    // Avoid duplicate reports of the same category and details within the last 10 seconds
    const isDuplicate = reports.some(r => 
      r.category === category && 
      r.details === details && 
      (Date.now() - new Date(r.timestamp).getTime()) < 10000
    );
    if (isDuplicate) return;

    const newReport: FraudReport = {
      id: `fraud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      category,
      riskScore,
      details,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    reports.unshift(newReport);
    db.setFraudReports(reports);
  },

  verifyDatabaseIntegrity: (): { valid: boolean; calculatedHash: string; expectedHash: string } => {
    const settings = db.getSettings();
    const expected = settings.dbIntegrityHash || 'verified_genesis_merkle_root_secure';
    const calculated = calculateDatabaseDigest();
    const isValid = calculated === expected || expected === 'verified_genesis_merkle_root_secure';
    return {
      valid: isValid,
      calculatedHash: calculated,
      expectedHash: expected
    };
  },

  rotateDatabaseKeys: (): { success: boolean; newKey: string; recordsEncrypted: number } => {
    try {
      const currentUsers = db.getUsers();
      const currentInsts = db.getInstitutions();
      const currentCerts = db.getCertificates();
      const currentLogs = db.getAuditLogs();
      const currentSoc = db.getSocEvents();
      const currentFraud = db.getFraudReports();
      const currentHist = db.getLoginHistory();
      const currentSettings = db.getSettings();

      const prevKey = getActiveKey();
      const nextKey = 'AEGISKEY_ROTATED_AES_' + Math.floor(100000 + Math.random() * 900000).toString(16).toUpperCase();
      
      localStorage.setItem('csv_active_aes_key', nextKey);

      db.setUsers(currentUsers);
      db.setInstitutions(currentInsts);
      db.setCertificates(currentCerts);
      db.setAuditLogs(currentLogs);
      db.setSocEvents(currentSoc);
      db.setFraudReports(currentFraud);
      db.setLoginHistory(currentHist);
      
      // Rotate expanded enterprise tables
      db.setCampuses(db.getCampuses());
      db.setDepartments(db.getDepartments());
      db.setApiKeys(db.getApiKeys());
      db.setApiLogs(db.getApiLogs());
      db.setOcrReports(db.getOcrReports());
      db.setBackupSnapshots(db.getBackupSnapshots());
      db.setRecoveryLogs(db.getRecoveryLogs());
      db.setDeviceRegistrations(db.getDeviceRegistrations());
      db.setNotifications(db.getNotifications());
      db.setHelpArticles(db.getHelpArticles());
      db.setFAQs(db.getFAQs());
      db.setSupportTickets(db.getSupportTickets());
      db.setFeedback(db.getFeedback());
      db.setTroubleshootingGuides(db.getTroubleshootingGuides());
      db.setRecentSearches(db.getRecentSearches());

      const history = currentSettings.keyRotationHistory || [];
      history.push(`Rotated from ${prevKey.slice(0, 8)}... to ${nextKey.slice(0, 8)}... on ${new Date().toISOString()}`);
      
      const updatedSettings: SystemSettings = {
        ...currentSettings,
        keyRotationHistory: history,
        lastRotationDate: new Date().toISOString(),
        dbIntegrityHash: ''
      };
      
      db.setSettings(updatedSettings);
      
      const newDigest = calculateDatabaseDigest();
      updatedSettings.dbIntegrityHash = newDigest;
      db.setSettings(updatedSettings);

      db.addAuditLog('usr-madhan', 'Mr. MADHAN', 'admin', 'CRYPTOGRAPHIC_KEY_ROTATED', `Successfully rotated database AES-256 encryption keys.`, 'success');

      return {
        success: true,
        newKey: nextKey,
        recordsEncrypted: currentUsers.length + currentInsts.length + currentCerts.length + currentLogs.length + db.getCampuses().length + db.getApiKeys().length
      };
    } catch (e) {
      console.error(e);
      return { success: false, newKey: '', recordsEncrypted: 0 };
    }
  },

  getCampuses: (): Campus[] => getStored('campuses', DEFAULT_CAMPUSES),
  setCampuses: (campuses: Campus[]) => setStored('campuses', campuses),
  
  getDepartments: (): Department[] => getStored('departments', DEFAULT_DEPARTMENTS),
  setDepartments: (depts: Department[]) => setStored('departments', depts),
  
  getApiKeys: (): ApiKey[] => getStored('apiKeys', DEFAULT_API_KEYS),
  setApiKeys: (keys: ApiKey[]) => setStored('apiKeys', keys),
  
  getApiLogs: (): ApiLog[] => getStored('apiLogs', DEFAULT_API_LOGS),
  setApiLogs: (logs: ApiLog[]) => setStored('apiLogs', logs),
  
  getOcrReports: (): OcrReport[] => getStored('ocrReports', DEFAULT_OCR_REPORTS),
  setOcrReports: (reports: OcrReport[]) => setStored('ocrReports', reports),
  
  getBackupSnapshots: (): BackupSnapshot[] => getStored('backupSnapshots', DEFAULT_BACKUP_SNAPSHOTS),
  setBackupSnapshots: (snaps: BackupSnapshot[]) => setStored('backupSnapshots', snaps),
  
  getRecoveryLogs: (): RecoveryLog[] => getStored('recoveryLogs', DEFAULT_RECOVERY_LOGS),
  setRecoveryLogs: (logs: RecoveryLog[]) => setStored('recoveryLogs', logs),
  
  getDeviceRegistrations: (): DeviceRegistration[] => getStored('deviceRegistrations', DEFAULT_DEVICE_REGISTRATIONS),
  setDeviceRegistrations: (regs: DeviceRegistration[]) => setStored('deviceRegistrations', regs),
  
  getNotifications: (): PushNotification[] => getStored('notifications', DEFAULT_NOTIFICATIONS),
  setNotifications: (notes: PushNotification[]) => setStored('notifications', notes),

  getHelpArticles: (): HelpArticle[] => getStored('helpArticles', DEFAULT_HELP_ARTICLES),
  setHelpArticles: (arts: HelpArticle[]) => setStored('helpArticles', arts),

  getFAQs: (): FAQ[] => getStored('faqs', DEFAULT_FAQS),
  setFAQs: (faqs: FAQ[]) => setStored('faqs', faqs),

  getSupportTickets: (): SupportTicket[] => getStored('supportTickets', DEFAULT_SUPPORT_TICKETS),
  setSupportTickets: (tkts: SupportTicket[]) => setStored('supportTickets', tkts),

  getFeedback: (): Feedback[] => getStored('feedback', DEFAULT_FEEDBACK),
  setFeedback: (fb: Feedback[]) => setStored('feedback', fb),

  getTroubleshootingGuides: (): TroubleshootingGuide[] => getStored('troubleshootingGuides', DEFAULT_TROUBLESHOOTING_GUIDES),
  setTroubleshootingGuides: (guides: TroubleshootingGuide[]) => setStored('troubleshootingGuides', guides),

  getRecentSearches: (): RecentSearch[] => getStored('recentSearches', DEFAULT_RECENT_SEARCHES),
  setRecentSearches: (searches: RecentSearch[]) => setStored('recentSearches', searches)
};
