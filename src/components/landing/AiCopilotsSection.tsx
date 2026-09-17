import {
  Bot,
  Brain,
  FileText,
  Globe2,
  MessageSquare,
  Languages,
  Workflow,
  Clock3,
  Image as ImageIcon,
  CheckCheck,
} from "lucide-react";
import { SectionHeader, FeaturePillStrip } from "./shared";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

type TFn = (key: any, params?: any) => string;

const getCapabilityStrip = (t: TFn) => [
  { label: t("landing.ai_copilots.capability_genai"), icon: <Bot className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.ai_copilots.capability_kb_fed"), icon: <Brain className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.ai_copilots.capability_rich_media"), icon: <ImageIcon className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.ai_copilots.capability_multilanguage"), icon: <Languages className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.ai_copilots.capability_workflow_mapping"), icon: <Workflow className="h-3.5 w-3.5 text-blue-600" /> },
  { label: t("landing.ai_copilots.capability_round_the_clock"), icon: <Clock3 className="h-3.5 w-3.5 text-blue-600" /> },
];

const getKpis = (
  t: TFn
): Array<{
  value: string;
  label: string;
  caption: string;
  tone: "blue" | "emerald" | "indigo";
}> => [
  {
    value: "−45%",
    label: t("landing.ai_copilots.kpi_wait_time_label"),
    caption: t("landing.ai_copilots.kpi_wait_time_caption"),
    tone: "blue",
  },
  {
    value: "−25%",
    label: t("landing.ai_copilots.kpi_live_agent_volume_label"),
    caption: t("landing.ai_copilots.kpi_live_agent_volume_caption"),
    tone: "emerald",
  },
  {
    value: "+2",
    label: t("landing.ai_copilots.kpi_nps_label"),
    caption: t("landing.ai_copilots.kpi_nps_caption"),
    tone: "indigo",
  },
];

const KPI_TONES: Record<
  "blue" | "emerald" | "indigo",
  { halo: string; chip: string; chipText: string }
> = {
  blue: {
    halo: "from-blue-500/15 via-blue-500/5 to-transparent",
    chip: "bg-blue-50",
    chipText: "text-blue-700",
  },
  emerald: {
    halo: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    chip: "bg-emerald-50",
    chipText: "text-emerald-700",
  },
  indigo: {
    halo: "from-indigo-500/15 via-indigo-500/5 to-transparent",
    chip: "bg-indigo-50",
    chipText: "text-indigo-700",
  },
};

