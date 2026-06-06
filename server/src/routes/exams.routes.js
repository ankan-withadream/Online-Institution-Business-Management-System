import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { examSchema } from '../validators/schemas.js';
import * as examsController from '../controllers/exams.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

const router = Router();

router.post('/', authenticate, authorize('admin'), validate(examSchema), examsController.create);
router.get('/', authenticate, authorize('admin', 'student'), examsController.getAll);
router.get('/:id', authenticate, authorize('admin', 'student'), examsController.getById);
router.get('/:id/question-paper', authenticate, authorize('admin', 'student'), examsController.getQuestionPaper);
router.get('/:id/answers', authenticate, authorize('admin'), examsController.getAnswers);
router.get('/:id/answers/download-all', authenticate, authorize('admin'), examsController.downloadAllAnswers);
router.post('/:id/submit-answer', authenticate, authorize('student'), upload.single('file'), examsController.submitAnswer);
router.put('/:id', authenticate, authorize('admin'), validate(examSchema), examsController.update);
router.delete('/:id', authenticate, authorize('admin'), examsController.remove);

export default router;
