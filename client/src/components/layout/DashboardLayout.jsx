import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, GraduationCap, Award,
  Bell, ClipboardList, Building2, LogOut, ChevronRight, BookOpen
} from 'lucide-react';
import './DashboardLayout.css';

const adminNav = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/students', label: 'Students', icon: Users },
  { path: '/admin/courses', label: 'Courses', icon: BookOpen },
  { path: '/admin/admissions', label: 'Admissions', icon: FileText },
  { path: '/admin/exams', label: 'Exams', icon: ClipboardList },
  { path: '/admin/results', label: 'Results', icon: Award },
  { path: '/admin/notices', label: 'Notices', icon: Bell },
  { path: '/admin/certificates', label: 'Certificates', icon: GraduationCap },
  { path: '/admin/marksheets', label: 'Marksheets', icon: FileText },
  { path: '/admin/franchises', label: 'Franchises', icon: Building2 },
];

const studentNav = [
  { path: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/student/profile', label: 'Profile', icon: Users },
  { path: '/student/exams', label: 'Exams', icon: ClipboardList },
  { path: '/student/results', label: 'Results', icon: Award },
  { path: '/student/certificates', label: 'Certificates', icon: GraduationCap },
];

const franchiseNav = [
  { path: '/franchise-dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nav = user?.role === 'admin' ? adminNav : user?.role === 'student' ? studentNav : franchiseNav;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <GraduationCap size={28} />
            <span>EduCare</span>
          </Link>
          <span className="role-badge">{user?.role}</span>
        </div>

        <nav className="sidebar-nav">
          {nav.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`sidebar-link ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              <ChevronRight size={14} className="link-arrow" />
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
            <div>
              <p className="user-name">{user?.fullName}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};
