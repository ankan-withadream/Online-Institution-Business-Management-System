import { supabaseAdmin } from '../config/supabase.js';

export const getAll = async (_req, res) => {

  console.log('Get all courses request received');
  try {
    console.log('Fetching courses from database...');
    let query = supabaseAdmin
      .from('courses')
      .select('*, subjects(*), sessions(*)')
      .order('created_at', { ascending: false });

    if (!_req.user || _req.user.role !== 'admin') {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    console.log('Fetched courses:', data);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

export const getById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*, subjects(*), sessions(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Course not found' });
    res.json(data);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

export const create = async (req, res) => {
  try {
    const { name, slug, description, durationMonths, fee, isActive, subjects, sessions } = req.body;
    const { data, error } = await supabaseAdmin.from('courses').insert({
      name,
      slug,
      description,
      duration_months: durationMonths,
      fee,
      is_active: isActive,
    }).select().single();

    if (error) throw error;

    if (subjects && subjects.length > 0) {
      const parsedSubjects = subjects.map(s => ({
        course_id: data.id,
        name: s.name,
        code: s.code,
        description: s.description,
        max_marks: s.maxMarks || 100,
        semester: s.semester || 1
      }));
      const { error: subErr } = await supabaseAdmin.from('subjects').insert(parsedSubjects);
      if (subErr) throw subErr;
    }

    if (sessions && sessions.length > 0) {
      const parsedSessions = sessions.map(s => ({
        course_id: data.id,
        session_type: s.sessionType || s.session_type || 'Normal',
        start_date: s.startDate || s.start_date || null,
        end_date: s.endDate || s.end_date || null
      }));
      const { error: sessErr } = await supabaseAdmin.from('sessions').insert(parsedSessions);
      if (sessErr) throw sessErr;
    }

    res.status(201).json(data);
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const update = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { name, slug, description, durationMonths, fee, isActive, subjects, sessions } = req.body;

    // 1. Update course row
    const { data: courseData, error: courseError } = await supabaseAdmin
      .from('courses')
      .update({
        name,
        slug,
        description,
        duration_months: durationMonths,
        fee,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', courseId)
      .select()
      .single();

    if (courseError) throw courseError;
    if (!courseData) return res.status(404).json({ error: 'Course not found' });

    // 2. Sync subjects (delete removed, upsert remaining)
    if (subjects) {
      const { data: existingSubjects } = await supabaseAdmin
        .from('subjects')
        .select('id, code')
        .eq('course_id', courseId);

      const incomingCodes = subjects.map(s => s.code);
      const idsToDelete = existingSubjects
        ?.filter(es => !incomingCodes.includes(es.code))
        .map(es => es.id) || [];

      if (idsToDelete.length > 0) {
        await supabaseAdmin.from('subjects').delete().in('id', idsToDelete);
      }

      if (subjects.length > 0) {
        const parsedSubjects = subjects.map(s => ({
          course_id: courseId,
          name: s.name,
          code: s.code,
          description: s.description,
          max_marks: s.maxMarks || s.max_marks || 100,
          semester: s.semester || 1
        }));

        const { error: subErr } = await supabaseAdmin
          .from('subjects')
          .upsert(parsedSubjects, { onConflict: 'code' });
        if (subErr) throw subErr;
      }
    }

    // 3. Sync sessions (delete removed, update existing, insert new)
    if (sessions) {
      const { data: existingSessions } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('course_id', courseId);

      const incomingIds = sessions.filter(s => s.id).map(s => s.id);
      const idsToDelete = existingSessions
        ?.filter(es => !incomingIds.includes(es.id))
        .map(es => es.id) || [];

      if (idsToDelete.length > 0) {
        await supabaseAdmin.from('sessions').delete().in('id', idsToDelete);
      }

      const toUpdate = [];
      const toInsert = [];

      for (const s of sessions) {
        const row = {
          course_id: courseId,
          session_type: s.sessionType || s.session_type || 'Normal',
          start_date: s.startDate || s.start_date || null,
          end_date: s.endDate || s.end_date || null,
        };
        if (s.id) {
          row.id = s.id;
          toUpdate.push(row);
        } else {
          toInsert.push(row);
        }
      }

      if (toUpdate.length > 0) {
        const { error: updErr } = await supabaseAdmin.from('sessions').upsert(toUpdate);
        if (updErr) throw updErr;
      }

      if (toInsert.length > 0) {
        const { error: insErr } = await supabaseAdmin.from('sessions').insert(toInsert);
        if (insErr) throw insErr;
      }
    }

    // 4. Return full course with relations
    const { data: fullCourse, error: fetchErr } = await supabaseAdmin
      .from('courses')
      .select('*, subjects(*), sessions(*)')
      .eq('id', courseId)
      .single();

    if (fetchErr) throw fetchErr;

    res.json(fullCourse);
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const remove = async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
