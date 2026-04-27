import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  CheckCircle,
  Shield,
  Zap,
  BarChart3,
  Globe,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Send,
  Users,
  Lock,
  Wifi,
  TrendingUp,
  Star,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Pricing data ─────────────────────────────────────────────────────────────

const TIERS = [
  {
    range: "1 – 50,000",
    label: "Standard",
    price: "16",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    bar: "w-1/3",
    barColor: "bg-blue-400",
    popular: false,
  },
  {
    range: "50,001 – 100,000",
    label: "Growth",
    price: "14",
    color: "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30",
    bar: "w-2/3",
    barColor: "bg-[#25D366]",
    popular: true,
  },
  {
    range: "100,001+",
    label: "Enterprise",
    price: "12",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    bar: "w-full",
    barColor: "bg-purple-500",
    popular: false,
  },
];

const FEATURES = [
  {
    icon: BarChart3,
    title: "Scalable",
    desc: "From small campaigns to enterprise-scale broadcasts reaching millions of recipients.",
    accent: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Lock,
    title: "Secure",
    desc: "End-to-end encryption via WhatsApp Business API keeps your data fully protected.",
    accent: "text-[#25D366]",
    bg: "bg-[#25D366]/10",
  },
  {
    icon: Wifi,
    title: "Reliable",
    desc: "Senda's optimised delivery infrastructure guarantees 99.9% uptime and fast delivery.",
    accent: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: TrendingUp,
    title: "Flexible",
    desc: "Pay-as-you-go with automatic volume discounts — no contracts or commitments needed.",
    accent: "text-purple-600",
    bg: "bg-purple-50",
  },
];

const STATS = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "< 3s", label: "Avg delivery" },
  { value: "500M+", label: "Messages sent" },
  { value: "E2E", label: "Encrypted" },
];

// ─── Pricing calculator ───────────────────────────────────────────────────────

