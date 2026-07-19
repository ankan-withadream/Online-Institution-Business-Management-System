import { useFetch } from '../../hooks/useFetch';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building2, Users } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import { setResourceUrl } from '../../resourceUrlOverrides';

const FranchiseDashboard = () => {
  const { data: franchise, loading: loadingFranchise } = useFetch('/franchises/me');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!franchise) return;
    setResourceUrl('students', `/franchises/${franchise.id}/students`);
    api.get(`/franchises/${franchise.id}/students`).then(({ data }) => {
      setStudents(data?.data || []);
      setLoading(false);
    });
  }, [franchise]);

  if (loadingFranchise || loading) return <div className="loading-screen"><div className="spinner" /></div>;

  const columns = [
    { source: 'users.full_name', label: 'Name' },
    { source: 'users.email', label: 'Email' },
    { source: 'courses.name', label: 'Course' },
    {
      source: 'status',
      label: 'Status',
      render: (v) => <span className={`badge badge-${v === 'active' ? 'success' : 'neutral'}`}>{v}</span>,
    },
  ];

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
        <DataTable
          resource="students"
          columns={columns}
          emptyMessage="No students registered yet"
        />
      </div>
    </div>
  );
};

export default FranchiseDashboard;