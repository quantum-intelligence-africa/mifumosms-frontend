import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  ChevronRight,
  CreditCard,
  History,
  Languages,
  LogOut,
  Mic,
  Moon,
  Server,
  Sun,
  User as UserIcon,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, SVGAttributes } from "react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { usePreferences } from "@/hooks/usePreferences";
import { useRoles } from "@/hooks/useRoles";

interface MobileOverflowMenuProps {
  open: boolean;
  onClose: () => void;
}

type MenuIcon = LucideIcon | ComponentType<SVGAttributes<SVGSVGElement> & { strokeWidth?: number | string }>;

interface MenuItem {
  key: string;
  label: string;
  icon: MenuIcon;
  onClick: () => void;
  destructive?: boolean;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function MobileOverflowMenu({ open, onClose }: MobileOverflowMenuProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { updateTheme } = usePreferences();
  const { isPartina } = useRoles();

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (href: string) => {
    onClose();
    setTimeout(() => navigate(href), 50);
  };

  const handleThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    updateTheme(next).catch(() => undefined);
  };

  const handleLanguageToggle = () => {
    setLanguage(language === "sw" ? "en" : "sw");
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate("/login");
  };

  const messagingSection: MenuSection = {
    title: "Messaging",
    items: [
      { key: "campaigns", label: "Campaigns", icon: BarChart3, onClick: () => go("/messaging/campaigns") },
      { key: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, onClick: () => go("/whatsapp") },
    ],
  };

  const automationSection: MenuSection = {
    title: "Automation",
    items: [
      { key: "ai", label: "AI Copilots", icon: Bot, onClick: () => go("/ai-copilots") },
      { key: "voice", label: "Voice Copilots", icon: Mic, onClick: () => go("/voice-copilots") },
    ],
  };

  const billingSection: MenuSection = {
    title: "Billing",
    items: [
      { key: "buy", label: "Buy SMS Credits", icon: CreditCard, onClick: () => go("/messaging/purchase") },
      { key: "history", label: "Purchase History", icon: History, onClick: () => go("/messaging/history") },
    ],
  };

  const accountSection: MenuSection = {
    title: "Account",
    items: [
      { key: "notifications", label: "Notifications", icon: Bell, onClick: () => go("/notifications") },
      { key: "profile", label: "Profile", icon: UserIcon, onClick: () => go("/settings") },
      { key: "integration", label: "Integration guide", icon: BookOpen, onClick: () => go("/integration-guide") },
    ],
  };

  if (isPartina()) {
    accountSection.items.push(
      { key: "partner-insights", label: "Partner insights", icon: BarChart3, onClick: () => go("/partner-insights") },
      { key: "partner-integration", label: "Partner integration", icon: Server, onClick: () => go("/partner-integration") },
    );
  }

  const preferencesSection: MenuSection = {
    title: "Preferences",
    items: [
      {
        key: "theme",
        label: theme === "dark" ? "Switch to light" : "Switch to dark",
        icon: theme === "dark" ? Sun : Moon,
        onClick: handleThemeToggle,
        badge: theme === "dark" ? "Dark" : "Light",
      },
      {
        key: "language",
        label: `Language: ${language === "sw" ? "Swahili" : "English"}`,
        icon: Languages,
        onClick: handleLanguageToggle,
        badge: language === "sw" ? "SW" : "EN",
      },
    ],
  };

  const sections = [messagingSection, automationSection, billingSection, accountSection, preferencesSection];

  return (
    <div
      className={[
        "md:hidden fixed inset-0 z-[200]",
        "transition-opacity duration-200",
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
      />

      {/* Sheet */}
      <div
        className={[
          "absolute left-0 right-0 bottom-0 bg-card dark:bg-background",
          "rounded-t-3xl shadow-2xl border-t border-border dark:border-border/60",
          "max-h-[88vh] flex flex-col",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-2">
          <div className="w-10 h-1 rounded-full bg-foreground/15 dark:bg-foreground/20" />
        </div>

        {/* Header */}
        <div className="px-4 pt-1.5 pb-1.5 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-foreground dark:text-foreground leading-tight">
              Menu
            </h2>
            {user?.email && (
              <p className="text-[11px] text-foreground/55 dark:text-foreground/50 truncate leading-tight mt-0.5">
                {user.email}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/70 active:bg-accent/60"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2.2} />
          </button>
        </div>

        {/* Compact sections — sized to fit standard mobile viewports without scrolling. */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {sections.map((section) => (
            <div key={section.title} className="mt-1.5 first:mt-0.5">
              <p className="px-2.5 pb-0.5 text-[9.5px] font-bold tracking-wider uppercase text-foreground/45 dark:text-foreground/40">
                {section.title}
              </p>
              <div className="rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/50 dark:border-border/30 overflow-hidden">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={item.onClick}
                      className={[
                        "w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left",
                        "active:bg-accent/60 dark:active:bg-accent/40 transition-colors",
                        idx > 0 ? "border-t border-border/30 dark:border-border/20" : "",
                        "text-foreground dark:text-foreground",
                      ].join(" ")}
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                        <Icon className="w-[15px] h-[15px]" strokeWidth={2} />
                      </div>
                      <span className="flex-1 text-[13px] font-medium tracking-tight truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-foreground/35 dark:text-foreground/30 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sign out — inline, compact, not a hero button */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-destructive/10 text-destructive font-semibold text-[13px] active:bg-destructive/15 transition-colors"
          >
            <LogOut className="w-[15px] h-[15px]" strokeWidth={2.2} />
            {t("profile.logout") || "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
