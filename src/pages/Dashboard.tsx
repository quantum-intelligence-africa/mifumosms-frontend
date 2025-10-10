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
  Plus
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTenants } from "@/hooks/useTenants";
import { useDashboard } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { dashboardData, metrics, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Loading skeletons */}
              <div className="mb-8">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
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
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                Welcome to Mifumo WMS! 👋
              </h1>
              <p className="text-text-subtle">
                Monitor your communication platform performance in real-time.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                title="Revenue"
                value={metrics?.revenue?.value || "Tsh 0"}
                change={metrics?.revenue?.change || "0%"}
                changeType={metrics?.revenue?.change_type || "neutral"}
                icon={DollarSign}
                description={metrics?.revenue?.description || "This month"}
              />
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <QuickActions />
              </div>

              {/* Recent Campaigns */}
              <div className="lg:col-span-2">
                <RecentCampaigns campaigns={dashboardData?.recent_campaigns || []} />
              </div>
            </div>

            {/* Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
