import { useState, useEffect } from 'react';
import { QrCode, X, Upload, Plus } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import toast from 'react-hot-toast';

const AdminPayments = () => {
  const { data: feePayments, loading: paymentsLoading, refetch: refetchPayments } = useFetch('/fees');
  const { data: franchises } = useFetch('/franchises');
  const { data: courses } = useFetch('/courses');
  const { data: students } = useFetch('/students');

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);

  // Pay Modal State
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentType, setPaymentType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submittingPay, setSubmittingPay] = useState(false);
  const [qrDocument, setQrDocument] = useState(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchQrCode = async () => {
    setLoadingQr(true);
    try {
      const res = await api.get('/documents/entity/system/00000000-0000-0000-0000-000000000001');
      // Sort to get the latest one if multiple exist, though ideally there's only one
      const qrDocs = res.data?.filter(d => d.document_type === 'payment_qr') || [];
      if (qrDocs.length > 0) {
        setQrDocument(qrDocs[0]);
      } else {
        setQrDocument(null);
      }
    } catch (err) {
      console.error('Failed to fetch QR Code', err);
    } finally {
      setLoadingQr(false);
    }
  };

  useEffect(() => {
    fetchQrCode();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadQr = async () => {
    if (!selectedFile) {
      toast.error('Please select an image file first.');
      return;
    }

    setUploading(true);
    try {
      // First delete the old QR code if it exists to avoid clutter
      if (qrDocument) {
        try {
          await api.delete(`/documents/${qrDocument.id}`);
        } catch (err) {
          console.error('Failed to delete old QR code', err);
        }
      }

      // Upload the new one
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', 'system');
      formData.append('entityId', '00000000-0000-0000-0000-000000000001');
      formData.append('documentType', 'payment_qr');

      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Payment QR Code updated successfully');
      setSelectedFile(null);
      await fetchQrCode();
      setQrModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update QR Code');
    } finally {
      setUploading(false);
    }
  };

  const filteredStudents = selectedFranchiseId ? students?.filter(s => s.franchise_id === selectedFranchiseId) : [];
  const selectedStudent = students?.find(s => s.id === selectedStudentId);
  const studentCourse = selectedStudent ? courses?.find(c => c.id === selectedStudent.course_id) : null;
  const courseFee = studentCourse?.fee || 0;
  const studentPayments = feePayments?.filter(p => p.student_id === selectedStudentId && p.status === 'completed') || [];
  const totalPaid = studentPayments.reduce((sum, p) => sum + Number(p.paid_amount), 0);
  const totalDue = Math.max(0, courseFee - totalPaid);

  const calculatePayAmount = (courseFee, dueAmount) => {
    switch (paymentType) {
      case 'full': return dueAmount;
      case 'half': return Math.min(courseFee * 0.5, dueAmount);
      case 'quarter': return Math.min(courseFee * 0.25, dueAmount);
      case 'custom': return Math.min(Number(customAmount) || 0, dueAmount);
      default: return dueAmount;
    }
  };

  const handlePaySubmit = async () => {
    if (!selectedStudentId) return toast.error('Please select a student');
    if (!transactionId.trim()) return toast.error('Transaction ID is required');

    const payAmount = calculatePayAmount(courseFee, totalDue);
    if (payAmount <= 0) return toast.error('Payment amount must be greater than 0');

    setSubmittingPay(true);
    try {
      await api.post('/fees', {
        studentId: selectedStudentId,
        courseId: selectedStudent.course_id,
        franchiseId: selectedFranchiseId,
        toBePaidAmount: courseFee,
        paidAmount: payAmount,
        dueAmount: totalDue - payAmount,
        paymentMethod,
        transactionId,
        paymentType,
        remarks,
      });
      toast.success('Payment recorded successfully');
      setPayModalOpen(false);
      
      // Reset form
      setSelectedStudentId('');
      setTransactionId('');
      setRemarks('');
      setCustomAmount('');
      setPaymentType('full');
      
      refetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setSubmittingPay(false);
    }
  };

  if (paymentsLoading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Payments</h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>View all fee payments across all franchises</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setQrModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={18} /> Update QR Code
          </button>
          <button className="btn btn-primary" onClick={() => setPayModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Record Payment
          </button>
        </div>
      </div>

      <div className="card table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Course</th>
              <th>Franchise</th>
              <th>Amount</th>
              <th>Type</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {feePayments?.map(p => (
              <tr key={p.id}>
                <td>{format(new Date(p.created_at), 'PP')}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.students?.users?.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{p.students?.student_id_number}</div>
                </td>
                <td>{p.courses?.name}</td>
                <td>{p.franchises?.organization_name || '-'}</td>
                <td style={{ fontWeight: 500, color: '#22c55e' }}>₹{Number(p.paid_amount).toLocaleString()}</td>
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
        {(!feePayments || feePayments.length === 0) && (
          <div className="empty-state"><p>No payment records found.</p></div>
        )}
      </div>

      {qrModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Payment QR Code</h2>
              <button onClick={() => { setQrModalOpen(false); setSelectedFile(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            {loadingQr ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading current QR code...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {qrDocument ? (
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Current QR Code</p>
                    <img 
                      src={qrDocument.previewUrl || qrDocument.downloadUrl} 
                      alt="Current QR Code" 
                      style={{ maxWidth: '200px', maxHeight: '200px', margin: '0 auto', borderRadius: '0.375rem', border: '2px solid var(--gray-300)' }} 
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--gray-50)', borderRadius: '0.5rem', border: '1px solid var(--gray-200)', color: '#6b7280', fontSize: '0.875rem' }}>
                    No QR code currently set.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Upload New QR Code Image</label>
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleFileChange}
                    className="form-input"
                    style={{ padding: '0.5rem' }}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Supported formats: JPEG, PNG, WEBP (Max 5MB)
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => { setQrModalOpen(false); setSelectedFile(null); }} disabled={uploading}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleUploadQr} disabled={!selectedFile || uploading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Upload size={16} />
                    {uploading ? 'Uploading...' : 'Save QR Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {payModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Record Manual Payment</h2>
              <button onClick={() => setPayModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Franchise</label>
              <select 
                className="form-select" 
                value={selectedFranchiseId} 
                onChange={(e) => {
                  setSelectedFranchiseId(e.target.value);
                  setSelectedStudentId('');
                }}
              >
                <option value="">Select Franchise...</option>
                {franchises?.map(f => (
                  <option key={f.id} value={f.id}>{f.organization_name}</option>
                ))}
              </select>
            </div>

            {selectedFranchiseId && (
              <div className="form-group">
                <label className="form-label">Student</label>
                <select 
                  className="form-select" 
                  value={selectedStudentId} 
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="">Select Student...</option>
                  {filteredStudents?.map(s => (
                    <option key={s.id} value={s.id}>{s.users?.full_name} ({s.student_id_number})</option>
                  ))}
                </select>
              </div>
            )}

            {selectedStudentId && studentCourse && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
                  <div style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course Fee</div>
                    <div style={{ fontWeight: 600 }}>₹{courseFee.toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total Paid</div>
                    <div style={{ fontWeight: 600, color: '#22c55e' }}>₹{totalPaid.toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Due</div>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>₹{totalDue.toLocaleString()}</div>
                  </div>
                </div>

                {totalDue > 0 ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Payment Amount</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem' }}>
                        {[
                          { value: 'full', label: 'Full' },
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
                          max={totalDue}
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount"
                        />
                      </div>
                    )}

                    <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Amount to pay: </span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                        ₹{calculatePayAmount(courseFee, totalDue).toLocaleString()}
                      </span>
                    </div>

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
                        placeholder="Enter transaction reference"
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
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f0fdf4', color: '#166534', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                    This student has no pending fee dues.
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setPayModalOpen(false)} disabled={submittingPay}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handlePaySubmit} 
                disabled={submittingPay || !selectedStudentId || totalDue <= 0}
              >
                {submittingPay ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
