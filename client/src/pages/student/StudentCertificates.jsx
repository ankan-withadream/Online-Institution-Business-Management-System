import { useFetch } from '../../hooks/useFetch';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StudentCertificates = () => {
  const { data: profile } = useFetch('/students/me');
  const studentId = profile?.id;
  const url = studentId ? `/certificates/student/${studentId}` : null;

  const handleDownload = async (cert) => {
    try {
      const { data } = await api.get(`/certificates/${cert.id}/download`);
      window.open(data.downloadUrl, '_blank');
    } catch {
      toast.error('Download failed');
    }
  };

  const columns = [
    { source: 'certificate_number', label: 'Certificate #', render: (v) => <code>{v}</code> },
    { source: 'courses.name', label: 'Course' },
    { source: 'issue_date', label: 'Issue Date', sortable: true, render: (v) => (v ? format(new Date(v), 'PP') : '-') },
  ];

  return (
    <div>
      <div className="page-header"><h1>My Certificates</h1></div>
      {studentId && (
        <DataTable
          resource="certificates"
          columns={columns}
          url={url}
          emptyMessage="No certificates issued yet"
          rowActions={(cert) => (
            <button className="btn btn-primary btn-sm" onClick={() => handleDownload(cert)}>
              <Download size={14} /> Download
            </button>
          )}
        />
      )}
    </div>
  );
};

export default StudentCertificates;