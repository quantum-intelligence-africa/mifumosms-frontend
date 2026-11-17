import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Bot, Loader2, PhoneMissed, RefreshCw, Search, Sparkles, Voicemail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/hooks/useLanguage";
import { appLanguage, appLocale } from "@/utils/appLocale";
import { isCallCenterSupervisor } from "@/utils/roleUtils";
import { aiKey } from "@/i18n/aiAgent";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { SummaryLines } from "@/components/callcenter/AiHandoffCard";
import { aiAgentApi, type Ticket, type TicketStatus } from "@/services/aiAgentApi";
import { callCenterApi, describeError, type AnalysisBody, type CCAgent, type MissedCall, type MissedCallStatus } from "@/services/callCenterApi";
import { voiceApi } from "@/services/voiceApi";

const STATUSES: TicketStatus[] = ["open", "assigned", "pending_customer", "resolved", "closed"];
const MISSED_STATUSES: MissedCallStatus[] = ["new", "assigned", "called_back", "scheduled", "contacted", "unreachable", "resolved", "unresolved"];
const MISSED_CLOSED: MissedCallStatus[] = ["resolved", "unresolved"];
const TICKET_CLOSED: TicketStatus[] = ["resolved", "closed"];

type Filter = "open" | "missed" | "tickets" | "closed" | "all";
const FILTERS: Filter[] = ["open", "missed", "tickets", "closed", "all"];

const missedStyle: Record<MissedCallStatus, string> = {
  new: "bg-amber-100 text-amber-900",
  assigned: "bg-sky-100 text-sky-900",
  called_back: "bg-violet-100 text-violet-900",
  scheduled: "bg-violet-100 text-violet-900",
  contacted: "bg-green-100 text-green-900",
  unreachable: "bg-muted text-muted-foreground",
  resolved: "bg-green-100 text-green-900",
  unresolved: "bg-muted text-muted-foreground",
};

/** One line of the list: a ticket or a missed call. */
type Row =
  | { kind: "ticket"; key: string; when: string; ticket: Ticket; closed: boolean }
  | { kind: "missed"; key: string; when: string; missed: MissedCall; closed: boolean };

const statusStyle: Record<TicketStatus, string> = {
  open: "bg-amber-100 text-amber-900",
  assigned: "bg-sky-100 text-sky-900",
  pending_customer: "bg-violet-100 text-violet-900",
  resolved: "bg-green-100 text-green-900",
  closed: "bg-muted text-muted-foreground",
};

const moodStyle: Record<string, string> = {
  positive: "bg-green-100 text-green-900",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-red-100 text-red-900",
  unknown: "bg-muted text-muted-foreground",
};

/** The readable parts of a voicemail's AI analysis (English one when the app is not in Swahili). */
function insightOf(vm: MissedCall["voicemail"]) {
  const result = vm?.analysis?.result ?? null;
  const body: AnalysisBody | null = result ? (appLanguage() === "sw" ? result.analysis : result.analysis_en ?? result.analysis) : null;
  const summary = body?.summary || result?.summary || "";
  const wants = body?.customer_issue || body?.call_purpose || (result?.detected_intent ? result.detected_intent.replace(/_/g, " ") : "");
  const mood = body?.sentiment || result?.sentiment || "";
  const next = body?.action_items?.[0]?.task || (body?.follow_up_required?.required ? body.follow_up_required.reason || "" : "");
  return { summary, wants, mood, next, transcript: result?.transcript || "", has: !!(summary || wants) };
}

