import { Suspense, lazy, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Users,
  DollarSign,
  Hash,
  Play,
  PhoneCall,
  PhoneMissed,
  Phone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCampaigns } from "@/components/dashboard/RecentCampaigns";
// The chart pulls in the charting library (~410 kB). Load it after the metric cards are on screen.
const PerformanceOverview = lazy(() =>
  import("@/components/dashboard/PerformanceOverview").then((m) => ({ default: m.PerformanceOverview })),
);
import { SenderIds } from "@/components/dashboard/SenderIds";
// Loaded only for voice users: it pulls in the chart library, which SMS-only accounts never need.
const LiveCallCenter = lazy(() => import("@/components/dashboard/LiveCallCenter"));
const CallAnalyticsPreview = lazy(() => import("@/components/dashboard/CallAnalyticsPreview"));
import { useBranding } from "@/contexts/BrandingContext";
import { MobileHomeHero } from "@/components/layout/MobileHomeHero";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import { useVoiceDashboardStats } from "@/hooks/useVoiceDashboardStats";
import { usePlanMinutes } from "@/hooks/usePlanMinutes";
import { useAccess } from "@/hooks/useCallAnalytics";
import { hasSmsAccess, hasIvrAccess, canUseCallCenter, isCallCenterSupervisor, isCallCenterAdmin } from "@/utils/roleUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

import { appLocale } from "@/utils/appLocale";
// ─── Reusable card shell ──────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-lg border border-border overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

// ─── Thin divider with inline label ──────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 pt-2">
      <span className="text-xs sm:text-sm font-bold tracking-[0.08em] uppercase text-foreground/70 dark:text-foreground/60 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-0.5 bg-gradient-to-r from-border via-border/50 to-transparent dark:from-border/40 dark:via-border/20 dark:to-transparent" />
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────────
interface MetricProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  accentBg: string;
  accentText: string;
}

function Metric({ title, value, description, icon: Icon, accentText }: MetricProps) {
  // One neutral look for every figure: the colour is kept only on the icon (and only to tell a warning from the rest).
  return (
    <div className="rounded-lg border border-border bg-card p-3 md:p-4 flex flex-col gap-1.5 min-h-[96px]">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`w-4 h-4 flex-shrink-0 ${accentText}`} strokeWidth={2} />
        <span className="min-w-0 truncate text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <p className="text-2xl leading-none font-semibold text-foreground tabular-nums tracking-tight">{value}</p>
      <p className="text-[11.5px] text-muted-foreground leading-snug line-clamp-2">{description}</p>
    </div>
  );
}

