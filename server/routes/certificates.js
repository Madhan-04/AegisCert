import { Router } from 'express';
import * as certificateController from '../controllers/certificateController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize, requireOwnInstitution } from '../middleware/authorize.js';
import { validate, issueCertificateSchema, updateCertificateStatusSchema } from '../middleware/validate.js';

const router = Router();

// Public lookups - no auth needed
router.get('/public/:id', certificateController.publicLookup);

// Authenticated queries
router.get('/', authenticate, certificateController.getAll);
router.get('/:id', authenticate, certificateController.getById);

// Institution actions - gated by validation + roles + tenant matching
router.post('/', 
  authenticate, 
  authorize(['institution', 'admin']), 
  requireOwnInstitution, 
  validate(issueCertificateSchema),
  certificateController.issue
);

router.patch('/:id/status', 
  authenticate, 
  authorize(['institution', 'admin']), 
  requireOwnInstitution, 
  validate(updateCertificateStatusSchema),
  certificateController.updateStatus
);

export default router;
