import { useMemo, useState } from "react";
import { Activity, CheckCircle, MessageSquare, Send, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { useDashboard } from "@/hooks/useDashboard";
import { cn } from "@/lib/utils";

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  time_ago: string;
  is_live: boolean;
  metadata?: Record<string, unknown>;
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "message_sent":
    case "reply":
    case "message":
      return MessageSquare;
    case "campaign_completed":
    case "campaign_completion":
    case "campaign":
      return Send;
    case "contact_added":
    case "contacts_added":
    case "contact":
      return Users;
    case "template_approval":
    case "template":
      return CheckCircle;
    default:
      return Activity;
  }
};

const getBadgeStyle = (activity: ActivityItem) => {
  if (activity.is_live) {
    return { label: "Live", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }
  if (activity.type === "campaign_completed") {
    return { label: "Completed", className: "bg-primary/10 text-primary border-primary/20" };
  }
  if (activity.type === "template_approval") {
    return { label: "Approved", className: "bg-blue-50 text-blue-700 border-blue-200" };
  }
  return { label: "Updated", className: "bg-slate-100 text-slate-700 border-slate-200" };
};

const NotificationsPage = () => {
  const { recentActivity, isLoading } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activities = useMemo<ActivityItem[]>(() => {
    if (!recentActivity) return [];
    return [...recentActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [recentActivity]);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-background via-background to-background/90">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-text-subtle mb-1">Activity Center</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  Live updates in one compact view
                </h1>
                <p className="text-sm text-text-subtle mt-2">
                  Showing the freshest five events from your workspace.
                </p>
              </div>
              <Badge variant="outline" className="text-[11px] font-semibold px-3 py-1 bg-success/10 text-success border-success/30">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Live
                </div>
              </Badge>
            </div>

            <Card className="p-4 sm:p-5 glass border border-border-subtle/80 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-text-subtle uppercase tracking-[0.12em]">Recent activity</p>
                    <p className="text-sm font-semibold text-foreground">Latest five events today</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[11px] px-3 py-1">
                  {activities.length} / 5
                </Badge>
              </div>

              <div className="space-y-3">
                {isLoading && activities.length === 0 && (
                  <>
                    {[...Array(3)].map((_, idx) => (
                      <div
                        key={idx}
                        className="h-16 rounded-xl bg-accent/50 border border-border-subtle/50 animate-pulse"
                        aria-label="Loading activity"
                      />
                    ))}
                  </>
                )}

                {!isLoading && activities.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-accent/40 rounded-xl border border-border-subtle">
                    <Activity className="w-7 h-7 text-text-subtle mb-2" />
                    <p className="text-sm font-semibold text-foreground">No activity yet</p>
                    <p className="text-xs text-text-subtle mt-1">
                      New events will appear here as they happen.
                    </p>
                  </div>
                )}

                {activities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  const badge = getBadgeStyle(activity);

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "relative flex items-start gap-3 p-4 rounded-xl border border-border-subtle/70 bg-background/80",
                        "hover:border-primary/30 hover:shadow-sm transition-transform duration-200",
                        "hover:-translate-y-[1px]"
                      )}
                    >
                      <div className="absolute left-1 top-1 bottom-1 w-[3px] rounded-full bg-primary/30" />
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground leading-tight">
                            {activity.title}
                          </p>
                          <span className="text-[11px] text-text-subtle whitespace-nowrap">
                            {activity.time_ago}
                          </span>
                        </div>
                        <p className="text-sm text-text-subtle mt-1 line-clamp-2">
                          {activity.description}
                        </p>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            variant="outline"
                            className={cn("text-[11px] px-2 py-1 border", badge.className)}
                          >
                            {badge.label}
                          </Badge>
                          <span className="text-[11px] text-text-subtle">
                            #{index + 1} of 5 today
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
