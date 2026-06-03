// SENDA Service Worker — handles push notifications and offline shell.
// Bumped on each deploy via Vite's cache-busting on the registration URL.
const SW_VERSION = 'senda-sw-v1';
const APP_NAME = 'SENDA';
const DEFAULT_ICON = '/favicon/web-app-manifest-192x192.png';
const DEFAULT_BADGE = '/favicon/favicon-96x96.png';

self.addEventListener('install', (event) => {
  // Take control on next load instead of waiting for tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push event — show a native OS notification.
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (err) {
      payload = { title: APP_NAME, body: event.data.text() };
    }
  }

  const title = payload.title || APP_NAME;
  const options = {
    body: payload.body || '',
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    image: payload.image,
    tag: payload.tag || 'senda-push',
    data: {
      url: payload.url || payload.data?.url || '/dashboard',
      ...(payload.data || {}),
    },
    requireInteraction: !!payload.requireInteraction,
    silent: !!payload.silent,
    vibrate: payload.vibrate || [120, 60, 120],
    actions: payload.actions || [],
    renotify: payload.renotify ?? true,
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — focus an existing tab if possible, otherwise open one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/dashboard';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client) {
            try {
              if (client.url === absoluteUrl) {
                return client.focus();
              }
            } catch (_) {
              // ignore cross-origin clients
            }
          }
        }
        // Otherwise focus any open window and navigate it.
        for (const client of clients) {
          if ('focus' in client && 'navigate' in client) {
            return client.focus().then((focused) => focused.navigate(absoluteUrl));
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(absoluteUrl);
        }
        return null;
      })
  );
});

// Browser rotated the push subscription — re-register transparently.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const oldSub = event.oldSubscription;
        const appServerKey = oldSub?.options?.applicationServerKey;
        const newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
        // Notify any active client so it POSTs the new subscription to the backend.
        const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
        for (const client of clients) {
          client.postMessage({
            type: 'PUSH_SUBSCRIPTION_CHANGED',
            subscription: newSub.toJSON(),
            oldEndpoint: oldSub?.endpoint || null,
          });
        }
      } catch (err) {
        // Swallow — there's nothing else we can do from the worker without a fetch base URL.
      }
    })()
  );
});

// Allow the page to ask the worker to skip waiting on a fresh deploy.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
