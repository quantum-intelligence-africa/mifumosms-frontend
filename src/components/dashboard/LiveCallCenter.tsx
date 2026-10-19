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

function Stat({ label, value, tone, unit }: { label: string; value: number; tone?: string; unit?: string }) {
  return (
    <div className="min-w-[88px] flex-1">
      <p className={`text-2xl font-bold leading-none tabular-nums ${tone ?? ""}`}>{value}{unit ? <span className="ml-0.5 text-sm font-medium">{unit}</span> : null}</p>
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

  // Nothing happening and nothing to act on: one small line instead of a wall of zeros. Alerts (a queue near full, overdue
  // callbacks) and the setup card never count as "empty", so they are not hidden by a zero call count.
  const idle =
    snap.live_calls.length === 0 && waitingTeams.length === 0 && (snap.waiting_callers ?? []).length === 0 &&
    !snap.teams.some((x) => x.queue_near_full) &&
    [snap.agents_online, snap.by_status.available, snap.by_status.busy, snap.by_status.away, snap.calls_waiting, snap.ai_calls,
      snap.outgoing_active, snap.open_missed, snap.overdue_callbacks, snap.new_voicemails].every((v) => !v);
  if (idle) {
    return (
      <div className="space-y-2.5">
        {isCallCenterAdmin(user) && <SetupCard />}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("cc.board.title")}</p>
            <p className="text-xs text-muted-foreground">{t("cc.workspace.no_active_calls")}</p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs ${cc.socketState === "ready" ? "text-green-600" : "text-amber-600"}`}>
            <span className={`h-2 w-2 rounded-full ${cc.socketState === "ready" ? "bg-green-500" : "bg-amber-400"}`} />
            {cc.socketState === "ready" ? t("cc.workspace.live") : t("cc.board.polling")}
          </span>
        </div>
      </div>
    );
  }

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.board.agents_online")}</p>
              <div className="flex flex-wrap gap-3">
                <Stat label={t("cc.board.agents_online")} value={snap.agents_online} />
                <Stat label={t("cc.status.available")} value={snap.by_status.available} tone="text-green-600" />
                <Stat label={t("cc.status.busy")} value={snap.by_status.busy} tone="text-red-600" />
                <Stat label={t("cc.status.away")} value={snap.by_status.away} tone="text-amber-600" />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.board.live_calls")}</p>
              <div className="flex flex-wrap gap-3">
                <Stat label={t("cc.board.calls_waiting")} value={snap.calls_waiting} tone={snap.calls_waiting > 0 ? "text-red-600" : undefined} />
                <Stat label={t("cc.board.avg_wait")} value={snap.avg_wait_seconds ?? 0} unit="s" />
                <Stat label={t("cc.board.longest_wait")} value={snap.longest_wait_seconds ?? 0} unit="s" tone={(snap.longest_wait_seconds ?? 0) >= 60 ? "text-red-600" : undefined} />
                <Stat label={t("cc.board.ai_calls")} value={snap.ai_calls ?? 0} />
                <Stat label={t("cc.board.outgoing_active")} value={snap.outgoing_active ?? 0} />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t("cc.board.callbacks_waiting")}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/call-center/missed" className="min-w-[88px] flex-1 rounded-md hover:bg-accent/40" title={t("cc.board.follow_up", { n: snap.open_missed })}>
                  <Stat label={t("cc.board.callbacks_waiting")} value={snap.open_missed} tone={snap.open_missed > 0 ? "text-red-600" : undefined} />
                </Link>
                <Link to="/call-center/missed?focus=overdue" className="min-w-[88px] flex-1 rounded-md hover:bg-accent/40">
                  <Stat label={t("cc.board.overdue_callbacks")} value={snap.overdue_callbacks ?? 0} tone={(snap.overdue_callbacks ?? 0) > 0 ? "text-red-600" : undefined} />
                </Link>
                <Link to="/call-center/missed?focus=voicemail" className="min-w-[88px] flex-1 rounded-md hover:bg-accent/40">
                  <Stat label={t("cc.board.new_voicemails")} value={snap.new_voicemails ?? 0} />
                </Link>
              </div>
            </div>
          </div>

          {(snap.teams.some((x) => x.queue_near_full) || (snap.overdue_callbacks ?? 0) > 0) && (
            <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
              {snap.teams.filter((x) => x.queue_near_full).map((x) => t("cc.board.queue_near_full", { team: x.name, waiting: x.waiting, max: x.queue_max_callers ?? 0 })).join(" · ")}
              {snap.teams.some((x) => x.queue_near_full) && (snap.overdue_callbacks ?? 0) > 0 ? " · " : ""}
              {(snap.overdue_callbacks ?? 0) > 0 ? t("cc.board.callbacks_overdue_warn", { n: snap.overdue_callbacks ?? 0 }) : ""}
            </div>
          )}

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
                {(snap.waiting_callers ?? []).map((w) => (
                  <div key={w.call_id} className="flex items-center justify-between gap-2 rounded-md bg-red-50 px-2 py-1 text-xs">
                    <span className="font-mono">#{w.position} {w.from_number}</span>
                    <span className="text-muted-foreground">{w.team}</span>
                    <b className="tabular-nums text-red-700">{formatDuration(w.waited_seconds)}</b>
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
