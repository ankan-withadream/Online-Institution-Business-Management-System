import { useFetch } from '../../hooks/useFetch';
import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import api from '../../services/api';

const AdminFranchises = () => {
  const { data: franchises, loading, refetch } = useFetch('/franchises');
  const [processing, setProcessing] = useState(null);
  const [viewingFranchise, setViewingFranchise] = useState(null);

  const handleStatus = async (id, status) => {
    setProcessing(id);
    try {
      await api.patch(`/franchises/${id}/status`, { status });
      refetch();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
    setProcessing(null);
  };

  return (
    <div>
      <div className="page-header"><h1>Franchises</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>Organization</th><th>Contact</th><th>City</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {franchises?.map(f => (
                <tr key={f.id}>
                  <td>{f.organization_name}</td>
                  <td>{f.contact_person}<br/><span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{f.email}</span></td>
                  <td>{f.city}, {f.state}</td>
                  <td><span className={`badge badge-${f.status === 'approved' ? 'success' : f.status === 'rejected' ? 'danger' : 'warning'}`}>{f.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button
                        onClick={() => setViewingFranchise(f)}
                        className="btn-icon"
                        title="View details"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Eye size={18} />
                      </button>
                      {f.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatus(f.id, 'approved')} disabled={processing === f.id}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleStatus(f.id, 'rejected')} disabled={processing === f.id}>Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!franchises || franchises.length === 0) && <div className="empty-state"><p>No franchise applications</p></div>}
        </div>
      )}

      {viewingFranchise && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Franchise Details</h2>
              <button onClick={() => setViewingFranchise(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Organization</div>
                  <div style={{ fontWeight: 500 }}>{viewingFranchise.organization_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${viewingFranchise.status === 'approved' ? 'success' : viewingFranchise.status === 'rejected' ? 'danger' : 'warning'}`}>{viewingFranchise.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Contact Person</div>
                  <div>{viewingFranchise.contact_person || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</div>
                  <div>{viewingFranchise.email || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone</div>
                  <div>{viewingFranchise.phone || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>City / State</div>
                  <div>{[viewingFranchise.city, viewingFranchise.state].filter(Boolean).join(', ') || '-'}</div>
                </div>
              </div>
              {viewingFranchise.address && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Address</div>
                  <div>{viewingFranchise.address}</div>
                </div>
              )}
              {viewingFranchise.pincode && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Pincode</div>
                  <div>{viewingFranchise.pincode}</div>
                </div>
              )}
              {viewingFranchise.message && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Message</div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{viewingFranchise.message}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => setViewingFranchise(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminFranchises;
