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
  Hash
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTenants } from "@/hooks/useTenants";
import { useDashboard } from "@/hooks/useDashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { dashboardData, metrics, isLoading } = useDashboard();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex bg-background">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto custom-scrollbar px-[max(12px,env(safe-area-inset-left))] pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))]">
            <div className="mx-auto w-[92vw] max-w-[1200px] space-y-4 lg:space-y-6">
              {/* Loading skeletons */}
              <div className="mb-6 lg:mb-8">
                <Skeleton className="h-[clamp(1.5rem,4vw,2rem)] w-[clamp(12rem,25vw,16rem)] mb-2" />
                <Skeleton className="h-[clamp(0.75rem,2vw,1rem)] w-[clamp(18rem,35vw,24rem)]" />
              </div>

              <div className="grid gap-3 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-[clamp(6rem,15vw,8rem)]" />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <Skeleton className="h-[clamp(12rem,25vw,16rem)]" />
                <Skeleton className="h-[clamp(12rem,25vw,16rem)] lg:col-span-2" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar px-[max(12px,env(safe-area-inset-left))] pb-[max(12px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))]">
          <div className="mx-auto w-[92vw] max-w-[1200px] space-y-4 lg:space-y-6">
            {/* Welcome Section */}
            <div className="mb-6 lg:mb-8">
              <h1 className="font-heading text-[clamp(1.5rem,4vw,2.5rem)] font-bold text-foreground mb-2">
                Welcome to Mifumo WMS! 👋
              </h1>
              <p className="text-[clamp(0.75rem,2vw,1rem)] text-text-subtle">
                Monitor your communication platform performance in real-time.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-3 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              <MetricCard
                title="Total Messages"
                value={metrics?.total_messages?.value?.toLocaleString() || "0"}
                change={metrics?.total_messages?.change || "0%"}
                changeType={metrics?.total_messages?.change_type || "neutral"}
                icon={MessageSquare}
                description={metrics?.total_messages?.description || "Last 30 days"}
              />
              <MetricCard
                title="Active Contacts"
                value={metrics?.active_contacts?.value?.toLocaleString() || "0"}
                change={metrics?.active_contacts?.change || "0%"}
                changeType={metrics?.active_contacts?.change_type || "neutral"}
                icon={Users}
                description={metrics?.active_contacts?.description || "Engaged this month"}
              />
              <MetricCard
                title="Campaign Success"
                value={metrics?.campaign_success?.value || "0%"}
                change={metrics?.campaign_success?.change || "0%"}
                changeType={metrics?.campaign_success?.change_type || "neutral"}
                icon={Target}
                description={metrics?.campaign_success?.description || "Delivery rate"}
              />
              <MetricCard
                title="Sender ID"
                value={metrics?.sender_id?.value?.toLocaleString() || "0"}
                change={metrics?.sender_id?.change || "0%"}
                changeType={metrics?.sender_id?.change_type || "neutral"}
                icon={Hash}
                description={metrics?.sender_id?.description || "Registered"}
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <QuickActions />
              </div>

              {/* Recent Campaigns */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <RecentCampaigns campaigns={dashboardData?.recent_campaigns || []} />
              </div>
            </div>

            {/* Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <ActivityFeed />

              {/* Performance Chart Placeholder */}
              <div className="p-6 glass border-0 rounded-xl">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    Performance Overview
                  </h3>
                </div>
                <div className="h-64 bg-gradient-surface rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-text-subtle">Analytics charts coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
