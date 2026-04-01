import { supabaseAdmin } from '../config/supabase.js';

export const create = async (req, res) => {
  try {
    const { title, content, category, isPublished, publishDate, targetAudience, courseId } = req.body;
    const { data, error } = await supabaseAdmin.from('notices').insert({
      title,
      content,
      category,
      is_published: isPublished,
      publish_date: publishDate || (isPublished ? new Date().toISOString() : null),
      target_audience: targetAudience,
      course_id: courseId || null,
      created_by: req.user.id,
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create notice error:', err);
    res.status(500).json({ error: 'Failed to create notice' });
  }
};

export const getAll = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    // Non-admin users only see published notices
    if (!req.user || req.user.role !== 'admin') {
      query = query
        .eq('is_published', true)
      // .lte('publish_date', new Date().toISOString());
    }
    if (req.query.category) query = query.eq('category', req.query.category);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get notices error:', err);
    res.status(500).json({ error: 'Failed to fetch notices' });
  }
};

export const getById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notices')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Notice not found' });
    res.json(data);
  } catch (err) {
    console.error('Get notice error:', err);
    res.status(500).json({ error: 'Failed to fetch notice' });
  }
};

export const update = async (req, res) => {
  try {
    const { title, content, category, isPublished, publishDate, targetAudience, courseId } = req.body;
    const { data, error } = await supabaseAdmin
      .from('notices')
      .update({
        title,
        content,
        category,
        is_published: isPublished,
        publish_date: publishDate,
        target_audience: targetAudience,
        course_id: courseId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Notice not found' });
    res.json(data);
  } catch (err) {
    console.error('Update notice error:', err);
    res.status(500).json({ error: 'Failed to update notice' });
  }
};

export const remove = async (req, res) => {
  try {
    const { error } = await supabaseAdmin.from('notices').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    console.error('Delete notice error:', err);
    res.status(500).json({ error: 'Failed to delete notice' });
  }
};
