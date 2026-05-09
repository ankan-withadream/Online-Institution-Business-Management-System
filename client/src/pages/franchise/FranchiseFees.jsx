import { useState, useEffect, useMemo } from 'react';
import { CreditCard, X, IndianRupee, History, Users } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FranchiseFees = () => {
  const [franchise, setFranchise] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [payModal, setPayModal] = useState(null); // { student, course } or 'bulk'
  const [historyModal, setHistoryModal] = useState(null); // studentId
  const [submitting, setSubmitting] = useState(false);

  // QR code document
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  // Pay form state
  const [paymentType, setPaymentType] = useState('full'); // full, half, quarter, custom
  const [customAmount, setCustomAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: myFranchise } = await api.get('/franchises/me');
        if (myFranchise) {
          setFranchise(myFranchise);
          const [coursesRes, studentsRes, feesRes] = await Promise.all([
            api.get(`/franchises/${myFranchise.id}/courses`),
            api.get(`/franchises/${myFranchise.id}/students`),
            api.get(`/fees/franchise/${myFranchise.id}`),
          ]);
          setCourses(coursesRes.data);
          setStudents(studentsRes.data);
          setFeePayments(feesRes.data);
        }

        // Fetch payment QR code (system document)
        try {
          const qrRes = await api.get('/documents/entity/system/00000000-0000-0000-0000-000000000001');
          const qrDoc = qrRes.data?.find(d => d.document_type === 'payment_qr');
          if (qrDoc) setQrCodeUrl(qrDoc.previewUrl || qrDoc.downloadUrl);
        } catch {}
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const refreshFees = async () => {
    if (!franchise) return;
    try {
      const { data } = await api.get(`/fees/franchise/${franchise.id}`);
      setFeePayments(data);
    } catch {}
  };

  // Filter students by selected course
  const filteredStudents = useMemo(() => {
    if (!selectedCourse) return students;
    return students.filter(s => s.course_id === selectedCourse);
  }, [students, selectedCourse]);

  // Calculate per-student fee summary
  const getStudentFeeSummary = (studentId, courseId) => {
    const course = courses.find(c => c.id === courseId);
    const courseFee = course?.fee || 0;
    const payments = feePayments.filter(p => p.student_id === studentId && p.status === 'completed');
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paid_amount), 0);
    const totalDue = courseFee - totalPaid;
    return { courseFee, totalPaid, totalDue: Math.max(0, totalDue), payments };
  };

  // Course-level aggregate summary
  const courseSummary = useMemo(() => {
    if (!selectedCourse) return null;
    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return null;

    const courseStudents = students.filter(s => s.course_id === selectedCourse);
    let totalAmount = 0, totalPaid = 0, totalDue = 0;
    courseStudents.forEach(s => {
      const summary = getStudentFeeSummary(s.id, selectedCourse);
      totalAmount += summary.courseFee;
      totalPaid += summary.totalPaid;
      totalDue += summary.totalDue;
    });
    return { courseName: course.name, courseFee: course.fee, studentCount: courseStudents.length, totalAmount, totalPaid, totalDue };
  }, [selectedCourse, courses, students, feePayments]);

  // Calculate payment amount based on type
  const calculatePayAmount = (courseFee, dueAmount) => {
    switch (paymentType) {
      case 'full': return dueAmount;
      case 'half': return Math.min(courseFee * 0.5, dueAmount);
      case 'quarter': return Math.min(courseFee * 0.25, dueAmount);
      case 'custom': return Math.min(Number(customAmount) || 0, dueAmount);
      default: return dueAmount;
    }
  };

  const openPayModal = (student) => {
    const summary = getStudentFeeSummary(student.id, student.course_id);
    if (summary.totalDue <= 0) {
      toast.error('This student has no due fees');
      return;
    }
    setPayModal({ student, summary });
    setPaymentType('full');
    setCustomAmount('');
    setTransactionId('');
    setPaymentMethod('upi');
    setRemarks('');
  };

  const openBulkPayModal = () => {
    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }
    const unpaidStudents = filteredStudents.filter(s => {
      const summary = getStudentFeeSummary(s.id, s.course_id);
      return summary.totalDue > 0;
    });
    if (unpaidStudents.length === 0) {
      toast.error('All students have paid their fees');
      return;
    }
    setPayModal({ bulk: true, students: unpaidStudents, courseId: selectedCourse });
    setPaymentType('full');
    setCustomAmount('');
    setTransactionId('');
    setPaymentMethod('upi');
    setRemarks('');
  };

  const handlePaySubmit = async () => {
    if (!transactionId.trim()) {
      toast.error('Transaction ID is required');
      return;
    }

    setSubmitting(true);
    try {
      if (payModal.bulk) {
        // Bulk payment
        const payments = payModal.students.map(s => {
          const summary = getStudentFeeSummary(s.id, s.course_id);
          const payAmount = calculatePayAmount(summary.courseFee, summary.totalDue);
          return {
            studentId: s.id,
            courseId: s.course_id,
            franchiseId: franchise.id,
            toBePaidAmount: summary.courseFee,
            paidAmount: payAmount,
            dueAmount: summary.totalDue - payAmount,
            paymentMethod,
            transactionId,
            paymentType,
            remarks,
          };
        }).filter(p => p.paidAmount > 0);

        await api.post('/fees/bulk', { payments });
        toast.success(`${payments.length} payments recorded`);
      } else {
        // Individual payment
        const { student, summary } = payModal;
        const payAmount = calculatePayAmount(summary.courseFee, summary.totalDue);
        if (payAmount <= 0) {
          toast.error('Payment amount must be greater than 0');
          setSubmitting(false);
          return;
        }

        await api.post('/fees', {
          studentId: student.id,
          courseId: student.course_id,
          franchiseId: franchise.id,
          toBePaidAmount: summary.courseFee,
          paidAmount: payAmount,
          dueAmount: summary.totalDue - payAmount,
          paymentMethod,
          transactionId,
          paymentType,
          remarks,
        });
        toast.success('Payment recorded');
      }

      setPayModal(null);
      await refreshFees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryModal = (studentId) => {
    setHistoryModal(studentId);
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Fees Payment</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Manage student fee payments</p>
      </div>

      {/* Course Filter + Bulk Pay */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: '250px' }}>
          <select
            className="form-select"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {selectedCourse && (
          <button className="btn btn-primary" onClick={openBulkPayModal}>
            <CreditCard size={18} /> Pay Fees (Bulk)
          </button>
        )}
      </div>

      {/* Course Summary Cards */}
      {courseSummary && (
        <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><IndianRupee size={24} /></div>
            <div className="stat-value">₹{courseSummary.totalAmount.toLocaleString()}</div>
            <div className="stat-label">Total Amount ({courseSummary.studentCount} students × ₹{courseSummary.courseFee?.toLocaleString()})</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><CreditCard size={24} /></div>
            <div className="stat-value">₹{courseSummary.totalPaid.toLocaleString()}</div>
            <div className="stat-label">Total Paid</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><IndianRupee size={24} /></div>
            <div className="stat-value">₹{courseSummary.totalDue.toLocaleString()}</div>
            <div className="stat-label">Total Due</div>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Course</th>
              <th>Status</th>
              <th>Course Fee</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Payment Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(s => {
              const summary = getStudentFeeSummary(s.id, s.course_id);
              const isPaid = summary.totalDue <= 0;
              return (
                <tr key={s.id}>
                  <td>{s.users?.full_name}</td>
                  <td>{s.courses?.name}</td>
                  <td>
                    <span className={`badge badge-${s.status === 'active' ? 'success' : s.status === 'graduated' ? 'info' : 'danger'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td>₹{summary.courseFee.toLocaleString()}</td>
                  <td style={{ color: '#22c55e', fontWeight: 500 }}>₹{summary.totalPaid.toLocaleString()}</td>
                  <td style={{ color: summary.totalDue > 0 ? '#ef4444' : '#22c55e', fontWeight: 500 }}>
                    ₹{summary.totalDue.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge badge-${isPaid ? 'success' : summary.totalPaid > 0 ? 'warning' : 'danger'}`}>
                      {isPaid ? 'Paid' : summary.totalPaid > 0 ? 'Partial' : 'Unpaid'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openHistoryModal(s.id)}
                        className="btn-icon"
                        title="Payment history"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <History size={18} />
                      </button>
                      {!isPaid && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openPayModal(s)}
                        >
                          Pay Fees
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredStudents.length === 0 && <div className="empty-state"><p>No students found</p></div>}
      </div>

      {/* ──── Pay Fees Modal ──── */}
      {payModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                {payModal.bulk ? `Bulk Fee Payment (${payModal.students?.length} students)` : `Pay Fees — ${payModal.student?.users?.full_name}`}
              </h2>
              <button onClick={() => setPayModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            {/* QR Code Section */}
            {qrCodeUrl && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Scan QR Code to Pay</p>
                <img
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  style={{ maxWidth: '220px', maxHeight: '220px', margin: '0 auto', borderRadius: '0.5rem', border: '2px solid var(--gray-300)' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>After payment, enter the transaction details below</p>
              </div>
            )}

            {/* Fee Info (for individual) */}
            {!payModal.bulk && payModal.summary && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Fee</div>
                  <div style={{ fontWeight: 600 }}>₹{payModal.summary.courseFee.toLocaleString()}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Paid</div>
                  <div style={{ fontWeight: 600, color: '#22c55e' }}>₹{payModal.summary.totalPaid.toLocaleString()}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Due</div>
                  <div style={{ fontWeight: 600, color: '#ef4444' }}>₹{payModal.summary.totalDue.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Payment Type Selection */}
            <div className="form-group">
              <label className="form-label">Payment Amount</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                {[
                  { value: 'full', label: 'Full Payment' },
                  { value: 'half', label: '50%' },
                  { value: 'quarter', label: '25%' },
                  { value: 'custom', label: 'Custom' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn ${paymentType === opt.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => setPaymentType(opt.value)}
                    style={{ fontSize: '0.875rem' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentType === 'custom' && (
              <div className="form-group">
                <label className="form-label">Custom Amount (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            )}

            {/* Calculated amount display */}
            {!payModal.bulk && payModal.summary && (
              <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Amount to pay: </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                  ₹{calculatePayAmount(payModal.summary.courseFee, payModal.summary.totalDue).toLocaleString()}
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Transaction ID *</label>
              <input
                className="form-input"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter UPI/Bank transaction reference ID"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Remarks (Optional)</label>
              <input
                className="form-input"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Any additional notes"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setPayModal(null)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePaySubmit} disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── Payment History Modal ──── */}
      {historyModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '650px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Payment History</h2>
              <button onClick={() => setHistoryModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            {(() => {
              const student = students.find(s => s.id === historyModal);
              const payments = feePayments.filter(p => p.student_id === historyModal);
              const summary = student ? getStudentFeeSummary(student.id, student.course_id) : null;

              return (
                <>
                  {student && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem' }}>{student.users?.full_name}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{student.courses?.name}</div>
                    </div>
                  )}

                  {summary && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Fee</div>
                        <div style={{ fontWeight: 600 }}>₹{summary.courseFee.toLocaleString()}</div>
                      </div>
                      <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Paid</div>
                        <div style={{ fontWeight: 600, color: '#22c55e' }}>₹{summary.totalPaid.toLocaleString()}</div>
                      </div>
                      <div style={{ background: summary.totalDue > 0 ? '#fef2f2' : '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Due</div>
                        <div style={{ fontWeight: 600, color: summary.totalDue > 0 ? '#ef4444' : '#22c55e' }}>₹{summary.totalDue.toLocaleString()}</div>
                      </div>
                    </div>
                  )}

                  {payments.length > 0 ? (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>Method</th>
                            <th>Transaction ID</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map(p => (
                            <tr key={p.id}>
                              <td>{format(new Date(p.created_at), 'PP')}</td>
                              <td style={{ fontWeight: 500 }}>₹{Number(p.paid_amount).toLocaleString()}</td>
                              <td style={{ textTransform: 'capitalize' }}>{p.payment_type}</td>
                              <td style={{ textTransform: 'capitalize' }}>{p.payment_method?.replace(/_/g, ' ')}</td>
                              <td><code style={{ fontSize: '0.75rem' }}>{p.transaction_id}</code></td>
                              <td>
                                <span className={`badge badge-${p.status === 'completed' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'}`}>
                                  {p.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No payment records found.</div>
                  )}
                </>
              );
            })()}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => setHistoryModal(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FranchiseFees;
