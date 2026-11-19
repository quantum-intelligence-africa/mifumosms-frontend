import {
  MessageSquare,
  Users,
  Send,
  BarChart3,
  Settings,
  Home,
  ChevronDown,
  CreditCard,
  Tag,
  History,
  Inbox,
  CheckCircle2,
  CalendarClock,
  X,
  LogOut,
  BookOpen,
  Server,
  Bot,
  Mic,
  Workflow,
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneOutgoing,
  Sparkles,
  Voicemail,
  Users2,
  MessageSquareText,
  Headphones,
  PhoneMissed,
  Megaphone,
  ChevronsLeft,
  ChevronsRight,
  Search,
  FileText,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useBranding } from "@/contexts/BrandingContext";
import { useMessageBadgeCounts } from "@/hooks/useMessageBadgeCounts";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, SVGAttributes } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { ccKey } from "@/i18n/callCenter";
import { getCallCenterSections, pathMatches } from "@/components/layout/callCenterSections";
import { useAuth } from "@/contexts/AuthContext";
import { useMissedSummary } from "@/hooks/useMissedSummary";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useDialer } from "@/contexts/DialerContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { useRoles } from "@/hooks/useRoles";
import { useFeatures } from "@/hooks/useFeatures";
import { useServices } from "@/hooks/useServices";
import { OrganizationSwitcher } from "@/components/layout/OrganizationSwitcher";
import {
  canUseCallCenter, getCallCenterRole, hasIvrAccess, hasSmsAccess, isCallCenterAdmin, isCallCenterSupervisor,
} from "@/utils/roleUtils";
import { useComingSoonFeatures } from "@/hooks/useComingSoonFeatures";
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
  badge?: number;
  comingSoon?: boolean;
  /** Stable key for a collapsible group's open/closed state — `name` alone
   * isn't safe once it's a translated string that changes with `language`. */
  id?: string;
  /** Extra paths that also mark this entry active (e.g. every tab of its section). */
  matchPaths?: string[];
}

