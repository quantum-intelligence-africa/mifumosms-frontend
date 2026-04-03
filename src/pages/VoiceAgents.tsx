import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Mic, Plus, Phone, GitBranch, PhoneCall, FileAudio, Settings2,
  CheckCircle2, ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const defaultFeatures = [
  {
    icon: Phone,
    title: "Voice Dashboard",
    desc: "Bird's-eye view of active agents, live call counts, and real-time performance.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    borderAccent: "border-t-blue-500",
  },
  {
    icon: GitBranch,
    title: "Call Flows",
    desc: "Multi-step conversation flows with branching logic and intent recognition nodes.",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    borderAccent: "border-t-blue-400",
  },
  {
    icon: PhoneCall,
    title: "Voice Campaigns",
    desc: "Automated outbound campaigns to your contact lists with scheduling built in.",
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50",
    borderAccent: "border-t-indigo-500",
  },
  {
    icon: FileAudio,
    title: "Call Logs",
    desc: "Full call recordings, transcripts, and metadata for every agent interaction.",
    iconColor: "text-blue-700",
    iconBg: "bg-blue-50",
    borderAccent: "border-t-blue-600",
  },
  {
    icon: Settings2,
    title: "AI Voice Config",
    desc: "Choose voice personas, speech engines, and latency settings per agent.",
    iconColor: "text-slate-600",
    iconBg: "bg-slate-100",
    borderAccent: "border-t-slate-400",
  },
  {
    icon: Plus,
    title: "Create Agent",
    desc: "Set up a voice agent with greetings, FAQs, and escalation paths in minutes.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    borderAccent: "border-t-blue-500",
  },
];

const defaultPerks = [
  "Free access during private beta",
  "Direct line to the product team",
  "Shape the feature before launch",
];

export default function VoiceAgents() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [features, setFeatures] = useState(defaultFeatures);
  const [perks, setPerks] = useState(defaultPerks);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/early-access/voice-agents/status/", {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) return;

        const json = await res.json().catch(() => null);
        const data = json?.data;
        if (!data || cancelled) return;

        if (Array.isArray(data.perks) && data.perks.every((x: unknown) => typeof x === "string")) {
          setPerks(data.perks);
        }

        // Backend can optionally return features as [{ title, desc }]
        if (Array.isArray(data.features)) {
          const incoming = data.features as Array<{ title?: string; desc?: string }>;
          const next = defaultFeatures.map((f) => {
            const match = incoming.find((i) => i?.title === f.title);
            return match?.desc ? { ...f, desc: match.desc } : f;
          });
          setFeatures(next);
        }
      } catch {
        // Keep defaults if backend is unavailable
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!name.trim() || !email.trim() || !kycFile) return;

    const formData = new FormData();
    formData.append("full_name", name.trim());
    formData.append("email", email.trim());
    if (phone.trim()) formData.append("phone", phone.trim());
    formData.append("kyc_file", kycFile);

    const token = localStorage.getItem("access_token");

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/early-access/voice-agents/waitlist/", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          (data && (data.message || data.error)) ||
          `Failed to submit (HTTP ${res.status})`;
        throw new Error(message);
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

            {/* ── Page Header ──────────────────────────────── */}
            <div className="mb-8">
              <h1 className="text-[26px] font-semibold text-slate-900 tracking-[-0.02em] leading-tight">
                Voice Agents
              </h1>
              <p className="mt-1 text-[14px] text-slate-500">
                Deploy AI-powered voice agents to automate inbound and outbound calls
              </p>
            </div>

            {/* ── Hero Card: Value prop + Waitlist form ────── */}
            <div className="relative bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden mb-8">
              {/* Top accent line — blue only */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500" />

              <div className="flex flex-col lg:flex-row">

                {/* Left — Value prop */}
                <div className="flex-1 px-6 pt-8 pb-6 lg:py-8 lg:pr-0">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Mic className="w-[18px] h-[18px] text-blue-600" strokeWidth={1.8} />
                    </div>
                    <Badge className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Early Access
                    </Badge>
                  </div>

                  <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight mb-2">
                    Voice Agents — in private beta
                  </h2>
                  <p className="text-[13px] text-slate-500 leading-relaxed mb-6 max-w-[380px]">
                    Natural-sounding voice agents that handle inbound calls, run outbound
                    campaigns, qualify leads, and hand off to humans — with zero code.
                  </p>

                  <ul className="space-y-2.5">
                    {perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" strokeWidth={2} />
                        <span className="text-[13px] text-slate-600">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vertical divider */}
                <div className="hidden lg:block w-px bg-slate-100 my-6" />

                {/* Right — Waitlist form */}
                <div className="lg:w-[340px] px-6 py-6 lg:py-8">
                  {submitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-4">
                      <div className="w-11 h-11 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" strokeWidth={2} />
                      </div>
                      <p className="text-[15px] font-semibold text-slate-900 mb-1">You're on the list</p>
                      <p className="text-[13px] text-slate-500">
                        We'll reach out as soon as early access opens.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[13px] font-semibold text-slate-800 mb-0.5">
                        Join the waitlist
                      </p>
                      <p className="text-[12px] text-slate-400 mb-1">
                        Be among the first to test Voice Agents on Mifumo.
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-2.5">
                        <Input
                          placeholder="Full name"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                        />
                        <Input
                          type="email"
                          required
                          placeholder="Work email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                        />
                        <Input
                          type="tel"
                          placeholder="Phone number (e.g. +255689726060)"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                        />
                        <Input
                          type="file"
                          required
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-slate-700"
                        />
                        {submitError ? (
                          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                            {submitError}
                          </div>
                        ) : null}
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-9 text-[13px] font-medium gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                          {isSubmitting ? "Submitting..." : "Request Early Access"}
                          <ArrowRight className="w-3.5 h-3.5 ml-auto" strokeWidth={2} />
                        </Button>
                      </form>
                    </>
                  )}
                </div>

              </div>
            </div>

            {/* ── Feature Preview ──────────────────────────── */}
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Feature Preview
              </p>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className={`bg-white rounded-xl border border-slate-200 border-t-[3px] ${feature.borderAccent} shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)] transition-shadow duration-200 p-4`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${feature.iconBg}`}>
                      <Icon className={`w-4 h-4 ${feature.iconColor}`} strokeWidth={1.8} />
                    </div>
                    <h3 className="text-[13px] font-semibold text-slate-800 mb-1.5 tracking-[-0.01em]">
                      {feature.title}
                    </h3>
                    <p className="text-[12px] text-slate-500 leading-[1.6]">
                      {feature.desc}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
