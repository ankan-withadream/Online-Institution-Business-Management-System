import { useState } from 'react';
import { Eye, X } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';

const AdminStudents = () => {
  const { data: students, loading } = useFetch('/students');
  const [viewingStudent, setViewingStudent] = useState(null);

  return (
    <div>
      <div className="page-header"><h1>Students</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Course</th><th>Status</th><th>Enrolled</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
            <tbody>
              {students?.map(s => (
                <tr key={s.id}>
                  <td><code>{s.student_id_number}</code></td>
                  <td>{s.users?.full_name}</td>
                  <td>{s.users?.email}</td>
                  <td>{s.courses?.name}</td>
                  <td><span className={`badge badge-${s.status === 'active' ? 'success' : s.status === 'graduated' ? 'info' : 'danger'}`}>{s.status}</span></td>
                  <td>{s.enrollment_date && format(new Date(s.enrollment_date), 'PP')}</td>
                  <td>
                      <button
                        onClick={() => setViewingStudent(s)}
                        className="btn-icon"
                        title="View details"
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Eye size={18} />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!students || students.length === 0) && <div className="empty-state"><p>No students found</p></div>}
        </div>
      )}

      {viewingStudent && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '560px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Student Details</h2>
              <button onClick={() => setViewingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Student ID</div>
                  <code>{viewingStudent.student_id_number}</code>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</div>
                  <span className={`badge badge-${viewingStudent.status === 'active' ? 'success' : viewingStudent.status === 'graduated' ? 'info' : 'danger'}`}>{viewingStudent.status}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Full Name</div>
                  <div>{viewingStudent.users?.full_name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</div>
                  <div>{viewingStudent.users?.email || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Course</div>
                  <div>{viewingStudent.courses?.name || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Enrollment Date</div>
                  <div>{viewingStudent.enrollment_date ? format(new Date(viewingStudent.enrollment_date), 'PP') : '-'}</div>
                </div>
              </div>
              {viewingStudent.franchise_id && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Franchise</div>
                  <div>{viewingStudent.franchises?.organization_name || viewingStudent.franchise_id}</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button onClick={() => setViewingStudent(null)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminStudents;
