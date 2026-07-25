import { supabaseAdmin } from '../config/supabase.js';

// Fetches the most recently created student's student_id_number,
// parses it to integer and increments by 1. Returns a plain numeric
// string (e.g. "2216162331"). Falls back to a year-prefixed date
// derivative if no students exist yet.
export const generateStudentId = async () => {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('student_id_number')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!error && data && data.length > 0 && data[0].student_id_number) {
    const lastId = parseInt(data[0].student_id_number, 10);
    if (!Number.isNaN(lastId)) {
      return String(lastId + 1);
    }
  }

  // Fallback for empty table: use a timestamp-based numeric ID
  const now = Date.now();
  return String(now);
};
