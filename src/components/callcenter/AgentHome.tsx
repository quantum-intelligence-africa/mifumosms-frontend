// The numbers an agent cares about, laid out so they can be read at a glance: today's results, the last week, and the latest
// calls with what the AI made of each. Everything shown is this agent's own work; a figure with no data behind it says so
// instead of showing a zero.
import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { Clock, PhoneCall, PhoneIncoming, PhoneMissed, PhoneOutgoing, Phone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { PlayButton, RecordingPlayerBar, useRecordingPlayer } from "@/components/voice/RecordingPlayerBar";
import { formatDuration } from "@/components/callcenter/callUtils";
import type { AgentRecentCall, Workspace } from "@/services/callCenterApi";

// The chart library is only fetched when an agent opens their home screen.
const WeekChart = lazy(() => import("./WeekChart"));

function Kpi({ icon: Icon, tone, value, label, hint, hintTone }: {
  icon: typeof Phone; tone: string; value: string | number; label: string; hint?: string; hintTone?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none tabular-nums text-foreground">{value}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
          {hint && <p className={`mt-1 text-[11px] ${hintTone ?? "text-muted-foreground"}`}>{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const SENTIMENT_TONE: Record<string, string> = {
  positive: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  negative: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function outcomeTone(outcome: string): "default" | "secondary" | "outline" | "destructive" {
  if (outcome === "answered") return "default";
  if (outcome === "voicemail") return "secondary";
  if (outcome === "failed") return "outline";
  return outcome ? "destructive" : "outline";
}

export function AgentHome({ workspace }: { workspace: Workspace }) {
  const { t } = useLanguage();
  const player = useRecordingPlayer();
  const { stats_today: today, performance: perf, trend, recent_calls: recent } = workspace;
  const weekHasCalls = trend.some((d) => d.total > 0);

  const listen = (c: AgentRecentCall) =>
    c.recording &&
    player.toggle({
      id: c.recording.id,
      url: c.recording.storage_path,
      title: c.number,
      subtitle: new Date(c.started_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
      direction: c.direction,
      durationSeconds: c.recording.duration_seconds,
    });

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Phone} tone="bg-blue-50 text-blue-600 dark:bg-blue-950" value={today.total} label={t("cc.workspace.calls_today")}
          hint={perf.outbound > 0 ? t("cc.workspace.outbound_today", { count: perf.outbound }) : undefined} />
        <Kpi icon={PhoneCall} tone="bg-green-50 text-green-600 dark:bg-green-950" value={today.answered} label={t("cc.workspace.answered")}
          hint={perf.answer_rate === null ? t("cc.workspace.answer_rate_none") : t("cc.workspace.answer_rate", { rate: perf.answer_rate })} />
        <Kpi icon={PhoneMissed} tone="bg-red-50 text-red-600 dark:bg-red-950" value={today.missed} label={t("cc.workspace.missed")}
          hint={perf.follow_ups_open > 0 ? t("cc.workspace.follow_ups", { count: perf.follow_ups_open }) : t("cc.workspace.follow_ups_none")}
          hintTone={perf.follow_ups_open > 0 ? "font-medium text-red-600" : undefined} />
        <Kpi icon={Clock} tone="bg-violet-50 text-violet-600 dark:bg-violet-950"
          value={perf.avg_talk_seconds === null ? "—" : formatDuration(perf.avg_talk_seconds)} label={t("cc.workspace.avg_talk")}
          hint={perf.avg_talk_seconds === null ? t("cc.workspace.avg_talk_none") : undefined} />
      </div>

      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-sm">{t("cc.workspace.week_title")}</CardTitle></CardHeader>
        <CardContent>
          {weekHasCalls ? (
            <>
              <Suspense fallback={<Skeleton className="h-[180px]" />}><WeekChart data={trend} /></Suspense>
              <div className="mt-1 flex justify-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-green-600" />{t("cc.workspace.week_answered")}</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" />{t("cc.workspace.week_other")}</span>
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("cc.workspace.recent_empty")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm">{t("cc.workspace.recent_title")}</CardTitle>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs"><Link to="/call-center/history">{t("cc.workspace.view_all")}</Link></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t("cc.workspace.recent_empty")}</p>}
          {recent.map((c) => {
            const ai = c.analysis;
            return (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="mt-0.5">
                  {c.recording ? (
                    <PlayButton active={player.isCurrent(c.recording.id)} playing={player.isPlaying(c.recording.id)} onClick={() => listen(c)} label={t("cc.history.listen")} />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {c.direction === "inbound" ? <PhoneIncoming className="h-4 w-4" /> : <PhoneOutgoing className="h-4 w-4" />}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-sm font-medium text-foreground">{c.number}</span>
                    {c.direction === "inbound" ? <PhoneIncoming className="h-3.5 w-3.5 text-blue-600" /> : <PhoneOutgoing className="h-3.5 w-3.5 text-violet-600" />}
                    {c.outcome && <Badge variant={outcomeTone(c.outcome)} className="text-[10px]">{t(`cc.history.outcome_${c.outcome}` as never)}</Badge>}
                    {ai?.sentiment && SENTIMENT_TONE[ai.sentiment] && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SENTIMENT_TONE[ai.sentiment]}`}>{t(`cc.workspace.sentiment_${ai.sentiment}` as never)}</span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(c.started_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                      {c.duration_seconds ? ` · ${formatDuration(c.duration_seconds)}` : ""}
                    </span>
                  </div>
                  {ai?.summary ? (
                    <p className="flex gap-1.5 text-sm leading-snug text-foreground/90"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span className="line-clamp-2">{ai.summary}</span></p>
                  ) : ai && (ai.status === "pending" || ai.status === "processing") ? (
                    <p className="text-xs text-muted-foreground">{t("cc.workspace.ai_pending")}</p>
                  ) : c.recording ? (
                    <p className="text-xs text-muted-foreground">{t("cc.workspace.ai_none")}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <RecordingPlayerBar track={player.track} playing={player.playing} onPlayingChange={player.setPlaying} onClose={player.close} />
    </>
  );
}
