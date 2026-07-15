import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate, loginSchema, mpinSchema } from '../middleware/validate.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// Authenticated MPIN actions gated by validation schemas
router.post('/setup-mpin', authenticate, validate(mpinSchema), authController.setupMpin);
router.post('/verify-mpin', authenticate, validate(mpinSchema), authController.verifyMpin);

// OTP routes
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// Password recovery
router.post('/reset-password', authController.resetPassword);

export default router;
