import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicLayout } from '../components/layout/PublicLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Public Pages
import Home from '../pages/public/Home';
import About from '../pages/public/About';
import Courses from '../pages/public/Courses';
import Contact from '../pages/public/Contact';
import Notices from '../pages/public/Notices';
import Verify from '../pages/public/Verify';
import FranchisePage from '../pages/public/FranchisePage';
import AdmissionPage from '../pages/public/AdmissionPage';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminStudents from '../pages/admin/AdminStudents';
import AdminAdmissions from '../pages/admin/AdminAdmissions';
import AdminExams from '../pages/admin/AdminExams';
import AdminResults from '../pages/admin/AdminResults';
import AdminNotices from '../pages/admin/AdminNotices';
import AdminCertificates from '../pages/admin/AdminCertificates';
import AdminFranchises from '../pages/admin/AdminFranchises';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfile from '../pages/student/StudentProfile';
import StudentExams from '../pages/student/StudentExams';
import StudentResults from '../pages/student/StudentResults';
import StudentCertificates from '../pages/student/StudentCertificates';

// Franchise Pages
import FranchiseDashboard from '../pages/franchise/FranchiseDashboard';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/franchise" element={<FranchisePage />} />
            <Route path="/admission" element={<AdmissionPage />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="admissions" element={<AdminAdmissions />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="franchises" element={<AdminFranchises />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="exams" element={<StudentExams />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="certificates" element={<StudentCertificates />} />
          </Route>

          {/* Franchise Routes */}
          <Route path="/franchise-dashboard" element={
            <ProtectedRoute allowedRoles={['franchise']}>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<FranchiseDashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
