// Filters, KPI cards and the overview charts. Every figure comes from the analytics API; clicking a chart point opens the
// matching calls (via ``drillDown``), never a separate, possibly different, query.
import { useState } from "react";
import { Cell, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useActivity, useDirections, useFilterOptions, useHeatmap, useOutcomes, useSummary, type AnalyticsTab,
} from "@/hooks/useCallAnalytics";
import type { AnalyticsFilters, RangePreset, Summary } from "@/services/callAnalyticsApi";
import { Change, OUTCOME_KEYS, Panel, colorFor, fmtDateTime, fmtNum, fmtPct, fmtSeconds } from "./shared";

const PRESETS: RangePreset[] = ["today", "yesterday", "last_7", "last_30", "this_month", "last_month", "custom"];
const ANY = "__any__";

interface UpdateProps {
  filters: AnalyticsFilters;
  update: (changes: Record<string, string | number | null | undefined>) => void;
}

export function FilterBar({ filters, update, clear }: UpdateProps & { clear: () => void }) {
  const { t } = useLanguage();
  const options = useFilterOptions();
  const pick = (key: keyof AnalyticsFilters) => (value: string) => update({ [key]: value === ANY ? null : value });
  const active = ["agent", "team", "number", "direction", "outcome", "flow"].some((k) => (filters as unknown as Record<string, string>)[k]);

  const select = (key: keyof AnalyticsFilters, label: string, items: Array<{ value: string; label: string }>) => (
    <Select value={((filters as unknown as Record<string, string>)[key] as string) || ANY} onValueChange={pick(key)}>
      <SelectTrigger className="h-8 w-[150px] text-xs" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{label}</SelectItem>
        {items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.range} onValueChange={(v) => update({ range: v, date_from: null, date_to: null })}>
          <SelectTrigger className="h-8 w-[160px] text-xs" aria-label={t("an.date_range")}><SelectValue /></SelectTrigger>
          <SelectContent>{PRESETS.map((p) => <SelectItem key={p} value={p}>{t(`an.range.${p}` as "an.range.today")}</SelectItem>)}</SelectContent>
        </Select>
        {filters.range === "custom" && (
          <>
            <Input type="date" className="h-8 w-[140px] text-xs" value={filters.date_from ?? ""} onChange={(e) => update({ date_from: e.target.value })} aria-label={t("an.from")} />
            <Input type="date" className="h-8 w-[140px] text-xs" value={filters.date_to ?? ""} onChange={(e) => update({ date_to: e.target.value })} aria-label={t("an.to")} />
          </>
        )}
        {select("direction", t("an.f_direction"), [{ value: "inbound", label: t("an.incoming") }, { value: "outbound", label: t("an.outgoing") }])}
        {select("outcome", t("an.f_outcome"), OUTCOME_KEYS.map((o) => ({ value: o, label: t(`an.outcome.${o}` as "an.outcome.answered") })))}
        {options.data && select("agent", t("an.f_agent"), options.data.agents.map((a) => ({ value: a.id, label: a.name })))}
        {options.data && select("team", t("an.f_team"), options.data.teams.map((a) => ({ value: a.id, label: a.name })))}
        {options.data && select("number", t("an.f_number"), options.data.numbers.map((a) => ({ value: a.id, label: a.label })))}
        {options.data && options.data.flows.length > 0 && select("flow", t("an.f_flow"), options.data.flows.map((a) => ({ value: a.id, label: a.name })))}
        {active && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" onClick={clear}><X className="h-3 w-3" />{t("an.clear_filters")}</Button>
        )}
      </div>
    </div>
  );
}

// ── KPI cards ─────────────────────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  definition: string;
  change?: number | null;
  points?: boolean;
  goodWhenUp?: boolean;
  onClick?: () => void;
  extra?: string;
  tone?: string;
}

