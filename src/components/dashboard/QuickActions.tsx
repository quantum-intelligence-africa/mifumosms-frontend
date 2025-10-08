import { Send, MessageSquare, Users, FileText, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

const quickActions = [
  {
    name: "Send Message",
    description: "Quick WhatsApp or SMS",
    icon: MessageSquare,
    variant: "default" as const,
    shortcut: "⌘ + N",
    to: "/sms/send?mode=single",
  },
  {
    name: "New Campaign",
    description: "Bulk messaging campaign",
    icon: Send,
    variant: "secondary" as const,
    shortcut: "⌘ + C",
    to: "/campaigns?new=true",
  },
  {
    name: "Add Contacts",
    description: "Import or add manually",
    icon: Users,
    variant: "outline" as const,
    shortcut: "⌘ + U",
    to: "/contacts?action=create",
  },
  {
    name: "Create Template",
    description: "Message template",
    icon: FileText,
    variant: "outline" as const,
    shortcut: "⌘ + T",
    to: "/templates?action=new",
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <Card className="p-6 glass border-0">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-secondary" />
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.name}
              variant={action.variant}
              className="h-auto p-4 flex-col items-start text-left whitespace-normal"
              onClick={() => action.to && navigate(action.to)}
            >
              <div className="flex items-center gap-3 w-full mb-2">
                <Icon className="w-5 h-5" />
                <span className="font-medium flex-1 min-w-0 whitespace-normal leading-snug">
                  {action.name}
                </span>
                <span className="ml-auto text-xs opacity-70">
                  {action.shortcut}
                </span>
              </div>
              <p className="text-xs opacity-80 text-left whitespace-normal break-words leading-snug">
                {action.description}
              </p>
            </Button>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border-subtle">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-subtle">Need help getting started?</span>
          <Button variant="link" size="sm" className="h-auto p-0 text-primary">
            View tutorials
          </Button>
        </div>
      </div>
    </Card>
  );
}
