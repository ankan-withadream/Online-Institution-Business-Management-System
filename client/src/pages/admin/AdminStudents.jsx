import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';

const AdminStudents = () => {
  const { data: students, loading } = useFetch('/students');

  return (
    <div>
      <div className="page-header"><h1>Students</h1></div>
      {loading ? <div className="loading-screen"><div className="spinner" /></div> : (
        <div className="card table-container">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Course</th><th>Status</th><th>Enrolled</th></tr></thead>
            <tbody>
              {students?.map(s => (
                <tr key={s.id}>
                  <td><code>{s.student_id_number}</code></td>
                  <td>{s.users?.full_name}</td>
                  <td>{s.users?.email}</td>
                  <td>{s.courses?.name}</td>
                  <td><span className={`badge badge-${s.status === 'active' ? 'success' : s.status === 'graduated' ? 'info' : 'danger'}`}>{s.status}</span></td>
                  <td>{s.enrollment_date && format(new Date(s.enrollment_date), 'PP')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!students || students.length === 0) && <div className="empty-state"><p>No students found</p></div>}
        </div>
      )}
    </div>
  );
};
export default AdminStudents;
