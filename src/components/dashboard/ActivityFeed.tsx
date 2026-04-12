import { MessageSquare, Send, Users, CheckCircle, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/useDashboard";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

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
  const { t } = useLanguage();

  const handleViewAllActivity = () => {
    navigate('/notifications');
  };

  return (
    <Card className="p-3.5 sm:p-4 glass border border-border-subtle">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-base font-semibold text-foreground">
          {t("dashboard.activity.title")}
        </h3>
        <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 bg-success/10 text-success border-success/20">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            {t("dashboard.activity.live")}
          </div>
        </Badge>
      </div>

      <div className="space-y-2">
        {activities.length > 0 ? (
          activities.slice(0, 4).map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const status = getActivityStatus(activity.type, activity.is_live);

            return (
              <div
                key={activity.id || `activity-${index}`}
                className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-fast overflow-hidden"
              >
                <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
                  <Icon className="w-3 h-3 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground font-medium leading-tight truncate">
                        {activity.title}
                      </p>

                      <p className="text-[11px] text-text-subtle mt-0.5 line-clamp-1">
                        {activity.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                      <span className="text-[11px] text-text-subtle whitespace-nowrap">
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
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-muted/50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <h4 className="text-xs font-medium text-foreground mb-0.5">{t("dashboard.activity.none")}</h4>
            <p className="text-[11px] text-text-subtle">Start sending messages to see activity here</p>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-border-subtle -mx-3.5 -mb-3.5 sm:-mx-4 sm:-mb-4 px-3.5 sm:px-4 py-2">
        <button
          onClick={handleViewAllActivity}
          className="w-full text-xs text-primary hover:text-primary-dark transition-smooth"
        >
          {t("dashboard.activity.view_all")}
        </button>
      </div>
    </Card>
  );
}
