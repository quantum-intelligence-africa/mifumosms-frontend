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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { user } = useAuth();
  const { analytics, isLoading: analyticsLoading } = useAnalytics();
  const { tenants, currentTenant, isLoading: tenantsLoading, switchTenant } = useTenants();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return '+100%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

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
            {/* Welcome Section with Tenant Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
                  Welcome back, {user?.first_name || 'User'}! 👋
                </h1>
                <p className="text-text-subtle">
                  Monitor your communication platform performance in real-time.
                </p>
              </div>
              
              {/* Tenant Selector */}
              {tenants.length > 0 && (
                <Card className="glass border-0 mt-4 sm:mt-0 sm:w-80">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span className="font-medium text-sm">Active Organization</span>
                    </div>
                    {tenantsLoading ? (
                      <Skeleton className="h-8 w-full" />
                    ) : (
                      <Select
                        value={currentTenant?.id || ""}
                        onValueChange={switchTenant}
                      >
                        <SelectTrigger className="w-full glass-subtle border-0">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          {tenants.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              <div className="flex items-center gap-2">
                                <span>{tenant.name}</span>
                                {tenant.is_active && (
                                  <Badge variant="secondary" className="text-xs">
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {analyticsLoading ? (
                // Loading skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="glass border-0">
                    <CardContent className="p-6">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </CardContent>
                  </Card>
                ))
              ) : analytics ? (
                <>
                  <MetricCard
                    title="Total Messages"
                    value={formatNumber(analytics.total_messages)}
                    change={`+${analytics.messages_today} today`}
                    changeType="positive"
                    icon={MessageSquare}
                    description="Across all channels"
                  />
                  <MetricCard
                    title="Active Contacts"
                    value={formatNumber(analytics.total_contacts)}
                    change={`${analytics.active_conversations} active chats`}
                    changeType="positive"
                    icon={Users}
                    description="Engaged customers"
                  />
                  <MetricCard
                    title="Delivery Rate"
                    value={`${(analytics.delivery_rate * 100).toFixed(1)}%`}
                    change={analytics.delivery_rate > 0.9 ? "Excellent" : "Good"}
                    changeType={analytics.delivery_rate > 0.9 ? "positive" : "neutral"}
                    icon={Target}
                    description="Message success rate"
                  />
                  <MetricCard
                    title="Avg Response Time"
                    value={`${Math.round(analytics.response_time_avg / 60)}m`}
                    change={analytics.response_time_avg < 300 ? "Fast" : "Moderate"}
                    changeType={analytics.response_time_avg < 300 ? "positive" : "neutral"}
                    icon={Clock}
                    description="Customer support"
                  />
                </>
              ) : (
                // Fallback demo data
                <>
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
                </>
              )}
            </div>

            {/* Provider Statistics */}
            {analytics && (
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Channel Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(analytics.messages_by_provider).map(([provider, count]) => (
                      <div key={provider} className="flex items-center justify-between p-4 glass-subtle rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{provider}</p>
                          <p className="text-text-subtle text-sm">Messages sent</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{formatNumber(count)}</p>
                          <p className="text-xs text-text-subtle">
                            {((count / analytics.total_messages) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Activity Feed and Top Templates */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityFeed />
              
              {/* Top Templates */}
              <Card className="glass border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Top Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : analytics?.top_templates?.length ? (
                    <div className="space-y-4">
                      {analytics.top_templates.slice(0, 5).map((template, index) => (
                        <div key={template.id} className="flex items-center justify-between p-3 glass-subtle rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-text-subtle">{template.usage_count} uses</p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            Popular
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <TrendingUp className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-text-subtle">No template usage data yet</p>
                      <p className="text-sm text-text-subtle">Start using templates to see insights</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;