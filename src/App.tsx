import { type ReactNode } from 'react';
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

// Auth Pages
import { SignUp } from './pages/Auth/SignUp';
import { Login } from './pages/Auth/Login';

// Dashboard Pages
import { DashboardHome } from './pages/Dashboard/DashboardHome';
import { AnalyticsDashboard } from './pages/Dashboard/AnalyticsDashboard';
import { TeamManagement } from './pages/Team/TeamManagement';

// Board Pages
import { CreateBoard } from './pages/Board/CreateBoard';
import { BoardDetails } from './pages/Board/BoardDetails';

// Submission Pages
import { SubmissionDetail } from './pages/Submission/SubmissionDetail';

// Public Pages
import { SubmitFeedback } from './pages/Public/SubmitFeedback';
import { TrackingPage } from './pages/Public/TrackingPage';

// Pricing Pages
import { PricingPage } from './pages/Pricing/PricingPage';

// Billing Pages
import { BillingPage } from './pages/Billing/BillingPage';

// Templates Pages
import { TemplatesPage } from './pages/Templates/TemplatesPage';

// Integrations Pages
import { IntegrationsPage } from './pages/Integrations/IntegrationsPage';

// Fallback
import { NotFound } from './pages/NotFound';

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
    <>
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

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
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
