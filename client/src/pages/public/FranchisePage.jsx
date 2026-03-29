import { Link } from 'react-router-dom';
import { Building2, CheckCircle, Users, TrendingUp } from 'lucide-react';

const FranchisePage = () => (
  <div className="section">
    <div className="container">
      <h1 className="section-title">Franchise Opportunity</h1>
      <p className="section-subtitle">
        Partner with EduCare to bring quality healthcare education to your region
      </p>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', lineHeight: 1.8 }}>
        <p>
          EduCare&apos;s franchise model allows educational entrepreneurs to setup and run
          healthcare training centers under the EduCare brand. We provide full support including
          curriculum, training materials, certification authority, and marketing assistance.
        </p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '3rem' }}>
        {[
          { icon: Building2, title: 'Brand Support', desc: 'Use the EduCare brand name, marketing materials, and proven business model.' },
          { icon: Users, title: 'Student Pipeline', desc: 'Benefit from our centralized admission system and student referrals.' },
          { icon: TrendingUp, title: 'Revenue Sharing', desc: 'Attractive revenue sharing model with transparent accounting.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div className="card" key={title} style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '1rem',
              background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
              color: '#7c3aed', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1rem'
            }}>
              <Icon size={24} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{desc}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>Requirements</h2>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: 2, color: '#4b5563' }}>
          {[
            'Minimum 1000 sq ft space for training center',
            'Prior experience in education or healthcare (preferred)',
            'Initial investment capacity',
            'Commitment to quality education standards',
            'Valid business registration',
          ].map((req) => (
            <li key={req} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} /> {req}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Link to="/franchise-apply" className="btn btn-accent btn-lg">Apply for Franchise Partnership</Link>
      </div>
    </div>
  </div>
);

export default FranchisePage;
