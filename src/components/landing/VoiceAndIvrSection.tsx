import { useContext } from "react";
import {
  Phone,
  PhoneCall,
  MicOff,
  Pause,
  PhoneForwarded,
  Users,
  Voicemail,
  Music2,
  Megaphone,
  Bell,
  Star,
  Code2,
} from "lucide-react";
import { SectionHeader, FeaturePillStrip } from "./shared";
import { LanguageContext } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const getCapabilityStrip = (isSw: boolean) => [
  { label: isSw ? "Ujumbe wa sauti" : "Voicemail", icon: <Voicemail className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Muziki wakati wa kungoja" : "Music on hold", icon: <Music2 className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Salamu ya kiotomatiki" : "Auto greeting", icon: <Megaphone className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Mwito wa kurudi" : "Queue callbacks", icon: <Bell className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Ibukio la CRM" : "CRM popup", icon: <Users className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "CSAT baada ya simu" : "Post-call CSAT", icon: <Star className="h-3.5 w-3.5 text-blue-600" /> },
  { label: isSw ? "Muunganiko wa API" : "API integration", icon: <Code2 className="h-3.5 w-3.5 text-blue-600" /> },
];

const getPillarFeatures = (
  isSw: boolean
): Record<"routing" | "telephony" | "surveys", string[]> => ({
  routing: isSw
    ? [
        "Mgawanyo wa simu wa kiotomatiki",
        "Menyu za IVR za viwango vingi",
        "Foleni za kipaumbele kwa ujuzi",
        "Mwito wa kurudi unaposhughulika",
      ]
    : [
        "Automatic Call Distribution",
        "Multi-level IVR menus",
        "Skills-based priority queues",
        "Callback on busy",
      ],
  telephony: isSw
    ? [
        "Kushikilia · Nyamazisha · Hamisha · Mkutano",
        "Kurekodi & ufuatiliaji wa simu",
        "Msaada wa SIP & FXO",
        "Simu ya meza, ya mkononi & wavuti",
      ]
    : [
        "Hold · Mute · Transfer · Conference",
        "Call recording & monitoring",
        "SIP & FXO support",
        "Deskphone, mobile & web",
      ],
  surveys: isSw
    ? [
        "Uchunguzi wa sauti wa kiotomatiki",
        "Kurekodi & utafsiri",
        "Mpigaji wa kampeni za nje",
        "Maelekezo ya lugha nyingi",
      ]
    : [
        "Automated voice surveys",
        "Recording & transcription",
        "Outbound campaign dialer",
        "Multilingual prompts",
      ],
});

// ─────────────────────────────────────────────────────────────────────────────
// Visual asides — custom SVG / HTML mockups (no images)
// ─────────────────────────────────────────────────────────────────────────────

