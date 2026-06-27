import { supabaseAdmin } from '../config/supabase.js';
import { getObjectStream } from '../utils/r2.js';

const getPhotoContentType = (key) => {
  const lower = (key || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const toDataUrl = (buffer, contentType) => {
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
};

export const resolveStudentPhotoDataUrl = async (userId) => {
  if (!userId) return null;
  try {
    const { data: admissions } = await supabaseAdmin
      .from('admissions')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!admissions || admissions.length === 0) return null;

    const { data: docs } = await supabaseAdmin
      .from('documents')
      .select('file_url')
      .eq('entity_type', 'admission')
      .eq('entity_id', admissions[0].id)
      .eq('document_type', 'applicant_photo')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!docs || docs.length === 0) return null;

    const stream = await getObjectStream({ key: docs[0].file_url });
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    if (chunks.length === 0) return null;
    const buffer = Buffer.concat(chunks);
    return toDataUrl(buffer, getPhotoContentType(docs[0].file_url));
  } catch (err) {
    console.error('Resolve student photo error:', err);
    return null;
  }
};

export const getMe = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*, courses(name, description, duration_months), sessions(session_type, start_date, end_date)')
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
      .select('*, users(email, full_name), courses(name), sessions(session_type, start_date, end_date)')
      .order('created_at', { ascending: false });

    if (req.query.status) query = query.eq('status', req.query.status);
    if (req.query.courseId) query = query.eq('course_id', req.query.courseId);
    if (req.query.sessionId) query = query.eq('session_id', req.query.sessionId);

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
      .select('*, users(email, full_name), courses(name, description), sessions(session_type, start_date, end_date)')
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
      .select('id, user_id, student_id_number, status, father_name, mother_name, date_of_birth, users(full_name), courses(name)')
      .eq('student_id_number', req.params.studentIdNumber)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return res.status(404).json({ error: 'Student not found' });

    const photoUrl = await resolveStudentPhotoDataUrl(data.user_id);

    res.json({
      verified: true,
      studentName: data.users?.full_name,
      studentId: data.student_id_number,
      course: data.courses?.name,
      status: data.status,
      fatherName: data.father_name,
      motherName: data.mother_name,
      dateOfBirth: data.date_of_birth,
      photoUrl,
    });
  } catch (err) {
    console.error('Verify student error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const getPhoto = async (req, res) => {
  try {
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('user_id')
      .eq('id', req.params.id)
      .single();

    if (error || !student) return res.status(404).json({ error: 'Student not found' });

    const photoUrl = await resolveStudentPhotoDataUrl(student.user_id);
    res.json({ photoUrl });
  } catch (err) {
    console.error('Get student photo error:', err);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
};

export const update = async (req, res) => {
  try {
    if (req.user.role === 'franchise') {
      const { data: franchise } = await supabaseAdmin.from('franchises').select('id').eq('user_id', req.user.id).single();
      const { data: student } = await supabaseAdmin.from('students').select('franchise_id').eq('id', req.params.id).single();
      if (!franchise || !student || student.franchise_id !== franchise.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updates = {};
    const allowed = ['course_id', 'session_id', 'phone', 'address', 'city', 'state', 'pincode', 'status', 'photo_url'];
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
