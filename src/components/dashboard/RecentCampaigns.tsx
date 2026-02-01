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
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: string;
  name: string;
  type?: string;
  campaign_type?: string;
  campaign_type_display?: string;
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleViewAll = () => {
    navigate('/campaigns');
  };

  const handleViewDetails = (campaignId: string) => {
    navigate(`/campaigns?campaign=${campaignId}`);
  };

  const handleDuplicate = (campaignId: string) => {
    navigate(`/campaigns?campaign=${campaignId}&action=duplicate`);
  };

  const handleEdit = (campaignId: string) => {
    navigate(`/campaigns?campaign=${campaignId}&mode=edit`);
  };

  return (
    <Card className="p-6 glass border border-border-subtle">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
          Recent Campaigns
        </h3>
        <Button variant="outline" size="sm" onClick={handleViewAll} className="text-[13px] font-medium">
          View all →
        </Button>
      </div>

      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-text-subtle">
            <p>No campaigns yet</p>
            <p className="text-sm">Create your first campaign to get started</p>
          </div>
        ) : (
          campaigns.slice(0, 3).map((campaign, index) => {
          const StatusIcon = statusConfig[campaign.status as keyof typeof statusConfig]?.icon || Send;
          const statusColor = statusConfig[campaign.status as keyof typeof statusConfig]?.color || "muted";

          return (
            <div
              key={campaign.id || `campaign-${index}`}
              className="p-3 rounded-xl glass-subtle hover:bg-accent hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-border"
              onClick={() => handleViewDetails(campaign.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground text-xs sm:text-sm">{campaign.name}</h4>
                    {campaign.type && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        {campaign.type}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-3 h-3 text-${statusColor}`} />
                    <span className={`text-xs text-${statusColor} capitalize`}>
                      {statusConfig[campaign.status as keyof typeof statusConfig]?.label}
                    </span>
                    <span className="text-xs text-text-subtle">•</span>
                    <span className="text-xs text-text-subtle">{campaign.created_at_human}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(campaign.id);
                    }}>
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(campaign.id);
                    }}>
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(campaign.id);
                    }}>
                      Edit
                    </DropdownMenuItem>
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

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 sm:gap-4">
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
