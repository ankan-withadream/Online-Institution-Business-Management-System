import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as feesController from '../controllers/fees.controller.js';

const router = Router();

// Create individual fee payment
router.post('/', authenticate, authorize('franchise', 'admin'), feesController.create);

// Create bulk fee payments
router.post('/bulk', authenticate, authorize('franchise', 'admin'), feesController.bulkCreate);

// Get fee payments by franchise
router.get('/franchise/:franchiseId', authenticate, authorize('franchise', 'admin'), feesController.getByFranchise);

// Get fee payment history by student
router.get('/student/:studentId', authenticate, authorize('franchise', 'admin'), feesController.getByStudent);

export default router;