// ─── Account overview: every headline figure in one small line (credits, sender names, numbers, then the other metrics) ───
function AccountOverview({
  credits, showCredits, approvedSenders, showSenders, activeNumbers, showNumbers, extras, onBuy, onSenders, onNumbers,
}: {
  credits?: number; showCredits: boolean; approvedSenders: number; showSenders: boolean; activeNumbers: number; showNumbers: boolean;
  extras: MetricProps[]; onBuy: () => void; onSenders: () => void; onNumbers: () => void;
}) {
  const { t } = useLanguage();
  const low = showCredits && typeof credits === "number" && credits < 100;
  if (!showCredits && !showSenders && !showNumbers && extras.length === 0) return null;
  const item = "flex items-center gap-1.5 whitespace-nowrap text-[13px]";
  const label = "text-muted-foreground";
  const value = "font-semibold tabular-nums text-foreground";
  const divider = <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />;
  const parts: Array<{ el: JSX.Element; extra?: boolean }> = [];
  if (showCredits) {
    parts.push({ el: (
      <div key="credits" className={item} title={low ? t("dashboard.overview.low") : undefined}>
        <span className={label}>{t("dashboard.metric.current_credits")}</span>
        <span className={`${value} ${low ? "!text-destructive" : ""}`}>{(credits ?? 0).toLocaleString(appLocale())}</span>
        <button onClick={onBuy} className="ml-1 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground hover:opacity-90">{t("dashboard.overview.buy")}</button>
      </div>
    ) });
  }
  if (showSenders) {
    parts.push({ el: (
      <button key="senders" onClick={onSenders} className={`${item} hover:text-primary`}>
        <span className={label}>{t("dashboard.metric.sender_id")}</span><span className={value}>{approvedSenders}</span>
      </button>
    ) });
  }
  if (showNumbers) {
    parts.push({ el: (
      <button key="numbers" onClick={onNumbers} className={`${item} hover:text-primary`}>
        <span className={label}>{t("dashboard.metric.active_numbers")}</span><span className={value}>{activeNumbers}</span>
      </button>
    ) });
  }
  extras.forEach((m) => {
    parts.push({ extra: true, el: (
      <div key={m.title} className={item} title={m.description}>
        <span className={label}>{m.title}</span><span className={value}>{m.value}</span>
      </div>
    ) });
  });
  return (
    <section aria-label={t("dashboard.overview.title")} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border bg-card px-4 py-2">
      {parts.map((p, i) => (
        <div key={i} className={`${p.extra ? "hidden md:flex" : "flex"} items-center gap-4`}>
          {i > 0 && divider}
          {p.el}
        </div>
      ))}
    </section>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="flex-shrink-0 h-full bg-card dark:bg-background border-r border-border dark:border-border/60">
        <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-2 sm:p-3 md:p-4 w-full overflow-x-hidden">
            <div className="max-w-full px-1 mx-auto space-y-4 sm:space-y-5">
              {/* Welcome skeleton */}
              <Skeleton className="h-16 sm:h-20 rounded-2xl" />

              {/* Metrics skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-1.5 md:gap-2 overflow-x-hidden">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[100px] sm:h-[120px] rounded-xl" />)}
              </div>

              {/* Middle section skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-hidden">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="lg:col-span-2 h-48 rounded-xl" />
              </div>

              {/* Activity section skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-hidden">
                <Skeleton className="h-52 rounded-xl" />
                <Skeleton className="h-52 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { metrics, recentCampaigns, performanceOverview, senderIds, isLoading, secondaryLoading } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { t } = useLanguage();

  const showSms = hasSmsAccess(user);
  // White-label orgs may hide supported dashboard widgets; stock branding shows all.
  const brand = useBranding();
  const widgetOn = (key: string) => !(brand.branded && brand.widgets?.[key] === false);
  const showIvr = hasIvrAccess(user);
  const showTutorial = showSms || !showIvr; // the video is the SMS tutorial; voice-only users never see it
  const voiceStats = useVoiceDashboardStats(showIvr);
  // The call minutes against the plan (owners/admins). Also a hook: it runs on every render, before the loading return below.
  const planMinutes = usePlanMinutes(showIvr && isCallCenterAdmin(user));
  // A hook, so it must run on every render, before the loading return below (otherwise React counts a different number of hooks
  // when loading ends and the page crashes with error #310).
  const callAnalytics = useAccess();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (!user?.id || !showTutorial) return;
    const key = `mifumo_tutorial_seen_${user.id}`;
    if (!localStorage.getItem(key)) {
      const timer = setTimeout(() => {
        setShowVideoModal(true);
        localStorage.setItem(key, "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, showTutorial]);

  if (isLoading) return <DashboardSkeleton sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />;

  const approvedSenderIds = senderIds?.filter((id) => id.status?.toLowerCase() === "approved").length ?? 0;

  // Metric cards are tailored to what the user can actually act on: SMS
  // figures for SMS access, call figures for IVR access, credits for
  // whichever (or both) they have — never a card for a feature they can't
  // reach.
  const smsMetricCards: MetricProps[] = showSms
    ? [
        {
          title: t("dashboard.metric.total_messages"),
          value: metrics?.total_messages?.value?.toLocaleString(appLocale()) || "0",
          description: metrics?.total_messages?.description || t("dashboard.metric.last_30_days"),
          icon: MessageSquare,
          accentBg: "bg-blue-50",
          accentText: "text-blue-600",
        },
        {
          title: t("dashboard.metric.active_contacts"),
          value: metrics?.active_contacts?.value?.toLocaleString(appLocale()) || "0",
          description: metrics?.active_contacts?.description || t("dashboard.metric.engaged_this_month"),
          icon: Users,
          accentBg: "bg-emerald-50",
          accentText: "text-emerald-600",
        },
      ]
    : [];

  // People who can see call analytics get the call figures there (one period, one definition). The tiles below are only for
  // voice users without it, so the same number is never shown twice with two different answers.
  const analyticsShown = showIvr && !!callAnalytics.data?.voice && !!callAnalytics.data?.reporting;
  const voiceMetricCards: MetricProps[] = showIvr && !analyticsShown
    ? [
        {
          title: t("dashboard.metric.total_calls"),
          value: voiceStats.totalCalls.toLocaleString(appLocale()),
          description: t("dashboard.metric.calls_last_30_days"),
          icon: PhoneCall,
          accentBg: "bg-sky-50",
          accentText: "text-sky-600",
        },
        {
          // Customers, not calls: someone who rang five times and was never answered is one missed customer.
          title: voiceStats.missedCustomers !== null ? t("dashboard.metric.missed_customers") : t("dashboard.metric.missed_calls"),
          value: (voiceStats.missedCustomers ?? voiceStats.missedCalls).toLocaleString(appLocale()),
          description: voiceStats.missedCustomers !== null ? t("dashboard.metric.missed_customers_30_days") : t("dashboard.metric.missed_last_30_days"),
          icon: PhoneMissed,
          accentBg: "bg-rose-50",
          accentText: "text-rose-600",
        },
      ]
    : [];

  // Voice customers see their plan usage (minutes used of the plan's allowance), as on Plan & usage. SMS credits are an SMS thing: they
  // appear only for people who have SMS, never as a "0 credits" card on a call-center account.
  const minuteCard = (meter: NonNullable<typeof planMinutes.inbound>, titleKey: string): MetricProps => {
    const plan = planMinutes.planName || "";
    const used = Math.round(meter.used);
    const hasLimit = meter.limit !== null;
    return {
      title: t(titleKey as never),
      value: hasLimit ? `${used.toLocaleString(appLocale())} / ${(meter.limit as number).toLocaleString(appLocale())}` : used.toLocaleString(appLocale()),
      description: !hasLimit
        ? t("dashboard.metric.minutes_no_limit" as never, { plan })
        : meter.exceeded
          ? t("dashboard.metric.minutes_over" as never, { plan, over: Math.max(0, used - (meter.limit as number)).toLocaleString(appLocale()) })
          : t("dashboard.metric.minutes_left" as never, { plan, left: Math.max(0, (meter.limit as number) - used).toLocaleString(appLocale()) }),
      icon: Phone,
      accentBg: meter.exceeded ? "bg-rose-50" : "bg-sky-50",
      accentText: meter.exceeded ? "text-rose-600" : "text-sky-600",
    };
  };
  const planCards: MetricProps[] = [
    ...(planMinutes.inbound ? [minuteCard(planMinutes.inbound, "dashboard.metric.minutes_in")] : []),
    ...(planMinutes.outbound && (planMinutes.outbound.limit !== null || planMinutes.outbound.used > 0) ? [minuteCard(planMinutes.outbound, "dashboard.metric.minutes_out")] : []),
  ];

  const creditsCard: MetricProps = {
    title: t("dashboard.metric.current_credits"),
    value: metrics?.current_credits?.value?.toLocaleString(appLocale()) || "0",
    description: metrics?.current_credits?.description || t("dashboard.metric.available_credits"),
    icon: DollarSign,
    accentBg: "bg-amber-50",
    accentText: "text-amber-600",
  };

  const activeNumbersCard: MetricProps = {
    title: t("dashboard.metric.active_numbers"),
    value: voiceStats.activeNumbers.toLocaleString(appLocale()),
    description: t("dashboard.metric.connected_phone_numbers"),
    icon: Phone,
    accentBg: "bg-indigo-50",
    accentText: "text-indigo-600",
  };

  const allMetricCards: MetricProps[] = [
    ...smsMetricCards,
    ...voiceMetricCards,
    ...planCards,
    ...(showIvr ? [activeNumbersCard] : []),
  ];

  // With call analytics, the minute cards and Active numbers belong to that section (same numbers, shown once); the grid at the
  // top keeps everything else. Without it (no analytics access) nothing moves.
  // While the access check is still running the voice layout is assumed, so the page does not jump when it answers.
  const callLayout = analyticsShown || (showIvr && callAnalytics.isLoading);
  const callSectionCards: MetricProps[] = callLayout ? [...planCards, activeNumbersCard] : [];
  const showCreditsStrip = showSms || !showIvr;
  const numbersInStrip = showIvr && !callLayout;
  const metricCards: MetricProps[] = allMetricCards.filter((c) => !callSectionCards.includes(c) && !(numbersInStrip && c === activeNumbersCard));

  // Live call center: for the people who run the call center. It sits under the activity chart when call analytics is shown,
  // and where it always was (above the Quick Actions row) otherwise.
  const liveNode = showIvr && canUseCallCenter(user) && isCallCenterSupervisor(user) ? (
    <Suspense fallback={<Skeleton className="h-16 rounded-xl" />}>
      <LiveCallCenter />
    </Suspense>
  ) : null;
  const quickActionsNode = widgetOn("quick_actions") ? <QuickActions /> : null;

  try {
    return (
      <div className="flex h-screen bg-background overflow-hidden">

        {/* Sidebar */}
        <div className="flex-shrink-0 h-full bg-card dark:bg-background border-r border-border dark:border-border/60 shadow-[1px_0_2px_rgba(0,0,0,0.05)] dark:shadow-[1px_0_2px_rgba(0,0,0,0.3)]">
          <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Mobile-only colored hero */}
            <MobileHomeHero metricCards={allMetricCards.slice(0, 2)} />

            <div className="p-2 sm:p-3 md:p-5 w-full overflow-x-hidden">
              <div className="mx-auto w-full max-w-[1400px] px-1 space-y-3 sm:space-y-4">

                {(
                  <>
                    {/* Welcome Section — hidden on mobile (already shown in the top bar) */}
                    <div className="hidden md:block pb-1">
                      <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("pg.Dashboard.0998")} {user?.first_name || user?.full_name || t("pg.Dashboard.0999")}</h1>
                      <p className="text-sm text-muted-foreground">{t("dashboard.welcome_sub")}</p>
                    </div>

                    {/* Account overview: credits (with a warning only when they run low), sender names, numbers. */}
                    {widgetOn("metrics") && (
                      <AccountOverview
                        credits={metrics?.current_credits?.value}
                        showCredits={showCreditsStrip}
                        approvedSenders={approvedSenderIds || Number(metrics?.senderId?.value || 0)}
                        showSenders={showSms}
                        activeNumbers={voiceStats.activeNumbers}
                        showNumbers={numbersInStrip}
                        extras={metricCards}
                        onBuy={() => navigate("/messaging/purchase")}
                        onSenders={() => navigate("/messaging/sender-names")}
                        onNumbers={() => navigate("/voice/numbers")}
                      />
                    )}

                    {/* 1-3. Call analytics first: its KPIs, the minute cards and Active numbers, then Call Activity Over Time with
                        Quick Actions beside it (stacked on tablets and phones), then the Live Call Center. The component asks the
                        server whether this person may see it and renders nothing otherwise; SMS-only users never mount it. */}
                    {showIvr && widgetOn("call_analytics") && (
                      <Suspense fallback={<Skeleton className="h-72 rounded-xl" />}>
                        <CallAnalyticsPreview
                          minuteCards={callSectionCards.length > 0 && widgetOn("metrics") ? (
                            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
                              {callSectionCards.map((card) => <Metric key={card.title} {...card} />)}
                            </div>
                          ) : null}
                          aside={quickActionsNode}
                          live={liveNode}
                        />
                      </Suspense>
                    )}

                    {/* Mobile: remaining metric cards below the hero. */}
                    {widgetOn("metrics") && (
                    <div className="md:hidden grid grid-cols-2 gap-2 overflow-x-hidden">
                      {metricCards.slice(callLayout ? 0 : 2).map((card) => <Metric key={card.title} {...card} />)}
                    </div>
                    )}

                    {/* No call analytics for this person: the call center board and Quick Actions stay where they were. */}
                    {!callLayout && liveNode}

                    {/* Quick Actions (when not beside the activity chart) + Performance. Performance (message volume / delivery rate)
                        is an SMS concept, so an IVR-only account gets Quick Actions at full width instead. */}
                    {(!callLayout || (showSms && widgetOn("performance"))) && (
                    <div className={`grid grid-cols-1 ${showSms && !callLayout ? "lg:grid-cols-3" : ""} gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-hidden`}>
                      {!callLayout && quickActionsNode && (
                      <div className={`${showSms ? "lg:col-span-1" : ""} h-full min-w-0`}>
                        {quickActionsNode}
                      </div>
                      )}
                      {showSms && widgetOn("performance") && (
                        <div className={`${callLayout ? "" : "lg:col-span-2 "}h-full min-w-0`}>
                          <Card>
                            <Suspense fallback={<Skeleton className="m-4 h-64 rounded-xl" />}>
                              <PerformanceOverview performance={performanceOverview} />
                            </Suspense>
                          </Card>
                        </div>
                      )}
                    </div>
                    )}

                    {/* Bottom Section: Activity + Campaigns — both SMS/WhatsApp
                        messaging concepts (message activity feed, campaigns). */}
                    {showSms && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 sm:gap-2 md:gap-2.5 overflow-x-hidden">
                        {widgetOn("activity_feed") && <ActivityFeed />}
                        {widgetOn("recent_campaigns") && (
                        <Card>
                          {secondaryLoading ? <Skeleton className="m-4 h-40 rounded-xl" /> : <RecentCampaigns campaigns={recentCampaigns || []} />}
                        </Card>
                        )}
                      </div>
                    )}

                    {/* Sender IDs Section — SMS-only concept */}
                    {showSms && (
                      <details className="group rounded-lg border border-border bg-card">
                        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-foreground">
                          {t("dashboard.metric.sender_id")}
                          <span className="text-xs font-normal text-muted-foreground group-open:hidden">{t("dashboard.overview.show")}</span>
                        </summary>
                        <div className="border-t border-border">
                          {secondaryLoading ? <Skeleton className="m-4 h-24 rounded-xl" /> : <SenderIds senderIds={senderIds} />}
                        </div>
                      </details>
                    )}
                  </>
                )}

              </div>
            </div>
          </main>
        </div>

        {/* Video Tutorial Modal */}
        <Dialog open={showTutorial && showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent className="w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[95vh] p-0 rounded-2xl border-0 shadow-2xl overflow-hidden bg-card dark:bg-background">
            <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-border dark:border-border/60 flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold text-foreground dark:text-foreground">
                  <div className="p-2.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                    <Play className="w-5 h-5 text-primary" strokeWidth={2.5} />
                  </div>
                  {t("tutorial.title") || t("pg.Dashboard.1000")}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm text-text-subtle dark:text-foreground/60">
                  {t("tutorial.description") || t("pg.Dashboard.1001")}
                </DialogDescription>
              </div>
            </div>
            <div className="bg-black/90 dark:bg-black aspect-video w-full">
              <video key={showVideoModal ? "open" : "closed"} controls autoPlay className="w-full h-full object-contain">
                <source src="/tutorial/mfumosms video tutorial.mp4" type="video/mp4" />
              </video>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  } catch (error) {
    console.error("Dashboard render error:", error);
    return (
      <div className="flex h-screen bg-background dark:bg-background overflow-hidden">
        <div className="flex-shrink-0 h-full bg-card dark:bg-background/50 border-r border-border dark:border-border/60">
          <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden">
            <div className="text-center max-w-sm w-full">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-destructive text-sm font-bold">!</span>
              </div>
              <h2 className="text-[14px] font-semibold text-foreground dark:text-foreground mb-1">{t("dashboard.error.title")}</h2>
              <p className="text-[12.5px] text-text-subtle dark:text-foreground/60 mb-3">{t("dashboard.error.description")}</p>
              <pre className="text-[11px] text-left bg-muted/50 dark:bg-muted/20 border border-border dark:border-border/60 rounded-lg p-3 text-foreground dark:text-foreground/70 overflow-auto">
                {error instanceof Error ? error.message : "Unknown error"}
              </pre>
            </div>
          </main>
        </div>
      </div>
    );
  }
};

export default Dashboard;
