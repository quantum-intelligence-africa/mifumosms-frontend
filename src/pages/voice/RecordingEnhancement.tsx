// Recording enhancement settings: reduce background noise in call recordings. The original recording is always kept; this page only
// chooses whether copies are made, by which engine, how strongly, and whether call analysis reads the copy.
import { useCallback, useEffect, useState } from "react";
import { AudioLines, AlertCircle, RefreshCw, Info } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/contexts/AuthContext";
import { isCallCenterAdmin } from "@/utils/roleUtils";
import { enhancementApi, type EnhancementSettings } from "@/services/enhancementApi";

export default function RecordingEnhancement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const canEdit = isCallCenterAdmin(user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<EnhancementSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await enhancementApi.settings();
    if (res.success && res.data) setSettings(res.data);
    else setError(res.error || res.message || t("enh.load_failed"));
    setIsLoading(false);
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  // Every change is saved at once (like the other settings pages); a refused value is shown and the page goes back to what the server has.
  const patch = async (body: Parameters<typeof enhancementApi.saveSettings>[0]) => {
    if (!canEdit || isSaving) return;
    setIsSaving(true);
    const res = await enhancementApi.saveSettings(body);
    if (res.success && res.data) {
      setSettings(res.data);
      toast({ title: t("enh.saved") });
    } else {
      const first = res.errors ? Object.values(res.errors)[0]?.[0] : undefined;
      toast({ title: t("enh.save_failed"), description: first || res.error || res.message, variant: "destructive" });
      void load();
    }
    setIsSaving(false);
  };

  const anyEngine = settings ? Object.values(settings.engines_available).some(Boolean) : true;
  const off = !settings?.enabled;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-5xl space-y-3.5">
            <header>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{t("enh.title")}</h1>
              <p className="mt-0.5 text-sm text-foreground/60">{t("enh.subtitle")}</p>
            </header>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={load}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t("common.try_again")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && isLoading && <Skeleton className="h-64" />}

            {!error && !isLoading && settings && (
              <>
                {!canEdit && (
                  <div className="flex gap-2 rounded-md bg-muted p-2.5 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 shrink-0" />
                    <p>{t("enh.read_only")}</p>
                  </div>
                )}
                {!anyEngine && (
                  <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{t("enh.unavailable")}</p>
                  </div>
                )}

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2.5">
                    <div className="flex items-start gap-3">
                      <AudioLines className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{t("enh.enabled")}</CardTitle>
                        <CardDescription className="mt-1">{settings.platform_managed ? t("enh.platform_managed") : t("enh.enabled_hint")}</CardDescription>
                      </div>
                    </div>
                    <Switch checked={settings.enabled} onCheckedChange={(v) => patch({ enabled: v })} disabled={!canEdit || isSaving || !anyEngine || !!settings.platform_managed} aria-label={t("enh.enabled")} />
                  </CardHeader>
                </Card>

                <Card className={off ? "opacity-50" : undefined}>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label className="text-sm text-foreground">{t("enh.auto")}</Label>
                        <p className="text-xs text-muted-foreground">{t("enh.auto_hint")}</p>
                      </div>
                      <Switch checked={settings.auto} onCheckedChange={(v) => patch({ auto: v })} disabled={!canEdit || isSaving || off} aria-label={t("enh.auto")} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-sm">{t("enh.engine")}</Label>
                        <Select value={settings.engine} onValueChange={(v) => patch({ engine: v as EnhancementSettings["engine"] })} disabled={!canEdit || isSaving || off}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {settings.options.engines.map((o) => {
                              const ok = settings.engines_available[o.value];
                              return (
                                <SelectItem key={o.value} value={o.value} disabled={!ok}>
                                  {o.label}{ok ? "" : ` (${t("enh.not_installed")})`}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">{t("enh.intensity")}</Label>
                        <Select value={settings.intensity} onValueChange={(v) => patch({ intensity: v as EnhancementSettings["intensity"] })} disabled={!canEdit || isSaving || off}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">{t("enh.intensity.low")}</SelectItem>
                            <SelectItem value="medium">{t("enh.intensity.medium")}</SelectItem>
                            <SelectItem value="high">{t("enh.intensity.high")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">{t("enh.quality")}</Label>
                        <Select value={settings.quality} onValueChange={(v) => patch({ quality: v as EnhancementSettings["quality"] })} disabled={!canEdit || isSaving || off}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">{t("enh.quality.standard")}</SelectItem>
                            <SelectItem value="high">{t("enh.quality.high")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("enh.intensity_hint")}</p>

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                      <div className="pr-4">
                        <Label className="text-sm text-foreground">{t("enh.clarity")}</Label>
                        <p className="text-xs text-muted-foreground">{t("enh.clarity_hint")}</p>
                      </div>
                      <Switch checked={settings.clarity} onCheckedChange={(v) => patch({ clarity: v })} disabled={!canEdit || isSaving || off} aria-label={t("enh.clarity")} />
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                      <div className="pr-4">
                        <Label className="text-sm text-foreground">{t("enh.transcribe")}</Label>
                        <p className="text-xs text-muted-foreground">{t("enh.transcribe_hint")}</p>
                      </div>
                      <Switch checked={settings.transcribe_enhanced} onCheckedChange={(v) => patch({ transcribe_enhanced: v })} disabled={!canEdit || isSaving || off} aria-label={t("enh.transcribe")} />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
