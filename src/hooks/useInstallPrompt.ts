import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = 'senda_install_prompt_dismissed_at';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  // iOS Safari
  return (window.navigator as any).standalone === true;
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => isStandalone());

  useEffect(() => {
    if (installed) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [installed]);

  const prompt = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable';
    try {
      await deferred.prompt();
      const result = await deferred.userChoice;
      setDeferred(null);
      if (result.outcome === 'dismissed') {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      }
      return result.outcome;
    } catch {
      return 'unavailable';
    }
  }, [deferred]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDeferred(null);
  }, []);

  const recentlyDismissed = (() => {
    const ts = Number(localStorage.getItem(DISMISSED_KEY));
    if (!Number.isFinite(ts) || !ts) return false;
    return Date.now() - ts < 7 * 24 * 60 * 60 * 1000;
  })();

  return {
    canInstall: !!deferred && !installed,
    installed,
    recentlyDismissed,
    prompt,
    dismiss,
  };
}
