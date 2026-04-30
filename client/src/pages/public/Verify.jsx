import { useState } from 'react';
import { Search, CheckCircle, XCircle, Download } from 'lucide-react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import api from '../../services/api';
import CertificateTemplate from '../../components/pdf/CertificateTemplate';

const Verify = () => {
  const [code, setCode] = useState('');
  const [type, setType] = useState('certificate');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const trimmedCode = code.trim();
      const endpoint = type === 'certificate'
        ? `/certificates/verify/${trimmedCode}`
        : `/students/verify/${trimmedCode}`;
      const { data } = await api.get(endpoint);
      setResult(data);
    } catch (err) {
      console.error('Verification error:', err);
      setError('No matching record found. Please check your verification details.');
    } finally {
      setLoading(false);
    }
  };

  const isCertificate = type === 'certificate';
  const certificateFileName = result?.studentId
    ? `Certificate_${result.studentId}.pdf`
    : 'Certificate.pdf';
  const certificateTemplateProps = result?.verified
    ? {
        studentName: result.studentName,
        courseName: result.course,
        issueDate: result.issueDate,
        certificateCode: result.certificateNumber,
      }
    : null;
  const previewContainerStyle = {
    height: 520,
    backgroundColor: '#e5e7eb',
    padding: '0.75rem',
    borderRadius: 12,
  };
  const certificateViewerStyle = {
    border: 'none',
    borderRadius: '0.5rem',
    backgroundColor: '#fff',
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
        <h1 className="section-title">Verify Certificate or Student</h1>
        <p className="section-subtitle">Enter the verification code or student ID to validate authenticity</p>

        <div className="card" style={{ padding: '2rem', textAlign: 'left' }}>
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Verification Type</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="certificate">Certificate</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isCertificate ? 'Certificate Verification Code' : 'Student ID Number'}</label>
              <input
                className="form-input"
                placeholder={isCertificate ? 'e.g. CERT-A1B2C3D4' : 'e.g. STU-2026-0001'}
                value={code}
                onChange={e => setCode(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
              <Search size={16} /> {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fee2e2', borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
              <XCircle size={18} style={{ color: '#ef4444' }} />
              <p style={{ color: '#991b1b', fontSize: '0.875rem' }}>{error}</p>
            </div>
          )}

          {result?.verified && (
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#dcfce7', borderRadius: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1rem' }}>
                <CheckCircle size={20} style={{ color: '#16a34a' }} />
                <strong style={{ color: '#166534' }}>Verified Successfully!</strong>
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: '0.875rem' }}>
                <div><strong>Student:</strong> {result.studentName}</div>
                <div><strong>Student ID:</strong> {result.studentId}</div>
                {result.course && <div><strong>Course:</strong> {result.course}</div>}
                {isCertificate && result.certificateNumber && (
                  <div><strong>Certificate:</strong> {result.certificateNumber}</div>
                )}
                {isCertificate && result.issueDate && (
                  <div><strong>Issue Date:</strong> {result.issueDate}</div>
                )}
              </div>
            </div>
          )}

          {isCertificate && result?.verified && certificateTemplateProps && (
            <div style={{ marginTop: '1.5rem', display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <PDFDownloadLink
                  document={<CertificateTemplate {...certificateTemplateProps} />}
                  fileName={certificateFileName}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {({ loading }) => loading ? 'Preparing document...' : (
                    <>
                      <Download size={18} /> Download PDF
                    </>
                  )}
                </PDFDownloadLink>
              </div>
              <div style={previewContainerStyle}>
                <PDFViewer width="100%" height="100%" style={certificateViewerStyle}>
                  <CertificateTemplate {...certificateTemplateProps} />
                </PDFViewer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify;
