import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { courseSchema } from '../validators/schemas.js';
import * as coursesController from '../controllers/courses.controller.js';

const router = Router();

// Public
router.get('/', coursesController.getAll);
router.get('/:id', coursesController.getById);

// Admin only
router.post('/', authenticate, authorize('admin'), validate(courseSchema), coursesController.create);
router.put('/:id', authenticate, authorize('admin'), validate(courseSchema), coursesController.update);
router.delete('/:id', authenticate, authorize('admin'), coursesController.remove);

export default router;
