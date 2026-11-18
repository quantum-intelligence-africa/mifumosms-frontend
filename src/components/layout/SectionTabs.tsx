// The row of tabs across the top of a Call Center & IVR page (see callCenterSections.ts).
import { PhoneOutgoing } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useDialer } from "@/contexts/DialerContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { ccKey } from "@/i18n/callCenter";
import { cn } from "@/lib/utils";
import { useMissedSummary } from "@/hooks/useMissedSummary";
import { getCallCenterSections, pathMatches, sectionForPath } from "@/components/layout/callCenterSections";

export function SectionTabs() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const missed = useMissedSummary();
  const { openDialer } = useDialer();

  const section = sectionForPath(getCallCenterSections(user), pathname);
  if (!section) return null;
  // Exactly one tab is current: the most specific match (so /voice/calls/answered lights "Answered calls", not also "All calls").
  const currentHref = section.tabs.filter((tab) => pathMatches(pathname, tab.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label={t(ccKey(section.labelKey))} className="flex shrink-0 items-center gap-2 border-b border-border-subtle bg-background px-2 sm:px-3 lg:px-6">
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto py-1.5 pr-2 [scrollbar-width:none]">
        {section.tabs.length > 1 && section.tabs.map((tab) => {
          const active = tab.href === currentHref;
          return (
            <Link
              key={tab.href}
              to={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] transition-colors",
                active
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-foreground/60 hover:bg-accent/50 hover:text-foreground",
              )}
            >
              {t(ccKey(tab.labelKey))}
              {tab.badge === "missed" && !!missed?.needs_attention && (
                <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:bg-red-950 dark:text-red-300">
                  {missed.needs_attention > 99 ? "99+" : missed.needs_attention}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      {/* One tap from any call page: the dialer lives at the app root, so this opens it over whatever is showing. */}
      <button
        type="button"
        onClick={() => openDialer()}
        className="my-1.5 flex shrink-0 items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-green-700"
      >
        <PhoneOutgoing className="h-3.5 w-3.5" strokeWidth={2.2} />
        {t("pg.AppSidebar.0963")}
      </button>
    </nav>
  );
}
