import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.get('/stats', authenticate, authorize('admin'), adminController.getStats);

export default router;
