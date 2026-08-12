import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageLoader } from './components/shared/LoadingSpinner';

// Auth pages
const LoginPage    = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Citizen pages
const CitizenDashboard = lazy(() => import('./pages/citizen/CitizenDashboard'));
const ReportIssuePage  = lazy(() => import('./pages/citizen/ReportIssuePage'));
const MyReportsPage    = lazy(() => import('./pages/citizen/MyReportsPage'));
const IssueDetailPage  = lazy(() => import('./pages/citizen/IssueDetailPage'));

// Officer pages
const OfficerDashboard    = lazy(() => import('./pages/officer/OfficerDashboard'));
const AssignedIssuesPage  = lazy(() => import('./pages/officer/AssignedIssuesPage'));
const IssueUpdatePage     = lazy(() => import('./pages/officer/IssueUpdatePage'));

// Admin pages
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AllIssuesPage     = lazy(() => import('./pages/admin/AllIssuesPage'));
const UsersPage         = lazy(() => import('./pages/admin/UsersPage'));
const CategoriesPage    = lazy(() => import('./pages/admin/CategoriesPage'));
const DepartmentsPage   = lazy(() => import('./pages/admin/DepartmentsPage'));

// Notifications
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// ── Guards ────────────────────────────────────────────────────
const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

const RequireRole = ({ role, children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (Array.isArray(role) ? !role.includes(user.role) : user.role !== role) {
    const dashMap = { citizen: '/citizen', officer: '/officer', admin: '/admin' };
    return <Navigate to={dashMap[user.role] || '/login'} replace />;
  }
  return children;
};

const PublicOnly = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated) {
    const dashMap = { citizen: '/citizen', officer: '/officer', admin: '/admin' };
    return <Navigate to={dashMap[user?.role] || '/citizen'} replace />;
  }
  return children;
};

// ── Router ────────────────────────────────────────────────────
const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />

      {/* Citizen */}
      <Route path="/citizen" element={<RequireAuth><RequireRole role="citizen"><CitizenDashboard /></RequireRole></RequireAuth>} />
      <Route path="/citizen/report" element={<RequireAuth><RequireRole role="citizen"><ReportIssuePage /></RequireRole></RequireAuth>} />
      <Route path="/citizen/issues" element={<RequireAuth><RequireRole role="citizen"><MyReportsPage /></RequireRole></RequireAuth>} />
      <Route path="/citizen/issues/:id" element={<RequireAuth><RequireRole role="citizen"><IssueDetailPage /></RequireRole></RequireAuth>} />

      {/* Officer */}
      <Route path="/officer" element={<RequireAuth><RequireRole role="officer"><OfficerDashboard /></RequireRole></RequireAuth>} />
      <Route path="/officer/issues" element={<RequireAuth><RequireRole role="officer"><AssignedIssuesPage /></RequireRole></RequireAuth>} />
      <Route path="/officer/issues/:id" element={<RequireAuth><RequireRole role="officer"><IssueUpdatePage /></RequireRole></RequireAuth>} />

      {/* Admin */}
      <Route path="/admin" element={<RequireAuth><RequireRole role="admin"><AdminDashboard /></RequireRole></RequireAuth>} />
      <Route path="/admin/issues" element={<RequireAuth><RequireRole role="admin"><AllIssuesPage /></RequireRole></RequireAuth>} />
      <Route path="/admin/users" element={<RequireAuth><RequireRole role="admin"><UsersPage /></RequireRole></RequireAuth>} />
      <Route path="/admin/categories" element={<RequireAuth><RequireRole role="admin"><CategoriesPage /></RequireRole></RequireAuth>} />
      <Route path="/admin/departments" element={<RequireAuth><RequireRole role="admin"><DepartmentsPage /></RequireRole></RequireAuth>} />

      {/* Shared */}
      <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </Suspense>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
