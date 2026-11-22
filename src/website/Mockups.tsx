import { ReactNode } from "react";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, FileText, MessageSquare, PhoneMissed, Play, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SAMPLE_LINES, fmtTime, useContent } from "./content";
import { useSiteLang } from "./i18n";
import { Tag } from "./Layout";

/* Illustrative product screens built in HTML (sharp at any size, easy to swap for approved
 * screenshots later). Labels mirror the live Call Center dashboard; all data is demo data. */

export function DemoFrame({ children, title, className }: { children: ReactNode; title: string; className?: string }) {
  const { tr } = useSiteLang();
  return (
    <figure className={cn("overflow-hidden rounded-2xl border border-[#E3E7EE] bg-white shadow-lg shadow-[#0B1B3F]/[0.05]", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-[#E3E7EE] bg-[#FAFBFC] px-4 py-2.5">
        <span className="text-sm font-semibold text-[#0B1B3F]">{title}</span>
        <Tag tone="grey">{tr("Demo data", "Data za mfano")}</Tag>
      </div>
      <div className="p-4">{children}</div>
      <figcaption className="sr-only">
        {title}, {tr("illustrative screen with demonstration data", "skrini ya mfano yenye data za maonyesho")}
      </figcaption>
    </figure>
  );
}

function FakeSelect({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E7EE] bg-white px-2.5 py-1.5 text-xs text-[#3F4A5A]">
      {children}
      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}

function MiniPlayer({ at = 0 }: { at?: number }) {
  const { SAMPLE_CALL } = useContent();
  const pct = (at / SAMPLE_CALL.durationSec) * 100;
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#F5F6F8] p-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-white">
        <Play className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden />
      </span>
      <span className="text-xs tabular-nums text-[#4B5565]">{fmtTime(at)}</span>
      <span className="relative h-1.5 flex-1 rounded-full bg-[#D5DCE8]">
        <span className="absolute inset-y-0 left-0 rounded-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs tabular-nums text-[#4B5565]">{fmtTime(SAMPLE_CALL.durationSec)}</span>
    </div>
  );
}

/** "Review a call": the selected call with recording, transcript and key details. */
export function ReviewCallMock() {
  const { tr } = useSiteLang();
  const { SAMPLE_CALL } = useContent();
  return (
    <DemoFrame title={tr("Review a call", "Kagua simu")}>
      <div className="grid gap-4 md:grid-cols-[0.9fr_1.3fr]">
        <dl className="divide-y divide-[#EEF0F4] text-sm">
          {[
            [tr("Caller", "Mpigaji"), SAMPLE_CALL.callerNumber],
            [tr("Date", "Tarehe"), SAMPLE_CALL.date],
            [tr("Time", "Saa"), SAMPLE_CALL.time],
            [tr("Duration", "Muda"), fmtTime(SAMPLE_CALL.durationSec)],
            [tr("Answered by", "Alipokea"), SAMPLE_CALL.agent],
            [tr("Team", "Timu"), tr("Bookings", "Uhifadhi")],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2">
              <dt className="text-[#5B6575]">{k}</dt>
              <dd className="text-right font-medium text-[#0B1B3F]">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-3">
          <MiniPlayer at={24} />
          <ol className="space-y-2">
            {SAMPLE_LINES.slice(1, 5).map((l, i) => (
              <li key={i} className={cn("flex gap-2 rounded-lg p-2 text-sm", i === 3 && "bg-[#EAF1FF]")}>
                <span className="w-8 flex-shrink-0 text-xs tabular-nums text-[#5B6575]">{fmtTime(l.at)}</span>
                <span className="font-semibold text-[#0B1B3F]">{l.who === "customer" ? tr("Customer", "Mteja") : tr("Agent", "Mhudumu")}:</span>
                <span className="text-[#3F4A5A]">{l.sw}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </DemoFrame>
  );
}

/** "Discuss the next step": key details, recommended step, team note and owner. */
export function DiscussMock() {
  const { tr } = useSiteLang();
  const { SAMPLE_CALL, SAMPLE_KEY_DETAILS } = useContent();
  return (
    <DemoFrame title={tr("Discuss the next step", "Jadilini hatua inayofuata")}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#5B6575]">{tr("Key details from the call", "Mambo muhimu kutoka kwenye simu")}</p>
          <dl className="space-y-1.5 text-sm">
            {SAMPLE_KEY_DETAILS.map((d) => (
              <div key={d.label} className="flex justify-between gap-3 rounded-lg bg-[#F5F6F8] px-3 py-2">
                <dt className="text-[#5B6575]">{d.label}</dt>
                <dd className="text-right font-medium text-[#0B1B3F]">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-[#D6E2FB] bg-[#F4F8FF] p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8]">{tr("Recommended next step", "Hatua inayopendekezwa")}</p>
            <p className="mt-1 text-sm text-[#0B1B3F]">{SAMPLE_CALL.nextStep}</p>
          </div>
          <div className="rounded-xl border border-[#E3E7EE] p-3 text-sm">
            <p className="flex items-center gap-2 font-semibold text-[#0B1B3F]">
              <MessageSquare className="h-4 w-4 text-[#2563EB]" aria-hidden /> {tr("Team note", "Dokezo la timu")}
            </p>
            <p className="mt-1 text-[#3F4A5A]">
              <span className="font-medium text-[#0B1B3F]">{tr("Supervisor (Juma):", "Msimamizi (Juma):")}</span>{" "}
              {tr(
                "Neema, please confirm the 3 seats are held before sending the link.",
                "Neema, tafadhali hakikisha viti 3 vimeshikiliwa kabla ya kutuma kiungo.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#5B6575]">{tr("Owner", "Mhusika")}</span>
            <FakeSelect>Neema</FakeSelect>
            <Tag tone="amber">{tr("Callback due · Today 10:00", "Kupiga tena kunasubiri · Leo 10:00")}</Tag>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

const TREND = [38, 44, 41, 52, 61, 74, 57];
const DAYS = ["Fri", "Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];
const DAYS_SW = ["Ijumaa", "Jumamosi", "Jumapili", "Jumatatu", "Jumanne", "Jumatano", "Alhamisi"];

/** "Check call trends": supervisor metrics for a reporting period. */
export function TrendsMock() {
  const { tr, lang } = useSiteLang();
  const max = Math.max(...TREND);
  const days = lang === "sw" ? DAYS_SW : DAYS;
  return (
    <DemoFrame title={tr("Check call trends", "Angalia mwenendo wa simu")}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-[#5B6575]">{tr("Reporting period", "Kipindi cha ripoti")}</span>
        <FakeSelect>{tr("Last 7 days", "Siku 7 zilizopita")}</FakeSelect>
        <FakeSelect>{tr("All teams", "Timu zote")}</FakeSelect>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          [tr("Answered", "Zilizopokelewa"), "331"],
          [tr("Missed", "Zilizokosa"), "36"],
          [tr("Answer rate", "Kiwango cha kupokea"), "90%"],
          [tr("Callback due", "Kupiga tena kunasubiri"), "7"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[#F5F6F8] p-3">
            <p className="text-xs text-[#5B6575]">{k}</p>
            <p className="text-xl font-bold tabular-nums text-[#0B1B3F]">{v}</p>
          </div>
        ))}
      </div>
      <p className="mb-2 mt-4 text-sm font-semibold text-[#0B1B3F]">{tr("Call activity over time", "Mwenendo wa simu kwa muda")}</p>
      <div className="flex h-28 items-end gap-2" role="img" aria-label={tr("Calls per day for the last 7 days, peaking at 74 on Wednesday", "Simu kwa siku katika siku 7 zilizopita, zikifika kilele cha 74 Jumatano")}>
        {TREND.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <span className="w-full rounded-t-md bg-[#2563EB]" style={{ height: `${(v / max) * 88}px`, opacity: i === 5 ? 1 : 0.55 }} />
            <span className="text-[11px] text-[#5B6575]">{days[i]}</span>
          </div>
        ))}
      </div>
    </DemoFrame>
  );
}

const HISTORY = [
  { caller: "+255 7•• ••• 214", dir: "in", team: "Bookings", date: "19 Nov, 8:42 AM", dur: "1:12", result: "Answered", rec: true, selected: true },
  { caller: "+255 6•• ••• 090", dir: "in", team: "Bookings", date: "19 Nov, 8:31 AM", dur: "—", result: "Missed", rec: false },
  { caller: "+255 7•• ••• 553", dir: "out", team: "Parcels", date: "19 Nov, 8:15 AM", dur: "2:12", result: "Answered", rec: true },
  { caller: "+255 7•• ••• 871", dir: "in", team: "Bookings", date: "19 Nov, 7:58 AM", dur: "1:47", result: "Answered", rec: true },
  { caller: "+255 6•• ••• 402", dir: "in", team: "Bookings", date: "19 Nov, 7:40 AM", dur: "—", result: "Voicemail", rec: true },
];

/** Agent view: Call history list with filters plus the selected call. */
export function AgentDashboardMock() {
  const { tr } = useSiteLang();
  const { SAMPLE_CALL } = useContent();
  const resultLabel = (r: string) => (r === "Missed" ? tr("Missed", "Imekosekana") : r === "Voicemail" ? tr("Voicemail", "Ujumbe wa sauti") : r);
  return (
    <DemoFrame title={tr("Agent view · Call history", "Mwonekano wa mhudumu · Historia ya simu")}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#E3E7EE] px-2.5 py-1.5 text-xs text-[#5B6575]">
          <Search className="h-3.5 w-3.5" aria-hidden /> {tr("Search number, agent…", "Tafuta namba, mhudumu…")}
        </span>
        <FakeSelect>{tr("All directions", "Pande zote")}</FakeSelect>
        <FakeSelect>{tr("All teams", "Timu zote")}</FakeSelect>
        <FakeSelect>{tr("Any result", "Matokeo yoyote")}</FakeSelect>
        <FakeSelect>{tr("All time", "Wakati wote")}</FakeSelect>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-xs">
            <thead className="text-[#5B6575]">
              <tr className="border-b border-[#EEF0F4]">
                {[
                  tr("Caller", "Mpigaji"),
                  tr("Direction", "Upande"),
                  tr("Team", "Timu"),
                  tr("Date", "Tarehe"),
                  tr("Duration", "Muda"),
                  tr("Recording", "Rekodi"),
                ].map((h) => (
                  <th key={h} className="px-2 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((r) => (
                <tr key={r.date} className={cn("border-b border-[#EEF0F4]", r.selected && "bg-[#EAF1FF]")}>
                  <td className="px-2 py-2 font-medium text-[#0B1B3F]">{r.caller}</td>
                  <td className="px-2 py-2 text-[#3F4A5A]">
                    <span className="inline-flex items-center gap-1">
                      {r.dir === "in" ? <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden /> : <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}
                      {r.dir === "in" ? tr("Inbound", "Inayoingia") : tr("Outbound", "Inayotoka")}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-[#3F4A5A]">{r.team === "Bookings" ? tr("Bookings", "Uhifadhi") : tr("Parcels", "Vifurushi")}</td>
                  <td className="px-2 py-2 text-[#3F4A5A]">{r.date}</td>
                  <td className="px-2 py-2 tabular-nums text-[#3F4A5A]">
                    {r.dur}
                    {r.result !== "Answered" && <span className="ml-1.5 text-[10px] font-semibold text-[#8A5300]">{resultLabel(r.result)}</span>}
                  </td>
                  <td className="px-2 py-2 text-[#3F4A5A]">{r.rec ? tr("Available", "Ipo") : tr("None", "Hakuna")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 rounded-xl border border-[#E3E7EE] p-3">
          <div>
            <p className="font-semibold text-[#0B1B3F]">{SAMPLE_CALL.callerNumber}</p>
            <p className="text-xs text-[#5B6575]">
              {SAMPLE_CALL.date} · {SAMPLE_CALL.time} · {fmtTime(SAMPLE_CALL.durationSec)} · {tr("Answered by", "Alipokea")} {SAMPLE_CALL.agent}
            </p>
          </div>
          <MiniPlayer at={11} />
          <div className="text-xs">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-[#0B1B3F]">
              <FileText className="h-3.5 w-3.5" aria-hidden /> {tr("Transcript", "Maandishi ya simu")}
            </p>
            {SAMPLE_LINES.slice(1, 3).map((l, i) => (
              <p key={i} className="py-1 text-[#3F4A5A]">
                <span className="tabular-nums text-[#5B6575]">{fmtTime(l.at)}</span>{" "}
                <span className="font-semibold text-[#0B1B3F]">{l.who === "customer" ? tr("Customer", "Mteja") : tr("Agent", "Mhudumu")}:</span> {l.sw}
              </p>
            ))}
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

/** Supervisor view: metrics, period and agent performance with a route into a call review. */
export function SupervisorDashboardMock() {
  const { tr } = useSiteLang();
  return (
    <DemoFrame title={tr("Supervisor view · Analytics", "Mwonekano wa msimamizi · Takwimu")}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm text-[#5B6575]">{tr("Reporting period", "Kipindi cha ripoti")}</span>
        <FakeSelect>{tr("Last 7 days", "Siku 7 zilizopita")}</FakeSelect>
        <FakeSelect>{tr("All teams", "Timu zote")}</FakeSelect>
        <FakeSelect>{tr("All agents", "Wahudumu wote")}</FakeSelect>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          [tr("Answered", "Zilizopokelewa"), "331"],
          [tr("Missed", "Zilizokosa"), "36"],
          [tr("Answer rate", "Kiwango cha kupokea"), "90%"],
          [tr("Callback due", "Kupiga tena kunasubiri"), "7"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[#F5F6F8] p-3">
            <p className="text-xs text-[#5B6575]">{k}</p>
            <p className="text-xl font-bold tabular-nums text-[#0B1B3F]">{v}</p>
          </div>
        ))}
      </div>
      <p className="mb-2 mt-4 text-sm font-semibold text-[#0B1B3F]">{tr("Agent performance", "Utendaji wa wahudumu")}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead className="text-[#5B6575]">
            <tr className="border-b border-[#EEF0F4]">
              {[tr("Agent", "Mhudumu"), tr("Answered", "Zilizopokelewa"), tr("Answer rate", "Kiwango cha kupokea"), tr("Unresolved", "Hazijatatuliwa"), ""].map((h, i) => (
                <th key={i} className="px-2 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Neema", "124", "94%", "2"],
              ["Baraka", "109", "88%", "4"],
              ["Rehema", "98", "87%", "1"],
            ].map((r) => (
              <tr key={r[0]} className="border-b border-[#EEF0F4]">
                <td className="px-2 py-2 font-medium text-[#0B1B3F]">{r[0]}</td>
                <td className="px-2 py-2 tabular-nums">{r[1]}</td>
                <td className="px-2 py-2 tabular-nums">{r[2]}</td>
                <td className="px-2 py-2 tabular-nums">{r[3]}</td>
                <td className="px-2 py-2 font-semibold text-[#2563EB]">{tr("Open this agent's calls", "Fungua simu za mhudumu huyu")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DemoFrame>
  );
}

/** Missed calls list with follow-up status (labels from the live Missed calls page). */
export function MissedCallsMock() {
  const { tr } = useSiteLang();
  return (
    <DemoFrame title={tr("Missed calls", "Simu zilizokosa")}>
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        {[
          [tr("New", "Mpya"), "3"],
          [tr("Overdue", "Zimechelewa"), "1"],
          [tr("Callbacks scheduled", "Zilizopangwa kupigiwa"), "4"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-[#F5F6F8] p-2">
            <p className="text-lg font-bold tabular-nums text-[#0B1B3F]">{v}</p>
            <p className="text-[11px] text-[#5B6575]">{k}</p>
          </div>
        ))}
      </div>
      <ul className="space-y-2 text-sm">
        {[
          {
            n: "+255 6•• ••• 090",
            w: tr("waited 0:42, then hung up", "alisubiri 0:42, kisha akakata"),
            s: tr("Not followed up yet", "Hajafuatiliwa bado"),
            tone: "amber" as const,
          },
          {
            n: "+255 7•• ••• 318",
            w: tr("Agents were rung and nobody answered", "Wahudumu waliitwa na hakuna aliyepokea"),
            s: tr("Callback · 10:30", "Kupiga tena · 10:30"),
            tone: "blue" as const,
          },
          { n: "+255 7•• ••• 744", w: tr("Asked to be called back", "Ameomba kupigiwa tena"), s: tr("Contacted", "Mteja amepatikana"), tone: "green" as const },
        ].map((r) => (
          <li key={r.n} className="flex items-center justify-between gap-2 rounded-xl border border-[#EEF0F4] p-2.5">
            <span className="flex items-center gap-2">
              <PhoneMissed className="h-4 w-4 text-[#5B6575]" aria-hidden />
              <span>
                <span className="block font-medium text-[#0B1B3F]">{r.n}</span>
                <span className="block text-xs text-[#5B6575]">{r.w}</span>
              </span>
            </span>
            <Tag tone={r.tone}>{r.s}</Tag>
          </li>
        ))}
      </ul>
    </DemoFrame>
  );
}


