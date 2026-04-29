import { type ReactNode, Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useTemplateInit } from './hooks/useTemplateInit';
import { useRTL } from './hooks/useRTL';
import { Navbar } from './components/Navigation/Navbar';
import { LoadingSpinner } from './components/Shared';
import { TrialBanner } from './components/Shared/TrialBanner';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';
import { OfflineIndicator } from './components/Shared/OfflineIndicator';
import { hasPermission, type Permission } from './lib/rbac';

// Auth Pages
const SignUp = lazy(() => import('./pages/Auth/SignUp').then(m => ({ default: m.SignUp })));
const Login = lazy(() => import('./pages/Auth/Login').then(m => ({ default: m.Login })));
const AcceptInvite = lazy(() => import('./pages/Auth/AcceptInvite').then(m => ({ default: m.AcceptInvite })));

// Dashboard Pages
const DashboardHome = lazy(() => import('./pages/Dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const AnalyticsDashboard = lazy(() => import('./pages/Dashboard/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const TeamManagement = lazy(() => import('./pages/Team/TeamManagement').then(m => ({ default: m.TeamManagement })));

// Board Pages
const CreateBoard = lazy(() => import('./pages/Board/CreateBoard').then(m => ({ default: m.CreateBoard })));
const BoardDetails = lazy(() => import('./pages/Board/BoardDetails').then(m => ({ default: m.BoardDetails })));

// Submission Pages
const SubmissionDetail = lazy(() => import('./pages/Submission/SubmissionDetail').then(m => ({ default: m.SubmissionDetail })));
const SubmissionsPage = lazy(() => import('./pages/Submission/SubmissionsPage').then(m => ({ default: m.SubmissionsPage })));

// Public Pages
const SubmitFeedback = lazy(() => import('./pages/Public/SubmitFeedback').then(m => ({ default: m.SubmitFeedback })));
const TrackingPage = lazy(() => import('./pages/Public/TrackingPage').then(m => ({ default: m.TrackingPage })));

// Pricing Pages
const PricingPage = lazy(() => import('./pages/Pricing/PricingPage').then(m => ({ default: m.PricingPage })));

// Billing Pages
const BillingPage = lazy(() => import('./pages/Billing/BillingPage').then(m => ({ default: m.BillingPage })));

// Templates Pages
const TemplatesPage = lazy(() => import('./pages/Templates/TemplatesPage').then(m => ({ default: m.TemplatesPage })));

// Branding Pages
const BrandingPage = lazy(() => import('./pages/Branding/BrandingPage').then(m => ({ default: m.BrandingPage })));

// Audit Logs Pages
const AuditLogsPage = lazy(() => import('./pages/AuditLogs/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));

// Fallback
import { NotFound } from './pages/NotFound';

const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PermissionRoute({ children, permission }: { children: ReactNode; permission: Permission }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = user.role.toLowerCase();
  const isPrivilegedRole = normalizedRole === 'owner' || normalizedRole === 'admin';

  if (!isPrivilegedRole && !hasPermission(user.role, permission)) {
    return <Navigate to="/submissions" replace />;
  }

  return children;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return children;
}

function AppContent() {
  useTemplateInit();

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors closeButton />
      <TrialBanner />
      <OfflineIndicator />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
        {/* Auth Routes */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />

        {/* Public Routes */}
        <Route
          path="/pricing"
          element={
            <PublicRoute>
              <PricingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/submit/:slug"
          element={
            <PublicRoute>
              <SubmitFeedback />
            </PublicRoute>
          }
        />
        <Route
          path="/track"
          element={
            <PublicRoute>
              <TrackingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/track/:code"
          element={
            <PublicRoute>
              <TrackingPage />
            </PublicRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <PermissionRoute permission="submissions:create">
              <TemplatesPage />
            </PermissionRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navbar />
              <DashboardHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PermissionRoute permission="analytics:read">
              <Navbar />
              <AnalyticsDashboard />
            </PermissionRoute>
          }
        />
        <Route
          path="/team"
          element={
            <PermissionRoute permission="team:read">
              <Navbar />
              <TeamManagement />
            </PermissionRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <PermissionRoute permission="billing:read">
              <Navbar />
              <BillingPage />
            </PermissionRoute>
          }
        />
        <Route path="/integrations" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/branding"
          element={
            <PermissionRoute permission="company:update">
              <Navbar />
              <BrandingPage />
            </PermissionRoute>
          }
        />
        <Route path="/developer" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/audit-logs"
          element={
            <PermissionRoute permission="audit:read">
              <Navbar />
              <AuditLogsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/board/create"
          element={
            <PermissionRoute permission="submissions:create">
              <Navbar />
              <CreateBoard />
            </PermissionRoute>
          }
        />
        <Route
          path="/board/:boardId"
          element={
            <PermissionRoute permission="submissions:create">
              <Navbar />
              <BoardDetails />
            </PermissionRoute>
          }
        />
        <Route
          path="/submission/:submissionId"
          element={
            <PermissionRoute permission="submissions:read">
              <Navbar />
              <SubmissionDetail />
            </PermissionRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <PermissionRoute permission="submissions:read">
              <Navbar />
              <SubmissionsPage />
            </PermissionRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  useRTL();

  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
