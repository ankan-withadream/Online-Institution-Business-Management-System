import { supabaseAdmin } from '../config/supabase.js';

export const create = async (req, res) => {
  try {
    const { studentId, courseId, franchiseId, paidAmount, toBePaidAmount, dueAmount, paymentMethod, transactionId, paymentType, remarks } = req.body;

    const { data, error } = await supabaseAdmin.from('fee_payments').insert({
      student_id: studentId,
      course_id: courseId,
      franchise_id: franchiseId,
      to_be_paid_amount: toBePaidAmount,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_method: paymentMethod || 'upi',
      transaction_id: transactionId,
      payment_type: paymentType || 'full',
      status: 'completed',
      remarks,
      paid_by: req.user.id,
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error('Create fee payment error:', err);
    res.status(500).json({ error: 'Failed to create fee payment' });
  }
};

export const bulkCreate = async (req, res) => {
  try {
    const { payments } = req.body; // Array of { studentId, courseId, franchiseId, paidAmount, toBePaidAmount, dueAmount, paymentMethod, transactionId, paymentType }

    if (!payments || payments.length === 0) {
      return res.status(400).json({ error: 'No payments provided' });
    }

    const records = payments.map(p => ({
      student_id: p.studentId,
      course_id: p.courseId,
      franchise_id: p.franchiseId,
      to_be_paid_amount: p.toBePaidAmount,
      paid_amount: p.paidAmount,
      due_amount: p.dueAmount,
      payment_method: p.paymentMethod || 'upi',
      transaction_id: p.transactionId,
      payment_type: p.paymentType || 'full',
      status: 'completed',
      remarks: p.remarks || null,
      paid_by: req.user.id,
    }));

    const { data, error } = await supabaseAdmin.from('fee_payments').insert(records).select();
    if (error) throw error;
    res.status(201).json({ message: `${data.length} payments recorded`, payments: data });
  } catch (err) {
    console.error('Bulk create fee payments error:', err);
    res.status(500).json({ error: 'Failed to create bulk fee payments' });
  }
};

export const getByFranchise = async (req, res) => {
  try {
    const { franchiseId } = req.params;

    // Ownership check for franchise users
    if (req.user.role === 'franchise') {
      const { data: franchise } = await supabaseAdmin
        .from('franchises')
        .select('id')
        .eq('user_id', req.user.id)
        .single();

      if (!franchise || franchise.id !== franchiseId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('fee_payments')
      .select('*, students(student_id_number, users(full_name, email)), courses(name, fee)')
      .eq('franchise_id', franchiseId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get franchise fee payments error:', err);
    res.status(500).json({ error: 'Failed to fetch fee payments' });
  }
};

export const getByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('fee_payments')
      .select('*, courses(name, fee)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get student fee payments error:', err);
    res.status(500).json({ error: 'Failed to fetch fee payments' });
  }
};
