// Agent performance and IVR flow performance. Offers are not answers, cancelled offers are not misses, and a call rung on
// a browser and a phone is one call - the server enforces that; this only shows what it returns and says what each column means.
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, ChevronRight, Info } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/hooks/useLanguage";
import { useAgentDetail, useAgents, useIvr, useIvrFlow } from "@/hooks/useCallAnalytics";
import type { AgentRow, AnalyticsFilters, IvrFlowRow } from "@/services/callAnalyticsApi";
import { Panel, fmtDateTime, fmtNum, fmtPct, fmtSeconds } from "./shared";

type SortKey = keyof Pick<AgentRow, "name" | "offered" | "answered" | "declined" | "unanswered" | "answer_rate" | "avg_wait_seconds" | "avg_handle_seconds" | "talk_seconds" | "unresolved" | "pending_followups">;

const STATUS_TONE: Record<string, string> = { available: "bg-green-500", busy: "bg-red-500", away: "bg-amber-500", dnd: "bg-red-700", acw: "bg-blue-500", offline: "bg-slate-400" };

interface Drill {
  drillDown: (c: Record<string, string | null>) => void;
}

export function AgentsSection({ filters, drillDown }: { filters: AnalyticsFilters } & Drill) {
  const { t } = useLanguage();
  const q = useAgents(filters);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "answered", dir: -1 });
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = [...(q.data?.agents ?? [])];
    list.sort((a, b) => {
      const x = a[sort.key] ?? -1, y = b[sort.key] ?? -1; // an unknown value sorts last, never as a zero
      return (typeof x === "string" ? x.localeCompare(String(y)) : (x as number) - (y as number)) * sort.dir;
    });
    return list;
  }, [q.data, sort]);

  const head = (key: SortKey, label: string, hint?: string) => (
    <TableHead className="whitespace-nowrap">
      <button type="button" className="inline-flex items-center gap-1 font-medium hover:text-foreground" title={hint} onClick={() => setSort((s) => ({ key, dir: s.key === key ? (-s.dir as 1 | -1) : -1 }))}>
        {label}{sort.key === key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </TableHead>
  );
  const d = q.data?.definitions ?? {};
  const chart = rows.slice(0, 12).map((r) => ({ name: r.name, answered: r.answered, unanswered: r.unanswered + r.declined, rate: r.answer_rate === null ? null : Math.round(r.answer_rate * 100), handle: r.avg_handle_seconds, talk: Math.round(r.talk_seconds / 60) }));

  return (
    <div className="space-y-3">
      <Panel title={t("an.agents_title")} hint={t("an.agents_hint")} loading={q.isLoading} error={q.error as Error} onRetry={() => q.refetch()} empty={!!q.data && rows.length === 0} emptyText={t("an.agents_empty")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {head("name", t("an.col_agent"))}
                <TableHead>{t("an.col_status")}</TableHead>
                {head("offered", t("an.col_offered"), d.offered)}
                {head("answered", t("an.col_answered"))}
                {head("declined", t("an.col_declined"), d.declined)}
                {head("unanswered", t("an.col_unanswered"), d.unanswered)}
                {head("answer_rate", t("an.col_answer_rate"), d.answer_rate)}
                {head("avg_wait_seconds", t("an.col_wait"))}
                {head("avg_handle_seconds", t("an.col_handle"))}
                {head("talk_seconds", t("an.col_talk"))}
                <TableHead>{t("an.col_transfers")}</TableHead>
                {head("unresolved", t("an.col_unresolved"))}
                {head("pending_followups", t("an.col_followups"))}
                <TableHead>{t("an.col_last")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id} className="cursor-pointer" onClick={() => setOpenId(a.id)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{a.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <div><p className="font-medium leading-tight">{a.name}</p><p className="text-[11px] text-muted-foreground">{a.teams.join(", ") || "—"}</p></div>
                    </div>
                  </TableCell>
                  <TableCell><span className="inline-flex items-center gap-1.5 text-xs"><span className={`h-2 w-2 rounded-full ${STATUS_TONE[a.status] ?? "bg-slate-400"}`} />{t(`cc.status.${a.status}` as "cc.status.offline")}</span></TableCell>
                  <TableCell className="tabular-nums">{a.offered}</TableCell>
                  <TableCell className="tabular-nums font-medium">{a.answered}</TableCell>
                  <TableCell className="tabular-nums">{a.declined}</TableCell>
                  <TableCell className="tabular-nums">{a.unanswered}</TableCell>
                  <TableCell className="tabular-nums">{fmtPct(a.answer_rate)}</TableCell>
                  <TableCell className="tabular-nums">{fmtSeconds(a.avg_wait_seconds)}</TableCell>
                  <TableCell className="tabular-nums">{fmtSeconds(a.avg_handle_seconds)}</TableCell>
                  <TableCell className="tabular-nums">{fmtSeconds(a.talk_seconds)}</TableCell>
                  <TableCell className="tabular-nums text-xs">{a.transfers_made} → / → {a.transfers_received}</TableCell>
                  <TableCell className="tabular-nums">{a.unresolved}</TableCell>
                  <TableCell className="tabular-nums">{a.pending_followups}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(a.last_activity)}</TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
          <li className="flex gap-1.5"><Info className="mt-0.5 h-3 w-3 shrink-0" />{d.offered}</li>
          <li className="flex gap-1.5"><Info className="mt-0.5 h-3 w-3 shrink-0" />{d.answer_rate}</li>
          <li className="flex gap-1.5"><Info className="mt-0.5 h-3 w-3 shrink-0" />{d.cancelled}</li>
        </ul>
      </Panel>

      {rows.some((r) => r.offered || r.answered) && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title={t("an.chart_answered_by_agent")}>
            <div className="h-56"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="answered" name={t("an.col_answered")} fill="#16a34a" stackId="a" radius={[0, 0, 0, 0]} /><Bar dataKey="unanswered" name={t("an.chart_missed_offers")} fill="#dc2626" stackId="a" />
              </BarChart></ResponsiveContainer></div>
          </Panel>
          <Panel title={t("an.chart_rate_and_handle")} hint={t("an.chart_rate_hint")}>
            <div className="h-56"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} margin={{ left: -12, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} height={48} /><YAxis yAxisId="l" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} /><YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} unit="s" />
                <Tooltip /><Bar yAxisId="l" dataKey="rate" name={t("an.col_answer_rate")} fill="#2563eb" /><Bar yAxisId="r" dataKey="handle" name={t("an.col_handle")} fill="#7c3aed" />
              </BarChart></ResponsiveContainer></div>
          </Panel>
        </div>
      )}
      <AgentDrawer id={openId} filters={filters} onClose={() => setOpenId(null)} drillDown={(c) => { setOpenId(null); drillDown(c); }} />
    </div>
  );
}

