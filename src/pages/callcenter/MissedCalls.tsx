// Missed calls never just disappear: each one is a task with an owner and a
// status (new -> assigned -> called back -> resolved/unresolved).
import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronDown, Mic, PhoneCall, PhoneMissed, RefreshCw, Sparkles, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useDialer } from "@/contexts/DialerContext";
import { useLanguage } from "@/hooks/useLanguage";
import { isCallCenterSupervisor } from "@/utils/roleUtils";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { PlayButton, RecordingPlayerBar, formatClock, useRecordingPlayer } from "@/components/voice/RecordingPlayerBar";
import { callCenterApi, describeError, type MissedCall, type MissedCallStatus, type Team, type Voicemail } from "@/services/callCenterApi";

const STATUSES: MissedCallStatus[] = ["new", "assigned", "called_back", "resolved", "unresolved"];
const OPEN_STATUSES: MissedCallStatus[] = ["new", "assigned", "called_back"];

const STATUS_TONE: Record<MissedCallStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "destructive",
  assigned: "secondary",
  called_back: "secondary",
  resolved: "default",
  unresolved: "outline",
};

export default function MissedCalls() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const cc = useCallCenter();
  const { openDialer } = useDialer();
  const supervisor = isCallCenterSupervisor(user);

  const [rows, setRows] = useState<MissedCall[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [status, setStatus] = useState<string>("open");
  const [team, setTeam] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const player = useRecordingPlayer();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await callCenterApi.missed.list({ team: team === "all" ? undefined : team });
    if (res.success && res.data) setRows(res.data.results);
    else setError(res.error || t("cc.missed.load_failed"));
    setLoading(false);
  }, [team, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (supervisor) callCenterApi.teams.list().then((r) => r.success && r.data && setTeams(r.data));
  }, [supervisor]);

  // A new missed call arrives over the socket: show it without a refresh.
  useEffect(() => cc.subscribe((e) => e.event === "missed_call" && void load()), [cc, load]);

  const visible = rows.filter((r) => {
    if (status === "voicemail") return !!r.voicemail;
    return status === "open" ? OPEN_STATUSES.includes(r.status) : status === "all" ? true : r.status === status;
  });

  const listen = (row: MissedCall, vm: Voicemail) =>
    player.toggle({
      id: vm.id,
      url: vm.storage_path,
      title: row.caller_number,
      subtitle: `${t("cc.missed.voicemail")} · ${new Date(vm.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`,
      direction: "inbound",
      durationSeconds: vm.duration_seconds,
    });

  const update = async (row: MissedCall, next: MissedCallStatus) => {
    setBusyId(row.id);
    const res = await callCenterApi.missed.update(row.id, { status: next });
    setBusyId(null);
    if (!res.success || !res.data) {
      toast({ title: t("cc.missed.update_failed"), description: describeError(res), variant: "destructive" });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? res.data! : r)));
  };

  const callBack = async (row: MissedCall) => {
    // Use the agent's own live softphone when there is one; otherwise the
    // regular dialer. Either way, count it as an attempt.
    if (cc.softphone === "ready" && !cc.active) {
      const err = cc.placeCall(row.caller_number);
      if (err) toast({ title: t("cc.missed.call_failed"), description: err, variant: "destructive" });
    } else {
      openDialer(row.caller_number);
    }
    if (row.status === "new" || row.status === "assigned") await update(row, "called_back");
  };

  return (
    <PageFrame
      title={t("cc.missed.title")}
      subtitle={t("cc.missed.subtitle")}
      actions={
        <>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">{t("cc.missed.filter_open")}</SelectItem>
              <SelectItem value="all">{t("cc.missed.filter_all")}</SelectItem>
              <SelectItem value="voicemail">{t("cc.missed.filter_voicemail")}</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`cc.missed.status_${s}` as const)}</SelectItem>)}
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
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.refresh")}</Button>
        </>
      }
    >
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

      {!error && !loading && visible.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <h3 className="text-base font-semibold">{t("cc.missed.empty_title")}</h3>
            <p className="max-w-md text-sm text-muted-foreground">{t("cc.missed.empty_desc")}</p>
          </CardContent>
        </Card>
      )}

      {!error && !loading && visible.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>{t("cc.missed.col_caller")}</TableHead>
                  <TableHead>{t("cc.missed.col_time")}</TableHead>
                  <TableHead>{t("cc.history.col_team")}</TableHead>
                  <TableHead>{t("cc.missed.col_attempts")}</TableHead>
                  <TableHead>{t("cc.missed.col_assigned")}</TableHead>
                  <TableHead>{t("cc.agents.col_status")}</TableHead>
                  <TableHead className="text-right">{t("cc.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => {
                  const closed = r.status === "resolved" || r.status === "unresolved";
                  return (
                    <Fragment key={r.id}>
                    <TableRow>
                      <TableCell className="whitespace-nowrap font-mono text-sm">
                        <span className="inline-flex items-center gap-1.5"><PhoneMissed className="h-3.5 w-3.5 text-red-500" />{r.caller_number}</span>
                        {r.voicemail && (
                          <button
                            type="button"
                            onClick={() => setExpanded((e) => ({ ...e, [r.id]: !e[r.id] }))}
                            className="mt-1 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-sans text-[11px] font-medium text-primary"
                            aria-expanded={!!expanded[r.id]}
                          >
                            <Mic className="h-3 w-3" />{t("cc.missed.voicemail")}
                            <ChevronDown className={`h-3 w-3 transition-transform ${expanded[r.id] ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(r.call_started_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{r.team_name || "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums">{r.callback_attempts}</TableCell>
                      <TableCell className="text-sm">{r.assigned_to_name || "—"}</TableCell>
                      <TableCell><Badge variant={STATUS_TONE[r.status]}>{t(`cc.missed.status_${r.status}` as const)}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!closed && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 gap-1.5" disabled={busyId === r.id} onClick={() => callBack(r)}>
                                <PhoneCall className="h-3.5 w-3.5" />{t("cc.missed.call_back")}
                              </Button>
                              {r.status === "new" && (
                                <Button size="sm" variant="ghost" className="h-8 gap-1.5" disabled={busyId === r.id} onClick={() => update(r, "assigned")} title={t("cc.missed.claim_hint")}>
                                  <UserCheck className="h-3.5 w-3.5" />{t("cc.missed.claim")}
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="h-8" disabled={busyId === r.id} onClick={() => update(r, "resolved")}>{t("cc.missed.resolve")}</Button>
                              <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" disabled={busyId === r.id} onClick={() => update(r, "unresolved")}>{t("cc.missed.give_up")}</Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {r.voicemail && expanded[r.id] && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={7}>
                          <VoicemailPanel row={r} vm={r.voicemail} playing={player.isPlaying(r.voicemail.id)} current={player.isCurrent(r.voicemail.id)} onListen={() => listen(r, r.voicemail!)} />
                        </TableCell>
                      </TableRow>
                    )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
      <RecordingPlayerBar track={player.track} playing={player.playing} onPlayingChange={player.setPlaying} onClose={player.close} />
    </PageFrame>
  );
}

/** What the caller said (audio, plus the AI's transcript and summary) — separate from the agents' own notes. */
function VoicemailPanel({ row, vm, playing, current, onListen }: { row: MissedCall; vm: Voicemail; playing: boolean; current: boolean; onListen: () => void }) {
  const { t } = useLanguage();
  const [showTranscript, setShowTranscript] = useState(false);
  const ai = vm.analysis;
  const result = ai?.status === "completed" ? ai.result : null;

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
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />{t("cc.missed.ai_summary")}
        </p>
        {result ? (
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
          <p className="text-muted-foreground">{t("cc.missed.ai_working")}</p>
        ) : ai?.status === "failed" ? (
          <p className="text-muted-foreground">{t("cc.missed.ai_failed")}</p>
        ) : (
          <p className="text-muted-foreground">
            {t("cc.missed.ai_off")}{" "}
            <Link to="/voice/ai-settings" className="font-medium text-primary underline">{t("cc.missed.ai_settings")}</Link>
          </p>
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
