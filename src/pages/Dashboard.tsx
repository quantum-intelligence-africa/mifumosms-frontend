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
  Activity
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { SenderIds } from "@/components/dashboard/SenderIds";
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
  const { metrics, overview, recentCampaigns, recentActivity, performanceOverview, senderIds, isLoading } = useDashboard();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Debug logging for sender IDs
  console.log('Dashboard - Sender IDs:', senderIds);
  console.log('Dashboard - Sender IDs Count:', senderIds?.length);

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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 lg:p-6 relative z-0">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Welcome Section */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                Welcome to Mifumo WMS! 👋
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-text-subtle">
                Monitor your communication platform performance in real-time.
              </p>
            </div>

            {/* Metrics Grid - 4 Main Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-6">
              <MetricCard
                title="Total Messages"
                value={metrics?.total_messages?.value?.toLocaleString() || "0"}
                icon={MessageSquare}
                description={metrics?.total_messages?.description || "Last 30 days"}
              />
              <MetricCard
                title="Active Contacts"
                value={metrics?.active_contacts?.value?.toLocaleString() || "0"}
                icon={Users}
                description={metrics?.active_contacts?.description || "Engaged this month"}
              />
              <MetricCard
                title="Campaign Success"
                value={`${metrics?.campaign_success?.value || 0}${metrics?.campaign_success?.unit || "%"}`}
                icon={Target}
                description={metrics?.campaign_success?.description || "Delivery rate"}
              />
              <MetricCard
                title="Sender ID"
                value={senderIds?.length?.toLocaleString() || metrics?.senderId?.value?.toLocaleString() || "0"}
                icon={Hash}
                description="Approved sender names"
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1 order-2 lg:order-1">
                <QuickActions />
              </div>

              {/* Recent Campaigns */}
              <div className="lg:col-span-2 order-1 lg:order-2">
                <RecentCampaigns campaigns={recentCampaigns || []} />
              </div>
            </div>

            {/* Activity Feed and Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <ActivityFeed />
              <PerformanceOverview performance={performanceOverview} />
            </div>

            {/* Sender IDs */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
              <SenderIds senderIds={senderIds} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
