import { useState } from 'react';
import { Award, Download, FileText, CheckCircle, X } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import CertificateTemplate from '../../components/pdf/CertificateTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminCertificates = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [generatedCert, setGeneratedCert] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: courses, loading: coursesLoading } = useFetch('/courses');
  const { data: students, loading: studentsLoading } = useFetch(
    selectedCourse ? `/students?courseId=${selectedCourse}` : null
  );

  const handleGenerateClick = async (student) => {
    setSelectedStudent(student);
    setIsGenerating(true);
    setIsModalOpen(true);

    try {
      const payload = {
        studentId: student.id,
        courseId: selectedCourse,
        issueDate: new Date().toISOString().split('T')[0],
        fileUrl: '' // Keeping empty for now as requested
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

  const courseDetails = courses?.find(c => c.id === selectedCourse);

  return (
    <div className="admin-certificates">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Certificate Management</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
          Generate and issue certificates to students who have completed their courses.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div className="form-group" style={{ maxWidth: '400px' }}>
          <label className="form-label">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="form-input"
            disabled={coursesLoading}
          >
            <option value="">-- Select Course --</option>
            {courses && courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedCourse && (
        <div className="card table-container">
          {studentsLoading ? (
            <div className="loading-screen" style={{ padding: '3rem' }}><div className="spinner" /></div>
          ) : (!students || students.length === 0) ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No students found for this course.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Enrollment Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{student.users?.full_name || 'Unknown'}</div>
                    </td>
                    <td>{student.student_id_number || 'N/A'}</td>
                    <td>{student.users?.email || 'N/A'}</td>
                    <td>{new Date(student.enrollment_date).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleGenerateClick(student)}
                          className="btn btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          <Award size={16} /> Generate Certificate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Certificate Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '90%', maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award className="text-primary-600" /> Certificate Generation
                </h2>
                {selectedStudent && (
                  <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.875rem' }}>
                    {selectedStudent.users?.full_name} - {courseDetails?.name}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {generatedCert && (
                  <PDFDownloadLink
                    document={
                      <CertificateTemplate
                        studentName={selectedStudent?.users?.full_name || 'Student Name'}
                        courseName={courseDetails?.name || 'Course Name'}
                        issueDate={generatedCert.issue_date}
                        certificateCode={generatedCert.certificate_number}
                      />
                    }
                    fileName={`Certificate_${selectedStudent?.student_id_number || '000'}.pdf`}
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
                <button
                  onClick={handleCloseModal}
                  style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}
                >
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
                  <CertificateTemplate
                    studentName={selectedStudent?.users?.full_name || 'Student Name'}
                    courseName={courseDetails?.name || 'Course Name'}
                    issueDate={generatedCert.issue_date}
                    certificateCode={generatedCert.certificate_number}
                  />
                </PDFViewer>
              ) : null}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCertificates;
