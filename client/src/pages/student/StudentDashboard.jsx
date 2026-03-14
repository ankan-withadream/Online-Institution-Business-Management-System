import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, BookOpen, Award, Bell } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { data: profile, loading } = useFetch('/students/me');

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.fullName} 👋</h1>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><GraduationCap size={24} /></div>
          <div className="stat-value">{profile?.student_id_number || '—'}</div>
          <div className="stat-label">Student ID</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><BookOpen size={24} /></div>
          <div className="stat-value">{profile?.courses?.name || '—'}</div>
          <div className="stat-label">Enrolled Course</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#22c55e' }}><Award size={24} /></div>
          <div className="stat-value">{profile?.status || '—'}</div>
          <div className="stat-label">Status</div>
        </div>
      </div>

      {profile?.courses && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} /> Course Details
          </h3>
          <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{profile.courses.description}</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
            Duration: {profile.courses.duration_months} months
          </p>
        </div>
      )}
    </div>
  );
};
export default StudentDashboard;
