import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

router.get('/', authenticate, auditController.getAll);
router.post('/', authenticate, auditController.write);

export default router;
