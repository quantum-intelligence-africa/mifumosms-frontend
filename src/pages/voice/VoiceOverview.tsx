import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Workflow, Phone, PhoneCall, Sparkles, Voicemail, ChevronRight } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";

// This whole page sits behind requireIvrAccess (see App.tsx's /voice route),
// so every card here is safe to show unconditionally — reaching this page at
// all already means the user has Voice/IVR access.
const SECTIONS = [
  {
    href: "/voice/ivr",
    icon: Workflow,
    title: "Mtiririko wa IVR",
    description: "Tengeneza na uchapishe mitiririko ya simu — menyu, uhamishaji, saa za kazi, ujumbe wa sauti.",
  },
  {
    href: "/voice/numbers",
    icon: Phone,
    title: "Namba za Simu",
    description: "Unganisha kila namba na mtiririko mmoja uliochapishwa.",
  },
  {
    href: "/voice/calls",
    icon: PhoneCall,
    title: "Simu",
    description: "Angalia simu zilizoingia na zilizotoka, matokeo yake, na hatua za mtiririko.",
  },
  {
    href: "/voice/recordings",
    icon: Voicemail,
    title: "Rekodi za Simu",
    description: "Kila simu na ujumbe wa sauti uliorekodiwa, kwenye orodha moja.",
  },
  {
    href: "/voice/ai-settings",
    icon: Sparkles,
    title: "Uchambuzi wa AI wa Simu",
    description: "Washa muhtasari, hisia, na sababu ya kupiga simu baada ya kila simu.",
  },
];

export default function VoiceOverview() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-3xl space-y-3.5">
            <header>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Simu na IVR</h1>
              <p className="mt-0.5 text-sm text-foreground/60">Kila kitu cha kutengeneza na kuendesha huduma za simu.</p>
            </header>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SECTIONS.map((section) => (
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
