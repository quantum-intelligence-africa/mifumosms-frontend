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
import { useLanguage } from "@/hooks/useLanguage";

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

export function RecentCampaigns({ campaigns = [] }: RecentCampaignsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const statusConfig = {
    completed: {
      color: "success",
      icon: CheckCircle,
      label: t("dashboard.recent_campaigns.status.completed"),
    },
    sending: {
      color: "warning",
      icon: Send,
      label: t("dashboard.recent_campaigns.status.sending"),
    },
    scheduled: {
      color: "muted",
      icon: Clock,
      label: t("dashboard.recent_campaigns.status.scheduled"),
    },
    failed: {
      color: "destructive",
      icon: AlertCircle,
      label: t("dashboard.recent_campaigns.status.failed"),
    },
  };

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
    <Card className="p-3.5 sm:p-4 glass border border-border-subtle">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm sm:text-base font-semibold text-foreground">
          {t("dashboard.recent_campaigns.title")}
        </h3>
        <Button variant="outline" size="sm" onClick={handleViewAll} className="text-xs sm:text-sm font-medium h-7 sm:h-8 px-2 sm:px-3">
          {t("dashboard.recent_campaigns.view_all")}
        </Button>
      </div>

      <div className="space-y-2">
        {campaigns.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-muted/50 flex items-center justify-center">
              <Send className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <h4 className="text-xs font-medium text-foreground mb-0.5">{t("dashboard.recent_campaigns.empty_title")}</h4>
            <p className="text-[11px] text-text-subtle mb-3">{t("dashboard.recent_campaigns.empty_subtitle")}</p>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/campaigns?new=true')}
              className="text-xs sm:text-sm"
            >
              {t("dashboard.quick_actions.add_campaign")}
            </Button>
          </div>
        ) : (
          campaigns.slice(0, 3).map((campaign, index) => {
          const StatusIcon = statusConfig[campaign.status as keyof typeof statusConfig]?.icon || Send;
          const statusColor = statusConfig[campaign.status as keyof typeof statusConfig]?.color || "muted";

          return (
            <div
              key={campaign.id || `campaign-${index}`}
              className="p-2.5 rounded-lg glass-subtle hover:bg-accent hover:shadow-sm transition-all cursor-pointer border border-transparent hover:border-border overflow-hidden"
              onClick={() => handleViewDetails(campaign.id)}
            >
              <div className="flex items-start justify-between mb-2 gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 min-w-0">
                    <h4 className="font-medium text-foreground text-[12px] truncate">{campaign.name}</h4>
                    {campaign.type && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                        {campaign.type}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 overflow-x-hidden">
                    <StatusIcon className={`w-3 h-3 text-${statusColor} flex-shrink-0`} />
                    <span className={`text-[11px] text-${statusColor} capitalize flex-shrink-0`}>
                      {statusConfig[campaign.status as keyof typeof statusConfig]?.label}
                    </span>
                    <span className="text-[11px] text-text-subtle flex-shrink-0">•</span>
                    <span className="text-[11px] text-text-subtle whitespace-nowrap">{campaign.created_at_human}</span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
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
                      {t("dashboard.recent_campaigns.menu.view_details")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate(campaign.id);
                    }}>
                      {t("dashboard.recent_campaigns.menu.duplicate")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(campaign.id);
                    }}>
                      {t("dashboard.recent_campaigns.menu.edit")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {campaign.status === "sending" && (
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[11px] text-text-subtle mb-1">
                    <span>{t("dashboard.recent_campaigns.progress")}</span>
                    <span>{campaign.progress}%</span>
                  </div>
                  <Progress value={campaign.progress} className="h-1.5" />
                </div>
              )}

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-text-subtle">
                    {t("dashboard.recent_campaigns.sent")}: <span className="text-foreground font-medium">{campaign.sent}</span>
                  </span>
                  <span className="text-text-subtle">
                    {t("dashboard.recent_campaigns.delivered")}: <span className="text-foreground font-medium">{campaign.delivered}</span>
                  </span>
                  {campaign.opened > 0 && (
                    <span className="text-text-subtle">
                      {t("dashboard.recent_campaigns.opened")}: <span className="text-foreground font-medium">{campaign.opened}</span>
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
