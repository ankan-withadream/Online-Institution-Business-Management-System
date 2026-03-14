import { supabaseAdmin } from '../config/supabase.js';

export const getAll = async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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
      .select('*')
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
    const { name, slug, description, durationMonths, fee, isActive } = req.body;
    const { data, error } = await supabaseAdmin.from('courses').insert({
      name,
      slug,
      description,
      duration_months: durationMonths,
      fee,
      is_active: isActive,
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const update = async (req, res) => {
  try {
    const { name, slug, description, durationMonths, fee, isActive } = req.body;
    const { data, error } = await supabaseAdmin
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

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Course not found' });
    res.json(data);
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
