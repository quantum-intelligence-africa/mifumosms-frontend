import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Bot, Plus, MessageCircle, Database, BarChart2, Zap,
  CheckCircle2, ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Bot,
    title: "Agent Dashboard",
    desc: "Monitor all agents, conversation volume, and performance metrics in real time.",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    borderAccent: "border-t-blue-500",
  },
  {
    icon: Plus,
    title: "Create Agent",
    desc: "Define persona, knowledge base, and conversation flows with a no-code builder.",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    borderAccent: "border-t-emerald-500",
  },
  {
    icon: MessageCircle,
    title: "Conversations",
    desc: "Full message history and sentiment analysis for every agent-handled conversation.",
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50",
    borderAccent: "border-t-violet-500",
  },
  {
    icon: Database,
    title: "Knowledge Base",
    desc: "Upload docs, FAQs, and product data to ground your agents in your business.",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    borderAccent: "border-t-amber-500",
  },
  {
    icon: BarChart2,
    title: "Analytics",
    desc: "Track containment rate, resolution time, and satisfaction scores over time.",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
    borderAccent: "border-t-rose-500",
  },
  {
    icon: Zap,
    title: "Automation Triggers",
    desc: "Connect agents to SMS campaigns, contact events, and external webhooks.",
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
    borderAccent: "border-t-orange-500",
  },
];

const perks = [
  "Free access during private beta",
  "Direct line to the product team",
  "Shape the feature before launch",
];

export default function AIAgents() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: wire to backend POST /api/waitlist
    setSubmitted(true);
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
                AI Agents
              </h1>
              <p className="mt-1 text-[14px] text-slate-500">
                Build and deploy intelligent agents for automated customer engagement
              </p>
            </div>

            {/* ── Hero Card: Value prop + Waitlist form ────── */}
            <div className="relative bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden mb-8">
              {/* Top accent line */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-violet-500 to-indigo-500" />

              <div className="flex flex-col lg:flex-row">

                {/* Left — Value prop */}
                <div className="flex-1 px-6 pt-8 pb-6 lg:py-8 lg:pr-0">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 flex items-center justify-center">
                      <Bot className="w-4.5 h-4.5 text-blue-600" strokeWidth={1.8} />
                    </div>
                    <Badge className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      Early Access
                    </Badge>
                  </div>

                  <h2 className="text-[18px] font-semibold text-slate-900 tracking-tight mb-2">
                    AI Agents — in private beta
                  </h2>
                  <p className="text-[13px] text-slate-500 leading-relaxed mb-6 max-w-[380px]">
                    Intelligent agents that handle conversations, qualify leads, and trigger
                    SMS workflows — powered by LLMs and built into your existing contacts.
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
                      <div className="w-11 h-11 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={2} />
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
                        Be among the first to test AI Agents on Mifumo.
                      </p>
                      <div className="flex items-start gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-4">
                        <span className="text-blue-500 mt-px text-[11px]">ℹ</span>
                        <p className="text-[11px] text-blue-700 leading-relaxed">
                          Open to <strong>registered companies only.</strong> A valid business registration and KYC verification are required before access is granted.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-2.5">
                        <Input
                          placeholder="Full name"
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
                          placeholder="Phone number (e.g. +255 689 726 060)"
                          className="h-9 text-[13px] border-slate-200 bg-slate-50 focus:bg-white placeholder:text-slate-400"
                        />
                        <Button
                          type="submit"
                          className="w-full h-9 text-[13px] font-medium gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
                          Request Early Access
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
