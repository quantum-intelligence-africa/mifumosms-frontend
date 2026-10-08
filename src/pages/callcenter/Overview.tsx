// Live call-center board for supervisors and owners/admins, plus the setup
// checklist that walks an organization from "nothing" to "taking calls".
//
// Real-time: socket events patch the board immediately; a full snapshot is
// re-fetched every 30 s and after status changes, so a missed event can never
// leave the board wrong for long.
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, PhoneCall, RefreshCw, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useLanguage } from "@/hooks/useLanguage";
import { isCallCenterAdmin } from "@/utils/roleUtils";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { ccKey } from "@/i18n/callCenter";
import { SetupWizard } from "@/components/callcenter/SetupWizard";
import { StatusDot, StatusLabel } from "@/components/callcenter/StatusDot";
import { formatDuration } from "@/components/callcenter/callUtils";
import { AGENT_STATUSES, callCenterApi, type AgentStatus, type CallCenterSettings, type LiveSnapshot } from "@/services/callCenterApi";

const REFRESH_MS = 30_000;

function minutesSince(iso: string | null, now: number): string {
  if (!iso) return "—";
  const secs = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  return secs < 60 ? `${secs}s` : formatDuration(secs);
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className={`text-3xl font-bold leading-none ${tone ?? "text-foreground"}`}>{value}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

// ── setup card ──────────────────────────────────────────────────────────────

/** Progress toward "taking calls", from the server's own readiness check, and the way into the wizard. */
function SetupCard() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<CallCenterSettings | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await callCenterApi.settings.get();
    if (res.success && res.data) setSettings(res.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!settings) return null;
  const r = settings.readiness;
  const checks = [r.number, r.team, r.staffed, r.routing];
  const percent = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const live = settings.is_live && r.ready;

  return (
    <>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Rocket className="h-4 w-4 text-primary" />
              {live ? t("cc.wizard.is_live") : t("cc.setup.title")}
            </p>
            {!live && (
              <div className="mt-2 flex items-center gap-3">
                <Progress value={percent} className="h-1.5 max-w-xs" />
                <span className="text-xs text-muted-foreground">{percent}%</span>
              </div>
            )}
            {!live && r.missing.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {t("cc.wizard.still_needed")}: {r.missing.map((m) => t(ccKey(`cc.wizard.check_${m}`))).join(" · ")}
              </p>
            )}
          </div>
          <Button variant={live ? "outline" : "default"} size="sm" onClick={() => setOpen(true)}>
            {live ? t("cc.wizard.review") : settings.wizard_step > 1 ? t("cc.wizard.continue") : t("cc.wizard.start")}
          </Button>
        </CardContent>
      </Card>
      <SetupWizard open={open} onOpenChange={(o) => { setOpen(o); if (!o) void load(); }} onChanged={load} />
    </>
  );
}

// ── live board ──────────────────────────────────────────────────────────────