function PricingCalc({ compact = false }: { compact?: boolean }) {
  const [volume, setVolume] = useState(10000);

  const getRate = (v: number) => {
    if (v <= 50000) return 16;
    if (v <= 100000) return 14;
    return 12;
  };

  const getTier = (v: number) => {
    if (v <= 50000) return TIERS[0];
    if (v <= 100000) return TIERS[1];
    return TIERS[2];
  };

  const rate = getRate(volume);
  const tier = getTier(volume);
  const total = (volume * rate).toLocaleString();

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-2 space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <h3 className="text-[10px] font-semibold text-gray-900">Cost Estimator</h3>
          <span className={`text-[8px] font-semibold px-1 py-0.5 rounded-full border whitespace-nowrap ${tier.color}`}>
            {tier.label}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] text-gray-500">
            <span>Messages</span>
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
            <p className="text-[7px] text-gray-500 leading-tight">Rate</p>
            <p className="text-[9px] font-bold text-gray-900 leading-tight">{rate} <span className="text-[7px] font-normal text-gray-500">TZS/msg</span></p>
          </div>
          <div className="rounded p-1 text-center" style={{ background: "rgba(37,211,102,0.08)" }}>
            <p className="text-[7px] text-gray-500 leading-tight">Total Cost</p>
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
        <h3 className="text-sm font-semibold text-gray-900">Cost Estimator</h3>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tier.color}`}>
          {tier.label}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Messages</span>
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
          <p className="text-[11px] text-gray-500 mb-0.5">Rate</p>
          <p className="text-lg font-bold text-gray-900">{rate} <span className="text-xs font-normal text-gray-500">TZS/msg</span></p>
        </div>
        <div className="bg-[#25D366]/8 rounded-xl p-3 text-center" style={{ background: "rgba(37,211,102,0.08)" }}>
          <p className="text-[11px] text-gray-500 mb-0.5">Total Cost</p>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const faqs = [
    { q: "Do I need a Meta Business Account?", a: "Yes. Senda connects to your existing Meta WhatsApp Business account. If you don't have one, our onboarding team will help you set it up at no extra cost." },
    { q: "Are there any contracts or minimum commitments?", a: "None at all. Senda is fully pay-as-you-go. You pay only for what you send, and volume discounts apply automatically as your usage grows." },
    { q: "How quickly are messages delivered?", a: "Average delivery is under 3 seconds. Our optimised routing infrastructure ensures 99.9% uptime with real-time delivery tracking available on your dashboard." },
    { q: "What is the maximum batch size per broadcast?", a: "A single API request supports up to 500 recipients. For larger campaigns, Senda's scheduler handles automatic batching so you can target millions without manual splitting." },
    { q: "Are prices inclusive of VAT?", a: "Prices shown are exclusive of VAT. VAT will be applied at the applicable rate on your invoice." },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      <style>{`.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 z-[50] w-full bg-transparent py-4 backdrop-blur-xl">
        <section className="px-0 pl-6 sm:pl-8 md:pl-12 lg:pl-20 flex items-center justify-between max-w-full pr-4 sm:pr-6 md:pr-8 lg:pr-12">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 sm:gap-2 lg:gap-3 h-8">
            <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0">
              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
            </div>
            <span className={`font-bold text-sm sm:text-lg lg:text-xl whitespace-nowrap leading-none transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"}`}>
              SENDA
            </span>
          </Link>

          {/* Desktop nav — same links as Landing */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#features" className={`transition-colors duration-300 cursor-pointer flex items-center gap-2 ${scrolled ? "text-gray-900 hover:text-gray-700" : "text-white hover:text-gray-200"}`}>Features</a>
            <a href="#pricing" className={`transition-colors duration-300 cursor-pointer flex items-center gap-2 ${scrolled ? "text-gray-900 hover:text-gray-700" : "text-white hover:text-gray-200"}`}>Pricing</a>
            <Link to="/developer" className={`transition-colors duration-300 ${scrolled ? "text-gray-900 hover:text-gray-700" : "text-white hover:text-gray-200"}`}>Developer</Link>
            <Link to="/" className={`transition-colors duration-300 flex items-center gap-1.5 ${scrolled ? "text-gray-900 hover:text-[#25D366]" : "text-white hover:text-[#25D366]"}`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </Link>
          </div>

          {/* Action buttons */}
          <div className="hidden lg:flex items-center gap-3 justify-end">
            <Link to="/login">
              <button className={`relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer flex items-center justify-center ${
                scrolled
                  ? "border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  : "border border-white text-white hover:bg-white hover:text-gray-900"
              }`}>
                Login
              </button>
            </Link>
            <Link to="/signup">
              <button className={`relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer inline-flex items-center justify-center leading-tight whitespace-nowrap ${
                scrolled
                  ? "border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                  : "border border-white text-white hover:bg-blue-600 hover:text-white hover:border-blue-600"
              }`}>
                Get started
              </button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`lg:hidden relative p-2 cursor-pointer transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </section>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1 shadow-lg">
            {[["overview","Overview"],["pricing","Pricing"],["features","Features"],["faq","FAQ"]].map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between py-3.5 border-b border-gray-100 text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {label}
              </a>
            ))}
            <div className="flex gap-3 pt-3">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm border border-gray-200 rounded-full py-2.5 text-gray-700 hover:border-gray-400 transition-colors">Login</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full py-2.5 transition-colors">Get started</Link>
            </div>
          </div>
        )}
      </header>

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
                <span className="text-xs font-medium text-white">Powered by Meta WhatsApp Business API</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                WhatsApp<br />
                <span className="text-[#25D366]">Broadcast</span><br />
                at Scale
              </h1>

              <p className="text-base sm:text-lg text-gray-100 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Reach thousands — or millions — of customers simultaneously with end-to-end encryption, real-time delivery tracking, and enterprise-grade uptime.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Button onClick={() => navigate("/signup")} className="w-full sm:w-auto h-12 px-8 text-sm font-semibold bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl shadow-md shadow-[#25D366]/25 gap-2">
                  Start broadcasting <ArrowRight className="w-4 h-4" />
                </Button>
                <a href="#pricing" className="w-full sm:w-auto h-12 px-8 text-sm font-semibold text-white border border-white/40 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  View pricing <ChevronDown className="w-4 h-4" />
                </a>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start text-xs text-gray-200 pt-2">
                {["No contracts", "Pay-as-you-go", "VAT invoiced"].map(t => (
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
                      <PricingCalc compact />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-0.5 flex-shrink-0">
                      {STATS.map(s => (
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
            <Badge className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/10 text-xs">Pay-as-you-go</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Volume Pricing Tiers</h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">The more you send, the less you pay. Discounts apply automatically — no manual tiers to manage.</p>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-10">
            {TIERS.map((tier) => (
              <div
                key={tier.label}
                className={`relative bg-white rounded-2xl border p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${tier.popular ? "border-[#25D366]/40 ring-1 ring-[#25D366]/20" : "border-gray-100"}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#25D366] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">Most Popular</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tier.color}`}>{tier.label}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">{tier.price}</span>
                    <span className="text-sm text-gray-400 font-medium">TZS / msg</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{tier.range} messages</p>
                </div>

                {/* Visual bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
                  <div className={`h-full ${tier.barColor} ${tier.bar} rounded-full`} />
                </div>

                <ul className="space-y-2 text-xs text-gray-600">
                  {["Real-time delivery tracking", "E2E encryption", "99.9% uptime SLA", "Dashboard analytics"].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Full pricing table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-900 text-white text-xs font-semibold uppercase tracking-wide">
              <div className="px-5 py-3.5">Message Volume</div>
              <div className="px-5 py-3.5 text-center">Unit Price (TZS)</div>
              <div className="px-5 py-3.5 text-right">Tier</div>
            </div>
            {TIERS.map((tier, i) => (
              <div key={tier.label} className={`grid grid-cols-3 items-center border-b last:border-0 border-gray-50 ${i === 1 ? "bg-[#25D366]/4" : ""}`} style={i === 1 ? { background: "rgba(37,211,102,0.04)" } : {}}>
                <div className="px-5 py-4 text-sm text-gray-700">{tier.range} messages</div>
                <div className="px-5 py-4 text-center">
                  <span className="text-base font-bold text-gray-900">{tier.price} TZS</span>
                  <span className="text-xs text-gray-400"> / message</span>
                </div>
                <div className="px-5 py-4 flex justify-end">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tier.color}`}>{tier.label}</span>
                </div>
              </div>
            ))}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-[11px] text-gray-400">Prices in TZS · VAT may apply · Valid 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 text-xs">Why Senda</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything you need to broadcast</h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">Enterprise-grade infrastructure with the simplicity of a modern platform.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEATURES.map((f) => {
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
              <h3 className="text-2xl font-bold text-gray-900">How it works</h3>
              {[
                { step: "01", title: "Connect your Meta account", desc: "Link your WhatsApp Business account in Settings. Senda auto-detects your Phone Number ID and Access Token." },
                { step: "02", title: "Upload or select contacts", desc: "Use Senda's contact manager or paste phone numbers directly. Segment by category, date range, or individual selection." },
                { step: "03", title: "Compose & broadcast", desc: "Write a free-form message or pick an approved Meta template. Hit send — Senda handles the rest with real-time status." },
              ].map(item => (
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
              {[
                { label: "Recipients", value: "12,450", ok: true },
                { label: "Message", value: "\"Habari! Your package is ready...\"", ok: true },
                { label: "Delay", value: "80ms", ok: true },
                { label: "Status", value: "Sending… 8,231 / 12,450", ok: null },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-xs text-white font-mono">{row.label}</span>
                  <span className={`text-xs font-mono ${row.ok === true ? "text-[#25D366]" : row.ok === null ? "text-yellow-400" : "text-gray-300"}`}>{row.value}</span>
                </div>
              ))}
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-[#25D366] rounded-full" style={{ width: "66%" }} />
              </div>
              <p className="text-[11px] text-white/70 text-right">66% delivered</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 text-xs">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Common questions</h2>
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
            Ready to broadcast
            <span className="block text-blue-600">at scale?</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Join organisations across Tanzania using Senda to deliver millions of WhatsApp messages — reliably, securely, and affordably.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            <Button
              onClick={() => navigate("/signup")}
              className="text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group flex items-center gap-2"
            >
              Get started free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 pt-1">No contracts · Pay-as-you-go · VAT may apply</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative py-4 sm:py-6 px-3 sm:px-4 lg:px-6">
        {/* Background image — same as Landing */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/home background12.jpg"
            alt="Footer background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Brand */}
            <Link to="/" className="flex items-center gap-1 sm:gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                <MessageSquare className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-bold text-sm sm:text-lg lg:text-xl text-white">SENDA</span>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-white/90">
              <a href="#overview" className="hover:underline hover:text-white">Overview</a>
              <a href="#pricing" className="hover:underline hover:text-white">Pricing</a>
              <a href="#features" className="hover:underline hover:text-white">Features</a>
              <a href="#faq" className="hover:underline hover:text-white">FAQ</a>
              <Link to="/developer" className="hover:underline hover:text-white">Developer</Link>
              <Link to="/" className="hover:underline hover:text-[#25D366] flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </Link>
            </nav>

            {/* Contact */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-white/90">+255 615 229 007</span>
              <a
                href="https://wa.me/255615229007"
                target="_blank"
                rel="noreferrer"
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm transition-colors duration-300"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="border-t border-white/20 mt-3 sm:mt-4 pt-3 sm:pt-4 text-center">
            <p className="text-xs sm:text-sm text-white/80">© 2025 SENDA by Mifumo Labs. All rights reserved. · Powered by Meta WhatsApp Business API</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
