import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircle } from 'lucide-react';
import api from '../../services/api';

const FranchiseApplyPage = () => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setError('');
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...submitData } = data;
      await api.post('/franchises/apply', submitData);
      setSubmitted(true);
      reset();
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
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
              Your franchise application has been received. Our team will review it and get back to you shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <h1 className="section-title">Apply for Franchise Partnership</h1>
        <p className="section-subtitle">Fill out the form below to become an EduCare franchise partner</p>

        <div className="card" style={{ padding: '2rem' }}>
          {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Organization Name *</label>
                <input className="form-input" {...register('organizationName', { required: true, minLength: 2 })} />
                {errors.organizationName && <span className="form-error">Required (min 2 chars)</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person *</label>
                <input className="form-input" {...register('contactPerson', { required: true, minLength: 2 })} />
                {errors.contactPerson && <span className="form-error">Required</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" {...register('email', { required: true })} />
                {errors.email && <span className="form-error">Required</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" {...register('phone', { required: true, minLength: 10 })} />
                {errors.phone && <span className="form-error">10+ digits required</span>}
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

            <button className="btn btn-primary btn-lg" type="submit" style={{ width: '100%', marginTop: '1rem' }}>
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FranchiseApplyPage;