const CHAT: Array<{
  from: "them" | "bot";
  text: string;
  time: string;
  meta?: "typing" | "handoff";
}> = [
  { from: "them", text: "Habari, je naweza kufungua akaunti ya biashara online?", time: "09:14" },
  {
    from: "bot",
    text: "Karibu! Ndiyo — unaweza kufungua akaunti ya biashara ndani ya dakika 5. Unahitaji TIN, kitambulisho cha mkurugenzi, na nambari ya simu.",
    time: "09:14",
  },
  { from: "them", text: "Naomba link ya kuanza", time: "09:15" },
  {
    from: "bot",
    text: "Hapa ni link: senda.africa/onboarding · Nikusaidie kujaza fomu pamoja nawe?",
    time: "09:15",
  },
  { from: "them", text: "Ndio tafadhali", time: "09:15" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phone mockup with WhatsApp-style chatbot conversation
// ─────────────────────────────────────────────────────────────────────────────

const ChatbotPhone = ({ t }: { t: TFn }) => (
  <div className="relative mx-auto w-full max-w-[300px]">
    <div className="relative aspect-[9/19] overflow-hidden rounded-[2.25rem] border-[6px] border-gray-900 bg-[#ECE5DD] shadow-[0_30px_60px_-20px_rgba(15,23,42,0.4)]">
      {/* Notch */}
      <div className="absolute left-1/2 top-0 z-20 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-gray-900" />

      {/* WhatsApp header */}
      <div className="relative z-10 flex items-center gap-2 bg-[#075E54] px-3 pb-2 pt-6 text-white">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
          <Bot className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold">Senda Copilot</p>
          <p className="truncate text-[9px] text-white/70">
            {t("landing.ai_copilots.chat_status")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-100">
          AI
        </span>
      </div>

      {/* Chat area */}
      <div className="relative h-full space-y-2 overflow-hidden px-2.5 py-3">
        {CHAT.map((m, i) => (
          <div
            key={i}
            className={cn("flex", m.from === "them" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "relative max-w-[80%] rounded-lg px-2 py-1.5 text-[10px] leading-snug shadow-sm",
                m.from === "them"
                  ? "rounded-tr-sm bg-[#DCF8C6] text-gray-900"
                  : "rounded-tl-sm bg-white text-gray-900"
              )}
            >
              <p>{m.text}</p>
              <div
                className={cn(
                  "mt-0.5 flex items-center justify-end gap-0.5 text-[8px] text-gray-500",
                  m.from === "them" && "text-gray-600/70"
                )}
              >
                {m.time}
                {m.from === "them" && (
                  <CheckCheck className="h-2.5 w-2.5 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <div className="flex justify-start">
          <div className="inline-flex items-center gap-1 rounded-lg rounded-tl-sm bg-white px-2 py-1.5 shadow-sm">
            <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400 [animation-delay:150ms]" />
            <span className="h-1 w-1 animate-pulse rounded-full bg-gray-400 [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>

  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Knowledge-base "drop zone" → brain illustration
// ─────────────────────────────────────────────────────────────────────────────

const getSources = (
  t: TFn
): Array<{
  Icon: typeof FileText;
  label: string;
  meta: string;
  tone: string;
}> => [
  { Icon: FileText, label: t("landing.ai_copilots.source_product_pdf"), meta: t("landing.ai_copilots.source_product_pdf_meta"), tone: "bg-rose-50 text-rose-600" },
  { Icon: Globe2, label: t("landing.ai_copilots.source_website"), meta: t("landing.ai_copilots.source_website_meta"), tone: "bg-blue-50 text-blue-600" },
  { Icon: MessageSquare, label: t("landing.ai_copilots.source_faq_doc"), meta: t("landing.ai_copilots.source_faq_doc_meta"), tone: "bg-emerald-50 text-emerald-600" },
  { Icon: Workflow, label: t("landing.ai_copilots.source_workflows"), meta: t("landing.ai_copilots.source_workflows_meta"), tone: "bg-indigo-50 text-indigo-600" },
];

const KnowledgeBaseBlock = ({ t }: { t: TFn }) => {
  const sources = getSources(t);
  return (
    <div className="relative grid grid-cols-1 items-center gap-6 rounded-2xl border border-white/70 bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/40 p-5 sm:p-7 shadow-[0_15px_40px_-15px_rgba(37,99,235,0.18)] backdrop-blur-sm md:grid-cols-12">
      {/* Sources */}
      <div className="md:col-span-5 space-y-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
          {t("landing.ai_copilots.kb_step1_eyebrow")}
        </p>
        <h3 className="font-heading text-xl font-bold text-gray-900">
          {t("landing.ai_copilots.kb_step1_title")}
        </h3>
        <p className="text-sm leading-relaxed text-gray-600">
          {t("landing.ai_copilots.kb_step1_body")}
        </p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {sources.map(({ Icon, label, meta, tone }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2"
            >
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tone)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-gray-900">{label}</p>
                <p className="truncate text-[9px] text-gray-500">{meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Flow → Brain */}
      <div className="relative md:col-span-7">
        <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/50">
          <svg viewBox="0 0 480 220" className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="kbFlow" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
                <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {[40, 90, 140, 190].map((y, i) => (
              <path
                key={i}
                d={`M 30 ${y} C 180 ${y}, 240 110, 360 110`}
                fill="none"
                stroke="url(#kbFlow)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="4 6"
                opacity={0.7 - i * 0.1}
              />
            ))}
          </svg>

          {/* Brain target */}
          <div className="relative z-10 ml-auto mr-6 flex flex-col items-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-[0_15px_40px_-10px_rgba(37,99,235,0.55)]">
              <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/40 [animation-duration:2.5s]" />
              <Brain className="relative h-10 w-10" />
            </div>
            <p className="mt-2 text-[11px] font-bold text-gray-900">
              {t("landing.ai_copilots.kb_brain_title")}
            </p>
            <p className="text-[9px] text-gray-500">
              {t("landing.ai_copilots.kb_brain_subtitle")}
            </p>
          </div>

          {/* Source pins */}
          <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
            <FileText className="h-3 w-3 text-rose-600" /> PDF
          </div>
          <div className="absolute left-3 top-12 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
            <Globe2 className="h-3 w-3 text-blue-600" /> {t("landing.ai_copilots.kb_pin_site")}
          </div>
          <div className="absolute bottom-12 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
            <MessageSquare className="h-3 w-3 text-emerald-600" /> FAQ
          </div>
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-sm">
            <Workflow className="h-3 w-3 text-indigo-600" /> {t("landing.ai_copilots.kb_pin_flows")}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────────────────────

const AiCopilotsSection = () => {
  const { t } = useLanguage();
  const capabilityStrip = getCapabilityStrip(t);
  const kpis = getKpis(t);

  return (
    <section
      id="ai"
      className="relative overflow-hidden bg-gradient-to-br from-blue-100 via-blue-50/80 to-indigo-100 py-20 sm:py-24 lg:py-28 px-3 sm:px-4 lg:px-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-300/40 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-72 w-72 translate-y-1/3 rounded-full bg-indigo-300/40 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center">
          <SectionHeader
            eyebrow={t("landing.ai_copilots.eyebrow")}
            align="center"
            title={
              <>
                {t("landing.ai_copilots.title_line1")}{" "}
                <span className="text-blue-600">{t("landing.ai_copilots.title_line2")}</span>
              </>
            }
            lead={t("landing.ai_copilots.lead")}
          />
        </div>

        {/* KPI ribbon */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {kpis.map((k) => {
            const tone = KPI_TONES[k.tone];
            return (
              <div
                key={k.label}
                className="relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white via-blue-50/40 to-white p-5 sm:p-6 shadow-[0_10px_30px_-12px_rgba(37,99,235,0.18)] backdrop-blur-sm"
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br",
                    tone.halo
                  )}
                />
                <div className="relative">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      tone.chip,
                      tone.chipText
                    )}
                  >
                    {k.label}
                  </span>
                  <p className="mt-3 font-heading text-4xl sm:text-5xl font-bold text-gray-900 leading-none">
                    {k.value}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {k.caption}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chatbot mockup + capability list */}
        <div className="mt-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <ChatbotPhone t={t} />
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
              {t("landing.ai_copilots.live_channel_eyebrow")}
            </p>
            <h3 className="mt-2 font-heading text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              <>
                {t("landing.ai_copilots.conversations_title_line1")}{" "}
                <span className="text-blue-600">{t("landing.ai_copilots.conversations_title_line2")}</span>
              </>
            </h3>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              {t("landing.ai_copilots.conversations_body")}
            </p>

            <ul className="mt-6 space-y-3">
              {[
                { Icon: Bot, title: t("landing.ai_copilots.feature_brand_voice_title"), body: t("landing.ai_copilots.feature_brand_voice_body") },
                { Icon: Workflow, title: t("landing.ai_copilots.feature_workflow_aware_title"), body: t("landing.ai_copilots.feature_workflow_aware_body") },
                { Icon: MessageSquare, title: t("landing.ai_copilots.feature_human_handoff_title"), body: t("landing.ai_copilots.feature_human_handoff_body") },
              ].map(({ Icon, title, body }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">{title}</p>
                    <p className="text-[13px] leading-relaxed text-gray-600">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <FeaturePillStrip
              items={capabilityStrip}
              tone="default"
              className="mt-7"
            />
          </div>
        </div>

        {/* Knowledge base block */}
        <div className="mt-14">
          <KnowledgeBaseBlock t={t} />
        </div>
      </div>
    </section>
  );
};

export default AiCopilotsSection;
