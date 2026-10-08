// The agent's home: availability, today's numbers, and nothing else.
// Deliberately sparse — the screen is for taking calls quickly, not for
// browsing SENDA's other products (see the call-center spec, section 9).
import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Headphones, Loader2, Phone, PhoneCall, PhoneMissed, Users, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useCallCenter } from "@/contexts/CallCenterContext";
import { useLanguage } from "@/hooks/useLanguage";
import { isCallCenterSupervisor } from "@/utils/roleUtils";
import { PageFrame } from "@/components/callcenter/PageFrame";
import { StatusPicker } from "@/components/callcenter/StatusPicker";
import { StatusLabel } from "@/components/callcenter/StatusDot";
import { formatDuration, useElapsed } from "@/components/callcenter/callUtils";

function greetingKey(): "cc.workspace.good_morning" | "cc.workspace.good_afternoon" | "cc.workspace.good_evening" {
  const h = new Date().getHours();
  if (h < 12) return "cc.workspace.good_morning";
  if (h < 17) return "cc.workspace.good_afternoon";
  return "cc.workspace.good_evening";
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Phone; label: string; value: number | string; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Workspace() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const cc = useCallCenter();
  const [dial, setDial] = useState("");
  const [dialError, setDialError] = useState<string | null>(null);
  const elapsed = useElapsed(cc.active?.startedAt ?? null);

  const firstName = user?.first_name || cc.workspace?.agent.name || "";

  if (!cc.enabled) {
    return (
      <PageFrame title={t("cc.workspace.title")}>
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t("cc.workspace.not_available")}</CardContent></Card>
      </PageFrame>
    );
  }

  // A supervisor/admin who isn't an agent themselves has no workspace.
  if (!cc.workspace) {
    return (
      <PageFrame title={t("cc.workspace.title")}>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Headphones className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-base font-semibold">{t("cc.workspace.no_profile_title")}</h3>
            <p className="max-w-md text-sm text-muted-foreground">{t("cc.workspace.no_profile_desc")}</p>
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  const w = cc.workspace;
  const browser = w.agent.audio_mode === "browser";
  const connected = cc.socketState === "ready";

  const startCall = () => {
    setDialError(null);
    const digits = dial.replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length < 9) {
      setDialError(t("cc.workspace.dial_invalid"));
      return;
    }
    const country = "+255";
    const number = digits.startsWith("+") ? digits : digits.startsWith("0") ? country + digits.slice(1) : digits.startsWith("255") ? `+${digits}` : country + digits;
    const err = cc.placeCall(number);
    if (err) setDialError(err === "already_in_call" ? t("cc.workspace.already_in_call") : err === "softphone_unavailable" ? t("cc.workspace.softphone_unavailable") : err);
    else setDial("");
  };

  return (
    <PageFrame
      title={`${t(greetingKey())}${firstName ? `, ${firstName}` : ""}`}
      subtitle={t("cc.workspace.subtitle")}
      actions={
        <>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${connected ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"}`}
            title={t("cc.workspace.connection_hint")}
          >
            {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {connected ? t("cc.workspace.live") : cc.socketState === "revoked" ? t("cc.workspace.revoked") : t("cc.workspace.reconnecting")}
          </span>
          {isCallCenterSupervisor(user) && (
            <Button asChild variant="outline" size="sm"><Link to="/call-center/live">{t("cc.board.team_overview")}</Link></Button>
          )}
          <StatusPicker />
        </>
      }
      width="max-w-4xl"
    >
      {cc.socketState === "revoked" && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {t("cc.workspace.revoked_desc")}
          </CardContent>
        </Card>
      )}

      {browser && cc.softphone === "error" && (
        <Card className="border-amber-300">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-amber-800 dark:text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {cc.softphoneNote === "no_number" ? t("cc.workspace.softphone_no_number") : t("cc.workspace.softphone_error")}
          </CardContent>
        </Card>
      )}
      {browser && cc.softphone === "connecting" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("cc.workspace.softphone_connecting")}
        </p>
      )}
      {cc.status === "offline" && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{t("cc.workspace.go_available_hint")}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Phone} label={t("cc.workspace.calls_today")} value={w.stats_today.total} tone="bg-blue-50 text-blue-600 dark:bg-blue-950" />
        <Stat icon={PhoneCall} label={t("cc.workspace.answered")} value={w.stats_today.answered} tone="bg-green-50 text-green-600 dark:bg-green-950" />
        <Stat icon={PhoneMissed} label={t("cc.workspace.missed")} value={w.stats_today.missed} tone="bg-red-50 text-red-600 dark:bg-red-950" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t("cc.workspace.live_calls")}</CardTitle></CardHeader>
          <CardContent>
            {cc.active ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{cc.active.name || t("cc.incoming.unknown_caller")}</p>
                  <p className="font-mono text-sm text-muted-foreground">{cc.active.number}</p>
                </div>
                <p className="font-mono text-xl tabular-nums text-green-600">{formatDuration(elapsed)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("cc.workspace.no_active_calls")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t("cc.workspace.my_team")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {w.teams.length === 0 && <p className="text-sm text-muted-foreground">{t("cc.workspace.no_team")}</p>}
            {w.teams.map((team) => (
              <div key={team.team_id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-medium"><Users className="h-4 w-4 text-muted-foreground" />{team.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t("cc.workspace.agents_online")}: <b className="text-foreground">{team.online} / {team.total}</b>
                </span>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">
              {t("cc.workspace.your_status")}: <StatusLabel status={cc.status} className="text-xs" />
            </p>
          </CardContent>
        </Card>
      </div>

      {browser && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t("cc.workspace.make_call")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={dial}
                onChange={(e) => setDial(e.target.value.replace(/[^\d+*#]/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && startCall()}
                placeholder="+255 …"
                inputMode="tel"
                className="font-mono"
                aria-label={t("cc.workspace.dial_aria")}
              />
              <Button onClick={startCall} disabled={cc.softphone !== "ready" || !!cc.active} className="gap-1.5 bg-green-600 text-white hover:bg-green-700">
                <Phone className="h-4 w-4" /> {t("cc.workspace.call")}
              </Button>
            </div>
            {dialError && <p className="text-xs text-destructive">{dialError}</p>}
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
