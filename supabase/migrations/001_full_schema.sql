-- ============================================
-- EduCare — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. ROLES ───────────────────────────────
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO roles (name) VALUES ('admin'), ('student'), ('franchise');

-- ─── 2. USERS ───────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. COURSES ─────────────────────────────
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  duration_months INTEGER,
  fee NUMERIC(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. FRANCHISES ──────────────────────────
CREATE TABLE franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  organization_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  region TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  admin_remarks TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. STUDENTS ────────────────────────────
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id_number TEXT UNIQUE NOT NULL,
  course_id UUID REFERENCES courses(id),
  franchise_id UUID REFERENCES franchises(id),
  date_of_birth DATE,
  gender TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  enrollment_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'suspended')),
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. ADMISSIONS ──────────────────────────
CREATE TABLE admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  franchise_id UUID REFERENCES franchises(id),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  initial_password TEXT,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_remarks TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. EXAMS ───────────────────────────────
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  course_id UUID REFERENCES courses(id),
  exam_date DATE,
  start_time TIME,
  end_time TIME,
  total_marks INTEGER,
  passing_marks INTEGER,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 8. SUBJECTS ────────────────────────────
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  course_id UUID REFERENCES courses(id),
  max_marks INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 9. RESULTS ─────────────────────────────
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id),
  subject_id UUID REFERENCES subjects(id),
  marks_obtained NUMERIC(5, 2),
  grade TEXT,
  is_pass BOOLEAN,
  published BOOLEAN DEFAULT false,
  verification_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 10. NOTICES ────────────────────────────
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'exam', 'admission', 'result')),
  is_published BOOLEAN DEFAULT false,
  publish_date TIMESTAMPTZ,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'franchises')),
  course_id UUID REFERENCES courses(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 11. CERTIFICATES ──────────────────────
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  certificate_number TEXT UNIQUE NOT NULL,
  issue_date DATE,
  file_url TEXT,
  verification_code TEXT UNIQUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 12. DOCUMENTS ──────────────────────────
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'admission', 'franchise')),
  entity_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  original_name TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ═════════════════════════════════════════════
-- INDEXES
-- ═════════════════════════════════════════════

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_students_user ON students(user_id);
CREATE INDEX idx_students_course ON students(course_id);
CREATE INDEX idx_students_franchise ON students(franchise_id);
CREATE INDEX idx_students_id_number ON students(student_id_number);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_course ON admissions(course_id);
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_exams_date ON exams(exam_date);
CREATE INDEX idx_results_student ON results(student_id);
CREATE INDEX idx_results_exam ON results(exam_id);
CREATE INDEX idx_results_verification ON results(verification_code);
CREATE INDEX idx_notices_published ON notices(is_published, publish_date);
CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_verification ON certificates(verification_code);
CREATE INDEX idx_franchises_status ON franchises(status);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);


-- ═════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═════════════════════════════════════════════

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- ── USERS ──
CREATE POLICY "Users can read own row" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (is_admin());
CREATE POLICY "Users can update own row" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Service can insert users" ON users FOR INSERT WITH CHECK (true);

-- ── COURSES (public read) ──
CREATE POLICY "Anyone can read active courses" ON courses FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage courses" ON courses FOR ALL USING (is_admin());

-- ── STUDENTS ──
CREATE POLICY "Students read own profile" ON students FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage students" ON students FOR ALL USING (is_admin());

-- ── ADMISSIONS ──
CREATE POLICY "Public can insert admissions" ON admissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage admissions" ON admissions FOR ALL USING (is_admin());

-- ── EXAMS ──
CREATE POLICY "Authenticated can read exams" ON exams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage exams" ON exams FOR ALL USING (is_admin());

-- ── RESULTS ──
CREATE POLICY "Published results are public" ON results FOR SELECT USING (published = true);
CREATE POLICY "Students read own results" ON results FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage results" ON results FOR ALL USING (is_admin());

-- ── NOTICES ──
CREATE POLICY "Published notices are public" ON notices FOR SELECT USING (is_published = true AND publish_date <= now());
CREATE POLICY "Admins manage notices" ON notices FOR ALL USING (is_admin());

-- ── CERTIFICATES ──
CREATE POLICY "Students read own certificates" ON certificates FOR SELECT USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);
CREATE POLICY "Admins manage certificates" ON certificates FOR ALL USING (is_admin());

-- ── FRANCHISES ──
CREATE POLICY "Franchise reads own record" ON franchises FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Public can apply for franchise" ON franchises FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage franchises" ON franchises FOR ALL USING (is_admin());

-- ── DOCUMENTS ──
CREATE POLICY "Users read own documents" ON documents FOR SELECT USING (uploaded_by = auth.uid());
CREATE POLICY "Admins manage documents" ON documents FOR ALL USING (is_admin());
CREATE POLICY "Authenticated can upload documents" ON documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
