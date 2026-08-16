import { useState } from 'react';
import { Award, Download, FileText, X, FileBadge } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import CertificateTemplate from '../../components/pdf/CertificateTemplate';
import MigrationCertificateTemplate from '../../components/pdf/MigrationCertificateTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DataTable from '../../components/ui/DataTable';
import { useListContext } from 'ra-core';

const AdminCertificates = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [generatedCert, setGeneratedCert] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateMode, setTemplateMode] = useState('certificate');
  const [refreshKey, setRefreshKey] = useState(0);

  // Courses for modal dropdown — admin/all returns an envelope, unwrap it
  const { data: coursesEnvelope, loading: coursesLoading } = useFetch('/courses/admin/all');
  const courses = coursesEnvelope?.data || [];

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedSession('');
  };

  const handleGenerateClick = async (student) => {
    setSelectedStudent(student);
    setTemplateMode('certificate');
    setIsGenerating(true);
    setIsModalOpen(true);
    try {
      const payload = {
        studentId: student.id,
        courseId: selectedCourse,
        issueDate: new Date().toISOString().split('T')[0],
        fileUrl: ''
      };
      const response = await api.post('/certificates', payload);
      setGeneratedCert(response.data);
      if (response.data.isExisting) {
        toast.success('Retrieved existing certificate');
      } else {
        toast.success('Certificate generated successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process certificate');
      setIsModalOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setGeneratedCert(null);
  };

  const handleGenerateMigration = async (student) => {
    setIsGenerating(true);
    setSelectedStudent(student);
    try {
      const [{ data: existing }, photoRes] = await Promise.all([
        api.get(`/certificates/student/${student.id}`),
        api.get(`/students/${student.id}/photo`).catch(() => ({ data: { photoUrl: null } })),
      ]);
      const match = (existing || []).find(c => c.course_id === selectedCourse);
      if (!match) {
        toast.error('Please generate the certificate first before creating a migration certificate.');
        setSelectedStudent(null);
        return;
      }
      setGeneratedCert({
        ...match,
        photoUrl: photoRes?.data?.photoUrl ?? null,
        issuerName: courseDetails?.name || 'Vivekananda Education & Health Training Institute',
      });
      setTemplateMode('migration');
      setIsModalOpen(true);
      toast.success('Migration certificate ready for preview');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch certificate');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkGenerate = async (ids, mode) => {
    if (!ids.length) return;
    setIsGenerating(true);
    setTemplateMode(mode);
    try {
      const results = [];
      for (const studentId of ids) {
        const student = await api.get(`/students/${studentId}`).then(r => r.data);
        if (mode === 'certificate') {
          const response = await api.post('/certificates', {
            studentId,
            courseId: selectedCourse,
            issueDate: new Date().toISOString().split('T')[0],
            fileUrl: ''
          });
          results.push({
            studentName: student.users?.full_name,
            courseName: courseDetails?.name,
            issueDate: response.data.issue_date,
            certificateCode: response.data.certificate_number,
            fatherName: student.father_name,
            studentIdNumber: student.student_id_number,
            photoUrl: response.data.photoUrl,
          });
        } else {
          const [{ data: existing }, photoRes] = await Promise.all([
            api.get(`/certificates/student/${studentId}`),
            api.get(`/students/${studentId}/photo`).catch(() => ({ data: { photoUrl: null } })),
          ]);
          const match = (existing || []).find(c => c.course_id === selectedCourse);
          if (!match) continue;
          results.push({
            studentName: student.users?.full_name,
            courseName: courseDetails?.name,
            issueDate: match.issue_date,
            certificateCode: match.certificate_number,
            fatherName: student.father_name,
            studentIdNumber: student.student_id_number,
            issuerName: courseDetails?.name || 'Vivekananda Education & Health Training Institute',
            photoUrl: photoRes?.data?.photoUrl ?? null,
          });
        }
      }
      if (results.length === 0) {
        toast.error('No certificates generated (students may not have existing certificates for migration).');
        return;
      }
      setGeneratedCert(results);
      setSelectedStudent(null);
      setIsModalOpen(true);
      toast.success(`Generated ${results.length} ${mode} certificate(s)`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const courseDetails = courses?.find(c => c.id === selectedCourse);

  const isBulk = Array.isArray(generatedCert);
  const templateProps = isBulk
    ? { certificates: generatedCert }
    : {
        studentName: selectedStudent?.users?.full_name || 'Student Name',
        courseName: courseDetails?.name || 'Course Name',
        issueDate: generatedCert?.issue_date,
        certificateCode: generatedCert?.certificate_number,
        fatherName: selectedStudent?.father_name,
        studentIdNumber: selectedStudent?.student_id_number,
        photoUrl: generatedCert?.photoUrl,
      };

  const fileName = isBulk
    ? `Bulk_${templateMode === 'migration' ? 'Migration_' : ''}Certificates_${courseDetails?.name?.replace(/\s+/g, '_') || 'course'}.pdf`
    : templateMode === 'migration'
      ? `Migration_${selectedStudent?.student_id_number || '000'}.pdf`
      : `Certificate_${selectedStudent?.student_id_number || '000'}.pdf`;

  const TemplateComponent = templateMode === 'migration' ? MigrationCertificateTemplate : CertificateTemplate;
  const templateDocument = <TemplateComponent {...templateProps} />;

  const columns = [
    { source: 'users.full_name', label: 'Student Name', sortable: true },
    { source: 'student_id_number', label: 'Student ID', sortable: true, render: (v) => <code>{v}</code> },
    { source: 'users.email', label: 'Email' },
    { source: 'enrollment_date', label: 'Enrolled', sortable: true, render: (v) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      source: 'status',
      label: 'Status',
      sortable: true,
      render: (v) => <span className={`badge badge-${v === 'active' ? 'success' : v === 'graduated' ? 'info' : 'danger'}`}>{v}</span>,
    },
  ];

  // DataTable passes params as filter to useListController; dataProvider
  // translates bare column names into filter[col] query params for the API.
  const params = {};
  if (selectedCourse) params['course_id'] = selectedCourse;
  if (selectedSession) params['session_id'] = selectedSession;

  return (
    <div className="admin-certificates">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Certificate Management</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
          Generate and issue certificates to students who have completed their courses.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', maxWidth: '800px' }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
            <label className="form-label">Select Course</label>
            <select value={selectedCourse} onChange={handleCourseChange} className="form-input" disabled={coursesLoading}>
              <option value="">-- Select Course --</option>
              {courses && courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
          {selectedCourse && (
            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label className="form-label">Select Session (Optional)</label>
              <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="form-input">
                <option value="">-- All Sessions --</option>
                {courses?.find(c => c.id === selectedCourse)?.sessions?.map(s => (
                  <option key={s.id} value={s.id}>{s.session_type} ({s.start_date || 'TBA'} to {s.end_date || 'TBA'})</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {selectedCourse && (
        <DataTable
          key={refreshKey}
          resource="students"
          columns={columns}
          params={params}
          emptyMessage="No students found for this course."
          filters={[
            {
              source: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'graduated', label: 'Graduated' },
                { value: 'suspended', label: 'Suspended' },
              ],
            },
          ]}
          bulkActions={
            <CertBulkActions
              onGenerate={(ids) => handleBulkGenerate(ids, 'certificate')}
              onGenerateMigration={(ids) => handleBulkGenerate(ids, 'migration')}
              disabled={!selectedCourse}
            />
          }
          rowActions={(student) => (
            <>
              <button onClick={() => handleGenerateClick(student)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <Award size={16} /> Generate
              </button>
              <button onClick={() => handleGenerateMigration(student)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                <FileBadge size={16} /> Migration
              </button>
            </>
          )}
        />
      )}

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '90%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {templateMode === 'migration' ? <FileBadge /> : <Award />}
                  {templateMode === 'migration' ? 'Migration Certificate' : 'Certificate Generation'}
                </h2>
                <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.875rem' }}>
                  {isBulk ? `Bulk Certificates - ${courseDetails?.name}` : `${selectedStudent?.users?.full_name} - ${courseDetails?.name}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!isGenerating && generatedCert && (!isBulk || generatedCert.length > 0) && (
                  <PDFDownloadLink
                    document={templateDocument}
                    fileName={fileName}
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {({ loading }) => loading ? 'Preparing document...' : (
                      <>
                        <Download size={18} /> Download PDF
                      </>
                    )}
                  </PDFDownloadLink>
                )}
                <button onClick={handleCloseModal} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#e5e7eb', padding: '1rem', position: 'relative' }}>
              {isGenerating ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 10 }}>
                  <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '1rem' }}></div>
                  <p style={{ fontWeight: 500, color: '#4b5563' }}>Generating Certificate...</p>
                </div>
              ) : generatedCert ? (
                <PDFViewer width="100%" height="100%" style={{ border: 'none', borderRadius: '0.5rem', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                  {templateDocument}
                </PDFViewer>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CertBulkActions = ({ onGenerate, onGenerateMigration, disabled }) => {
  const { selectedIds = [] } = useListContext();
  if (!selectedIds.length || disabled) return null;
  return (
    <>
      <button className="btn btn-sm btn-secondary" onClick={() => onGenerate(selectedIds)}>
        <Award size={14} /> Generate Certificates
      </button>
      <button className="btn btn-sm btn-secondary" onClick={() => onGenerateMigration(selectedIds)}>
        <FileBadge size={14} /> Generate Migration
      </button>
    </>
  );
};

export default AdminCertificates;