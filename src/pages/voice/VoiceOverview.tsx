import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Workflow, Phone, PhoneCall, Sparkles, Voicemail, ChevronRight } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { hasIvrAccess } from "@/utils/roleUtils";

const SECTIONS = [
  {
    href: "/voice/ivr",
    icon: Workflow,
    title: "IVR Flows",
    description: "Build and publish call flows — menus, transfers, business hours, voicemail.",
    requiresIvrAccess: true,
  },
  {
    href: "/voice/numbers",
    icon: Phone,
    title: "Phone Numbers",
    description: "Connect each number to exactly one published flow.",
  },
  {
    href: "/voice/calls",
    icon: PhoneCall,
    title: "Call History",
    description: "Browse real calls, review status, and step through flow logs.",
  },
  {
    href: "/voice/recordings",
    icon: Voicemail,
    title: "Recordings",
    description: "Every recorded call and voicemail, in one browsable list.",
  },
  {
    href: "/voice/ai-settings",
    icon: Sparkles,
    title: "AI & Call Intelligence",
    description: "Turn on post-call AI summaries, sentiment, and intent detection.",
  },
];

export default function VoiceOverview() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const sections = SECTIONS.filter((s) => !s.requiresIvrAccess || hasIvrAccess(user));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4">
          <div className="mx-auto max-w-3xl space-y-3.5">
            <header>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Voice / IVR</h1>
              <p className="mt-0.5 text-sm text-foreground/60">Everything for building and running phone call experiences.</p>
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
