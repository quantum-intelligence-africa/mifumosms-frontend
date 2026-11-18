import { Send, MessageSquare, Users, FileText, Play, PhoneOutgoing, Workflow, Phone, MessageSquareText, Bot, Headphones, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDialer } from "@/contexts/DialerContext";
import { hasSmsAccess, hasIvrAccess, canUseCallCenter } from "@/utils/roleUtils";
import { useServices } from "@/hooks/useServices";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type QuickAction = {
  name: string;
  description: string;
  icon: typeof MessageSquare;
  variant: "default" | "secondary" | "outline";
  to?: string;
  onClick?: () => void;
};

export function QuickActions() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { openDialer } = useDialer();
  const services = useServices();
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [more, setMore] = useState(false);
  const showSms = hasSmsAccess(user);
  const showIvr = hasIvrAccess(user);
  const showTutorial = showSms || !showIvr; // the video is the SMS tutorial; voice-only users never see it

  // Contacts are shared by SMS and Voice/IVR alike, so it always shows —
  // everything else here is specific to whichever product(s) this account
  // actually has access to (accounts.sms_access_enabled / ivr_access_enabled).
  const contactsAction: QuickAction = {
    name: t("dashboard.quick_actions.add_contacts"),
    description: t("dashboard.quick_actions.add_contacts_desc"),
    icon: Users,
    variant: "outline",
    to: "/contacts?action=create",
  };

  const smsActions: QuickAction[] = [
    {
      name: t("dashboard.quick_actions.send_message"),
      description: t("dashboard.quick_actions.send_message_desc"),
      icon: MessageSquare,
      variant: "default",
      to: "/sms/send?mode=single",
    },
    {
      name: t("dashboard.quick_actions.add_sender_id"),
      description: t("dashboard.quick_actions.add_sender_id_desc"),
      icon: Send,
      variant: "secondary",
      to: "/sms/sender-names?action=request",
    },
    {
      name: t("dashboard.quick_actions.add_campaign"),
      description: t("dashboard.quick_actions.add_campaign_desc"),
      icon: FileText,
      variant: "outline",
      to: "/campaigns?new=true",
    },
  ];

  const ivrActions: QuickAction[] = [
    {
      name: t("dashboard.quick_actions.make_call"),
      description: t("dashboard.quick_actions.make_call_desc"),
      icon: PhoneOutgoing,
      variant: "default",
      onClick: () => openDialer(),
    },
    {
      name: t("dashboard.quick_actions.add_ivr_flow"),
      description: t("dashboard.quick_actions.add_ivr_flow_desc"),
      icon: Workflow,
      variant: "secondary",
      to: "/voice/ivr",
    },
    {
      name: t("dashboard.quick_actions.add_phone_number"),
      description: t("dashboard.quick_actions.add_phone_number_desc"),
      icon: Phone,
      variant: "outline",
      to: "/voice/numbers",
    },
  ];

  // The things people do every day come first; setup tasks sit behind "More" so the card stays light.
  const everyday: QuickAction[] = [
    ...(showSms ? [smsActions[0]] : []),
    contactsAction,
    ...(services.sms
      ? [{ name: "WhatsApp", description: "", icon: MessageSquare, variant: "outline" as const, to: "/whatsapp" }]
      : []),
    ...(services.inbox ? [{ name: "Team Inbox", description: "", icon: MessageSquareText, variant: "outline" as const, to: "/conversations" }] : []),
    ...(showSms && !showIvr ? [{ name: t("nav.ai_copilots"), description: "", icon: Bot, variant: "outline" as const, to: "/ai-copilots" }] : []),
    ...(showIvr && canUseCallCenter(user) ? [{ name: t("nav.voice_ivr"), description: "", icon: Headphones, variant: "outline" as const, to: "/call-center" }] : []),
    ...(showIvr ? [ivrActions[0]] : []),
  ];
  const setup: QuickAction[] = [...(showSms ? smsActions.slice(1) : []), ...(showIvr ? ivrActions.slice(1) : [])];
  const quickActions = more ? [...everyday, ...setup] : everyday;
  return (
    <Card className="rounded-lg border border-border bg-card p-4 shadow-none">
      <h3 className="mb-3 text-sm font-semibold text-foreground">{t("dashboard.quick_actions.title")}</h3>

      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const primary = action.variant === "default";
          return (
            <button
              key={action.name}
              type="button"
              onClick={() => (action.onClick ? action.onClick() : action.to && navigate(action.to))}
              className={[
                "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-[13px] font-medium transition-colors",
                primary ? "border-primary bg-primary text-primary-foreground hover:opacity-90" : "border-border bg-background text-foreground hover:bg-accent/60",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              {action.name}
            </button>
          );
        })}
        {setup.length > 0 && (
          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            aria-expanded={more}
            className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            {more ? t("dashboard.overview.less") : t("dashboard.overview.more")}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${more ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex flex-row gap-2">
          {showTutorial && (
            <Button
              variant="link"
              size="sm"
              className="flex-1 h-auto p-0 text-primary text-[10px] sm:text-xs font-semibold hover:underline justify-center"
              onClick={() => setShowVideoModal(true)}
            >
              <Play className="w-3 h-3 mr-1" />
              {t("dashboard.quick_actions.view_tutorial")}
            </Button>
          )}
          <Button
            variant="link"
            size="sm"
            className="flex-1 h-auto p-0 text-primary text-[10px] sm:text-xs font-semibold hover:underline justify-center"
            onClick={() => window.open("https://wa.me/255615229007", "_blank")}
          >
            {t("dashboard.quick_actions.contact_support")}
          </Button>
        </div>
      </div>

      {/* Video Tutorial Modal */}
      <Dialog open={showTutorial && showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="glass w-full max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-3 sm:p-4 rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Play className="w-5 h-5 text-primary" />
              {t("dashboard.quick_actions.view_tutorial")}
            </DialogTitle>
            <DialogDescription>
              {t("dashboard.quick_actions.tutorial_description")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex items-center justify-center bg-black/5 dark:bg-black/20 rounded-lg overflow-hidden min-h-[400px]">
            <video
              key={showVideoModal ? "visible" : "hidden"}
              controls
              autoPlay
              className="w-full h-full max-h-[500px] object-contain"
              style={{ maxWidth: "100%", maxHeight: "500px" }}
            >
              <source src="/tutorial/mfumosms video tutorial.mp4" type="video/mp4" />
              <p className="text-center text-text-subtle p-4">
                {t("pg.QuickActions.1004")}
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
