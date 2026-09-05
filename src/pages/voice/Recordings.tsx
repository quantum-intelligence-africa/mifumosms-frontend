import { useCallback, useEffect, useState } from "react";
import { Voicemail, AlertCircle, RefreshCw, PhoneIncoming, PhoneOutgoing, Search } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

interface RecordingCall {
  id: string;
  direction: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  status: string;
  provider_status: string;
  started_at: string;
  agent: AgentSummary | null;
}

interface Recording {
  id: string;
  call: RecordingCall;
  storage_backend: string;
  storage_path: string;
  duration_seconds: number | null;
  size_bytes: number | null;
  mime_type: string;
  created_at: string;
}

/** The person on the other end: the caller for inbound, the customer for outbound. */
const otherParty = (call: RecordingCall) => (call.direction === "outbound" ? call.to_number : call.from_number) || "—";
const ourNumber = (call: RecordingCall) => (call.direction === "outbound" ? call.from_number : call.to_number) || "—";

export default function Recordings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [agentId, setAgentId] = useState("all");
  const player = useRecordingPlayer();

  useEffect(() => {
    voiceApi.get<AgentSummary[]>("/voice/agents/").then((res) => res.success && res.data && setAgents(res.data));
  }, []);

  // Search as you type, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchRecordings = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(pageNum) });
      if (search) params.set("q", search);
      if (agentId !== "all") params.set("agent", agentId);
      const res = await voiceApi.get<PaginatedResponse<Recording>>(`/voice/recordings/?${params}`);
      if (res.success && res.data) {
        setRecordings((prev) => (append ? [...prev, ...res.data!.results] : res.data!.results));
        setCount(res.data.count);
        setHasNext(Boolean(res.data.next));
        setPage(pageNum);
      } else {
        setError(res.error || "Failed to load recordings");
      }
      setIsLoading(false);
      setIsLoadingMore(false);
    },
    [search, agentId],
  );

  useEffect(() => {
    fetchRecordings(1, false);
  }, [fetchRecordings]);

  // The global dialer (sidebar "Piga simu") announces finished calls so this
  // list picks them up without a manual refresh.
  useEffect(() => {
    const refresh = () => fetchRecordings(1, false);
    window.addEventListener(CALL_ENDED_EVENT, refresh);
    return () => window.removeEventListener(CALL_ENDED_EVENT, refresh);
  }, [fetchRecordings]);

  const play = (rec: Recording) => {
    const when = new Date(rec.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
    player.toggle({
      id: rec.id,
      url: rec.storage_path,
      title: otherParty(rec.call),
      subtitle: [ourNumber(rec.call), rec.call.agent?.name, when].filter(Boolean).join(" · "),
      direction: rec.call.direction,
      durationSeconds: rec.duration_seconds,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className={cn("flex-1 overflow-y-auto overflow-x-hidden p-3 lg:p-4", player.track && "pb-28")}>
          <div className="mx-auto max-w-6xl space-y-3.5">
            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Recordings</h1>
                <p className="mt-0.5 text-sm text-foreground/60">
                  {isLoading ? "Loading…" : `${count} recording${count === 1 ? "" : "s"} in storage`}
                </p>
              </div>
            </header>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search callers, numbers, agents…"
                  className="h-10 pl-9"
                  aria-label="Search recordings"
                />
              </div>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger className="h-10 w-full sm:w-44" aria-label="Agent">
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
            </div>

            {error && (
              <Card>
                <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => fetchRecordings(1, false)}>
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

            {!error && !isLoading && recordings.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
                  <Voicemail className="h-10 w-10 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">
                    {search || agentId !== "all" ? "Nothing matches" : "No recordings yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {search || agentId !== "all"
                      ? "Try a different number or agent."
                      : "Recordings show up here once a call is recorded or a caller leaves a voicemail."}
                  </p>
                </CardContent>
              </Card>
            )}

            {!error && !isLoading && recordings.length > 0 && (
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="w-10" />
                        <TableHead>Caller</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Stored</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recordings.map((rec) => {
                        const current = player.isCurrent(rec.id);
                        const playing = player.isPlaying(rec.id);
                        const Icon = rec.call.direction === "outbound" ? PhoneOutgoing : PhoneIncoming;
                        return (
                          <TableRow
                            key={rec.id}
                            className={cn("cursor-pointer", current && "bg-primary/5 hover:bg-primary/5")}
                            onClick={() => play(rec)}
                          >
                            <TableCell className="pr-0">
                              <Icon className={cn("h-3.5 w-3.5", rec.call.direction === "outbound" ? "text-blue-600" : "text-emerald-600")} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-sm text-foreground">{otherParty(rec.call)}</TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-sm text-foreground/80">{ourNumber(rec.call)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <AgentChip name={rec.call.agent?.name} department={rec.call.agent?.department} />
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-foreground">{formatLength(rec.duration_seconds)}</TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-sm tabular-nums text-muted-foreground">{formatSize(rec.size_bytes)}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {new Date(rec.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end">
                                <PlayButton active={current} playing={playing} onClick={() => play(rec)} />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {!error && !isLoading && recordings.length > 0 && hasNext && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={() => fetchRecordings(page + 1, true)} disabled={isLoadingMore}>
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
