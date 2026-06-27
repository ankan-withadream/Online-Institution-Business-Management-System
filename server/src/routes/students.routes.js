import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as studentsController from '../controllers/students.controller.js';

const router = Router();

// Public — verify student by ID number
router.get('/verify/:studentIdNumber', studentsController.verify);

// Student sees own profile
router.get('/me', authenticate, authorize('student'), studentsController.getMe);

// Admin
router.get('/', authenticate, authorize('admin'), studentsController.getAll);
router.get('/:id', authenticate, authorize('admin', 'student'), studentsController.getById);
router.get('/:id/photo', authenticate, authorize('admin', 'franchise', 'student'), studentsController.getPhoto);
router.put('/:id', authenticate, authorize('admin', 'franchise'), studentsController.update);

export default router;
