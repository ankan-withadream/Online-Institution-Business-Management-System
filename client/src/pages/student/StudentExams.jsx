import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';

const StudentExams = () => {
  const { data: exams, loading } = useFetch('/exams');
  return (
    <div>
      <div className="page-header"><h1>My Exams</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>Exam</th><th>Date</th><th>Time</th><th>Total Marks</th><th>Status</th></tr></thead>
            <tbody>
              {exams?.map(e => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.exam_date && format(new Date(e.exam_date), 'PP')}</td>
                  <td>{e.start_time} – {e.end_time}</td>
                  <td>{e.total_marks}</td>
                  <td><span className={`badge badge-${e.status === 'completed' ? 'success' : 'info'}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!exams || exams.length === 0) && <div className="empty-state"><p>No exams scheduled</p></div>}
        </div>
      )}
    </div>
  );
};
export default StudentExams;
