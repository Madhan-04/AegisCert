import { Router } from 'express';
import * as institutionController from '../controllers/institutionController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize, requireOwnInstitution } from '../middleware/authorize.js';

const router = Router();

// Public routes
router.get('/', institutionController.getAll);
router.get('/:id', institutionController.getById);

// Protected routes (Super Admin only)
router.post('/', authenticate, authorize(['admin']), institutionController.create);
router.patch('/:id', authenticate, authorize(['admin']), institutionController.update);
router.delete('/:id', authenticate, authorize(['admin']), institutionController.remove);

export default router;
