import * as authService from '../services/authService.js';
import * as otpService from '../services/otpService.js';

export async function login(req, res, next) {
  try {
    const { username, password, role } = req.body;
    const result = await authService.login(username, password, role);
    if (result.success) {
      return res.sendSuccess({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
        mustResetPassword: result.mustResetPassword
      });
    } else {
      return res.status(401).json({
        success: false,
        message: result.message,
        error: 'UNAUTHORIZED'
      });
    }
  } catch (e) {
    next(e);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
        error: 'VALIDATION_ERROR'
      });
    }
    const result = await authService.refresh(refreshToken);
    if (result.success) {
      return res.sendSuccess({ accessToken: result.accessToken });
    } else {
      return res.status(401).json({
        success: false,
        message: result.message,
        error: 'UNAUTHORIZED'
      });
    }
  } catch (e) {
    next(e);
  }
}

export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    return res.sendSuccess({ message: 'Logged out successfully.' });
  } catch (e) {
    next(e);
  }
}

export async function setupMpin(req, res, next) {
  try {
    const { mpin } = req.body;
    if (!mpin || mpin.length !== 6 || !/^\d+$/.test(mpin)) {
      return res.status(400).json({
        success: false,
        message: 'MPIN must be exactly 6 numeric digits.',
        error: 'VALIDATION_ERROR'
      });
    }
    await authService.setupMpin(req.user.id, mpin);
    return res.sendSuccess({ message: 'MPIN configured successfully.' });
  } catch (e) {
    next(e);
  }
}

export async function verifyMpin(req, res, next) {
  try {
    const { mpin } = req.body;
    if (!mpin) {
      return res.status(400).json({
        success: false,
        message: 'MPIN is required.',
        error: 'VALIDATION_ERROR'
      });
    }
    const result = await authService.verifyMpin(req.user.id, mpin);
    if (result.success) {
      return res.sendSuccess({ message: 'MPIN verification successful.' });
    } else {
      return res.status(401).json({
        success: false,
        message: result.message || 'Incorrect MPIN.',
        error: 'UNAUTHORIZED'
      });
    }
  } catch (e) {
    next(e);
  }
}

export async function sendOtp(req, res, next) {
  try {
    const { userId, username } = req.body;
    const targetUserId = userId || req.user?.id || 'usr-student';
    const targetUsername = username || req.user?.username || 'student';
    await otpService.generateOTP(targetUserId, targetUsername);
    return res.sendSuccess({ message: 'OTP sent successfully.' });
  } catch (e) {
    next(e);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    const { userId, code } = req.body;
    const targetUserId = userId || req.user?.id || 'usr-student';
    const result = await otpService.verifyOTP(targetUserId, code);
    if (result.success) {
      return res.sendSuccess({ verified: true, message: 'OTP verified successfully.' });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || 'OTP verification failed.',
        error: 'INVALID_OTP'
      });
    }
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { username, role, newPassword } = req.body;
    const db = await getDbConnection();
    const user = await db.get(
      'SELECT * FROM users WHERE LOWER(username) = ? AND role = ? AND deletedAt IS NULL',
      [username.toLowerCase(), role]
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered user matches these credentials.',
        error: 'NOT_FOUND'
      });
    }
    const hashed = bcrypt.hashSync(newPassword, 12);
    await db.run(
      'UPDATE users SET password = ?, mustResetPassword = 0, failedLoginAttempts = 0, lockedUntil = NULL, updatedAt = datetime("now") WHERE id = ?',
      [hashed, user.id]
    );
    return res.sendSuccess({ message: 'Password updated successfully.' });
  } catch (e) {
    next(e);
  }
}
