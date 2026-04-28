import { supabaseAdmin } from '../config/supabase.js';

export const getAll = async (_req, res) => {
  try {
    let query = supabaseAdmin
      .from('courses')
      .select('*, subjects(*)')
      .order('created_at', { ascending: false });

    if (!_req.user || _req.user.role !== 'admin') {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;

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
      .select('*, subjects(*)')
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
    const { name, slug, description, durationMonths, fee, isActive, subjects } = req.body;
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

    res.status(201).json(data);
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const update = async (req, res) => {
  try {
    const { name, slug, description, durationMonths, fee, isActive, subjects } = req.body;
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
      .eq('id', req.params.id)
      .select()
      .single();

    if (courseError) throw courseError;
    if (!courseData) return res.status(404).json({ error: 'Course not found' });

    if (subjects) {
      const { data: existingSubjects } = await supabaseAdmin
        .from('subjects')
        .select('id, code')
        .eq('course_id', req.params.id);

      const incomingCodes = subjects.map(s => s.code);
      const codesToDelete = existingSubjects
        ?.filter(es => !incomingCodes.includes(es.code))
        .map(es => es.code) || [];

      if (codesToDelete.length > 0) {
        await supabaseAdmin.from('subjects').delete().in('code', codesToDelete);
      }

      if (subjects.length > 0) {
        const parsedSubjects = subjects.map(s => ({
          course_id: req.params.id,
          name: s.name,
          code: s.code,
          description: s.description,
          max_marks: s.maxMarks || s.max_marks || 100,
          semester: s.semester || 1
        }));

        const { error: subErr } = await supabaseAdmin.from('subjects').upsert(parsedSubjects, { onConflict: 'code' });
        if (subErr) throw subErr;
      }
    }

    res.json(courseData);
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
