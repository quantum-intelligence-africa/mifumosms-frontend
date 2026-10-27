// The "Calls" tab of the WhatsApp workspace: my availability, whether this number can take calls, the call history, and (for owners, admins and
// supervisors) who is on what. Everything comes from the server; nothing is sample data.
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, MessageSquare, Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatClock, useWhatsAppCalling } from "@/contexts/WhatsAppCallingContext";
import { whatsappCallsApi, type Availability, type TeamSummary, type WaCall } from "@/services/whatsappCallsApi";
import { appLanguage } from "@/utils/appLocale";
import { callText } from "./callText";

const SW = {
  history: "Historia", team: "Timu", me: "Upatikanaji wangu", number: "Namba ya WhatsApp", ready: "Tayari kupokea na kupiga simu", notReady: "Haiwezi kupiga simu bado", check: "Hakiki tena",
  enable: "Washa simu kwenye namba hii", enabling: "Inawasha...", all: "Zote", incoming: "Zilizoingia", outgoing: "Zilizotoka", missed: "Zilizokosa", completed: "Zilizokamilika", failed: "Zilizoshindwa",
  mine: "Zangu pekee", search: "Tafuta jina au namba", none: "Hakuna simu bado.", handledBy: "Alishughulikia", startedBy: "Alipiga", time: "Muda", duration: "Muda wa simu", outcome: "Matokeo",
  followUp: "Nimewasiliana tena", followed: "Imefuatiliwa", chat: "Mazungumzo", activeCalls: "Simu zinazoendelea", ringingCalls: "Zinaita", agents: "Mawakala", today: "Leo",
  noActive: "Hakuna simu zinazoendelea.", mustBe: "Wamiliki, wasimamizi na wasimamizi wakuu tu wanaona sehemu hii.", loading: "Inapakia...", failedLoad: "Imeshindikana kupakia.",
  completedS: "Imekamilika", missedS: "Imekosa", rejectedS: "Imekataliwa", failedS: "Imeshindikana", cancelledS: "Imesitishwa", noAnswer: "Hakujibu", total: "Jumla", warning: "Angalizo",
};
const EN = {
  history: "History", team: "Team", me: "My availability", number: "WhatsApp number", ready: "Ready to take and place calls", notReady: "Cannot take calls yet", check: "Check again",
  enable: "Switch calling on for this number", enabling: "Switching on...", all: "All", incoming: "Incoming", outgoing: "Outgoing", missed: "Missed", completed: "Completed", failed: "Failed",
  mine: "Only mine", search: "Search name or number", none: "No calls yet.", handledBy: "Handled by", startedBy: "Placed by", time: "Time", duration: "Duration", outcome: "Outcome",
  followUp: "Mark followed up", followed: "Followed up", chat: "Conversation", activeCalls: "Calls in progress", ringingCalls: "Ringing", agents: "Agents", today: "Today",
  noActive: "No calls in progress.", mustBe: "Only owners, admins and supervisors can see this.", loading: "Loading...", failedLoad: "Could not load.",
  completedS: "Completed", missedS: "Missed", rejectedS: "Rejected", failedS: "Failed", cancelledS: "Cancelled", noAnswer: "No answer", total: "Total", warning: "Note",
};
const tx = () => (appLanguage() === "sw" ? SW : EN);

const stateTone: Record<string, string> = { available: "bg-emerald-100 text-emerald-800", busy: "bg-red-100 text-red-800", away: "bg-amber-100 text-amber-800", offline: "bg-muted text-muted-foreground" };
const when = (iso: string) => new Date(iso).toLocaleString(appLanguage() === "sw" ? "sw-TZ" : undefined, { dateStyle: "short", timeStyle: "short" });
const name = (c: WaCall) => c.customer_name || `+${c.customer_phone}`;

function Outcome({ c }: { c: WaCall }) {
  const T = tx();
  const map: Record<string, [string, string]> = {
    completed: [T.completedS, "bg-emerald-100 text-emerald-800"], missed: [c.direction === "out" ? T.noAnswer : T.missedS, "bg-red-100 text-red-800"], rejected: [T.rejectedS, "bg-amber-100 text-amber-800"],
    failed: [T.failedS, "bg-red-100 text-red-800"], cancelled: [T.cancelledS, "bg-muted text-muted-foreground"], ringing: ["…", "bg-blue-100 text-blue-800"],
    accepting: ["…", "bg-blue-100 text-blue-800"], active: ["●", "bg-emerald-100 text-emerald-800"],
  };
  const [text, cls] = map[c.status] ?? [c.status, "bg-muted"];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{text}</span>;
}

