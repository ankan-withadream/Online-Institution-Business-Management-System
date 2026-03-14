import { supabaseAdmin } from '../config/supabase.js';

/**
 * Generates a unique student ID like STU-2026-0001
 */
export const generateStudentId = async () => {
  const year = new Date().getFullYear();

  const { count } = await supabaseAdmin
    .from('students')
    .select('*', { count: 'exact', head: true });

  const seq = String((count || 0) + 1).padStart(4, '0');
  return `STU-${year}-${seq}`;
};
