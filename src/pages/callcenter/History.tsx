// Call history for the call center. An agent sees only the calls they handled;
// a supervisor or admin sees the whole organization's — enforced by the
// backend, so the filters below only narrow what the server already allows.
import { PageSizeSelect, usePageSize } from "@/components/ui/ListPager";
import { appLocale } from "@/utils/appLocale";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, NotebookPen, PhoneIncoming, PhoneOutgoing, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useLanguage } from "@/hooks/useLanguage";
import { isCallCenterSupervisor } from "@/utils/roleUtils";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { PlayButton, RecordingPlayerBar, useRecordingPlayer } from "@/components/voice/RecordingPlayerBar";
import { CallAnalysisPanel } from "@/components/callcenter/CallAnalysisPanel";
import { AiSessionPanel } from "@/components/callcenter/AiSessionPanel";
import { voiceApi } from "@/services/voiceApi";
import { formatDuration } from "@/components/callcenter/callUtils";
import { callCenterApi, type AnalysisJobFull, type CCAgent, type CallNote, type CallRow, type CallTimeline, type Team } from "@/services/callCenterApi";

/** What GET /voice/calls/<id>/ returns that this page needs: each recording with its latest analysis job. */
interface CallRecordings {
  recordings: Array<{ id: string; storage_path: string; duration_seconds: number | null; analysis: AnalysisJobFull | null }>;
}

type CallState = "answered" | "missed" | "failed" | "live";

const OUTCOMES = ["answered", "missed", "voicemail", "abandoned", "rejected", "failed"] as const;

/** One word for what happened, from the fields the server gives us. */
function callState(c: CallRow): CallState {
  if (c.status === "ringing" || c.status === "in_progress") return "live";
  // The server's own verdict wins; the guesses below only cover calls from before outcomes were recorded.
  if (c.call_outcome === "answered") return "answered";
  if (c.call_outcome === "failed") return "failed";
  if (c.call_outcome) return "missed";
  if (c.answered_at) return "answered";
  if (c.direction === "outbound") return c.status === "completed" ? "answered" : "failed";
  return "missed";
}

const STATE_TONE: Record<CallState, "default" | "secondary" | "outline" | "destructive"> = {
  answered: "default", missed: "destructive", failed: "outline", live: "secondary",
};

