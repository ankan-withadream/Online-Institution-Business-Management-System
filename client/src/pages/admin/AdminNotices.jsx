import { useFetch } from '../../hooks/useFetch';

const AdminNotices = () => {
  const { data: notices, loading } = useFetch('/notices');
  return (
    <div>
      <div className="page-header"><h1>Notices</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card">
          {notices?.map(n => (
            <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontWeight: 600 }}>{n.title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>{n.content?.substring(0, 100)}...</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge badge-${n.is_published ? 'success' : 'neutral'}`}>{n.is_published ? 'Published' : 'Draft'}</span>
                <span className={`badge badge-${n.category === 'exam' ? 'warning' : 'info'}`}>{n.category}</span>
              </div>
            </div>
          ))}
          {(!notices || notices.length === 0) && <div className="empty-state"><p>No notices found</p></div>}
        </div>
      )}
    </div>
  );
};
export default AdminNotices;
