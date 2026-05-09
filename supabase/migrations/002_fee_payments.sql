-- ============================================
-- Migration: Create fee_payments table & update documents constraint
-- ============================================

-- Fee Payments table for tracking partial/full fee payments
CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id),
  franchise_id UUID REFERENCES franchises(id),
  to_be_paid_amount NUMERIC(10, 2) NOT NULL,
  paid_amount NUMERIC(10, 2) NOT NULL,
  due_amount NUMERIC(10, 2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'upi',
  transaction_id TEXT,
  payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'half', 'quarter', 'custom')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  remarks TEXT,
  paid_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_franchise ON fee_payments(franchise_id);
CREATE INDEX idx_fee_payments_course ON fee_payments(course_id);

ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchise reads own fee payments" ON fee_payments FOR SELECT
  USING (paid_by = auth.uid());
CREATE POLICY "Admins manage fee payments" ON fee_payments FOR ALL
  USING (is_admin());
CREATE POLICY "Authenticated can insert fee payments" ON fee_payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update documents entity_type constraint to allow 'system' type (for payment QR code)
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_entity_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_entity_type_check
  CHECK (entity_type IN ('student', 'admission', 'franchise', 'system'));
