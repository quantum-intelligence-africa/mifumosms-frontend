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
    <Card className="p-4 glass border-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Recent Activity
        </h3>
        <Badge variant="outline" className="text-xs">
          Live
        </Badge>
      </div>

      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.slice(0, 3).map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const status = getActivityStatus(activity.type, activity.is_live);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-smooth"
              >
                <div className="p-1.5 rounded-md bg-primary/10">
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
