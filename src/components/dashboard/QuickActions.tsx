import { Send, MessageSquare, Users, FileText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

const quickActions = [
  {
    name: "Send Message",
    description: "Quick WhatsApp or SMS",
    icon: MessageSquare,
    variant: "default" as const,
    to: "/sms/send?mode=single",
  },
  {
    name: "Add New Campaign",
    description: "Bulk messaging campaign",
    icon: Send,
    variant: "secondary" as const,
    to: "/campaigns?new=true",
  },
  {
    name: "Add Contacts",
    description: "Import or add manually",
    icon: Users,
    variant: "outline" as const,
    to: "/contacts?action=create",
  },
  {
    name: "Create Template",
    description: "Message template",
    icon: FileText,
    variant: "outline" as const,
    to: "/templates?action=new",
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <Card className="p-4 sm:p-6 glass border-0">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
        <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.name}
              variant={action.variant}
              className="h-auto p-3 sm:p-4 flex-col items-start text-left whitespace-normal min-h-[80px] sm:min-h-[90px]"
              onClick={() => action.to && navigate(action.to)}
            >
              <div className="flex items-center gap-2 sm:gap-3 w-full mb-1 sm:mb-2">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base flex-1 min-w-0 leading-tight">
                  {action.name}
                </span>
              </div>
              <p className="text-xs sm:text-sm opacity-80 text-left leading-relaxed">
                {action.description}
              </p>
            </Button>
          );
        })}
      </div>

      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm">
          <span className="text-text-subtle">Hatuna tutorials kwa sasa. Unahitaji msaada?</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-primary text-xs sm:text-sm"
            onClick={() => window.open("https://wa.me/255614459923", "_blank")}
          >
            WhatsApp
          </Button>
        </div>
      </div>
    </Card>
  );
}
