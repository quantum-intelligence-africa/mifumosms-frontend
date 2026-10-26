// Missed calls never just disappear: each one is a task with an owner and a follow-up status
// (new -> pending callback -> called back / scheduled -> contacted / unreachable -> resolved / gave up).
// Nothing here changes a status by itself: only a person (or a real call outcome recorded elsewhere) does.
import { PageSizeSelect, usePageSize } from "@/components/ui/ListPager";
import { appLocale } from "@/utils/appLocale";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CalendarClock, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, Mic, MoreHorizontal, NotebookPen, PhoneCall, PhoneMissed, RefreshCw, Repeat, Search, Sparkles, UserCheck, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useDialer } from "@/contexts/DialerContext";
import { useLanguage } from "@/hooks/useLanguage";
import { isCallCenterAdmin, isCallCenterSupervisor } from "@/utils/roleUtils";
import { CloseOldMissed } from "@/components/callcenter/CloseOldMissed";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { PlayButton, RecordingPlayerBar, formatClock, useRecordingPlayer } from "@/components/voice/RecordingPlayerBar";
import { CallAnalysisPanel } from "@/components/callcenter/CallAnalysisPanel";
import { voiceApi } from "@/services/voiceApi";
import { callCenterApi, describeError, type AnalysisJobFull, type CCAgent, type MissedCall, type MissedCallStatus, type MissedSummary, type Team, type Voicemail } from "@/services/callCenterApi";

const STATUSES: MissedCallStatus[] = ["new", "assigned", "called_back", "scheduled", "contacted", "unreachable", "resolved", "unresolved"];

const STATUS_TONE: Record<MissedCallStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "destructive",
  assigned: "secondary",
  called_back: "secondary",
  scheduled: "secondary",
  contacted: "secondary",
  unreachable: "outline",
  resolved: "default",
  unresolved: "outline",
};

type Range = "all" | "today" | "yesterday" | "7d" | "30d" | "custom";

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The period as the server understands it: the same named periods as Call analytics and Call log, cut by the organization's own days. */
function rangeParams(range: Range, from: string, to: string): { range?: string; date_from?: string; date_to?: string } {
  if (range === "today") return { range: "today" };
  if (range === "yesterday") return { range: "yesterday" };
  if (range === "7d") return { range: "last_7" };
  if (range === "30d") return { range: "last_30" };
  if (range === "custom") return { date_from: from || undefined, date_to: to || undefined };
  return {};
}

