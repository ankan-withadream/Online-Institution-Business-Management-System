import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';

const generateCertCode = () => `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

export const create = async (req, res) => {
  try {
    const { studentId, courseId, issueDate, fileUrl } = req.body;

    // Generate unique certificate number
    const year = new Date().getFullYear();
    const { count } = await supabaseAdmin
      .from('certificates')
      .select('*', { count: 'exact', head: true });

    const certNumber = `CERT-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

    const { data, error } = await supabaseAdmin.from('certificates').insert({
      student_id: studentId,
      course_id: courseId,
      certificate_number: certNumber,
      issue_date: issueDate || new Date().toISOString().split('T')[0],
      file_url: fileUrl || null,
      verification_code: generateCertCode(),
      created_by: req.user.id,
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create certificate error:', err);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
};

export const getByStudent = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!student || student.id !== req.params.studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('*, courses(name)')
      .eq('student_id', req.params.studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get certificates error:', err);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};

export const verify = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('*, students(student_id_number, users(full_name)), courses(name)')
      .eq('verification_code', req.params.code)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Certificate not found' });

    res.json({
      verified: true,
      certificateNumber: data.certificate_number,
      studentName: data.students?.users?.full_name,
      studentId: data.students?.student_id_number,
      course: data.courses?.name,
      issueDate: data.issue_date,
    });
  } catch (err) {
    console.error('Verify certificate error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export const download = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select('file_url, student_id')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Certificate not found' });

    // Ownership check for students
    if (req.user.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!student || student.id !== data.student_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (!data.file_url) {
      return res.status(404).json({ error: 'Certificate file not available' });
    }

    // Generate signed URL for download
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('certificates')
      .createSignedUrl(data.file_url, 300); // 5 minute expiry

    if (urlError) throw urlError;
    res.json({ downloadUrl: signedUrl.signedUrl });
  } catch (err) {
    console.error('Download certificate error:', err);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
};
