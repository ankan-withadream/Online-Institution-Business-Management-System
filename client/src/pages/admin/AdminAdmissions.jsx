import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';
import { useState } from 'react';
import api from '../../services/api';

const AdminAdmissions = () => {
  const { data: admissions, loading, refetch } = useFetch('/admissions');
  const [processing, setProcessing] = useState(null);

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
                    {a.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleStatus(a.id, 'approved')} disabled={processing === a.id}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatus(a.id, 'rejected')} disabled={processing === a.id}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!admissions || admissions.length === 0) && <div className="empty-state"><p>No admissions found</p></div>}
        </div>
      )}
    </div>
  );
};
export default AdminAdmissions;
