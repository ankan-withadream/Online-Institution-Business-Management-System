import { supabaseAdmin } from '../config/supabase.js';

export const getStats = async (_req, res) => {
  try {
    const [students, pendingAdmissions, franchises, exams, notices] = await Promise.all([
      supabaseAdmin.from('students').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('admissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('franchises').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabaseAdmin.from('notices').select('*', { count: 'exact', head: true }).eq('is_published', true),
    ]);

    // Recent admissions
    const { data: recentAdmissions } = await supabaseAdmin
      .from('admissions')
      .select('id, full_name, email, status, created_at, courses(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    // Recent notices
    const { data: recentNotices } = await supabaseAdmin
      .from('notices')
      .select('id, title, category, is_published, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      totalStudents: students.count || 0,
      pendingAdmissions: pendingAdmissions.count || 0,
      pendingFranchises: franchises.count || 0,
      scheduledExams: exams.count || 0,
      publishedNotices: notices.count || 0,
      recentAdmissions: recentAdmissions || [],
      recentNotices: recentNotices || [],
    });
  } catch (err) {
    console.error('Get admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
