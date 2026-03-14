import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { generalLimiter } from './middleware/rateLimiter.js';
import env from './config/env.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import courseRoutes from './routes/courses.routes.js';
import admissionRoutes from './routes/admissions.routes.js';
import studentRoutes from './routes/students.routes.js';
import examRoutes from './routes/exams.routes.js';
import resultRoutes from './routes/results.routes.js';
import noticeRoutes from './routes/notices.routes.js';
import certificateRoutes from './routes/certificates.routes.js';
import franchiseRoutes from './routes/franchises.routes.js';
import adminRoutes from './routes/admin.routes.js';
import documentRoutes from './routes/documents.routes.js';

const app = express();

// ─── Global Middleware ──────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/franchises', franchiseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);

// ─── 404 Handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

export default app;
