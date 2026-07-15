import * as biometricService from '../services/biometricService.js';

export async function enroll(req, res, next) {
  try {
    const { userId, data } = req.body;
    const targetUserId = userId || req.user.id;
    const result = await biometricService.enrollFingerprint(targetUserId, data, req.user.username);
    return res.sendSuccess(result);
  } catch (e) {
    next(e);
  }
}

export async function verify(req, res, next) {
  try {
    const { userId, templateHash } = req.body;
    const targetUserId = userId || req.user.id;
    const result = await biometricService.verifyFingerprint(targetUserId, templateHash);
    if (result.success) {
      return res.sendSuccess({ verified: true, message: 'Biometric verification successful.' });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Biometric verification failed: minutiae mismatch.',
        error: 'BIOMETRIC_MISMATCH'
      });
    }
  } catch (e) {
    next(e);
  }
}
