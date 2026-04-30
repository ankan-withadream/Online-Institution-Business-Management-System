import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { uploadDocumentPublic } from '../../services/documents';
import { GraduationCap, UserPlus } from 'lucide-react';

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'student' });
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // if (form.password !== form.confirmPassword) {
    //   setError('Passwords do not match');
    //   return;
    // }
    // if (!photoFile) {
    //   setError('Applicant photo is required');
    //   return;
    // }
    setError('');
    setLoading(true);
    try {
      // const result = await registerUser(form.email, form.password, form.fullName, form.role);
      // const userId = result?.userId;

      // if (userId) {
      //   try {
          await uploadDocumentPublic({
            file: photoFile,
            entityType: form.role,
            entityId: "04701310-c107-4b62-8e6a-8c7816528a93",
            documentType: 'applicant_photo',
          });
      //   } catch (uploadErr) {
      //     console.error('Applicant photo upload failed:', uploadErr);
      //     setError('Registration succeeded, but photo upload failed. Please sign in and upload again.');
      //     return;
      //   }
      // }

      navigate('/login');
    // } catch (err) {
    //   setError(err.response?.data?.error || 'Registration failed');
            } catch (uploadErr) {
          console.error('Applicant photo upload failed:', uploadErr);
          setError('Registration succeeded, but photo upload failed. Please sign in and upload again.');
          return;
    } finally {
      setLoading(false);
    }
  };

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1d4ed8', fontWeight: 800, fontSize: '1.25rem' }}>
            <GraduationCap size={32} /> EduCare
          </Link>
          <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Create your account</p>
        </div>

        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: 8, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={form.fullName} onChange={e => update('fullName', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={form.password} onChange={e => update('password', e.target.value)} required minLength={8} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Register As</label>
            <select className="form-select" value={form.role} onChange={e => update('role', e.target.value)}>
              {/* <option value="student">Student</option> */}
              <option selected disabled value="franchise">Franchise Partner</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Applicant photo (passport size)</label>
            <input
              className="form-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={e => setPhotoFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <button className="btn btn-primary" type="submit" style={{ width: '100%' }} disabled={loading}>
            <UserPlus size={16} /> {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Already have an account? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
