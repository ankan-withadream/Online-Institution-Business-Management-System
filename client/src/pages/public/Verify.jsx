import { useState } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

const Verify = () => {
  const [code, setCode] = useState('');
  const [type, setType] = useState('result');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const endpoint = type === 'result' ? `/results/verify/${code}` : `/certificates/verify/${code}`;
      const { data } = await api.get(endpoint);
      setResult(data);
    } catch {
      setError('No matching record found. Please check your verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
        <h1 className="section-title">Verify Certificate / Result</h1>
        <p className="section-subtitle">Enter the verification code to validate authenticity</p>

        <div className="card" style={{ padding: '2rem', textAlign: 'left' }}>
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Verification Type</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="result">Result</option>
                <option value="certificate">Certificate</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input
                className="form-input"
                placeholder="e.g. RES-A1B2C3D4 or CERT-A1B2C3D4"
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
                {result.exam && <div><strong>Exam:</strong> {result.exam}</div>}
                {result.subject && <div><strong>Subject:</strong> {result.subject}</div>}
                {result.marks !== undefined && <div><strong>Marks:</strong> {result.marks}</div>}
                {result.grade && <div><strong>Grade:</strong> {result.grade}</div>}
                {result.course && <div><strong>Course:</strong> {result.course}</div>}
                {result.certificateNumber && <div><strong>Certificate:</strong> {result.certificateNumber}</div>}
                {result.issueDate && <div><strong>Issue Date:</strong> {result.issueDate}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify;
