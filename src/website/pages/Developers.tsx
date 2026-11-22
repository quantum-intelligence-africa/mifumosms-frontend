import { useState } from "react";
import { Activity, BarChart3, BookOpen, Check, Copy, KeyRound, Languages, MessageSquare, Server, ShieldCheck, Users, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink, H2, Lead, Section, SitePage, btnClass, focusRing } from "../Layout";
import { Reveal } from "../Reveal";
import { useSiteLang } from "../i18n";
import { DemoInvitation } from "./Home";

/** Public API docs (unchanged from the previous developer page). */
const DOCS_URL = "https://docs-sms.mifumolabs.com/";

const SNIPPET = `POST https://mifumosms.mifumolabs.com/api/integration/v1/sms/send/
Authorization: Bearer mif_your_api_key_here
Content-Type: application/json

{
  "recipients": ["+255712345678"],
  "message": "Karibu SENDA — hello from the API",
  "sender_id": "SENDA"
}`;

function CodeCard() {
  const { tr } = useSiteLang();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };
  return (
    <div className="overflow-hidden rounded-3xl bg-[#0B1B3F] shadow-xl shadow-[#0B1B3F]/20">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="text-sm font-semibold text-white">send-sms.http</span>
        <button
          type="button"
          onClick={copy}
          className={cn("inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20", focusRing)}
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? tr("Copied", "Imenakiliwa") : tr("Copy", "Nakili")}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-[13px] leading-relaxed text-[#C9D3E3]">
        <code>{SNIPPET}</code>
      </pre>
      <div className="border-t border-white/10 px-5 py-3 text-xs text-[#93B4F5]">{tr("Response · 200 OK", "Jibu · 200 OK")}</div>
    </div>
  );
}

