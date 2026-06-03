import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  BarChart3,
  Send,
  Zap,
  Lock,
  Wifi,
  TrendingUp,
  Upload,
  Vote,
  FileText,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { LanguageContext } from "@/contexts/LanguageContext";

type Lang = "en" | "sw";

// ─── Pricing data (language-aware label factory) ──────────────────────────────

const getTiers = (lang: Lang) => [
  {
    range: "1 – 50,000",
    label: lang === "sw" ? "Kawaida" : "Standard",
    price: "16",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    bar: "w-1/3",
    barColor: "bg-blue-400",
    popular: false,
  },
  {
    range: "50,001 – 100,000",
    label: lang === "sw" ? "Ukuaji" : "Growth",
    price: "14",
    color: "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30",
    bar: "w-2/3",
    barColor: "bg-[#25D366]",
    popular: true,
  },
  {
    range: "100,001+",
    label: lang === "sw" ? "Biashara Kubwa" : "Enterprise",
    price: "12",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    bar: "w-full",
    barColor: "bg-purple-500",
    popular: false,
  },
];

const getFeatures = (lang: Lang) => [
  {
    icon: BarChart3,
    title: lang === "sw" ? "Inapanuka" : "Scalable",
    desc:
      lang === "sw"
        ? "Kuanzia kampeni ndogo hadi matangazo ya kiwango cha biashara kubwa yanayofikia mamilioni ya wapokeaji."
        : "From small campaigns to enterprise-scale broadcasts reaching millions of recipients.",
    accent: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Lock,
    title: lang === "sw" ? "Salama" : "Secure",
    desc:
      lang === "sw"
        ? "Usimbaji wa mwisho-hadi-mwisho kupitia WhatsApp Business API unalinda data yako kikamilifu."
        : "End-to-end encryption via WhatsApp Business API keeps your data fully protected.",
    accent: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
  },
  {
    icon: Wifi,
    title: lang === "sw" ? "Inategemewa" : "Reliable",
    desc:
      lang === "sw"
        ? "Miundombinu yetu iliyoboreshwa inahakikisha muda wa juu wa 99.9% na uwasilishaji wa haraka."
        : "Senda's optimised delivery infrastructure guarantees 99.9% uptime and fast delivery.",
    accent: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: TrendingUp,
    title: lang === "sw" ? "Yenye Wepesi" : "Flexible",
    desc:
      lang === "sw"
        ? "Lipa kadri unavyotumia kwa punguzo la kiotomatiki la kiasi — hakuna mikataba au ahadi."
        : "Pay-as-you-go with automatic volume discounts — no contracts or commitments needed.",
    accent: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const getStats = (lang: Lang) => [
  { value: "99.9%", label: lang === "sw" ? "Muda wa juu" : "Uptime SLA" },
  { value: "< 3s", label: lang === "sw" ? "Wastani wa uwasilishaji" : "Avg delivery" },
  { value: "500M+", label: lang === "sw" ? "Ujumbe uliotumwa" : "Messages sent" },
  { value: "E2E", label: lang === "sw" ? "Umesimbwa" : "Encrypted" },
];

// ─── Pricing calculator ───────────────────────────────────────────────────────

function PricingCalc({ compact = false, lang }: { compact?: boolean; lang: Lang }) {
  const [volume, setVolume] = useState(10000);
  const tiers = getTiers(lang);

  const getRate = (v: number) => {
    if (v <= 50000) return 16;
    if (v <= 100000) return 14;
    return 12;
  };

  const getTier = (v: number) => {
    if (v <= 50000) return tiers[0];
    if (v <= 100000) return tiers[1];
    return tiers[2];
  };

  const rate = getRate(volume);
  const tier = getTier(volume);
  const total = (volume * rate).toLocaleString();

  const tCostEstimator = lang === "sw" ? "Kikokotoo cha Gharama" : "Cost Estimator";
  const tMessages = lang === "sw" ? "Ujumbe" : "Messages";
  const tRate = lang === "sw" ? "Bei" : "Rate";
  const tTotal = lang === "sw" ? "Gharama Jumla" : "Total Cost";
  const tPerMsg = lang === "sw" ? "TZS/ujumbe" : "TZS/msg";

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-[10px] font-semibold text-gray-900">{tCostEstimator}</h3>
          <span className={`text-[8px] font-semibold px-1 py-0.5 rounded-full border whitespace-nowrap ${tier.color}`}>
            {tier.label}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] text-gray-500">
            <span>{tMessages}</span>
            <span className="font-semibold text-gray-900 tabular-nums">{volume.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={200000}
            step={1000}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer accent-[#25D366]"
          />
          <div className="flex justify-between text-[7px] text-gray-400">
            <span>1K</span><span>50K</span><span>100K</span><span>200K</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          <div className="bg-gray-50 rounded p-1 text-center">
            <p className="text-[7px] text-gray-500 leading-tight">{tRate}</p>
            <p className="text-[9px] font-bold text-gray-900 leading-tight">{rate} <span className="text-[7px] font-normal text-gray-500">{tPerMsg}</span></p>
          </div>
          <div className="rounded p-1 text-center" style={{ background: "rgba(37,211,102,0.08)" }}>
            <p className="text-[7px] text-gray-500 leading-tight">{tTotal}</p>
            <p className="text-[9px] font-bold text-[#25D366] tabular-nums leading-tight">{total}</p>
            <p className="text-[7px] text-gray-400">TZS</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{tCostEstimator}</h3>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tier.color}`}>
          {tier.label}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{tMessages}</span>
          <span className="font-semibold text-gray-900 tabular-nums">{volume.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={200000}
          step={1000}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#25D366]"
        />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>1K</span><span>50K</span><span>100K</span><span>200K</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-[11px] text-gray-500 mb-0.5">{tRate}</p>
          <p className="text-lg font-bold text-gray-900">{rate} <span className="text-xs font-normal text-gray-500">{tPerMsg}</span></p>
        </div>
        <div className="bg-[#25D366]/8 rounded-xl p-3 text-center" style={{ background: "rgba(37,211,102,0.08)" }}>
          <p className="text-[11px] text-gray-500 mb-0.5">{tTotal}</p>
          <p className="text-lg font-bold text-[#25D366] tabular-nums">{total}</p>
          <p className="text-[10px] text-gray-400">TZS</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WhatsAppBroadcast() {
  const navigate = useNavigate();
  const langCtx = useContext(LanguageContext);
  const lang: Lang = (langCtx?.language as Lang) || "en";
  const isSw = lang === "sw";
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tiers = getTiers(lang);
  const features = getFeatures(lang);
  const stats = getStats(lang);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
  }, []);

  const faqs = isSw
    ? [
        { q: "Je, ninahitaji Akaunti ya Meta Business?", a: "Ndio. Senda inaunganisha na akaunti yako iliyopo ya Meta WhatsApp Business. Kama huna, timu yetu ya uongozi itakusaidia kuianzisha bila gharama ya ziada." },
        { q: "Je, kuna mikataba au ahadi za chini?", a: "Hapana kabisa. Senda ni lipa-kadri-unavyotumia kikamilifu. Unalipa tu kwa kile unachotuma, na punguzo la kiasi linatumika kiotomatiki kadiri matumizi yako yanavyokua." },
        { q: "Ujumbe unawasilishwa haraka kiasi gani?", a: "Wastani wa uwasilishaji ni chini ya sekunde 3. Miundombinu yetu iliyoboreshwa inahakikisha muda wa juu wa 99.9% pamoja na ufuatiliaji wa uwasilishaji wa wakati halisi kwenye dashibodi yako." },
        { q: "Ni ukubwa gani wa juu wa kundi kwa kila tangazo?", a: "Ombi moja la API linatumia hadi wapokeaji 500. Kwa kampeni kubwa, mpangaji wa Senda hushughulikia kugawanya kiotomatiki ili uweze kulenga mamilioni bila kugawanya kwa mkono." },
        { q: "Je, bei zinajumuisha VAT?", a: "Bei zilizoonyeshwa hazijumuishi VAT. VAT itatozwa kwa kiwango kinachotumika kwenye ankara yako." },
      ]
    : [
        { q: "Do I need a Meta Business Account?", a: "Yes. Senda connects to your existing Meta WhatsApp Business account. If you don't have one, our onboarding team will help you set it up at no extra cost." },
        { q: "Are there any contracts or minimum commitments?", a: "None at all. Senda is fully pay-as-you-go. You pay only for what you send, and volume discounts apply automatically as your usage grows." },
        { q: "How quickly are messages delivered?", a: "Average delivery is under 3 seconds. Our optimised routing infrastructure ensures 99.9% uptime with real-time delivery tracking available on your dashboard." },
        { q: "What is the maximum batch size per broadcast?", a: "A single API request supports up to 500 recipients. For larger campaigns, Senda's scheduler handles automatic batching so you can target millions without manual splitting." },
        { q: "Are prices inclusive of VAT?", a: "Prices shown are exclusive of VAT. VAT will be applied at the applicable rate on your invoice." },
      ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      <style>{`.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>

      {/* Shared landing header */}
      <LandingHeader heroSectionId="overview" />

      {/* ── Hero ── */}
      <section id="overview" className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden min-h-screen flex items-center">
        {/* Background — same zoomed style as Landing page */}
        <div className="absolute inset-0 overflow-hidden z-0">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/home background12.jpg"
            alt="Hero background"
            className="w-full h-full object-cover"
            style={{
              transform: "scale(3)",
              transformOrigin: "center",
            }}
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

            {/* Left */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3.5 py-1.5 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                <span className="text-xs font-medium text-white">
                  {isSw ? "Inaendeshwa na Meta WhatsApp Business API" : "Powered by Meta WhatsApp Business API"}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                {isSw ? (
                  <>
                    Matangazo ya<br />
                    <span className="text-[#25D366]">WhatsApp</span><br />
                    kwa Kiwango Kikubwa
                  </>
                ) : (
                  <>
                    WhatsApp<br />
                    <span className="text-[#25D366]">Broadcast</span><br />
                    at Scale
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-gray-100 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                {isSw
                  ? "Fikia maelfu — au mamilioni — ya wateja kwa wakati mmoja kwa usimbaji wa mwisho-hadi-mwisho, ufuatiliaji wa uwasilishaji wa wakati halisi, na muda wa juu wa kiwango cha biashara kubwa."
                  : "Reach thousands — or millions — of customers simultaneously with end-to-end encryption, real-time delivery tracking, and enterprise-grade uptime."}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Button onClick={() => navigate("/signup")} className="w-full sm:w-auto h-12 px-8 text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl shadow-md shadow-[#25D366]/25 gap-2">
                  {isSw ? "Anza kutangaza" : "Start broadcasting"} <ArrowRight className="w-4 h-4" />
                </Button>
                <a href="#pricing" className="w-full sm:w-auto h-12 px-8 text-sm font-semibold text-white border border-white/40 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  {isSw ? "Tazama bei" : "View pricing"} <ChevronDown className="w-4 h-4" />
                </a>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start text-xs text-gray-200 pt-2">
                {(isSw
                  ? ["Hakuna mikataba", "Lipa kadri unavyotumia", "VAT inajumuishwa"]
                  : ["No contracts", "Pay-as-you-go", "VAT invoiced"]
                ).map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — content inside phone mockup */}
            <div className="w-full lg:w-auto flex justify-center lg:justify-end">
              <div
                className="relative"
                style={{
                  width: "320px",
                  transform: "perspective(900px) rotateY(-8deg) rotateZ(2deg)",
                  filter: "drop-shadow(0 40px 60px rgba(0,0,0,0.45))",
                }}
              >
                {/* Screen content — behind phone frame */}
                <div
                  className="absolute overflow-hidden bg-white"
                  style={{
                    top: "7%",
                    left: "18%",
                    right: "18%",
                    bottom: "6%",
                    borderRadius: "1rem",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide p-1 flex flex-col gap-0.5">
                    {/* Compact pricing calc */}
                    <div className="flex-shrink-0">
                      <PricingCalc compact lang={lang} />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-0.5 flex-shrink-0">
                      {stats.map(s => (
                        <div key={s.label} className="bg-gray-50 rounded p-1 text-center border border-gray-100">
                          <p className="text-[9px] font-bold text-gray-900 leading-tight">{s.value}</p>
                          <p className="text-[6px] text-gray-400 leading-tight">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phone frame — on top */}
                <img
                  src="/mobile1.webp"
                  alt="Phone mockup"
                  className="relative w-full h-auto object-contain pointer-events-none select-none"
                  style={{ zIndex: 2, position: "relative" }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing tiers ── */}
      <section id="pricing" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <Badge className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/10 text-xs">
              {isSw ? "Lipa kadri unavyotumia" : "Pay-as-you-go"}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {isSw ? "Viwango vya Bei kwa Wingi" : "Volume Pricing Tiers"}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
              {isSw
                ? "Kadiri unavyotuma zaidi, ndivyo unavyolipa kidogo. Punguzo linatumika kiotomatiki — hakuna viwango vya kusimamia kwa mkono."
                : "The more you send, the less you pay. Discounts apply automatically — no manual tiers to manage."}
            </p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10 items-stretch">
            {tiers.map((tier, index) => {
              const meta = [
                {
                  Icon: Send,
                  taglineEn: "For teams getting started with WhatsApp",
                  taglineSw: "Kwa biashara zinazoanza na WhatsApp",
                  saving: null as number | null,
                  prevPlanEn: null as string | null,
                  prevPlanSw: null as string | null,
                },
                {
                  Icon: TrendingUp,
                  taglineEn: "Best for active broadcast campaigns",
                  taglineSw: "Bora kwa kampeni za matangazo",
                  saving: 13,
                  prevPlanEn: "Standard",
                  prevPlanSw: "Kawaida",
                },
                {
                  Icon: Zap,
                  taglineEn: "Built for high-volume senders",
                  taglineSw: "Imejengwa kwa watumiaji wakubwa",
                  saving: 25,
                  prevPlanEn: "Growth",
                  prevPlanSw: "Ukuaji",
                },
              ][index];

              const features = isSw
                ? [
                    "Ufuatiliaji wa uwasilishaji wa wakati halisi",
                    "Usimbaji wa mwisho-hadi-mwisho",
                    "Muda wa juu wa 99.9%",
                    "Takwimu za dashibodi",
                  ]
                : [
                    "Real-time delivery tracking",
                    "E2E encryption",
                    "99.9% uptime SLA",
                    "Dashboard analytics",
                  ];

              return (
                <div key={tier.label} className="group relative flex">
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-[#25D366] to-[#1ebe5d] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_8px_20px_-6px_rgba(37,211,102,0.5)] ring-1 ring-white/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        {isSw ? "Maarufu zaidi" : "Most popular"}
                      </span>
                    </div>
                  )}

                  <div
                    className={`relative flex flex-col w-full overflow-hidden rounded-3xl bg-white transition-all duration-300 group-hover:-translate-y-1 ${
                      tier.popular
                        ? "ring-2 ring-[#25D366] shadow-[0_20px_50px_-15px_rgba(37,211,102,0.4)] group-hover:shadow-[0_30px_60px_-15px_rgba(37,211,102,0.5)]"
                        : "ring-1 ring-gray-200 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] group-hover:ring-gray-300 group-hover:shadow-[0_15px_35px_-10px_rgba(15,23,42,0.18)]"
                    }`}
                  >
                    {/* Header */}
                    <div className="px-7 pt-8 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                              tier.popular
                                ? "bg-[#25D366]/10 text-[#25D366] ring-1 ring-[#25D366]/20"
                                : "bg-gray-50 text-gray-600 ring-1 ring-gray-100"
                            }`}
                          >
                            <meta.Icon className="h-4 w-4" strokeWidth={2.2} />
                          </span>
                          <p className="text-[15px] font-semibold text-gray-900">{tier.label}</p>
                        </div>

                        {meta.saving && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            {isSw ? `Punguzo ${meta.saving}%` : `Save ${meta.saving}%`}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-[13px] text-gray-500 leading-relaxed">
                        {isSw ? meta.taglineSw : meta.taglineEn}
                      </p>

                      {/* Price */}
                      <div className="mt-6 flex items-baseline gap-1.5">
                        <span className="text-[44px] sm:text-[48px] font-extrabold text-gray-900 leading-none tracking-tight">
                          {tier.price}
                        </span>
                        <span className="text-sm font-medium text-gray-500">
                          {isSw ? "TZS / ujumbe" : "TZS / msg"}
                        </span>
                      </div>
                      <p className="mt-3 text-[12px] font-medium text-gray-500">
                        {tier.range} {isSw ? "ujumbe" : "messages"}
                      </p>
                    </div>

                    {/* CTA */}
                    <div className="px-7 pb-7 pt-1">
                      <Button
                        onClick={() => navigate("/signup")}
                        className={`w-full h-11 text-sm font-semibold rounded-xl transition-all gap-2 ${
                          tier.popular
                            ? "bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-md shadow-[#25D366]/25 hover:shadow-lg hover:shadow-[#25D366]/40"
                            : "bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                        }`}
                      >
                        {isSw ? "Anza sasa" : "Get started"}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>

                    {/* Hairline divider */}
                    <div className="mx-7 border-t border-gray-100" />

                    {/* What's included */}
                    <div className="px-7 pt-6 pb-7 flex-1 flex flex-col">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400 mb-4">
                        {isSw ? "Kinajumuisha" : "What's included"}
                      </p>

                      {meta.prevPlanEn && (
                        <p className="mb-3 text-[12.5px] font-medium text-gray-700">
                          {isSw
                            ? `Kila kitu kwenye ${meta.prevPlanSw}, jumuisha:`
                            : `Everything in ${meta.prevPlanEn}, plus:`}
                        </p>
                      )}

                      <ul className="space-y-3">
                        {features.map((f) => (
                          <li key={f} className="flex items-start gap-3">
                            <span
                              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full mt-0.5 ${
                                tier.popular
                                  ? "bg-[#25D366]/10 text-[#25D366]"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            <span className="text-[13.5px] leading-relaxed text-gray-700">
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full pricing table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-900 text-white text-xs font-semibold uppercase tracking-wide">
              <div className="px-5 py-3.5">{isSw ? "Kiasi cha Ujumbe" : "Message Volume"}</div>
              <div className="px-5 py-3.5 text-center">{isSw ? "Bei kwa Kila Mmoja (TZS)" : "Unit Price (TZS)"}</div>
              <div className="px-5 py-3.5 text-right">{isSw ? "Kiwango" : "Tier"}</div>
            </div>
            {tiers.map((tier, i) => (
              <div key={tier.label} className={`grid grid-cols-3 items-center border-b last:border-0 border-gray-50 ${i === 1 ? "bg-[#25D366]/4" : ""}`} style={i === 1 ? { background: "rgba(37,211,102,0.04)" } : {}}>
                <div className="px-5 py-4 text-sm text-gray-700">
                  {tier.range} {isSw ? "ujumbe" : "messages"}
                </div>
                <div className="px-5 py-4 text-center">
                  <span className="text-base font-bold text-gray-900">{tier.price} TZS</span>
                  <span className="text-xs text-gray-400"> / {isSw ? "ujumbe" : "message"}</span>
                </div>
                <div className="px-5 py-4 flex justify-end">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tier.color}`}>{tier.label}</span>
                </div>
              </div>
            ))}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-400">
                {isSw ? "Bei kwa TZS · VAT inaweza kutumika · Halali 2025" : "Prices in TZS · VAT may apply · Valid 2025"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-xs">
              {isSw ? "Kwa Nini Senda" : "Why Senda"}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {isSw ? "Kila kitu unachohitaji kutangaza" : "Everything you need to broadcast"}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
              {isSw
                ? "Miundombinu ya kiwango cha biashara kubwa kwa urahisi wa jukwaa la kisasa."
                : "Enterprise-grade infrastructure with the simplicity of a modern platform."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${f.accent}`} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>

          {/* How it works */}
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <h3 className="text-2xl font-bold text-gray-900">{isSw ? "Inavyofanya kazi" : "How it works"}</h3>
              {(isSw
                ? [
                    { step: "01", title: "Unganisha akaunti yako ya Meta", desc: "Unganisha akaunti yako ya WhatsApp Business kwenye Mipangilio. Senda inatambua kiotomatiki Phone Number ID na Access Token yako." },
                    { step: "02", title: "Pakia au chagua mawasiliano", desc: "Tumia kisimamizi cha mawasiliano cha Senda au bandika namba za simu moja kwa moja. Gawanya kwa kategoria, masafa ya tarehe, au uchaguzi binafsi." },
                    { step: "03", title: "Andika & tangaza", desc: "Andika ujumbe wa bure au chagua kiolezo kilichoidhinishwa na Meta. Bonyeza tuma — Senda inashughulikia mengine yote pamoja na hali ya wakati halisi." },
                  ]
                : [
                    { step: "01", title: "Connect your Meta account", desc: "Link your WhatsApp Business account in Settings. Senda auto-detects your Phone Number ID and Access Token." },
                    { step: "02", title: "Upload or select contacts", desc: "Use Senda's contact manager or paste phone numbers directly. Segment by category, date range, or individual selection." },
                    { step: "03", title: "Compose & broadcast", desc: "Write a free-form message or pick an approved Meta template. Hit send — Senda handles the rest with real-time status." },
                  ]
              ).map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{item.step}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual card */}
            <div className="bg-gray-900 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-white font-mono">senda · bulk send</span>
              </div>
              {(isSw
                ? [
                    { label: "Wapokeaji", value: "12,450", ok: true },
                    { label: "Ujumbe", value: "\"Habari! Kifurushi chako kiko tayari...\"", ok: true },
                    { label: "Ucheleweshaji", value: "80ms", ok: true },
                    { label: "Hali", value: "Inatuma… 8,231 / 12,450", ok: null },
                  ]
                : [
                    { label: "Recipients", value: "12,450", ok: true },
                    { label: "Message", value: "\"Habari! Your package is ready...\"", ok: true },
                    { label: "Delay", value: "80ms", ok: true },
                    { label: "Status", value: "Sending… 8,231 / 12,450", ok: null },
                  ]
              ).map((row) => (
                <div key={row.label} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-xs text-white font-mono">{row.label}</span>
                  <span className={`text-xs font-mono ${row.ok === true ? "text-[#25D366]" : row.ok === null ? "text-yellow-400" : "text-gray-300"}`}>{row.value}</span>
                </div>
              ))}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#25D366] rounded-full" style={{ width: "66%" }} />
              </div>
              <p className="text-[11px] text-white/70 text-right">{isSw ? "66% imewasilishwa" : "66% delivered"}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── New Capabilities ── */}
      <section id="capabilities" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <Badge className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/10 text-xs">
              {isSw ? "Mpya" : "New"}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {isSw ? "Zaidi ya maandishi tu" : "Beyond plain text"}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              {isSw
                ? "Pakia faili moja kwa moja, tuma RSVP zinazoshirikisha, na fuatilia majibu — yote kutoka kwenye dashibodi moja ya matangazo."
                : "Upload media directly, send interactive RSVPs, and track responses — all from the same broadcast dashboard."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {(isSw
              ? [
                  {
                    icon: Upload,
                    title: "Upakuaji wa moja kwa moja",
                    desc: "Chagua picha, PDF, au video kutoka kwa kifaa chako — hakuna URL ya umma inayohitajika. Backend inapakia mara moja, inatumia tena kwa wapokeaji wote.",
                    accent: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    icon: Vote,
                    title: "Kura zinazoshirikisha",
                    desc: "Tuma vifungo vya Ndio / Labda / Hapana badala ya maswali tu. Wapokeaji wanagusa kifungo — majibu yanarudi kwenye dashibodi yako kiotomatiki.",
                    accent: "text-[#25D366]",
                    bg: "bg-[#25D366]/10",
                  },
                  {
                    icon: FileText,
                    title: "Vigae vya hati za PDF",
                    desc: "Tuma PDF kama vigae vya WhatsApp vyenye jina maalum la faili — mialiko, risiti, mikataba inaonyeshwa kama faili safi zilizotajwa.",
                    accent: "text-orange-600",
                    bg: "bg-orange-50",
                  },
                  {
                    icon: PieChart,
                    title: "Dashibodi ya matokeo ya kura",
                    desc: "Tafuta kura yoyote kwa ID na uone vipimo, jumla, na orodha ya majibu binafsi pamoja na simu, chaguo, na muhuri wa wakati.",
                    accent: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                ]
              : [
                  {
                    icon: Upload,
                    title: "Direct file upload",
                    desc: "Pick an image, PDF, or video from your device — no public URL needed. Backend uploads once, reuses across all recipients.",
                    accent: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    icon: Vote,
                    title: "Interactive polls",
                    desc: "Send Yes / Maybe / No buttons instead of plain questions. Recipients tap a button — replies land back in your dashboard automatically.",
                    accent: "text-[#25D366]",
                    bg: "bg-[#25D366]/10",
                  },
                  {
                    icon: FileText,
                    title: "PDF document tiles",
                    desc: "Send PDFs as proper WhatsApp document tiles with a custom filename — invitations, receipts, contracts render as clean, named files.",
                    accent: "text-orange-600",
                    bg: "bg-orange-50",
                  },
                  {
                    icon: PieChart,
                    title: "Poll results dashboard",
                    desc: "Look up any poll by ID and see vote bars, totals, and an individual response list with phone, option, and timestamp.",
                    accent: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                ]
            ).map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${c.accent}`} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{c.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>

          {/* RSVP preview chat bubble */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {isSw ? "Ujumbe wa mtindo wa RSVP, umejengwa ndani" : "RSVP-style messages, built in"}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {isSw
                  ? "Ambatanisha kura kwa tangazo lolote — kutuma kimoja, kutuma kwa wingi, au kwa kuzingatia hadhira. Wapokeaji wanaona vifungo vya majibu yanayoshirikisha badala ya kuombwa kuandika jibu."
                  : "Attach a poll to any broadcast — single send, bulk send, or audience-based. Recipients see interactive reply buttons instead of being asked to type a response."}
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                {(isSw
                  ? [
                      "Hadi vifungo 3 vya majibu kwa kila ujumbe",
                      "Kichwa cha hiari cha media (picha au PDF) juu ya vifungo",
                      "Inaondoa marudio kwa ID ya ujumbe ya Meta — hakuna kuhesabu mara mbili",
                      "Matokeo yamegawanywa kwa kurasa, yanaweza kuchujwa kwa chaguo",
                    ]
                  : [
                      "Up to 3 reply buttons per message",
                      "Optional media header (image or PDF) above the buttons",
                      "Dedupes on Meta's message ID — no double-counting",
                      "Results paginated, filterable by option",
                    ]
                ).map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock chat bubble */}
            <div className="bg-[#ECE5DD] rounded-2xl p-5 sm:p-6 shadow-inner">
              <div className="bg-white rounded-xl p-3 max-w-xs ml-auto shadow-sm space-y-2">
                <div className="bg-gray-100 rounded-lg p-2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-red-500 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-gray-900 truncate">
                      {isSw ? "Mwaliko.pdf" : "Invitation.pdf"}
                    </p>
                    <p className="text-[10px] text-gray-500">PDF · 1.2 MB</p>
                  </div>
                </div>
                <p className="text-xs text-gray-800">
                  {isSw ? "Utahudhuria harusi yetu tarehe 20 Machi?" : "Will you attend our wedding on Mar 20?"}
                </p>
                <p className="text-[9px] text-gray-400 text-right">14:32 ✓✓</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 justify-end max-w-xs ml-auto">
                {(isSw ? ["Ndio", "Labda", "Hapana"] : ["Yes", "Maybe", "No"]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="bg-white text-[#25D366] text-xs font-semibold px-4 py-1.5 rounded-full shadow-sm border border-gray-100"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 text-xs">
              {isSw ? "Maswali" : "FAQ"}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {isSw ? "Maswali yanayoulizwa mara kwa mara" : "Common questions"}
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-semibold text-gray-900 pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6 relative bg-white overflow-hidden">
        {/* Background decorations — same as Landing */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-300/25 rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-blue-200/25 rounded-full animate-bounce" />
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-blue-100/30 rounded-lg rotate-45 animate-ping" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-4">
          <h2 className="font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-900 leading-tight">
            {isSw ? (
              <>
                Uko tayari kutangaza
                <span className="block text-blue-600">kwa kiwango kikubwa?</span>
              </>
            ) : (
              <>
                Ready to broadcast
                <span className="block text-blue-600">at scale?</span>
              </>
            )}
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            {isSw
              ? "Jiunge na mashirika kote Tanzania yanayotumia Senda kuwasilisha mamilioni ya ujumbe wa WhatsApp — kwa uaminifu, usalama, na bei nafuu."
              : "Join organisations across Tanzania using Senda to deliver millions of WhatsApp messages — reliably, securely, and affordably."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <Button
              onClick={() => navigate("/signup")}
              className="text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group flex items-center gap-2"
            >
              {isSw ? "Anza bila malipo" : "Get started free"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 pt-1">
            {isSw
              ? "Hakuna mikataba · Lipa kadri unavyotumia · VAT inaweza kutumika"
              : "No contracts · Pay-as-you-go · VAT may apply"}
          </p>
        </div>
      </section>

      {/* Shared landing footer */}
      <LandingFooter />

    </div>
  );
}
