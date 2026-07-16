import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send as SendIcon, CheckCircle2, Inbox, Tag, CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

interface SubNavItem {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Route substring that marks this item active (avoids /send vs /sent clashes). */
  match: string;
  badge?: number;
}

/**
 * Mobile-only sub-navigation for the SMS messaging area (Send / Sent / Outbox /
 * Sender). Desktop already exposes these via the sidebar, which is hidden on
 * mobile — so without this bar, Outbox and Sent are unreachable on a phone.
 * Rendered near the top of each messaging page so the functions are visible at
 * a glance rather than buried behind the 3-dot menu.
 */
export function MessagesSubNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [outboxCount, setOutboxCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);

  // Live counts for the Outbox (failed), Sent and Scheduled badges — same source
  // the desktop sidebar uses. Refetched whenever the route changes so a
  // send/retry/cancel is reflected when the user hops between tabs.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [failed, sent, scheduled] = await Promise.all([
          apiClient.getSMSMessages({ status: "failed", page: 1 }),
          apiClient.getSMSMessages({ status__in: "sent,delivered", page: 1 }),
          apiClient.getSMSMessages({ status: "scheduled", page: 1 }),
        ]);
        if (cancelled) return;
        if (failed.success && failed.data) setOutboxCount(failed.data.count || 0);
        if (sent.success && sent.data) setSentCount(sent.data.count || 0);
        if (scheduled.success && scheduled.data) setScheduledCount(scheduled.data.count || 0);
      } catch {
        /* non-fatal: badges just stay hidden */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const sw = language === "sw";
  const items: SubNavItem[] = [
    { key: "send", label: sw ? "Tuma" : "Send", href: "/messaging/send", icon: SendIcon, match: "/send" },
    { key: "scheduled", label: sw ? "Zilizopangwa" : "Scheduled", href: "/messaging/scheduled", icon: CalendarClock, match: "/scheduled", badge: scheduledCount },
    { key: "sent", label: sw ? "Zilizotumwa" : "Sent", href: "/messaging/sent", icon: CheckCircle2, match: "/sent", badge: sentCount },
    { key: "outbox", label: "Outbox", href: "/messaging/outbox", icon: Inbox, match: "/outbox", badge: outboxCount },
    { key: "sender", label: sw ? "Mtumaji" : "Sender", href: "/messaging/sender-names", icon: Tag, match: "/sender-names" },
  ];

  const isActive = (item: SubNavItem) => location.pathname.includes(item.match);

  return (
    <nav
      aria-label="Messaging sections"
      className="md:hidden mb-4 overflow-x-auto no-scrollbar"
    >
      <div className="flex items-center gap-2 min-w-max py-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                if (location.pathname === item.href) return;
                window.scrollTo(0, 0);
                navigate(item.href);
              }}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex items-center gap-1.5 h-9 pl-3 pr-3 rounded-full whitespace-nowrap",
                "text-[13px] font-semibold tracking-tight transition-colors duration-150 border",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_8px_rgba(10,92,219,0.30)]"
                  : "bg-background/60 dark:bg-background/40 text-foreground/70 dark:text-foreground/65 border-border/60 dark:border-border/40 active:bg-accent/60",
              ].join(" ")}
            >
              <Icon className="w-[15px] h-[15px]" strokeWidth={active ? 2.5 : 2} />
              {item.label}
              {typeof item.badge === "number" && item.badge > 0 && (
                <span
                  className={[
                    "ml-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full",
                    "text-[10px] font-bold leading-none",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary",
                  ].join(" ")}
                >
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
