import { supabaseAdmin } from '../config/supabase.js';

// Helper: fetch the last (largest) value for a given column in the
// students table and increment by 1. Falls back to a seed value if
// the table is empty or the column has no numeric data.
const generateNextNumeric = async (column) => {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select(column)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!error && data && data.length > 0 && data[0][column] != null) {
    const last = parseInt(data[0][column], 10);
    if (!Number.isNaN(last)) {
      return last + 1;
    }
  }

  // Fallback: seed from a timestamp-based value
  return parseInt(String(Date.now()).slice(-10), 10);
};

// Generates a sequential student ID (roll number) by finding the
// last student_id_number and incrementing by 1.
export const generateStudentId = async () => {
  const next = await generateNextNumeric('student_id_number');
  return String(next);
};

// Serial number — independent auto-increment, separate from
// registration_number and student_id_number.
export const generateSerialNumber = async () => {
  return generateNextNumeric('serial_number');
};

// Registration number — independent auto-increment.
export const generateRegistrationNumber = async () => {
  return generateNextNumeric('registration_number');
};
