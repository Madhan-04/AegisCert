import crypto from 'crypto';
import { getDbConnection } from '../config/database.js';
import * as blockchainService from './blockchainService.js';

export async function getAll(user) {
  const db = await getDbConnection();
  if (user.role === 'admin') {
    return db.all('SELECT * FROM certificates WHERE deletedAt IS NULL ORDER BY createdAt DESC');
  } else if (user.role === 'institution') {
    return db.all('SELECT * FROM certificates WHERE institutionId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [user.institutionId]);
  } else if (user.role === 'student') {
    const userProfile = await db.get('SELECT rollNo FROM users WHERE id = ?', [user.id]);
    const rollNo = userProfile ? userProfile.rollNo : '';
    return db.all('SELECT * FROM certificates WHERE rollNo = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [rollNo]);
  }
  return [];
}

export async function getById(id, user) {
  const db = await getDbConnection();
  const cert = await db.get('SELECT * FROM certificates WHERE id = ? AND deletedAt IS NULL', [id]);
  if (!cert) return null;

  if (user.role === 'institution' && cert.institutionId !== user.institutionId) {
    throw { status: 403, message: 'Forbidden: Tenant isolation mismatch.', error: 'FORBIDDEN' };
  }
  if (user.role === 'student') {
    const userProfile = await db.get('SELECT rollNo FROM users WHERE id = ?', [user.id]);
    if (!userProfile || cert.rollNo !== userProfile.rollNo) {
      throw { status: 403, message: 'Forbidden: Tenant isolation mismatch.', error: 'FORBIDDEN' };
    }
  }
  return cert;
}

export async function publicLookup(id) {
  const db = await getDbConnection();
  return db.get('SELECT id, studentName, rollNo, regNo, degree, department, cgpa, institutionName, issueDate, blockchainHash, signature, status, statusHistory, dob, yearOfPassout, pdfMarksheet FROM certificates WHERE id = ? AND deletedAt IS NULL', [id]);
}

export async function issueCertificate(certData, user) {
  const db = await getDbConnection();
  await db.exec('BEGIN TRANSACTION;');

  try {
    const certId = certData.id || `CERT-${new Date().getFullYear()}-${crypto.randomInt(1000, 9999)}`;
    const timestamp = new Date().toISOString();

    // 1. Mine the blockchain block transaction
    const mineResult = await blockchainService.mineTransaction({
      type: 'ISSUE',
      certId,
      certHash: certData.blockchainHash || '0x' + crypto.randomUUID().replace(/-/g, ''),
      studentName: certData.studentName,
      issuerAddress: '0x1D2a980f1a6B7E8D9c0A9b8C7e8F9a0b1C2d3E4f',
      issuerName: user.institutionName || 'AegisCert Partner Node'
    }, user.username);

    // 2. Insert the certificate
    await db.run(
      `INSERT INTO certificates (id, studentName, rollNo, regNo, degree, department, cgpa, institutionId, institutionName, issueDate, blockchainHash, signature, status, statusHistory, dob, yearOfPassout, pdfMarksheet, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        certId,
        certData.studentName,
        certData.rollNo,
        certData.regNo,
        certData.degree,
        certData.department,
        certData.cgpa,
        user.institutionId || '',
        user.institutionName || '',
        timestamp,
        mineResult.hash,
        mineResult.transaction.hash,
        'active',
        JSON.stringify([{ status: 'active', timestamp, updatedBy: user.name, reason: 'Initial degree certificate issue' }]),
        certData.dob || '',
        certData.yearOfPassout || '',
        certData.pdfMarksheet || '',
        user.username
      ]
    );

    // 3. Write an audit log entry
    const auditId = crypto.randomUUID();
    await db.run(
      `INSERT INTO audit_logs (id, userId, userName, userRole, action, details, riskScore, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        user.id,
        user.name,
        user.role,
        'CERTIFICATE_ISSUED',
        `Issued certificate ${certId} for student ${certData.studentName}`,
        5,
        user.username
      ]
    );

    await db.exec('COMMIT;');
    return await db.get('SELECT * FROM certificates WHERE id = ?', [certId]);
  } catch (err) {
    await db.exec('ROLLBACK;');
    throw err;
  }
}

export async function updateStatus(id, newStatus, reason, user) {
  const db = await getDbConnection();
  await db.exec('BEGIN TRANSACTION;');

  try {
    const cert = await db.get('SELECT * FROM certificates WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!cert) {
      throw { status: 404, message: 'Certificate not found.', error: 'NOT_FOUND' };
    }

    if (user.role === 'institution' && cert.institutionId !== user.institutionId) {
      throw { status: 403, message: 'Forbidden: Tenant isolation mismatch.', error: 'FORBIDDEN' };
    }

    const timestamp = new Date().toISOString();
    const currentHistory = cert.statusHistory ? JSON.parse(cert.statusHistory) : [];
    currentHistory.push({
      status: newStatus,
      timestamp,
      updatedBy: user.name,
      reason
    });

    // 1. Mine the status update transaction into blockchain
    const mineResult = await blockchainService.mineTransaction({
      type: newStatus === 'active' ? 'ACTIVATE' : newStatus === 'suspended' ? 'SUSPEND' : 'REVOKE',
      certId: id,
      certHash: cert.blockchainHash,
      studentName: cert.studentName,
      issuerAddress: '0x1D2a980f1a6B7E8D9c0A9b8C7e8F9a0b1C2d3E4f',
      issuerName: user.institutionName || 'AegisCert Partner Node'
    }, user.username);

    // 2. Update status and history
    await db.run(
      'UPDATE certificates SET status = ?, statusHistory = ?, signature = ?, updatedAt = datetime("now") WHERE id = ?',
      [newStatus, JSON.stringify(currentHistory), mineResult.transaction.hash, id]
    );

    // 3. Write Audit Log
    const auditId = crypto.randomUUID();
    await db.run(
      `INSERT INTO audit_logs (id, userId, userName, userRole, action, details, riskScore, createdBy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        user.id,
        user.name,
        user.role,
        `CERTIFICATE_${newStatus.toUpperCase()}`,
        `Updated certificate ${id} status to ${newStatus}. Reason: ${reason}`,
        15,
        user.username
      ]
    );

    await db.exec('COMMIT;');
    return await db.get('SELECT * FROM certificates WHERE id = ?', [id]);
  } catch (err) {
    await db.exec('ROLLBACK;');
    throw err;
  }
}
