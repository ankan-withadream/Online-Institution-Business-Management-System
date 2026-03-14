import { useState, useEffect } from 'react';
import api from '../../services/api';

const StudentCertificates = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: profile } = await api.get('/students/me');
        const { data } = await api.get(`/certificates/student/${profile.id}`);
        setCerts(data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const handleDownload = async (id) => {
    try {
      const { data } = await api.get(`/certificates/${id}/download`);
      window.open(data.downloadUrl, '_blank');
    } catch {
      alert('Download failed');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>My Certificates</h1></div>
      <div className="card table-container">
        <table className="data-table">
          <thead><tr><th>Certificate #</th><th>Course</th><th>Issue Date</th><th>Action</th></tr></thead>
          <tbody>
            {certs.map(c => (
              <tr key={c.id}>
                <td><code>{c.certificate_number}</code></td>
                <td>{c.courses?.name}</td>
                <td>{c.issue_date}</td>
                <td>
                  <button className="btn btn-primary btn-sm" onClick={() => handleDownload(c.id)}>Download</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {certs.length === 0 && <div className="empty-state"><p>No certificates issued yet</p></div>}
      </div>
    </div>
  );
};
export default StudentCertificates;