function KpiCard({ label, value, definition, change, points, goodWhenUp = true, onClick, extra, tone }: KpiCardProps) {
  return (
    <Card className={onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""} onClick={onClick}>
      <CardContent className="space-y-1 p-3.5">
        <div className="flex items-start justify-between gap-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <span title={definition} className="text-muted-foreground/60" aria-label={definition}><Info className="h-3.5 w-3.5" /></span>
        </div>
        <p className={`text-2xl font-bold leading-none ${tone ?? ""}`}>{value}</p>
        {change !== undefined && <Change value={change} points={points} goodWhenUp={goodWhenUp} />}
        {extra && <p className="text-[11px] text-muted-foreground">{extra}</p>}
        <p className="text-[10px] leading-snug text-muted-foreground/80">{definition}</p>
      </CardContent>
    </Card>
  );
}

export function Kpis({ filters, drillDown }: { filters: AnalyticsFilters; drillDown: (c: Record<string, string | null>) => void }) {
  const { t } = useLanguage();
  const q = useSummary(filters);
  if (q.isLoading) return <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (q.error || !q.data) {
    return <Panel title={t("an.kpis")} error={q.error as Error} onRetry={() => q.refetch()}><span /></Panel>;
  }
  const s: Summary = q.data;
  const k = s.kpis;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-6">
        <KpiCard label={t("an.k_total")} value={fmtNum(k.total_calls.value)} definition={k.total_calls.definition} change={k.total_calls.change} extra={t("an.k_total_extra", { inbound: s.breakdown.inbound, outbound: s.breakdown.outbound })} />
        <KpiCard label={t("an.k_answered")} value={fmtNum(k.answered.value)} definition={k.answered.definition} change={k.answered.change} tone="text-green-600" onClick={() => drillDown({ outcome: "answered" })}
          extra={t("an.k_answered_extra", { agent: s.breakdown.answered_by_agent, ivr: s.breakdown.answered_without_agent })} />
        <KpiCard label={t("an.k_missed")} value={fmtNum(k.missed.value)} definition={k.missed.definition} change={k.missed.change} goodWhenUp={false} tone="text-red-600" onClick={() => drillDown({ filter: "missed" })} />
        <KpiCard label={t("an.k_failed")} value={fmtNum(k.failed.value)} definition={k.failed.definition} change={k.failed.change} goodWhenUp={false} tone="text-orange-600" onClick={() => drillDown({ filter: "failed" })} />
        <KpiCard label={t("an.k_answer_rate")} value={fmtPct(k.answer_rate.value, 1)} definition={k.answer_rate.definition} change={k.answer_rate.change} points />
        <KpiCard label={t("an.k_missed_rate")} value={fmtPct(k.missed_rate.value, 1)} definition={k.missed_rate.definition} change={k.missed_rate.change} points goodWhenUp={false} />
        <KpiCard label={t("an.k_wait")} value={fmtSeconds(k.avg_wait_seconds.value)} definition={k.avg_wait_seconds.definition} change={k.avg_wait_seconds.change} goodWhenUp={false} />
        <KpiCard label={t("an.k_talk")} value={fmtSeconds(k.avg_talk_seconds.value)} definition={k.avg_talk_seconds.definition} change={k.avg_talk_seconds.change} />
        <KpiCard label={t("an.k_total_talk")} value={fmtSeconds(k.total_talk_seconds.value)} definition={k.total_talk_seconds.definition} change={k.total_talk_seconds.change} />
        <KpiCard label={t("an.k_waiting_now")} value={fmtNum(s.live.waiting_now)} definition={s.live.definition} />
        <KpiCard label={t("an.k_unresolved")} value={fmtNum(k.unresolved.value)} definition={k.unresolved.definition} change={k.unresolved.change} goodWhenUp={false} tone="text-amber-600"
          onClick={() => drillDown({ filter: "unresolved" })} extra={k.unresolved.ai_estimated ? t("an.k_unresolved_extra", { count: k.unresolved.ai_estimated }) : undefined} />
        <KpiCard label={t("an.k_followups")} value={fmtNum(s.pending_followups.total)} definition={s.pending_followups.definition} onClick={() => drillDown({ filter: "follow_up" })}
          extra={t("an.k_followups_extra", { tasks: s.pending_followups.tasks, callbacks: s.pending_followups.missed_callbacks, overdue: s.pending_followups.overdue })} />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {t("an.updated", { time: fmtDateTime(s.generated_at), tz: s.period.timezone })}
      </p>
    </div>
  );
}

