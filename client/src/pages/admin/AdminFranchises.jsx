import { useFetch } from '../../hooks/useFetch';
import { useState } from 'react';
import api from '../../services/api';

const AdminFranchises = () => {
  const { data: franchises, loading, refetch } = useFetch('/franchises');
  const [processing, setProcessing] = useState(null);

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
                    {f.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleStatus(f.id, 'approved')} disabled={processing === f.id}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatus(f.id, 'rejected')} disabled={processing === f.id}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!franchises || franchises.length === 0) && <div className="empty-state"><p>No franchise applications</p></div>}
        </div>
      )}
    </div>
  );
};
export default AdminFranchises;
