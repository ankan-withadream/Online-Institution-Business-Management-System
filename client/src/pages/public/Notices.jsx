import { Bell } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';

const Notices = () => {
  const { data: notices, loading } = useFetch('/notices');

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title">Notices & Announcements</h1>
        <p className="section-subtitle">Stay updated with the latest news from EduCare</p>

        {loading && <div className="loading-screen"><div className="spinner" /></div>}

        {notices?.map((notice) => (
          <div className="card" key={notice.id} style={{ marginBottom: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'start' }}>
                <Bell size={18} style={{ color: '#3b82f6', marginTop: 3, flexShrink: 0 }} />
                <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{notice.title}</h3>
              </div>
              <span className={`badge badge-${notice.category === 'exam' ? 'warning' : notice.category === 'result' ? 'success' : 'info'}`}>
                {notice.category}
              </span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6, marginLeft: '2rem' }}>
              {notice.content}
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.75rem', marginLeft: '2rem' }}>
              {notice.publish_date && format(new Date(notice.publish_date), 'PPP')}
            </p>
          </div>
        ))}

        {!loading && (!notices || notices.length === 0) && (
          <div className="empty-state"><p>No notices available.</p></div>
        )}
      </div>
    </div>
  );
};

export default Notices;
