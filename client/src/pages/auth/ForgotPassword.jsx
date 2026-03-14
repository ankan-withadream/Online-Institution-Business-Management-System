import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1d4ed8', fontWeight: 800, fontSize: '1.25rem' }}>
            <GraduationCap size={32} /> EduCare
          </Link>
          <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.875rem' }}>Reset your password</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <Mail size={48} style={{ color: '#3b82f6', margin: '0 auto 1rem' }} />
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Check your email</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>We&apos;ve sent a password reset link to {email}</p>
            <Link to="/login" className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: 8, fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Send Reset Link</button>
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
              <Link to="/login" style={{ color: '#3b82f6' }}>Back to Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
