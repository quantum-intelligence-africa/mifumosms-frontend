/**
 * Auth session helpers: "Remember me" persistence + inactivity (idle) auto-logout.
 *
 * Tokens stay in localStorage (read directly across the app), so persistence is
 * controlled with two extra signals instead of moving tokens to sessionStorage:
 *
 *  - Remember me OFF → a sessionStorage "sentinel" is written at login. sessionStorage
 *    is cleared when the browser/tab is closed, so on the next launch the sentinel is
 *    gone and we force a logout (session-only behaviour).
 *  - Remember me ON  → no sentinel requirement; the session survives browser restarts
 *    (until the refresh token expires).
 *
 * Independently, a "last activity" timestamp drives a 3-hour idle timeout that applies
 * in both modes.
 */

export const IDLE_LIMIT_MS = 3 * 60 * 60 * 1000; // 3 hours

const REMEMBER_KEY = 'auth_remember';
const SESSION_SENTINEL_KEY = 'auth_session_active';
const LAST_ACTIVITY_KEY = 'auth_last_activity';

/** Record the chosen "remember me" preference and mark the current browser session active. */
export const setRememberMe = (remember: boolean): void => {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
    markSessionActive();
    recordActivity();
  } catch {
    /* storage unavailable — ignore */
  }
};

export const isRemembered = (): boolean => {
  try {
    return localStorage.getItem(REMEMBER_KEY) === 'true';
  } catch {
    return false;
  }
};

/** Raw preference: 'true' | 'false' | null (absent = never set this device). */
const getRememberPref = (): string | null => {
  try {
    return localStorage.getItem(REMEMBER_KEY);
  } catch {
    return null;
  }
};

/** Mark this browser session as active (lives until the tab/browser is closed). */
export const markSessionActive = (): void => {
  try {
    sessionStorage.setItem(SESSION_SENTINEL_KEY, '1');
  } catch {
    /* ignore */
  }
};

const hasSessionSentinel = (): boolean => {
  try {
    return sessionStorage.getItem(SESSION_SENTINEL_KEY) === '1';
  } catch {
    return false;
  }
};

/** Stamp "now" as the last activity time. */
export const recordActivity = (): void => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};

export const getLastActivity = (): number => {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

/** True if the last recorded activity is older than the idle limit. */
export const isIdleExpired = (): boolean => {
  const last = getLastActivity();
  if (!last) return false; // no baseline yet → don't force logout
  return Date.now() - last > IDLE_LIMIT_MS;
};

/**
 * Decide on app load whether a currently-stored session must be terminated:
 *  - idle timeout exceeded, or
 *  - "remember me" was OFF and the browser session sentinel is gone (browser was closed).
 * Only relevant when an access token is actually present.
 */
export const shouldForceLogoutOnLoad = (): boolean => {
  let hasToken = false;
  try {
    hasToken = !!localStorage.getItem('access_token');
  } catch {
    hasToken = false;
  }
  if (!hasToken) return false;

  if (isIdleExpired()) return true;
  // Only force a session-only logout when "remember me" was explicitly declined.
  // An absent preference (existing sessions, signup flows) is treated as persistent.
  if (getRememberPref() === 'false' && !hasSessionSentinel()) return true;
  return false;
};

/** Clear all auth-session bookkeeping (tokens are cleared by the caller/auth flow). */
export const clearAuthSession = (): void => {
  try {
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    sessionStorage.removeItem(SESSION_SENTINEL_KEY);
  } catch {
    /* ignore */
  }
};
