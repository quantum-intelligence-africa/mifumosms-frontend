import { MoreHorizontal, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  sent: number;
  delivered: number;
  opened: number;
  progress: number;
  created_at: string;
  created_at_human: string;
}

interface RecentCampaignsProps {
  campaigns?: Campaign[];
}

const statusConfig = {
  completed: {
    color: "success",
    icon: CheckCircle,
    label: "Completed",
  },
  sending: {
    color: "warning",
    icon: Send,
    label: "Sending",
  },
  scheduled: {
    color: "muted",
    icon: Clock,
    label: "Scheduled",
  },
  failed: {
    color: "destructive",
    icon: AlertCircle,
    label: "Failed",
  },
};

export function RecentCampaigns({ campaigns = [] }: RecentCampaignsProps) {
  return (
    <Card className="p-6 glass border-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Recent Campaigns
        </h3>
        <Button variant="outline" size="sm">
          View all
        </Button>
      </div>

      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-text-subtle">
            <p>No campaigns yet</p>
            <p className="text-sm">Create your first campaign to get started</p>
          </div>
        ) : (
          campaigns.map((campaign) => {
          const StatusIcon = statusConfig[campaign.status as keyof typeof statusConfig]?.icon || Send;
          const statusColor = statusConfig[campaign.status as keyof typeof statusConfig]?.color || "muted";

          return (
            <div
              key={campaign.id}
              className="p-4 rounded-lg glass-subtle hover:bg-accent/30 transition-smooth"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{campaign.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {campaign.type}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 text-${statusColor}`} />
                    <span className={`text-sm text-${statusColor} capitalize`}>
                      {statusConfig[campaign.status as keyof typeof statusConfig]?.label}
                    </span>
                    <span className="text-sm text-text-subtle">•</span>
                    <span className="text-sm text-text-subtle">{campaign.created_at_human}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass">
                    <DropdownMenuItem>View details</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {campaign.status === "sending" && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-text-subtle mb-1">
                    <span>Progress</span>
                    <span>{campaign.progress}%</span>
                  </div>
                  <Progress value={campaign.progress} className="h-2" />
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-text-subtle">
                    Sent: <span className="text-foreground font-medium">{campaign.sent}</span>
                  </span>
                  <span className="text-text-subtle">
                    Delivered: <span className="text-foreground font-medium">{campaign.delivered}</span>
                  </span>
                  {campaign.opened > 0 && (
                    <span className="text-text-subtle">
                      Opened: <span className="text-foreground font-medium">{campaign.opened}</span>
                    </span>
                  )}
                </div>

              </div>
            </div>
          );
        })
        )}
      </div>
    </Card>
  );
}
