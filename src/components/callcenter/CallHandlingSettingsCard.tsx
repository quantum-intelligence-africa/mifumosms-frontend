// Wrap-up (after-call work) time and voicemail email alerts: the organization's own call-handling settings (owner/admin).
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { ccKey } from "@/i18n/callCenter";
import { callCenterApi, describeError } from "@/services/callCenterApi";

const WRAPUP_MINUTES = [0, 1, 2, 5, 10, 15, 30, 60];

export function CallHandlingSettingsCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [acw, setAcw] = useState(10);
  const [alerts, setAlerts] = useState(false);
  const [emails, setEmails] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void callCenterApi.settings.get().then((res) => {
      if (res.success && res.data) {
        setAcw(Math.round((res.data.acw_seconds ?? 600) / 60));
        setAlerts(!!res.data.voicemail_alert_enabled);
        setEmails((res.data.voicemail_alert_emails ?? []).join("\n"));
        setLoaded(true);
      }
    });
  }, []);

  if (!loaded) return null; // not an owner/admin, or not loaded: nothing to show

  const options = WRAPUP_MINUTES.includes(acw) ? WRAPUP_MINUTES : [...WRAPUP_MINUTES, acw].sort((a, b) => a - b);
  const save = async () => {
    setSaving(true);
    const res = await callCenterApi.settings.patch({ acw_seconds: acw * 60, voicemail_alert_enabled: alerts, voicemail_alert_emails: emails });
    setSaving(false);
    if (res.success) toast({ title: t(ccKey("cc.settings.saved")) });
    else toast({ title: t(ccKey("cc.settings.save_failed")), description: describeError(res), variant: "destructive" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t(ccKey("cc.settings.title"))}</CardTitle>
        <p className="text-sm text-muted-foreground">{t(ccKey("cc.settings.subtitle"))}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="acw">{t(ccKey("cc.settings.wrapup"))}</Label>
          <select
            id="acw" value={acw} onChange={(e) => setAcw(Number(e.target.value))}
            className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm"
          >
            {options.map((m) => <option key={m} value={m}>{m === 0 ? t(ccKey("cc.settings.wrapup_none")) : t(ccKey("cc.settings.minutes"), { n: m })}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">{t(ccKey("cc.settings.wrapup_help"))}</p>
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={alerts} onCheckedChange={(v) => setAlerts(v === true)} />
            {t(ccKey("cc.settings.voicemail_alerts"))}
          </label>
          <p className="text-xs text-muted-foreground">{t(ccKey("cc.settings.voicemail_alerts_help"))}</p>
          {alerts && (
            <div className="space-y-1.5">
              <Label htmlFor="vm-emails">{t(ccKey("cc.settings.extra_emails"))}</Label>
              <textarea
                id="vm-emails" value={emails} onChange={(e) => setEmails(e.target.value)} rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="manager@company.com"
              />
            </div>
          )}
        </div>
        <Button onClick={save} disabled={saving}>{t(ccKey("cc.settings.save"))}</Button>
      </CardContent>
    </Card>
  );
}
