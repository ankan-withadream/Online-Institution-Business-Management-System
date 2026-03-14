import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';

const generateVerificationCode = () => `RES-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

export const create = async (req, res) => {
  try {
    const { studentId, examId, subjectId, marksObtained, grade, isPass } = req.body;
    const { data, error } = await supabaseAdmin.from('results').insert({
      student_id: studentId,
      exam_id: examId,
      subject_id: subjectId,
      marks_obtained: marksObtained,
      grade,
      is_pass: isPass,
      verification_code: generateVerificationCode(),
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create result error:', err);
    res.status(500).json({ error: 'Failed to create result' });
  }
};

export const bulkCreate = async (req, res) => {
  try {
    const results = req.body.results.map((r) => ({
      student_id: r.studentId,
      exam_id: r.examId,
      subject_id: r.subjectId,
      marks_obtained: r.marksObtained,
      grade: r.grade,
      is_pass: r.isPass,
      verification_code: generateVerificationCode(),
    }));

    const { data, error } = await supabaseAdmin.from('results').insert(results).select();
    if (error) throw error;
    res.status(201).json({ message: `${data.length} results uploaded`, data });
  } catch (err) {
    console.error('Bulk create results error:', err);
    res.status(500).json({ error: 'Failed to upload results' });
  }
};

export const getByStudent = async (req, res) => {
  try {
    // Ownership check for students
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
      .from('results')
      .select('*, exams(name, exam_date), subjects(name, code, max_marks)')
      .eq('student_id', req.params.studentId)
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};

export const publish = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('results')
      .update({ published: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Result not found' });
    res.json({ message: 'Result published', result: data });
  } catch (err) {
    console.error('Publish result error:', err);
    res.status(500).json({ error: 'Failed to publish result' });
  }
};

export const verify = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('results')
      .select('*, students(student_id_number, users(full_name)), exams(name), subjects(name)')
      .eq('verification_code', req.params.code)
      .eq('published', true)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Result not found or not published' });

    res.json({
      verified: true,
      studentName: data.students?.users?.full_name,
      studentId: data.students?.student_id_number,
      exam: data.exams?.name,
      subject: data.subjects?.name,
      marks: data.marks_obtained,
      grade: data.grade,
      pass: data.is_pass,
    });
  } catch (err) {
    console.error('Verify result error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
};
