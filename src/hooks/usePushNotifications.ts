import { useCallback, useEffect, useState } from 'react';
import {
  disablePushNotifications,
  enablePushNotifications,
  getNotificationPermission,
  isPushSupported,
  sendTestPush,
} from '@/lib/pushClient';

type Status = 'unsupported' | 'denied' | 'default' | 'subscribed' | 'unsubscribed';

export function usePushNotifications() {
  const [status, setStatus] = useState<Status>('default');
  const [busy, setBusy] = useState(false);
  const supported = isPushSupported();

  const refresh = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    const permission = getNotificationPermission();
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }
    if (permission === 'default') {
      setStatus('default');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setStatus(sub ? 'subscribed' : 'unsubscribed');
    } catch {
      setStatus('unsubscribed');
    }
  }, [supported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await enablePushNotifications({ requestPermission: true });
      await refresh();
      return result.ok;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await disablePushNotifications();
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const sendTest = useCallback(async () => {
    setBusy(true);
    try {
      return await sendTestPush({
        title: 'SENDA test notification',
        body: 'If you see this, push notifications are working.',
        url: '/notifications',
      });
    } finally {
      setBusy(false);
    }
  }, []);

  return { status, busy, supported, enable, disable, sendTest, refresh };
}
