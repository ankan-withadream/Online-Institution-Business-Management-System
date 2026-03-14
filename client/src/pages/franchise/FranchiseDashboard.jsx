import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building2, Users } from 'lucide-react';

const FranchiseDashboard = () => {
  const { user } = useAuth();
  const [franchise, setFranchise] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: franchises } = await api.get('/franchises');
        const myFranchise = franchises?.[0];
        if (myFranchise) {
          setFranchise(myFranchise);
          const { data } = await api.get(`/franchises/${myFranchise.id}/students`);
          setStudents(data);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Franchise Dashboard</h1></div>

      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><Building2 size={24} /></div>
          <div className="stat-value">{franchise?.organization_name || '—'}</div>
          <div className="stat-label">Organization</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><Users size={24} /></div>
          <div className="stat-value">{students.length}</div>
          <div className="stat-label">Students Registered</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Students Under Your Franchise</h3>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Course</th><th>Status</th></tr></thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.users?.full_name}</td>
                  <td>{s.users?.email}</td>
                  <td>{s.courses?.name}</td>
                  <td><span className={`badge badge-${s.status === 'active' ? 'success' : 'neutral'}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {students.length === 0 && <div className="empty-state"><p>No students registered yet</p></div>}
        </div>
      </div>
    </div>
  );
};
export default FranchiseDashboard;
