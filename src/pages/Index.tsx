import { 
  MessageSquare, 
  Send, 
  Users, 
  TrendingUp, 
  Clock,
  DollarSign,
  Target,
  Zap 
} from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";

const Index = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <AppHeader />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                Welcome back, Mkuu! 👋
              </h1>
              <p className="text-text-subtle">
                Here's what's happening with your communication platform today.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Messages"
                value="12,450"
                change="+12.5%"
                changeType="positive"
                icon={MessageSquare}
                description="Last 30 days"
              />
              <MetricCard
                title="Active Contacts"
                value="3,240"
                change="+8.2%"
                changeType="positive"
                icon={Users}
                description="Engaged this month"
              />
              <MetricCard
                title="Campaign Success"
                value="94.2%"
                change="+2.1%"
                changeType="positive"
                icon={Target}
                description="Delivery rate"
              />
              <MetricCard
                title="Revenue"
                value="$4,280"
                change="+18.7%"
                changeType="positive"
                icon={DollarSign}
                description="This month"
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
                <RecentCampaigns />
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

export default Index;
