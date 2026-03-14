import { supabaseAdmin } from '../config/supabase.js';
import { generateStudentId } from '../utils/idGenerator.js';

export const create = async (req, res) => {
  try {
    const body = req.body;
    const { data, error } = await supabaseAdmin.from('admissions').insert({
      course_id: body.courseId,
      franchise_id: body.franchiseId || null,
      full_name: body.fullName,
      email: body.email,
      phone: body.phone,
      date_of_birth: body.dateOfBirth,
      gender: body.gender,
      address: body.address,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      status: 'pending',
    }).select().single();

    if (error) throw error;
    res.status(201).json({ message: 'Admission application submitted', admission: data });
  } catch (err) {
    console.error('Create admission error:', err);
    res.status(500).json({ error: 'Failed to submit admission' });
  }
};

export const getAll = async (req, res) => {
  try {
    let query = supabaseAdmin
      .from('admissions')
      .select('*, courses(name)')
      .order('created_at', { ascending: false });

    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get admissions error:', err);
    res.status(500).json({ error: 'Failed to fetch admissions' });
  }
};

export const getById = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('admissions')
      .select('*, courses(name)')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Admission not found' });
    res.json(data);
  } catch (err) {
    console.error('Get admission error:', err);
    res.status(500).json({ error: 'Failed to fetch admission' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, adminRemarks } = req.body;

    // Get the admission
    const { data: admission, error: fetchError } = await supabaseAdmin
      .from('admissions')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !admission) return res.status(404).json({ error: 'Admission not found' });

    // Update admission status
    const { data, error } = await supabaseAdmin
      .from('admissions')
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

    // If approved, create a user account and student record
    if (status === 'approved') {
      const tempPassword = `Edu@${Date.now().toString(36)}`;

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: admission.email,
        password: tempPassword,
        email_confirm: true,
      });

      if (!authError && authData?.user) {
        // Get student role ID
        const { data: roleData } = await supabaseAdmin
          .from('roles')
          .select('id')
          .eq('name', 'student')
          .single();

        // Create user record
        await supabaseAdmin.from('users').insert({
          id: authData.user.id,
          email: admission.email,
          full_name: admission.full_name,
          role_id: roleData.id,
        });

        // Create student record
        const studentIdNumber = await generateStudentId();
        await supabaseAdmin.from('students').insert({
          user_id: authData.user.id,
          student_id_number: studentIdNumber,
          course_id: admission.course_id,
          franchise_id: admission.franchise_id,
          date_of_birth: admission.date_of_birth,
          gender: admission.gender,
          phone: admission.phone,
          address: admission.address,
          city: admission.city,
          state: admission.state,
          pincode: admission.pincode,
          enrollment_date: new Date().toISOString().split('T')[0],
          status: 'active',
        });
      }
    }

    res.json({ message: `Admission ${status}`, admission: data });
  } catch (err) {
    console.error('Update admission status error:', err);
    res.status(500).json({ error: 'Failed to update admission status' });
  }
};
