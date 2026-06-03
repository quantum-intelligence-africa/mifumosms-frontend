import { useContext, useState } from "react";
import {
  MessageSquare,
  PhoneCall,
  Filter,
  TrendingUp,
  Clock,
  Users,
  Inbox,
  Tag,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  GaugeCircle,
  ArrowUpRight,
} from "lucide-react";
import { SectionHeader, MockupFrame } from "./shared";
import { LanguageContext } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type Tab = "chat" | "voice";

const getTabs = (
  isSw: boolean
): Array<{ id: Tab; label: string; Icon: typeof MessageSquare }> => [
  { id: "chat", label: isSw ? "Takwimu za chat" : "Chat analytics", Icon: MessageSquare },
  { id: "voice", label: isSw ? "Takwimu za sauti" : "Voice analytics", Icon: PhoneCall },
];

const getChatMetrics = (
  isSw: boolean
): Array<{ Icon: typeof Inbox; label: string; body: string }> => [
  {
    Icon: Inbox,
    label: isSw ? "Tiketi zilizo wazi" : "Open tickets",
    body: isSw ? "Hesabu ya moja kwa moja katika kila njia" : "Live count across every channel",
  },
  {
    Icon: TrendingUp,
    label: isSw ? "Mazungumzo kwa muda" : "Conversations over time",
    body: isSw ? "Mwenendo wa saa, siku, na wiki" : "Hourly, daily, weekly trends",
  },
  {
    Icon: GaugeCircle,
    label: isSw ? "Yaliyotatuliwa dhidi ya yasiyotatuliwa" : "Resolved vs unresolved",
    body: isSw ? "Tambua kupungua kwa wakati halisi" : "Spot drop-off in real time",
  },
  {
    Icon: Users,
    label: isSw ? "Mazungumzo kwa wakala" : "Per-agent conversations",
    body: isSw ? "Nani anayebeba mzigo" : "Who's carrying the load",
  },
  {
    Icon: Clock,
    label: isSw ? "Wastani wa jibu & utatuzi" : "Avg response & resolution",
    body: isSw ? "Muda wa jibu la kwanza na mzunguko kamili" : "First-reply and full-cycle times",
  },
  {
    Icon: Tag,
    label: isSw ? "Matumizi ya lebo" : "Tag usage",
    body: isSw ? "Sababu kuu wateja wanapouliza" : "Top reasons customers reach out",
  },
];