export function CallsPanel({ canSeeTeam, onOpenThread }: { canSeeTeam: boolean; onOpenThread: (threadId: string) => void }) {
  const { live, readiness, readinessError, refreshReadiness, setAvailability } = useWhatsAppCalling();
  const { toast } = useToast();
  const T = tx();
  const A = callText();
  const [tab, setTab] = useState<"history" | "team">("history");
  const [rows, setRows] = useState<WaCall[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<{ direction: string; status: string; mine: boolean; q: string }>({ direction: "", status: "", mine: false, q: "" });
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [summary, setSummary] = useState<TeamSummary | null>(null);
  const [enabling, setEnabling] = useState(false);

  const load = useCallback(async (nextPage = 1, append = false) => {
    const res = await whatsappCallsApi.list({ ...filter, mine: filter.mine || undefined, page: nextPage });
    if (!res.success || !res.data) { setState((s) => (s === "ok" ? s : "error")); return; }
    setRows((prev) => (append ? [...prev, ...res.data!.results.filter((r) => !prev.some((p) => p.id === r.id))] : res.data!.results));
    setTotal(res.data.count); setPage(nextPage); setState("ok");
  }, [filter]);

  useEffect(() => { setState("loading"); void load(1); }, [load]);
  // a call finishing (or arriving) elsewhere changes the history: re-read it quietly while this tab is open
  useEffect(() => { const h = window.setInterval(() => void load(1), 8000); return () => window.clearInterval(h); }, [load]);

  useEffect(() => {
    if (tab !== "team" || !canSeeTeam) return;
    let stopped = false;
    const pull = async () => { const res = await whatsappCallsApi.summary(); if (!stopped && res.success && res.data) setSummary(res.data); };
    void pull();
    const h = window.setInterval(pull, 4000);
    return () => { stopped = true; window.clearInterval(h); };
  }, [tab, canSeeTeam]);

  const enable = async () => {
    setEnabling(true);
    const res = await whatsappCallsApi.enableCalling();
    setEnabling(false);
    if (res.success) { toast({ title: T.ready }); void refreshReadiness(true); } else toast({ title: T.notReady, description: res.message, variant: "destructive" });
  };
  const followUp = async (c: WaCall) => {
    const res = await whatsappCallsApi.followedUp(c.id);
    if (res.success && res.data) setRows((p) => p.map((r) => (r.id === c.id ? res.data!.call : r)));
  };

  const me = live?.me;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-lg border p-3">
          <h3 className="text-sm font-semibold">{T.me}</h3>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={T.me}>
            {(["available", "away", "offline"] as Availability[]).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={me?.state === s} onClick={() => void setAvailability(s)}
                className={`rounded-full border px-3 py-1 text-sm ${me?.state === s ? "border-primary bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted"}`}>{A[s]}</button>
            ))}
            {me?.effective === "busy" && <span className={`rounded-full px-3 py-1 text-sm ${stateTone.busy}`}>{A.busy}</span>}
          </div>
        </section>
        <section className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{T.number}{readiness?.display_phone_number ? ` · ${readiness.display_phone_number}` : ""}</h3>
            <Button type="button" size="sm" variant="ghost" onClick={() => void refreshReadiness(true)}><RefreshCw className="mr-1 h-3.5 w-3.5" />{T.check}</Button>
          </div>
          {readinessError && <p className="mt-2 text-sm text-red-700">{readinessError}</p>}
          {readiness && (
            <div className="mt-2 space-y-1.5 text-sm">
              <p className={`flex items-center gap-1.5 ${readiness.ready ? "text-emerald-700" : "text-amber-800"}`}>
                {readiness.ready ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{readiness.ready ? T.ready : T.notReady}
              </p>
              {readiness.blockers.map((b) => <p key={b.code} className="text-muted-foreground">{b.message}</p>)}
              {readiness.warnings.map((w) => <p key={w} className="text-xs text-muted-foreground">{T.warning}: {w}</p>)}
              {readiness.blockers.some((b) => b.code === "calling_off") && (
                <Button type="button" size="sm" onClick={() => void enable()} disabled={enabling}>{enabling && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{enabling ? T.enabling : T.enable}</Button>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="flex gap-1.5 border-b">
        {(["history", ...(canSeeTeam ? ["team"] : [])] as Array<"history" | "team">).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`px-3 py-2 text-sm ${tab === k ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground"}`}>{k === "history" ? T.history : T.team}</button>
        ))}
      </div>

      {tab === "history" && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Input className="h-9 w-48" placeholder={T.search} value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} />
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={filter.direction} onChange={(e) => setFilter({ ...filter, direction: e.target.value })}>
              <option value="">{T.all}</option><option value="in">{T.incoming}</option><option value="out">{T.outgoing}</option>
            </select>
            <select className="h-9 rounded-md border border-input bg-background px-2 text-sm" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">{T.all}</option><option value="completed">{T.completedS}</option><option value="missed">{T.missedS}</option><option value="rejected">{T.rejectedS}</option><option value="failed">{T.failedS}</option><option value="cancelled">{T.cancelledS}</option>
            </select>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={filter.mine} onChange={(e) => setFilter({ ...filter, mine: e.target.checked })} />{T.mine}</label>
          </div>
          {state === "loading" && <p className="p-4 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{T.loading}</p>}
          {state === "error" && <p className="p-4 text-sm text-red-700">{T.failedLoad}</p>}
          {state === "ok" && rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">{T.none}</p>}
          <ul className="divide-y rounded-lg border">
            {rows.map((c) => {
              const Icon = c.status === "missed" && c.direction === "in" ? PhoneMissed : c.direction === "in" ? PhoneIncoming : PhoneOutgoing;
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                  <Icon className={`h-5 w-5 shrink-0 ${c.status === "missed" || c.status === "failed" ? "text-red-600" : "text-muted-foreground"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{name(c)} <span className="font-normal text-muted-foreground">+{c.customer_phone}</span></p>
                    <p className="truncate text-xs text-muted-foreground">
                      {when(c.started_at)}
                      {c.direction === "in" && c.handled_by ? ` · ${T.handledBy} ${c.handled_by.name}` : ""}
                      {c.direction === "out" && c.initiated_by ? ` · ${T.startedBy} ${c.initiated_by.name}` : ""}
                      {c.duration_seconds > 0 ? ` · ${formatClock(c.duration_seconds)}` : ""}
                    </p>
                    {c.error && (c.status === "failed" || c.status === "missed") && <p className="truncate text-xs text-red-700">{c.error}</p>}
                  </div>
                  <Outcome c={c} />
                  {c.thread_id && <Button type="button" size="sm" variant="ghost" onClick={() => onOpenThread(c.thread_id!)}><MessageSquare className="mr-1 h-4 w-4" />{T.chat}</Button>}
                  {c.status === "missed" && c.direction === "in" && (c.followed_up
                    ? <Badge variant="secondary">{T.followed}</Badge>
                    : <Button type="button" size="sm" variant="outline" onClick={() => void followUp(c)}>{T.followUp}</Button>)}
                </li>
              );
            })}
          </ul>
          {rows.length < total && <Button type="button" variant="outline" size="sm" className="self-center" onClick={() => void load(page + 1, true)}>+</Button>}
        </>
      )}

      {tab === "team" && canSeeTeam && (
        <div className="space-y-4">
          {!summary && <p className="p-4 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{T.loading}</p>}
          {summary && (
            <>
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                {([["total", summary.today.total], ["completed", summary.today.completed], ["missed", summary.today.missed], ["rejected", summary.today.rejected], ["failed", summary.today.failed], ["cancelled", summary.today.cancelled]] as const).map(([k, n]) => (
                  <div key={k} className="rounded-lg border p-2"><p className="text-lg font-semibold tabular-nums">{n}</p><p className="text-xs text-muted-foreground">{({ total: T.total, completed: T.completedS, missed: T.missedS, rejected: T.rejectedS, failed: T.failedS, cancelled: T.cancelledS } as Record<string, string>)[k]}</p></div>
                ))}
              </div>
              <section>
                <h3 className="mb-1 text-sm font-semibold">{T.activeCalls}</h3>
                {summary.ringing.length + summary.active.length === 0 && <p className="text-sm text-muted-foreground">{T.noActive}</p>}
                <ul className="space-y-1">
                  {[...summary.ringing, ...summary.active].map((c) => (
                    <li key={c.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <Phone className="h-4 w-4 text-emerald-600" /><span className="font-medium">{name(c)}</span>
                      <span className="text-muted-foreground">{c.status === "ringing" ? T.ringingCalls : `${c.handled_by?.name || ""} · ${A.connected}`}</span>
                      <span className="ml-auto"><Outcome c={c} /></span>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3 className="mb-1 text-sm font-semibold">{T.agents}</h3>
                <ul className="space-y-1">
                  {summary.agents.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <span className="font-medium">{a.name}</span><span className="text-xs text-muted-foreground">{a.role}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${stateTone[a.state] ?? stateTone.offline}`}>{(A as Record<string, string>)[a.state] ?? a.state}</span>
                      {a.on_call && <span className="text-xs text-muted-foreground">· {name(a.on_call)}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
