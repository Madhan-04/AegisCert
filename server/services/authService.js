import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { get, run } from '../db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt.js';

export async function login(username, password, role) {
  const user = await get('SELECT * FROM users WHERE LOWER(username) = ? AND role = ? AND deletedAt IS NULL', [username.toLowerCase(), role]);
  
  if (!user) {
    return { success: false, message: 'Invalid username or password.' };
  }

  // Lockout verification
  if (user.lockedUntil) {
    const lockTime = new Date(user.lockedUntil).getTime();
    if (lockTime > Date.now()) {
      const minutesRemaining = Math.ceil((lockTime - Date.now()) / (60 * 1000));
      return { success: false, message: `Account locked due to 3 failed attempts. Try again in ${minutesRemaining} minutes.` };
    } else {
      // Lock expired, reset
      await run('UPDATE users SET failedLoginAttempts = 0, lockedUntil = NULL WHERE id = ?', [user.id]);
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }
  }

  // Validate Password
  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    const newFailures = (user.failedLoginAttempts || 0) + 1;
    if (newFailures >= 3) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await run('UPDATE users SET failedLoginAttempts = 0, lockedUntil = ? WHERE id = ?', [lockUntil, user.id]);
      return { success: false, message: 'Account locked out for 15 minutes due to 3 failed authorization attempts.' };
    } else {
      await run('UPDATE users SET failedLoginAttempts = ? WHERE id = ?', [newFailures, user.id]);
      return { success: false, message: `Invalid username or password for this security level. Attempt ${newFailures} of 3.` };
    }
  }

  // Reset login attempt counts on success
  await run('UPDATE users SET failedLoginAttempts = 0, lockedUntil = NULL WHERE id = ?', [user.id]);

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    institutionId: user.institutionId,
    institutionName: user.institutionName
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user.id });

  // Save session info
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await run(
    'INSERT INTO sessions (id, userId, refreshToken, expiresAt, createdBy) VALUES (?, ?, ?, ?, ?)',
    [sessionId, user.id, refreshToken, expiresAt, user.username]
  );

  return {
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      institutionId: user.institutionId,
      institutionName: user.institutionName,
      fingerprintStatus: user.fingerprintStatus,
      mpin: user.mpin ? 'enrolled' : null,
      faceEnrollId: user.faceEnrollId
    },
    mustResetPassword: user.mustResetPassword === 1
  };
}

export async function refresh(token) {
  const decoded = verifyRefreshToken(token);
  if (!decoded) {
    return { success: false, message: 'Invalid or expired session refresh token.' };
  }

  // Confirm token exists in database session index
  const session = await get('SELECT * FROM sessions WHERE refreshToken = ? AND deletedAt IS NULL', [token]);
  if (!session) {
    return { success: false, message: 'Session revoked or invalidated.' };
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return { success: false, message: 'Refresh token expired.' };
  }

  const user = await get('SELECT * FROM users WHERE id = ? AND deletedAt IS NULL', [decoded.id]);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    email: user.email,
    institutionId: user.institutionId,
    institutionName: user.institutionName
  };

  const accessToken = signAccessToken(payload);
  return { success: true, accessToken };
}

export async function logout(token) {
  await run('UPDATE sessions SET deletedAt = datetime("now") WHERE refreshToken = ?', [token]);
  return { success: true };
}

export async function setupMpin(userId, mpin) {
  const hashed = bcrypt.hashSync(mpin, 12);
  await run('UPDATE users SET mpin = ?, updatedAt = datetime("now") WHERE id = ?', [hashed, userId]);
  return { success: true };
}

export async function verifyMpin(userId, mpin) {
  const user = await get('SELECT mpin FROM users WHERE id = ? AND deletedAt IS NULL', [userId]);
  if (!user || !user.mpin) {
    return { success: false, message: 'MPIN not configured for this user.' };
  }
  const match = bcrypt.compareSync(mpin, user.mpin);
  return { success: match };
}