export default function Developers() {
  const { tr } = useSiteLang();

  const steps = [
    {
      icon: KeyRound,
      title: tr("Create an account and an API key", "Fungua akaunti na tengeneza funguo ya API"),
      body: tr("Sign up, then generate a key in your dashboard. Keys start with mif_.", "Jisajili, kisha tengeneza funguo kwenye dashibodi yako. Funguo huanza na mif_."),
    },
    {
      icon: MessageSquare,
      title: tr("Send your first SMS", "Tuma SMS yako ya kwanza"),
      body: tr("POST the recipients, message and sender name to the send endpoint.", "Tuma wapokeaji, ujumbe na jina la mtumaji kwenye endpoint ya kutuma."),
    },
    {
      icon: Webhook,
      title: tr("Track delivery", "Fuatilia ufikishaji"),
      body: tr("Use delivery reports and webhooks to see what reached each number.", "Tumia ripoti za ufikishaji na webhooks kuona kilichomfikia kila mpokeaji."),
    },
  ];

  const pillars = [
    {
      icon: Server,
      title: tr("High availability", "Upatikanaji wa juu"),
      body: tr(
        "Built on distributed systems so your notifications keep flowing when you need them.",
        "Imejengwa kwa mifumo iliyosambazwa ili arifa zako ziendelee kutumwa unapozihitaji.",
      ),
    },
    {
      icon: ShieldCheck,
      title: tr("Focus on your product", "Zingatia bidhaa yako"),
      body: tr(
        "Integrate once and leave message routing and delivery to us.",
        "Unganisha mara moja, na utuachie uelekezaji na ufikishaji wa ujumbe.",
      ),
    },
    {
      icon: Activity,
      title: tr("Reliable delivery", "Ufikishaji wa uhakika"),
      body: tr(
        "Detailed logs and delivery reports show the status of every message.",
        "Kumbukumbu na ripoti za ufikishaji zinaonyesha hali ya kila ujumbe.",
      ),
    },
  ];

  const features = [
    { icon: MessageSquare, title: tr("Send SMS", "Tuma SMS"), body: tr("To one number or thousands at once", "Kwa namba moja au maelfu kwa wakati mmoja") },
    { icon: Users, title: tr("Contact management", "Usimamizi wa mawasiliano"), body: tr("Manage contacts and groups", "Simamia mawasiliano na makundi") },
    { icon: BarChart3, title: tr("Analytics", "Takwimu"), body: tr("Delivery rates and campaign performance", "Viwango vya ufikishaji na utendaji wa kampeni") },
    { icon: Languages, title: tr("Multi-language", "Lugha nyingi"), body: tr("Kiswahili, English and more", "Kiswahili, Kiingereza na nyingine") },
  ];

  return (
    <SitePage title={tr("Developers — SENDA API", "Wasanidi — SENDA API")}>
      <section className="bg-white px-3 pb-4 pt-4 sm:px-5 sm:pb-6" aria-labelledby="dev-title">
        <div className="mx-auto max-w-[1320px] overflow-hidden rounded-[32px] bg-[radial-gradient(120%_120%_at_0%_0%,#DCE8FF_0%,#EEF3FF_35%,#F7F1FB_70%,#FDF2F4_100%)]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
            <div className="min-w-0">
              <h1 id="dev-title" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0B1B3F] sm:text-5xl">
                {tr("Send SMS from your own software", "Tuma SMS kutoka kwenye mfumo wako")}
              </h1>
              <Lead>
                {tr(
                  "The SENDA API lets you send OTPs, alerts and notifications with a few lines of code, and track every message.",
                  "SENDA API inakuwezesha kutuma OTP, tahadhari na arifa kwa mistari michache ya msimbo, na kufuatilia kila ujumbe.",
                )}
              </Lead>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className={btnClass("primary")}>
                  <BookOpen className="h-4 w-4" aria-hidden /> {tr("Read the API docs", "Soma nyaraka za API")}
                </a>
                <ButtonLink to="/signup" variant="secondary">
                  <KeyRound className="h-4 w-4" aria-hidden /> {tr("Get API keys", "Pata funguo za API")}
                </ButtonLink>
              </div>
            </div>
            <div className="min-w-0">
              <CodeCard />
            </div>
          </div>
        </div>
      </section>

      <Section labelledBy="dev-steps-title">
        <Reveal>
          <H2 id="dev-steps-title">{tr("Start in three steps", "Anza kwa hatua tatu")}</H2>
        </Reveal>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title}>
              <Reveal delay={i * 80} className="h-full rounded-2xl border border-[#E3E7EE] p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">{i + 1}</span>
                  <Icon className="h-5 w-5 text-[#2563EB]" aria-hidden />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[#0B1B3F]">{title}</h3>
                <p className="mt-2 leading-relaxed text-[#4B5565]">{body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      <Section grey labelledBy="dev-features-title">
        <Reveal>
          <H2 id="dev-features-title">{tr("What the API can do", "API inaweza kufanya nini")}</H2>
          <Lead>{tr("Everything you need to add messaging to your application.", "Kila unachohitaji kuongeza ujumbe kwenye programu yako.")}</Lead>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 80} className="rounded-2xl border border-[#E3E7EE] bg-white p-6">
              <Icon className="h-7 w-7 text-[#2563EB]" aria-hidden />
              <h3 className="mt-4 font-semibold text-[#0B1B3F]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4B5565]">{body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section labelledBy="dev-pillars-title">
        <Reveal>
          <H2 id="dev-pillars-title">{tr("Built to be relied on", "Imejengwa kuaminika")}</H2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 80} className="rounded-2xl border border-[#E3E7EE] p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-[#0B1B3F]">{title}</h3>
              <p className="mt-2 leading-relaxed text-[#4B5565]">{body}</p>
            </Reveal>
          ))}
        </div>
        <Reveal className="mt-10">
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-2 font-semibold text-[#2563EB] hover:underline", focusRing)}>
            <BookOpen className="h-4 w-4" aria-hidden /> {tr("Open the full API documentation", "Fungua nyaraka kamili za API")}
          </a>
        </Reveal>
      </Section>

      <DemoInvitation source="developers" />
    </SitePage>
  );
}
