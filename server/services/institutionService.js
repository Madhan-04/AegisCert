import crypto from 'crypto';
import { getDbConnection } from '../config/database.js';

export async function getAll() {
  const db = await getDbConnection();
  return db.all('SELECT * FROM institutions WHERE deletedAt IS NULL ORDER BY createdAt DESC');
}

export async function getById(id) {
  const db = await getDbConnection();
  return db.get('SELECT * FROM institutions WHERE id = ? AND deletedAt IS NULL', [id]);
}

export async function create(data, operator) {
  const db = await getDbConnection();
  const id = data.id || `inst-${crypto.randomUUID().slice(0, 8)}`;
  
  await db.run(
    `INSERT INTO institutions (id, name, regNo, email, status, logoUrl, primaryColor, secondaryColor, campusCount, departmentCount, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.name,
      data.regNo,
      data.email,
      data.status || 'pending',
      data.logoUrl || '/logo.jpg',
      data.primaryColor || '#4F46E5',
      data.secondaryColor || '#6C63FF',
      data.campusCount || 0,
      data.departmentCount || 0,
      operator
    ]
  );

  return await db.get('SELECT * FROM institutions WHERE id = ?', [id]);
}

export async function update(id, data, operator) {
  const db = await getDbConnection();
  const existing = await db.get('SELECT * FROM institutions WHERE id = ? AND deletedAt IS NULL', [id]);
  
  if (!existing) {
    throw { status: 404, message: 'Institution record not found.', error: 'NOT_FOUND' };
  }

  const fields = [];
  const params = [];
  const updateable = [
    'name', 'regNo', 'email', 'status', 'logoUrl', 
    'primaryColor', 'secondaryColor', 'campusCount', 'departmentCount'
  ];

  for (const field of updateable) {
    if (data[field] !== undefined) {
      fields.push(`${field} = ?`);
      params.push(data[field]);
    }
  }

  if (fields.length === 0) return existing;

  fields.push('updatedAt = datetime("now")');
  params.push(id);

  await db.run(`UPDATE institutions SET ${fields.join(', ')} WHERE id = ?`, params);
  return await db.get('SELECT * FROM institutions WHERE id = ?', [id]);
}

export async function remove(id) {
  const db = await getDbConnection();
  const existing = await db.get('SELECT * FROM institutions WHERE id = ? AND deletedAt IS NULL', [id]);
  if (!existing) {
    throw { status: 404, message: 'Institution record not found.', error: 'NOT_FOUND' };
  }

  await db.run('UPDATE institutions SET deletedAt = datetime("now"), status = "deleted" WHERE id = ?', [id]);
  return { success: true };
}
