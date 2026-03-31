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
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { useRoles } from "@/hooks/useRoles";
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

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
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

  const handleNavigation = (href: string) => {
    if (location.pathname !== href) {
      const isLeavingHeavyPage =
        location.pathname.includes("/sms/send") ||
        location.pathname.includes("/messaging/send") ||
        location.pathname.includes("/sms/sender-names") ||
        location.pathname.includes("/messaging/sender-names");

      if (isLeavingHeavyPage) {
        window.location.href = href;
      } else {
        window.dispatchEvent(new CustomEvent("page-navigate", { detail: { href } }));
        setTimeout(() => {
          window.scrollTo(0, 0);
          navigate(href);
          if (isMobile && onClose) onClose();
        }, 10);
      }
    }
  };

  const navigation: NavItem[] = [
    { name: t("nav.dashboard"), href: "/dashboard", icon: Home },
    {
      name: "Messaging",
      href: "#",
      icon: MessageSquare,
      children: [
        { name: t("nav.send_sms"), href: "/messaging/send", icon: Send },
        { name: t("nav.campaigns"), href: "/messaging/campaigns", icon: BarChart3 },
        { name: t("nav.contacts"), href: "/messaging/contacts", icon: Users },
        { name: t("nav.sender_names"), href: "/messaging/sender-names", icon: Tag },
        { name: t("nav.purchase_sms"), href: "/messaging/purchase", icon: CreditCard },
        { name: t("nav.purchase_history"), href: "/messaging/history", icon: History },
      ],
    },
    { name: "AI Agents", href: "/ai-agents", icon: Bot },
    { name: "Voice Agents", href: "/voice-agents", icon: Mic },
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
          /* base */
          "flex flex-col h-screen bg-[hsl(var(--background))] border-r border-border/50 select-none",
          /* sizing */
          "w-[220px]",
          /* mobile positioning */
          isMobile
            ? `fixed left-0 top-0 z-[110] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${
                isOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "relative",
        ].join(" ")}
      >
        {/* ── Logo ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            {/* App icon */}
            <div className="w-7 h-7 rounded-[8px] bg-primary flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-[14px] h-[14px] text-primary-foreground" strokeWidth={2.2} />
            </div>
            <span className="text-[13px] font-semibold text-gray-950 tracking-[-0.01em] leading-none">
              {t("app.name")}
            </span>
          </div>

          {/* Mobile close */}
          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-md text-gray-700 hover:text-gray-950 hover:bg-accent transition-colors"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── Buy credits CTA ──────────────────────────── */}
        <div className="px-3 pb-3">
          <button
            onClick={() => handleNavigation("/messaging/purchase")}
            className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium tracking-[-0.01em] hover:opacity-90 active:scale-[0.98] transition-all duration-100"
          >
            <Plus className="w-3 h-3" strokeWidth={2.5} />
            Buy SMS Credits
          </button>
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="mx-3 h-px bg-border/50 mb-2" />

        {/* ── Navigation ───────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 scrollbar-none">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            const hasChildren = !!item.children?.length;

            /* Group with children */
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
                        "w-full flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-left",
                        "text-[12px] font-medium tracking-[-0.01em]",
                        "transition-colors duration-100",
                        anyChildActive
                          ? "text-gray-950 font-semibold"
                          : "text-gray-800 hover:text-gray-950 hover:bg-accent/60",
                      ].join(" ")}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
                      <span className="flex-1 truncate">{item.name}</span>
                      <ChevronDown
                        className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
                          messagingOpen ? "" : "-rotate-90"
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="ml-[22px] mt-0.5 mb-1 pl-3 border-l border-border/60 space-y-0.5">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = location.pathname === child.href;

                        return (
                          <button
                            key={child.name}
                            onClick={() => handleNavigation(child.href)}
                            className={[
                              "w-full flex items-center gap-2 px-2 h-7 rounded-md text-left",
                              "text-[11.5px] tracking-[-0.01em] transition-colors duration-100",
                              childActive
                                ? "bg-accent text-gray-950 font-semibold"
                                : "text-gray-800 hover:text-gray-950 hover:bg-accent/50 font-normal",
                            ].join(" ")}
                          >
                            <ChildIcon className="w-3 h-3 flex-shrink-0" strokeWidth={1.8} />
                            <span className="truncate">{child.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            }

            /* Leaf item */
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={[
                  "w-full flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-left",
                  "text-[12px] tracking-[-0.01em] transition-colors duration-100",
                  isActive
                    ? "bg-accent text-gray-950 font-semibold"
                    : "text-gray-800 hover:text-gray-950 hover:bg-accent/60 font-normal",
                ].join(" ")}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.8} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="mx-3 h-px bg-border/50 mt-2" />

        {/* ── User row ─────────────────────────────────── */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors duration-100 group">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-[11.5px] font-semibold text-gray-900 truncate leading-tight">
                {userName}
              </p>
              <p className="text-[10.5px] text-gray-600 truncate leading-tight">
                {userEmail}
              </p>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md text-gray-500 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all duration-100"
                >
                  <LogOut className="w-3 h-3" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[11px]">
                Sign out
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
