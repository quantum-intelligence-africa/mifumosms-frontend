// The row of tabs across the top of a Call Center & IVR page (see callCenterSections.ts).
import { Link, useLocation } from "react-router-dom";
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

  const section = sectionForPath(getCallCenterSections(user), pathname);
  if (!section || section.tabs.length < 2) return null; // a single page needs no tabs
  // Exactly one tab is current: the most specific match (so /voice/calls/answered lights "Answered calls", not also "All calls").
  const currentHref = section.tabs.filter((tab) => pathMatches(pathname, tab.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label={t(ccKey(section.labelKey))} className="shrink-0 border-b border-border-subtle bg-background px-2 sm:px-3 lg:px-6">
      <div className="flex gap-1 overflow-x-auto py-1.5 [scrollbar-width:none]">
        {section.tabs.map((tab) => {
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
    </nav>
  );
}
