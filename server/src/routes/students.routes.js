import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as studentsController from '../controllers/students.controller.js';

const router = Router();

// Student sees own profile
router.get('/me', authenticate, authorize('student'), studentsController.getMe);

// Admin
router.get('/', authenticate, authorize('admin'), studentsController.getAll);
router.get('/:id', authenticate, authorize('admin', 'student'), studentsController.getById);
router.put('/:id', authenticate, authorize('admin'), studentsController.update);

export default router;
