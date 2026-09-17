import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Workflow, Phone, PhoneCall, Sparkles, Voicemail, ChevronRight } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";

export default function VoiceOverview() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // This whole page sits behind requireIvrAccess (see App.tsx's /voice
  // route), so every card here is safe to show unconditionally — reaching
  // this page at all already means the user has Voice/IVR access.
  const sections = [
    { href: "/voice/ivr", icon: Workflow, title: t("nav.ivr_flows"), description: t("voice.overview.ivr_flows_desc") },
    { href: "/voice/numbers", icon: Phone, title: t("nav.phone_numbers"), description: t("voice.overview.phone_numbers_desc") },
    { href: "/voice/calls", icon: PhoneCall, title: t("nav.calls"), description: t("voice.overview.calls_desc") },
    { href: "/voice/recordings", icon: Voicemail, title: t("nav.recordings"), description: t("voice.overview.recordings_desc") },
    { href: "/voice/ai-settings", icon: Sparkles, title: t("nav.ai_call_intelligence"), description: t("voice.overview.ai_settings_desc") },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-3xl space-y-3.5">
            <header>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{t("nav.voice_ivr")}</h1>
              <p className="mt-0.5 text-sm text-foreground/60">{t("voice.overview.subtitle")}</p>
            </header>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {sections.map((section) => (
                <Card
                  key={section.href}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => navigate(section.href)}
                >
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <section.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{section.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{section.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
