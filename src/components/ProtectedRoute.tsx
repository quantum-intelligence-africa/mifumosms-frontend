import { PasskeyPrompt } from "@/components/auth/PasskeyPrompt";
import React, { useContext, useEffect } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { useFeatures } from '@/hooks/useFeatures';
import { useComingSoonFeatures } from '@/hooks/useComingSoonFeatures';
import {
  canUseCallCenter, hasIvrAccess, hasSmsAccess, isCallCenterAdmin, isCallCenterSupervisor,
} from '@/utils/roleUtils';
import { useLanguage } from '@/hooks/useLanguage';
import { ForcePasswordChange } from '@/components/callcenter/ForcePasswordChange';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePartner?: boolean;
  requireFeature?: string;
  requireIvrAccess?: boolean;
  requireSmsAccess?: boolean;
  /** Call-center access by role: any member, supervisors and above, or owners/admins only.
   *  The backend enforces the same rules; this just keeps people off screens that would 403. */
  requireCallCenter?: 'member' | 'supervisor' | 'admin';
  comingSoonKey?: string;
}

const REDIRECT_DELAY_MS = 3000;

/** "No access" screen that sends the user back to the dashboard after a short delay. */
const SmsAccessDenied: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/dashboard', { replace: true }), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2M7.08 6.47A9.959 9.959 0 0112 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12c0-1.821.487-3.53 1.333-5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t("pg.ProtectedRoute.0773")}</h2>
        <p className="text-text-subtle mb-4">
          {t("pg.ProtectedRoute.0774")}
        </p>
        <p className="text-sm text-text-subtle mb-6">
          {t("pg.ProtectedRoute.0775")}
        </p>
        <Link to="/dashboard" replace className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
          {t("pg.ProtectedRoute.0776")}
        </Link>
      </div>
    </div>
  );
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requirePartner = false, requireFeature, requireIvrAccess = false, requireSmsAccess = false, requireCallCenter, comingSoonKey }) => {
  const authContext = useContext(AuthContext);
  const location = useLocation();
  const { hasFeature, isLoading: featuresLoading } = useFeatures();
  const { isComingSoon } = useComingSoonFeatures();
  const { t } = useLanguage();

  // If context is not available, show loading
  if (!authContext) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-subtle">{t("pg.ProtectedRoute.0777")}</p>
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
          <p className="text-text-subtle">{t("pg.Contacts.0340")}</p>
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

  // An administrator issued this account a temporary password: nothing in the
  // app is reachable until the person has replaced it with their own.
  if (authContext.user?.must_change_password) {
    return <ForcePasswordChange />;
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
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("pg.ProtectedRoute.0778")}</h2>
          <p className="text-text-subtle mb-6">{t("pg.ProtectedRoute.0779")}</p>
          <div className="bg-surface rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-text-subtle font-medium mb-2">{t("pg.ProtectedRoute.0780")}</p>
            <ol className="text-sm text-text-subtle space-y-2 list-decimal list-inside">
              <li>{t("pg.ProtectedRoute.0781")} <strong>{t("pg.Settings.0200")}</strong></li>
              <li>{t("pg.ProtectedRoute.0782")} <strong>{t("pg.ProtectedRoute.0783")}</strong> {t("pg.ProtectedRoute.0784")}</li>
              <li>{t("pg.ProtectedRoute.0785")}</li>
              <li>{t("pg.ProtectedRoute.0786")}</li>
              <li>{t("pg.ProtectedRoute.0787")}</li>
            </ol>
          </div>
          <a href="/settings" className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            {t("pg.ProtectedRoute.0788")}
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
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("pg.ProtectedRoute.0789")}</h2>
          <p className="text-text-subtle mb-6">
            {t("pg.ProtectedRoute.0790")}
          </p>
          <Link to="/dashboard" className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            {t("pg.ProtectedRoute.0776")}
          </Link>
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
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("voice.access.title")}</h2>
          <p className="text-text-subtle mb-6">{t("voice.access.desc")}</p>
        </div>
      </div>
    );
  }

  // Call-center access is by organization role (agent / supervisor / owner / admin),
  // not by the per-user IVR grant — an agent never needs the flow builder.
  if (requireCallCenter) {
    const user = authContext.user;
    const allowed =
      canUseCallCenter(user) &&
      (requireCallCenter === 'member' ||
        (requireCallCenter === 'supervisor' && isCallCenterSupervisor(user)) ||
        (requireCallCenter === 'admin' && isCallCenterAdmin(user)));
    if (!allowed) {
      return (
        <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t("voice.access.title")}</h2>
            <p className="text-text-subtle mb-6">
              {requireCallCenter === 'admin'
                ? t("pg.ProtectedRoute.0791")
                : requireCallCenter === 'supervisor'
                  ? t("pg.ProtectedRoute.0792")
                  : t("voice.access.desc")}
            </p>
            <Link to="/call-center" className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
              {t("pg.ProtectedRoute.0793")}
            </Link>
          </div>
        </div>
      );
    }
  }

  // Check per-user SMS access grant - admin-controlled, independent of plan/billing
  if (requireSmsAccess && !hasSmsAccess(authContext.user)) {
    return <SmsAccessDenied />;
  }

  // Check feature access if required - wait for the features query before deciding
  if (requireFeature && featuresLoading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-subtle">{t("pg.Contacts.0340")}</p>
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
          <h2 className="text-2xl font-bold text-foreground mb-2">{t("pg.ProtectedRoute.0794")}</h2>
          <p className="text-text-subtle mb-6">{t("pg.ProtectedRoute.0795")}</p>
          <div className="bg-surface rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-text-subtle font-medium mb-2">{t("pg.ProtectedRoute.0796")}</p>
            <ol className="text-sm text-text-subtle space-y-2 list-decimal list-inside">
              <li>{t("pg.ProtectedRoute.0781")} <strong>{t("pg.Settings.0200")}</strong></li>
              <li>{t("pg.ProtectedRoute.0782")} <strong>{t("pg.ProtectedRoute.0797")}</strong> {t("pg.ProtectedRoute.0784")}</li>
              <li>{t("pg.ProtectedRoute.0798")}</li>
              <li>{t("pg.ProtectedRoute.0799")}</li>
            </ol>
          </div>
          <a href="/settings" className="inline-flex items-center justify-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            {t("pg.ProtectedRoute.0800")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <PasskeyPrompt />
      {children}
    </>
  );
};
