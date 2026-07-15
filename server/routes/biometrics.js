import { Router } from 'express';
import * as biometricController from '../controllers/biometricController.js';
import { authenticate } from '../middleware/authenticate.js';

const router = Router();

router.post('/enroll', authenticate, biometricController.enroll);
router.post('/verify', authenticate, biometricController.verify);

export default router;
