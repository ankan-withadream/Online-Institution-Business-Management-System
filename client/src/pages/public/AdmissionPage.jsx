import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useFetch } from '../../hooks/useFetch';
import { uploadDocumentPublic } from '../../services/documents';

const AdmissionPage = () => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const { data: courses } = useFetch('/courses');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState({
    applicant_photo: null,
    aadhaar_card: null,
    marksheet: null,
    admit_card: null,
    certificate: null,
    caste_certificate: null,
  });

  const handleFileChange = (docType) => (e) => {
    setFiles((prev) => ({ ...prev, [docType]: e.target.files?.[0] || null }));
  };

  const onSubmit = async (data) => {
    setError('');
    
    // Check required files
    const requiredFiles = ['applicant_photo', 'aadhaar_card', 'marksheet', 'admit_card', 'certificate'];
    for (const reqFile of requiredFiles) {
      if (!files[reqFile]) {
        setError(`Please upload your ${reqFile.replace('_', ' ')}`);
        return;
      }
    }

    setLoading(true);
    try {
      const response = await api.post('/admissions', data);
      const admissionId = response.data?.admission?.id;

      if (admissionId) {
        // Upload documents one by one via the public upload endpoint
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
              // Not failing the whole process, but could alert the user
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
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <div className="card" style={{ padding: '3rem' }}>
            <CheckCircle size={64} style={{ color: '#22c55e', margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Application Submitted!</h2>
            <p style={{ color: '#6b7280' }}>
              Your admission application has been received. Our team will review it and get back to you shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <h1 className="section-title">Apply for Admission</h1>
        <p className="section-subtitle">Fill out the form below to start your journey in healthcare education</p>

        <div className="card" style={{ padding: '2rem' }}>
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
                  {courses?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Please provide clear images of the following documents. Max size 5MB per file.</p>
            
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

            <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', marginTop: '2rem' }} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdmissionPage;
