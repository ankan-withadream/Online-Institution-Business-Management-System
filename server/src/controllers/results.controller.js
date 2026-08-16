import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';
import { applyListQuery, parseListParams, respondList } from '../utils/listQuery.js';

const generateVerificationCode = () => `RES-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

export const create = async (req, res) => {
  try {
    const { studentId, examId, subjectId, marksObtained, grade, isPass, published } = req.body;
    const { data, error } = await supabaseAdmin.from('results').insert({
      student_id: studentId,
      exam_id: examId,
      subject_id: subjectId,
      marks_obtained: marksObtained,
      grade,
      is_pass: isPass,
      published,
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
      published: r.published,
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

    const listOpts = {
      sortable: ['marks_obtained', 'created_at', 'published'],
      searchable: [],
      filterable: [],
    };

    let query = supabaseAdmin
      .from('results')
      .select(
        '*, exams(name, exam_date, session_id), subjects(name, code, max_marks)',
        { count: 'exact' }
      )
      .eq('student_id', req.params.studentId)
      .eq('published', true);

    ({ query } = await applyListQuery(query, req, listOpts));
    if (!req.query.sort) query = query.order('created_at', { ascending: false });

    const result = await query;
    const params = parseListParams(req, listOpts);
    respondList(res, result, params);
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
      .select('*, students(student_id_number, session_id, users(full_name)), exams(name, session_id), subjects(name)')
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

export const getAll = async (req, res) => {
  try {
    const listOpts = {
      sortable: ['marks_obtained', 'created_at', 'grade', 'is_pass', 'published'],
      searchable: ['grade', 'students.users.full_name', 'exams.name', 'subjects.name'],
      filterable: ['exam_id', 'subject_id', 'is_pass', 'published'],
      // nested columns -> FK the *containing* table uses to reference the child
      nestedFk: {
        students: 'student_id',
        'students.users': 'user_id',
        exams: 'exam_id',
        subjects: 'subject_id',
      },
    };

    let query = supabaseAdmin
      .from('results')
      .select('*, students(student_id_number, session_id, users(full_name)), exams(name, course_id, session_id), subjects(name)', { count: 'exact' });

    // Backward-compatible direct examId filter
    if (req.query.examId) {
      query = query.eq('exam_id', req.query.examId);
    }

    ({ query } = await applyListQuery(query, req, listOpts));
    if (!req.query.sort) query = query.order('created_at', { ascending: false });

    const result = await query;
    const params = parseListParams(req, listOpts);
    respondList(res, result, params);
  } catch (err) {
    console.error('Get all results error:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};

export const update = async (req, res) => {
  try {
    const { studentId, examId, subjectId, marksObtained, grade, isPass, published } = req.body;

    const { data, error } = await supabaseAdmin.from('results').update({
      student_id: studentId,
      exam_id: examId,
      subject_id: subjectId,
      marks_obtained: marksObtained,
      grade,
      is_pass: isPass,
      published,
      updated_at: new Date().toISOString()
    }).eq('id', req.params.id).select().single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Result not found' });

    res.json(data);
  } catch (err) {
    console.error('Update result error:', err);
    res.status(500).json({ error: 'Failed to update result' });
  }
};

export const remove = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('results').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Result deleted' });
  } catch (err) {
    console.error('Delete result error:', err);
    res.status(500).json({ error: 'Failed to delete result' });
  }
};
