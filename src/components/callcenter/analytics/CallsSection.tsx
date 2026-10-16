// The action center: recent calls with quick filters, a call drawer (timeline, AI analysis, recording) and follow-up tasks.
// The existing call-history and call-detail workflows are untouched; this adds a place to act on what the numbers show.
import { appLocale } from "@/utils/appLocale";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Download, FileAudio, Mic, PhoneIncoming, PhoneOutgoing, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { CallAnalysisPanel } from "@/components/callcenter/CallAnalysisPanel";
import { useCalls, useFilterOptions, useFollowUps } from "@/hooks/useCallAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { isCallCenterSupervisor } from "@/utils/roleUtils";
import { voiceApi } from "@/services/voiceApi";
import { callAnalyticsApi, type AnalyticsFilters, type CallListFilters, type CallRow } from "@/services/callAnalyticsApi";
import { callCenterApi, type CallTimeline } from "@/services/callCenterApi";
import { Panel, colorFor, fmtDateTime, fmtSeconds } from "./shared";

export const QUICK_FILTERS = ["missed", "failed", "unresolved", "follow_up", "complaint", "poor_quality", "no_analysis", "multi_transfer"] as const;
const AI_ONLY = new Set(["complaint", "poor_quality", "no_analysis", "unresolved"]);

interface Props {
  filters: AnalyticsFilters;
  callFilters: CallListFilters;
  update: (changes: Record<string, string | number | null | undefined>, options?: { keepPage?: boolean }) => void;
  aiEnabled: boolean;
}

