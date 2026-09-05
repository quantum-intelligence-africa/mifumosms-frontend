// Calls — every real call the business's numbers handled, laid out like a
// call-centre console: who called, which agent took it, when, how long, and
// what the AI made of it. One play button per row; playback lives in the
// bar at the bottom of the page.
import { useCallback, useEffect, useState, Fragment } from "react";
import { ChevronDown, ChevronUp, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, AlertCircle, RefreshCw, Search } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { voiceApi } from "@/services/voiceApi";
import { CALL_ENDED_EVENT } from "@/contexts/DialerContext";
import {
  AgentChip,
  PlayButton,
  RecordingPlayerBar,
  formatLength,
  formatSize,
  useRecordingPlayer,
} from "@/components/voice/RecordingPlayerBar";
import { cn } from "@/lib/utils";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface AgentSummary {
  id: string;
  name: string;
  phone_number: string;
  department: string;
}

interface RowRecording {
  id: string;
  storage_path: string;
  duration_seconds: number | null;
  size_bytes: number | null;
  count: number;
}

interface RowAnalysis {
  status: "pending" | "processing" | "completed" | "failed";
  sentiment: string;
  summary: string;
  intent: string;
}

interface CallSummary {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  agent_number: string;
  agent: AgentSummary | null;
  status: string;
  provider_status: string;
  is_simulated: boolean;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  recording: RowRecording | null;
  analysis: RowAnalysis | null;
}

interface AnalysisResult {
  transcript: string;
  sentiment: string;
  detected_intent: string;
  summary: string;
}

interface AnalysisJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string;
  result: AnalysisResult | null;
}

interface CallRecordingItem {
  id: string;
  storage_path: string;
  duration_seconds: number | null;
  size_bytes: number | null;
  created_at: string;
  analysis: AnalysisJob | null;
}

interface CallDetail extends CallSummary {
  execution_log: Array<{ node_id: string; node_type: string; message: string }>;
  recordings: CallRecordingItem[];
}

type Tab = "all" | "inbound" | "outbound" | "missed";
type Range = "7" | "30" | "90" | "all";

const TABS: Array<[Tab, string]> = [
  ["all", "All"],
  ["inbound", "Inbound"],
  ["outbound", "Outbound"],
  ["missed", "Missed"],
];
const RANGES: Array<[Range, string]> = [
  ["7", "7d"],
  ["30", "30d"],
  ["90", "90d"],
  ["all", "All"],
];

const MISSED = new Set(["noanswer", "no_answer", "notanswered", "busy", "aborted", "failed", "rejected", "cancelled", "canceled"]);
const isMissed = (call: Pick<CallSummary, "status" | "provider_status" | "duration_seconds">) =>
  call.status === "failed" || MISSED.has((call.provider_status || "").toLowerCase()) || (call.status === "completed" && !call.duration_seconds);

/** The person on the other end: the caller for inbound, the customer for outbound. */
const otherParty = (call: Pick<CallSummary, "direction" | "from_number" | "to_number">) =>
  (call.direction === "outbound" ? call.to_number : call.from_number) || "—";

const sentimentVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  const v = s.toLowerCase();
  if (v === "positive") return "default";
  if (v === "negative") return "destructive";
  if (v) return "secondary";
  return "outline";
};

