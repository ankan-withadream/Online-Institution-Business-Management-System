import { Users, FileText, Building2, ClipboardList, Bell, TrendingUp } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const { data: stats, loading } = useFetch('/admin/stats');

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Total Students', value: stats?.totalStudents, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Pending Admissions', value: stats?.pendingAdmissions, icon: FileText, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Franchise Requests', value: stats?.pendingFranchises, icon: Building2, color: '#8b5cf6', bg: '#f5f3ff' },
          { label: 'Scheduled Exams', value: stats?.scheduledExams, icon: ClipboardList, color: '#22c55e', bg: '#dcfce7' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg, color }}><Icon size={24} /></div>
            <div className="stat-value">{value ?? 0}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} /> Recent Admissions
          </h3>
          {stats?.recentAdmissions?.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Course</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {stats.recentAdmissions.map(a => (
                    <tr key={a.id}>
                      <td>{a.full_name}</td>
                      <td>{a.courses?.name}</td>
                      <td><span className={`badge badge-${a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'danger' : 'warning'}`}>{a.status}</span></td>
                      <td>{format(new Date(a.created_at), 'PP')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p style={{ color: '#9ca3af' }}>No recent admissions</p>}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} /> Recent Notices
          </h3>
          {stats?.recentNotices?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentNotices.map(n => (
                <div key={n.id} style={{ padding: '0.75rem', background: '#f9fafb', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{n.title}</p>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{format(new Date(n.created_at), 'PP')}</p>
                  </div>
                  <span className={`badge badge-${n.category === 'exam' ? 'warning' : 'info'}`}>{n.category}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#9ca3af' }}>No recent notices</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
