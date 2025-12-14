import { useMemo, useState } from 'react';
import { Activity, CheckCircle, MessageSquare, Send, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { useDashboard } from '@/hooks/useDashboard';
import { cn } from '@/lib/utils';

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

const NotificationsPage = () => {
  const { recentActivity, isLoading } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activities = useMemo<ActivityItem[]>(() => {
    if (!recentActivity) return [];
    return [...recentActivity].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [recentActivity]);

  const liveCount = activities.filter((a) => a.is_live).length;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 lg:p-6">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2 glass border border-border-subtle">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-text-subtle">Activity Center</p>
                      <CardTitle className="text-xl font-semibold mt-1">All activity</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[11px] px-3 py-1 bg-success/10 text-success border-success/20">
                      {liveCount} Live
                    </Badge>
                  </div>
                  <p className="text-sm text-text-subtle mt-1">
                    Showing {activities.length} events, newest first.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {activities.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No activity found</h3>
                      <p className="text-sm">New activity will appear here.</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[640px]">
                      <div className="divide-y divide-border-subtle">
                        {activities.map((activity) => {
                          const Icon = getActivityIcon(activity.type);
                          return (
                            <div
                              key={activity.id}
                              className="px-5 py-4 hover:bg-accent transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                  <Icon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-sm font-semibold text-foreground">{activity.title}</h3>
                                      <p className="text-sm text-text-subtle mt-1">{activity.description}</p>
                                    </div>
                                    <span className="text-xs text-text-subtle whitespace-nowrap">{activity.time_ago}</span>
                                  </div>
                                  {activity.is_live && (
                                    <Badge variant="outline" className="mt-2 text-[11px] bg-green-50 text-green-700 border-green-200">
                                      Live
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card className="glass border border-border-subtle h-full">
                <CardHeader>
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-subtle">Total events</span>
                    <span className="text-base font-semibold text-foreground">{activities.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-subtle">Live</span>
                    <span className="text-base font-semibold text-success">{liveCount}</span>
                  </div>
                  <div className="text-xs text-text-subtle bg-accent/60 border border-border-subtle rounded-lg p-3">
                    Activities update here as new events arrive. Use this view for a full history beyond the dashboard preview.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
