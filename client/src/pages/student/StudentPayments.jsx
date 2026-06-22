import { useState, useEffect } from 'react';
import { CreditCard, IndianRupee, History, QrCode, X } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentPayments = () => {
  const [fees, setFees] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Payment form state
  const [paymentType, setPaymentType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feesRes] = await Promise.all([
          api.get('/fees/me'),
        ]);
        setFees(feesRes.data);

        // Fetch QR code (silently fail if not found)
        try {
          const qrRes = await api.get('/documents/entity/system/00000000-0000-0000-0000-000000000001');
          const qrDoc = qrRes.data?.find(d => d.document_type === 'payment_qr');
          if (qrDoc) setQrCodeUrl(qrDoc.previewUrl || qrDoc.downloadUrl);
        } catch {}
      } catch (err) {
        console.error('Failed to load fee data', err);
        toast.error('Failed to load payment information');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshFees = async () => {
    try {
      const { data } = await api.get('/fees/me');
      setFees(data);
    } catch {
      toast.error('Failed to refresh payment data');
    }
  };

  const calculatePayAmount = (courseFee, dueAmount) => {
    switch (paymentType) {
      case 'full': return dueAmount;
      case 'half': return Math.min(dueAmount * 0.5, dueAmount);
      case 'quarter': return Math.min(dueAmount * 0.25, dueAmount);
      case 'custom': return Math.min(Number(customAmount) || 0, dueAmount);
      default: return dueAmount;
    }
  };

  const openPayModal = () => {
    if (fees.totalDue <= 0) {
      toast.error('You have no pending dues');
      return;
    }
    setPayModal(true);
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

    const payAmount = calculatePayAmount(fees.student.courseFee, fees.totalDue);
    if (payAmount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/fees/me', {
        paidAmount: payAmount,
        paymentMethod,
        transactionId: transactionId.trim(),
        paymentType,
        remarks: remarks.trim() || null,
      });
      toast.success('Payment recorded successfully');
      setPayModal(false);
      await refreshFees();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Payments</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>View your fee details and make payments</p>
      </div>

      {/* Course Info */}
      {fees?.student && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <strong>{fees.student.courseName}</strong>
            {fees.student.session && (
              <span style={{ marginLeft: '0.75rem', color: '#6b7280', fontSize: '0.875rem' }}>
                {fees.student.session.session_type} ({fees.student.session.start_date || 'TBA'} - {fees.student.session.end_date || 'TBA'})
              </span>
            )}
          </div>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Course Fee: <strong style={{ color: 'var(--primary-600)' }}>₹{Number(fees.student.courseFee).toLocaleString()}</strong>
          </span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><IndianRupee size={24} /></div>
          <div className="stat-value">₹{Number(fees?.student?.courseFee || 0).toLocaleString()}</div>
          <div className="stat-label">Course Fee</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><CreditCard size={24} /></div>
          <div className="stat-value">₹{Number(fees?.totalPaid || 0).toLocaleString()}</div>
          <div className="stat-label">Total Paid</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: fees?.totalDue > 0 ? '#fef2f2' : '#f0fdf4', color: fees?.totalDue > 0 ? '#ef4444' : '#22c55e' }}><IndianRupee size={24} /></div>
          <div className="stat-value">₹{Number(fees?.totalDue || 0).toLocaleString()}</div>
          <div className="stat-label">Due Amount</div>
        </div>
      </div>

      {/* Pay Button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={openPayModal} disabled={fees?.totalDue <= 0}>
          <CreditCard size={18} /> Pay Now
        </button>
      </div>

      {/* Payment History */}
      <div className="card table-container">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, padding: '1rem 1.5rem', borderBottom: '1px solid var(--gray-200)', margin: 0 }}>
          <History size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Payment History
        </h3>
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
            {fees?.payments?.map(p => (
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
        {(!fees?.payments || fees.payments.length === 0) && (
          <div className="empty-state"><p>No payment records found.</p></div>
        )}
      </div>

      {/* ──── Pay Modal ──── */}
      {payModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Make Payment</h2>
              <button onClick={() => setPayModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            {/* QR Code */}
            {qrCodeUrl && (
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  <QrCode size={16} style={{ marginRight: '0.375rem', verticalAlign: 'middle' }} />
                  Scan to Pay
                </p>
                <img
                  src={qrCodeUrl}
                  alt="Payment QR Code"
                  style={{ maxWidth: '220px', maxHeight: '220px', margin: '0 auto', borderRadius: '0.5rem', border: '2px solid var(--gray-300)' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.75rem' }}>After payment, enter the transaction details below</p>
              </div>
            )}

            {/* Fee Summary */}
            {fees && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--gray-50)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course Fee</div>
                  <div style={{ fontWeight: 600 }}>₹{Number(fees.student.courseFee).toLocaleString()}</div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Paid</div>
                  <div style={{ fontWeight: 600, color: '#22c55e' }}>₹{Number(fees.totalPaid).toLocaleString()}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Due</div>
                  <div style={{ fontWeight: 600, color: '#ef4444' }}>₹{Number(fees.totalDue).toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Payment Type */}
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
                  max={fees?.totalDue || 0}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            )}

            {/* Amount Display */}
            {fees && (
              <div style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Amount to pay: </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                  ₹{calculatePayAmount(fees.student.courseFee, fees.totalDue).toLocaleString()}
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
              <button className="btn btn-secondary" onClick={() => setPayModal(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePaySubmit} disabled={submitting}>
                {submitting ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPayments;
