import { type ReactNode, Suspense, lazy } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useTemplateInit } from './hooks/useTemplateInit';
import { useRTL } from './hooks/useRTL';
import { Navbar } from './components/Navigation/Navbar';
import { LoadingSpinner } from './components/Shared';
import { ErrorBoundary } from './components/Shared/ErrorBoundary';

// Auth Pages
const SignUp = lazy(() => import('./pages/Auth/SignUp').then(m => ({ default: m.SignUp })));
const Login = lazy(() => import('./pages/Auth/Login').then(m => ({ default: m.Login })));

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

// Integrations Pages
const IntegrationsPage = lazy(() => import('./pages/Integrations/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));

// Developer Pages
const DeveloperDashboard = lazy(() => import('./pages/Developer/DeveloperDashboard'));

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
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
        {/* Auth Routes */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

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
            <ProtectedRoute>
              <TemplatesPage />
            </ProtectedRoute>
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
            <ProtectedRoute>
              <Navbar />
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute>
              <Navbar />
              <TeamManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <Navbar />
              <IntegrationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/developer"
          element={
            <ProtectedRoute>
              <Navbar />
              <DeveloperDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/create"
          element={
            <ProtectedRoute>
              <Navbar />
              <CreateBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/:boardId"
          element={
            <ProtectedRoute>
              <Navbar />
              <BoardDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submission/:submissionId"
          element={
            <ProtectedRoute>
              <Navbar />
              <SubmissionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <Navbar />
              <SubmissionsPage />
            </ProtectedRoute>
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
  useTemplateInit();
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
