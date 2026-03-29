import { supabaseAdmin } from '../config/supabase.js';

export const apply = async (req, res) => {
  try {
    const body = req.body;
    const { data, error } = await supabaseAdmin.from('franchises').insert({
      organization_name: body.organizationName,
      contact_person: body.contactPerson,
      email: body.email,
      initial_password: body.password,
      phone: body.phone,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      status: 'pending',
    }).select().single();

    if (error) throw error;
    res.status(201).json({ message: 'Franchise application submitted', franchise: data });
  } catch (err) {
    console.error('Franchise apply error:', err);
    res.status(500).json({ error: 'Failed to submit franchise application' });
  }
};

export const getAll = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('franchises')
      .select('*')
      .order('created_at', { ascending: false });

    if (req.query.status) query = query.eq('status', req.query.status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get franchises error:', err);
    res.status(500).json({ error: 'Failed to fetch franchises' });
  }
};

export const getById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('franchises')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Franchise not found' });

    // Franchise users can only view their own franchise
    if (req.user.role === 'franchise' && data.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(data);
  } catch (err) {
    console.error('Get franchise error:', err);
    res.status(500).json({ error: 'Failed to fetch franchise' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    const { data: franchise, error: fetchErr } = await supabaseAdmin
      .from('franchises')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !franchise) return res.status(404).json({ error: 'Franchise not found' });

    const { data, error } = await supabaseAdmin
      .from('franchises')
      .update({
        status,
        admin_remarks: adminRemarks,
        reviewed_by: req.user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // If approved, create a user account for the franchise
    if (status === 'approved' && !franchise.user_id) {
      // const tempPassword = `Fran@${Date.now().toString(36)}`;
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: franchise.email,
        password: franchise.initial_password,
        email_confirm: true,
      });

      if (!authError && authData?.user) {
        const { data: roleData } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', 'franchise')
          .single();

        await supabaseAdmin.from('users').insert({
          id: authData.user.id,
          email: franchise.email,
          full_name: franchise.contact_person,
          role_id: roleData.id,
        });

        await supabaseAdmin
          .from('franchises')
          .update({ user_id: authData.user.id })
          .eq('id', franchise.id);
      }
    }

    res.json({ message: `Franchise ${status}`, franchise: data });
  } catch (err) {
    console.error('Update franchise status error:', err);
    res.status(500).json({ error: 'Failed to update franchise status' });
  }
};

export const getStudents = async (req, res) => {
  try {
    // Ownership check for franchise users
    if (req.user.role === 'franchise') {
      const { data: franchise } = await supabaseAdmin
        .from('franchises')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!franchise || franchise.id !== req.params.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*, users(full_name, email), courses(name)')
      .eq('franchise_id', req.params.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get franchise students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};
