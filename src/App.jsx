import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Tasks from './pages/Tasks';
import Notifications from './pages/Notifications';
import AdminBusinesses from './pages/AdminBusinesses';
import AdminUsers from './pages/AdminUsers';
import Profile from './pages/Profile';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* User routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><Layout><AdminDashboard /></Layout></ProtectedRoute>
        } />
        <Route path="/admin/tasks" element={
          <ProtectedRoute adminOnly><Layout><Tasks /></Layout></ProtectedRoute>
        } />
        <Route path="/admin/businesses" element={
          <ProtectedRoute adminOnly><Layout><AdminBusinesses /></Layout></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute adminOnly><Layout><AdminUsers /></Layout></ProtectedRoute>
        } />

        {/* Shared routes */}
        <Route path="/notifications" element={
          <ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
        } />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
