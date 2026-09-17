import { Bell, BellOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

export function PushSettingsCard() {
  const { status, busy, supported, enable, disable, sendTest } = usePushNotifications();
  const { t } = useLanguage();

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> {t("pwa.push_settings.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("pwa.push_settings.unsupported_desc")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleEnable = async () => {
    const ok = await enable();
    toast({
      title: ok ? t("pwa.notifications_enabled_title") : t("pwa.enable_failed_title"),
      description: ok
        ? t("pwa.push_settings.enabled_desc")
        : t("pwa.push_settings.enable_failed_desc"),
      variant: ok ? 'default' : 'destructive',
    });
  };

  const handleDisable = async () => {
    await disable();
    toast({
      title: t("pwa.push_settings.disabled_title"),
      description: t("pwa.push_settings.disabled_desc"),
    });
  };

  const handleTest = async () => {
    const ok = await sendTest();
    toast({
      title: ok ? t("pwa.push_settings.test_sent_title") : t("pwa.push_settings.test_failed_title"),
      description: ok
        ? t("pwa.push_settings.test_sent_desc")
        : t("pwa.push_settings.test_failed_desc"),
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> {t("pwa.push_settings.title")}
          </span>
          {status === 'subscribed' && <Badge>{t("common.enabled")}</Badge>}
          {status === 'denied' && <Badge variant="destructive">{t("pwa.push_settings.blocked_badge")}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === 'denied' ? (
          <p className="text-sm text-muted-foreground">
            {t("pwa.push_settings.denied_desc")}
          </p>
        ) : status === 'subscribed' ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t("pwa.push_settings.subscribed_desc")}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleTest} disabled={busy}>
                <Send className="mr-2 h-3.5 w-3.5" /> {t("pwa.push_settings.send_test_button")}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDisable} disabled={busy}>
                <BellOff className="mr-2 h-3.5 w-3.5" /> {t("pwa.push_settings.turn_off_button")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t("pwa.push_settings.not_subscribed_desc")}
            </p>
            <Button size="sm" onClick={handleEnable} disabled={busy}>
              <Bell className="mr-2 h-3.5 w-3.5" />
              {busy ? t("pwa.enabling") : t("pwa.enable_notifications_button")}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
