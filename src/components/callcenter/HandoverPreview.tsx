// "What callers will experience": for every department, which team takes the call, whether that team is open right now, and exactly what the assistant
// will do for a caller who asks for a person, given what the owner allowed. It reads the same settings the server enforces, so what this shows is
// what happens; nothing here changes them.
import { useMemo } from "react";
import { CheckCircle2, Clock, MessageSquare, PhoneForwarded, ShieldOff } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { aiKey } from "@/i18n/aiAgent";
import type { Team, WorkingHours } from "@/services/callCenterApi";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Whether `team` is inside its working hours right now, in the team's own time zone. No hours set = always open (the server's rule too). */
function isOpenNow(team: Team, now = new Date()): boolean {
  const hours = team.working_hours as Partial<WorkingHours>;
  if (!hours || !Object.keys(hours).length) return true;
  let parts: Record<string, string>;
  try {
    parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", { timeZone: team.timezone || "UTC", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
        .formatToParts(now).map((p) => [p.type, p.value]),
    );
  } catch {
    return true; // an unreadable time zone fails open, as on the server
  }
  const weekday = DAY_NAMES.findIndex((d) => d === parts.weekday);
  if (hours.days && weekday >= 0 && !hours.days.includes(weekday)) return false;
  const current = `${parts.hour === "24" ? "00" : parts.hour}:${parts.minute}`;
  return (hours.start || "00:00") <= current && current <= (hours.end || "23:59");
}

function hoursLabel(team: Team): string {
  const hours = team.working_hours as Partial<WorkingHours>;
  if (!hours || !Object.keys(hours).length) return "";
  const days = [...(hours.days ?? [0, 1, 2, 3, 4, 5, 6])].sort();
  const range = days.length >= 3 && days.every((d, i) => i === 0 || d === days[i - 1] + 1) ? `${DAY_NAMES[days[0]]}–${DAY_NAMES[days[days.length - 1]]}` : days.map((d) => DAY_NAMES[d]).join(", ");
  return `${range} ${hours.start ?? "00:00"}–${hours.end ?? "23:59"}`;
}

interface Props {
  transfers: boolean;
  requests: boolean;
  departments: string[];
  teamFor: (dept: string) => string;
  defaultDepartment: string;
  teams: Team[];
}

export function HandoverPreview({ transfers, requests, departments, teamFor, defaultDepartment, teams }: Props) {
  const { t } = useLanguage();
  const byId = useMemo(() => new Map(teams.map((tm) => [tm.id, tm])), [teams]);

  const row = (dept: string) => {
    const configured = teamFor(dept);
    const team = byId.get(configured) ?? byId.get(teamFor(defaultDepartment));
    const inherited = !byId.get(configured) && !!team;
    if (!team) return { dept, team: null, open: false, text: t(aiKey("ai.prev.no_team")), tone: "warn" as const, Icon: ShieldOff, inherited };
    const open = isOpenNow(team);
    if (transfers && open) return { dept, team, open, text: t(aiKey("ai.prev.connect")), tone: "ok" as const, Icon: PhoneForwarded, inherited };
    if (!transfers) return { dept, team, open, text: requests ? t(aiKey("ai.prev.no_transfer_message")) : t(aiKey("ai.prev.nothing")), tone: requests ? ("info" as const) : ("warn" as const), Icon: requests ? MessageSquare : ShieldOff, inherited };
    return { dept, team, open, text: requests ? t(aiKey(open ? "ai.prev.busy_message" : "ai.prev.closed_message")) : t(aiKey(open ? "ai.prev.busy_plain" : "ai.prev.closed_plain")), tone: requests ? ("info" as const) : ("warn" as const), Icon: requests ? MessageSquare : Clock, inherited };
  };

  const tones = { ok: "text-emerald-700", info: "text-sky-700", warn: "text-amber-700" } as const;
  return (
    <div className="space-y-2 rounded-lg border border-border p-3" aria-label={t(aiKey("ai.prev.title"))}>
      <div>
        <p className="font-medium">{t(aiKey("ai.prev.title"))}</p>
        <p className="text-xs text-muted-foreground">{t(aiKey("ai.prev.help"))}</p>
      </div>
      {!transfers && !requests && (
        <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-900" role="alert">{t(aiKey("ai.prev.both_off"))}</p>
      )}
      <ul className="divide-y">
        {departments.map((dept) => {
          const r = row(dept);
          return (
            <li key={dept} className="grid gap-1 py-2 text-sm sm:grid-cols-[10rem_1fr] sm:gap-3">
              <div>
                <p className="font-medium">{t(aiKey(`ai.dept.${dept}`))}</p>
                <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                  {r.team ? (
                    <>
                      <span>{r.team.name}{r.inherited ? ` (${t(aiKey("ai.prev.default_team"))})` : ""}</span>
                      <span className={r.open ? "text-emerald-700" : "text-amber-700"}>· {r.open ? t(aiKey("ai.prev.open")) : t(aiKey("ai.prev.closed"))}</span>
                      {hoursLabel(r.team) && <span>· {hoursLabel(r.team)}</span>}
                    </>
                  ) : <span>—</span>}
                </p>
              </div>
              <p className={`flex items-start gap-1.5 ${tones[r.tone]}`}><r.Icon className="mt-0.5 h-4 w-4 shrink-0" /><span>{r.text}</span></p>
            </li>
          );
        })}
      </ul>
      {transfers && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />{t(aiKey("ai.prev.transfer_note"))}</p>
      )}
    </div>
  );
}