interface AppSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const COLLAPSE_KEY = "senda_sidebar_collapsed";

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export function AppSidebar({ isOpen = true, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  // A narrow icon rail on desktop (remembered), and a quick filter over every menu entry.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
  });
  const [query, setQuery] = useState("");
  const toggleCollapsed = () => {
    setCollapsed((v) => {
      try { localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1"); } catch { /* not remembered */ }
      return !v;
    });
  };
  // Live counts for the Outbox (failed), Sent and Scheduled badges: one cached query shared by every page.
  const { outboxCount, sentCount, scheduledCount } = useMessageBadgeCounts();
  const { user, logout, isLoading } = useAuth();
  const { hasFeature } = useFeatures();
  const services = useServices();
  const cc = useCallCenter();
  const missedSummary = useMissedSummary();
  const brand = useBranding();
  const { openDialer } = useDialer();

  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { isPartina } = useRoles();
  const { avatar } = useUserAvatar();
  const { isComingSoon } = useComingSoonFeatures();

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

  // Call-center-only agents get a deliberately small menu: their workspace, their calls, and settings.
  const agentOnly = getCallCenterRole(user) === "agent";
  const callCenterOnly = hasIvrAccess(user) && !services.sms;
  // Only the shared inbox: a small menu (the inbox, its settings, team invitations) with nothing from the other services.
  const inboxOnly = services.inboxOnly;

  // Call center and Voice/IVR are one product. The pages behind "Calls", "Manage" and "Set up" are reached through tabs across the top
  // of each page (see callCenterSections.ts), which keeps this short. Each entry appears only for people who may use it.
  const sections = getCallCenterSections(user);
  const sectionItems: NavItem[] = sections.map((sec) => ({
    name: t(ccKey(sec.labelKey)),
    href: sec.tabs[0].href,
    icon: sec.icon,
    matchPaths: sec.tabs.map((tab) => tab.href),
    // One "Calls" entry: missed calls are inside it, so the waiting count shows here.
    ...(sec.id === "calls" ? { badge: missedSummary?.needs_attention ?? 0 } : {}),
  }));
  const callCenterItems: NavItem[] = canUseCallCenter(user)
    ? [
        // Agents (and anyone with an agent profile) take calls here; owners, admins and supervisors use the Dashboard.
        ...(cc.isAgent || !isCallCenterSupervisor(user) ? [{ name: t("cc.nav.workspace"), href: "/call-center", icon: Phone }] : []),
      ]
    : [];
  const callingItems: NavItem[] = [...callCenterItems, ...sectionItems];

  const isChildActive = (child: NavItem) =>
    child.matchPaths ? child.matchPaths.some((p) => pathMatches(location.pathname, p)) : location.pathname === child.href;

  const showAll = !agentOnly && !inboxOnly;
  const navSections: NavSection[] = [
    { id: "overview", label: t("nav.group.overview"), items: showAll ? [{ name: t("nav.dashboard"), href: "/dashboard", icon: Home }] : [] },
    {
      id: "communication",
      label: t("nav.group.communication"),
      items: [
        // Team Inbox exists only for organizations SENDA has switched it on for.
        ...(services.inbox ? [{ name: "Team Inbox", href: "/conversations", icon: MessageSquareText }] : []),
        ...(services.sms
          ? [
              { name: t("nav.send_sms"), href: "/messaging/send", icon: Send },
              { name: "WhatsApp", href: "/whatsapp", icon: WhatsAppIcon, comingSoon: isComingSoon("whatsapp") },
              { name: "WhatsApp Campaigns", href: "/whatsapp/campaigns", icon: Megaphone, comingSoon: isComingSoon("whatsapp") },
              { name: t("nav.campaigns"), href: "/messaging/campaigns", icon: BarChart3 },
              { name: t("nav.templates"), href: "/templates", icon: FileText },
              {
                name: t("nav.messages_history"),
                id: "history",
                href: "#",
                icon: History,
                children: [
                  { name: "Scheduled", href: "/messaging/scheduled", icon: CalendarClock, badge: scheduledCount },
                  { name: "Outbox", href: "/messaging/outbox", icon: Inbox, badge: outboxCount },
                  { name: "Sent", href: "/messaging/sent", icon: CheckCircle2, badge: sentCount },
                ],
              },
            ]
          : []),
      ],
    },
    { id: "calling", label: t("nav.group.calling"), items: callingItems },
    // Contacts are shared by SMS and the call center alike.
    { id: "customers", label: t("nav.group.customers"), items: showAll ? [{ name: t("nav.contacts"), href: services.sms ? "/messaging/contacts" : "/contacts", icon: Users }] : [] },
    {
      id: "automation",
      label: t("nav.group.automation"),
      items: [
        // A call-center-only account never sees the AI / voice copilot entries; they are not part of what it signed up for.
        ...(agentOnly || callCenterOnly || inboxOnly ? [] : [{ name: t("nav.ai_copilots"), href: "/ai-copilots", icon: Bot, comingSoon: isComingSoon("ai_copilots") }]),
        ...(hasIvrAccess(user) && !callCenterOnly && !inboxOnly ? [{ name: t("nav.voice_copilots"), href: "/voice-copilots", icon: Mic }] : []),
      ],
    },
    {
      id: "analytics",
      label: t("nav.group.analytics"),
      items: [
        ...(services.sms && showAll ? [{ name: t("nav.analytics"), href: "/analytics", icon: BarChart3 }] : []),
        ...(isPartina()
          ? [
              { name: t("nav.partner_insights"), href: "/partner-insights", icon: BarChart3 },
              { name: t("nav.partner_reference"), href: "/partner-integration", icon: Server },
            ]
          : []),
      ],
    },
    {
      id: "account",
      label: t("nav.group.account"),
      items: [
        ...(services.sms && showAll
          ? [
              { name: t("nav.sender_names"), href: "/messaging/sender-names", icon: Tag },
              { name: t("nav.purchase_sms"), href: "/messaging/purchase", icon: CreditCard },
              { name: t("nav.purchase_history"), href: "/messaging/history", icon: History },
            ]
          : []),
        ...(showAll ? [{ name: t("nav.integration_guide"), href: "/integration-guide", icon: BookOpen }] : []),
        { name: t("nav.settings"), href: "/settings", icon: Settings },
      ],
    },
  ]
    // Features marked "coming soon" are shown only to SENDA staff (to see what is being built); customers never see them.
    .map((sec) => ({ ...sec, items: sec.items.filter((it) => !(it as NavItem).comingSoon || !!(user?.is_staff || user?.is_superuser)) }))
    .filter((sec) => sec.items.length > 0);

  // The quick filter: every leaf entry whose name matches.
  const needle = query.trim().toLowerCase();
  const flat: NavItem[] = navSections.flatMap((sec) => sec.items.flatMap((it) => (it.children?.length ? it.children : [it])));
  const results = needle ? flat.filter((it) => it.name.toLowerCase().includes(needle)) : [];

  const comingSoonBadge = (
    <span className="ml-auto text-[9px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-1.5 py-0.5 leading-none flex-shrink-0">
      {t("pg.AppSidebar.0964")}
    </span>
  );

  const countBadge = (n?: number) =>
    typeof n === "number" && n > 0 ? (
      <span className="ml-auto text-[10px] font-semibold text-red-500 leading-none tabular-nums">{n > 10 ? "10+" : n}</span>
    ) : null;

  const leaf = (item: NavItem, nested = false) => {
    const Icon = item.icon;
    const active = isChildActive(item);
    const button = (
      <button
        key={item.name}
        onClick={() => handleNavigation(item.href)}
        aria-current={active ? "page" : undefined}
        className={[
          "w-full flex items-center rounded-md text-left tracking-tight transition-colors duration-100",
          collapsed ? "justify-center h-9" : nested ? "gap-2.5 px-2.5 h-8 text-[12.5px]" : "gap-3 px-3 h-9 text-[13px]",
          active ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:text-foreground hover:bg-accent/60 font-medium",
        ].join(" ")}
      >
        <Icon className={nested ? "w-3.5 h-3.5 flex-shrink-0" : "w-4 h-4 flex-shrink-0"} strokeWidth={1.8} />
        {!collapsed && <span className="truncate">{item.name}</span>}
        {!collapsed && item.comingSoon && comingSoonBadge}
        {!collapsed && countBadge(item.badge)}
        {collapsed && typeof item.badge === "number" && item.badge > 0 && <span className="absolute ml-4 -mt-4 h-1.5 w-1.5 rounded-full bg-red-500" />}
      </button>
    );
    if (!collapsed) return button;
    return (
      <Tooltip key={item.name}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs font-medium">{item.name}</TooltipContent>
      </Tooltip>
    );
  };

  const group = (item: NavItem) => {
    const Icon = item.icon;
    const key = item.id ?? item.name;
    const anyActive = item.children!.some(isChildActive);
    // Closed until clicked, except the group that holds the page you are on.
    const open = openGroups[key] ?? anyActive;
    if (collapsed) {
      // In the rail a group is one icon: opening it widens the menu first.
      return (
        <Tooltip key={key}>
          <TooltipTrigger asChild>
            <button onClick={() => { toggleCollapsed(); setOpenGroups((p) => ({ ...p, [key]: true })); }} className={["w-full flex items-center justify-center h-9 rounded-md", anyActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-accent/60"].join(" ")}>
              <Icon className="w-4 h-4" strokeWidth={1.8} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">{item.name}</TooltipContent>
        </Tooltip>
      );
    }
    return (
      <Collapsible key={key} open={open} onOpenChange={(v) => setOpenGroups((prev) => ({ ...prev, [key]: v }))}>
        <CollapsibleTrigger asChild>
          <button className={["w-full flex items-center gap-3 px-3 h-9 rounded-md text-left text-[13px] font-medium tracking-tight transition-colors", anyActive ? "text-foreground font-semibold" : "text-foreground/70 hover:text-foreground hover:bg-accent/60"].join(" ")}>
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
            <span className="flex-1 truncate">{item.name}</span>
            {item.children!.some((c) => (c.badge ?? 0) > 0) && !open && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
            <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} strokeWidth={2} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-5 mt-0.5 mb-1 pl-2 space-y-0.5">{item.children!.map((child) => leaf(child, true))}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

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
          "flex flex-col h-screen bg-card border-r border-border select-none",
          isMobile ? "w-[80vw] max-w-[280px]" : collapsed ? "w-[60px]" : "w-[208px]",
          "transition-[width] duration-150",
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
        <div className={["flex items-center pt-5 pb-4", collapsed ? "justify-center px-2" : "justify-between px-4"].join(" ")}>
          {collapsed ? (
            <BrandLogo className="h-10 w-auto" />
          ) : (
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandLogo className="h-14 w-auto -my-3 -mr-7" />
              <span className="min-w-0 line-clamp-2 break-words text-[16px] font-bold text-foreground tracking-tight leading-tight">
                {brand.branded && brand.display_name ? brand.display_name : t("app.name")}
              </span>
            </div>
          )}

          {isMobile && onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── Which organization this is, and a switch when there are several ── */}
        {!collapsed && <div className="px-3 pb-3"><OrganizationSwitcher /></div>}

        {/* ── Global CTA: place a call ─────── */}
        <div className={["pb-3 space-y-2", collapsed ? "px-2" : "px-3"].join(" ")}>
          {/* The dialer lives at the app root (DialerProvider), so this opens it over whatever page is showing. */}
          {hasIvrAccess(user) && (
            <button
              onClick={() => openDialer()}
              aria-label={t("pg.AppSidebar.0963")}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-md border border-border bg-background text-foreground text-[13px] font-semibold tracking-tight hover:bg-accent/60 transition-colors"
            >
              <PhoneOutgoing className="w-3.5 h-3.5" strokeWidth={2.2} />
              {!collapsed && t("pg.AppSidebar.0963")}
            </button>
          )}
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div className="mx-3 h-px bg-border/50 mb-2" />

        {/* ── Search ───────────────────────────────────── */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("nav.search")}
                aria-label={t("nav.search")}
                className="h-7 w-full rounded-md border border-border bg-background pl-7 pr-2 text-[12px] outline-none placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>
          </div>
        )}

        {/* ── Navigation ───────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-2 py-1 scrollbar-none" aria-label={t("app.name")}>
          {needle ? (
            <div className="space-y-0.5">
              {results.length === 0 ? <p className="px-3 py-2 text-xs text-muted-foreground">{t("ai.tk.empty")}</p> : results.map((item) => leaf(item))}
            </div>
          ) : (
            navSections.map((sec, i) => {
              const body = <div className="space-y-0.5">{sec.items.map((item) => (item.children?.length ? group(item) : leaf(item)))}</div>;
              // The rail shows every entry; the full menu gives each category a dropdown that starts closed (except the one holding the current page); a click opens it.
              if (collapsed || sec.id === "overview") {
                return <div key={sec.id} className={i === 0 ? "" : collapsed ? "mt-2 border-t border-border/60 pt-2" : "mt-3"}>{body}</div>;
              }
              const key = `section:${sec.id}`;
              const hasActive = sec.items.some((it) => (it.children?.length ? it.children.some(isChildActive) : isChildActive(it)));
              const open = openGroups[key] ?? (hasActive || sec.id === "communication");
              return (
                <Collapsible key={sec.id} open={open} onOpenChange={(v) => setOpenGroups((prev) => ({ ...prev, [key]: v }))} className="mt-3">
                  <CollapsibleTrigger asChild>
                    <button className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-1 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground">
                      {sec.label}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} strokeWidth={2} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>{body}</CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </nav>

        {/* Collapse to an icon rail (desktop only). */}
        {!isMobile && (
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
            className={["mx-2 mb-1 flex h-8 items-center gap-2 rounded-md text-[12px] text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors", collapsed ? "justify-center" : "px-3"].join(" ")}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" />{t("nav.collapse")}</>}
          </button>
        )}

        {/* ── Divider ──────────────────────────────────── */}
        <div className="mx-3 h-px bg-border/50 mt-2" />

        {/* ── User row ─────────────────────────────────── */}
        <div className="px-2 py-3">
          <div className={["flex items-center rounded-md hover:bg-accent/50 transition-colors duration-100 group", collapsed ? "justify-center py-1.5" : "gap-3 px-2.5 py-2.5"].join(" ")}>
            <Avatar className={["flex-shrink-0 ring-1 ring-border", collapsed ? "h-8 w-8" : "h-10 w-10"].join(" ")}>
              <AvatarImage src={avatar} alt={userName} className="object-cover" />
              <AvatarFallback className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary text-[13px] font-bold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>

            {!collapsed && <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground dark:text-foreground truncate leading-tight">
                {userName}
              </p>
              <p className="text-[11px] text-foreground/60 dark:text-foreground/50 truncate leading-tight mt-0.5">
                {userEmail}
              </p>
            </div>}

            {!collapsed && <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={logout}
                  className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-md text-foreground/40 dark:text-foreground/30 opacity-0 group-hover:opacity-100 hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-all duration-100"
                >
                  <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs font-medium">
                {t("pg.AppSidebar.0965")}
              </TooltipContent>
            </Tooltip>}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
