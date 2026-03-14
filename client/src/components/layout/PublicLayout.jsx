import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState } from 'react';
import './PublicLayout.css';

export const PublicLayout = () => {
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'student') return '/student';
    return '/franchise-dashboard';
  };

  return (
    <div className="public-layout">
      <header className="header">
        <div className="container header-inner">
          <Link to="/" className="logo">
            <GraduationCap size={32} />
            <span>EduCare</span>
          </Link>

          <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/courses" onClick={() => setMenuOpen(false)}>Courses</Link>
            <Link to="/notices" onClick={() => setMenuOpen(false)}>Notices</Link>
            <Link to="/verify" onClick={() => setMenuOpen(false)}>Verify</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
          </nav>

          <div className="header-actions">
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="btn btn-primary btn-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                <Link to="/admission" className="btn btn-primary btn-sm">Apply Now</Link>
              </>
            )}
          </div>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <GraduationCap size={28} />
            <span>EduCare</span>
            <p>Healthcare & Nursing Training Institute</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Quick Links</h4>
              <Link to="/about">About Us</Link>
              <Link to="/courses">Courses</Link>
              <Link to="/admission">Admissions</Link>
              <Link to="/franchise">Franchise</Link>
            </div>
            <div>
              <h4>Resources</h4>
              <Link to="/notices">Notices</Link>
              <Link to="/verify">Verify Certificate</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} EduCare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
