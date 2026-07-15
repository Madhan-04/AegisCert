import crypto from 'crypto';
import { run, get } from '../db.js';

export async function generateOTP(userId, username) {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minute validation windows
  const id = crypto.randomUUID();

  // Revoke any previous pending OTPs
  await run(
    'UPDATE otp SET status = "expired", deletedAt = datetime("now") WHERE userId = ? AND status = "active"',
    [userId]
  );

  await run(
    'INSERT INTO otp (id, userId, code, expiresAt, status, createdBy) VALUES (?, ?, ?, ?, "active", ?)',
    [id, userId, code, expiresAt, username || 'system']
  );

  // Print OTP only to server console for security validation (never return to client response)
  console.log(`\n📟 [SECURE SMS GATEWAY SIMULATOR] AegisCert Verification Code: ${code} (User: ${username}, Expires in 5 minutes)\n`);
  
  return { success: true };
}

export async function verifyOTP(userId, code) {
  const record = await get(
    'SELECT * FROM otp WHERE userId = ? AND code = ? AND status = "active" AND verified = 0 AND deletedAt IS NULL',
    [userId, code]
  );

  if (!record) {
    return { success: false, message: 'Invalid OTP verification code.' };
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    return { success: false, message: 'OTP verification code has expired.' };
  }

  // Commit OTP use
  await run(
    'UPDATE otp SET verified = 1, status = "used", updatedAt = datetime("now") WHERE id = ?',
    [record.id]
  );

  return { success: true };
}
