import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import api from '../../services/api';
import { uploadDocumentPublic } from '../../services/documents';
import { CheckCircle, Upload, FileSpreadsheet, UserPlus, X, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FranchiseApplications = () => {
  const { user } = useAuth();
  const [franchise, setFranchise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'bulk'

  useEffect(() => {
    const fetchFranchise = async () => {
      try {
        const { data: myFranchise } = await api.get('/franchises/me');
        if (myFranchise) setFranchise(myFranchise);
      } catch {}
      setLoading(false);
    };
    fetchFranchise();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Student Applications</h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>Submit manual or bulk student admission applications</p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${activeTab === 'manual' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('manual')}
        >
          <UserPlus size={18} /> Manual Application
        </button>
        <button
          className={`btn ${activeTab === 'bulk' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('bulk')}
        >
          <FileSpreadsheet size={18} /> Bulk Upload
        </button>
      </div>

      {activeTab === 'manual' ? (
        <ManualApplication franchise={franchise} />
      ) : (
        <BulkApplication franchise={franchise} />
      )}
    </div>
  );
};

// ──── Manual Application Form ────────────────────
const ManualApplication = ({ franchise }) => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const { data: courses } = useFetch('/courses');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only show courses relevant to this franchise
  const franchiseCourses = courses?.filter(c => franchise?.course_ids?.includes(c.id)) || [];

  const [files, setFiles] = useState({
    applicant_photo: null,
    aadhaar_card: null,
    marksheet: null,
    admit_card: null,
    certificate: null,
    caste_certificate: null,
  });

  const handleFileChange = (docType) => (e) => {
    setFiles(prev => ({ ...prev, [docType]: e.target.files?.[0] || null }));
  };

  const onSubmit = async (data) => {
    setError('');
    const requiredFiles = ['applicant_photo', 'aadhaar_card', 'marksheet', 'admit_card', 'certificate'];
    for (const reqFile of requiredFiles) {
      if (!files[reqFile]) {
        setError(`Please upload your ${reqFile.replace(/_/g, ' ')}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = { ...data, franchiseId: franchise?.id };
      const response = await api.post('/admissions', payload);
      const admissionId = response.data?.admission?.id;

      if (admissionId) {
        for (const [docType, file] of Object.entries(files)) {
          if (file) {
            try {
              await uploadDocumentPublic({
                file,
                entityType: 'admission',
                entityId: admissionId,
                documentType: docType,
              });
            } catch (uploadErr) {
              console.error(`Failed to upload ${docType}:`, uploadErr);
            }
          }
        }
      }

      setSubmitted(true);
      reset();
      setFiles({
        applicant_photo: null,
        aadhaar_card: null,
        marksheet: null,
        admit_card: null,
        certificate: null,
        caste_certificate: null,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Application Submitted!</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          The admission application has been submitted for admin review.
        </p>
        <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Submit Another</button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
        Manual Student Application
      </h3>
      {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" {...register('fullName', { required: true, minLength: 2 })} />
            {errors.fullName && <span className="form-error">Required</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input className="form-input" type="email" {...register('email', { required: true })} />
            {errors.email && <span className="form-error">Required</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Father's Name *</label>
            <input className="form-input" {...register('fatherName', { required: true, minLength: 2 })} />
            {errors.fatherName && <span className="form-error">Required</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Mother's Name *</label>
            <input className="form-input" {...register('motherName', { required: true, minLength: 2 })} />
            {errors.motherName && <span className="form-error">Required</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Phone *</label>
            <input className="form-input" {...register('phone', { required: true, minLength: 10 })} />
            {errors.phone && <span className="form-error">10+ digits required</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Date of Birth *</label>
            <input className="form-input" type="date" {...register('dateOfBirth', { required: true })} />
            {errors.dateOfBirth && <span className="form-error">Required</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Gender *</label>
            <select className="form-select" {...register('gender', { required: true })}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <span className="form-error">Required</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Course *</label>
            <select className="form-select" {...register('courseId', { required: true })}>
              <option value="">Select Course</option>
              {franchiseCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.courseId && <span className="form-error">Required</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" {...register('password', { required: true, minLength: 8 })} />
            {errors.password?.type === 'required' && <span className="form-error">Required</span>}
            {errors.password?.type === 'minLength' && <span className="form-error">Min 8 chars</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password *</label>
            <input className="form-input" type="password" {...register('confirmPassword', {
              required: true,
              validate: val => val === watch('password') || 'Passwords do not match'
            })} />
            {errors.confirmPassword?.type === 'required' && <span className="form-error">Required</span>}
            {errors.confirmPassword?.message && <span className="form-error">{errors.confirmPassword.message}</span>}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Address *</label>
          <input className="form-input" {...register('address', { required: true, minLength: 5 })} />
        </div>

        <div className="grid grid-3">
          <div className="form-group">
            <label className="form-label">City *</label>
            <input className="form-input" {...register('city', { required: true })} />
          </div>
          <div className="form-group">
            <label className="form-label">State *</label>
            <input className="form-input" {...register('state', { required: true })} />
          </div>
          <div className="form-group">
            <label className="form-label">Pincode *</label>
            <input className="form-input" {...register('pincode', { required: true, minLength: 6, maxLength: 6 })} />
          </div>
        </div>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>Upload Documents</h3>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Provide clear images of the following documents. Max 5MB per file.</p>

        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Applicant Photo (Passport Size) *</label>
            <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('applicant_photo')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Aadhaar Card *</label>
            <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('aadhaar_card')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Madhyamik or HS Marksheet *</label>
            <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('marksheet')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Admit Card *</label>
            <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('admit_card')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Previous Certificate *</label>
            <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('certificate')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Caste Certificate (Optional)</label>
            <input className="form-input" type="file" accept="image/*,application/pdf" onChange={handleFileChange('caste_certificate')} />
          </div>
        </div>

        <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', marginTop: '2rem' }} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};

// ──── Bulk Application Upload ────────────────────
const BulkApplication = ({ franchise }) => {
  const { data: courses } = useFetch('/courses');
  const [csvData, setCsvData] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [docUploads, setDocUploads] = useState({}); // { admissionId: { docType: file } }
  const [uploadingDocs, setUploadingDocs] = useState(null);

  const franchiseCourses = courses?.filter(c => franchise?.course_ids?.includes(c.id)) || [];

  const downloadTemplate = () => {
    const headers = 'fullName,email,fatherName,motherName,phone,dateOfBirth,gender,courseId,password,address,city,state,pincode';
    const sampleRow = 'John Doe,john@example.com,Father Name,Mother Name,9876543210,2000-01-15,male,COURSE_UUID_HERE,Password@123,123 Street,City,State,123456';
    const csvContent = `${headers}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_admission_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        setParseErrors(['CSV must have at least a header and one data row']);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['fullName', 'email', 'phone', 'dateOfBirth', 'gender', 'courseId', 'password', 'address', 'city', 'state', 'pincode'];
      const missing = requiredHeaders.filter(h => !headers.includes(h));
      if (missing.length > 0) {
        setParseErrors([`Missing required columns: ${missing.join(', ')}`]);
        return;
      }

      const rows = [];
      const errors = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          errors.push(`Row ${i}: column count mismatch (expected ${headers.length}, got ${values.length})`);
          continue;
        }
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });

        // Basic validation
        if (!row.fullName || !row.email || !row.phone || !row.courseId || !row.password) {
          errors.push(`Row ${i}: missing required fields`);
          continue;
        }
        rows.push(row);
      }

      setParsedRows(rows);
      setParseErrors(errors);
      setCsvData(file.name);
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (parsedRows.length === 0) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/admissions/bulk', {
        admissions: parsedRows,
        franchiseId: franchise?.id,
      });
      setResults(data);
      setSubmitted(true);
      toast.success(`${data.admissions?.length || 0} applications submitted`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocFileChange = (admissionId, docType) => (e) => {
    const file = e.target.files?.[0];
    setDocUploads(prev => ({
      ...prev,
      [admissionId]: { ...(prev[admissionId] || {}), [docType]: file },
    }));
  };

  const uploadDocsForAdmission = async (admissionId) => {
    const docs = docUploads[admissionId];
    if (!docs) return;
    setUploadingDocs(admissionId);
    try {
      for (const [docType, file] of Object.entries(docs)) {
        if (file) {
          await uploadDocumentPublic({
            file,
            entityType: 'admission',
            entityId: admissionId,
            documentType: docType,
          });
        }
      }
      toast.success('Documents uploaded');
    } catch {
      toast.error('Failed to upload some documents');
    }
    setUploadingDocs(null);
  };

  if (submitted && results) {
    return (
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <CheckCircle size={24} style={{ color: '#22c55e' }} />
          <h3 style={{ fontWeight: 600 }}>{results.admissions?.length || 0} Applications Created</h3>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          You can now upload documents for each student below. This step is optional — documents can also be uploaded later.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.admissions?.map((adm, idx) => (
            <div key={adm.id} style={{ background: 'var(--gray-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <strong>{adm.full_name}</strong>
                  <span style={{ color: '#6b7280', marginLeft: '0.75rem', fontSize: '0.875rem' }}>{adm.email}</span>
                </div>
                <span className="badge badge-warning">pending</span>
              </div>
              <div className="grid grid-3" style={{ gap: '0.5rem' }}>
                {['applicant_photo', 'aadhaar_card', 'marksheet', 'admit_card', 'certificate'].map(docType => (
                  <div key={docType} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                      {docType.replace(/_/g, ' ')}
                    </label>
                    <input
                      className="form-input"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleDocFileChange(adm.id, docType)}
                      style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                    />
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.75rem' }}
                onClick={() => uploadDocsForAdmission(adm.id)}
                disabled={uploadingDocs === adm.id || !docUploads[adm.id]}
              >
                <Upload size={14} /> {uploadingDocs === adm.id ? 'Uploading...' : 'Upload Docs'}
              </button>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary" style={{ marginTop: '1.5rem' }} onClick={() => { setSubmitted(false); setCsvData(null); setParsedRows([]); setResults(null); }}>
          Upload Another Batch
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-200)' }}>
        Bulk Student Upload
      </h3>

      {/* Step 1: Download Template */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase', color: '#6b7280' }}>Step 1: Download CSV Template</h4>
        <button className="btn btn-secondary" onClick={downloadTemplate}>
          <Download size={18} /> Download Template
        </button>
        {franchiseCourses.length > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Your Course IDs:</strong>
            <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {franchiseCourses.map(c => (
                <code key={c.id} style={{ fontSize: '0.75rem' }}>{c.name}: {c.id}</code>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Upload CSV */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontWeight: 500, marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase', color: '#6b7280' }}>Step 2: Upload Filled CSV</h4>
        <input
          className="form-input"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Errors */}
      {parseErrors.length > 0 && (
        <div style={{ marginBottom: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#dc2626', fontWeight: 600 }}>
            <AlertCircle size={18} /> Parse Errors
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#991b1b' }}>
            {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Preview */}
      {parsedRows.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: 500, marginBottom: '0.75rem', fontSize: '0.875rem', textTransform: 'uppercase', color: '#6b7280' }}>
            Step 3: Review & Submit ({parsedRows.length} students)
          </h4>
          <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>DOB</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{row.fullName}</td>
                    <td>{row.email}</td>
                    <td>{row.phone}</td>
                    <td style={{ textTransform: 'capitalize' }}>{row.gender}</td>
                    <td>{row.dateOfBirth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={handleBulkSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : `Submit ${parsedRows.length} Applications`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FranchiseApplications;