const getVoiceMetrics = (
  isSw: boolean
): Array<{ Icon: typeof PhoneIncoming; label: string; body: string }> => [
  {
    Icon: PhoneIncoming,
    label: isSw ? "Idadi ya simu zinazoingia" : "Inbound call volume",
    body: isSw ? "Kwa foleni, kikundi, wakala" : "By queue, ring-group, agent",
  },
  {
    Icon: PhoneOutgoing,
    label: isSw ? "Kampeni za nje" : "Outbound campaigns",
    body: isSw ? "Zilizounganishwa, muda wa kuongea, matokeo" : "Connected, talk-time, outcomes",
  },
  {
    Icon: Clock,
    label: isSw ? "Wastani wa muda wa kushughulikia" : "Avg handle time",
    body: isSw ? "Vipimo kwa wakala na kwa foleni" : "Per-agent and per-queue benchmarks",
  },
  {
    Icon: GaugeCircle,
    label: isSw ? "Matumizi ya wakala" : "Agent utilization",
    body: isSw ? "Dakika zenye tija dhidi ya zisizo na shughuli" : "Productive vs idle minutes",
  },
  {
    Icon: PhoneMissed,
    label: isSw ? "Ripoti ya simu zilizopita" : "Missed-call report",
    body: isSw ? "Pona kabla wateja hawajaondoka" : "Recover before customers churn",
  },
  {
    Icon: Users,
    label: isSw ? "Takwimu za foleni & vikundi" : "Queue & ring-group stats",
    body: isSw ? "SLA, kiwango cha kuachwa, muda wa kungoja" : "SLA, abandon rate, wait time",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Chat dashboard mockup
// ─────────────────────────────────────────────────────────────────────────────

const ChatDashboard = ({ isSw }: { isSw: boolean }) => {
  const dayLabels = isSw
    ? ["Jt2", "Jt3", "Jt4", "Jt5", "Iju", "Jmo", "Jpi"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const volumeBars = [58, 72, 64, 88, 96, 42, 36].map((v, i) => ({
    d: dayLabels[i],
    v,
  }));

  const topAgents = [
    { name: "Asha Mwakalinga", initials: "AM", sessions: 142, sla: "94%" },
    { name: "Baraka Tumaini", initials: "BT", sessions: 128, sla: "91%" },
    { name: "Christina Ndaki", initials: "CN", sessions: 117, sla: "89%" },
    { name: "Doreen Komba", initials: "DK", sessions: 102, sla: "88%" },
    { name: "Erick Mhina", initials: "EM", sessions: 94, sla: "85%" },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50/60 to-white p-3 sm:p-4 space-y-3">
      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">
            <Filter className="h-3 w-3" /> {isSw ? "Siku 7" : "7 days"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600">
            {isSw ? "Njia zote" : "All channels"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600">
            {isSw ? "Wakala wote" : "All agents"}
          </span>
        </div>
        <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600">
          {isSw ? "Hamisha" : "Export"}
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            {isSw ? "Jumla ya vikao" : "Total sessions"}
          </p>
          <p className="mt-0.5 text-xl sm:text-2xl font-bold text-gray-900">1,284</p>
          <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
            ▲ 12.4%
          </span>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            {isSw ? "Muda wa msaada uliookolewa" : "Support time saved"}
          </p>
          <p className="mt-0.5 text-xl sm:text-2xl font-bold text-gray-900">64h</p>
          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
            {isSw ? "Imetatuliwa na Copilot" : "Copilot auto-resolved"}
          </span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-3">
        {/* Volume per weekday */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-900">
              {isSw ? "Idadi kwa siku ya wiki" : "Volume per weekday"}
            </p>
            <span className="text-[9px] text-gray-400">
              {isSw ? "mazungumzo" : "conversations"}
            </span>
          </div>
          <div className="mt-3 flex h-24 items-end justify-between gap-1.5">
            {volumeBars.map((b) => (
              <div key={b.d} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-full w-full items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-500 to-blue-400 shadow-sm"
                    style={{ height: `${b.v}%` }}
                  />
                </div>
                <span className="text-[9px] font-medium text-gray-500">{b.d}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Response rate donut */}
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[11px] font-semibold text-gray-900">
            {isSw ? "Kiwango cha jibu" : "Response rate"}
          </p>
          <div className="mt-2 flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="h-20 w-20">
              <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="#2563eb"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${0.87 * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                transform="rotate(-90 40 40)"
              />
              <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">
                87%
              </text>
            </svg>
          </div>
          <p className="mt-1 text-center text-[9px] text-gray-500">
            {isSw ? "ndani ya SLA ya sekunde 60" : "within 60s SLA"}
          </p>
        </div>
      </div>

      {/* Top agents */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-900">
            {isSw ? "Wakala 5 bora" : "Top 5 agents"}
          </p>
          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
            {isSw ? "siku 7 zilizopita" : "last 7 days"}
          </span>
        </header>
        <ul className="divide-y divide-gray-100">
          {topAgents.map((a, i) => (
            <li key={a.name} className="flex items-center gap-2 px-3 py-2 text-[11px]">
              <span className="w-3 text-[10px] font-semibold text-gray-400">{i + 1}</span>
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[9px] font-semibold text-white">
                {a.initials}
              </span>
              <p className="flex-1 truncate font-semibold text-gray-900">{a.name}</p>
              <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-700">
                {a.sessions} {isSw ? "vikao" : "sessions"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {a.sla}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Voice wallboard mockup
// ─────────────────────────────────────────────────────────────────────────────

const VoiceWallboard = ({ isSw }: { isSw: boolean }) => {
  const agents = [
    { name: "Asha M.", ext: "1102", status: "on-call", inbound: 32, outbound: 8, avgHandle: "3:42" },
    { name: "Baraka T.", ext: "1103", status: "available", inbound: 28, outbound: 12, avgHandle: "4:08" },
    { name: "Christina N.", ext: "1104", status: "wrap-up", inbound: 24, outbound: 6, avgHandle: "3:55" },
    { name: "Doreen K.", ext: "1105", status: "on-call", inbound: 22, outbound: 4, avgHandle: "5:01" },
  ];

  const statusTone: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    "on-call": { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: isSw ? "kwenye simu" : "on-call" },
    "wrap-up": { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", label: isSw ? "inakamilisha" : "wrap-up" },
    available: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", label: isSw ? "yupo" : "available" },
  };

  const queues = [
    { name: isSw ? "Mauzo" : "Sales", sla: 94, abandoned: 2 },
    { name: isSw ? "Msaada" : "Support", sla: 88, abandoned: 4 },
    { name: isSw ? "Malipo" : "Billing", sla: 91, abandoned: 1 },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50/60 to-white p-3 sm:p-4 space-y-3">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
          <p className="text-[11px] font-semibold text-gray-900">
            {isSw ? "Ubao wa sauti · Hai" : "Voice wallboard · Live"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {isSw ? "inasasishwa" : "updating"}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { label: isSw ? "Zinazoingia" : "Inbound", value: "186", tone: "from-blue-500/15", Icon: PhoneIncoming },
          { label: isSw ? "Zinazotoka" : "Outbound", value: "42", tone: "from-indigo-500/15", Icon: PhoneOutgoing },
          { label: isSw ? "Zilizopita" : "Missed", value: "3", tone: "from-rose-500/15", Icon: PhoneMissed },
          { label: isSw ? "Wastani wa kungoja" : "Avg wait", value: "0:24", tone: "from-emerald-500/15", Icon: Clock },
        ].map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3"
          >
            <div
              className={cn(
                "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent",
                k.tone
              )}
            />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                  {k.label}
                </p>
                <p className="mt-0.5 text-xl font-bold text-gray-900">{k.value}</p>
              </div>
              <k.Icon className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Queue performance */}
      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-gray-900">
            {isSw ? "Utendaji wa foleni" : "Queue performance"}
          </p>
          <span className="text-[9px] text-gray-400">
            {isSw ? "SLA · zilizoachwa" : "SLA · abandoned"}
          </span>
        </div>
        <ul className="mt-2 space-y-2">
          {queues.map((q) => (
            <li key={q.name} className="flex items-center gap-2">
              <span className="w-14 truncate text-[10px] font-semibold text-gray-700">
                {q.name}
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                    q.sla >= 90
                      ? "from-emerald-400 to-emerald-500"
                      : "from-amber-400 to-amber-500"
                  )}
                  style={{ width: `${q.sla}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-[10px] font-semibold text-gray-700">
                {q.sla}%
              </span>
              <span className="w-12 text-right text-[10px] text-rose-600">
                ✕ {q.abandoned}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Agent extension stats */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-900">
            {isSw ? "Takwimu za nyongeza" : "Extension stats"}
          </p>
          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
            {isSw ? "leo" : "today"}
          </span>
        </header>
        <ul className="divide-y divide-gray-100">
          {agents.map((a) => {
            const s = statusTone[a.status];
            return (
              <li key={a.name} className="flex items-center gap-2 px-3 py-2 text-[11px]">
                <span className="font-mono text-[10px] font-semibold text-gray-500">
                  {a.ext}
                </span>
                <p className="flex-1 truncate font-semibold text-gray-900">{a.name}</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                    s.bg,
                    s.text
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
                  {s.label}
                </span>
                <span className="hidden sm:inline rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
                  ↓ {a.inbound}
                </span>
                <span className="hidden sm:inline rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700">
                  ↑ {a.outbound}
                </span>
                <span className="font-mono text-[10px] font-semibold text-gray-700">
                  {a.avgHandle}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

const AnalyticsSection = () => {
  const lang = useContext(LanguageContext);
  const isSw = lang?.language === "sw";
  const [tab, setTab] = useState<Tab>("chat");
  const tabs = getTabs(isSw);
  const chatMetrics = getChatMetrics(isSw);
  const voiceMetrics = getVoiceMetrics(isSw);
  const metrics = tab === "chat" ? chatMetrics : voiceMetrics;

  return (
    <section
      id="analytics"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28 px-3 sm:px-4 lg:px-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-0 h-72 w-72 translate-x-1/3 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 -translate-x-1/2 translate-y-1/3 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center">
          <SectionHeader
            eyebrow={isSw ? "Ripoti & Takwimu" : "Reporting & Analytics"}
            align="center"
            title={
              isSw ? (
                <>
                  Kila mazungumzo, kila simu —{" "}
                  <span className="text-blue-600">imepimwa</span>
                </>
              ) : (
                <>
                  Every conversation, every call —{" "}
                  <span className="text-blue-600">measured</span>
                </>
              )
            }
            lead={
              isSw
                ? "Mabao ya hai, ripoti za kihistoria, na takwimu zinazoweza kuhamishwa kwa chat na sauti. Tambua mwenendo, funza wakala, thibitisha ROI."
                : "Live wallboards, historical reports, and exportable analytics across chat and voice. Spot trends, coach agents, prove ROI."
            }
          />

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label={isSw ? "Mtazamo wa takwimu" : "Analytics view"}
            className="mt-7 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm"
          >
            {tabs.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-semibold transition-all",
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <t.Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Mockup */}
          <div className="lg:col-span-7">
            <MockupFrame
              chrome="browser"
              label={
                tab === "chat"
                  ? "senda.mifumolabs.analytics"
                  : "senda.mifumolabs.voice"
              }
            >
              <div key={tab} className="animate-in fade-in duration-300">
                {tab === "chat" ? <ChatDashboard isSw={isSw} /> : <VoiceWallboard isSw={isSw} />}
              </div>
            </MockupFrame>
          </div>

          {/* Metric list */}
          <div className="lg:col-span-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              {tab === "chat"
                ? isSw
                  ? "Ripoti za chat"
                  : "Chat reports"
                : isSw
                ? "Ripoti za sauti"
                : "Voice reports"}
            </p>
            <h3 className="mt-2 font-heading text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {tab === "chat" ? (
                isSw ? (
                  <>
                    Funza timu yako kwa{" "}
                    <span className="text-blue-600">nambari za kweli</span>
                  </>
                ) : (
                  <>
                    Coach your team with{" "}
                    <span className="text-blue-600">honest numbers</span>
                  </>
                )
              ) : isSw ? (
                <>
                  Endesha foleni kama{" "}
                  <span className="text-blue-600">mdhibiti wa trafiki ya anga</span>
                </>
              ) : (
                <>
                  Run the queue like an{" "}
                  <span className="text-blue-600">air-traffic controller</span>
                </>
              )}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
              {isSw
                ? "Kila kipimo hapa chini kinapatikana kama kigae cha moja kwa moja, chati ya kihistoria, na hamishaji wa CSV."
                : "Every metric below is available as a live tile, a historical chart, and a CSV export."}
            </p>

            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {metrics.map(({ Icon, label, body }) => (
                <li
                  key={label}
                  className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white p-3"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold text-gray-900">{label}</p>
                    <p className="text-[11px] leading-relaxed text-gray-600">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalyticsSection;
