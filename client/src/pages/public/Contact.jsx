import { Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, send to API
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="section">
      <div className="container">
        <h1 className="section-title">Contact Us</h1>
        <p className="section-subtitle">Have questions? We&apos;d love to hear from you.</p>

        <div className="grid grid-2" style={{ gap: '3rem', alignItems: 'start' }}>
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'start', padding: '0.5rem' }}>
                <MapPin size={20} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Address</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>123 Healthcare Avenue, Medical District, New Delhi - 110001</p>
                </div>
              </div>
            </div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'start', padding: '0.5rem' }}>
                <Phone size={20} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Phone</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>+91 98765 43210</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'start', padding: '0.5rem' }}>
                <Mail size={20} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Email</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>info@educare.edu.in</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            {sent && <div className="badge badge-success" style={{ marginBottom: '1rem' }}>Message sent successfully!</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" rows={5} value={form.message} onChange={e => setForm({...form, message: e.target.value})} required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
