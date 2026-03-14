import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { noticeSchema } from '../validators/schemas.js';
import * as noticesController from '../controllers/notices.controller.js';

const router = Router();

// Public — published notices
router.get('/', noticesController.getAll);
router.get('/:id', noticesController.getById);

// Admin
router.post('/', authenticate, authorize('admin'), validate(noticeSchema), noticesController.create);
router.put('/:id', authenticate, authorize('admin'), validate(noticeSchema), noticesController.update);
router.delete('/:id', authenticate, authorize('admin'), noticesController.remove);

export default router;
