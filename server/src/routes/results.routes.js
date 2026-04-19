import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { resultSchema, bulkResultSchema } from '../validators/schemas.js';
import * as resultsController from '../controllers/results.controller.js';

const router = Router();

// Public — verify result by code
router.get('/verify/:code', resultsController.verify);

// Admin
router.get('/', authenticate, authorize('admin'), resultsController.getAll);
router.post('/', authenticate, authorize('admin'), validate(resultSchema), resultsController.create);
router.post('/bulk', authenticate, authorize('admin'), validate(bulkResultSchema), resultsController.bulkCreate);
router.put('/:id', authenticate, authorize('admin'), validate(resultSchema), resultsController.update);
router.delete('/:id', authenticate, authorize('admin'), resultsController.remove);
router.patch('/:id/publish', authenticate, authorize('admin'), resultsController.publish);

// Student / Admin
router.get('/student/:studentId', authenticate, authorize('admin', 'student'), resultsController.getByStudent);

export default router;
