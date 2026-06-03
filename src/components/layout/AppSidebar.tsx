import {
  MessageSquare,
  Users,
  Send,
  BarChart3,
  Settings,
  Home,
  Plus,
  ChevronDown,
  CreditCard,
  Tag,
  History,
  X,
  LogOut,
  BookOpen,
  Server,
  Bot,
  Mic,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, SVGAttributes } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { useRoles } from "@/hooks/useRoles";
import { useUserAvatar } from "@/hooks/useUserAvatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Accept both Lucide icons and our custom WhatsAppIcon — both are render-able
// SVG components that take a className + strokeWidth prop.
type NavIcon = LucideIcon | ComponentType<SVGAttributes<SVGSVGElement> & { strokeWidth?: number | string }>;

interface NavItem {
  name: string;
  href: string;
  icon: NavIcon;
  children?: NavItem[];
}

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [messagingOpen, setMessagingOpen] = useState(true);
  const { user, logout, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { isPartina } = useRoles();
  const { avatar } = useUserAvatar();

  // Mobile uses the bottom tab bar + 3-dot menu; the sidebar has no trigger
  // here, so keeping it mounted only causes a transition-transform flicker
  // when pages remount on every route change.
  if (isMobile) return null;

  const handleNavigation = (href: string) => {
    if (location.pathname === href) return;
    // Heavy pages (SendSMS, SenderNames) listen for this and abort in-flight work.
    window.dispatchEvent(new CustomEvent("page-navigate", { detail: { href } }));
    window.scrollTo(0, 0);
    navigate(href);
    if (isMobile && onClose) onClose();
  };

  const navigation: NavItem[] = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: Home },
    {
      name: "Messaging",
      href: "#",
      icon: MessageSquare,
      children: [
        { name: t("nav.send_sms"), href: "/messaging/send", icon: Send },
        { name: "WhatsApp", href: "/whatsapp", icon: WhatsAppIcon },
        { name: t("nav.campaigns"), href: "/messaging/campaigns", icon: BarChart3 },
        { name: t("nav.contacts"), href: "/messaging/contacts", icon: Users },
        { name: t("nav.sender_names"), href: "/messaging/sender-names", icon: Tag },
        { name: t("nav.purchase_sms"), href: "/messaging/purchase", icon: CreditCard },
        { name: t("nav.purchase_history"), href: "/messaging/history", icon: History },
      ],
    },
    { name: "AI Copilots", href: "/ai-copilots", icon: Bot },
    { name: "Voice Copilots", href: "/voice-copilots", icon: Mic },
    ...(isPartina()
      ? [
          { name: t("nav.partner_insights"), href: "/partner-insights", icon: BarChart3 },
          { name: t("nav.partner_reference"), href: "/partner-integration", icon: Server },
        ]
      : []),
    { name: t("nav.integration_guide"), href: "/integration-guide", icon: BookOpen },
    { name: t("nav.settings"), href: "/settings", icon: Settings },
  ];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const userName = isLoading
    ? "…"
    : user?.full_name || `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "User";
  const userEmail = isLoading ? "…" : user?.email || "";

  return (
    <TooltipProvider delayDuration={300}>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100]"
          onClick={onClose}
        />
      )}

      {/* Sidebar shell */}
      <aside
        className={[
          "flex flex-col h-screen bg-[hsl(var(--background))] border-r border-border/50 select-none",
          isMobile ? "w-[84vw] max-w-[320px]" : "w-[240px]",
          isMobile
            ? `fixed left-0 top-0 z-[110] shadow-2xl transition-transform duration-300 ease-smooth-out ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "relative",
        ].join(" ")}
        style={
          isMobile
            ? {
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }
            : undefined
        }
      >
        {/* ── Logo ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-14 w-auto -my-3 -mr-7" />
            <span className="text-[16px] font-bold text-foreground dark:text-foreground tracking-tight leading-none">
              {t("app.name")}
            </span>
          </div>

          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-foreground/70 dark:text-foreground/60 hover:text-foreground dark:hover:text-foreground hover:bg-accent dark:hover:bg-accent/50 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── Buy credits CTA ──────────────────────────── */}
        <div className="px-3 pb-3">
          <button
            onClick={() => handleNavigation("/messaging/purchase")}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-primary text-primary-foreground text-[13px] font-semibold tracking-tight hover:opacity-90 active:scale-[0.98] transition-all duration-100"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Buy SMS Credits
          </button>
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="mx-3 h-px bg-border/50 mb-2" />

        {/* ── Navigation ───────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5 scrollbar-none">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const hasChildren = !!item.children?.length;

            if (hasChildren) {
              const anyChildActive = item.children!.some(
                (c) => location.pathname === c.href
              );

              return (
                <Collapsible
                  key={item.name}
                  open={messagingOpen}
                  onOpenChange={setMessagingOpen}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={[
                        "w-full flex items-center gap-3 px-3 h-9 rounded-lg text-left",
                        "text-[13px] font-medium tracking-tight",
                        "transition-colors duration-100",
                        anyChildActive
                          ? "text-foreground dark:text-foreground font-semibold bg-primary/10 dark:bg-primary/15"
                          : "text-foreground/70 dark:text-foreground/60 hover:text-foreground dark:hover:text-foreground hover:bg-accent/60 dark:hover:bg-accent/30",
                      ].join(" ")}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                      <span className="flex-1 truncate">{item.name}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                          messagingOpen ? "" : "-rotate-90"
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-6 mt-0.5 mb-1 pl-3 border-l-2 border-border/40 space-y-0.5">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = location.pathname === child.href;

                        return (
                          <button
                            key={child.name}
                            onClick={() => handleNavigation(child.href)}
                            className={[
                              "w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-left",
                              "text-[12.5px] tracking-tight transition-colors duration-100",
                              childActive
                                ? "bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary font-semibold"
                                : "text-foreground/60 dark:text-foreground/50 hover:text-foreground dark:hover:text-foreground hover:bg-accent/50 dark:hover:bg-accent/30 font-normal",
                            ].join(" ")}
                          >
                            <ChildIcon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
                            <span className="truncate">{child.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={[
                  "w-full flex items-center gap-3 px-3 h-9 rounded-lg text-left",
                  "text-[13px] tracking-tight transition-colors duration-100",
                  isActive
                    ? "bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary font-semibold"
                    : "text-foreground/70 dark:text-foreground/60 hover:text-foreground dark:hover:text-foreground hover:bg-accent/60 dark:hover:bg-accent/30 font-medium",
                ].join(" ")}
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="mx-3 h-px bg-border/50 mt-2" />

        {/* ── User row ─────────────────────────────────── */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-3 px-2.5 py-2.5 rounded-lg hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors duration-100 group">
            <Avatar className="h-11 w-11 flex-shrink-0 ring-2 ring-border/60 dark:ring-border/40 shadow-sm">
              <AvatarImage src={avatar} alt={userName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-[13px] font-bold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground dark:text-foreground truncate leading-tight">
                {userName}
              </p>
              <p className="text-[11px] text-foreground/60 dark:text-foreground/50 truncate leading-tight mt-0.5">
                {userEmail}
              </p>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md text-foreground/40 dark:text-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-all duration-100"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">
                Sign out
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
