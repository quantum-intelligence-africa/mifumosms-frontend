// "Right now" on the home dashboard, for the people who run the call center: who is available, what is ringing or waiting,
// and how many missed calls still need a callback. Replaces the separate live-board page: one dashboard, one set of numbers.
// A socket event patches nothing here; the snapshot is simply fetched again every few seconds, so it can never drift.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useLanguage } from "@/hooks/useLanguage";
import { isCallCenterAdmin } from "@/utils/roleUtils";
import { formatDuration } from "@/components/callcenter/callUtils";
import { SetupCard } from "@/components/callcenter/SetupCard";
import { callCenterApi, type LiveSnapshot } from "@/services/callCenterApi";

const POLL_MS = 15_000;

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="min-w-[88px] flex-1">
      <p className={`text-2xl font-bold leading-none tabular-nums ${tone ?? ""}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function LiveCallCenter() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const cc = useCallCenter();
  const [snap, setSnap] = useState<LiveSnapshot | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    const res = await callCenterApi.live();
    if (res.success && res.data) {
      setSnap(res.data);
      setFailed(false);
    } else setFailed(true);
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);
  // A call starting, ending or being missed refreshes straight away instead of waiting for the next tick.
  useEffect(() => cc.subscribe((e) => (e.event === "missed_call" || e.event === "agent_status") && void load()), [cc, load]);

  if (!snap) return failed ? null : <Skeleton className="h-28 rounded-xl" />;
  const waitingTeams = snap.teams.filter((x) => x.waiting > 0);

  return (
    <div className="space-y-2.5">
      {isCallCenterAdmin(user) && <SetupCard />}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">{t("cc.board.title")}</CardTitle>
          <span className={`inline-flex items-center gap-1.5 text-xs ${cc.socketState === "ready" ? "text-green-600" : "text-amber-600"}`}>
            <span className={`h-2 w-2 rounded-full ${cc.socketState === "ready" ? "bg-green-500" : "bg-amber-400"}`} />
            {cc.socketState === "ready" ? t("cc.workspace.live") : t("cc.board.polling")}
          </span>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-4">
            <Stat label={t("cc.board.agents_online")} value={snap.agents_online} />
            <Stat label={t("cc.status.available")} value={snap.by_status.available} tone="text-green-600" />
            <Stat label={t("cc.status.busy")} value={snap.by_status.busy} tone="text-red-600" />
            <Stat label={t("cc.status.away")} value={snap.by_status.away} tone="text-amber-600" />
            <Stat label={t("cc.board.calls_waiting")} value={snap.calls_waiting} tone={snap.calls_waiting > 0 ? "text-red-600" : undefined} />
            <Link to="/call-center/missed" className="min-w-[88px] flex-1 rounded-md hover:bg-accent/40" title={t("cc.board.follow_up", { n: snap.open_missed })}>
              <Stat label={t("cc.board.callbacks_waiting")} value={snap.open_missed} tone={snap.open_missed > 0 ? "text-red-600" : undefined} />
            </Link>
          </div>

          {(snap.live_calls.length > 0 || waitingTeams.length > 0) && (
            <div className="grid gap-3 border-t border-border pt-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.board.live_calls")}</p>
                {snap.live_calls.length === 0 && <p className="text-sm text-muted-foreground">{t("cc.workspace.no_active_calls")}</p>}
                {snap.live_calls.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-mono">{c.direction === "outbound" ? c.to_number : c.from_number}</span>
                    <span className="truncate text-xs text-muted-foreground">{[c.team, c.agent].filter(Boolean).join(" · ")}</span>
                    <Badge variant="secondary" className="shrink-0 capitalize">{c.status.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.board.teams")}</p>
                {waitingTeams.length === 0 && <p className="text-sm text-muted-foreground">{t("cc.board.no_teams")}</p>}
                {waitingTeams.map((x) => (
                  <div key={x.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{x.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t("cc.board.waiting")}: <b className="text-red-600">{x.waiting}</b> ({t("cc.board.longest")} {formatDuration(x.longest_wait_seconds)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
