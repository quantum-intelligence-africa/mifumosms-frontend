import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePartner?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requirePartner = false }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();

  // If context is not available, show loading
  if (!authContext) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-subtle">Initializing...</p>
        </div>
      </div>
    );
  }

  const { isAuthenticated, isLoading, user } = authContext;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-subtle">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access to dashboard if there's a pending email activation (user just registered)
  const pendingActivation = localStorage.getItem('pending_email_activation');
  const isDashboardRoute = location.pathname === '/dashboard';

  if (!isAuthenticated) {
    // Allow temporary access to dashboard for pending activation
    if (isDashboardRoute && pendingActivation) {
      return <>{children}</>;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check partner role if required
  if (requirePartner && !user?.is_partina) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9.959 9.959 0 0112 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.333-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Partner Access Required</h2>
          <p className="text-text-subtle mb-6">This feature is exclusively for Mifumo Connect Partners.</p>
          <div className="bg-surface rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-text-subtle font-medium mb-2">How to Get Partner Access:</p>
            <ol className="text-sm text-text-subtle space-y-2 list-decimal list-inside">
              <li>Go to <strong>Settings</strong></li>
              <li>Find the <strong>Partner</strong> section</li>
              <li>Submit your partner request</li>
              <li>Wait for admin approval</li>
              <li>Once approved, you'll see partner features</li>
            </ol>
          </div>
          <a href="/settings" className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            Request Partner Status
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