const quote = (v: string | number) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export default function MissedCalls() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const cc = useCallCenter();
  const { openDialer } = useDialer();
  const supervisor = isCallCenterSupervisor(user);

  const [rows, setRows] = useState<MissedCall[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("cc-missed", 20);
  const [summary, setSummary] = useState<MissedSummary | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<CCAgent[]>([]);
  // A card on the dashboard opens this list already narrowed (?focus=overdue | voicemail | new).
  const [searchParams] = useSearchParams();
  const focus = searchParams.get("focus");
  const [status, setStatus] = useState<string>(focus === "voicemail" ? "voicemail" : focus === "new" ? "new" : focus === "overdue" ? "open" : "attention");
  const [team, setTeam] = useState<string>("all");
  const [range, setRange] = useState<Range>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string>("any");
  const [onlyOverdue, setOnlyOverdue] = useState(focus === "overdue");
  const [onlyRepeated, setOnlyRepeated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [scheduling, setScheduling] = useState<MissedCall | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [noting, setNoting] = useState<MissedCall | null>(null);
  const [noteText, setNoteText] = useState("");
  const [assigning, setAssigning] = useState<MissedCall | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const player = useRecordingPlayer();

  // The filters as the server understands them (voicemail is its own switch on the same endpoint).
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    if (status === "voicemail") p.voicemail = "true";
    else if (status !== "all") p.status = status;
    if (team !== "all") p.team = team;
    if (result !== "any") p.result = result;
    if (query) p.q = query;
    if (onlyOverdue) p.overdue = "true";
    if (onlyRepeated) p.repeated = "true";
    return { ...p, ...rangeParams(range, from, to) };
  }, [status, team, result, query, onlyOverdue, onlyRepeated, range, from, to]);

  // Typing in the search box waits a moment before asking the server.
  useEffect(() => {
    const id = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => setPage(1), [params]);

  const fetchPage = useCallback(() => callCenterApi.missed.list({ ...params, page, page_size: pageSize }), [params, page, pageSize]);

  const loadSummary = useCallback(async () => {
    const res = await callCenterApi.missed.summary();
    if (res.success && res.data) setSummary(res.data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchPage();
    if (res.success && res.data) {
      setRows(res.data.results);
      setCount(res.data.count);
    } else setError(res.error || t("cc.missed.load_failed"));
    setLoading(false);
    void loadSummary();
  }, [fetchPage, loadSummary, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reload the list without the loading skeleton, so an open voicemail panel is not torn down.
  const refresh = useCallback(async () => {
    const res = await fetchPage();
    if (res.success && res.data) {
      setRows(res.data.results);
      setCount(res.data.count);
    }
    void loadSummary();
  }, [fetchPage, loadSummary]);

  useEffect(() => {
    if (!supervisor) return;
    callCenterApi.teams.list().then((r) => r.success && r.data && setTeams(r.data));
    callCenterApi.agents.list({ active: true }).then((r) => r.success && r.data && setAgents(r.data));
  }, [supervisor]);

  // A new missed call arrives over the socket: show it without a refresh.
  useEffect(() => cc.subscribe((e) => e.event === "missed_call" && void load()), [cc, load]);

  const pages = Math.max(1, Math.ceil(count / pageSize));

  // Every record matching the filters (not just this page), for copy and export.
  const fetchAll = async (): Promise<MissedCall[]> => {
    const all: MissedCall[] = [];
    for (let p = 1; p <= 100; p++) {
      const res = await callCenterApi.missed.list({ ...params, page: p, page_size: 200 });
      if (!res.success || !res.data) throw new Error(res.error || "failed");
      all.push(...res.data.results);
      if (!res.data.next) break;
    }
    return all;
  };

  const copyNumbers = async () => {
    setExporting(true);
    try {
      const numbers = Array.from(new Set((await fetchAll()).map((r) => (r.caller_number || "").trim()).filter(Boolean)));
      await navigator.clipboard.writeText(numbers.join("\n"));
      toast({ title: t("cc.missed.copied", { count: numbers.length }) });
    } catch {
      toast({ title: t("cc.missed.copy_failed"), variant: "destructive" });
    }
    setExporting(false);
  };

  const downloadCsv = async () => {
    setExporting(true);
    try {
      const lines = [["Number", "When", "Waited (s)", "Team", "Status", "Overdue", "Times missed", "Attempts", "Last follow-up", "Callback due", "Assigned to", "Notes"].map(quote).join(",")];
      for (const r of await fetchAll()) {
        lines.push([
          r.caller_number, new Date(r.call_started_at).toLocaleString(appLocale()), r.waited_seconds ?? "", r.team_name || "", r.status,
          r.is_overdue ? "yes" : "", r.repeat_count ?? 1, r.callback_attempts, r.last_followup_at ? new Date(r.last_followup_at).toLocaleString(appLocale()) : "",
          r.callback_at ? new Date(r.callback_at).toLocaleString(appLocale()) : "", r.assigned_to_name || "", r.notes || "",
        ].map(quote).join(","));
      }
      const url = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `missed-calls-${isoDay(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("cc.missed.copy_failed"), variant: "destructive" });
    }
    setExporting(false);
  };

  const listen = (row: MissedCall, vm: Voicemail) =>
    player.toggle({
      id: vm.id,
      url: vm.storage_path,
      title: row.caller_number,
      subtitle: `${t("cc.missed.voicemail")} · ${new Date(vm.created_at).toLocaleString(appLocale(), { dateStyle: "medium", timeStyle: "short" })}`,
      direction: "inbound",
      durationSeconds: vm.duration_seconds,
    });

  const seek = (row: MissedCall, vm: Voicemail, seconds: number) =>
    player.seek({
      id: vm.id,
      url: vm.storage_path,
      title: row.caller_number,
      subtitle: `${t("cc.missed.voicemail")} · ${new Date(vm.created_at).toLocaleString(appLocale(), { dateStyle: "medium", timeStyle: "short" })}`,
      direction: "inbound",
      durationSeconds: vm.duration_seconds,
    }, seconds);

  const update = async (row: MissedCall, body: Parameters<typeof callCenterApi.missed.update>[1]): Promise<boolean> => {
    setBusyId(row.id);
    const res = await callCenterApi.missed.update(row.id, body);
    setBusyId(null);
    if (!res.success || !res.data) {
      toast({ title: t("cc.missed.update_failed"), description: describeError(res), variant: "destructive" });
      return false;
    }
    // The row may no longer match the filter (e.g. resolved while looking at "needs attention"): reload so counts and paging stay true.
    void refresh();
    return true;
  };

  const callBack = async (row: MissedCall) => {
    // Use the agent's own live softphone when there is one; otherwise the regular dialer. A call attempt is not a resolution:
    // the person decides the outcome afterwards (contacted, unreachable, ...).
    if (cc.softphone === "ready" && !cc.active) {
      const err = cc.placeCall(row.caller_number);
      if (err) toast({ title: t("cc.missed.call_failed"), description: err, variant: "destructive" });
    } else {
      openDialer(row.caller_number);
    }
    if (row.status === "new" || row.status === "assigned" || row.status === "scheduled") await update(row, { status: "called_back" });
  };

  const saveSchedule = async () => {
    if (!scheduling || !scheduleAt) return;
    if (await update(scheduling, { status: "scheduled", callback_at: new Date(scheduleAt).toISOString() })) setScheduling(null);
  };
  const saveNote = async () => {
    if (!noting) return;
    if (await update(noting, { notes: noteText })) setNoting(null);
  };
  const saveAssign = async () => {
    if (!assigning || !assignTo) return;
    const body: Parameters<typeof callCenterApi.missed.update>[1] = { assigned_to: assignTo };
    if (assigning.status === "new") body.status = "assigned";
    if (await update(assigning, body)) setAssigning(null);
  };

  const card = (key: string, label: string, value: number | undefined, active: boolean, onClick: () => void, tone?: string) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent/50 ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}
    >
      <span className={`block text-xl font-bold leading-tight tabular-nums ${tone ?? ""}`}>{value ?? "—"}</span>
      <span className="block text-[11px] text-muted-foreground">{label}</span>
    </button>
  );

  const showAll = () => {
    setStatus("all"); setOnlyOverdue(false); setOnlyRepeated(false);
  };

  return (
    <PageFrame
      title={t("cc.missed.title")}
      subtitle={t("cc.missed.subtitle")}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={copyNumbers} disabled={exporting || count === 0}><Copy className="mr-1.5 h-3.5 w-3.5" />{t("cc.missed.copy_numbers")}</Button>
          <Button variant="outline" size="sm" onClick={downloadCsv} disabled={exporting || count === 0}><Download className="mr-1.5 h-3.5 w-3.5" />{t("cc.missed.download")}</Button>
          {isCallCenterAdmin(user) && <CloseOldMissed onDone={load} />}
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.refresh")}</Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {card("attention", t("cc.missed.sum_attention"), summary?.needs_attention, status === "attention" && !onlyOverdue && !onlyRepeated, () => { setStatus("attention"); setOnlyOverdue(false); setOnlyRepeated(false); })}
        {card("new", t("cc.missed.sum_new"), summary?.new, status === "new", () => { setStatus("new"); setOnlyOverdue(false); })}
        {card("abandoned", t("cc.history.outcome_abandoned"), summary?.abandoned, result === "abandoned", () => { setResult(result === "abandoned" ? "any" : "abandoned"); setStatus("attention"); setOnlyOverdue(false); })}
        {card("overdue", t("cc.missed.sum_overdue"), summary?.overdue, onlyOverdue, () => { setStatus("open"); setOnlyOverdue(true); }, summary && summary.overdue > 0 ? "text-destructive" : undefined)}
        {card("scheduled", t("cc.missed.sum_scheduled"), summary?.scheduled, status === "scheduled", () => { setStatus("scheduled"); setOnlyOverdue(false); })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("cc.missed.search")} className="h-9 w-48 pl-8" inputMode="tel" aria-label={t("cc.missed.search")} />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setOnlyOverdue(false); }}>
          <SelectTrigger className="h-9 w-44" aria-label={t("cc.agents.col_status")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="attention">{t("cc.missed.filter_open")}</SelectItem>
            <SelectItem value="open">{t("cc.missed.filter_not_closed")}</SelectItem>
            <SelectItem value="all">{t("cc.missed.filter_all")}</SelectItem>
            <SelectItem value="voicemail">{t("cc.missed.filter_voicemail")}</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`cc.missed.status_${s}` as const)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={result} onValueChange={setResult}>
          <SelectTrigger className="h-9 w-44" aria-label={t("cc.missed.result")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("cc.missed.result_any")}</SelectItem>
            <SelectItem value="abandoned">{t("cc.history.outcome_abandoned")}</SelectItem>
            <SelectItem value="missed">{t("cc.history.outcome_missed")}</SelectItem>
            <SelectItem value="voicemail">{t("cc.history.outcome_voicemail")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={range} onValueChange={(v) => setRange(v as Range)}>
          <SelectTrigger className="h-9 w-40" aria-label={t("cc.missed.range")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("cc.missed.range_all")}</SelectItem>
            <SelectItem value="today">{t("cc.missed.range_today")}</SelectItem>
            <SelectItem value="yesterday">{t("cc.missed.range_yesterday")}</SelectItem>
            <SelectItem value="7d">{t("cc.missed.range_7d")}</SelectItem>
            <SelectItem value="30d">{t("cc.missed.range_30d")}</SelectItem>
            <SelectItem value="custom">{t("cc.missed.range_custom")}</SelectItem>
          </SelectContent>
        </Select>
        {range === "custom" && (
          <>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-36" aria-label={t("cc.missed.from")} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-36" aria-label={t("cc.missed.to")} />
          </>
        )}
        {supervisor && teams.length > 0 && (
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cc.history.all_teams")}</SelectItem>
              {teams.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" variant={onlyRepeated ? "default" : "outline"} className="h-9" onClick={() => setOnlyRepeated((v) => !v)} aria-pressed={onlyRepeated}>
          <Repeat className="mr-1.5 h-3.5 w-3.5" />{t("cc.missed.repeated")}
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>{t("common.try_again")}</Button>
          </CardContent>
        </Card>
      )}
      {!error && loading && <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>}

      {!error && !loading && rows.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <h3 className="text-base font-semibold">{t("cc.missed.empty_title")}</h3>
            <p className="max-w-md text-sm text-muted-foreground">{t("cc.missed.empty_desc")}</p>
            {(status !== "all" || result !== "any" || query || range !== "all" || onlyOverdue || onlyRepeated) && (
              <Button variant="outline" size="sm" onClick={() => { showAll(); setResult("any"); setSearch(""); setRange("all"); setTeam("all"); }}>{t("cc.missed.clear_filters")}</Button>
            )}
          </CardContent>
        </Card>
      )}

      {!error && !loading && rows.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t("cc.missed.col_caller")}</TableHead>
                  <TableHead>{t("cc.missed.col_time")}</TableHead>
                  <TableHead>{t("cc.history.col_team")}</TableHead>
                  <TableHead>{t("cc.missed.col_assigned")}</TableHead>
                  <TableHead>{t("cc.missed.col_followup")}</TableHead>
                  <TableHead>{t("cc.missed.col_status")}</TableHead>
                  <TableHead className="text-right">{t("cc.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const closed = r.status === "resolved" || r.status === "unresolved";
                  return (
                    <Fragment key={r.id}>
                    <TableRow className={r.is_overdue ? "bg-destructive/5" : undefined}>
                      <TableCell className="whitespace-nowrap font-mono text-sm">
                        <span className="inline-flex items-center gap-1.5"><PhoneMissed className="h-3.5 w-3.5 text-red-500" />{r.caller_number}</span>
                        {r.call_outcome && (
                          <Badge variant={r.call_outcome === "abandoned" ? "destructive" : "outline"} className="ml-2 px-1.5 py-0 font-sans text-[10px]">
                            {t(`cc.history.outcome_${r.call_outcome}` as never)}
                          </Badge>
                        )}
                        {(r.repeat_count ?? 1) > 1 && (
                          <Badge variant="outline" className="ml-2 gap-1 px-1.5 py-0 font-sans text-[10px]" title={t("cc.missed.repeat_hint", { count: r.repeat_count })}>
                            <Repeat className="h-2.5 w-2.5" />×{r.repeat_count}
                          </Badge>
                        )}
                        {r.voicemail && (
                          <div className="mt-1 flex items-center gap-1.5 font-sans">
                            <button
                              type="button"
                              onClick={() => listen(r, r.voicemail!)}
                              className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm hover:opacity-90"
                              aria-label={t("cc.missed.voicemail_listen")}
                            >
                              <Mic className="h-3 w-3" />
                              {t("cc.missed.voicemail")}
                              {r.voicemail.duration_seconds ? ` · ${formatClock(r.voicemail.duration_seconds)}` : ""}
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpanded((e) => ({ ...e, [r.id]: e[r.id] === false }))}
                              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                              aria-expanded={expanded[r.id] !== false}
                              aria-label={t("cc.missed.voicemail")}
                            >
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded[r.id] !== false ? "rotate-180" : ""}`} />
                            </button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(r.call_started_at).toLocaleString(appLocale())}
                        {r.waited_seconds > 0 && <span className="block text-[11px]">{t(r.call_outcome === "abandoned" ? "cc.missed.waited_abandoned" : "cc.missed.waited", { time: formatClock(r.waited_seconds) })}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{r.team_name || "—"}</TableCell>
                      <TableCell className="text-sm">{r.assigned_to_name || "—"}</TableCell>
                      <TableCell className="max-w-[220px] text-xs text-muted-foreground">
                        {r.callback_attempts > 0 || r.last_followup_at ? (
                          <span className="block">
                            {t("cc.missed.attempts_n", { count: r.callback_attempts })}
                            {r.last_followup_at ? ` · ${new Date(r.last_followup_at).toLocaleString(appLocale(), { dateStyle: "short", timeStyle: "short" })}` : ""}
                          </span>
                        ) : <span className="block">{t("cc.missed.no_followup")}</span>}
                        {r.status === "scheduled" && r.callback_at && (
                          <span className={`flex items-center gap-1 ${r.is_overdue ? "font-medium text-destructive" : ""}`}>
                            <CalendarClock className="h-3 w-3" />{new Date(r.callback_at).toLocaleString(appLocale(), { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        )}
                        {r.notes && <span className="line-clamp-2 italic" title={r.notes}>{r.notes}</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={STATUS_TONE[r.status]}>{t(`cc.missed.status_${r.status}` as const)}</Badge>
                        {r.is_overdue && <span className="ml-1.5 text-[11px] font-medium text-destructive">{t("cc.missed.overdue")}</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!closed && (
                            <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={busyId === r.id} onClick={() => callBack(r)}>
                              <PhoneCall className="h-3.5 w-3.5" />{t("cc.missed.call_back")}
                            </Button>
                          )}
                          {!closed && r.status === "new" && (
                            <Button size="sm" variant="ghost" className="h-8 gap-1.5" disabled={busyId === r.id} onClick={() => update(r, { status: "assigned" })} title={t("cc.missed.claim_hint")}>
                              <UserCheck className="h-3.5 w-3.5" />{t("cc.missed.claim")}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={t("cc.common.actions")} disabled={busyId === r.id}><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!closed && (
                                <>
                                  <DropdownMenuItem onClick={() => { setScheduling(r); setScheduleAt(""); }}><CalendarClock className="mr-2 h-4 w-4" />{t("cc.missed.schedule")}</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => update(r, { status: "contacted" })}>{t("cc.missed.mark_contacted")}</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => update(r, { status: "unreachable" })}>{t("cc.missed.mark_unreachable")}</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => update(r, { status: "resolved" })}>{t("cc.missed.resolve")}</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => update(r, { status: "unresolved" })}>{t("cc.missed.give_up")}</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {closed && <DropdownMenuItem onClick={() => update(r, { status: "new" })}>{t("cc.missed.reopen")}</DropdownMenuItem>}
                              <DropdownMenuItem onClick={() => { setNoting(r); setNoteText(r.notes || ""); }}><NotebookPen className="mr-2 h-4 w-4" />{t("cc.missed.add_note")}</DropdownMenuItem>
                              {supervisor && agents.length > 0 && (
                                <DropdownMenuItem onClick={() => { setAssigning(r); setAssignTo(r.assigned_to || ""); }}><UserPlus className="mr-2 h-4 w-4" />{t("cc.missed.assign")}</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                    {r.voicemail && expanded[r.id] !== false && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={7}>
                          <VoicemailPanel row={r} vm={r.voicemail} playing={player.isPlaying(r.voicemail.id)} current={player.isCurrent(r.voicemail.id)} onListen={() => listen(r, r.voicemail!)} canReview={supervisor} onChanged={() => void refresh()} onSeek={(seconds) => seek(r, r.voicemail!, seconds)} />
                        </TableCell>
                      </TableRow>
                    )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <span>{t("cc.missed.showing", { count })}</span>
            <PageSizeSelect value={pageSize} onChange={(n) => { setPageSize(n); setPage(1); }} disabled={loading} />
            <span className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={t("cc.missed.prev")}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="tabular-nums">{page} / {pages}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label={t("cc.missed.next")}><ChevronRight className="h-4 w-4" /></Button>
            </span>
          </div>
        </Card>
      )}

      <Dialog open={!!scheduling} onOpenChange={(o) => !o && setScheduling(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cc.missed.schedule")}</DialogTitle>
            <DialogDescription>{scheduling?.caller_number}</DialogDescription>
          </DialogHeader>
          <Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} aria-label={t("cc.missed.schedule_when")} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduling(null)}>{t("cc.common.cancel")}</Button>
            <Button onClick={saveSchedule} disabled={!scheduleAt || busyId === scheduling?.id}>{t("cc.missed.schedule_save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!noting} onOpenChange={(o) => !o && setNoting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cc.missed.add_note")}</DialogTitle>
            <DialogDescription>{noting?.caller_number}</DialogDescription>
          </DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} maxLength={2000} placeholder={t("cc.missed.note_placeholder")} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoting(null)}>{t("cc.common.cancel")}</Button>
            <Button onClick={saveNote} disabled={busyId === noting?.id}>{t("cc.common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cc.missed.assign")}</DialogTitle>
            <DialogDescription>{assigning?.caller_number}</DialogDescription>
          </DialogHeader>
          <Select value={assignTo} onValueChange={setAssignTo}>
            <SelectTrigger><SelectValue placeholder={t("cc.missed.pick_agent")} /></SelectTrigger>
            <SelectContent>{agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>{t("cc.common.cancel")}</Button>
            <Button onClick={saveAssign} disabled={!assignTo || busyId === assigning?.id}>{t("cc.missed.assign")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecordingPlayerBar track={player.track} playing={player.playing} onPlayingChange={player.setPlaying} onClose={player.close} />
    </PageFrame>
  );
}

/** What the caller said (audio, plus the AI's transcript and summary) — separate from the agents' own notes. */
function VoicemailPanel({ row, vm, playing, current, onListen, canReview, onChanged, onSeek }: { row: MissedCall; vm: Voicemail; playing: boolean; current: boolean; onListen: () => void; canReview: boolean; onChanged: () => void; onSeek: (seconds: number) => void }) {
  const { t } = useLanguage();
  const [showTranscript, setShowTranscript] = useState(false);
  const ai = vm.analysis;
  const result = ai?.status === "completed" ? ai.result : null;
  const [analysing, setAnalysing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState<string | null>(null);
  // How long the AI has been "preparing": past ten minutes something is wrong, and the reader gets a way to start it again.
  const queuedAt = (ai as { created_at?: string } | null)?.created_at;
  const minutesWaiting = queuedAt ? Math.max(0, Math.floor((Date.now() - new Date(queuedAt).getTime()) / 60000)) : 0;

  // Queue an analysis of this message by hand (the automatic one only covers messages left after it was switched on).
  const analyseNow = async (force = false) => {
    setAnalysing(true);
    setAnalysisMsg(null);
    const res = await voiceApi.post<{ queued: number }>("/audio/analyze-calls/", { call_ids: [row.call], force });
    setAnalysing(false);
    if (res.success) onChanged();
    else setAnalysisMsg(res.status === 403 ? t("cc.history.analysis_unavailable") : res.error || t("cc.missed.ai_failed"));
  };

  // While it is queued or running, look again every few seconds so the result shows up by itself.
  const working = ai?.status === "pending" || ai?.status === "processing";
  useEffect(() => {
    if (!working) return;
    const id = setInterval(onChanged, 5000);
    return () => clearInterval(id);
  }, [working, onChanged]);

  return (
    <div className="space-y-3 py-1 text-sm">
      <div className="flex items-center gap-3">
        <PlayButton active={current} playing={playing} onClick={onListen} label={t("cc.missed.voicemail_listen")} />
        <div>
          <p className="font-medium">{t("cc.missed.voicemail")}</p>
          {vm.duration_seconds ? <p className="text-xs text-muted-foreground">{formatClock(vm.duration_seconds)}</p> : null}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-3">
        {ai?.result && "analysis_status" in ai.result ? (
          <CallAnalysisPanel job={ai as AnalysisJobFull} canReview={canReview} onChanged={onChanged} onSeek={onSeek} onRerun={() => void analyseNow(true)} />
        ) : result ? (
          <div className="space-y-2">
            <p>{result.summary || "—"}</p>
            <div className="flex flex-wrap gap-1.5">
              {result.detected_intent && <Badge variant="secondary">{t("cc.missed.intent", { value: result.detected_intent.replace(/_/g, " ") })}</Badge>}
              {result.sentiment && <Badge variant="outline">{t("cc.missed.sentiment", { value: result.sentiment })}</Badge>}
            </div>
            {result.transcript && (
              <div>
                <button type="button" className="text-xs font-medium text-primary underline" onClick={() => setShowTranscript((v) => !v)}>
                  {t("cc.missed.ai_transcript")}
                </button>
                {showTranscript && <p className="mt-1 whitespace-pre-wrap rounded bg-muted/50 p-2 text-muted-foreground">{result.transcript}</p>}
              </div>
            )}
          </div>
        ) : ai && (ai.status === "pending" || ai.status === "processing") ? (
          <div className="space-y-2">
            <p className="text-muted-foreground">{t("cc.missed.ai_working")}</p>
            {minutesWaiting >= 10 && (
              <>
                <p className="text-xs text-amber-700 dark:text-amber-300">{t("cc.missed.ai_slow", { minutes: minutesWaiting })}</p>
                <Button size="sm" onClick={() => void analyseNow(true)} disabled={analysing}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />{t("cc.analysis.rerun")}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground">{ai?.status === "failed" ? t("cc.missed.ai_failed") : t("cc.history.analysis_none")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" onClick={() => void analyseNow()} disabled={analysing}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />{t("cc.history.analyze_now")}
              </Button>
              <Link to="/voice/ai-settings" className="text-xs font-medium text-primary underline">{t("cc.missed.ai_settings")}</Link>
            </div>
            {analysisMsg && <p className="text-xs text-destructive">{analysisMsg}</p>}
          </div>
        )}
      </div>

      {row.notes && (
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.missed.agent_notes")}</p>
          <p className="whitespace-pre-wrap text-muted-foreground">{row.notes}</p>
        </div>
      )}
    </div>
  );
}
