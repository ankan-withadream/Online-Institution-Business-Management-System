import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';

const AdminExams = () => {
  const { data: exams, loading } = useFetch('/exams');
  return (
    <div>
      <div className="page-header"><h1>Examinations</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>Exam</th><th>Course</th><th>Date</th><th>Total Marks</th><th>Status</th></tr></thead>
            <tbody>
              {exams?.map(e => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.courses?.name}</td>
                  <td>{e.exam_date && format(new Date(e.exam_date), 'PP')}</td>
                  <td>{e.total_marks}</td>
                  <td><span className={`badge badge-${e.status === 'completed' ? 'success' : e.status === 'scheduled' ? 'info' : 'warning'}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!exams || exams.length === 0) && <div className="empty-state"><p>No exams found</p></div>}
        </div>
      )}
    </div>
  );
};
export default AdminExams;