const outcomeLabel = (call: CallSummary) => {
  const s = (call.provider_status || call.status || "").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function CallHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, CallDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [range, setRange] = useState<Range>("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [agentId, setAgentId] = useState("all");
  const [sentiment, setSentiment] = useState("any");
  const player = useRecordingPlayer();

  useEffect(() => {
    voiceApi.get<AgentSummary[]>("/voice/agents/").then((res) => res.success && res.data && setAgents(res.data));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchCalls = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(pageNum) });
      if (tab === "inbound" || tab === "outbound") params.set("direction", tab);
      if (tab === "missed") params.set("missed", "true");
      if (range !== "all") params.set("days", range);
      if (search) params.set("q", search);
      if (agentId !== "all") params.set("agent", agentId);
      if (sentiment !== "any") params.set("sentiment", sentiment);
      const res = await voiceApi.get<PaginatedResponse<CallSummary>>(`/voice/calls/?${params}`);
      if (res.success && res.data) {
        setCalls((prev) => (append ? [...prev, ...res.data!.results] : res.data!.results));
        setCount(res.data.count);
        setHasNext(Boolean(res.data.next));
        setPage(pageNum);
      } else {
        setError(res.error || "Failed to load call history");
      }
      setIsLoading(false);
      setIsLoadingMore(false);
    },
    [tab, range, search, agentId, sentiment],
  );

  useEffect(() => {
    fetchCalls(1, false);
  }, [fetchCalls]);

  // The global dialer (sidebar "Piga simu") announces finished calls so this
  // list picks them up without a manual refresh.
  useEffect(() => {
    const refresh = () => fetchCalls(1, false);
    window.addEventListener(CALL_ENDED_EVENT, refresh);
    return () => window.removeEventListener(CALL_ENDED_EVENT, refresh);
  }, [fetchCalls]);

  const toggleExpand = async (callId: string) => {
    if (expandedId === callId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(callId);
    if (!details[callId]) {
      setDetailLoading(callId);
      const res = await voiceApi.get<CallDetail>(`/voice/calls/${callId}/`);
      if (res.success && res.data) setDetails((prev) => ({ ...prev, [callId]: res.data as CallDetail }));
      setDetailLoading(null);
    }
  };

  const playCall = (call: CallSummary, rec: { id: string; storage_path: string; duration_seconds: number | null }) => {
    const when = new Date(call.started_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    player.toggle({
      id: rec.id,
      url: rec.storage_path,
      title: otherParty(call),
      subtitle: [call.agent?.name, when].filter(Boolean).join(" · "),
      direction: call.direction,
      durationSeconds: rec.duration_seconds,
    });
  };

  const filtered = search || tab !== "all" || range !== "all" || agentId !== "all" || sentiment !== "any";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn("flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4", player.track && "pb-28")}>
          <div className="mx-auto max-w-6xl space-y-3">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Calls</h1>
                <p className="mt-0.5 text-sm text-foreground/60">
                  {isLoading ? "Loading…" : `${count} call${count === 1 ? "" : "s"}, recorded and searchable`}
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Time range">
                {RANGES.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRange(value)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                      range === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </header>

            <div className="inline-flex rounded-lg bg-muted p-0.5" role="tablist">
              {TABS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={cn(
                    "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                    tab === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search callers, topics, transcripts…"
                  className="h-10 pl-9"
                  aria-label="Search calls"
                />
              </div>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Agent">
                  <SelectValue placeholder="All agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All agents</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sentiment} onValueChange={setSentiment}>
                <SelectTrigger className="h-10 w-full sm:w-40" aria-label="Sentiment">
                  <SelectValue placeholder="Any sentiment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any sentiment</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => fetchCalls(1, false)}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {!error && isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            )}

            {!error && !isLoading && calls.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                  <PhoneCall className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">{filtered ? "No calls match" : "No calls yet"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {filtered ? "Try another filter or a wider time range." : "Real inbound or outbound calls will show up here."}
                  </p>
                </CardContent>
              </Card>
            )}

            {!error && !isLoading && calls.length > 0 && (
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-12" />
                        <TableHead>Caller</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Length</TableHead>
                        <TableHead className="min-w-[260px]">AI Summary</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calls.map((call) => {
                        const expanded = expandedId === call.id;
                        const detail = details[call.id];
                        const missed = isMissed(call);
                        const rec = call.recording;
                        const started = new Date(call.started_at);
                        const Icon = missed ? PhoneMissed : call.direction === "outbound" ? PhoneOutgoing : PhoneIncoming;
                        const iconTone = missed ? "text-destructive" : call.direction === "outbound" ? "text-blue-600" : "text-emerald-600";
                        return (
                          <Fragment key={call.id}>
                            <TableRow
                              className={cn("cursor-pointer", rec && player.isCurrent(rec.id) && "bg-primary/5 hover:bg-primary/5")}
                              onClick={() => toggleExpand(call.id)}
                            >
                              <TableCell className="pr-0">
                                {rec ? (
                                  <PlayButton active={player.isCurrent(rec.id)} playing={player.isPlaying(rec.id)} onClick={() => playCall(call, rec)} />
                                ) : (
                                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground/50" title="No recording">
                                    <Icon className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center gap-1.5 font-mono text-sm font-semibold text-foreground">
                                  <Icon className={cn("h-3.5 w-3.5 shrink-0", iconTone)} />
                                  {otherParty(call)}
                                </div>
                                <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
                                  {call.analysis?.intent || (missed ? outcomeLabel(call) : call.direction === "outbound" ? "Outbound call" : "Inbound call")}
                                </p>
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <AgentChip name={call.agent?.name} department={call.agent?.department} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <p className="font-mono text-sm text-foreground">{started.toLocaleDateString([], { month: "short", day: "2-digit" })}</p>
                                <p className="font-mono text-xs text-muted-foreground">{started.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                              </TableCell>
                              <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-foreground">{formatLength(call.duration_seconds)}</TableCell>
                              <TableCell>
                                {call.analysis?.summary ? (
                                  <p className="line-clamp-2 max-w-md text-sm text-foreground/80" title={call.analysis.summary}>
                                    {call.analysis.summary}
                                  </p>
                                ) : call.analysis?.status === "pending" || call.analysis?.status === "processing" ? (
                                  <span className="text-xs text-muted-foreground">Inaendelea…</span>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {call.analysis?.sentiment ? (
                                  <Badge variant={sentimentVariant(call.analysis.sentiment)} className="capitalize">
                                    {call.analysis.sentiment}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                              </TableCell>
                            </TableRow>

                            {expanded && (
                              <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={8} className="bg-muted/30 p-4">
                                  {detailLoading === call.id && <Skeleton className="h-20" />}
                                  {detail && (
                                    <div className="grid gap-4 lg:grid-cols-2">
                                      <div className="space-y-2">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</p>
                                        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                                          <dt className="text-muted-foreground">From</dt>
                                          <dd className="font-mono text-foreground">{detail.from_number || "—"}</dd>
                                          <dt className="text-muted-foreground">To</dt>
                                          <dd className="font-mono text-foreground">{detail.to_number || "—"}</dd>
                                          <dt className="text-muted-foreground">Outcome</dt>
                                          <dd>
                                            <Badge variant={missed ? "destructive" : "default"}>{outcomeLabel(call)}</Badge>
                                          </dd>
                                          {detail.agent && (
                                            <>
                                              <dt className="text-muted-foreground">Agent</dt>
                                              <dd className="text-foreground">
                                                {detail.agent.department && detail.agent.department !== detail.agent.name
                                                  ? `${detail.agent.name} · ${detail.agent.department}`
                                                  : detail.agent.name}
                                              </dd>
                                            </>
                                          )}
                                          {detail.recordings[0] && (
                                            <>
                                              <dt className="text-muted-foreground">Recording</dt>
                                              <dd className="text-foreground">
                                                {formatSize(detail.recordings[0].size_bytes)} · stored{" "}
                                                {new Date(detail.recordings[0].created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                              </dd>
                                            </>
                                          )}
                                        </dl>

                                        {detail.recordings.length === 0 && (
                                          <p className="pt-2 text-xs text-muted-foreground">No recording for this call.</p>
                                        )}

                                        {/* The row's own play button already covers the first (usual) recording;
                                            list only additional ones here, for the rare multi-recording call. */}
                                        {detail.recordings.length > 1 && (
                                          <div className="space-y-1.5 pt-2">
                                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                              Other recordings on this call
                                            </p>
                                            {detail.recordings.slice(1).map((r) => (
                                              <div key={r.id} className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                                                <PlayButton active={player.isCurrent(r.id)} playing={player.isPlaying(r.id)} onClick={() => playCall(call, r)} />
                                                <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                                                  <span className="font-mono text-foreground">{formatLength(r.duration_seconds)}</span>
                                                  {" · "}
                                                  {formatSize(r.size_bytes)}
                                                  {" · "}
                                                  {new Date(r.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                                </div>
                                                {r.analysis?.result?.sentiment && (
                                                  <Badge variant={sentimentVariant(r.analysis.result.sentiment)} className="capitalize">
                                                    {r.analysis.result.sentiment}
                                                  </Badge>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {detail.recordings.some((r) => r.analysis?.result?.transcript) && (
                                          <details className="pt-1">
                                            <summary className="cursor-pointer text-xs font-medium text-primary">Transcript</summary>
                                            <p className="mt-1 whitespace-pre-wrap rounded-md bg-background p-2 text-xs text-foreground/80">
                                              {detail.recordings.find((r) => r.analysis?.result?.transcript)?.analysis?.result?.transcript}
                                            </p>
                                          </details>
                                        )}
                                      </div>

                                      <div className="space-y-1">
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Journey</p>
                                        {detail.execution_log.length > 0 ? (
                                          <ol className="max-h-56 space-y-1 overflow-y-auto rounded-md bg-background p-2">
                                            {detail.execution_log.map((entry, i) => (
                                              <li key={i} className="text-xs text-muted-foreground">
                                                <span className="mr-1.5 inline-block w-4 text-right font-mono text-foreground/40">{i + 1}</span>
                                                {entry.message}
                                              </li>
                                            ))}
                                          </ol>
                                        ) : (
                                          <p className="text-xs text-muted-foreground">—</p>
                                        )}
                                      </div>
                                    </div>
                                  )}
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

            {!error && !isLoading && calls.length > 0 && hasNext && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={() => fetchCalls(page + 1, true)} disabled={isLoadingMore}>
                  {isLoadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      <RecordingPlayerBar track={player.track} playing={player.playing} onPlayingChange={player.setPlaying} onClose={player.close} />
    </div>
  );
}
