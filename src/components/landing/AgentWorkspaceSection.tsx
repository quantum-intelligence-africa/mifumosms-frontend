import {
  Headphones,
  Ear,
  MessageCircle,
  Zap,
  Shield,
  GripVertical,
  PhoneIncoming,
  PhoneCall,
  CircleDot,
  UserCheck,
  GaugeCircle,
  Tags,
  FileBarChart,
} from "lucide-react";
import { SectionHeader, FeaturePillStrip, MockupFrame } from "./shared";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

type TFn = (key: any, params?: any) => string;

const getCapabilityStrip = (t: TFn) => [
  { label: t("landing.agent_workspace.capability_role_access"), icon: <Shield className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.agent_workspace.capability_contact_matching"), icon: <UserCheck className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.agent_workspace.capability_status_management"), icon: <CircleDot className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.agent_workspace.capability_drag_transfer"), icon: <GripVertical className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.agent_workspace.capability_coaching_tools"), icon: <Headphones className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.agent_workspace.capability_missed_call_labeling"), icon: <Tags className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.agent_workspace.capability_sla_tracking"), icon: <GaugeCircle className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.agent_workspace.capability_per_agent_reports"), icon: <FileBarChart className="h-3.5 w-3.5 text-blue-600" /> },
];

const getKpis = (
  t: TFn
): Array<{
  label: string;
  value: string;
  delta?: string;
  tone: "emerald" | "blue" | "rose";
}> => [
  { label: "SLA", value: "85.16%", delta: "▲ 2.1%", tone: "emerald" },
  { label: t("landing.agent_workspace.kpi_answered"), value: "24", delta: "▲ 6", tone: "blue" },
  { label: t("landing.agent_workspace.kpi_abandoned"), value: "2", delta: "▼ 1", tone: "rose" },
];

const KPI_TONES: Record<
  "emerald" | "blue" | "rose",
  { ring: string; chip: string; chipText: string }
> = {
  emerald: {
    ring: "from-emerald-500/15 to-emerald-500/0",
    chip: "bg-emerald-50",
    chipText: "text-emerald-700",
  },
  blue: {
    ring: "from-blue-500/15 to-blue-500/0",
    chip: "bg-blue-50",
    chipText: "text-blue-700",
  },
  rose: {
    ring: "from-rose-500/15 to-rose-500/0",
    chip: "bg-rose-50",
    chipText: "text-rose-700",
  },
};

const getWaiting = (
  t: TFn
): Array<{
  caller: string;
  number: string;
  queue: string;
  wait: string;
  priority?: "vip";
}> => [
  { caller: "Mwajuma Said", number: "+255 712 345 678", queue: t("landing.common.queue_sales"), wait: "0:08", priority: "vip" },
  { caller: "Juma Kessy", number: "+255 754 442 019", queue: t("landing.common.queue_support"), wait: "0:21" },
  { caller: "Naima Omar", number: "+255 689 110 442", queue: t("landing.common.queue_billing"), wait: "0:34" },
];

const getActive = (
  t: TFn
): Array<{
  agent: string;
  initials: string;
  status: "on-call" | "wrap-up" | "available";
  duration: string;
  customer: string;
}> => [
  { agent: "Asha M.", initials: "AM", status: "on-call", duration: "04:12", customer: t("landing.agent_workspace.customer_premier_order") },
  { agent: "Baraka T.", initials: "BT", status: "wrap-up", duration: "00:48", customer: t("landing.agent_workspace.customer_kyc_followup") },
  { agent: "Christina N.", initials: "CN", status: "on-call", duration: "01:55", customer: t("landing.agent_workspace.customer_bulk_sms_quote") },
];

const getStatusMeta = (
  t: TFn
): Record<
  "on-call" | "wrap-up" | "available",
  { dot: string; bg: string; text: string; label: string }
> => ({
  "on-call": {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: t("landing.agent_workspace.status_on_call"),
  },
  "wrap-up": {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: t("landing.agent_workspace.status_wrap_up"),
  },
  available: {
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: t("landing.agent_workspace.status_available"),
  },
});

