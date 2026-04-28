import { useState, useRef } from 'react';
import { Award, Download, FileText, CheckCircle, X, Upload } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import CertificateTemplate from '../../components/pdf/CertificateTemplate';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminCertificates = () => {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [generatedCert, setGeneratedCert] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef(null);

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

  const handleDownloadTemplate = () => {
    if (!students || students.length === 0) {
      toast.error('No students found for this course.');
      return;
    }
    
    let csvContent = "Student ID,Student ID Number,Student Name,Issue Date,File URL\n";
    const defaultIssueDate = new Date().toISOString().split('T')[0];
    
    students.forEach(student => {
      if (student.id && student.student_id_number) {
        const studentName = student.users?.full_name 
          ? `"${student.users.full_name.replace(/"/g, '""')}"` 
          : 'Unknown';
        csvContent += `${student.id},${student.student_id_number},${studentName},${defaultIssueDate},\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bulk_certificates_template_${courseDetails?.name?.replace(/\s+/g, '_') || 'course'}.csv`;
    link.click();
  };

  const handleBulkUpload = (e) => {
    e.preventDefault();
    if (!fileInputRef.current?.files[0]) {
      toast.error('Please upload a CSV file');
      return;
    }

    const file = fileInputRef.current.files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        setIsGenerating(true);
        setIsBulkModalOpen(false);
        setIsModalOpen(true);
        setSelectedStudent(null);
        setGeneratedCert([]);

        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length < 2) throw new Error('File is empty or missing data rows');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const studentIdIndex = headers.findIndex(h => h === 'student id');
        const issueDateIndex = headers.findIndex(h => h === 'issue date');
        const fileUrlIndex = headers.findIndex(h => h === 'file url');

        if (studentIdIndex === -1) {
          throw new Error('CSV must contain "Student ID" column');
        }

        const generatedCerts = [];

        for (let i = 1; i < lines.length; i++) {
          const rowText = lines[i];
          const values = [];
          let inQuotes = false;
          let currentValue = '';
          for (let j = 0; j < rowText.length; j++) {
            const char = rowText[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          const studentId = values[studentIdIndex];
          if (!studentId) continue;

          const issueDate = issueDateIndex !== -1 ? values[issueDateIndex] : new Date().toISOString().split('T')[0];
          const fileUrl = fileUrlIndex !== -1 ? values[fileUrlIndex] : '';

          const payload = {
            studentId,
            courseId: selectedCourse,
            issueDate: issueDate || new Date().toISOString().split('T')[0],
            fileUrl
          };

          const response = await api.post('/certificates', payload);
          const studentInfo = students?.find(s => s.id === studentId);
          
          generatedCerts.push({
            studentName: studentInfo?.users?.full_name || 'Unknown Student',
            courseName: courseDetails?.name || 'Unknown Course',
            issueDate: response.data.issue_date,
            certificateCode: response.data.certificate_number,
            fileUrl: response.data.file_url
          });
        }

        setGeneratedCert(generatedCerts);
        toast.success(`Successfully processed ${generatedCerts.length} certificates`);
      } catch (err) {
        toast.error(err.message || 'Error processing CSV file');
        setIsModalOpen(false);
      } finally {
        setIsGenerating(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read the file');
      setIsGenerating(false);
    };

    reader.readAsText(file);
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
      };

  const fileName = isBulk 
    ? `Bulk_Certificates_${courseDetails?.name?.replace(/\s+/g, '_') || 'course'}.pdf`
    : `Certificate_${selectedStudent?.student_id_number || '000'}.pdf`;

  return (
    <div className="admin-certificates">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Certificate Management</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
          Generate and issue certificates to students who have completed their courses.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', maxWidth: '600px' }}>
          <div className="form-group" style={{ flex: 1, margin: 0 }}>
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
          <button 
            className="btn btn-secondary" 
            disabled={!selectedCourse || studentsLoading}
            onClick={() => setIsBulkModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '42px' }}
          >
            <Upload size={18} /> Bulk Generate
          </button>
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
                <p style={{ margin: '0.25rem 0 0', color: '#4b5563', fontSize: '0.875rem' }}>
                  {isBulk ? `Bulk Certificates - ${courseDetails?.name}` : `${selectedStudent?.users?.full_name} - ${courseDetails?.name}`}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {!isGenerating && generatedCert && (!isBulk || generatedCert.length > 0) && (
                  <PDFDownloadLink
                    document={<CertificateTemplate {...templateProps} />}
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
                  <CertificateTemplate {...templateProps} />
                </PDFViewer>
              ) : null}
            </div>

          </div>
        </div>
      )}

      {/* Bulk Generate Modal */}
      {isBulkModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Bulk Generate Certificates</h2>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginTop: '1rem', background: '#f9fafb', border: '1px dashed #d1d5db' }}>
              <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem' }}>
                Download the template to get the list of student IDs for the selected course ({courseDetails?.name}). 
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button type="button" onClick={handleDownloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Download size={16} /> Download CSV Template
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Filled CSV</label>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  className="form-input"
                  style={{ padding: '0.5rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUpload}
                className="btn btn-primary"
              >
                Upload and Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCertificates;
