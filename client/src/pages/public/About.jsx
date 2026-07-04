import { Heart, Users, Award, Target } from 'lucide-react';

const About = () => (
  <div className="section">
    <div className="container">
      <h1 className="section-title">About VEHTI</h1>
      <p className="section-subtitle">
        A premier healthcare and nursing training institute dedicated to shaping the future of medical professionals
      </p>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', lineHeight: 1.8 }}>
        <p>
          Digital Technology Development Board is a skill development and vocational training institute
          dedicated to providing quality education in Computer, Medical, Paramedical, and
          Healthcare-related courses.
        </p>
        <p style={{ marginTop: '1rem' }}>
          Our mission is to empower students with practical knowledge
          and industry-relevant skills to help them build successful careers.
        </p>
      </div>

      <div className="grid grid-4" style={{ marginTop: '2rem' }}>
        {[
          { icon: Heart, title: 'Our Mission', desc: 'To provide accessible, quality healthcare education that empowers individuals to serve communities.' },
          { icon: Target, title: 'Our Vision', desc: 'To be the leading healthcare education platform in the country with a network of franchise partners.' },
          { icon: Users, title: 'Our Team', desc: 'Experienced healthcare professionals, educators, and administrators dedicated to student success.' },
          { icon: Award, title: 'Accreditation', desc: 'Recognized by national medical education boards with certified training infrastructure.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div className="card" key={title} style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '1rem',
              background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              color: '#2563eb', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 1rem'
            }}>
              <Icon size={24} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default About;
