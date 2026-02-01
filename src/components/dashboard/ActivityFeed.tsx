import { MessageSquare, Send, Users, CheckCircle, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/useDashboard";
import { useNavigate } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  time_ago: string;
  is_live: boolean;
  metadata: {
    [key: string]: any;
  };
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'message_sent':
    case 'reply':
    case 'message':
      return MessageSquare;
    case 'campaign_completed':
    case 'campaign_completion':
    case 'campaign':
      return Send;
    case 'contact_added':
    case 'contacts_added':
    case 'contact':
      return Users;
    case 'template_approval':
    case 'template':
      return CheckCircle;
    default:
      return Activity;
  }
};

const getActivityStatus = (type: string, isLive?: boolean) => {
  if (isLive) return 'unread';
  if (type === 'campaign_completed') return 'success';
  if (type === 'template_approval') return 'approved';
  return 'completed';
};

export function ActivityFeed() {
  const { recentActivity } = useDashboard();
  const navigate = useNavigate();
  const activities = recentActivity || [];

  const handleViewAllActivity = () => {
    navigate('/notifications');
  };

  return (
    <Card className="p-5 sm:p-6 glass border border-border-subtle">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Recent Activity
        </h3>
        <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 bg-success/10 text-success border-success/20">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live
          </div>
        </Badge>
      </div>

      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.slice(0, 3).map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const status = getActivityStatus(activity.type, activity.is_live);

            return (
              <div
                key={activity.id || `activity-${index}`}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent transition-fast"
              >
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-foreground font-medium leading-tight">
                        {activity.title}
                      </p>

                      <p className="text-xs text-text-subtle mt-0.5 line-clamp-1">
                        {activity.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-xs text-text-subtle whitespace-nowrap">
                        {activity.time_ago}
                      </span>
                      {activity.is_live && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6">
            <Activity className="w-6 h-6 text-text-subtle mx-auto mb-2" />
            <p className="text-xs text-text-subtle">No recent activity</p>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border-subtle">
        <button
          onClick={handleViewAllActivity}
          className="w-full text-xs text-primary hover:text-primary-dark transition-smooth"
        >
          View all activity
        </button>
      </div>
    </Card>
  );
}
