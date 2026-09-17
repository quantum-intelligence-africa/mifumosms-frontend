import { useState } from "react";
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
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

type Tab = "chat" | "voice";
type TFn = (key: any, params?: any) => string;

const getTabs = (
  t: TFn
): Array<{ id: Tab; label: string; Icon: typeof MessageSquare }> => [
  { id: "chat", label: t("landing.analytics.tab_chat"), Icon: MessageSquare },
  { id: "voice", label: t("landing.analytics.tab_voice"), Icon: PhoneCall },
];

const getChatMetrics = (
  t: TFn
): Array<{ Icon: typeof Inbox; label: string; body: string }> => [
  {
    Icon: Inbox,
    label: t("landing.analytics.chat_metric_open_tickets"),
    body: t("landing.analytics.chat_metric_open_tickets_body"),
  },
  {
    Icon: TrendingUp,
    label: t("landing.analytics.chat_metric_conversations_over_time"),
    body: t("landing.analytics.chat_metric_conversations_over_time_body"),
  },
  {
    Icon: GaugeCircle,
    label: t("landing.analytics.chat_metric_resolved_vs_unresolved"),
    body: t("landing.analytics.chat_metric_resolved_vs_unresolved_body"),
  },
  {
    Icon: Users,
    label: t("landing.analytics.chat_metric_per_agent"),
    body: t("landing.analytics.chat_metric_per_agent_body"),
  },
  {
    Icon: Clock,
    label: t("landing.analytics.chat_metric_avg_response"),
    body: t("landing.analytics.chat_metric_avg_response_body"),
  },
  {
    Icon: Tag,
    label: t("landing.analytics.chat_metric_tag_usage"),
    body: t("landing.analytics.chat_metric_tag_usage_body"),
  },
];

