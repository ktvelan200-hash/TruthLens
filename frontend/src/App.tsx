import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/Loading';
import { Suspense, lazy } from 'react';

// Pages – lazy loaded for code splitting
const Home        = lazy(() => import('@/pages/Home'));
const Login       = lazy(() => import('@/pages/Login'));
const Register    = lazy(() => import('@/pages/Register'));
const Dashboard   = lazy(() => import('@/pages/Dashboard'));
const NewsSearch  = lazy(() => import('@/pages/NewsSearch'));
const AnalyzeNews = lazy(() => import('@/pages/AnalyzeNews'));
const History     = lazy(() => import('@/pages/History'));

// ---------------------------------------------------------------------------
// Guard – redirect unauthenticated users to /login
// ---------------------------------------------------------------------------
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Guard – redirect authenticated users away from auth pages
// ---------------------------------------------------------------------------
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Layout wrapper – Navbar + page content
// ---------------------------------------------------------------------------
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root App
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes with Navbar */}
        <Route path="/" element={
          <Layout><Home /></Layout>
        } />
        <Route path="/news" element={
          <Layout><NewsSearch /></Layout>
        } />
        <Route path="/analyze" element={
          <Layout><AnalyzeNews /></Layout>
        } />

        {/* Auth pages – no Navbar, redirect if already logged in */}
        <Route path="/login" element={
          <RedirectIfAuth><Login /></RedirectIfAuth>
        } />
        <Route path="/register" element={
          <RedirectIfAuth><Register /></RedirectIfAuth>
        } />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <RequireAuth>
            <Layout><Dashboard /></Layout>
          </RequireAuth>
        } />
        <Route path="/history" element={
          <RequireAuth>
            <Layout><History /></Layout>
          </RequireAuth>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
