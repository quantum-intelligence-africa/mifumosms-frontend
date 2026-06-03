import { useState, type ComponentType, type SVGAttributes } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, MessageSquare } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

interface ChannelCardProps {
  title: string;
  description: string;
  cta: string;
  iconBg: string;
  iconColor: string;
  // Accepts Lucide icons AND our WhatsAppIcon (any SVG component with className).
  Icon: ComponentType<SVGAttributes<SVGSVGElement> & { strokeWidth?: number | string }>;
  onClick: () => void;
}

function ChannelCard({
  title,
  description,
  cta,
  iconBg,
  iconColor,
  Icon,
  onClick,
}: ChannelCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left",
        "rounded-2xl border border-border/70 dark:border-border/50",
        "bg-card dark:bg-card/95 active:scale-[0.99] transition-transform",
        "p-3.5 flex items-center gap-3",
      ].join(" ")}
    >
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.2} />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-[14px] font-bold text-foreground dark:text-foreground leading-tight">
          {title}
        </h3>
        <p className="text-[12px] text-foreground/60 dark:text-foreground/55 leading-snug mt-0.5 line-clamp-2">
          {description}
        </p>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
          {cta}
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
}

const SendHub = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 overflow-hidden">
      <div className="flex-shrink-0 h-full bg-card dark:bg-background border-r border-border dark:border-border/60">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        {/* Heading stays anchored at the top; the channel cards + campaign CTA
            vertically center in the remaining space on phones/tablets. On lg+
            screens everything top-aligns so longer content scrolls naturally. */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-4 md:p-6 max-w-3xl mx-auto w-full min-h-full flex flex-col">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-[16px] sm:text-lg font-bold text-foreground dark:text-foreground leading-tight">
                How do you want to send?
              </h2>
              <p className="text-[12px] sm:text-sm text-foreground/60 dark:text-foreground/55 leading-snug mt-0.5">
                Pick a channel to compose a new message.
              </p>
            </div>

            <div className="flex-1 flex flex-col justify-center lg:justify-start lg:flex-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <ChannelCard
                  title="Send an SMS"
                  description="Reach any mobile number. Branded with your approved Sender ID."
                  cta="Continue with SMS"
                  iconBg="bg-primary/10 dark:bg-primary/15"
                  iconColor="text-primary"
                  Icon={MessageSquare}
                  onClick={() => navigate("/messaging/send")}
                />

                <ChannelCard
                  title="Send on WhatsApp"
                  description="Rich media, buttons, and templates for two-way conversations."
                  cta="Continue with WhatsApp"
                  iconBg="bg-emerald-500/10 dark:bg-emerald-500/15"
                  iconColor="text-emerald-600 dark:text-emerald-400"
                  Icon={WhatsAppIcon}
                  onClick={() => navigate("/whatsapp")}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate("/messaging/campaigns")}
                className="mt-3 w-full flex items-center gap-3 rounded-2xl border border-border/70 dark:border-border/50 bg-muted/30 dark:bg-muted/15 p-3 text-left active:scale-[0.99] transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-[18px] h-[18px]" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground dark:text-foreground leading-tight">
                    Send to many at once
                  </p>
                  <p className="text-[11px] text-foreground/60 dark:text-foreground/55 leading-snug mt-0.5">
                    Create a campaign to schedule and track delivery.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground/40 flex-shrink-0" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SendHub;