function AgentDrawer({ id, filters, onClose, drillDown }: { id: string | null; filters: AnalyticsFilters; onClose: () => void } & Drill) {
  const { t } = useLanguage();
  const q = useAgentDetail(id, filters);
  const a = q.data;
  return (
    <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{a?.name ?? t("an.agent")}</SheetTitle>
          <SheetDescription>{a?.teams?.join(", ")}</SheetDescription>
        </SheetHeader>
        {q.isLoading ? <Skeleton className="mt-4 h-48" /> : !a ? null : (
          <div className="mt-4 space-y-4 text-sm">
            <dl className="grid grid-cols-2 gap-2">
              {[
                [t("an.col_offered"), fmtNum(a.offered)], [t("an.col_answered"), fmtNum(a.answered)], [t("an.col_declined"), fmtNum(a.declined)],
                [t("an.col_unanswered"), fmtNum(a.unanswered)], [t("an.col_answer_rate"), fmtPct(a.answer_rate)], [t("an.col_wait"), fmtSeconds(a.avg_wait_seconds)],
                [t("an.col_handle"), fmtSeconds(a.avg_handle_seconds)], [t("an.col_talk"), fmtSeconds(a.talk_seconds)],
              ].map(([k, v]) => <div key={k} className="rounded border border-border p-2"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-semibold tabular-nums">{v}</dd></div>)}
            </dl>
            {a.trend.length > 0 ? (
              <div><p className="mb-1 text-xs font-medium text-muted-foreground">{t("an.agent_trend")}</p>
                <div className="h-40"><ResponsiveContainer width="100%" height="100%"><LineChart data={a.trend} margin={{ left: -20, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 10 }} /><Tooltip />
                  <Line type="monotone" dataKey="answered" name={t("an.col_answered")} stroke="#16a34a" strokeWidth={2} /></LineChart></ResponsiveContainer></div></div>
            ) : <p className="text-xs text-muted-foreground">{t("an.agent_no_trend")}</p>}
            <p className="text-[11px] text-muted-foreground">{a.preserved_for_transfers}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => drillDown({ agent: a.id })}>{t("an.agent_open_calls")}</Button>
              {a.unresolved > 0 && <Button size="sm" variant="outline" onClick={() => drillDown({ agent: a.id, filter: "unresolved" })}>{t("an.agent_open_unresolved", { count: a.unresolved })}</Button>}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── IVR flows ─────────────────────────────────────────────────────────────────────────────────

export function IvrSection({ filters, drillDown }: { filters: AnalyticsFilters } & Drill) {
  const { t } = useLanguage();
  const q = useIvr(filters);
  const [openId, setOpenId] = useState<string | null>(null);
  const flows = q.data?.flows ?? [];
  const d = q.data?.definitions ?? {};
  return (
    <div className="space-y-3">
      <Panel title={t("an.ivr_title")} hint={q.data?.tracking_note} loading={q.isLoading} error={q.error as Error} onRetry={() => q.refetch()} empty={!!q.data && flows.length === 0} emptyText={t("an.ivr_empty")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("an.ivr_flow")}</TableHead><TableHead title={d.entered}>{t("an.ivr_entered")}</TableHead><TableHead title={d.transferred_to_agents}>{t("an.ivr_transferred")}</TableHead>
              <TableHead title={d.answered_after_transfer}>{t("an.ivr_answered_after")}</TableHead><TableHead title={d.failed_to_reach_agent}>{t("an.ivr_failed_reach")}</TableHead>
              <TableHead title={d.abandoned_in_ivr}>{t("an.ivr_abandoned")}</TableHead><TableHead title={d.avg_ivr_seconds}>{t("an.ivr_time")}</TableHead><TableHead title={d.completion_rate}>{t("an.ivr_completion")}</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {flows.map((f: IvrFlowRow) => (
                <TableRow key={f.id} className="cursor-pointer" onClick={() => setOpenId(f.id)}>
                  <TableCell className="font-medium">{f.name}{f.status !== "published" && <Badge variant="outline" className="ml-2 text-[10px]">{f.status}</Badge>}</TableCell>
                  <TableCell className="tabular-nums">{f.entered}</TableCell><TableCell className="tabular-nums">{f.transferred_to_agents}</TableCell>
                  <TableCell className="tabular-nums">{f.answered_after_transfer}</TableCell><TableCell className="tabular-nums">{f.failed_to_reach_agent}</TableCell>
                  <TableCell className="tabular-nums">{f.abandoned_in_ivr}{f.abandon_rate !== null && f.entered > 0 && <span className="text-[11px] text-muted-foreground"> ({fmtPct(f.abandon_rate)})</span>}</TableCell>
                  <TableCell className="tabular-nums">{fmtSeconds(f.avg_ivr_seconds)}</TableCell>
                  <TableCell className="tabular-nums">{f.tracked_calls ? fmtPct(f.completion_rate) : "—"}<span className="block text-[10px] text-muted-foreground">{t("an.ivr_tracked", { tracked: f.tracked_calls, total: f.entered })}</span></TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
      <FlowDrawer id={openId} filters={filters} onClose={() => setOpenId(null)} drillDown={(c) => { setOpenId(null); drillDown(c); }} />
    </div>
  );
}

function FlowDrawer({ id, filters, onClose, drillDown }: { id: string | null; filters: AnalyticsFilters; onClose: () => void } & Drill) {
  const { t } = useLanguage();
  const q = useIvrFlow(id, filters);
  const f = q.data;
  const max = Math.max(1, ...(f?.steps.map((s) => s.calls) ?? [1]));
  return (
    <Sheet open={!!id} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>{f?.name ?? t("an.ivr_flow")}</SheetTitle><SheetDescription>{f ? t("an.ivr_flow_sub", { entered: f.entered, abandoned: f.abandoned_in_ivr }) : ""}</SheetDescription></SheetHeader>
        {q.isLoading ? <Skeleton className="mt-4 h-48" /> : !f ? null : (
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("an.ivr_steps")}</p>
              {f.tracked_calls === 0 ? <p className="text-xs text-muted-foreground">{t("an.ivr_no_steps")}</p> : (
                <ul className="space-y-1.5">
                  {f.steps.filter((s) => s.calls > 0).map((s) => (
                    <li key={s.node_id}>
                      <div className="flex items-center justify-between gap-2 text-xs"><span className="truncate"><b>{s.label || s.type}</b> <span className="text-muted-foreground">({s.type})</span></span><span className="tabular-nums">{s.calls}</span></div>
                      <div className="mt-0.5 h-2 rounded bg-muted"><div className="h-2 rounded bg-blue-600" style={{ width: `${(s.calls / max) * 100}%` }} /></div>
                      {s.choices.length > 0 && <p className="mt-0.5 text-[11px] text-muted-foreground">{s.choices.map((c) => `${c.input ?? c.branch}: ${c.calls}`).join(" · ")}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("an.ivr_exits")}</p>
              {f.exit_points.length === 0 ? <p className="text-xs text-muted-foreground">{t("an.ivr_no_exits")}</p> : (
                <ul className="space-y-1">{f.exit_points.map((e) => <li key={e.node_id} className="flex justify-between text-xs"><span>{e.label || e.type}</span><span className="tabular-nums">{e.calls}</span></li>)}</ul>
              )}
            </div>
            <Button size="sm" onClick={() => drillDown({ flow: f.id })}>{t("an.ivr_open_calls")}</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
