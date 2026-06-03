import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  attachSubscriptionChangeListener,
  disablePushNotifications,
  enablePushNotifications,
  getNotificationPermission,
  isPushSupported,
  registerServiceWorker,
  softPromptDismissedRecently,
} from '@/lib/pushClient';
import { InstallAppPrompt } from './InstallAppPrompt';
import { PushPermissionPrompt } from './PushPermissionPrompt';

const SOFT_PROMPT_DELAY_MS = 8000;

// Single place that bootstraps PWA lifecycle:
//   - registers the service worker on app load
//   - silently re-subscribes already-granted users after login
//   - shows soft permission prompt for first-time authenticated users
//   - unsubscribes when the user logs out
export function PWAManager() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSoftPrompt, setShowSoftPrompt] = useState(false);
  const wasAuthenticatedRef = useRef(false);
  const enableAttemptedRef = useRef(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    registerServiceWorker();
    const detach = attachSubscriptionChangeListener();
    return detach;
  }, []);

  // React to auth transitions.
  useEffect(() => {
    if (isLoading) return;
    if (!isPushSupported()) return;

    const wasAuth = wasAuthenticatedRef.current;
    wasAuthenticatedRef.current = isAuthenticated;

    if (isAuthenticated) {
      const permission = getNotificationPermission();
      if (permission === 'granted') {
        // Already approved — silently (re-)post the subscription.
        if (!enableAttemptedRef.current) {
          enableAttemptedRef.current = true;
          enablePushNotifications({ requestPermission: false }).catch(() => {});
        }
        setShowSoftPrompt(false);
      } else if (permission === 'default' && !softPromptDismissedRecently()) {
        const timer = window.setTimeout(() => setShowSoftPrompt(true), SOFT_PROMPT_DELAY_MS);
        return () => window.clearTimeout(timer);
      } else {
        setShowSoftPrompt(false);
      }
    } else if (wasAuth) {
      // Just logged out.
      setShowSoftPrompt(false);
      enableAttemptedRef.current = false;
      disablePushNotifications().catch(() => {});
    }
  }, [isAuthenticated, isLoading]);

  return (
    <>
      <InstallAppPrompt />
      {showSoftPrompt && (
        <PushPermissionPrompt
          onDismiss={() => setShowSoftPrompt(false)}
          onEnabled={() => setShowSoftPrompt(false)}
        />
      )}
    </>
  );
}
