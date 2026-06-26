import { supabaseAdmin } from '../config/supabase.js';
import { getDownloadUrl, getObjectStream } from '../utils/r2.js';
import crypto from 'crypto';

const getContentType = (key) => {
  const lower = (key || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const toDataUrl = (buffer, contentType) => {
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${contentType};base64,${base64}`;
};

const generateCertCode = () => `CERT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const resolveStudentPhotoUrl = async (studentId) => {
  try {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('user_id')
      .eq('id', studentId)
      .single();

    if (!student?.user_id) return null;

    const { data: admissions } = await supabaseAdmin
      .from('admissions')
      .select('id')
      .eq('user_id', student.user_id)
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
    return toDataUrl(buffer, getContentType(docs[0].file_url));
  } catch (err) {
    console.error('Resolve student photo error:', err);
    return null;
  }
};

export const create = async (req, res) => {
  try {
    const { studentId, courseId, issueDate, fileUrl } = req.body;

    // Check if certificate already exists
    const { data: existingCert, error: fetchError } = await supabaseAdmin
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingCert) {
      const photoUrl = await resolveStudentPhotoUrl(studentId);
      return res.status(200).json({ ...existingCert, isExisting: true, photoUrl });
    }

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
    const photoUrl = await resolveStudentPhotoUrl(studentId);
    res.status(201).json({ ...data, isExisting: false, photoUrl });
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
      .select('*, students(student_id_number, user_id, users(full_name)), courses(name)')
      .eq('certificate_number', req.params.code)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Certificate not found' });

    // Look for an applicant photo document linked to this student's admission
    let photoUrl = null;
    if (data.students?.user_id) {
      const { data: admissions } = await supabaseAdmin
        .from('admissions')
        .select('id')
        .eq('user_id', data.students.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (admissions && admissions.length > 0) {
        const { data: docs } = await supabaseAdmin
          .from('documents')
          .select('file_url')
          .eq('entity_type', 'admission')
          .eq('entity_id', admissions[0].id)
          .eq('document_type', 'applicant_photo')
          .order('created_at', { ascending: false })
          .limit(1);

        if (docs && docs.length > 0) {
          try {
            const stream = await getObjectStream({ key: docs[0].file_url });
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            if (chunks.length > 0) {
              const buffer = Buffer.concat(chunks);
              photoUrl = toDataUrl(buffer, getContentType(docs[0].file_url));
            }
          } catch (e) {
            console.error('Failed to inline student photo:', e);
          }
        }
      }
    }

    res.json({
      verified: true,
      certificateNumber: data.certificate_number,
      studentName: data.students?.users?.full_name,
      studentId: data.students?.student_id_number,
      course: data.courses?.name,
      issueDate: data.issue_date,
      photoUrl,
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

    const downloadUrl = await getDownloadUrl({
      key: data.file_url,
      expiresIn: 300,
      downloadName: 'certificate.pdf',
    });

    res.json({ downloadUrl });
  } catch (err) {
    console.error('Download certificate error:', err);
    res.status(500).json({ error: 'Failed to generate download link' });
  }
};