export default function Overview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const cc = useCallCenter();
  const admin = isCallCenterAdmin(user);

  const [snap, setSnap] = useState<LiveSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const res = await callCenterApi.live();
    if (res.success && res.data) {
      setSnap(res.data);
      setError(null);
    } else {
      setError(res.error || t("cc.board.load_failed"));
    }
  }, [t]);

  useEffect(() => {
    void load();
    const poll = setInterval(load, REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load]);

  useEffect(
    () =>
      cc.subscribe((evt) => {
        const d = evt.data as Record<string, unknown>;
        if (evt.event === "agent_status") {
          setSnap((s) => {
            if (!s) return s;
            const status = String(d.status) as AgentStatus;
            const agents = s.agents.map((a) =>
              a.id === d.id ? { ...a, status, status_changed_at: String(d.status_changed_at ?? a.status_changed_at ?? ""), on_call: !!d.on_call } : a,
            );
            const by_status = Object.fromEntries(AGENT_STATUSES.map((k) => [k, 0])) as Record<AgentStatus, number>;
            agents.forEach((a) => (by_status[a.status] += 1));
            return { ...s, agents, by_status, agents_online: agents.length - by_status.offline };
          });
          // Team headcounts aren't in this event; re-pull shortly (debounced).
          if (debounce.current) clearTimeout(debounce.current);
          debounce.current = setTimeout(load, 800);
        } else if (evt.event === "call_ringing") {
          const team = d.team as { name?: string } | undefined;
          const agents = (d.agents as Array<{ name: string }> | undefined) ?? [];
          setSnap((s) =>
            s && !s.live_calls.some((c) => c.id === d.call_id)
              ? {
                  ...s,
                  live_calls: [
                    {
                      id: String(d.call_id),
                      from_number: String(d.from_number ?? ""),
                      to_number: String(d.to_number ?? ""),
                      direction: "inbound",
                      status: "ringing",
                      started_at: String(d.started_at ?? new Date().toISOString()),
                      team: team?.name ?? "",
                      agent: agents.map((a) => a.name).join(", "),
                    },
                    ...s.live_calls,
                  ],
                }
              : s,
          );
        } else if (evt.event === "call_ended") {
          setSnap((s) => (s ? { ...s, live_calls: s.live_calls.filter((c) => c.id !== d.call_id) } : s));
        } else if (evt.event === "queue_update") {
          // Someone joined or left a team's queue: patch that team and the total.
          setSnap((s) => {
            if (!s) return s;
            const teams = s.teams.map((x) =>
              x.id === d.team_id ? { ...x, waiting: Number(d.waiting ?? 0), longest_wait_seconds: Number(d.longest_wait_seconds ?? 0) } : x,
            );
            return { ...s, teams, calls_waiting: teams.reduce((n, x) => n + x.waiting, 0) };
          });
        } else if (evt.event === "missed_call") {
          void load();
        }
      }),
    [cc, load],
  );

  useEffect(() => () => {
    if (debounce.current) clearTimeout(debounce.current);
  }, []);

  const live = cc.socketState === "ready";

  return (
    <PageFrame
      title={t("cc.board.title")}
      subtitle={t("cc.board.subtitle")}
      actions={
        <>
          <span className={`inline-flex items-center gap-1.5 text-xs ${live ? "text-green-600" : "text-amber-600"}`}>
            <span className={`h-2 w-2 rounded-full ${live ? "bg-green-500" : "bg-amber-400"}`} />
            {live ? t("cc.workspace.live") : t("cc.workspace.reconnecting")}
          </span>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />{t("common.refresh")}</Button>
        </>
      }
    >
      {admin && <SetupCard />}

      {error && !snap && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={load}>{t("common.try_again")}</Button>
          </CardContent>
        </Card>
      )}

      {!snap && !error && (
        <div className="grid gap-3 sm:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      )}

      {snap && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Kpi label={t("cc.board.agents_online")} value={snap.agents_online} />
            <Kpi label={t("cc.status.available")} value={snap.by_status.available} tone="text-green-600" />
            <Kpi label={t("cc.status.busy")} value={snap.by_status.busy} tone="text-red-600" />
            <Kpi label={t("cc.status.away")} value={snap.by_status.away} tone="text-amber-600" />
            <Kpi label={t("cc.board.calls_waiting")} value={snap.calls_waiting} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t("cc.board.teams")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {snap.teams.length === 0 && <p className="text-sm text-muted-foreground">{t("cc.board.no_teams")}</p>}
                {snap.teams.map((team) => (
                  <div key={team.team_id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-muted-foreground" />{team.name}</span>
                    <span className="flex flex-wrap justify-end gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      <span>
                        {t("cc.board.waiting")}: <b className={team.waiting > 0 ? "text-red-600" : "text-foreground"}>{team.waiting}</b>
                        {team.waiting > 0 && ` (${t("cc.board.longest")} ${formatDuration(team.longest_wait_seconds)})`}
                      </span>
                      <span>{t("cc.status.available")}: <b className="text-green-600">{team.available}</b></span>
                      <span>{t("cc.workspace.agents_online")}: <b className="text-foreground">{team.online}/{team.total}</b></span>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t("cc.board.live_calls")}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {snap.live_calls.length === 0 && <p className="text-sm text-muted-foreground">{t("cc.workspace.no_active_calls")}</p>}
                {snap.live_calls.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      {c.status === "ringing" ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-500" /> : <PhoneCall className="h-4 w-4 shrink-0 text-green-600" />}
                      <span className="truncate font-mono">{c.from_number}</span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {[c.team, c.agent].filter(Boolean).join(" · ") || t(`cc.board.call_${c.status === "ringing" ? "ringing" : "active"}` as const)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden p-0">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t("cc.board.agents")}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-muted/50 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2 font-medium">{t("cc.agents.col_agent")}</th>
                    <th className="px-4 py-2 font-medium">{t("cc.agents.col_status")}</th>
                    <th className="px-4 py-2 font-medium">{t("cc.board.in_status")}</th>
                    <th className="px-4 py-2 font-medium">{t("cc.agents.col_mode")}</th>
                    <th className="px-4 py-2 font-medium">{t("cc.agents.col_extension")}</th>
                  </tr>
                </thead>
                <tbody>
                  {snap.agents.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">{t("cc.agents.empty_title")}</td></tr>
                  )}
                  {[...snap.agents]
                    .sort((a, b) => AGENT_STATUSES.indexOf(a.status) - AGENT_STATUSES.indexOf(b.status) || a.name.localeCompare(b.name))
                    .map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="px-4 py-2 font-medium">{a.name}</td>
                        <td className="px-4 py-2"><StatusLabel status={a.status} /></td>
                        <td className="px-4 py-2 tabular-nums text-muted-foreground">{minutesSince(a.status_changed_at, now)}</td>
                        <td className="px-4 py-2 text-muted-foreground">{t(`cc.mode.${a.audio_mode}` as const)}</td>
                        <td className="px-4 py-2 font-mono text-muted-foreground">{a.extension || "—"}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>

          <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {AGENT_STATUSES.map((s) => (
              <span key={s} className="inline-flex items-center gap-1"><StatusDot status={s} />{t(`cc.status.${s}` as const)}</span>
            ))}
          </p>
        </>
      )}
    </PageFrame>
  );
}