// ── charts ────────────────────────────────────────────────────────────────────────────────────

const SERIES = ["incoming", "outgoing", "answered", "missed", "failed"] as const;

function bucketLabel(iso: string, granularity: "hour" | "day" | "week") {
  const d = new Date(iso);
  if (granularity === "hour") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ActivityChart({ filters, drillDown }: { filters: AnalyticsFilters; drillDown: (c: Record<string, string | null>) => void }) {
  const { t } = useLanguage();
  const q = useActivity(filters);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const points = q.data?.points ?? [];
  return (
    <Panel title={t("an.activity_title")} hint={q.data ? t("an.activity_hint", { granularity: t(`an.gran.${q.data.granularity}` as "an.gran.day"), tz: q.data.timezone }) : undefined}
      loading={q.isLoading} error={q.error as Error} onRetry={() => q.refetch()} empty={!!q.data && points.every((p) => !p.incoming && !p.outgoing)}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points.map((p) => ({ ...p, label: bucketLabel(p.bucket, q.data!.granularity) }))} margin={{ left: -16, right: 8, top: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend
              onClick={(e) => setHidden((h) => ({ ...h, [String(e.dataKey)]: !h[String(e.dataKey)] }))}
              formatter={(value) => <span className={hidden[value as string] ? "opacity-40" : ""}>{t(`an.series.${value}` as "an.series.incoming")}</span>}
            />
            {SERIES.map((s) => (
              <Line key={s} type="monotone" dataKey={s} name={s} stroke={colorFor(s)} strokeWidth={2} dot={false} hide={!!hidden[s]}
                activeDot={{ r: 5, cursor: "pointer", onClick: (_e, payload) => {
                  const bucket = (payload as unknown as { payload?: { bucket: string } })?.payload?.bucket;
                  if (!bucket) return;
                  drillDown(
                    s === "missed" ? { filter: "missed" } : s === "failed" ? { filter: "failed" } : s === "answered" ? { outcome: "answered" }
                      : s === "outgoing" ? { direction: "outbound", outcome: null } : { direction: "inbound", outcome: null },
                  );
                } }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function OutcomeDonut({ filters, drillDown }: { filters: AnalyticsFilters; drillDown: (c: Record<string, string | null>) => void }) {
  const { t } = useLanguage();
  const q = useOutcomes(filters);
  const data = q.data?.segments ?? [];
  return (
    <Panel title={t("an.outcomes_title")} hint={t("an.outcomes_hint")} loading={q.isLoading} error={q.error as Error} onRetry={() => q.refetch()} empty={!!q.data && data.length === 0}>
      <div className="grid items-center gap-3 sm:grid-cols-2">
        <div className="relative h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="label" innerRadius="60%" outerRadius="90%" paddingAngle={2} cursor="pointer"
                onClick={(slice) => drillDown({ outcome: String(slice.label) })}>
                {data.map((s) => <Cell key={s.label} fill={colorFor(s.label)} />)}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}`, t(`an.outcome.${name}` as "an.outcome.answered")]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold">{fmtNum(q.data?.total)}</span>
            <span className="text-[10px] text-muted-foreground">{t("an.calls")}</span>
          </div>
        </div>
        <ul className="space-y-1.5 text-sm">
          {data.map((s) => (
            <li key={s.label}>
              <button type="button" className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-0.5 text-left hover:bg-muted" onClick={() => drillDown({ outcome: s.label })} title={q.data?.definitions[s.label]}>
                <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colorFor(s.label) }} />{t(`an.outcome.${s.label}` as "an.outcome.answered")}</span>
                <span className="tabular-nums text-muted-foreground">{s.count} · {fmtPct(s.share)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export function DirectionCompare({ filters, drillDown }: { filters: AnalyticsFilters; drillDown: (c: Record<string, string | null>) => void }) {
  const { t } = useLanguage();
  const q = useDirections(filters);
  const rows = q.data
    ? [
        { key: "calls", label: t("an.d_volume"), inbound: fmtNum(q.data.inbound.calls), outbound: fmtNum(q.data.outbound.calls) },
        { key: "rate", label: t("an.d_answer_rate"), inbound: fmtPct(q.data.inbound.answer_rate, 1), outbound: fmtPct(q.data.outbound.answer_rate, 1) },
        { key: "talk", label: t("an.d_talk"), inbound: fmtSeconds(q.data.inbound.connected_talk_seconds), outbound: fmtSeconds(q.data.outbound.connected_talk_seconds) },
        { key: "dur", label: t("an.d_duration"), inbound: fmtSeconds(q.data.inbound.avg_duration_seconds), outbound: fmtSeconds(q.data.outbound.avg_duration_seconds) },
        { key: "fail", label: t("an.d_failure"), inbound: fmtPct(q.data.inbound.failure_rate, 1), outbound: fmtPct(q.data.outbound.failure_rate, 1) },
      ]
    : [];
  return (
    <Panel title={t("an.directions_title")} hint={q.data?.definitions.outbound_answer_rate} loading={q.isLoading} error={q.error as Error} onRetry={() => q.refetch()}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="py-1 font-medium" />
            <th className="py-1 font-medium"><button className="hover:underline" style={{ color: colorFor("incoming") }} onClick={() => drillDown({ outcome: null })}>{t("an.incoming")}</button></th>
            <th className="py-1 font-medium" style={{ color: colorFor("outgoing") }}>{t("an.outgoing")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-border">
              <td className="py-1.5 text-muted-foreground">{r.label}</td>
              <td className="py-1.5 tabular-nums">{r.inbound}</td>
              <td className="py-1.5 tabular-nums">{r.outbound}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function PeakHours({ filters, drillDown }: { filters: AnalyticsFilters; drillDown: (c: Record<string, string | null>) => void }) {
  const { t } = useLanguage();
  const q = useHeatmap(filters);
  const h = q.data;
  const max = h ? Math.max(1, ...h.total.flat()) : 1;
  const risky = new Set((h?.high_missed ?? []).map((c) => `${c.day}-${c.hour}`));
  return (
    <Panel title={t("an.peak_title")} hint={h ? t("an.peak_hint", { tz: h.timezone }) : undefined} loading={q.isLoading} error={q.error as Error} onRetry={() => q.refetch()} empty={!!h && h.inbound_calls === 0}>
      {h && (
        <div className="space-y-2">
          <div className="overflow-x-auto">
            <div className="grid min-w-[640px] gap-[2px]" style={{ gridTemplateColumns: "36px repeat(24, minmax(0, 1fr))" }}>
              <span />
              {Array.from({ length: 24 }).map((_, hr) => <span key={hr} className="text-center text-[9px] text-muted-foreground">{hr % 3 === 0 ? hr : ""}</span>)}
              {h.days.map((day, d) => (
                <div key={day} className="contents">
                  <span className="pr-1 text-right text-[10px] leading-5 text-muted-foreground">{day}</span>
                  {Array.from({ length: 24 }).map((_, hr) => {
                    const total = h.total[d][hr];
                    const missed = h.missed[d][hr];
                    const flagged = risky.has(`${d}-${hr}`);
                    return (
                      <button key={hr} type="button" disabled={!total} onClick={() => drillDown({ filter: "missed" })}
                        title={t("an.peak_cell", { day, hour: String(hr).padStart(2, "0"), total, missed })}
                        className={`h-5 rounded-sm ${flagged ? "ring-1 ring-red-500" : ""}`}
                        style={{ background: total ? `rgba(37,99,235,${0.12 + 0.88 * (total / max)})` : "hsl(var(--muted))" }} aria-label={`${day} ${hr}:00 ${total}`} />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {h.busiest.slice(0, 3).map((c) => <Badge key={`${c.day}-${c.hour}`} variant="secondary">{t("an.busiest", { day: h.days[c.day], hour: String(c.hour).padStart(2, "0"), total: c.total })}</Badge>)}
            {h.high_missed.slice(0, 2).map((c) => <Badge key={`m${c.day}-${c.hour}`} variant="destructive">{t("an.high_missed", { day: h.days[c.day], hour: String(c.hour).padStart(2, "0"), missed: c.missed, total: c.total })}</Badge>)}
          </div>
        </div>
      )}
    </Panel>
  );
}

export type { AnalyticsTab };
