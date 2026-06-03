import { Home, Send as SendIcon, Tag, Users, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePageMeta, TabKey } from "@/hooks/usePageMeta";

interface Tab {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  href: string;
  /** Center compose tab — icon stays primary-coloured regardless of route. */
  accent?: boolean;
}

const TABS: Tab[] = [
  { key: "home", label: "Home", icon: Home, href: "/dashboard" },
  { key: "sender", label: "Sender", icon: Tag, href: "/messaging/sender-names" },
  { key: "send", label: "Send", icon: SendIcon, href: "/send", accent: true },
  { key: "contacts", label: "Contacts", icon: Users, href: "/messaging/contacts" },
  { key: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export function MobileTabBar() {
  const navigate = useNavigate();
  const { tab, showTabBar, isPublicRoute } = usePageMeta();

  if (isPublicRoute || !showTabBar) return null;

  return (
    <nav
      aria-label="Primary"
      className={[
        "md:hidden fixed left-0 right-0 bottom-0 z-[80]",
        "bg-card dark:bg-background",
        "border-t border-border dark:border-border/60",
      ].join(" ")}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 h-[64px]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          // Send icon is always primary blue; other tabs colour-cycle on active.
          const iconClass = t.accent
            ? "text-primary"
            : active
              ? "text-primary"
              : "text-foreground/60 dark:text-foreground/55";
          const labelClass = active
            ? "text-primary font-semibold"
            : "text-foreground/60 dark:text-foreground/55 font-medium";
          return (
            <li key={t.key} className="flex">
              <button
                type="button"
                onClick={() => navigate(t.href)}
                aria-current={active ? "page" : undefined}
                aria-label={t.label}
                className="flex-1 h-full flex flex-col items-center justify-center gap-1 relative transition-colors duration-150"
              >
                {/* Active indicator pill at the top edge */}
                <span
                  className={[
                    "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full",
                    "transition-opacity duration-200",
                    active ? "bg-primary opacity-100" : "bg-transparent opacity-0",
                  ].join(" ")}
                />
                <Icon
                  className={`w-[22px] h-[22px] ${iconClass}`}
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <span className={`text-[10px] leading-none tracking-tight ${labelClass}`}>
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
