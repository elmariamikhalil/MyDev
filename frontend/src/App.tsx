import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ToastContainer from './components/Toast';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CoursePlayer from './pages/CoursePlayer';
import Certificate from './pages/Certificate';
import Courses from './pages/Courses';
import LessonList from './pages/LessonList';
import Paths from './pages/Paths';
import PathDetails from './pages/PathDetails';
import Profile from './pages/Profile';
import Mentors from './pages/Mentors';
import TaskPage from './pages/Task';
import Inbox from './pages/Inbox';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminPaths from './pages/admin/AdminPaths';

import MentorDashboard from './pages/mentor/MentorDashboard';

import './assets/styles/global.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--primary)', fontFamily: 'var(--font-main)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>✦</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/course/:courseId" element={<PrivateRoute><CoursePlayer /></PrivateRoute>} />
            <Route path="/course/:courseId/certificate" element={<PrivateRoute><Certificate /></PrivateRoute>} />
            <Route path="/lesson"   element={<PrivateRoute><LessonList /></PrivateRoute>} />
            <Route path="/courses"  element={<PrivateRoute><Courses /></PrivateRoute>} />
            <Route path="/paths"    element={<PrivateRoute><Paths /></PrivateRoute>} />
            <Route path="/paths/:pathId" element={<PrivateRoute><PathDetails /></PrivateRoute>} />
            <Route path="/profile"  element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/mentors"  element={<PrivateRoute><Mentors /></PrivateRoute>} />
            <Route path="/task"     element={<PrivateRoute><TaskPage /></PrivateRoute>} />
            <Route path="/inbox"    element={<PrivateRoute><Inbox /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/users"     element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
            <Route path="/admin/courses"   element={<PrivateRoute><AdminCourses /></PrivateRoute>} />
            <Route path="/admin/paths"     element={<PrivateRoute><AdminPaths /></PrivateRoute>} />

            {/* Mentor */}
            <Route path="/mentor/dashboard" element={<PrivateRoute><MentorDashboard /></PrivateRoute>} />

            {/* Default + 404 */}
            <Route path="/"  element={<Navigate to="/dashboard" />} />
            <Route path="*"  element={<NotFound />} />
          </Routes>
          <ToastContainer />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
