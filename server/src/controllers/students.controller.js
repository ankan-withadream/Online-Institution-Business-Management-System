import { supabaseAdmin } from '../config/supabase.js';

export const getMe = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*, courses(name, description, duration_months)')
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Student profile not found' });
    res.json(data);
  } catch (err) {
    console.error('Get student profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getAll = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('students')
      .select('*, users(email, full_name), courses(name)')
      .order('created_at', { ascending: false });

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.courseId) query = query.eq('course_id', req.query.courseId);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*, users(email, full_name), courses(name, description)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Student not found' });

    // Students can only view their own profile
    if (req.user.role === 'student' && data.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const verify = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('student_id_number, enrollment_date, users(full_name), courses(name)')
      .eq('student_id_number', req.params.studentIdNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return res.status(404).json({ error: 'Student not found' });

    res.json({
      verified: true,
      studentName: data.users?.full_name,
      studentId: data.student_id_number,
      course: data.courses?.name,
      enrollmentDate: data.enrollment_date,
    });
  } catch (err) {
    console.error('Verify student error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const update = async (req, res) => {
  try {
    const updates = {};
    const allowed = ['course_id', 'phone', 'address', 'city', 'state', 'pincode', 'status', 'photo_url'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Student not found' });
    res.json(data);
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Failed to update student' });
  }
};
