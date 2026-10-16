// Progress toward "taking calls" (from the server's own readiness check) and the way into the setup wizard.
import { useCallback, useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { ccKey } from "@/i18n/callCenter";
import { SetupWizard } from "@/components/callcenter/SetupWizard";
import { callCenterApi, type CallCenterSettings } from "@/services/callCenterApi";

/** Progress toward "taking calls", from the server's own readiness check, and the way into the wizard. */
export function SetupCard() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<CallCenterSettings | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await callCenterApi.settings.get();
    if (res.success && res.data) setSettings(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!settings) return null;
  const r = settings.readiness;
  const checks = [r.number, r.team, r.staffed, r.routing];
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const live = settings.is_live && r.ready;

  return (
    <>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Rocket className="h-4 w-4 text-primary" />
              {live ? t("cc.wizard.is_live") : t("cc.setup.title")}
            </p>
            {!live && (
              <div className="mt-2 flex items-center gap-3">
                <Progress value={percent} className="h-1.5 max-w-xs" />
                <span className="text-xs text-muted-foreground">{percent}%</span>
              </div>
            )}
            {!live && r.missing.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("cc.wizard.still_needed")}: {r.missing.map((m) => t(ccKey(`cc.wizard.check_${m}`))).join(" · ")}
              </p>
            )}
          </div>
          <Button variant={live ? "outline" : "default"} size="sm" onClick={() => setOpen(true)}>
            {live ? t("cc.wizard.review") : settings.wizard_step > 1 ? t("cc.wizard.continue") : t("cc.wizard.start")}
          </Button>
        </CardContent>
      </Card>
      <SetupWizard open={open} onOpenChange={(o) => { setOpen(o); if (!o) void load(); }} onChanged={load} />
    </>
  );
}
