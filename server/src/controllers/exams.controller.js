import { supabaseAdmin } from '../config/supabase.js';

export const create = async (req, res) => {
  try {
    const { name, courseId, examDate, startTime, endTime, totalMarks, passingMarks } = req.body;
    const { data, error } = await supabaseAdmin.from('exams').insert({
      name,
      course_id: courseId,
      exam_date: examDate,
      start_time: startTime,
      end_time: endTime,
      total_marks: totalMarks,
      passing_marks: passingMarks,
      status: 'scheduled',
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create exam error:', err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

export const getAll = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('exams')
      .select('*, courses(name)')
      .order('exam_date', { ascending: true });

    if (req.query.courseId) query = query.eq('course_id', req.query.courseId);
    if (req.query.status) query = query.eq('status', req.query.status);

    // Students see only exams for their course
    if (req.user.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('course_id')
        .eq('user_id', req.user.id)
        .single();

      if (student) {
        query = query.eq('course_id', student.course_id);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get exams error:', err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

export const getById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .select('*, courses(name)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Exam not found' });
    res.json(data);
  } catch (err) {
    console.error('Get exam error:', err);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
};

export const update = async (req, res) => {
  try {
    const { name, courseId, examDate, startTime, endTime, totalMarks, passingMarks } = req.body;
    const { data, error } = await supabaseAdmin
      .from('exams')
      .update({
        name,
        course_id: courseId,
        exam_date: examDate,
        start_time: startTime,
        end_time: endTime,
        total_marks: totalMarks,
        passing_marks: passingMarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Exam not found' });
    res.json(data);
  } catch (err) {
    console.error('Update exam error:', err);
    res.status(500).json({ error: 'Failed to update exam' });
  }
};

export const remove = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('exams').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    console.error('Delete exam error:', err);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
};
