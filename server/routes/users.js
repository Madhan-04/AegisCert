import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize, requireOwnInstitution } from '../middleware/authorize.js';

const router = Router();

router.get('/', authenticate, authorize(['institution', 'admin']), userController.getAll);
router.get('/:id', authenticate, authorize(['institution', 'admin']), requireOwnInstitution, userController.getById);
router.post('/', authenticate, authorize(['institution', 'admin']), requireOwnInstitution, userController.create);
router.patch('/:id', authenticate, requireOwnInstitution, userController.update);
router.delete('/:id', authenticate, authorize(['institution', 'admin']), requireOwnInstitution, userController.remove);

export default router;
