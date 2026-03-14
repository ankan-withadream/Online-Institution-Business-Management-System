import { useFetch } from '../../hooks/useFetch';

const StudentProfile = () => {
  const { data: profile, loading } = useFetch('/students/me');
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!profile) return <div className="empty-state"><p>Profile not found</p></div>;

  const rows = [
    ['Student ID', profile.student_id_number],
    ['Course', profile.courses?.name],
    ['Date of Birth', profile.date_of_birth],
    ['Gender', profile.gender],
    ['Phone', profile.phone],
    ['Address', `${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`],
    ['Enrollment Date', profile.enrollment_date],
    ['Status', profile.status],
  ];

  return (
    <div>
      <div className="page-header"><h1>My Profile</h1></div>
      <div className="card" style={{ maxWidth: 600 }}>
        {rows.map(([label, val]) => (
          <div key={label} style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6' }}>
            <span style={{ width: 160, fontWeight: 500, color: '#6b7280', fontSize: '0.875rem' }}>{label}</span>
            <span style={{ flex: 1, fontWeight: 500, fontSize: '0.875rem' }}>{val || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
export default StudentProfile;
