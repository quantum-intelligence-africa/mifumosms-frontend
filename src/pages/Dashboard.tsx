import {
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  Zap,
  Building2,
  Plus,
  Hash,
  Activity,
  Play
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { SenderIds } from "@/components/dashboard/SenderIds";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

const Dashboard = () => {
  const { user } = useAuth();
  const { metrics, overview, recentCampaigns, recentActivity, performanceOverview, senderIds, isLoading } = useDashboard();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { t } = useLanguage();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Show video tutorial for first-time users
  useEffect(() => {
    if (user?.id) {
      const tutorialSeenKey = `mifumo_tutorial_seen_${user.id}`;
      const hasSeenTutorial = localStorage.getItem(tutorialSeenKey);

      if (!hasSeenTutorial) {
        // Delay slightly for better UX after dashboard loads
        const timer = setTimeout(() => {
          setShowVideoModal(true);
          localStorage.setItem(tutorialSeenKey, "true");
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
              {/* Loading skeletons */}
              <div className="mb-6 lg:mb-8">
                <Skeleton className="h-6 lg:h-8 w-48 lg:w-64 mb-2" />
                <Skeleton className="h-3 lg:h-4 w-72 lg:w-96" />
              </div>

              <div className="grid grid-cols-4 gap-2 lg:gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 lg:h-32" />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64 lg:col-span-2" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show verification overlay if needed - TEMPORARILY DISABLED FOR DEBUGGING
  // if (showVerification && user?.phone_number) {
  //   console.log('Showing verification overlay for phone:', user.phone_number);
  //   return (
  //     <div className="flex h-screen bg-background">
  //       <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
  //       <div className="flex-1 flex flex-col overflow-hidden">
  //         <AppHeader onMenuClick={() => setSidebarOpen(true)} />
  //         <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
  //           <div className="max-w-7xl mx-auto flex items-center justify-center min-h-full">
  //             <AccountVerification
  //               phoneNumber={user.phone_number}
  //               onVerified={handleVerificationComplete}
  //               onSkip={handleSkipVerification}
  //             />
  //           </div>
  //         </main>
  //       </div>
  //     </div>
  //   );
  // }

  // Add error boundary
  try {
    return (
      <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 lg:p-6 relative z-0">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Welcome Section - Hidden */}
            {/*
            <div className="mb-6 sm:mb-8">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight">
                {t("dashboard.welcome")}
              </h1>
              <p className="text-[13px] sm:text-sm text-text-subtle">
                {t("dashboard.subtitle")}
              </p>
            </div>
            */}

            {/* Metrics Grid - Always 2 per row on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
              <MetricCard
                title={t("dashboard.metric.total_messages")}
                value={metrics?.total_messages?.value?.toLocaleString() || "0"}
                icon={MessageSquare}
                description={metrics?.total_messages?.description || t("dashboard.metric.last_30_days")}
                emptyMessage={t("dashboard.empty.no_messages") || "No messages yet"}
              />
              <MetricCard
                title={t("dashboard.metric.active_contacts")}
                value={metrics?.active_contacts?.value?.toLocaleString() || "0"}
                icon={Users}
                description={metrics?.active_contacts?.description || t("dashboard.metric.engaged_this_month")}
                emptyMessage={t("dashboard.empty.no_contacts") || "Add contacts to start"}
              />
              <MetricCard
                title={t("dashboard.metric.current_credits")}
                value={metrics?.current_credits?.value?.toLocaleString() || "0"}
                icon={DollarSign}
                description={metrics?.current_credits?.description || t("dashboard.metric.available_credits")}
                isEmpty={false}
                emptyMessage={t("dashboard.empty.no_credits") || "Purchase credits"}
              />
              <MetricCard
                title={t("dashboard.metric.sender_id")}
                value={senderIds?.filter(id => id.status?.toLowerCase() === 'approved').length?.toLocaleString() || metrics?.senderId?.value?.toLocaleString() || "0"}
                icon={Hash}
                description={t("dashboard.metric.approved_sender_names")}
                emptyMessage={t("dashboard.empty.no_sender_ids") || "Request a sender ID"}
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <QuickActions />
              </div>

              {/* Performance Overview */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <PerformanceOverview performance={performanceOverview} />
              </div>
            </div>

            {/* Activity Feed and Recent Campaigns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
              <ActivityFeed />
              <RecentCampaigns campaigns={recentCampaigns || []} />
            </div>

            {/* Sender IDs */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">
              <SenderIds senderIds={senderIds} />
            </div>
          </div>
        </main>

        {/* Video Tutorial Modal - Shows for first time users */}
        <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-4 rounded-xl border-none shadow-2xl bg-white">
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                <Play className="w-5 h-5 text-blue-600" />
                {t("tutorial.title") || "Karibu Mifumo SMS"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-medium">
                {t("tutorial.description") || "Jifunze jinsi ya kutumia mfumo wetu kwa ufanisi zaidi."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px] shadow-inner relative group">
              <video
                key={showVideoModal ? "visible" : "hidden"}
                controls
                autoPlay
                className="w-full h-full max-h-[500px] object-contain"
                style={{ maxWidth: "100%", maxHeight: "500px" }}
              >
                <source src="/tutorial/mfumosms video tutorial.mp4" type="video/mp4" />
                <p className="text-center text-white p-4">
                  Your browser does not support the video tag. Please download the video to watch it.
                </p>
              </video>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    );
  } catch (error) {
    console.error('Dashboard rendering error:', error);
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
            <div className="max-w-7xl mx-auto flex items-center justify-center min-h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-red-600 mb-4">{t("dashboard.error.title")}</h2>
                <p className="text-gray-600 mb-4">{t("dashboard.error.description")}</p>
                <p className="text-sm text-gray-500">{t("dashboard.error.hint")}</p>
                <pre className="mt-4 text-xs text-left bg-gray-100 p-4 rounded">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </pre>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
};

export default Dashboard;
