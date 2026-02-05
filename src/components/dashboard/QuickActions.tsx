import { Send, MessageSquare, Users, FileText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const quickActions = [
    {
      name: t("dashboard.quick_actions.send_message"),
      description: t("dashboard.quick_actions.send_message_desc"),
      icon: MessageSquare,
      variant: "default" as const,
      to: "/sms/send?mode=single",
    },
    {
      name: t("dashboard.quick_actions.add_campaign"),
      description: t("dashboard.quick_actions.add_campaign_desc"),
      icon: Send,
      variant: "secondary" as const,
      to: "/campaigns?new=true",
    },
    {
      name: t("dashboard.quick_actions.add_contacts"),
      description: t("dashboard.quick_actions.add_contacts_desc"),
      icon: Users,
      variant: "outline" as const,
      to: "/contacts?action=create",
    },
    {
      name: t("dashboard.quick_actions.create_template"),
      description: t("dashboard.quick_actions.create_template_desc"),
      icon: FileText,
      variant: "outline" as const,
      to: "/templates?action=new",
    },
  ];
  return (
    <Card className="p-5 sm:p-6 glass border border-border-subtle">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Zap className="w-4 h-4 text-secondary" />
        </div>
        <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
          {t("dashboard.quick_actions.title")}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.name}
              variant={action.variant}
              className="h-auto p-3 sm:p-3.5 flex-col items-start text-left whitespace-normal min-h-[75px] sm:min-h-[80px] hover:scale-[1.02] transition-all shadow-sm hover:shadow-md"
              onClick={() => action.to && navigate(action.to)}
            >
              <div className="flex items-center gap-2 w-full mb-1.5">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold text-[13px] sm:text-sm flex-1 min-w-0 leading-tight">
                  {action.name}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs opacity-70 text-left leading-snug">
                {action.description}
              </p>
            </Button>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
          <span className="text-text-subtle font-medium">{t("dashboard.quick_actions.need_help")}</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-primary text-xs sm:text-sm font-semibold hover:underline"
            onClick={() => window.open("https://wa.me/255614459923", "_blank")}
          >
            {t("dashboard.quick_actions.contact_support")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
