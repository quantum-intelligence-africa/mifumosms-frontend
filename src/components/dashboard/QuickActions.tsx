import { Send, MessageSquare, Users, FileText, Rocket, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const quickActions = [
    {
      name: t("dashboard.quick_actions.send_message"),
      description: t("dashboard.quick_actions.send_message_desc"),
      icon: MessageSquare,
      variant: "default" as const,
      to: "/sms/send?mode=single",
    },
    {
      name: t("dashboard.quick_actions.add_sender_id"),
      description: t("dashboard.quick_actions.add_sender_id_desc"),
      icon: Send,
      variant: "secondary" as const,
      to: "/sms/sender-names?action=request",
    },
    {
      name: t("dashboard.quick_actions.add_contacts"),
      description: t("dashboard.quick_actions.add_contacts_desc"),
      icon: Users,
      variant: "outline" as const,
      to: "/contacts?action=create",
    },
    {
      name: t("dashboard.quick_actions.add_campaign"),
      description: t("dashboard.quick_actions.add_campaign_desc"),
      icon: FileText,
      variant: "outline" as const,
      to: "/campaigns?new=true",
    }
  ];
  return (
    <Card className="p-5 sm:p-6 glass border border-border-subtle">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-lg bg-primary/10">
          <Rocket className="w-4 h-4 text-primary" />
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
              className="h-[100px] sm:h-[105px] p-3 sm:p-4 flex-col items-start text-left whitespace-normal hover:scale-[1.02] transition-all shadow-sm hover:shadow-md"
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
  <div className="flex flex-row gap-2">
    <Button
      variant="link"
      size="sm"
      className="flex-1 h-auto p-0 text-primary text-xs sm:text-sm font-semibold hover:underline justify-center"
      onClick={() => setShowVideoModal(true)}
    >
      <Play className="w-3 h-3 mr-1" />
      {t("dashboard.quick_actions.view_tutorial")}
    </Button>
    <Button
      variant="link"
      size="sm"
      className="flex-1 h-auto p-0 text-primary text-xs sm:text-sm font-semibold hover:underline justify-center"
      onClick={() => window.open("https://wa.me/255615229007", "_blank")}
    >
      {t("dashboard.quick_actions.contact_support")}
    </Button>
  </div>
</div>

      {/* Video Tutorial Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="glass max-w-2xl max-h-[90vh] flex flex-col p-4 rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Play className="w-5 h-5 text-primary" />
              {t("dashboard.quick_actions.view_tutorial")}
            </DialogTitle>
            <DialogDescription>
              {t("dashboard.quick_actions.tutorial_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden min-h-[400px]">
            <video
              key={showVideoModal ? "visible" : "hidden"}
              controls
              autoPlay
              className="w-full h-full max-h-[500px] object-contain"
              style={{ maxWidth: "100%", maxHeight: "500px" }}
            >
              <source src="/tutorial/mfumosms video tutorial.mp4" type="video/mp4" />
              <p className="text-center text-text-subtle p-4">
                Your browser does not support the video tag. Please download the video to watch it.
              </p>
            </video>
          </div>

          {/* <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowVideoModal(false)}
              className="flex-1 text-sm h-9"
            >
              Close
            </Button>
            <Button
              variant="default"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "/tutorial/mfumosms video tutorial.mp4";
                link.download = "mfumosms-tutorial.mp4";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="flex-1 text-sm h-9"
            >
              Download Video
            </Button>
          </div> */}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
