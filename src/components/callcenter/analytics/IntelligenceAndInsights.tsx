// Conversation intelligence (from analyses that already exist; opening this screen never runs a model) and the evidence-based
// insights panel. AI values are labelled as AI estimates; measured facts and suggestions are shown apart.
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Info, Lightbulb, Minus, ShieldAlert } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useInsights, useIntelligence } from "@/hooks/useCallAnalytics";
import type { AnalyticsFilters, ShareRow } from "@/services/callAnalyticsApi";
import { Panel, fmtNum, fmtPct } from "./shared";

interface Drill {
  drillDown: (c: Record<string, string | null>) => void;
}

const SENTIMENT_COLORS: Record<string, string> = { positive: "#16a34a", neutral: "#64748b", negative: "#dc2626", unknown: "#cbd5e1" };

function ShareBars({ rows, onPick, color, labelOf }: { rows: ShareRow[]; onPick: (r: ShareRow) => void; color: string; labelOf: (key: string, fallback: string) => string }) {
  const { t } = useLanguage();
  const max = Math.max(1, ...rows.map((r) => r.calls));
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key}>
          <button type="button" className="w-full text-left" onClick={() => onPick(r)}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className={r.key === "unclear" ? "text-muted-foreground" : ""}>{labelOf(r.key, r.label)}</span>
              <span className="flex items-center gap-2 tabular-nums">
                {r.calls} · {fmtPct(r.share)}
                {r.change_points !== null && Math.abs(r.change_points) >= 0.1 ? (
                  <span className={`inline-flex items-center text-[11px] ${r.change_points > 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                    {r.change_points > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{Math.abs(r.change_points)} {t("an.pts")}
                  </span>
                ) : <Minus className="h-3 w-3 text-muted-foreground/50" />}
              </span>
            </div>
            <div className="mt-0.5 h-2 rounded bg-muted"><div className="h-2 rounded" style={{ width: `${(r.calls / max) * 100}%`, background: color }} /></div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function IntelligenceSection({ filters, drillDown, enabled }: { filters: AnalyticsFilters; enabled: boolean } & Drill) {
  const { t } = useLanguage();
  const q = useIntelligence(filters, enabled);
  const d = q.data;
  if (!enabled || (d && d.entitled === false)) {
    return <Panel title={t("an.intel_title")}><p className="py-6 text-center text-sm text-muted-foreground">{d?.reason || t("an.intel_not_in_plan")}</p></Panel>;
  }
  const sentiment = d?.sentiment ? Object.entries(d.sentiment.counts).map(([k, v]) => ({ key: k, value: v })) : [];
  const quality = d?.quality;
  return (
    <div className="space-y-3">
      {q.isLoading ? <Skeleton className="h-40" /> : q.error ? (
        <Panel title={t("an.intel_title")} error={q.error as Error} onRetry={() => q.refetch()}><span /></Panel>
      ) : d && (
        <>
          <p className="flex items-start gap-1.5 rounded-md border border-border bg-muted/40 p-2.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t("an.intel_coverage", { analysed: d.coverage?.analysed_calls ?? 0, categorized: d.coverage?.categorized_calls ?? 0 })} {d.coverage?.note}
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title={t("an.topics_title")} hint={t("an.topics_hint")} empty={!d.topics?.length} emptyText={t("an.topics_empty")}>
              <ShareBars rows={d.topics ?? []} color="#2563eb" onPick={(r) => drillDown({ topic: r.key })} labelOf={(k, f) => (t(`an.topic.${k}` as "an.topic.other") === `an.topic.${k}` ? f : t(`an.topic.${k}` as "an.topic.other"))} />
            </Panel>
            <Panel title={t("an.intents_title")} hint={t("an.intents_hint")} empty={!d.intents?.length} emptyText={t("an.topics_empty")}>
              <ShareBars rows={d.intents ?? []} color="#7c3aed" onPick={(r) => drillDown({ intent: r.key })} labelOf={(k, f) => (t(`an.intent.${k}` as "an.intent.other") === `an.intent.${k}` ? f : t(`an.intent.${k}` as "an.intent.other"))} />
            </Panel>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title={t("an.sentiment_title")} hint={d.sentiment?.disclaimer} empty={!d.sentiment?.analysed}>
              <div className="grid items-center gap-3 sm:grid-cols-2">
                <div className="h-40"><ResponsiveContainer width="100%" height="100%"><PieChart>
                  <Pie data={sentiment} dataKey="value" nameKey="key" innerRadius="55%" outerRadius="90%" cursor="pointer" onClick={(s) => drillDown({ sentiment: String(s.key) })}>
                    {sentiment.map((s) => <Cell key={s.key} fill={SENTIMENT_COLORS[s.key] ?? "#94a3b8"} />)}
                  </Pie><Tooltip formatter={(v, n) => [`${v}`, t(`an.sentiment.${n}` as "an.sentiment.positive")]} /></PieChart></ResponsiveContainer></div>
                <ul className="space-y-1 text-sm">
                  {sentiment.map((s) => (
                    <li key={s.key}><button type="button" className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-muted" onClick={() => drillDown({ sentiment: s.key })}>
                      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: SENTIMENT_COLORS[s.key] }} />{t(`an.sentiment.${s.key}` as "an.sentiment.positive")}</span><span className="tabular-nums">{s.value}</span></button></li>
                  ))}
                </ul>
              </div>
              <Badge variant="outline" className="mt-2 text-[10px]">{t("an.ai_estimate")}</Badge>
            </Panel>
            <Panel title={t("an.problems_title")} hint={d.problems?.note} empty={!d.problems?.rows.length} emptyText={t("an.problems_empty")}>
              <ul className="space-y-1.5">
                {d.problems?.rows.map((p) => (
                  <li key={p.problem}>
                    <button type="button" className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-sm hover:bg-muted" onClick={() => drillDown({ problem: p.problem })}>
                      <span className="truncate">{p.problem}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums">
                        {p.calls} <span className="text-muted-foreground">{t("an.problem_unresolved", { count: p.unresolved })}</span>
                        {p.trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5 text-red-600" /> : p.trend === "down" ? <ArrowDownRight className="h-3.5 w-3.5 text-green-600" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {d.problems?.truncated && <p className="mt-1 text-[11px] text-amber-600">{t("an.problems_truncated")}</p>}
            </Panel>
          </div>
          {quality && (
            <Panel title={t("an.quality_title")} hint={t("an.quality_hint")}>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {([
                  ["transcribed", quality.transcribed, null], ["poor", quality.poor, "poor_quality"], ["awaiting", quality.awaiting, null], ["failed", quality.failed, "no_analysis"],
                  ["needs_review", quality.needs_review, "poor_quality"], ["analysis_unusable", quality.analysis_unusable, "poor_quality"], ["not_analysed", quality.not_analysed, "no_analysis"], ["recorded", quality.recorded, null],
                ] as Array<[string, number, string | null]>).map(([key, value, filter]) => (
                  <button key={key} type="button" disabled={!filter} onClick={() => filter && drillDown({ filter })} title={quality.definitions[key]}
                    className="rounded-md border border-border p-2.5 text-left disabled:cursor-default enabled:hover:bg-muted">
                    <p className="text-xl font-bold tabular-nums">{fmtNum(value)}</p>
                    <p className="text-[11px] text-muted-foreground">{t(`an.quality.${key}` as "an.quality.poor")}</p>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{t("an.quality_note")}</p>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

// ── insights ──────────────────────────────────────────────────────────────────────────────────

const SEVERITY = {
  alert: { icon: ShieldAlert, tone: "border-red-300 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-100" },
  warning: { icon: AlertTriangle, tone: "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100" },
  info: { icon: Lightbulb, tone: "border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100" },
} as const;

export function InsightsPanel({ filters, drillDown }: { filters: AnalyticsFilters } & Drill) {
  const { t } = useLanguage();
  const q = useInsights(filters);
  if (q.isLoading) return <Skeleton className="h-20" />;
  if (q.error || !q.data) return null; // insights are a bonus: never let them break the dashboard
  const items = q.data.insights;
  return (
    <Panel title={t("an.insights_title")} hint={q.data.note} empty={items.length === 0} emptyText={t("an.insights_empty", { min: q.data.minimum_calls })}>
      <ul className="space-y-2">
        {items.map((i) => {
          const S = SEVERITY[i.severity];
          return (
            <li key={i.id} className={`rounded-md border p-3 text-sm ${S.tone}`}>
              <div className="flex items-start gap-2">
                <S.icon className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium">{i.fact}</p>
                  <p className="text-xs opacity-80">{t("an.insight_period", { period: i.period })} · {Object.entries(i.metric).map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "number" && v <= 1 && v > 0 && k.includes("rate") ? fmtPct(v) : v}`).join(" · ")}</p>
                  <p className="text-xs"><b>{t("an.insight_why")}</b> {i.why_it_matters}</p>
                  <p className="text-xs"><b>{t("an.insight_next")}</b> {i.suggestion}</p>
                </div>
                {Object.keys(i.drilldown).length > 0 && <Button size="sm" variant="outline" className="h-7 shrink-0 bg-background/60 text-xs" onClick={() => drillDown(i.drilldown)}>{t("an.insight_open")}</Button>}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
