import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { useFeatures } from '@/hooks/useFeatures';
import { useComingSoonFeatures } from '@/hooks/useComingSoonFeatures';
import { hasIvrAccess, hasSmsAccess } from '@/utils/roleUtils';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePartner?: boolean;
  requireFeature?: string;
  requireIvrAccess?: boolean;
  requireSmsAccess?: boolean;
  comingSoonKey?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requirePartner = false, requireFeature, requireIvrAccess = false, requireSmsAccess = false, comingSoonKey }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();
  const { hasFeature, isLoading: featuresLoading } = useFeatures();
  const { isComingSoon } = useComingSoonFeatures();

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

  const { isAuthenticated, isLoading } = authContext;

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

  // Check partner role if required - use context method for proper validation
  if (requirePartner && !authContext.isPartina()) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9.959 9.959 0 0112 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.333-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Partner Access Required</h2>
          <p className="text-text-subtle mb-6">This feature is exclusively for Mifumo Connect Partners (Partina).</p>
          <div className="bg-surface rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-text-subtle font-medium mb-2">How to Get Partina Access:</p>
            <ol className="text-sm text-text-subtle space-y-2 list-decimal list-inside">
              <li>Go to <strong>Settings</strong></li>
              <li>Find the <strong>Partina/Partner</strong> section</li>
              <li>Submit your Partina request</li>
              <li>Wait for admin approval</li>
              <li>Once approved, you'll see Partina features</li>
            </ol>
          </div>
          <a href="/settings" className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            Request Partina Status
          </a>
        </div>
      </div>
    );
  }

  // Check platform-wide "Coming Soon" flag - same lock for every user, set
  // from the SENDA admin dashboard's Coming Soon tab, independent of any
  // per-user or per-tenant access grant.
  if (comingSoonKey && isComingSoon(comingSoonKey)) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Coming Soon</h2>
          <p className="text-text-subtle mb-6">
            This feature isn't available yet — we're still working on it. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  // Check per-user IVR access grant - admin-controlled, independent of plan/billing
  if (requireIvrAccess && !hasIvrAccess(authContext.user)) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9.959 9.959 0 0112 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.333-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Voice / IVR Access Required</h2>
          <p className="text-text-subtle mb-6">
            You don't have access to Voice / IVR yet. Ask a workspace admin
            or SENDA support to enable it for your account.
          </p>
        </div>
      </div>
    );
  }

  // Check per-user SMS access grant - admin-controlled, independent of plan/billing
  if (requireSmsAccess && !hasSmsAccess(authContext.user)) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9.959 9.959 0 0112 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.333-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">SMS Access Required</h2>
          <p className="text-text-subtle mb-6">
            You don't have access to SMS/messaging. Ask a workspace admin
            or SENDA support to enable it for your account.
          </p>
        </div>
      </div>
    );
  }

  // Check feature access if required - wait for the features query before deciding
  if (requireFeature && featuresLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-subtle">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireFeature && !hasFeature(requireFeature)) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9.959 9.959 0 0112 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.333-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Upgrade Required</h2>
          <p className="text-text-subtle mb-6">This feature isn't included in your current plan.</p>
          <div className="bg-surface rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-text-subtle font-medium mb-2">How to Get Access:</p>
            <ol className="text-sm text-text-subtle space-y-2 list-decimal list-inside">
              <li>Go to <strong>Settings</strong></li>
              <li>Find the <strong>Billing/Plan</strong> section</li>
              <li>Upgrade to a plan that includes this feature</li>
              <li>Once upgraded, you'll see it unlocked here</li>
            </ol>
          </div>
          <a href="/settings" className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
