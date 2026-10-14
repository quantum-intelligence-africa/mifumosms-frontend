// Call analytics on the home dashboard: what a voice customer sees right after logging in. It reuses the same charts and the
// same endpoints as the full analytics page, so the two can never disagree. It renders nothing unless the server says this
// person may see voice analytics (the endpoints refuse everyone else), and SMS-only users never even load it.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useAccess, useSummary } from "@/hooks/useCallAnalytics";
import type { AnalyticsFilters, RangePreset } from "@/services/callAnalyticsApi";
import { ActivityChart, OutcomeDonut } from "@/components/callcenter/analytics/Overview";
import { InsightsPanel } from "@/components/callcenter/analytics/IntelligenceAndInsights";
import { Change, fmtNum, fmtPct, fmtSeconds } from "@/components/callcenter/analytics/shared";

const RANGES: RangePreset[] = ["today", "last_7", "last_30"];

function MiniKpis({ filters }: { filters: AnalyticsFilters }) {
  const { t } = useLanguage();
  const q = useSummary(filters);
  if (q.isLoading) return <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  if (!q.data) return null;
  const k = q.data.kpis;
  const cards = [
    { label: t("an.k_answered"), value: fmtNum(k.answered.value), change: k.answered.change, tone: "text-green-600", good: true, points: false },
    { label: t("an.k_missed"), value: fmtNum(k.missed.value), change: k.missed.change, tone: "text-red-600", good: false, points: false },
    { label: t("an.k_answer_rate"), value: fmtPct(k.answer_rate.value, 1), change: k.answer_rate.change, tone: "", good: true, points: true },
    { label: t("an.k_wait"), value: fmtSeconds(k.avg_wait_seconds.value), change: k.avg_wait_seconds.change, tone: "", good: false, points: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="space-y-1 p-3.5">
            <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold leading-none ${c.tone}`}>{c.value}</p>
            <Change value={c.change} points={c.points} goodWhenUp={c.good} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CallAnalyticsPreview() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const access = useAccess();
  const [range, setRange] = useState<RangePreset>("last_7");
  const filters = useMemo<AnalyticsFilters>(() => ({ range }), [range]);

  // Open the matching calls on the full page, with the same period.
  const drillDown = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams({ tab: "calls", range });
    Object.entries(changes).forEach(([k, v]) => v && params.set(k, v));
    navigate(`/call-center/analytics?${params.toString()}`);
  };

  if (access.isLoading) return <Skeleton className="h-72 rounded-xl" />;
  if (!access.data?.voice || !access.data.reporting) return null;

  return (
    <section className="space-y-2.5" aria-label={t("an.home_title")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{t("an.home_title")}</h2>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangePreset)}>
            <SelectTrigger className="h-8 w-[150px] text-xs" aria-label={t("an.date_range")}><SelectValue /></SelectTrigger>
            <SelectContent>{RANGES.map((r) => <SelectItem key={r} value={r}>{t(`an.range.${r}` as "an.range.today")}</SelectItem>)}</SelectContent>
          </Select>
          <Link to={`/call-center/analytics?range=${range}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            {t("an.home_view_all")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
      <MiniKpis filters={filters} />
      <ActivityChart filters={filters} drillDown={drillDown} />
      <div className="grid gap-2.5 lg:grid-cols-2">
        <OutcomeDonut filters={filters} drillDown={drillDown} />
        <InsightsPanel filters={filters} drillDown={drillDown} />
      </div>
    </section>
  );
}
