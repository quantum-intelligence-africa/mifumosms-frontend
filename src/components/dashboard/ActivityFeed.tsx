import { MessageSquare, Send, Users, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const activities = [
  {
    id: 1,
    type: "message",
    user: "John Kamau",
    action: "replied to conversation",
    target: "Kenya Coffee Exports",
    time: "2 min ago",
    icon: MessageSquare,
    status: "unread",
  },
  {
    id: 2,
    type: "campaign",
    user: "System",
    action: "completed campaign",
    target: "Mother's Day Promotion",
    time: "15 min ago",
    icon: Send,
    status: "success",
    stats: "98% delivered",
  },
  {
    id: 3,
    type: "contact",
    user: "Sarah Mwangi",
    action: "added 25 new contacts",
    target: "Nairobi SME List",
    time: "1 hour ago",
    icon: Users,
    status: "completed",
  },
  {
    id: 4,
    type: "template",
    user: "David Ochieng",
    action: "approved template",
    target: "Welcome Message - Swahili",
    time: "2 hours ago",
    icon: CheckCircle,
    status: "approved",
  },
];

export function ActivityFeed() {
  return (
    <Card className="p-6 glass border-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Recent Activity
        </h3>
        <Badge variant="outline" className="text-xs">
          Live
        </Badge>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-smooth"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="w-4 h-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.user}</span>{" "}
                      {activity.action}{" "}
                      <span className="font-medium text-primary">
                        {activity.target}
                      </span>
                    </p>

                    {activity.stats && (
                      <p className="text-xs text-text-subtle mt-1">
                        {activity.stats}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs text-text-subtle whitespace-nowrap">
                      {activity.time}
                    </span>
                    {activity.status === "unread" && (
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle">
        <button className="w-full text-sm text-primary hover:text-primary-dark transition-smooth">
          View all activity
        </button>
      </div>
    </Card>
  );
}
