import { useFetch } from '../../hooks/useFetch';
import DataTable from '../../components/ui/DataTable';

const StudentResults = () => {
  const { data: profile } = useFetch('/students/me');
  const studentId = profile?.id;
  const url = studentId ? `/results/student/${studentId}` : null;

  const columns = [
    { source: 'exams.name', label: 'Exam' },
    { source: 'subjects.name', label: 'Subject' },
    { source: 'marks_obtained', label: 'Marks', sortable: true, render: (v, r) => `${v} / ${r.subjects?.max_marks ?? '-'}` },
    { source: 'grade', label: 'Grade', render: (v) => v || '—' },
    { source: 'is_pass', label: 'Status', render: (v) => <span className={`badge badge-${v ? 'success' : 'danger'}`}>{v ? 'Pass' : 'Fail'}</span> },
  ];

  return (
    <div>
      <div className="page-header"><h1>My Results</h1></div>
      {studentId && (
        <DataTable
          resource="results"
          columns={columns}
          url={url}
          emptyMessage="No results published yet"
          defaultSort={{ field: 'created_at', order: 'DESC' }}
        />
      )}
    </div>
  );
};

export default StudentResults;