export default function History() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const cc = useCallCenter();
  const supervisor = isCallCenterSupervisor(user);

  const [rows, setRows] = useState<CallRow[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = usePageSize("cc-history");
  const [direction, setDirection] = useState("all");
  const [team, setTeam] = useState("all");
  const [agent, setAgent] = useState("all");
  const [days, setDays] = useState("30");
  const [outcome, setOutcome] = useState("all");
  const [endpoint, setEndpoint] = useState("all");
  const [detailFor, setDetailFor] = useState<CallRow | null>(null);
  const [timeline, setTimeline] = useState<CallTimeline | null>(null);
  const [timelineError, setTimelineError] = useState(false);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<CCAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<CallRow | null>(null);
  const [notes, setNotes] = useState<CallNote[] | null>(null);
  const player = useRecordingPlayer();
  const [analysisFor, setAnalysisFor] = useState<CallRow | null>(null);
  const [analysisData, setAnalysisData] = useState<CallRecordings | null>(null);
  const [analysisMsg, setAnalysisMsg] = useState<string | null>(null);
  const [analysing, setAnalysing] = useState(false);

  const trackFor = (c: CallRow, rec: { id: string; storage_path: string; duration_seconds: number | null }) => ({
    id: rec.id,
    url: rec.storage_path,
    title: c.direction === "inbound" ? c.from_number : c.to_number,
    subtitle: [c.agent_name || c.agent?.name, new Date(c.started_at).toLocaleString(appLocale(), { dateStyle: "medium", timeStyle: "short" })].filter(Boolean).join(" · "),
    direction: c.direction,
    durationSeconds: rec.duration_seconds,
  });

  const loadAnalysis = useCallback(async (callId: string) => {
    const res = await voiceApi.get<CallRecordings>(`/voice/calls/${callId}/`);
    if (res.success && res.data) setAnalysisData(res.data);
    return res.success ? res.data : undefined;
  }, []);

  const openAnalysis = async (row: CallRow) => {
    setAnalysisFor(row);
    setAnalysisData(null);
    setAnalysisMsg(null);
    await loadAnalysis(row.id);
  };

  const analyseNow = async (force = false) => {
    if (!analysisFor) return;
    setAnalysing(true);
    setAnalysisMsg(null);
    const res = await voiceApi.post<{ queued: number }>("/audio/analyze-calls/", { call_ids: [analysisFor.id], force });
    setAnalysing(false);
    if (res.success) await loadAnalysis(analysisFor.id);
    else setAnalysisMsg(res.status === 403 ? t("cc.history.analysis_unavailable") : res.error || t("cc.history.load_failed"));
  };

  // While a job is queued or running, check again every few seconds so the result appears by itself.
  const working = analysisData?.recordings[0]?.analysis?.status;
  useEffect(() => {
    if (!analysisFor || (working !== "pending" && working !== "processing")) return;
    const id = setInterval(() => void loadAnalysis(analysisFor.id), 5000);
    return () => clearInterval(id);
  }, [analysisFor, working, loadAnalysis]);

  useEffect(() => {
    if (!supervisor) return;
    callCenterApi.teams.list().then((r) => r.success && r.data && setTeams(r.data));
    callCenterApi.agents.list().then((r) => r.success && r.data && setAgents(r.data));
  }, [supervisor]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => setPage(1), [direction, team, agent, days, query, outcome, endpoint]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await callCenterApi.calls({
      direction: direction === "all" ? undefined : direction,
      team: team === "all" ? undefined : team,
      agent: agent === "all" ? undefined : agent,
      days: days === "all" ? undefined : Number(days),
      q: query || undefined,
      outcome: outcome === "all" ? undefined : outcome,
      endpoint: endpoint === "all" ? undefined : endpoint,
      page,
      page_size: pageSize,
    });
    if (res.success && res.data) {
      setRows(res.data.results);
      setCount(res.data.count);
    } else {
      setError(res.error || t("cc.history.load_failed"));
    }
    setLoading(false);
  }, [direction, team, agent, days, query, outcome, endpoint, page, pageSize, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // A call just ended somewhere: refresh so it shows up.
  useEffect(() => cc.subscribe((e) => e.event === "call_ended" && void load()), [cc, load]);

  const openNotes = async (row: CallRow) => {
    setNotesFor(row);
    setNotes(null);
    const res = await callCenterApi.notes.list(row.id);
    setNotes(res.success && res.data ? res.data : []);
  };

  const openDetails = async (row: CallRow) => {
    setDetailFor(row);
    setTimeline(null);
    setTimelineError(false);
    const res = await callCenterApi.call.timeline(row.id);
    if (res.success && res.data) setTimeline(res.data);
    else setTimelineError(true);
  };

  const pages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <PageFrame
      title={t("cc.history.title")}
      subtitle={supervisor ? t("cc.history.subtitle_all") : t("cc.history.subtitle_mine")}
      actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.refresh")}</Button>}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("cc.history.search")} className="h-9 w-56" aria-label={t("cc.history.search")} />
        <Select value={direction} onValueChange={setDirection}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("cc.history.all_directions")}</SelectItem>
            <SelectItem value="inbound">{t("cc.history.inbound")}</SelectItem>
            <SelectItem value="outbound">{t("cc.history.outbound")}</SelectItem>
          </SelectContent>
        </Select>
        {supervisor && teams.length > 0 && (
          <Select value={team} onValueChange={setTeam}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cc.history.all_teams")}</SelectItem>
              {teams.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {supervisor && agents.length > 0 && (
          <Select value={agent} onValueChange={setAgent}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cc.history.all_agents")}</SelectItem>
              {agents.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="h-9 w-40" aria-label={t("cc.history.all_outcomes")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("cc.history.all_outcomes")}</SelectItem>
            {OUTCOMES.map((o) => <SelectItem key={o} value={o}>{t(`cc.history.outcome_${o}` as const)}</SelectItem>)}
          </SelectContent>
        </Select>
        {supervisor && (
          <Select value={endpoint} onValueChange={setEndpoint}>
            <SelectTrigger className="h-9 w-36" aria-label={t("cc.history.all_endpoints")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cc.history.all_endpoints")}</SelectItem>
              <SelectItem value="browser">{t("cc.history.endpoint_browser")}</SelectItem>
              <SelectItem value="phone">{t("cc.history.endpoint_phone")}</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="h-9 w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">{t("cc.history.today")}</SelectItem>
            <SelectItem value="7">{t("cc.history.last_7")}</SelectItem>
            <SelectItem value="30">{t("cc.history.last_30")}</SelectItem>
            <SelectItem value="90">{t("cc.history.last_90")}</SelectItem>
            <SelectItem value="all">{t("cc.history.all_time")}</SelectItem>
          </SelectContent>
        </Select>
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
      {!error && loading && <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>}
      {!error && !loading && rows.length === 0 && (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">{t("cc.history.empty")}</CardContent></Card>
      )}

      {!error && !loading && rows.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t("cc.history.col_caller")}</TableHead>
                  <TableHead>{t("cc.history.col_direction")}</TableHead>
                  <TableHead>{t("cc.history.col_team")}</TableHead>
                  <TableHead>{t("cc.agents.col_agent")}</TableHead>
                  <TableHead>{t("cc.history.col_date")}</TableHead>
                  <TableHead>{t("cc.history.col_duration")}</TableHead>
                  <TableHead>{t("cc.agents.col_status")}</TableHead>
                  <TableHead>{t("cc.history.col_recording")}</TableHead>
                  <TableHead>{t("cc.history.col_notes")}</TableHead>
                  <TableHead><span className="sr-only">{t("cc.history.details")}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const state = callState(c);
                  const other = c.direction === "inbound" ? c.from_number : c.to_number;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap font-mono text-sm">{other}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          {c.direction === "inbound" ? <PhoneIncoming className="h-3.5 w-3.5 text-blue-600" /> : <PhoneOutgoing className="h-3.5 w-3.5 text-violet-600" />}
                          {t(`cc.history.${c.direction}` as const)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{c.team?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        {c.answered_by?.name || c.agent_name || c.agent?.name || "—"}
                        {c.answered_endpoint && (
                          <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                            {t(`cc.history.endpoint_${c.answered_endpoint}` as const)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(c.started_at).toLocaleString(appLocale())}</TableCell>
                      <TableCell className="text-sm tabular-nums">{c.duration_seconds != null ? formatDuration(c.duration_seconds) : "—"}</TableCell>
                      <TableCell><Badge variant={STATE_TONE[state]}>{t(`cc.history.state_${state}` as const)}</Badge></TableCell>
                      <TableCell>
                        {c.recording ? (
                          <div className="flex items-center gap-1.5">
                            <PlayButton
                              active={player.isCurrent(c.recording.id)}
                              playing={player.isPlaying(c.recording.id)}
                              onClick={() => player.toggle(trackFor(c, c.recording!))}
                              label={t("cc.history.listen")}
                            />
                            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => openAnalysis(c)}>
                              <Sparkles className="h-3.5 w-3.5" />{t("cc.history.analysis")}
                            </Button>
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {c.notes_count > 0 ? (
                          <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => openNotes(c)}>
                            <NotebookPen className="h-3.5 w-3.5" />
                            {c.outcome ? t(`cc.outcome.${c.outcome}` as never) : c.notes_count}
                          </Button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => openDetails(c)}>{t("cc.history.details")}</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>{t("cc.history.showing", { count })}</span>
            <PageSizeSelect value={pageSize} onChange={(n) => { setPageSize(n); setPage(1); }} disabled={loading} />
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={t("cc.history.prev")}><ChevronLeft className="h-4 w-4" /></Button>
              <span>{page} / {pages}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label={t("cc.history.next")}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={!!detailFor} onOpenChange={(v) => !v && setDetailFor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("cc.history.timeline_title")}</DialogTitle>
            <DialogDescription className="font-mono">
              {detailFor ? (detailFor.direction === "inbound" ? detailFor.from_number : detailFor.to_number) : ""}
            </DialogDescription>
          </DialogHeader>
          {timelineError ? (
            <p className="text-sm text-destructive">{t("cc.history.timeline_failed")}</p>
          ) : timeline === null ? (
            <Skeleton className="h-32" />
          ) : timeline.events.length === 0 && timeline.attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("cc.history.timeline_empty")}</p>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto text-sm">
              {timeline.attempts.length > 0 && (
                <section>
                  <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.history.attempts")}</h4>
                  <ul className="space-y-1">
                    {timeline.attempts.map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-2 rounded border border-border px-2.5 py-1.5">
                        <span>{a.agent || "—"} <span className="text-xs text-muted-foreground">· {t(`cc.history.endpoint_${a.endpoint}` as const)}</span></span>
                        <Badge variant={a.outcome === "answered" ? "default" : "outline"}>{a.outcome}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              <section>
                <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.history.events")}</h4>
                <ol className="space-y-1">
                  {timeline.events.map((e) => (
                    <li key={e.id} className="flex gap-3">
                      <span className="w-20 shrink-0 tabular-nums text-xs text-muted-foreground">{new Date(e.at).toLocaleTimeString(appLocale())}</span>
                      <span>{e.label}{e.agent ? ` — ${e.agent}` : ""}{e.endpoint ? ` (${e.endpoint})` : ""}</span>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!analysisFor} onOpenChange={(v) => !v && setAnalysisFor(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("cc.history.analysis_title")}</DialogTitle>
            <DialogDescription className="font-mono">
              {analysisFor ? (analysisFor.direction === "inbound" ? analysisFor.from_number : analysisFor.to_number) : ""}
            </DialogDescription>
          </DialogHeader>
          {analysisFor && <AiSessionPanel callId={analysisFor.id} />}
          {analysisData === null ? (
            <Skeleton className="h-32" />
          ) : analysisData.recordings.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("cc.history.no_recording_yet")}</p>
          ) : (
            (() => {
              const rec = analysisData.recordings[0];
              const job = rec.analysis;
              return (
                <div className="space-y-4">
                  {analysisFor && (
                    <div className="flex items-center gap-3">
                      <PlayButton
                        active={player.isCurrent(rec.id)}
                        playing={player.isPlaying(rec.id)}
                        onClick={() => player.toggle(trackFor(analysisFor, rec))}
                        label={t("cc.history.listen")}
                      />
                      <span className="text-sm text-muted-foreground">{t("cc.history.listen")}</span>
                    </div>
                  )}
                  {job && job.result && "analysis_status" in job.result ? (
                    <CallAnalysisPanel
                      job={job}
                      canReview={supervisor}
                      onRerun={() => void analyseNow(true)}
                      onChanged={() => analysisFor && void loadAnalysis(analysisFor.id)}
                      onSeek={(seconds) => analysisFor && player.seek(trackFor(analysisFor, rec), seconds)}
                    />
                  ) : job && (job.status === "pending" || job.status === "processing") ? (
                    <p className="text-sm text-muted-foreground">{t("cc.history.analysis_working")}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{job?.status === "failed" ? t("cc.missed.ai_failed") : t("cc.history.analysis_none")}</p>
                      <Button size="sm" onClick={() => void analyseNow()} disabled={analysing}>
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />{t("cc.history.analyze_now")}
                      </Button>
                    </div>
                  )}
                  {analysisMsg && <p className="text-sm text-destructive">{analysisMsg}</p>}
                </div>
              );
            })()
          )}
        </DialogContent>
      </Dialog>

      <RecordingPlayerBar track={player.track} playing={player.playing} onPlayingChange={player.setPlaying} onClose={player.close} />

      <Dialog open={!!notesFor} onOpenChange={(v) => !v && setNotesFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("cc.history.notes_title")}</DialogTitle>
            <DialogDescription className="font-mono">{notesFor ? (notesFor.direction === "inbound" ? notesFor.from_number : notesFor.to_number) : ""}</DialogDescription>
          </DialogHeader>
          {notes === null ? (
            <Skeleton className="h-24" />
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("cc.history.no_notes")}</p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {notes.map((n) => (
                <div key={n.id} className="space-y-1 rounded-md border border-border p-3 text-sm">
                  <p className="text-xs text-muted-foreground">{n.agent_name} · {new Date(n.created_at).toLocaleString(appLocale())}</p>
                  <p className="flex flex-wrap gap-1.5">
                    {n.category && <Badge variant="outline">{n.category}</Badge>}
                    {n.outcome && <Badge variant="secondary">{t(`cc.outcome.${n.outcome}` as const)}</Badge>}
                  </p>
                  {n.notes && <p className="whitespace-pre-wrap text-foreground">{n.notes}</p>}
                  {n.follow_up && <p className="whitespace-pre-wrap text-muted-foreground"><b>{t("cc.wrapup.follow_up")}:</b> {n.follow_up}</p>}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
