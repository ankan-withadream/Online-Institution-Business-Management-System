import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { examSchema } from '../validators/schemas.js';
import * as examsController from '../controllers/exams.controller.js';

const router = Router();

router.post('/', authenticate, authorize('admin'), validate(examSchema), examsController.create);
router.get('/', authenticate, authorize('admin', 'student'), examsController.getAll);
router.get('/:id', authenticate, authorize('admin', 'student'), examsController.getById);
router.put('/:id', authenticate, authorize('admin'), validate(examSchema), examsController.update);
router.delete('/:id', authenticate, authorize('admin'), examsController.remove);

export default router;
