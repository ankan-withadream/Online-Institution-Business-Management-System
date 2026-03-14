import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { admissionSchema, statusUpdateSchema } from '../validators/schemas.js';
import * as admissionsController from '../controllers/admissions.controller.js';

const router = Router();

// Public — submit admission application
router.post('/', validate(admissionSchema), admissionsController.create);

// Admin
router.get('/', authenticate, authorize('admin'), admissionsController.getAll);
router.get('/:id', authenticate, authorize('admin'), admissionsController.getById);
router.patch('/:id/status', authenticate, authorize('admin'), validate(statusUpdateSchema), admissionsController.updateStatus);

export default router;