export default function Tickets() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const supervisor = isCallCenterSupervisor(user);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [missed, setMissed] = useState<MissedCall[]>([]);
  const [agents, setAgents] = useState<CCAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [missedOpen, setMissedOpen] = useState<MissedCall | null>(null);
  const [busy, setBusy] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = query.trim();
    const wantsMissed = (!q || /\d/.test(q)); // the missed-call search is by number only
    const wantsTickets = filter !== "missed";
    const [tk, ms] = await Promise.all([
      wantsTickets ? aiAgentApi.tickets.list({ q: q || undefined }) : Promise.resolve(null),
      wantsMissed
        ? callCenterApi.missed.list({ page_size: 200, q: q || undefined, ...(filter === "closed" || filter === "all" || filter === "tickets" ? {} : { status: "attention", group: "caller" }) })
        : Promise.resolve(null),
    ]);
    setTickets(tk && tk.success && tk.data ? tk.data.results : []);
    setMissed(ms && ms.success && ms.data ? ms.data.results : []);
    if ((tk && !tk.success) || (ms && !ms.success)) setError(t("ai.tk.load_failed"));
    setLoading(false);
  }, [filter, query, t]);

  useEffect(() => {
    const handle = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(handle);
  }, [load]);

  useEffect(() => {
    if (supervisor) void callCenterApi.agents.list({ active: true }).then((res) => res.success && res.data && setAgents(res.data));
  }, [supervisor]);

  const openTicket = async (id: string) => {
    setOpenId(id);
    setDetail(null);
    const res = await aiAgentApi.tickets.get(id);
    if (res.success && res.data) setDetail(res.data);
  };

  const update = async (body: Parameters<typeof aiAgentApi.tickets.update>[1]) => {
    if (!detail) return;
    setBusy(true);
    const res = await aiAgentApi.tickets.update(detail.id, body);
    setBusy(false);
    if (res.success && res.data) {
      toast({ title: t("ai.tk.updated") });
      setDetail(res.data);
      void load();
    } else {
      toast({ title: t("ai.tk.update_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const retry = async (id: string) => {
    setBusy(true);
    const res = await aiAgentApi.retryEmail(id);
    setBusy(false);
    toast({ title: res.success && res.data?.status === "sent" ? t("ai.tk.retry_ok") : t("ai.tk.retry_failed"), variant: res.success && res.data?.status === "sent" ? undefined : "destructive" });
    if (detail) void openTicket(detail.id);
  };

  const when = (iso: string) => new Date(iso).toLocaleString(appLocale(), { dateStyle: "short", timeStyle: "short" });

  const updateMissed = async (body: Parameters<typeof callCenterApi.missed.update>[1]) => {
    if (!missedOpen) return;
    setBusy(true);
    const res = await callCenterApi.missed.update(missedOpen.id, body);
    setBusy(false);
    if (res.success && res.data) {
      toast({ title: t("ai.tk.updated") });
      setMissedOpen(res.data);
      void load();
    } else {
      toast({ title: t("ai.tk.update_failed"), description: describeError(res), variant: "destructive" });
    }
  };

  const analyse = async (callIds: string[]) => {
    if (callIds.length === 0) return;
    setAnalysing(true);
    const res = await voiceApi.post<{ queued: number }>("/audio/analyze-calls/", { call_ids: callIds.slice(0, 100) });
    setAnalysing(false);
    if (res.success) {
      toast({ title: t("ai.tk.a_started", { n: res.data?.queued ?? callIds.length }) });
      void load();
    } else {
      toast({ title: res.status === 403 ? t("ai.tk.a_off") : t("ai.tk.a_failed"), description: res.status === 403 ? undefined : describeError(res), variant: "destructive" });
    }
  };
  const needsAnalysis = (m: MissedCall) => !!m.voicemail && (!m.voicemail.analysis || m.voicemail.analysis.status === "failed");
  const unanalysed = missed.filter(needsAnalysis);

  // Keep an open voicemail box current when the list reloads (the analysis finishing, a status change).
  useEffect(() => {
    if (!missedOpen) return;
    const fresh = missed.find((m) => m.id === missedOpen.id);
    if (fresh && fresh !== missedOpen) setMissedOpen(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missed]);
  // While an analysis is running, look again every few seconds so the result appears by itself.
  const analysisRunning = missed.some((m) => m.voicemail?.analysis && (m.voicemail.analysis.status === "pending" || m.voicemail.analysis.status === "processing"));
  useEffect(() => {
    if (!analysisRunning) return undefined;
    const handle = window.setInterval(() => void load(), 6000);
    return () => window.clearInterval(handle);
  }, [analysisRunning, load]);

  const rows: Row[] = [
    ...tickets.map((tk): Row => ({ kind: "ticket", key: `t${tk.id}`, when: tk.created_at, ticket: tk, closed: TICKET_CLOSED.includes(tk.status) })),
    ...missed.map((m): Row => ({ kind: "missed", key: `m${m.id}`, when: m.call_started_at || m.created_at, missed: m, closed: MISSED_CLOSED.includes(m.status) })),
  ]
    .filter((r) => {
      // A call that left a voicemail is a message to answer, so it lives with the tickets; plain missed calls stay under "Missed calls".
      const isTicketLike = r.kind === "ticket" || !!r.missed.voicemail;
      if (filter === "open") return !r.closed;
      if (filter === "closed") return r.closed;
      if (filter === "tickets") return isTicketLike;
      if (filter === "missed") return !isTicketLike;
      return true;
    })
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  return (
    <PageFrame
      title={t("ai.tk.title")}
      subtitle={t("ai.tk.subtitle")}
      actions={
        <>
          {unanalysed.length > 0 && (
            <Button size="sm" disabled={analysing} onClick={() => void analyse(unanalysed.map((m) => m.call))}>
              {analysing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
              {t("ai.tk.a_run_all", { n: unanalysed.length })}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("sms.common.refresh")}</Button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {t(aiKey(f === "all" ? "ai.tk.all" : `ai.tk.f_${f}`))}
            </Button>
          ))}
        </div>
        <div className="relative min-w-[12rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("ai.tk.search")} aria-label={t("ai.tk.search")} />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="h-4 w-4" /> {error}</p>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t("ai.tk.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t("ai.tk.col_who")}</th>
                    <th className="px-3 py-2">{t("ai.tk.col_what")}</th>
                    <th className="hidden px-3 py-2 md:table-cell">{t("ai.tk.col_dept")}</th>
                    <th className="px-3 py-2">{t("ai.tk.col_status")}</th>
                    <th className="hidden px-3 py-2 md:table-cell">{t("ai.tk.col_when")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) =>
                    r.kind === "ticket" ? (
                      <tr key={r.key} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40" onClick={() => void openTicket(r.ticket.id)}>
                        <td className="px-3 py-2">{r.ticket.contact_name || r.ticket.contact_phone || "—"}</td>
                        <td className="px-3 py-2">
                          <span className="font-medium">{r.ticket.title}</span>
                          <span className="block font-mono text-[11px] text-muted-foreground">{r.ticket.reference}{r.ticket.priority === "high" ? ` · ${t("ai.tk.priority.high")}` : ""}</span>
                        </td>
                        <td className="hidden px-3 py-2 md:table-cell">{r.ticket.department ? t(aiKey(`ai.dept.${r.ticket.department}`)) : "—"}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[r.ticket.status]}`}>{t(aiKey(`ai.tk.status.${r.ticket.status}`))}</span></td>
                        <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">{when(r.when)}</td>
                      </tr>
                    ) : (
                      <tr key={r.key} className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40" onClick={() => setMissedOpen(r.missed)}>
                        <td className="px-3 py-2 font-mono text-xs">{r.missed.caller_number || "—"}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            {r.missed.voicemail ? <Voicemail className="h-3.5 w-3.5 text-primary" /> : <PhoneMissed className="h-3.5 w-3.5 text-red-600" />}
                            {t(aiKey(r.missed.voicemail ? "ai.tk.kind_voicemail" : "ai.tk.kind_missed"))}
                          </span>
                          {(r.missed.group?.count ?? 0) > 1 && <span className="ml-1.5 text-xs text-muted-foreground">×{r.missed.group!.count}</span>}
                          {r.missed.is_overdue && <span className="ml-1.5 text-xs font-medium text-red-700">!</span>}
                          {r.missed.voicemail && (() => {
                            const ins = insightOf(r.missed.voicemail);
                            return ins.has ? <span className="block max-w-md truncate text-xs text-muted-foreground">{ins.summary || ins.wants}</span> : null;
                          })()}
                        </td>
                        <td className="hidden px-3 py-2 md:table-cell">{r.missed.team_name || "—"}</td>
                        <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${missedStyle[r.missed.status]}`}>{t(`cc.missed.status_${r.missed.status}` as never)}</span></td>
                        <td className="hidden px-3 py-2 text-muted-foreground md:table-cell">{when(r.when)}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!missedOpen} onOpenChange={(v) => !v && setMissedOpen(null)}>
        <DialogContent className="sm:max-w-md">
          {missedOpen && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{missedOpen.caller_number}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${missedStyle[missedOpen.status]}`}>{t(`cc.missed.status_${missedOpen.status}` as never)}</span>
                </DialogTitle>
                <DialogDescription>
                  {t(aiKey(missedOpen.voicemail ? "ai.tk.kind_voicemail" : "ai.tk.kind_missed"))} · {when(missedOpen.call_started_at || missedOpen.created_at)}
                  {missedOpen.team_name ? ` · ${missedOpen.team_name}` : ""}
                  {missedOpen.waited_seconds ? ` · ${t("ai.tk.waited", { s: missedOpen.waited_seconds })}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <Label>{t("ai.tk.col_status")}</Label>
                  <Select value={missedOpen.status} onValueChange={(v) => void updateMissed({ status: v as MissedCallStatus })} disabled={busy}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MISSED_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`cc.missed.status_${s}` as never)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {supervisor && (
                  <Select value={missedOpen.assigned_to ?? "none"} onValueChange={(v) => void updateMissed({ assigned_to: v === "none" ? null : v })} disabled={busy}>
                    <SelectTrigger><SelectValue placeholder={t("ai.tk.unassigned")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("ai.tk.unassigned")}</SelectItem>
                      {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {!supervisor && missedOpen.assigned_to_name && <p className="text-xs text-muted-foreground">{t("ai.tk.assigned_to", { name: missedOpen.assigned_to_name })}</p>}
                {missedOpen.voicemail && (
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    <audio controls preload="none" src={missedOpen.voicemail.storage_path} className="h-9 w-full" />
                    {(() => {
                      const job = missedOpen.voicemail.analysis;
                      const ins = insightOf(missedOpen.voicemail);
                      if (job && (job.status === "pending" || job.status === "processing")) {
                        return <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />{t("ai.tk.a_working")}</p>;
                      }
                      if (!ins.has) {
                        return (
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-muted-foreground">{job?.status === "failed" ? t("ai.tk.a_failed") : t("ai.tk.a_none")}</p>
                            <Button size="sm" disabled={analysing} onClick={() => void analyse([missedOpen.call])}>
                              <Sparkles className="mr-1.5 h-3.5 w-3.5" />{t("ai.tk.a_run")}
                            </Button>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.tk.a_title")}</p>
                          {ins.summary && <div><p className="text-xs text-muted-foreground">{t("ai.tk.a_summary")}</p><p>{ins.summary}</p></div>}
                          {ins.wants && <div><p className="text-xs text-muted-foreground">{t("ai.tk.a_wants")}</p><p>{ins.wants}</p></div>}
                          {ins.next && <div><p className="text-xs text-muted-foreground">{t("ai.tk.a_next")}</p><p className="font-medium">{ins.next}</p></div>}
                          {ins.mood && (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${moodStyle[ins.mood] ?? moodStyle.unknown}`}>
                              {t("ai.tk.a_mood")}: {t(aiKey(`ai.tk.mood.${moodStyle[ins.mood] ? ins.mood : "unknown"}`))}
                            </span>
                          )}
                          {ins.transcript && (
                            <div>
                              <button type="button" className="text-xs font-medium text-primary underline" onClick={() => setShowTranscript((v) => !v)}>{t("ai.tk.a_transcript")}</button>
                              {showTranscript && <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-muted/50 p-2 text-muted-foreground">{ins.transcript}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <Link to="/call-center/missed" className="text-sm text-primary underline-offset-2 hover:underline">{t("ai.tk.open_missed")}</Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {!detail ? (
            <div className="space-y-3 py-4"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-24" /></div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{detail.reference}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[detail.status]}`}>{t(aiKey(`ai.tk.status.${detail.status}`))}</span>
                </DialogTitle>
                <DialogDescription>{detail.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{t(aiKey(`ai.tk.type.${detail.request_type}`))}</Badge>
                  {detail.department && <Badge variant="outline">{t(aiKey(`ai.dept.${detail.department}`))}</Badge>}
                  {detail.created_by_ai && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Bot className="h-3.5 w-3.5" />{t("ai.tk.by_ai")}</span>}
                </div>

                <section>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.tk.contact")}</p>
                  <p>{[detail.contact_name, detail.contact_phone, detail.contact_email].filter(Boolean).join(" · ") || "—"}</p>
                  {detail.preferred_callback_note && <p className="text-muted-foreground">{t("ai.tk.callback_note")}: {detail.preferred_callback_note}</p>}
                </section>

                {detail.description && (
                  <section>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.tk.description")}</p>
                    <p className="whitespace-pre-wrap">{detail.description}</p>
                  </section>
                )}
                {detail.summary && <SummaryLines summary={detail.summary} />}

                <section className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>{t("ai.tk.col_status")}</Label>
                    <Select value={detail.status} onValueChange={(v) => void update({ status: v as TicketStatus })} disabled={busy}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(aiKey(`ai.tk.status.${s}`))}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("ai.tk.priority")}</Label>
                    <Select value={detail.priority} onValueChange={(v) => void update({ priority: v })} disabled={busy}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{(["low", "normal", "high"] as const).map((p) => <SelectItem key={p} value={p}>{t(aiKey(`ai.tk.priority.${p}`))}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    {supervisor ? (
                      <Select value={detail.assigned_to ?? "none"} onValueChange={(v) => void update({ assigned_to: v === "none" ? null : v })} disabled={busy}>
                        <SelectTrigger><SelectValue placeholder={t("ai.tk.unassigned")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("ai.tk.unassigned")}</SelectItem>
                          {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : detail.assigned_to ? (
                      <Button variant="outline" size="sm" disabled={busy} onClick={() => void update({ assigned_to: null })}>{t("ai.tk.release")}</Button>
                    ) : (
                      <Button size="sm" disabled={busy} onClick={() => void update({ assigned_to: "me" })}>{t("ai.tk.take")}</Button>
                    )}
                    {detail.assigned_name && <p className="mt-1 text-xs text-muted-foreground">{t("ai.tk.assigned_to", { name: detail.assigned_name })}</p>}
                  </div>
                </section>

                <section>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("ai.tk.emails")}</p>
                  {(detail.notifications ?? []).length === 0 ? (
                    <p className="text-muted-foreground">{t("ai.tk.email_none")}</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {detail.notifications!.map((n) => (
                        <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                          <span className="min-w-0">
                            <span className="block truncate">{n.to}</span>
                            <span className="text-xs text-muted-foreground">
                              {t(n.kind === "internal" ? "ai.tk.email_internal" : "ai.tk.email_customer")} · {t(aiKey(`ai.tk.email_status.${n.status}`))}
                              {n.attempts > 1 ? ` · ${t("ai.tk.email_attempts", { count: n.attempts })}` : ""}
                            </span>
                            {n.status === "failed" && n.last_error && <span className="block text-xs text-red-700">{n.last_error}</span>}
                          </span>
                          {n.status === "failed" && supervisor && (
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => void retry(n.id)}>
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("ai.tk.retry")}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {detail.call_id && (
                  <Link to="/call-center/history" className="text-sm text-primary underline-offset-2 hover:underline">{t("ai.tk.open_call")}</Link>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
