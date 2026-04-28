import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['student', 'franchise']).optional().default('student'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const admissionSchema = z.object({
  courseId: z.string().uuid(),
  franchiseId: z.string().uuid().optional(),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6).max(6),
});

export const courseSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  durationMonths: z.number().int().positive(),
  fee: z.number().positive(),
  isActive: z.boolean().optional().default(true),
  subjects: z.array(z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    description: z.string().optional(),
    maxMarks: z.number().int().positive().optional().default(100),
    semester: z.number().int().positive().optional().default(1),
  })).optional(),
});

export const examSchema = z.object({
  name: z.string().min(2),
  courseId: z.string().uuid(),
  subjectId: z.string().uuid(),
  examDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalMarks: z.number().int().positive(),
  passingMarks: z.number().int().positive(),
});

export const resultSchema = z.object({
  studentId: z.string().uuid(),
  examId: z.string().uuid(),
  subjectId: z.string().uuid(),
  marksObtained: z.number().min(0),
  grade: z.string().optional(),
  isPass: z.boolean(),
  published: z.boolean().optional().default(false),
});

export const bulkResultSchema = z.object({
  results: z.array(resultSchema).min(1),
});

export const noticeSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  category: z.enum(['general', 'exam', 'admission', 'result']).default('general'),
  isPublished: z.boolean().optional().default(false),
  publishDate: z.string().optional(),
  targetAudience: z.enum(['all', 'students', 'franchises']).default('all'),
  courseId: z.string().uuid().optional(),
});

export const franchiseApplySchema = z.object({
  organizationName: z.string().min(2),
  contactPerson: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6).max(6),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  adminRemarks: z.string().optional(),
});

export const subjectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  courseId: z.string().uuid().optional(),
  maxMarks: z.number().int().positive(),
  semester: z.number().int().positive(),
});
