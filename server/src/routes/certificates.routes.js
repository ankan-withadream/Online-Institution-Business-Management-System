import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as certificatesController from '../controllers/certificates.controller.js';

const router = Router();

// Public — verify certificate
router.get('/verify/:code', certificatesController.verify);

// Admin
router.post('/', authenticate, authorize('admin'), certificatesController.create);

// Student / Admin
router.get('/student/:studentId', authenticate, authorize('admin', 'student'), certificatesController.getByStudent);
router.get('/:id/download', authenticate, authorize('admin', 'student'), certificatesController.download);

export default router;
