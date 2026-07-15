import crypto from 'crypto';
import { run, get } from '../db.js';

export async function enrollFingerprint(userId, data, operator) {
  const printId = crypto.randomUUID().slice(0, 8);
  const printSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
  const templateName = `MANTRA_MFS100_V54_TEMP_${printSuffix}`;
  
  // SHA-256 template hashing simulation
  const templateHash = crypto.createHash('sha256').update(`MNT-${userId}-${printSuffix}`).digest('hex');

  const id = crypto.randomUUID();
  await run(
    'INSERT INTO fingerprint_templates (id, userId, enrollId, templateName, templateHash, deviceId, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, `MNT-${printId}`, templateName, templateHash, 'Mantra MFS100 V54 - SN 1920822', operator || 'system']
  );

  // Update user profile status
  await run(
    'UPDATE users SET fingerprintStatus = "enrolled", updatedAt = datetime("now") WHERE id = ?',
    [userId]
  );

  return {
    success: true,
    enrollId: `MNT-${printId}`,
    templateName,
    templateHash
  };
}

export async function verifyFingerprint(userId, templateHash) {
  const template = await get(
    'SELECT * FROM fingerprint_templates WHERE userId = ? AND templateHash = ? AND deletedAt IS NULL',
    [userId, templateHash]
  );
  
  return { success: !!template };
}
