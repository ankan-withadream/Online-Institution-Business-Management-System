import { supabaseAdmin } from '../config/supabase.js';

export const checkAndUpdateExamStatuses = async () => {
  try {
    const now = new Date();
    
    // Fetch all active exams (scheduled or ongoing)
    const { data: exams, error } = await supabaseAdmin
      .from('exams')
      .select('*')
      .in('status', ['scheduled', 'ongoing']);

      // console.log('Fetched exams for status check:', exams);
      
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
setInterval(checkAndUpdateExamStatuses, 60000);
checkAndUpdateExamStatuses();

export const create = async (req, res) => {
  try {
    const { name, courseId, sessionId, subjectId, examDate, startTime, endTime, totalMarks, passingMarks, videoUrl } = req.body;
    const { data, error } = await supabaseAdmin.from('exams').insert({
      name,
      course_id: courseId,
      session_id: sessionId,
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
      .select('*, courses(name), sessions(session_type, start_date, end_date), subjects(name)')
      .order('exam_date', { ascending: true });

    if (req.query.courseId) query = query.eq('course_id', req.query.courseId);
    if (req.query.sessionId) query = query.eq('session_id', req.query.sessionId);
    if (req.query.status) query = query.eq('status', req.query.status);

    // Students see only exams for their course
    if (req.user.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('course_id, session_id')
        .eq('user_id', req.user.id)
        .single();

      if (student) {
        query = query.eq('course_id', student.course_id);
        if (student.session_id) query = query.eq('session_id', student.session_id);
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
      .select('*, courses(name), sessions(session_type, start_date, end_date), subjects(name)')
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
    const { name, courseId, sessionId, subjectId, examDate, startTime, endTime, totalMarks, passingMarks, videoUrl } = req.body;
    const { data, error } = await supabaseAdmin
      .from('exams')
      .update({
        name,
        course_id: courseId,
        session_id: sessionId,
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

export const submitAnswer = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Fetch exam with times
    const { data: exam, error: examErr } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (examErr || !exam) return res.status(404).json({ error: 'Exam not found' });

    // Validate that the current time is before the exam end time
    if (!exam.exam_date || !exam.start_time || !exam.end_time) {
      return res.status(400).json({ error: 'Exam date and time not configured' });
    }

    const [year, month, day] = exam.exam_date.split('-').map(Number);
    const [eh, em, es = 0] = exam.end_time.split(':').map(Number);
    const endTime = new Date(year, month - 1, day, eh, em, es);
    const now = new Date();

    if (now >= endTime) {
      return res.status(403).json({ error: 'Exam has ended. Answer submission is no longer accepted.' });
    }

    // Get student record for the current user
    const { data: student, error: studentErr } = await supabaseAdmin
      .from('students')
      .select('id, course_id')
      .eq('user_id', req.user.id)
      .single();

    if (studentErr || !student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Verify student is enrolled in the exam's course
    if (student.course_id !== exam.course_id) {
      return res.status(403).json({ error: 'You are not enrolled in this exam' });
    }

    // Check if student already submitted an answer for this exam
    const { data: existingAnswer } = await supabaseAdmin
      .from('answers')
      .select('id')
      .eq('exam_id', exam.id)
      .eq('student_id', student.id)
      .maybeSingle();

    if (existingAnswer) {
      return res.status(409).json({ error: 'You have already submitted an answer for this exam' });
    }

    // Upload file to R2 and create document record
    const { buildR2Key, uploadBuffer } = await import('../utils/r2.js');
    const fileKey = buildR2Key(`answer_sheet/${exam.id}`, req.file.originalname);
    await uploadBuffer({
      key: fileKey,
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    const { data: document, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({
        entity_type: 'answer_sheet',
        entity_id: exam.id,
        document_type: 'student_answer',
        file_url: fileKey,
        original_name: req.file.originalname,
        uploaded_by: req.user.id,
      })
      .select()
      .single();

    if (docError) throw docError;

    // Create answer record mapping exam, student, and document
    const { data: answer, error: answerErr } = await supabaseAdmin
      .from('answers')
      .insert({
        exam_id: exam.id,
        student_id: student.id,
        document_id: document.id,
      })
      .select()
      .single();

    if (answerErr) throw answerErr;

    res.status(201).json({ answer, document });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
};

export const getAnswers = async (req, res) => {
  try {
    // Fetch answers with nested student & user info and document metadata
    const { data: answers, error } = await supabaseAdmin
      .from('answers')
      .select(`
        id,
        submitted_at,
        student:student_id (
          id,
          student_id_number,
          user:user_id (
            full_name,
            email
          )
        ),
        document:document_id (
          id,
          file_url,
          original_name
        )
      `)
      .eq('exam_id', req.params.id)
      .order('submitted_at', { ascending: true });

    if (error) throw error;

    // Attach signed download URLs to each document
    const { getDownloadUrl } = await import('../utils/r2.js');
    const answersWithUrls = await Promise.all(
      answers.map(async (a) => {
        if (!a.document) return a;
        try {
          const downloadUrl = await getDownloadUrl({
            key: a.document.file_url,
            expiresIn: 300,
            downloadName: a.document.original_name || 'answer_sheet.pdf',
          });
          return { ...a, document: { ...a.document, downloadUrl } };
        } catch {
          return a; // Return as-is if URL generation fails
        }
      })
    );

    res.json(answersWithUrls);
  } catch (err) {
    console.error('Get answers error:', err);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
};

export const downloadAllAnswers = async (req, res) => {
  try {
    // Verify exam exists
    const { data: exam } = await supabaseAdmin
      .from('exams')
      .select('name')
      .eq('id', req.params.id)
      .single();

    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Fetch all answers with student names and document file keys
    const { data: answers, error } = await supabaseAdmin
      .from('answers')
      .select(`
        id,
        student:student_id (
          student_id_number,
          user:user_id (
            full_name
          )
        ),
        document:document_id (
          file_url,
          original_name
        )
      `)
      .eq('exam_id', req.params.id);

    if (error) throw error;

    const { ZipArchive } = await import('archiver'); // ZipArchive extends Archiver, sets _module internally
    const { getObjectStream } = await import('../utils/r2.js');

    // Stream a ZIP of all answer PDFs named <exam>_answers.zip
    const archive = new ZipArchive({ zlib: { level: 5 } });
    const safeName = exam.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_answers.zip"`);
    archive.pipe(res);

    let hasFiles = false;

    for (const answer of answers) {
      if (!answer.document?.file_url) continue;
      hasFiles = true;

      // Name files <student_name>_<student_id>.pdf inside the ZIP
      const studentName = answer.student?.user?.full_name?.replace(/[^a-zA-Z0-9._-]/g, '_') || `student_${answer.student?.student_id_number || 'unknown'}`;
      const originalExt = answer.document.original_name?.split('.').pop() || 'pdf';
      const fileName = `${studentName}_${answer.student?.student_id_number || 'unknown'}.${originalExt}`;

      try {
        const body = await getObjectStream({ key: answer.document.file_url });
        archive.append(body, { name: fileName });
      } catch (err) {
        console.error(`Failed to download ${answer.document.file_url}:`, err);
        // Include an error placeholder so the ZIP still has a record for that student
        archive.append(`Failed to retrieve: ${answer.document.original_name || answer.document.file_url}`, { name: `errors/${fileName}.txt` });
      }
    }

    if (!hasFiles) {
      archive.append('No answer documents found for this exam.', { name: 'README.txt' });
    }

    await archive.finalize();
  } catch (err) {
    console.error('Download all answers error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download answers' });
    }
  }
};

