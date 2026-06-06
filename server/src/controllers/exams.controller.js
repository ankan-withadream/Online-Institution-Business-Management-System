import { supabaseAdmin } from '../config/supabase.js';

export const checkAndUpdateExamStatuses = async () => {
  try {
    const now = new Date();
    
    // Fetch all active exams (scheduled or ongoing)
    const { data: exams, error } = await supabaseAdmin
      .from('exams')
      .select('*')
      .in('status', ['scheduled', 'ongoing']);
      
    if (error) throw error;
    if (!exams || exams.length === 0) return;

    for (const exam of exams) {
      if (!exam.exam_date || !exam.start_time || !exam.end_time) continue;

      const [year, month, day] = exam.exam_date.split('-').map(Number);
      
      const [sh, sm, ss = 0] = exam.start_time.split(':').map(Number);
      const startTime = new Date(year, month - 1, day, sh, sm, ss);
      
      const [eh, em, es = 0] = exam.end_time.split(':').map(Number);
      const endTime = new Date(year, month - 1, day, eh, em, es);
      
      let newStatus = null;
      
      if (exam.status === 'scheduled') {
        if (now >= startTime && now < endTime) {
          newStatus = 'ongoing';
        } else if (now >= endTime) {
          newStatus = 'completed';
        }
      } else if (exam.status === 'ongoing') {
        if (now >= endTime) {
          newStatus = 'completed';
        } else if (now < startTime) {
          newStatus = 'scheduled';
        }
      }
      
      if (newStatus && newStatus !== exam.status) {
        await supabaseAdmin
          .from('exams')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', exam.id);
        console.log(`Updated exam ${exam.name} (${exam.id}) status from ${exam.status} to ${newStatus}`);
      }
    }
  } catch (err) {
    console.error('Error in checkAndUpdateExamStatuses:', err);
  }
};

// Start background continuous checking
setInterval(checkAndUpdateExamStatuses, 10000);
checkAndUpdateExamStatuses();

export const create = async (req, res) => {
  try {
    const { name, courseId, subjectId, examDate, startTime, endTime, totalMarks, passingMarks, videoUrl } = req.body;
    const { data, error } = await supabaseAdmin.from('exams').insert({
      name,
      course_id: courseId,
      subject_id: subjectId || null,
      exam_date: examDate,
      start_time: startTime,
      end_time: endTime,
      total_marks: totalMarks,
      passing_marks: passingMarks,
      status: 'scheduled',
      video_url: videoUrl || null,
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
    await checkAndUpdateExamStatuses();
    let query = supabaseAdmin
      .from('exams')
      .select('*, courses(name), subjects(name)')
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
    await checkAndUpdateExamStatuses();
    const { data, error } = await supabaseAdmin
      .from('exams')
      .select('*, courses(name), subjects(name)')
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
    const { name, courseId, subjectId, examDate, startTime, endTime, totalMarks, passingMarks, videoUrl } = req.body;
    const { data, error } = await supabaseAdmin
      .from('exams')
      .update({
        name,
        course_id: courseId,
        subject_id: subjectId || null,
        exam_date: examDate,
        start_time: startTime,
        end_time: endTime,
        total_marks: totalMarks,
        passing_marks: passingMarks,
        video_url: videoUrl || null,
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

export const getQuestionPaper = async (req, res) => {
  try {
    // Fetch exam to check status
    const { data: exam, error: examErr } = await supabaseAdmin
      .from('exams')
      .select('id, status')
      .eq('id', req.params.id)
      .single();

    if (examErr || !exam) return res.status(404).json({ error: 'Exam not found' });

    if (req.user.role === 'student' && !['ongoing', 'completed'].includes(exam.status)) {
      return res.status(403).json({ error: 'Question paper is not available until the exam is ongoing or completed' });
    }

    // Fetch the question_paper document
    const { data: docs, error: docErr } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('entity_type', 'exam')
      .eq('entity_id', exam.id)
      .eq('document_type', 'question_paper')
      .order('created_at', { ascending: false })
      .limit(1);

    if (docErr) throw docErr;
    if (!docs || docs.length === 0) return res.status(404).json({ error: 'No question paper uploaded for this exam' });

    const doc = docs[0];

    // Import URL helpers inline to avoid circular deps
    const { getDownloadUrl, getPreviewUrl } = await import('../utils/r2.js');
    const downloadUrl = await getDownloadUrl({ key: doc.file_url, expiresIn: 300, downloadName: doc.original_name || 'question_paper.pdf' });
    const previewUrl = await getPreviewUrl({ key: doc.file_url, expiresIn: 300 });

    res.json({ ...doc, downloadUrl, previewUrl });
  } catch (err) {
    console.error('Get question paper error:', err);
    res.status(500).json({ error: 'Failed to fetch question paper' });
  }
};

