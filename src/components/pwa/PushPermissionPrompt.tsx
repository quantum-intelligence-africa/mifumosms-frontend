import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  enablePushNotifications,
  markSoftPromptDismissed,
} from '@/lib/pushClient';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface PushPermissionPromptProps {
  onDismiss: () => void;
  onEnabled: () => void;
}

export function PushPermissionPrompt({ onDismiss, onEnabled }: PushPermissionPromptProps) {
  const [busy, setBusy] = useState(false);
  const { t } = useLanguage();

  const handleEnable = async () => {
    setBusy(true);
    try {
      const result = await enablePushNotifications({ requestPermission: true });
      if (result.ok) {
        toast({
          title: t("pwa.notifications_enabled_title"),
          description: t("pwa.push_prompt.enabled_toast_desc"),
        });
        onEnabled();
      } else if (result.reason === 'permission-denied') {
        toast({
          title: t("pwa.notifications_blocked_title"),
          description: t("pwa.notifications_blocked_desc"),
          variant: 'destructive',
        });
        onDismiss();
      } else {
        toast({
          title: t("pwa.enable_failed_title"),
          description: t("pwa.push_prompt.enable_failed_desc"),
          variant: 'destructive',
        });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    markSoftPromptDismissed();
    onDismiss();
  };

  return (
    <div
      role="dialog"
      aria-label={t("pwa.push_prompt.aria_label")}
      className="fixed left-1/2 z-[90] w-[min(420px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in slide-in-from-bottom-4 fade-in bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            {t("pwa.push_prompt.title")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("pwa.push_prompt.desc")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={handleEnable} disabled={busy}>
              {busy ? t("pwa.enabling") : t("pwa.enable_notifications_button")}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={busy}>
              {t("pwa.not_now")}
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("pwa.dismiss_aria")}
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
