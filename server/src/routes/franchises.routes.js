import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { franchiseApplySchema, statusUpdateSchema } from '../validators/schemas.js';
import * as franchisesController from '../controllers/franchises.controller.js';

const router = Router();

// Public — apply for franchise
router.post('/apply', validate(franchiseApplySchema), franchisesController.apply);

// Admin
router.get('/', authenticate, authorize('admin'), franchisesController.getAll);
router.patch('/:id/status', authenticate, authorize('admin'), validate(statusUpdateSchema), franchisesController.updateStatus);

// Franchise — get own franchise
router.get('/me', authenticate, authorize('franchise'), franchisesController.getMe);

// Admin & Franchise
router.get('/:id', authenticate, authorize('admin', 'franchise'), franchisesController.getById);
router.get('/:id/students', authenticate, authorize('admin', 'franchise'), franchisesController.getStudents);
router.get('/:id/courses', authenticate, authorize('admin', 'franchise'), franchisesController.getCourses);

export default router;
