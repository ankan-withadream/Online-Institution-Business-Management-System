-- ============================================
-- Migration: Allow duplicate subject codes
-- ============================================
-- Removes the UNIQUE constraint on subjects.code so the same code can be
-- reused across different subjects/courses/semesters.

-- Drop old unique constraint if it exists (handles both constraint and index forms)
DO $$
BEGIN
  -- Try dropping as a named constraint
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subjects_code_key' AND conrelid = 'subjects'::regclass
  ) THEN
    ALTER TABLE subjects DROP CONSTRAINT subjects_code_key;
  END IF;

  -- Also drop any unique index that may exist separately
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'subjects' AND indexname = 'subjects_code_key'
  ) THEN
    DROP INDEX IF EXISTS subjects_code_key;
  END IF;
END $$;

-- Keep a plain (non-unique) index on code for fast lookups, e.g. verify/search
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_course ON subjects(course_id);
