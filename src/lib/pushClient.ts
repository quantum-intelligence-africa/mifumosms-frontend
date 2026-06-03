import { API_CONFIG, buildApiUrl } from '@/config/api';

const SUBSCRIBED_ENDPOINT_KEY = 'senda_push_endpoint';
const PERMISSION_PROMPT_DISMISSED_KEY = 'senda_push_soft_dismissed_at';

function urlB64ToUint8Array(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
}

export function softPromptDismissedRecently(thresholdMs = 7 * 24 * 60 * 60 * 1000): boolean {
  const ts = localStorage.getItem(PERMISSION_PROMPT_DISMISSED_KEY);
  if (!ts) return false;
  const dismissedAt = Number(ts);
  if (!Number.isFinite(dismissedAt)) return false;
  return Date.now() - dismissedAt < thresholdMs;
}

export function markSoftPromptDismissed(): void {
  localStorage.setItem(PERMISSION_PROMPT_DISMISSED_KEY, String(Date.now()));
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) return existing;
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.warn('[push] service worker registration failed:', err);
    return null;
  }
}

async function fetchVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.PUSH.VAPID_PUBLIC_KEY), {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.public_key || json?.data?.public_key || null;
  } catch (err) {
    console.warn('[push] failed to fetch VAPID key:', err);
    return null;
  }
}

async function postSubscription(subscription: PushSubscription): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.PUSH.SUBSCRIBE), {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify(subscription.toJSON()),
    });
    if (res.ok) {
      localStorage.setItem(SUBSCRIBED_ENDPOINT_KEY, subscription.endpoint);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[push] subscribe POST failed:', err);
    return false;
  }
}

export async function enablePushNotifications(opts: { requestPermission?: boolean } = {}): Promise<{
  ok: boolean;
  reason?: 'unsupported' | 'permission-denied' | 'no-vapid-key' | 'subscribe-failed' | 'error';
  subscription?: PushSubscription;
}> {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' };

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, reason: 'error' };

  let permission = Notification.permission;
  if (permission === 'default' && opts.requestPermission !== false) {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = 'denied';
    }
  }
  if (permission !== 'granted') {
    return { ok: false, reason: 'permission-denied' };
  }

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const publicKey = await fetchVapidPublicKey();
    if (!publicKey) return { ok: false, reason: 'no-vapid-key' };
    try {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(publicKey),
      });
    } catch (err) {
      console.warn('[push] subscribe() failed:', err);
      return { ok: false, reason: 'subscribe-failed' };
    }
  }

  const lastEndpoint = localStorage.getItem(SUBSCRIBED_ENDPOINT_KEY);
  if (lastEndpoint !== subscription.endpoint) {
    const ok = await postSubscription(subscription);
    if (!ok) return { ok: false, reason: 'subscribe-failed', subscription };
  }

  return { ok: true, subscription };
}

export async function disablePushNotifications(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      try {
        await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.PUSH.UNSUBSCRIBE), {
          method: 'POST',
          headers: authHeaders(),
          credentials: 'include',
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      } catch (err) {
        console.warn('[push] unsubscribe POST failed:', err);
      }
      try {
        await sub.unsubscribe();
      } catch (err) {
        console.warn('[push] sub.unsubscribe() failed:', err);
      }
    }
  } finally {
    localStorage.removeItem(SUBSCRIBED_ENDPOINT_KEY);
  }
}

export async function sendTestPush(payload: { title?: string; body?: string; url?: string } = {}): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS.PUSH.TEST), {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function attachSubscriptionChangeListener(): () => void {
  if (!isPushSupported()) return () => {};
  const onMessage = async (event: MessageEvent) => {
    if (event.data?.type !== 'PUSH_SUBSCRIPTION_CHANGED') return;
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) await postSubscription(sub);
    } catch (err) {
      console.warn('[push] failed to re-post rotated subscription:', err);
    }
  };
  navigator.serviceWorker.addEventListener('message', onMessage);
  return () => navigator.serviceWorker.removeEventListener('message', onMessage);
}
