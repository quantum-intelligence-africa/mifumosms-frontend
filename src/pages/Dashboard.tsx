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
    <div className={`bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ─── Thin divider with inline label ──────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-semibold tracking-[0.09em] uppercase text-gray-400 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
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
  topBar: string;
}

function Metric({ title, value, description, icon: Icon, accentBg, accentText, topBar }: MetricProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.10)] hover:-translate-y-[1px] transition-all duration-200 overflow-hidden cursor-default flex flex-col">
      {/* Unique colored top strip — instant visual ID per card */}
      <div className={`h-[3px] w-full flex-shrink-0 ${topBar}`} />
      <div className="px-4 py-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[0.09em] uppercase text-gray-400 leading-none">
            {title}
          </span>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${accentBg}`}>
            <Icon className={`w-3 h-3 ${accentText}`} strokeWidth={2.2} />
          </div>
        </div>
        <div>
          <p className="text-[26px] leading-none font-bold text-gray-900 tracking-[-0.03em] tabular-nums">
            {value}
          </p>
          <p className="text-[11px] text-gray-400 leading-snug mt-1.5">
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
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
      <div className="flex-shrink-0 h-full bg-white border-r border-gray-200">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          <div className="max-w-[1280px] mx-auto space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[90px] rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <Skeleton className="h-52 rounded-xl" />
              <Skeleton className="lg:col-span-2 h-52 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Skeleton className="h-52 rounded-xl" />
              <Skeleton className="h-52 rounded-xl" />
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
      topBar: "bg-blue-500",
    },
    {
      title: t("dashboard.metric.active_contacts"),
      value: metrics?.active_contacts?.value?.toLocaleString() || "0",
      description: metrics?.active_contacts?.description || t("dashboard.metric.engaged_this_month"),
      icon: Users,
      accentBg: "bg-emerald-50",
      accentText: "text-emerald-600",
      topBar: "bg-emerald-500",
    },
    {
      title: t("dashboard.metric.current_credits"),
      value: metrics?.current_credits?.value?.toLocaleString() || "0",
      description: metrics?.current_credits?.description || t("dashboard.metric.available_credits"),
      icon: DollarSign,
      accentBg: "bg-amber-50",
      accentText: "text-amber-600",
      topBar: "bg-amber-500",
    },
    {
      title: t("dashboard.metric.sender_id"),
      value: (approvedSenderIds || metrics?.senderId?.value || 0).toString(),
      description: t("dashboard.metric.approved_sender_names"),
      icon: Hash,
      accentBg: "bg-violet-50",
      accentText: "text-violet-600",
      topBar: "bg-violet-500",
    },
  ];

  try {
    return (
      <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">

        {/* Sidebar — white bg + right border = clear contained boundary */}
        <div className="flex-shrink-0 h-full bg-white border-r border-gray-200 shadow-[1px_0_0_rgba(0,0,0,0.04)]">
          <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            {/* Compact, consistent padding — 16px mobile / 20px desktop */}
            <div className="p-4 md:p-5">
              <div className="max-w-[1280px] mx-auto space-y-3">

                {/* ── Zone 1: Metrics ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {metricCards.map((card) => <Metric key={card.title} {...card} />)}
                </div>

                {/* ── Zone 2: Quick Actions + Performance (no section label) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-1 h-full">
                    <Card className="h-full">
                      <QuickActions />
                    </Card>
                  </div>
                  <div className="lg:col-span-2 h-full">
                    <Card className="h-full">
                      <PerformanceOverview performance={performanceOverview} />
                    </Card>
                  </div>
                </div>

                {/* ── Zone 3: Activity + Campaigns ── */}
                <Divider label="Recent activity" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Card><ActivityFeed /></Card>
                  <Card><RecentCampaigns campaigns={recentCampaigns || []} /></Card>
                </div>

                {/* ── Zone 4: Sender IDs ── */}
                <Divider label="Sender IDs" />
                <Card><SenderIds senderIds={senderIds} /></Card>

              </div>
            </div>
          </main>
        </div>

        {/* Video tutorial modal */}
        <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent className="max-w-[620px] w-[calc(100vw-32px)] p-0 rounded-2xl border-0 shadow-[0_24px_60px_rgba(0,0,0,0.20)] overflow-hidden bg-white">
            <div className="px-5 pt-4 pb-3.5 border-b border-gray-100">
              <DialogTitle className="flex items-center gap-2 text-[14px] font-semibold text-gray-900">
                <span className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Play className="w-3 h-3 text-blue-600" strokeWidth={2.5} />
                </span>
                {t("tutorial.title") || "Welcome to Mifumo SMS"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[12px] text-gray-500">
                {t("tutorial.description") || "Watch this short video to get started quickly."}
              </DialogDescription>
            </div>
            <div className="bg-gray-950 aspect-video">
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
      <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
        <div className="flex-shrink-0 h-full bg-white border-r border-gray-200">
          <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-sm font-bold">!</span>
              </div>
              <h2 className="text-[14px] font-semibold text-gray-900 mb-1">{t("dashboard.error.title")}</h2>
              <p className="text-[12.5px] text-gray-500 mb-3">{t("dashboard.error.description")}</p>
              <pre className="text-[11px] text-left bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-600 overflow-auto">
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