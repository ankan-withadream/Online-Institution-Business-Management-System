import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';
import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import api from '../../services/api';

const AdminAdmissions = () => {
  const { data: admissions, loading, refetch } = useFetch('/admissions');
  const [processing, setProcessing] = useState(null);
  const [viewingAdmission, setViewingAdmission] = useState(null);

  const handleStatus = async (id, status) => {
    setProcessing(id);
    try {
      await api.patch(`/admissions/${id}/status`, { status });
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
    setProcessing(null);
  };

  return (
    <div>
      <div className="page-header"><h1>Admissions</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Course</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {admissions?.map(a => (
                <tr key={a.id}>
                  <td>{a.full_name}</td>
                  <td>{a.email}</td>
                  <td>{a.courses?.name}</td>
                  <td><span className={`badge badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}`}>{a.status}</span></td>
                  <td>{format(new Date(a.created_at), 'PP')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setViewingAdmission(a)}
                        className="btn-icon"
                        title="View details"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Eye size={18} />
                      </button>
                      {a.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatus(a.id, 'approved')} disabled={processing === a.id}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleStatus(a.id, 'rejected')} disabled={processing === a.id}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!admissions || admissions.length === 0) && <div className="empty-state"><p>No admissions found</p></div>}
        </div>
      )}

      {viewingAdmission && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Admission Details</h2>
              <button onClick={() => setViewingAdmission(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Full Name</div>
                  <div>{viewingAdmission.full_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${viewingAdmission.status === 'approved' ? 'success' : viewingAdmission.status === 'rejected' ? 'danger' : 'warning'}`}>{viewingAdmission.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</div>
                  <div>{viewingAdmission.email || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone</div>
                  <div>{viewingAdmission.phone || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course Applied</div>
                  <div>{viewingAdmission.courses?.name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date Applied</div>
                  <div>{format(new Date(viewingAdmission.created_at), 'PPP')}</div>
                </div>
              </div>
              {viewingAdmission.date_of_birth && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Date of Birth</div>
                  <div>{format(new Date(viewingAdmission.date_of_birth), 'PP')}</div>
                </div>
              )}
              {viewingAdmission.address && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Address</div>
                  <div>{viewingAdmission.address}</div>
                </div>
              )}
              {viewingAdmission.message && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Message</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{viewingAdmission.message}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => setViewingAdmission(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminAdmissions;
