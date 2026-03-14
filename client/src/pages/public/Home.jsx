import { Link } from 'react-router-dom';
import { GraduationCap, Users, Award, Shield, ArrowRight, Star, BookOpen, Building2 } from 'lucide-react';
import './Home.css';

const Home = () => {
  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg-glow" />
        <div className="container hero-content">
          <div className="hero-badge">
            <Star size={14} /> Trusted by 5,000+ Students
          </div>
          <h1>
            Empowering the Future of<br />
            <span className="gradient-text">Healthcare Education</span>
          </h1>
          <p className="hero-desc">
            Industry-leading training programs in nursing, healthcare, and medical
            sciences. Join our nationally recognized institute and build a career that matters.
          </p>
          <div className="hero-actions">
            <Link to="/admission" className="btn btn-primary btn-lg">
              Apply for Admission <ArrowRight size={18} />
            </Link>
            <Link to="/courses" className="btn btn-secondary btn-lg">
              Explore Courses
            </Link>
          </div>
          <div className="hero-stats">
            <div><strong>5,000+</strong><span>Students Trained</span></div>
            <div><strong>50+</strong><span>Courses</span></div>
            <div><strong>100+</strong><span>Franchise Partners</span></div>
            <div><strong>95%</strong><span>Placement Rate</span></div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Why Choose EduCare?</h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            We provide world-class healthcare education with modern facilities and expert faculty
          </p>
          <div className="grid grid-4 features-grid">
            {[
              { icon: GraduationCap, title: 'Expert Faculty', desc: 'Learn from industry professionals with years of clinical experience' },
              { icon: BookOpen, title: 'Modern Curriculum', desc: 'Updated coursework aligned with latest healthcare standards' },
              { icon: Award, title: 'Certified Programs', desc: 'Nationally recognized certifications upon course completion' },
              { icon: Shield, title: 'Job Placement', desc: '95% placement assistance with top hospitals and clinics' },
            ].map(({ icon: Icon, title, desc }) => (
              <div className="feature-card card" key={title}>
                <div className="feature-icon"><Icon size={24} /></div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div>
              <h2>Become a Franchise Partner</h2>
              <p>Expand your educational business with EduCare&apos;s proven model and support system.</p>
            </div>
            <Link to="/franchise" className="btn btn-accent btn-lg">
              <Building2 size={18} /> Learn More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
