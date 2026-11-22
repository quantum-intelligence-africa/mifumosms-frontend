import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Check, Headphones, MessageCircle, MessageSquare, PhoneCall, Rocket, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink, H2, Section, SitePage, Tag, focusRing } from "../Layout";
import { SUPPORT, fmtTZS, useContent } from "../content";
import { useSiteLang } from "../i18n";
import { Reveal } from "../Reveal";
import { SmsCalculator, TierCards } from "./BulkSms";
import { Faqs } from "./Home";

type TabKey = "sms" | "whatsapp" | "calls";

function CallCenterPlans() {
  const { tr } = useSiteLang();
  const { PLANS, ONBOARDING_FEE } = useContent();
  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PLANS.map((p, i) => (
          <li key={p.key} className="flex">
            <Reveal delay={i * 80} className="flex w-full">
              <div
                className={cn(
                  "relative flex w-full flex-col rounded-2xl border bg-white p-5",
                  p.recommended ? "border-2 border-[#2563EB] shadow-lg shadow-[#2563EB]/10" : "border-[#E3E7EE]",
                )}
              >
                {p.recommended && (
                  <span className="absolute -top-3 left-5">
                    <Tag>{tr("Recommended", "Inapendekezwa")}</Tag>
                  </span>
                )}
                <h3 className="text-xl font-bold text-[#0B1B3F]">{p.name}</h3>
                <p className="mt-1 min-h-[40px] text-sm text-[#4B5565]">{p.summary}</p>
                <div className="mt-4 min-h-[56px]">
                  {p.price !== null ? (
                    <>
                      <p className="text-2xl font-extrabold tabular-nums text-[#0B1B3F]">{fmtTZS(p.price)}</p>
                      <p className="text-xs text-[#5B6575]">{tr("per month, billed monthly", "kwa mwezi, hulipwa kila mwezi")}</p>
                    </>
                  ) : p.pending ? (
                    <>
                      <p className="text-lg font-bold text-[#0B1B3F]">{tr("Price coming soon", "Bei itatangazwa hivi karibuni")}</p>
                      <Tag tone="amber">{tr("To be confirmed", "Itathibitishwa")}</Tag>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-[#0B1B3F]">{tr("Quoted for you", "Bei maalum kwako")}</p>
                      <p className="text-xs text-[#5B6575]">{tr("Based on call volume and integrations", "Kulingana na idadi ya simu na miunganisho")}</p>
                    </>
                  )}
                </div>
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#0B1B3F]">
                  <Users className="h-4 w-4 text-[#2563EB]" aria-hidden /> {p.agents}
                </p>
                <ul className="mt-3 flex-1 space-y-2 text-sm text-[#3F4A5A]">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563EB]" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 flex items-center gap-2 border-t border-[#EEF0F4] pt-3 text-xs text-[#4B5565]">
                  <Headphones className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden /> {p.support}
                </p>
                <ButtonLink
                  to={`/book-demo?plan=${p.key}&source=pricing`}
                  variant={p.recommended ? "primary" : "secondary"}
                  className="mt-5 w-full px-3 py-2.5 text-sm"
                >
                  {p.key === "custom" ? tr("Talk to our team", "Ongea na timu yetu") : tr(`Choose ${p.name}`, `Chagua ${p.name}`)}
                </ButtonLink>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>

      <Reveal className="mt-8">
        <div className="grid gap-6 rounded-2xl border border-[#E3E7EE] bg-[#F5F6F8] p-6 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0B1B3F]">
              <Rocket className="h-5 w-5 text-[#2563EB]" aria-hidden /> {tr("One-time onboarding fee", "Ada ya kuanza (mara moja)")}
            </h3>
            <p className="mt-1 text-2xl font-extrabold text-[#0B1B3F]">
              {ONBOARDING_FEE.amount !== null ? fmtTZS(ONBOARDING_FEE.amount) : tr("Amount to be confirmed", "Kiasi kitathibitishwa")}
            </p>
            <p className="text-sm text-[#5B6575]">{tr("Charged once, separate from the monthly plan.", "Hulipwa mara moja, tofauti na mpango wa kila mwezi.")}</p>
          </div>
          <ul className="grid gap-2 text-sm text-[#3F4A5A] sm:grid-cols-3">
            {ONBOARDING_FEE.covers.map((c) => (
              <li key={c} className="flex gap-2 rounded-xl bg-white p-3">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563EB]" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </>
  );
}

export default function Pricing() {
  const { tr } = useSiteLang();
  const { SMS_TIERS, WA_TIERS, SMS_FAQS, WA_FAQS, FAQS } = useContent();
  const { hash } = useLocation();
  const fromHash = (h: string): TabKey => (h === "#whatsapp" ? "whatsapp" : h === "#sms" ? "sms" : "calls");
  const [tab, setTab] = useState<TabKey>(fromHash(hash));
  useEffect(() => setTab(fromHash(hash)), [hash]);

  const tabs: { key: TabKey; label: string; icon: typeof PhoneCall }[] = [
    { key: "calls", label: tr("Call Center", "Kituo cha Simu"), icon: PhoneCall },
    { key: "sms", label: tr("Bulk SMS", "SMS"), icon: MessageSquare },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  ];

  const select = (k: TabKey) => {
    setTab(k);
    // Keep the address shareable without triggering the page's scroll-to-hash.
    window.history.replaceState(window.history.state, "", `#${k}`);
  };

  const faqs = tab === "sms" ? SMS_FAQS : tab === "whatsapp" ? WA_FAQS : FAQS;
  const getStarted = tr("Get started", "Anza sasa");

  const supportCards = [
    {
      title: tr("Help getting started", "Msaada wa kuanza"),
      body: tr(
        "We help you request a sender name, connect WhatsApp, and set up call forwarding. Call Center clients get a named setup contact.",
        "Tunakusaidia kuomba jina la mtumaji, kuunganisha WhatsApp na kuweka uhamishaji wa simu. Wateja wa Kituo cha Simu hupata mtu maalum wa kuwasaidia kuweka mfumo.",
      ),
    },
    {
      title: tr("Support in Kiswahili and English", "Msaada kwa Kiswahili na Kiingereza"),
      body: tr(
        `Call or WhatsApp ${SUPPORT.phoneDisplay}, or email ${SUPPORT.email}.`,
        `Piga simu au tuma WhatsApp kwa ${SUPPORT.phoneDisplay}, au barua pepe ${SUPPORT.email}.`,
      ),
    },
    {
      title: tr("Grow at your own pace", "Kua kwa kasi yako"),
      body: tr(
        "Buy more SMS when you need them, and move up a Call Center plan when you add agents or numbers.",
        "Nunua SMS zaidi unapozihitaji, na panda mpango wa Kituo cha Simu unapoongeza wahudumu au namba.",
      ),
    },
  ];

  return (
    <SitePage title={tr("Pricing — SENDA", "Bei — SENDA")}>
      <section className="bg-white" aria-labelledby="pricing-title">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-14 sm:px-6 lg:pt-16">
          <h1 id="pricing-title" className="text-4xl font-extrabold tracking-tight text-[#0B1B3F] sm:text-5xl">
            {tr("Simple prices in Tanzanian shillings", "Bei rahisi kwa shilingi za Kitanzania")}
          </h1>
          <div
            role="tablist"
            aria-label={tr("Product pricing", "Bei za huduma")}
            className="mt-8 inline-flex flex-wrap rounded-full border border-[#E3E7EE] bg-white p-1 shadow-sm"
          >
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                id={`ptab-${key}`}
                type="button"
                aria-selected={tab === key}
                aria-controls="pricing-panel"
                onClick={() => select(key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-semibold transition-colors sm:px-5",
                  focusRing,
                  tab === key ? "bg-[#0B1B3F] text-white" : "text-[#3F4A5A] hover:bg-[#F1F4F9]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <Section className="!pt-8" labelledBy={`ptab-${tab}`}>
        <div id="pricing-panel" role="tabpanel" aria-labelledby={`ptab-${tab}`}>
          {tab === "sms" && (
            <>
              <p className="mb-8 text-[#4B5565]">
                {tr(
                  "Buy SMS credits when you need them. No contract, no setup fee, minimum purchase 1,000 SMS.",
                  "Nunua salio la SMS unapohitaji. Hakuna mkataba wala ada ya kuanzisha, kiwango cha chini ni SMS 1,000.",
                )}
              </p>
              <TierCards tiers={SMS_TIERS} unit="SMS" ctaTo="/signup" ctaLabel={getStarted} />
              <Reveal className="mt-6">
                <SmsCalculator />
              </Reveal>
            </>
          )}
          {tab === "whatsapp" && (
            <>
              <p className="mb-8 text-[#4B5565]">
                {tr(
                  "Pay as you go per message sent. Volume discounts apply automatically. Prices exclude VAT.",
                  "Lipa kwa kila ujumbe unaotumwa. Punguzo la kiasi linatumika kiotomatiki. Bei hazijumuishi VAT.",
                )}
              </p>
              <TierCards tiers={WA_TIERS} unit={tr("message", "ujumbe")} ctaTo="/signup" ctaLabel={getStarted} />
            </>
          )}
          {tab === "calls" && (
            <>
              <p className="mb-8 text-[#4B5565]">
                {tr(
                  "Monthly plans by team size, plus a one-time onboarding fee. Choose a plan to book a demo with it selected.",
                  "Mipango ya kila mwezi kulingana na ukubwa wa timu, pamoja na ada ya kuanza ya mara moja. Chagua mpango ili uombe onyesho ukiwa umeuchagua.",
                )}
              </p>
              <CallCenterPlans />
            </>
          )}
        </div>
      </Section>

      <Section grey labelledBy="support-title">
        <Reveal>
          <H2 id="support-title">{tr("Setup and support", "Kuweka mfumo na msaada")}</H2>
        </Reveal>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {supportCards.map((c, i) => (
            <Reveal key={c.title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-[#E3E7EE] bg-white p-6">
                <h3 className="text-lg font-semibold text-[#0B1B3F]">{c.title}</h3>
                <p className="mt-2 leading-relaxed text-[#4B5565]">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/book-demo?source=pricing-support">{tr("Book a demo", "Omba onyesho")}</ButtonLink>
          <a
            href={SUPPORT.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border border-[#2563EB] bg-white px-5 py-3 text-[15px] font-semibold text-[#2563EB] hover:bg-[#EFF4FF]",
              focusRing,
            )}
          >
            {tr("Ask on WhatsApp", "Uliza kwa WhatsApp")}
          </a>
        </div>
      </Section>

      <Faqs key={tab} items={faqs} title={tr("Pricing questions", "Maswali kuhusu bei")} />
    </SitePage>
  );
}
