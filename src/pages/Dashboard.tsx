import {
  MessageSquare,
  Users,
  DollarSign,
  Hash,
  Play,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { SenderIds } from "@/components/dashboard/SenderIds";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

// ─── Reusable card shell ──────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card dark:bg-card/95 rounded-xl border border-border dark:border-border/60 shadow-[0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ─── Thin divider with inline label ──────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <span className="text-xs sm:text-sm font-bold tracking-[0.08em] uppercase text-foreground/70 dark:text-foreground/60 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-0.5 bg-gradient-to-r from-border via-border/50 to-transparent dark:from-border/40 dark:via-border/20 dark:to-transparent" />
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
interface MetricProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  accentBg: string;
  accentText: string;
}

function Metric({ title, value, description, icon: Icon, accentBg, accentText }: MetricProps) {
  return (
    <div className="bg-card dark:bg-card/95 rounded-lg border border-border dark:border-border/60 shadow-sm hover:shadow-md dark:hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col h-full dark:hover:shadow-primary/20">
      <div className="px-3 py-2.5 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.07em] uppercase text-text-subtle dark:text-foreground/50 leading-tight line-clamp-1">
            {title}
          </span>
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center flex-shrink-0 ${accentBg} dark:opacity-80`}>
            <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${accentText}`} strokeWidth={2} />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-lg sm:text-xl lg:text-2xl leading-none font-bold text-foreground dark:text-foreground tabular-nums">
            {value}
          </p>
          <p className="text-[9px] sm:text-[10px] text-text-subtle dark:text-foreground/60 leading-snug mt-1 line-clamp-1 font-medium">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void }) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 overflow-hidden">
      <div className="flex-shrink-0 h-full bg-card dark:bg-background border-r border-border dark:border-border/60">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-2 sm:p-3 md:p-4 w-full overflow-x-hidden">
            <div className="max-w-full px-1 mx-auto space-y-4 sm:space-y-5">
              {/* Welcome skeleton */}
              <Skeleton className="h-16 sm:h-20 rounded-2xl" />

              {/* Metrics skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-1.5 md:gap-2 overflow-x-hidden">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] sm:h-[120px] rounded-xl" />)}
              </div>

              {/* Middle section skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-hidden">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="lg:col-span-2 h-48 rounded-xl" />
              </div>

              {/* Activity section skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-hidden">
                <Skeleton className="h-52 rounded-xl" />
                <Skeleton className="h-52 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const { metrics, recentCampaigns, performanceOverview, senderIds, isLoading } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { t } = useLanguage();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!user?.id) return;
    const key = `mifumo_tutorial_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      const timer = setTimeout(() => {
        setShowVideoModal(true);
        localStorage.setItem(key, "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  if (isLoading) return <DashboardSkeleton sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;

  const approvedSenderIds = senderIds?.filter((id) => id.status?.toLowerCase() === "approved").length ?? 0;

  const metricCards: MetricProps[] = [
    {
      title: t("dashboard.metric.total_messages"),
      value: metrics?.total_messages?.value?.toLocaleString() || "0",
      description: metrics?.total_messages?.description || t("dashboard.metric.last_30_days"),
      icon: MessageSquare,
      accentBg: "bg-blue-50",
      accentText: "text-blue-600",
    },
    {
      title: t("dashboard.metric.active_contacts"),
      value: metrics?.active_contacts?.value?.toLocaleString() || "0",
      description: metrics?.active_contacts?.description || t("dashboard.metric.engaged_this_month"),
      icon: Users,
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
    },
    {
      title: t("dashboard.metric.current_credits"),
      value: metrics?.current_credits?.value?.toLocaleString() || "0",
      description: metrics?.current_credits?.description || t("dashboard.metric.available_credits"),
      icon: DollarSign,
      accentBg: "bg-amber-50",
      accentText: "text-amber-600",
    },
    {
      title: t("dashboard.metric.sender_id"),
      value: (approvedSenderIds || metrics?.senderId?.value || 0).toString(),
      description: t("dashboard.metric.approved_sender_names"),
      icon: Hash,
      accentBg: "bg-violet-50",
      accentText: "text-violet-600",
    },
  ];

  try {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 overflow-hidden">

        {/* Sidebar */}
        <div className="flex-shrink-0 h-full bg-card dark:bg-background border-r border-border dark:border-border/60 shadow-[1px_0_2px_rgba(0,0,0,0.05)] dark:shadow-[1px_0_2px_rgba(0,0,0,0.3)]">
          <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-2 sm:p-3 md:p-4 w-full overflow-x-hidden">
              <div className="max-w-full px-1 mx-auto space-y-2.5 sm:space-y-3">

                {/* Welcome Section */}
                <h1 className="text-base sm:text-lg font-bold text-foreground dark:text-foreground">Welcome back, {user?.first_name || user?.full_name || 'User'}! 👋</h1>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-1.5 md:gap-2 overflow-x-hidden">
                  {metricCards.map((card) => <Metric key={card.title} {...card} />)}
                </div>

                {/* Middle Section: Quick Actions + Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-hidden">
                  <div className="lg:col-span-1 h-full min-w-0">
                    <QuickActions />
                  </div>
                  <div className="lg:col-span-2 h-full min-w-0">
                    <Card>
                      <PerformanceOverview performance={performanceOverview} />
                    </Card>
                  </div>
                </div>

                {/* Bottom Section: Activity + Campaigns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-hidden">
                  <ActivityFeed />
                  <Card>
                    <RecentCampaigns campaigns={recentCampaigns || []} />
                  </Card>
                </div>

                {/* Sender IDs Section */}
                <Card>
                  <SenderIds senderIds={senderIds} />
                </Card>



              </div>
            </div>
          </main>
        </div>

        {/* Video Tutorial Modal */}
        <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent className="w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[95vh] p-0 rounded-2xl border-0 shadow-2xl overflow-hidden bg-card dark:bg-background">
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-border dark:border-border/60 flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-foreground dark:text-foreground">
                  <div className="p-2.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Play className="w-5 h-5 text-primary" strokeWidth={2.5} />
                  </div>
                  {t("tutorial.title") || "Welcome to SENDA"}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm text-text-subtle dark:text-foreground/60">
                  {t("tutorial.description") || "Watch this short video to learn how to get started."}
                </DialogDescription>
              </div>
            </div>
            <div className="bg-black/90 dark:bg-black aspect-video w-full">
              <video key={showVideoModal ? "open" : "closed"} controls autoPlay className="w-full h-full object-contain">
                <source src="/tutorial/mfumosms video tutorial.mp4" type="video/mp4" />
              </video>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  } catch (error) {
    console.error("Dashboard render error:", error);
    return (
      <div className="flex h-screen bg-background dark:bg-background overflow-hidden">
        <div className="flex-shrink-0 h-full bg-card dark:bg-background/50 border-r border-border dark:border-border/60">
          <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
            <div className="text-center max-w-sm w-full">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-destructive text-sm font-bold">!</span>
              </div>
              <h2 className="text-[14px] font-semibold text-foreground dark:text-foreground mb-1">{t("dashboard.error.title")}</h2>
              <p className="text-[12.5px] text-text-subtle dark:text-foreground/60 mb-3">{t("dashboard.error.description")}</p>
              <pre className="text-[11px] text-left bg-muted/50 dark:bg-muted/20 border border-border dark:border-border/60 rounded-lg p-3 text-foreground dark:text-foreground/70 overflow-auto">
                {error instanceof Error ? error.message : "Unknown error"}
              </pre>
            </div>
          </main>
        </div>
      </div>
    );
  }
};

export default Dashboard;
