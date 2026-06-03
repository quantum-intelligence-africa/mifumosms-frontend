import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  enablePushNotifications,
  markSoftPromptDismissed,
} from '@/lib/pushClient';
import { toast } from '@/hooks/use-toast';

interface PushPermissionPromptProps {
  onDismiss: () => void;
  onEnabled: () => void;
}

export function PushPermissionPrompt({ onDismiss, onEnabled }: PushPermissionPromptProps) {
  const [busy, setBusy] = useState(false);

  const handleEnable = async () => {
    setBusy(true);
    try {
      const result = await enablePushNotifications({ requestPermission: true });
      if (result.ok) {
        toast({
          title: 'Notifications enabled',
          description: "You'll now get alerts even when SENDA isn't open.",
        });
        onEnabled();
      } else if (result.reason === 'permission-denied') {
        toast({
          title: 'Notifications blocked',
          description: 'You can re-enable them in your browser settings.',
          variant: 'destructive',
        });
        onDismiss();
      } else {
        toast({
          title: "Couldn't enable notifications",
          description: 'Please try again in a moment.',
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
      aria-label="Enable notifications"
      className="fixed left-1/2 z-[90] w-[min(420px,calc(100vw-1.5rem))] -translate-x-1/2 rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in slide-in-from-bottom-4 fade-in bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            Get instant alerts from SENDA
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Delivery reports, replies, and account events — even when SENDA isn't open.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={handleEnable} disabled={busy}>
              {busy ? 'Enabling…' : 'Enable notifications'}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} disabled={busy}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
