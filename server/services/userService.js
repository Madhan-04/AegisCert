import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDbConnection } from '../config/database.js';

export async function getAll(user) {
  const db = await getDbConnection();
  if (user.role === 'admin') {
    return db.all('SELECT id, username, role, name, email, contact, fingerprintStatus, faceEnrollId, institutionId, institutionName, rollNo, regNo, department, batch, enrolledAt, mustResetPassword, createdAt FROM users WHERE deletedAt IS NULL ORDER BY createdAt DESC');
  } else if (user.role === 'institution') {
    return db.all('SELECT id, username, role, name, email, contact, fingerprintStatus, faceEnrollId, institutionId, institutionName, rollNo, regNo, department, batch, enrolledAt, mustResetPassword, createdAt FROM users WHERE institutionId = ? AND deletedAt IS NULL ORDER BY createdAt DESC', [user.institutionId]);
  }
  return [];
}

export async function getById(id, user) {
  const db = await getDbConnection();
  const targetUser = await db.get('SELECT id, username, role, name, email, contact, fingerprintStatus, faceEnrollId, institutionId, institutionName, rollNo, regNo, department, batch, enrolledAt, mustResetPassword, createdAt FROM users WHERE id = ? AND deletedAt IS NULL', [id]);
  
  if (!targetUser) return null;

  if (user.role === 'institution' && targetUser.institutionId !== user.institutionId) {
    throw { status: 403, message: 'Forbidden: Tenant isolation mismatch.', error: 'FORBIDDEN' };
  }

  return targetUser;
}

export async function create(userData, user) {
  const db = await getDbConnection();
  
  const id = userData.id || `usr-${crypto.randomUUID().slice(0, 8)}`;
  const tempPass = crypto.randomUUID().slice(0, 10);
  const hashedPassword = bcrypt.hashSync(tempPass, 12);
  const timestamp = new Date().toISOString();

  const instId = user.role === 'admin' ? userData.institutionId : user.institutionId;
  const instName = user.role === 'admin' ? userData.institutionName : user.institutionName;

  await db.run(
    `INSERT INTO users (id, username, password, role, name, email, contact, faceEnrollId, fingerprintStatus, institutionId, institutionName, rollNo, regNo, department, batch, enrolledAt, mustResetPassword, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    [
      id,
      userData.username,
      hashedPassword,
      userData.role,
      userData.name,
      userData.email,
      userData.contact || '',
      userData.faceEnrollId || '',
      userData.fingerprintStatus || 'pending',
      instId || null,
      instName || null,
      userData.rollNo || '',
      userData.regNo || '',
      userData.department || '',
      userData.batch || '',
      timestamp,
      user.username,
      timestamp,
      timestamp
    ]
  );

  console.log(`[USER REGISTERED] Username: "${userData.username}" | Auto-generated Password: "${tempPass}"`);
  
  return await db.get('SELECT id, username, role, name, email, contact, fingerprintStatus, institutionId, institutionName, rollNo, regNo, department, batch FROM users WHERE id = ?', [id]);
}

export async function update(id, userData, user) {
  const db = await getDbConnection();
  const existing = await db.get('SELECT * FROM users WHERE id = ? AND deletedAt IS NULL', [id]);
  
  if (!existing) {
    throw { status: 404, message: 'User profile not found.', error: 'NOT_FOUND' };
  }

  if (user.role === 'institution' && existing.institutionId !== user.institutionId) {
    throw { status: 403, message: 'Forbidden: Tenant isolation mismatch.', error: 'FORBIDDEN' };
  }

  const queryFields = [];
  const queryParams = [];

  const updateable = [
    'name', 'email', 'contact', 'fingerprintStatus', 
    'faceEnrollId', 'rollNo', 'regNo', 'department', 'batch'
  ];

  for (const field of updateable) {
    if (userData[field] !== undefined) {
      queryFields.push(`${field} = ?`);
      queryParams.push(userData[field]);
    }
  }

  if (userData.password) {
    queryFields.push('password = ?');
    queryParams.push(bcrypt.hashSync(userData.password, 12));
    queryFields.push('mustResetPassword = 0');
  }

  if (queryFields.length === 0) {
    return existing;
  }

  queryFields.push('updatedAt = datetime("now")');
  queryParams.push(id);

  await db.run(
    `UPDATE users SET ${queryFields.join(', ')} WHERE id = ?`,
    queryParams
  );

  return await db.get('SELECT id, username, role, name, email, contact, fingerprintStatus, institutionId, institutionName, rollNo, regNo, department, batch FROM users WHERE id = ?', [id]);
}

export async function remove(id, user) {
  const db = await getDbConnection();
  const existing = await db.get('SELECT * FROM users WHERE id = ? AND deletedAt IS NULL', [id]);
  
  if (!existing) {
    throw { status: 404, message: 'User not found.', error: 'NOT_FOUND' };
  }

  if (user.role === 'institution' && existing.institutionId !== user.institutionId) {
    throw { status: 403, message: 'Forbidden: Tenant isolation mismatch.', error: 'FORBIDDEN' };
  }

  await db.run('UPDATE users SET deletedAt = datetime("now"), status = "deleted" WHERE id = ?', [id]);
  return { success: true };
}