const AgentWorkspaceSection = () => {
  const { t } = useLanguage();
  const capabilityStrip = getCapabilityStrip(t);
  const kpis = getKpis(t);
  const waiting = getWaiting(t);
  const active = getActive(t);
  const statusMeta = getStatusMeta(t);

  return (
    <section
      id="agents"
      className="relative overflow-hidden bg-white py-10 sm:py-12 lg:py-14 px-3 sm:px-4 lg:px-6"
    >

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Mockup — left on desktop */}
          <div className="lg:col-span-7 order-1">
            <MockupFrame
              chrome="browser"
              label="senda.mifumolabs.supervisor"
            >
              <div className="bg-gradient-to-b from-gray-50/60 to-white p-3 sm:p-4 space-y-3">
                {/* KPI strip */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {kpis.map((k) => {
                    const tone = KPI_TONES[k.tone];
                    return (
                      <div
                        key={k.label}
                        className={cn(
                          "relative overflow-hidden rounded-xl border border-gray-200 bg-white p-3"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute inset-0 bg-gradient-to-br opacity-90",
                            tone.ring
                          )}
                        />
                        <div className="relative">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                            {k.label}
                          </p>
                          <p className="mt-0.5 text-xl sm:text-2xl font-bold text-gray-900">
                            {k.value}
                          </p>
                          {k.delta && (
                            <span
                              className={cn(
                                "mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                                tone.chip,
                                tone.chipText
                              )}
                            >
                              {k.delta}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Waiting calls */}
                <div className="rounded-xl border border-gray-200 bg-white">
                  <header className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <PhoneIncoming className="h-3.5 w-3.5 text-blue-600" />
                      <p className="text-[11px] font-semibold text-gray-900">
                        {t("landing.agent_workspace.waiting_calls")}
                      </p>
                      <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                        {waiting.length}
                      </span>
                    </div>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
                      {t("landing.agent_workspace.drag_to_assign")}
                    </span>
                  </header>
                  <ul className="divide-y divide-gray-100">
                    {waiting.map((w, i) => (
                      <li
                        key={i}
                        className="group flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-blue-50/40"
                      >
                        <GripVertical className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate font-semibold text-gray-900">
                              {w.caller}
                            </p>
                            {w.priority === "vip" && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-700">
                                VIP
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[10px] text-gray-500">
                            {w.number}
                          </p>
                        </div>
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-600">
                          {w.queue}
                        </span>
                        <span className="font-mono text-[10px] font-semibold text-gray-700">
                          {w.wait}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Active calls */}
                <div className="rounded-xl border border-gray-200 bg-white">
                  <header className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
                      <p className="text-[11px] font-semibold text-gray-900">
                        {t("landing.agent_workspace.active_calls")}
                      </p>
                    </div>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
                      {t("landing.agent_workspace.live")}
                    </span>
                  </header>
                  <ul className="divide-y divide-gray-100">
                    {active.map((a, i) => {
                      const s = statusMeta[a.status];
                      return (
                        <li
                          key={i}
                          className="flex items-center gap-2 px-3 py-2 text-[11px]"
                        >
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[10px] font-semibold text-white">
                            {a.initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900">
                              {a.agent}
                            </p>
                            <p className="truncate text-[10px] text-gray-500">
                              {a.customer}
                            </p>
                          </div>
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
                          <span className="font-mono text-[10px] font-semibold text-gray-700">
                            {a.duration}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Floating coaching toolbar */}
                <div className="pointer-events-none flex justify-end">
                  <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 shadow-lg shadow-blue-600/5">
                    <span className="px-1.5 text-[9px] font-semibold uppercase tracking-wider text-gray-500">
                      {t("landing.agent_workspace.coach_label")}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Ear className="h-3 w-3" /> {t("landing.agent_workspace.action_listen")}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <MessageCircle className="h-3 w-3" /> {t("landing.agent_workspace.action_whisper")}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700"
                    >
                      <Zap className="h-3 w-3" /> {t("landing.agent_workspace.action_barge")}
                    </button>
                  </div>
                </div>
              </div>
            </MockupFrame>
          </div>

          {/* Copy — right on desktop */}
          <div className="lg:col-span-5 order-2">
            <SectionHeader
              title={
                <>
                  {t("landing.agent_workspace.title_line1")}{" "}
                  <span className="text-blue-600">{t("landing.agent_workspace.title_line2")}</span>
                </>
              }
              lead={t("landing.agent_workspace.lead")}
            />

            <div className="mt-6 grid grid-cols-3 gap-2 max-w-sm">
              {[
                { Icon: Ear, label: t("landing.agent_workspace.action_listen") },
                { Icon: MessageCircle, label: t("landing.agent_workspace.action_whisper") },
                { Icon: Zap, label: t("landing.agent_workspace.action_barge") },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 rounded-xl border border-gray-200 bg-white px-2 py-3 text-center"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-[11px] font-semibold text-gray-800">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <FeaturePillStrip
              items={capabilityStrip}
              tone="default"
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgentWorkspaceSection;