export function CallsSection({ filters, callFilters, update, aiEnabled }: Props) {
  const { t } = useLanguage();
  const q = useCalls(filters, callFilters);
  const [openId, setOpenId] = useState<string | null>(null);
  const page = callFilters.page ?? 1;
  const pages = q.data ? Math.max(1, Math.ceil(q.data.count / q.data.page_size)) : 1;
  const extra = (["topic", "intent", "sentiment", "resolution", "problem"] as const).filter((k) => callFilters[k]);
  const [exporting, setExporting] = useState(false);

  // Every call that matches the current filters (not just the page on screen), 100 at a time.
  const fetchAllMatching = async (): Promise<CallRow[]> => {
    const all: CallRow[] = [];
    for (let p = 1; p <= 50; p++) {
      const res = await callAnalyticsApi.calls(filters, { ...callFilters, page: p, page_size: 100 });
      all.push(...res.results);
      if (all.length >= res.count || res.results.length === 0) break;
    }
    return all;
  };
  const numberOf = (c: CallRow) => ((c.direction === "inbound" ? c.caller : c.destination) || "").trim();

  const copyNumbers = async () => {
    setExporting(true);
    try {
      const numbers = Array.from(new Set((await fetchAllMatching()).map(numberOf).filter(Boolean)));
      await navigator.clipboard.writeText(numbers.join("\n"));
      toast({ title: t("an.copied", { count: numbers.length }) });
    } catch {
      toast({ title: t("an.copy_failed"), variant: "destructive" });
    }
    setExporting(false);
  };

  const downloadCsv = async () => {
    setExporting(true);
    try {
      const quote = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [["Number", "Direction", "When", "Outcome", "Agent", "Talk seconds", "IVR flow"].map(quote).join(",")];
      for (const c of await fetchAllMatching()) {
        lines.push([numberOf(c), c.direction, fmtDateTime(c.started_at), c.outcome, c.answered_by || "", c.connected_seconds ?? "", c.ivr_flow?.name ?? ""].map(quote).join(","));
      }
      const url = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `calls-${callFilters.filter || "all"}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("an.copy_failed"), variant: "destructive" });
    }
    setExporting(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant={!callFilters.filter ? "default" : "outline"} className="h-7 text-xs" onClick={() => update({ filter: null })}>{t("an.qf.all")}</Button>
        {QUICK_FILTERS.filter((f) => aiEnabled || !AI_ONLY.has(f)).map((f) => (
          <Button key={f} size="sm" variant={callFilters.filter === f ? "default" : "outline"} className="h-7 text-xs" onClick={() => update({ filter: f })}>{t(`an.qf.${f}` as "an.qf.missed")}</Button>
        ))}
        {extra.map((k) => (
          <Badge key={k} variant="secondary" className="gap-1 text-[11px]">{t(`an.cf.${k}` as "an.cf.topic")}: {String(callFilters[k])}
            <button type="button" aria-label={t("an.clear_filters")} onClick={() => update({ [k]: null })}><X className="h-3 w-3" /></button></Badge>
        ))}
        <span className="ml-auto flex gap-1.5">
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={exporting || !q.data?.count} onClick={() => void copyNumbers()}><Copy className="h-3 w-3" />{t("an.copy_numbers")}</Button>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={exporting || !q.data?.count} onClick={() => void downloadCsv()}><Download className="h-3 w-3" />{t("an.download_csv")}</Button>
        </span>
      </div>

      <Panel title={t("an.calls_title")} hint={q.data ? t("an.calls_count", { count: q.data.count }) : undefined} loading={q.isLoading && !q.data} error={q.error as Error} onRetry={() => q.refetch()}
        empty={!!q.data && q.data.results.length === 0} emptyText={t("an.calls_empty")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("an.col_when")}</TableHead><TableHead>{t("an.col_caller")}</TableHead><TableHead>{t("an.col_outcome")}</TableHead><TableHead>{t("an.col_agent")}</TableHead>
              <TableHead>{t("an.col_connected")}</TableHead><TableHead>{t("an.col_flow")}</TableHead>{aiEnabled && <TableHead>{t("an.col_summary")}</TableHead>}
              {aiEnabled && <TableHead>{t("an.col_topic")}</TableHead>}<TableHead>{t("an.col_resolution")}</TableHead><TableHead>{t("an.col_follow")}</TableHead><TableHead>{t("an.col_media")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {q.data?.results.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                  <TableCell className="whitespace-nowrap text-xs">{fmtDateTime(c.started_at)}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs"><span className="inline-flex items-center gap-1">{c.direction === "inbound" ? <PhoneIncoming className="h-3 w-3 text-blue-600" /> : <PhoneOutgoing className="h-3 w-3 text-violet-600" />}{c.direction === "inbound" ? c.caller : c.destination}</span></TableCell>
                  <TableCell><Badge style={{ background: colorFor(c.outcome), color: "white" }} className="text-[10px]">{t(`an.outcome.${c.outcome}` as "an.outcome.answered")}</Badge>
                    {c.transfers >= 2 && <Badge variant="outline" className="ml-1 text-[10px]">{t("an.transfers_n", { count: c.transfers })}</Badge>}</TableCell>
                  <TableCell className="text-xs">{c.answered_by || "—"}{c.answered_endpoint && <span className="ml-1 text-[10px] uppercase text-muted-foreground">{c.answered_endpoint}</span>}</TableCell>
                  <TableCell className="text-xs tabular-nums">{fmtSeconds(c.connected_seconds)}</TableCell>
                  <TableCell className="text-xs">{c.ivr_flow?.name ?? "—"}</TableCell>
                  {aiEnabled && <TableCell className="max-w-[260px] text-xs"><span className="line-clamp-2" title={c.summary ?? ""}>{c.summary ?? <span className="text-muted-foreground">—</span>}</span>{c.summary && <span className="text-[9px] uppercase text-muted-foreground">{t("an.ai_generated")}</span>}</TableCell>}
                  {aiEnabled && <TableCell className="text-xs">{c.topic ? t(`an.topic.${c.topic}` as "an.topic.other") : "—"}</TableCell>}
                  <TableCell className="text-xs">{c.resolution ? <span className="capitalize">{c.resolution.replace(/_/g, " ")}{c.disposition ? "" : ""}</span> : "—"}{c.disposition && <span className="block text-[10px] text-muted-foreground">{c.disposition.replace(/_/g, " ")}</span>}</TableCell>
                  <TableCell className="text-xs">{c.followups_open > 0 ? <Badge variant="destructive" className="text-[10px]">{t("an.followup_open", { count: c.followups_open })}</Badge> : c.callback_open ? <Badge variant="destructive" className="text-[10px]">{t("an.callback_open")}</Badge> : "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {c.has_recording ? <Mic className="inline h-3.5 w-3.5 text-muted-foreground" aria-label={t("an.has_recording")} /> : "—"}
                    {c.has_transcript && <FileAudio className="ml-1.5 inline h-3.5 w-3.5 text-muted-foreground" aria-label={t("an.has_transcript")} />}
                    {c.transcript_quality && c.transcript_quality !== "ok" && <Badge variant="outline" className="ml-1.5 text-[10px]">{t("an.poor_quality")}</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{page} / {pages}</span>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page <= 1} onClick={() => update({ page: page - 1 }, { keepPage: true })} aria-label={t("cc.history.prev")}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page >= pages} onClick={() => update({ page: page + 1 }, { keepPage: true })} aria-label={t("cc.history.next")}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </Panel>

      <FollowUpsPanel onOpenCall={setOpenId} />
      <CallDrawer id={openId} onClose={() => setOpenId(null)} aiEnabled={aiEnabled} />
    </div>
  );
}

// ── follow-ups ────────────────────────────────────────────────────────────────────────────────

function FollowUpsPanel({ onOpenCall }: { onOpenCall: (id: string) => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const q = useFollowUps(1);
  const finish = async (id: string, status: "done" | "cancelled") => {
    const res = await callAnalyticsApi.finishFollowUp(id, status);
    if (res.success) await queryClient.invalidateQueries({ queryKey: ["call-analytics"] });
    else toast({ title: t("an.followup_failed"), description: res.error, variant: "destructive" });
  };
  return (
    <Panel title={t("an.followups_title")} hint={q.data ? t("an.followups_hint", { tasks: q.data.tasks, callbacks: q.data.missed_callbacks, overdue: q.data.overdue }) : undefined}
      loading={q.isLoading} error={q.error as Error} onRetry={() => q.refetch()} empty={!!q.data && q.data.results.length === 0} emptyText={t("an.followups_empty")}>
      <ul className="divide-y divide-border">
        {q.data?.results.map((f) => (
          <li key={`${f.kind}-${f.id}`} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <button type="button" className="min-w-0 text-left hover:underline" onClick={() => onOpenCall(f.call_id)}>
              <span className="font-medium">{f.title}</span>
              <span className="block text-[11px] text-muted-foreground">{f.caller}{f.assigned_to ? ` · ${f.assigned_to}` : ""}{f.due_date ? ` · ${t("an.due", { date: f.due_date })}` : ""}</span>
            </button>
            <div className="flex items-center gap-2">
              {f.overdue && <Badge variant="destructive" className="text-[10px]">{t("an.overdue")}</Badge>}
              <Badge variant="outline" className="text-[10px]">{f.kind === "task" ? t("an.fu_task") : t("an.fu_callback")}</Badge>
              {f.kind === "task" ? <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => finish(f.id, "done")}><CheckCircle2 className="h-3.5 w-3.5" />{t("an.mark_done")}</Button>
                : <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate("/call-center/missed")}>{t("an.open_missed")}</Button>}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ── one call ──────────────────────────────────────────────────────────────────────────────────

interface CallDetail {
  id: string;
  recordings: Array<{ id: string; storage_path: string; analysis: Parameters<typeof CallAnalysisPanel>[0]["job"] | null }>;
}

function CallDrawer({ id, onClose, aiEnabled }: { id: string | null; onClose: () => void; aiEnabled: boolean }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const options = useFilterOptions();
  const [timeline, setTimeline] = useState<CallTimeline | null>(null);
  const [detail, setDetail] = useState<CallDetail | null>(null);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  // Loaded when the drawer opens for a call: the existing detail and timeline endpoints, not new copies of them.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setTimeline(null);
    setDetail(null);
    void callCenterApi.call.timeline(id).then((r) => !cancelled && r.success && r.data && setTimeline(r.data));
    void voiceApi.get<CallDetail>(`/voice/calls/${id}/`).then((r) => !cancelled && r.success && r.data && setDetail(r.data));
    return () => {
      cancelled = true;
    };
  }, [id]);
  const reload = () => {
    if (!id) return;
    void voiceApi.get<CallDetail>(`/voice/calls/${id}/`).then((r) => r.success && r.data && setDetail(r.data));
  };

  const createFollowUp = async () => {
    if (!id || !title.trim()) return;
    setSaving(true);
    const res = await callAnalyticsApi.createFollowUp(id, { title: title.trim(), assigned_to: assignee || undefined, due_date: due || undefined });
    setSaving(false);
    if (res.success) {
      setTitle(""); setAssignee(""); setDue("");
      toast({ title: t("an.followup_created") });
      await queryClient.invalidateQueries({ queryKey: ["call-analytics"] });
    } else {
      toast({ title: t("an.followup_failed"), description: res.error, variant: "destructive" });
    }
  };

  const recording = detail?.recordings?.[0];
  return (
    <Sheet open={!!id} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>{t("an.call_details")}</SheetTitle><SheetDescription>{id}</SheetDescription></SheetHeader>
        <div className="mt-4 space-y-5 text-sm">
          <section className="space-y-2 rounded-md border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("an.followup_new")}</p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} placeholder={t("an.followup_placeholder")} className="h-8 text-xs" />
            <div className="flex flex-wrap gap-2">
              <Select value={assignee || "__none__"} onValueChange={(v) => setAssignee(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="__none__">{t("an.unassigned")}</SelectItem>{options.data?.agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-8 w-40 text-xs" aria-label={t("an.due_date")} />
              <Button size="sm" className="h-8" disabled={saving || !title.trim() || !isCallCenterSupervisor(user)} onClick={createFollowUp}>{t("an.followup_add")}</Button>
            </div>
          </section>

          {recording && (
            <section className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("an.recording")}</p>
              <audio controls preload="none" src={recording.storage_path} className="h-9 w-full" />
            </section>
          )}

          {aiEnabled && recording?.analysis && (
            <section className="rounded-md border border-border p-3">
              <CallAnalysisPanel job={recording.analysis} canReview={isCallCenterSupervisor(user)} onChanged={reload} />
            </section>
          )}

          <section>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("an.routing_events")}</p>
            {!timeline ? <Skeleton className="h-24" /> : timeline.events.length === 0 ? <p className="text-xs text-muted-foreground">{t("cc.history.timeline_empty")}</p> : (
              <ol className="space-y-1">
                {timeline.events.map((e) => (
                  <li key={e.id} className="flex gap-3 text-xs"><span className="w-16 shrink-0 tabular-nums text-muted-foreground">{new Date(e.at).toLocaleTimeString(appLocale())}</span><span>{e.label}{e.agent ? ` — ${e.agent}` : ""}{e.endpoint ? ` (${e.endpoint})` : ""}</span></li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
