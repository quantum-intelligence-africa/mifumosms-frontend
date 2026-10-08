// Call history for the call center. An agent sees only the calls they handled;
// a supervisor or admin sees the whole organization's — enforced by the
// backend, so the filters below only narrow what the server already allows.
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, Mic, NotebookPen, PhoneIncoming, PhoneOutgoing, RefreshCw } from "lucide-react";
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
import { formatDuration } from "@/components/callcenter/callUtils";
import { callCenterApi, type CCAgent, type CallNote, type CallRow, type Team } from "@/services/callCenterApi";

type CallState = "answered" | "missed" | "failed" | "live";

/** One word for what happened, from the fields the server gives us. */
function callState(c: CallRow): CallState {
  if (c.status === "ringing" || c.status === "in_progress") return "live";
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
  const [direction, setDirection] = useState("all");
  const [team, setTeam] = useState("all");
  const [agent, setAgent] = useState("all");
  const [days, setDays] = useState("30");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<CCAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notesFor, setNotesFor] = useState<CallRow | null>(null);
  const [notes, setNotes] = useState<CallNote[] | null>(null);

  useEffect(() => {
    if (!supervisor) return;
    callCenterApi.teams.list().then((r) => r.success && r.data && setTeams(r.data));
    callCenterApi.agents.list().then((r) => r.success && r.data && setAgents(r.data));
  }, [supervisor]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => setPage(1), [direction, team, agent, days, query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await callCenterApi.calls({
      direction: direction === "all" ? undefined : direction,
      team: team === "all" ? undefined : team,
      agent: agent === "all" ? undefined : agent,
      days: days === "all" ? undefined : Number(days),
      q: query || undefined,
      page,
    });
    if (res.success && res.data) {
      setRows(res.data.results);
      setCount(res.data.count);
    } else {
      setError(res.error || t("cc.history.load_failed"));
    }
    setLoading(false);
  }, [direction, team, agent, days, query, page, t]);

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

  const pageSize = 20;
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
                      <TableCell className="text-sm">{c.agent?.name ?? "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{new Date(c.started_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm tabular-nums">{c.duration_seconds != null ? formatDuration(c.duration_seconds) : "—"}</TableCell>
                      <TableCell><Badge variant={STATE_TONE[state]}>{t(`cc.history.state_${state}` as const)}</Badge></TableCell>
                      <TableCell>{c.recording ? <Mic className="h-4 w-4 text-muted-foreground" aria-label={t("cc.history.has_recording")} /> : "—"}</TableCell>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>{t("cc.history.showing", { count })}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={t("cc.history.prev")}><ChevronLeft className="h-4 w-4" /></Button>
              <span>{page} / {pages}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label={t("cc.history.next")}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </Card>
      )}

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
                  <p className="text-xs text-muted-foreground">{n.agent_name} · {new Date(n.created_at).toLocaleString()}</p>
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
