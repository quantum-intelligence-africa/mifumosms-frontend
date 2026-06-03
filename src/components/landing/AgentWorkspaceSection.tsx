import { useContext } from "react";
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
import { LanguageContext } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const getCapabilityStrip = (isSw: boolean) => [
  { label: isSw ? "Ufikiaji wa majukumu" : "Role-based access", icon: <Shield className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Ulinganishaji wa mawasiliano" : "Auto contact matching", icon: <UserCheck className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Usimamizi wa hali" : "Status management", icon: <CircleDot className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Hamisha kwa kuburuza" : "Drag-drop transfer", icon: <GripVertical className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Zana za mafunzo" : "Coaching tools", icon: <Headphones className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Lebo za simu zilizopita" : "Missed-call labeling", icon: <Tags className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Ufuatiliaji wa SLA" : "SLA tracking", icon: <GaugeCircle className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Ripoti kwa wakala" : "Per-agent reports", icon: <FileBarChart className="h-3.5 w-3.5 text-blue-600" /> },
];

const getKpis = (
  isSw: boolean
): Array<{
  label: string;
  value: string;
  delta?: string;
  tone: "emerald" | "blue" | "rose";
}> => [
  { label: "SLA", value: "85.16%", delta: "▲ 2.1%", tone: "emerald" },
  { label: isSw ? "Zilijibiwa" : "Answered", value: "24", delta: "▲ 6", tone: "blue" },
  { label: isSw ? "Zilikataliwa" : "Abandoned", value: "2", delta: "▼ 1", tone: "rose" },
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
  isSw: boolean
): Array<{
  caller: string;
  number: string;
  queue: string;
  wait: string;
  priority?: "vip";
}> => [
  { caller: "Mwajuma Said", number: "+255 712 345 678", queue: isSw ? "Mauzo" : "Sales", wait: "0:08", priority: "vip" },
  { caller: "Juma Kessy", number: "+255 754 442 019", queue: isSw ? "Msaada" : "Support", wait: "0:21" },
  { caller: "Naima Omar", number: "+255 689 110 442", queue: isSw ? "Malipo" : "Billing", wait: "0:34" },
];

const getActive = (
  isSw: boolean
): Array<{
  agent: string;
  initials: string;
  status: "on-call" | "wrap-up" | "available";
  duration: string;
  customer: string;
}> => [
  { agent: "Asha M.", initials: "AM", status: "on-call", duration: "04:12", customer: isSw ? "Premier · Oda #4821" : "Premier · Order #4821" },
  { agent: "Baraka T.", initials: "BT", status: "wrap-up", duration: "00:48", customer: isSw ? "Msaada · Ufuatiliaji wa KYC" : "Support · KYC follow-up" },
  { agent: "Christina N.", initials: "CN", status: "on-call", duration: "01:55", customer: isSw ? "Mauzo · Nukuu ya SMS" : "Sales · Bulk SMS quote" },
];

const getStatusMeta = (
  isSw: boolean
): Record<
  "on-call" | "wrap-up" | "available",
  { dot: string; bg: string; text: string; label: string }
> => ({
  "on-call": {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    label: isSw ? "Kwenye simu" : "On call",
  },
  "wrap-up": {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    label: isSw ? "Inakamilisha" : "Wrap-up",
  },
  available: {
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: isSw ? "Yupo" : "Available",
  },
});

const AgentWorkspaceSection = () => {
  const lang = useContext(LanguageContext);
  const isSw = lang?.language === "sw";
  const capabilityStrip = getCapabilityStrip(isSw);
  const kpis = getKpis(isSw);
  const waiting = getWaiting(isSw);
  const active = getActive(isSw);
  const statusMeta = getStatusMeta(isSw);

  return (
    <section
      id="agents"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28 px-3 sm:px-4 lg:px-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-100/60 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
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
                        {isSw ? "Simu zinazongoja" : "Waiting calls"}
                      </p>
                      <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                        {waiting.length}
                      </span>
                    </div>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
                      {isSw ? "Buruza kuhamisha" : "Drag to assign"}
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
                        {isSw ? "Simu zinazoendelea" : "Active calls"}
                      </p>
                    </div>
                    <span className="text-[9px] font-medium uppercase tracking-wider text-gray-400">
                      {isSw ? "Moja kwa moja" : "Live"}
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
                      {isSw ? "Funza" : "Coach"}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Ear className="h-3 w-3" /> {isSw ? "Sikiliza" : "Listen"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <MessageCircle className="h-3 w-3" /> {isSw ? "Nong'oneza" : "Whisper"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700"
                    >
                      <Zap className="h-3 w-3" /> {isSw ? "Ingia" : "Barge"}
                    </button>
                  </div>
                </div>
              </div>
            </MockupFrame>
          </div>

          {/* Copy — right on desktop */}
          <div className="lg:col-span-5 order-2">
            <SectionHeader
              eyebrow={isSw ? "Usimamizi wa Wakala" : "Agent Management"}
              title={
                isSw ? (
                  <>
                    Wapeni wasimamizi macho ya x-ray.{" "}
                    <span className="text-blue-600">Wapeni wakala nguvu kuu.</span>
                  </>
                ) : (
                  <>
                    Give supervisors x-ray vision.{" "}
                    <span className="text-blue-600">Give agents superpowers.</span>
                  </>
                )
              }
              lead={
                isSw
                  ? "Foleni za wakati halisi, ugawaji wa simu kwa kuburuza, na mafunzo ya moja kwa moja — sikiliza, nong'oneza, au ingia — vyote kutoka kwenye eneo moja la majukumu."
                  : "Real-time queues, drag-and-drop call distribution, and live coaching — listen, whisper, or barge in — all from one role-based workspace."
              }
            />

            <div className="mt-6 grid grid-cols-3 gap-2 max-w-sm">
              {[
                { Icon: Ear, label: isSw ? "Sikiliza" : "Listen" },
                { Icon: MessageCircle, label: isSw ? "Nong'oneza" : "Whisper" },
                { Icon: Zap, label: isSw ? "Ingia" : "Barge" },
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