const IvrTreeVisual = ({ isSw }: { isSw: boolean }) => (
  <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-blue-50/30 px-4 py-4">
    <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="ivrLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path d="M160 42 V 80 H 60 V 110" fill="none" stroke="url(#ivrLine)" strokeWidth="1.5" />
      <path d="M160 42 V 80 H 160 V 110" fill="none" stroke="url(#ivrLine)" strokeWidth="1.5" />
      <path d="M160 42 V 80 H 260 V 110" fill="none" stroke="url(#ivrLine)" strokeWidth="1.5" />

      <g>
        <rect x="105" y="14" width="110" height="28" rx="14" fill="#2563eb" />
        <text x="160" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill="white">
          {isSw ? "Simu inayoingia" : "Incoming call"}
        </text>
      </g>

      {[
        { x: 12, label: isSw ? "Mauzo" : "Sales", tone: "#3b82f6" },
        { x: 112, label: isSw ? "Msaada" : "Support", tone: "#0ea5e9" },
        { x: 212, label: isSw ? "Malipo" : "Billing", tone: "#6366f1" },
      ].map((leaf) => (
        <g key={leaf.label}>
          <rect
            x={leaf.x}
            y="110"
            width="96"
            height="26"
            rx="13"
            fill="white"
            stroke={leaf.tone}
            strokeWidth="1.5"
          />
          <circle cx={leaf.x + 14} cy="123" r="3" fill={leaf.tone} />
          <text x={leaf.x + 26} y="127" fontSize="11" fontWeight="600" fill="#0f172a">
            {leaf.label}
          </text>
        </g>
      ))}

      {[
        { cx: 60, cy: 162 },
        { cx: 160, cy: 162 },
        { cx: 260, cy: 162 },
      ].map((d, i) => (
        <g key={i}>
          <line
            x1={d.cx}
            y1="138"
            x2={d.cx}
            y2={d.cy - 6}
            stroke="#cbd5e1"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle cx={d.cx - 8} cy={d.cy} r="4" fill="#22c55e" />
          <circle cx={d.cx} cy={d.cy} r="4" fill="#22c55e" />
          <circle cx={d.cx + 8} cy={d.cy} r="4" fill="#94a3b8" />
        </g>
      ))}
    </svg>
  </div>
);

const SoftphoneVisual = ({ isSw }: { isSw: boolean }) => (
  <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-5 py-4 text-white">
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {isSw ? "Kwenye simu · 02:41" : "On call · 02:41"}
      </span>
      <span className="text-[10px] text-gray-400">SIP · TZ-DAR-01</span>
    </div>

    <div className="mt-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-semibold">
        FM
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">Fatuma Mwakalinga</p>
        <p className="truncate text-[11px] text-gray-400">
          +255 754 118 220 · {isSw ? "Mteja wa Premier" : "Premier customer"}
        </p>
      </div>
    </div>

    <div className="mt-4 flex items-center justify-between">
      {[
        { Icon: MicOff, label: isSw ? "Nyamaza" : "Mute" },
        { Icon: Pause, label: isSw ? "Shikilia" : "Hold" },
        { Icon: PhoneForwarded, label: isSw ? "Hamisha" : "Transfer" },
        { Icon: Users, label: isSw ? "Mkutano" : "Conf." },
      ].map(({ Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-1 text-gray-300">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[9px] font-medium">{label}</span>
        </div>
      ))}
    </div>

    <div className="mt-4 flex items-center justify-center">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500 shadow-[0_4px_14px_-4px_rgba(239,68,68,0.7)]">
        <PhoneCall className="h-4 w-4 -rotate-[135deg]" />
      </span>
    </div>
  </div>
);

const SentimentVisual = ({ isSw }: { isSw: boolean }) => {
  const dayLabels = isSw
    ? ["Jt2", "Jt3", "Jt4", "Jt5", "Iju", "Jmo", "Jpi"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const values = [62, 78, 54, 86, 40, 70, 58];
  const tones = [
    "from-emerald-400 to-emerald-500",
    "from-emerald-400 to-emerald-500",
    "from-amber-400 to-amber-500",
    "from-emerald-400 to-emerald-500",
    "from-rose-400 to-rose-500",
    "from-emerald-400 to-emerald-500",
    "from-amber-400 to-amber-500",
  ];

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-gray-700">
          {isSw ? "CSAT ya sauti · siku 7 zilizopita" : "Voice CSAT · last 7 days"}
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
          ▲ +6.4%
        </span>
      </div>

      <div className="mt-4 flex h-28 items-end justify-between gap-1.5">
        {dayLabels.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-full w-full items-end">
              <div
                className={cn("w-full rounded-t-md bg-gradient-to-t shadow-sm", tones[i])}
                style={{ height: `${values[i]}%` }}
                aria-label={`${label} ${values[i]}%`}
              />
            </div>
            <span className="text-[9px] font-medium text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-end gap-3 text-[9px] text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {isSw ? "Chanya" : "Positive"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {isSw ? "Wastani" : "Neutral"}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          {isSw ? "Hasi" : "Negative"}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Pillar card
// ─────────────────────────────────────────────────────────────────────────────

interface PillarProps {
  index: number;
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  visual: React.ReactNode;
}

const Pillar = ({
  index,
  eyebrow,
  title,
  description,
  features,
  visual,
}: PillarProps) => (
  <article className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_40px_-20px_rgba(37,99,235,0.25)]">
    <div className="absolute -top-3 left-5 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-600 px-2 text-[10px] font-bold text-white">
      0{index}
    </div>

    {visual}

    <div className="mt-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-600">
        {eyebrow}
      </p>
      <h3 className="mt-1 font-heading text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
    </div>

    <ul className="mt-4 space-y-2 border-t border-gray-100 pt-4">
      {features.map((f) => (
        <li
          key={f}
          className="flex items-start gap-2 text-[13px] leading-snug text-gray-700"
        >
          <span className="mt-1 inline-flex h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
          {f}
        </li>
      ))}
    </ul>
  </article>
);

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

const VoiceAndIvrSection = () => {
  const lang = useContext(LanguageContext);
  const isSw = lang?.language === "sw";
  const pillarFeatures = getPillarFeatures(isSw);
  const capabilityStrip = getCapabilityStrip(isSw);

  return (
    <section
      id="voice"
      className="relative overflow-hidden bg-gray-50 py-20 sm:py-24 lg:py-28 px-3 sm:px-4 lg:px-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/3 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-56 w-56 translate-y-1/3 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center">
          <SectionHeader
            eyebrow={isSw ? "Sauti & IVR" : "Voice & IVR"}
            align="center"
            title={
              isSw ? (
                <>
                  Sauti ya kisasa kwa{" "}
                  <span className="text-blue-600">vituo vya simu vya kisasa</span>
                </>
              ) : (
                <>
                  Modern voice for{" "}
                  <span className="text-blue-600">modern call centers</span>
                </>
              )
            }
            lead={
              isSw
                ? "PBX kamili kwenye wingu — mwelekeo wa busara, mafunzo ya wakati halisi, na kampeni za nje, vyote vinavyoendeshwa kwenye namba ile ile ambayo wateja wako tayari wanaijua."
                : "A full PBX in the cloud — smart routing, live coaching, and outbound campaigns, all running on the same number your customers already know."
            }
          />

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm">
            <Phone className="h-3.5 w-3.5 text-blue-600" />
            SIP · FXO · WebRTC · {isSw ? "Mkononi" : "Mobile"} · {isSw ? "Meza" : "Desk"}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-7">
          <Pillar
            index={1}
            eyebrow={isSw ? "Mwelekeo" : "Routing"}
            title={isSw ? "Mwelekeo wa Simu wa Busara" : "Smart Call Routing"}
            description={
              isSw
                ? "Kila simu inafika kwa wakala sahihi mara ya kwanza — hakuna mizunguko ya menyu, hakuna foleni zinazoanguka."
                : "Every call lands on the right agent the first time — no menu mazes, no dropped queues."
            }
            features={pillarFeatures.routing}
            visual={<IvrTreeVisual isSw={isSw} />}
          />
          <Pillar
            index={2}
            eyebrow={isSw ? "Simu" : "Telephony"}
            title={isSw ? "Mfumo Kamili wa Simu" : "Full Telephony Suite"}
            description={
              isSw
                ? "PBX ya wingu ambayo timu yako inataka kuitumia — softphone, simu ya meza au ya mkononi, login moja."
                : "A cloud PBX your team actually wants to use — softphone, deskphone or mobile, same login."
            }
            features={pillarFeatures.telephony}
            visual={<SoftphoneVisual isSw={isSw} />}
          />
          <Pillar
            index={3}
            eyebrow={isSw ? "Nje & maarifa" : "Outbound & insights"}
            title={isSw ? "Uchunguzi wa Sauti & Kampeni za Nje" : "Voice Surveys & Outbound"}
            description={
              isSw
                ? "Kampeni za kupiga kiotomatiki na uchunguzi baada ya simu — zilizorekodiwa, kutafsiriwa, na tayari kufundisha."
                : "Auto-dial campaigns and post-call surveys — recorded, transcribed, and ready to coach on."
            }
            features={pillarFeatures.surveys}
            visual={<SentimentVisual isSw={isSw} />}
          />
        </div>

        <div className="mt-12 flex flex-col items-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            {isSw ? "Pia zinajumuishwa" : "Also included"}
          </p>
          <FeaturePillStrip
            items={capabilityStrip}
            tone="default"
            className="mt-3 justify-center"
          />
        </div>
      </div>
    </section>
  );
};

export default VoiceAndIvrSection;
