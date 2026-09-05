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
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/services/voiceApi";

interface AISettings {
  enabled: boolean;
  post_call_summary: boolean;
  sentiment_analysis: boolean;
  intent_detection: boolean;
  auto_categorization: boolean;
  consent_acknowledged_at: string | null;
  updated_at: string;
}

const CONSENT_TEXT =
  "SENDA itatumia maudhui ya mazungumzo kuchanganua simu na kutoa muhtasari pamoja na taarifa muhimu za huduma kwa wateja.";

export default function AISettings() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
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
      setError(res.error || "Failed to load AI settings");
    }
    setIsLoading(false);
  }, []);

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
      toast({ title: "Failed to update", description: res.error || "Please try again.", variant: "destructive" });
    }
  };

  const handleMasterToggle = async (checked: boolean) => {
    if (!settings) return;
    if (checked && !settings.consent_acknowledged_at) {
      // First-time enable needs consent acknowledged in the same request —
      // the backend rejects `enabled: true` without it.
      await patch({ enabled: true, consent_acknowledged_at: true });
      toast({ title: "AI Call Analysis imewashwa", description: "Uchambuzi wa AI umewashwa kwa simu zako." });
      return;
    }
    await patch({ enabled: checked });
  };

  const subToggles: Array<{ key: keyof AISettings; label: string }> = [
    { key: "post_call_summary", label: "Muhtasari wa simu (Post-Call Summary)" },
    { key: "sentiment_analysis", label: "Hisia za mteja (Sentiment Analysis)" },
    { key: "intent_detection", label: "Sababu ya kupiga simu (Call Intent Detection)" },
    { key: "auto_categorization", label: "Mada na uainishaji (Automatic Categorization)" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-2xl space-y-3.5">
            <header>
              <h1 className="text-xl font-bold tracking-tight text-foreground">AI & Call Intelligence</h1>
              <p className="mt-0.5 text-sm text-foreground/60">
                Optional AI analysis of your call recordings — off by default, and fully independent of the IVR engine.
              </p>
            </header>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchSettings}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Try again
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
                        <CardTitle className="text-base">AI Call Analysis</CardTitle>
                        <CardDescription className="mt-1">
                          {settings.enabled
                            ? "AI inaweza kuchanganua mazungumzo ya simu ili kukusaidia kuelewa mahitaji ya wateja na kuboresha huduma."
                            : "Uchambuzi wa AI umezimwa. Hakuna uchambuzi wa AI utakaofanywa kwenye simu zako."}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch checked={settings.enabled} onCheckedChange={handleMasterToggle} disabled={isSaving} />
                  </CardHeader>

                  {!settings.enabled && (
                    <CardContent className="border-t border-border pt-2.5">
                      <div className="flex gap-2 rounded-md bg-muted p-2.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        <p>{CONSENT_TEXT}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>

                <Card className={!settings.enabled ? "opacity-50" : undefined}>
                  <CardHeader className="pb-2.5">
                    <CardTitle className="text-sm">Independent toggles</CardTitle>
                    <CardDescription>Each analysis type can be switched off on its own without disabling AI entirely.</CardDescription>
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

                    <div className="flex items-center justify-between gap-3 border-t border-border pt-3 opacity-60">
                      <Label className="text-sm font-normal text-foreground">Real-Time Analysis</Label>
                      <span className="text-xs text-muted-foreground" title="Requires a telephony provider with live audio streaming — not available on Africa's Talking.">
                        Not available
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