const getVoiceMetrics = (
  t: TFn
): Array<{ Icon: typeof PhoneIncoming; label: string; body: string }> => [
  {
    Icon: PhoneIncoming,
    label: t("landing.analytics.voice_metric_inbound_volume"),
    body: t("landing.analytics.voice_metric_inbound_volume_body"),
  },
  {
    Icon: PhoneOutgoing,
    label: t("landing.analytics.voice_metric_outbound_campaigns"),
    body: t("landing.analytics.voice_metric_outbound_campaigns_body"),
  },
  {
    Icon: Clock,
    label: t("landing.analytics.voice_metric_avg_handle_time"),
    body: t("landing.analytics.voice_metric_avg_handle_time_body"),
  },
  {
    Icon: GaugeCircle,
    label: t("landing.analytics.voice_metric_agent_utilization"),
    body: t("landing.analytics.voice_metric_agent_utilization_body"),
  },
  {
    Icon: PhoneMissed,
    label: t("landing.analytics.voice_metric_missed_call_report"),
    body: t("landing.analytics.voice_metric_missed_call_report_body"),
  },
  {
    Icon: Users,
    label: t("landing.analytics.voice_metric_queue_stats"),
    body: t("landing.analytics.voice_metric_queue_stats_body"),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Chat dashboard mockup
// ─────────────────────────────────────────────────────────────────────────────

const ChatDashboard = ({ t }: { t: TFn }) => {
  const dayLabels = [
    t("landing.common.day_mon"),
    t("landing.common.day_tue"),
    t("landing.common.day_wed"),
    t("landing.common.day_thu"),
    t("landing.common.day_fri"),
    t("landing.common.day_sat"),
    t("landing.common.day_sun"),
  ];
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
            <Filter className="h-3 w-3" /> {t("landing.analytics.filter_7_days")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600">
            {t("landing.analytics.filter_all_channels")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600">
            {t("landing.analytics.filter_all_agents")}
          </span>
        </div>
        <button className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600">
          {t("landing.analytics.export")}
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            {t("landing.analytics.total_sessions")}
          </p>
          <p className="mt-0.5 text-xl sm:text-2xl font-bold text-gray-900">1,284</p>
          <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
            ▲ 12.4%
          </span>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
            {t("landing.analytics.support_time_saved")}
          </p>
          <p className="mt-0.5 text-xl sm:text-2xl font-bold text-gray-900">64h</p>
          <span className="mt-1 inline-flex rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700">
            {t("landing.analytics.copilot_auto_resolved")}
          </span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-3">
        {/* Volume per weekday */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gray-900">
              {t("landing.analytics.volume_per_weekday")}
            </p>
            <span className="text-[9px] text-gray-400">
              {t("landing.analytics.conversations_unit")}
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
            {t("landing.analytics.response_rate")}
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
            {t("landing.analytics.within_60s_sla")}
          </p>
        </div>
      </div>

      {/* Top agents */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <header className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-900">
            {t("landing.analytics.top_5_agents")}
          </p>
          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
            {t("landing.analytics.last_7_days")}
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
                {a.sessions} {t("landing.analytics.sessions_unit")}
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

const VoiceWallboard = ({ t }: { t: TFn }) => {
  const agents = [
    { name: "Asha M.", ext: "1102", status: "on-call", inbound: 32, outbound: 8, avgHandle: "3:42" },
    { name: "Baraka T.", ext: "1103", status: "available", inbound: 28, outbound: 12, avgHandle: "4:08" },
    { name: "Christina N.", ext: "1104", status: "wrap-up", inbound: 24, outbound: 6, avgHandle: "3:55" },
    { name: "Doreen K.", ext: "1105", status: "on-call", inbound: 22, outbound: 4, avgHandle: "5:01" },
  ];

  const statusTone: Record<string, { dot: string; bg: string; text: string; label: string }> = {
    "on-call": { dot: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", label: t("landing.agent_workspace.status_on_call") },
    "wrap-up": { dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", label: t("landing.agent_workspace.status_wrap_up") },
    available: { dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700", label: t("landing.agent_workspace.status_available") },
  };

  const queues = [
    { name: t("landing.common.queue_sales"), sla: 94, abandoned: 2 },
    { name: t("landing.common.queue_support"), sla: 88, abandoned: 4 },
    { name: t("landing.common.queue_billing"), sla: 91, abandoned: 1 },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50/60 to-white p-3 sm:p-4 space-y-3">
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
          <p className="text-[11px] font-semibold text-gray-900">
            {t("landing.analytics.voice_wallboard_live")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          {t("landing.analytics.updating")}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
        {[
          { label: t("landing.analytics.kpi_inbound"), value: "186", tone: "from-blue-500/15", Icon: PhoneIncoming },
          { label: t("landing.analytics.kpi_outbound"), value: "42", tone: "from-indigo-500/15", Icon: PhoneOutgoing },
          { label: t("landing.analytics.kpi_missed"), value: "3", tone: "from-rose-500/15", Icon: PhoneMissed },
          { label: t("landing.analytics.kpi_avg_wait"), value: "0:24", tone: "from-emerald-500/15", Icon: Clock },
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
            {t("landing.analytics.queue_performance")}
          </p>
          <span className="text-[9px] text-gray-400">
            {t("landing.analytics.sla_abandoned")}
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
            {t("landing.analytics.extension_stats")}
          </p>
          <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
            {t("landing.analytics.today")}
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
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("chat");
  const tabs = getTabs(t);
  const chatMetrics = getChatMetrics(t);
  const voiceMetrics = getVoiceMetrics(t);
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
            eyebrow={t("landing.analytics.eyebrow")}
            align="center"
            title={
              <>
                {t("landing.analytics.title_line1")}{" "}
                <span className="text-blue-600">{t("landing.analytics.title_line2")}</span>
              </>
            }
            lead={t("landing.analytics.lead")}
          />

          {/* Tab switcher */}
          <div
            role="tablist"
            aria-label={t("landing.analytics.view_aria")}
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
                {tab === "chat" ? <ChatDashboard t={t} /> : <VoiceWallboard t={t} />}
              </div>
            </MockupFrame>
          </div>

          {/* Metric list */}
          <div className="lg:col-span-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              {tab === "chat"
                ? t("landing.analytics.chat_reports_eyebrow")
                : t("landing.analytics.voice_reports_eyebrow")}
            </p>
            <h3 className="mt-2 font-heading text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {tab === "chat" ? (
                <>
                  {t("landing.analytics.chat_reports_title_line1")}{" "}
                  <span className="text-blue-600">{t("landing.analytics.chat_reports_title_line2")}</span>
                </>
              ) : (
                <>
                  {t("landing.analytics.voice_reports_title_line1")}{" "}
                  <span className="text-blue-600">{t("landing.analytics.voice_reports_title_line2")}</span>
                </>
              )}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-gray-600">
              {t("landing.analytics.metric_list_lead")}
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
