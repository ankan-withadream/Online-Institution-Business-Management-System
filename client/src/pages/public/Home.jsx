import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Award, Shield, ArrowRight, Star, BookOpen, Building2 } from 'lucide-react';
import './Home.css';

import heroBg1 from '../../assets/home_hero_bg_1.jpg';
import heroBg2 from '../../assets/home_hero_bg_2.jpg';
import heroBg3 from '../../assets/home_hero_bg_3.jpg';
import heroBg4 from '../../assets/home_hero_bg_4.jpg';
import heroBg5 from '../../assets/home_hero_bg_5.jpg';

const heroImages = [heroBg1, heroBg2, heroBg3, heroBg4, heroBg5];

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % heroImages.length);
  }, [currentSlide, goToSlide]);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero" id="hero-section">
        {/* Background Carousel */}
        <div className="hero-carousel">
          {heroImages.map((img, index) => (
            <div
              key={index}
              className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            />
          ))}
          {/* Gradient overlay: heavy frosted blur on left, fading to clear on right */}
          <div className="hero-overlay" />
        </div>

        {/* Left-aligned Content */}
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <Star size={14} /> Trusted by 5,000+ Students Nationwide
            </div>
            <h1>
              Shape Your Future in<br />
              <span className="gradient-text">Healthcare Excellence</span>
            </h1>
            <p className="hero-desc">
              Join India&apos;s fastest-growing healthcare education network.
              Nationally certified programs, expert-led training, and
              guaranteed career pathways — all under one roof.
            </p>
            <div className="hero-actions">
              <Link to="/admission" className="btn btn-primary btn-lg">
                Start Your Journey <ArrowRight size={18} />
              </Link>
              <Link to="/courses" className="btn btn-secondary-hero btn-lg">
                View Programs
              </Link>
            </div>
            <div className="hero-stats">
              <div><strong>5,000+</strong><span>Students Trained</span></div>
              <div><strong>50+</strong><span>Programs</span></div>
              <div><strong>100+</strong><span>Partners</span></div>
              <div><strong>95%</strong><span>Placement</span></div>
            </div>
          </div>
        </div>

        {/* Slide Indicators — bottom right */}
        <div className="hero-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
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
