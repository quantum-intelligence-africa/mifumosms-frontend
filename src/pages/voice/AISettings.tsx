import { useCallback, useEffect, useState } from "react";
import { Sparkles, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { voiceApi } from "@/services/voiceApi";

interface AISettings {
  enabled: boolean;
  post_call_summary: boolean;
  sentiment_analysis: boolean;
  intent_detection: boolean;
  auto_categorization: boolean;
  transcription_language: "" | "sw" | "en";
  consent_acknowledged_at: string | null;
  updated_at: string;
}

// Radix's Select can't take an empty-string item value, so "auto" stands in
// for "" (auto-detect) on the wire.
const AUTO_LANGUAGE = "auto";

export default function AISettings() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const res = await voiceApi.get<AISettings>("/audio/ai-settings/");
    if (res.success && res.data) {
      setSettings(res.data);
    } else {
      setError(res.error || t("voice.ai_settings.error_loading"));
    }
    setIsLoading(false);
  }, [t]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const patch = async (body: Record<string, unknown>) => {
    if (!settings) return;
    setIsSaving(true);
    const res = await voiceApi.patch<AISettings>("/audio/ai-settings/", body);
    setIsSaving(false);
    if (res.success && res.data) {
      setSettings(res.data);
    } else {
      toast({ title: t("voice.ai_settings.save_failed"), description: res.error || t("common.try_again_desc"), variant: "destructive" });
    }
  };

  const handleMasterToggle = async (checked: boolean) => {
    if (!settings) return;
    if (checked && !settings.consent_acknowledged_at) {
      // First-time enable needs consent acknowledged in the same request —
      // the backend rejects `enabled: true` without it.
      await patch({ enabled: true, consent_acknowledged_at: true });
      toast({ title: t("voice.ai_settings.enabled_toast_title"), description: t("voice.ai_settings.enabled_toast_desc") });
      return;
    }
    await patch({ enabled: checked });
  };

  const TRANSCRIPTION_LANGUAGES: Array<[string, string]> = [
    [AUTO_LANGUAGE, t("voice.ai_settings.language_auto")],
    ["sw", t("voice.ai_settings.language_sw")],
    ["en", t("voice.ai_settings.language_en")],
  ];

  const subToggles: Array<{ key: keyof AISettings; label: string }> = [
    { key: "post_call_summary", label: t("voice.ai_settings.toggle_summary") },
    { key: "sentiment_analysis", label: t("voice.ai_settings.toggle_sentiment") },
    { key: "intent_detection", label: t("voice.ai_settings.toggle_intent") },
    { key: "auto_categorization", label: t("voice.ai_settings.toggle_categorization") },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-2xl space-y-3.5">
            <header>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{t("nav.ai_call_intelligence")}</h1>
              <p className="mt-0.5 text-sm text-foreground/60">{t("voice.ai_settings.subtitle")}</p>
            </header>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchSettings}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    {t("common.try_again")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && isLoading && <Skeleton className="h-64" />}

            {!error && !isLoading && settings && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-2.5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{t("nav.ai_call_intelligence")}</CardTitle>
                        <CardDescription className="mt-1">
                          {settings.enabled ? t("voice.ai_settings.enabled_desc") : t("voice.ai_settings.disabled_desc")}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch checked={settings.enabled} onCheckedChange={handleMasterToggle} disabled={isSaving} />
                  </CardHeader>

                  {!settings.enabled && (
                    <CardContent className="border-t border-border pt-2.5">
                      <div className="flex gap-2 rounded-md bg-muted p-2.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <p>{t("voice.ai_settings.consent_text")}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className={!settings.enabled ? "opacity-50" : undefined}>
                  <CardHeader className="pb-2.5">
                    <CardTitle className="text-sm">{t("voice.ai_settings.toggles_title")}</CardTitle>
                    <CardDescription>{t("voice.ai_settings.toggles_desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {subToggles.map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <Label htmlFor={key} className="text-sm font-normal text-foreground">
                          {label}
                        </Label>
                        <Switch
                          id={key}
                          checked={Boolean(settings[key])}
                          onCheckedChange={(checked) => patch({ [key]: checked })}
                          disabled={isSaving || !settings.enabled}
                        />
                      </div>
                    ))}

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                      <Label htmlFor="transcription_language" className="text-sm font-normal text-foreground">
                        {t("voice.ai_settings.transcription_language_label")}
                      </Label>
                      <Select
                        value={settings.transcription_language || AUTO_LANGUAGE}
                        onValueChange={(value) => patch({ transcription_language: value === AUTO_LANGUAGE ? "" : value })}
                        disabled={isSaving || !settings.enabled}
                      >
                        <SelectTrigger id="transcription_language" className="h-9 w-44" aria-label={t("voice.ai_settings.transcription_language_label")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSCRIPTION_LANGUAGES.map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3 opacity-60">
                      <Label className="text-sm font-normal text-foreground">{t("voice.ai_settings.realtime_label")}</Label>
                      <span className="text-xs text-muted-foreground" title={t("voice.ai_settings.realtime_tooltip")}>
                        {t("voice.ai_settings.realtime_unavailable")}
                      </span>
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
