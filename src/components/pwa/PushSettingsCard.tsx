import { Bell, BellOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/use-toast';

export function PushSettingsCard() {
  const { status, busy, supported, enable, disable, sendTest } = usePushNotifications();

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> Push notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This browser doesn't support push notifications. Try Chrome, Edge, or Safari 16.4+.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleEnable = async () => {
    const ok = await enable();
    toast({
      title: ok ? 'Notifications enabled' : "Couldn't enable notifications",
      description: ok
        ? "You'll receive alerts even when SENDA isn't open."
        : 'Permission was not granted, or the browser refused to subscribe.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  const handleDisable = async () => {
    await disable();
    toast({
      title: 'Notifications disabled',
      description: 'You will no longer receive push alerts on this device.',
    });
  };

  const handleTest = async () => {
    const ok = await sendTest();
    toast({
      title: ok ? 'Test push sent' : 'Test push failed',
      description: ok
        ? 'A notification should arrive in a moment.'
        : 'The server rejected the request.',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Push notifications
          </span>
          {status === 'subscribed' && <Badge>Enabled</Badge>}
          {status === 'denied' && <Badge variant="destructive">Blocked</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === 'denied' ? (
          <p className="text-sm text-muted-foreground">
            Notifications are blocked. Re-enable them from your browser's site settings.
          </p>
        ) : status === 'subscribed' ? (
          <>
            <p className="text-sm text-muted-foreground">
              You'll get delivery reports, replies, and account events as native notifications.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleTest} disabled={busy}>
                <Send className="mr-2 h-3.5 w-3.5" /> Send test
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDisable} disabled={busy}>
                <BellOff className="mr-2 h-3.5 w-3.5" /> Turn off
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Get instant alerts even when SENDA isn't open in a tab.
            </p>
            <Button size="sm" onClick={handleEnable} disabled={busy}>
              <Bell className="mr-2 h-3.5 w-3.5" />
              {busy ? 'Enabling…' : 'Enable notifications'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
