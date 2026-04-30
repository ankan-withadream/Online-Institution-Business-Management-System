import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import * as documentsController from '../controllers/documents.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and PDF files are allowed'));
    }
  },
});

const router = Router();

router.post('/public-upload', upload.single('file'), documentsController.uploadPublic);
router.post('/upload', authenticate, upload.single('file'), documentsController.upload);
router.get('/:id', authenticate, documentsController.getById);
router.delete('/:id', authenticate, authorize('admin'), documentsController.remove);

export default router;
