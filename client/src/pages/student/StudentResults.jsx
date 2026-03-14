import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const StudentResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: profile } = await api.get('/students/me');
        setStudentId(profile.id);
        const { data } = await api.get(`/results/student/${profile.id}`);
        setResults(data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>My Results</h1></div>
      <div className="card table-container">
        <table className="data-table">
          <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th><th>Status</th></tr></thead>
          <tbody>
            {results.map(r => (
              <tr key={r.id}>
                <td>{r.exams?.name}</td>
                <td>{r.subjects?.name}</td>
                <td>{r.marks_obtained}</td>
                <td>{r.subjects?.max_marks}</td>
                <td>{r.grade || '—'}</td>
                <td><span className={`badge badge-${r.is_pass ? 'success' : 'danger'}`}>{r.is_pass ? 'Pass' : 'Fail'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {results.length === 0 && <div className="empty-state"><p>No results published yet</p></div>}
      </div>
    </div>
  );
};
export default StudentResults;
