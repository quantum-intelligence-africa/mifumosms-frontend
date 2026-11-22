import { useState } from "react";
import { BarChart3, BadgeCheck, CalendarClock, Check, Code2, FileText, Languages, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink, H2, Section, SitePage, Tag } from "../Layout";
import { SmsComposerMock, SmsReportMock, TeamInboxMock } from "../ChannelMockups";
import { SMS_MIN_CREDITS, Tier, fmtTZS, smsRateFor, useContent } from "../content";
import { useSiteLang } from "../i18n";
import { Reveal } from "../Reveal";
import { DemoInvitation, Faqs } from "./Home";

export function TierCards({ tiers, unit, ctaTo, ctaLabel }: { tiers: Tier[]; unit: string; ctaTo: string; ctaLabel: string }) {
  const { tr } = useSiteLang();
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {tiers.map((t, i) => (
        <li key={t.name} className="flex">
          <Reveal delay={i * 80} className="flex w-full">
            <div
              className={cn(
                "relative flex w-full flex-col rounded-2xl border bg-white p-6",
                t.popular ? "border-2 border-[#2563EB] shadow-lg shadow-[#2563EB]/10" : "border-[#E3E7EE]",
              )}
            >
              {t.popular && (
                <span className="absolute -top-3 left-6">
                  <Tag>{tr("Most popular", "Maarufu zaidi")}</Tag>
                </span>
              )}
              <h3 className="text-xl font-bold text-[#0B1B3F]">{t.name}</h3>
              <p className="mt-1 text-sm text-[#4B5565]">{t.summary}</p>
              <p className="mt-5 text-3xl font-extrabold tabular-nums text-[#0B1B3F]">
                TZS {t.rate}
                <span className="text-base font-semibold text-[#5B6575]"> / {unit}</span>
              </p>
              <p className="text-sm text-[#5B6575]">{t.range}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-[#3F4A5A]">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563EB]" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              <ButtonLink to={ctaTo} variant={t.popular ? "primary" : "secondary"} className="mt-6 w-full">
                {ctaLabel}
              </ButtonLink>
            </div>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}

export function SmsCalculator() {
  const { tr } = useSiteLang();
  const [credits, setCredits] = useState("50000");
  const n = Number(credits.replace(/\D/g, "")) || 0;
  const below = n > 0 && n < SMS_MIN_CREDITS;
  const rate = smsRateFor(n);
  const nFmt = n.toLocaleString("en-US");
  return (
    <div className="grid gap-6 rounded-2xl border border-[#E3E7EE] bg-white p-6 md:grid-cols-[1fr_1fr] md:items-center">
      <div>
        <label htmlFor="sms-credits" className="text-lg font-semibold text-[#0B1B3F]">
          {tr("Estimate your cost", "Kadiria gharama yako")}
        </label>
        <p className="mt-1 text-sm text-[#5B6575]">
          {tr(
            "Enter how many SMS you want to buy. The rate drops automatically as volume grows.",
            "Weka idadi ya SMS unazotaka kununua. Bei hushuka kiotomatiki kadiri idadi inavyoongezeka.",
          )}
        </p>
        <input
          id="sms-credits"
          inputMode="numeric"
          value={n ? nFmt : ""}
          onChange={(e) => setCredits(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder={tr("e.g. 50,000", "mfano 50,000")}
          aria-describedby="sms-credits-hint"
          className="mt-4 w-full rounded-xl border border-[#D5DCE8] px-4 py-3 text-lg tabular-nums text-[#0B1B3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
        />
        <p id="sms-credits-hint" className={cn("mt-2 text-sm", below ? "text-[#B42318]" : "text-[#5B6575]")}>
          {tr("Minimum purchase:", "Kiwango cha chini cha ununuzi:")} {tr(`${SMS_MIN_CREDITS.toLocaleString("en-US")} SMS`, `SMS ${SMS_MIN_CREDITS.toLocaleString("en-US")}`)}.
        </p>
      </div>
      <div className="rounded-2xl bg-[#F5F6F8] p-5" aria-live="polite">
        <p className="text-sm text-[#5B6575]">{tr("Total cost", "Gharama jumla")}</p>
        <p className="text-4xl font-extrabold tabular-nums text-[#0B1B3F]">{n && !below ? fmtTZS(n * rate) : "—"}</p>
        <p className="mt-1 text-sm text-[#3F4A5A]">
          {n && !below
            ? tr(`${nFmt} SMS at TZS ${rate} each`, `SMS ${nFmt} kwa TZS ${rate} kila moja`)
            : tr("Enter at least 1,000 SMS", "Weka angalau SMS 1,000")}
        </p>
        <ButtonLink to="/signup" className="mt-5 w-full">
          {tr("Create an account to buy", "Fungua akaunti ili ununue")}
        </ButtonLink>
      </div>
    </div>
  );
}

export default function BulkSms() {
  const { tr } = useSiteLang();
  const { SMS_TIERS, SMS_FAQS } = useContent();
  const features = [
    {
      icon: CalendarClock,
      title: tr("Campaigns and scheduling", "Kampeni na ratiba"),
      body: tr(
        "Create a campaign once and send it now or at the time your customers are most likely to read it.",
        "Tengeneza kampeni mara moja na uitume sasa au wakati ambao wateja wako wana uwezekano mkubwa wa kuisoma.",
      ),
    },
    {
      icon: BarChart3,
      title: tr("Real-time delivery reports", "Ripoti za uwasilishaji papo hapo"),
      body: tr(
        "See delivered, pending and failed messages for every campaign and every number.",
        "Ona ujumbe uliowasilishwa, unaosubiri na ulioshindwa kwa kila kampeni na kila namba.",
      ),
    },
    {
      icon: BadgeCheck,
      title: tr("Your own sender name", "Jina lako la mtumaji"),
      body: tr(
        "Send from your business name instead of a number. We handle the approval with the networks.",
        "Tuma kwa jina la biashara yako badala ya namba. Sisi tunashughulikia idhini kutoka kwa mitandao.",
      ),
    },
    {
      icon: Users,
      title: tr("Contact management", "Usimamizi wa mawasiliano"),
      body: tr(
        "Import contacts from CSV, organise them into groups and send to the right segment.",
        "Leta mawasiliano kutoka CSV, yapange kwenye makundi na utume kwa kundi sahihi.",
      ),
    },
    {
      icon: FileText,
      title: tr("Templates", "Violezo"),
      body: tr(
        "Save the messages you send often, such as reminders and receipts, and reuse them in one click.",
        "Hifadhi ujumbe unaotuma mara kwa mara, kama vikumbusho na risiti, na uutumie tena kwa kubofya mara moja.",
      ),
    },
    {
      icon: Languages,
      title: tr("Kiswahili and English", "Kiswahili na Kiingereza"),
      body: tr(
        "Write in the language your customers speak. Messages also support French and Arabic.",
        "Andika kwa lugha wanayozungumza wateja wako. Ujumbe pia unaweza kuwa kwa Kifaransa na Kiarabu.",
      ),
    },
  ];

  return (
    <SitePage title={tr("Bulk SMS — SENDA", "SMS — SENDA")}>
      <section className="bg-white" aria-labelledby="sms-title">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-16">
          <div className="min-w-0">
            <h1 id="sms-title" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0B1B3F] sm:text-5xl">
              {tr("Reach every customer by SMS, on every network", "Wafikie wateja wako wote kwa SMS, kwenye kila mtandao")}
            </h1>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/signup">{tr("Get started", "Anza sasa")}</ButtonLink>
              <ButtonLink to="/pricing#sms" variant="secondary">
                {tr("See SMS prices", "Tazama bei za SMS")}
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-[#5B6575]">
              {tr("No contract and no setup fee. From TZS 12 per SMS.", "Hakuna mkataba wala ada ya kuanzisha. Kuanzia TZS 12 kwa SMS.")}
            </p>
          </div>
          <div className="min-w-0">
            <SmsComposerMock />
          </div>
        </div>
      </section>

      <Section grey labelledBy="sms-features-title">
        <Reveal>
          <H2 id="sms-features-title">{tr("Everything you need to send SMS at scale", "Kila unachohitaji kutuma SMS")}</H2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={(i % 3) * 80}>
              <div className="h-full rounded-2xl border border-[#E3E7EE] bg-white p-6">
                <Icon className="h-7 w-7 text-[#2563EB]" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold text-[#0B1B3F]">{title}</h3>
                <p className="mt-2 leading-relaxed text-[#4B5565]">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section labelledBy="sms-report-title">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <H2 id="sms-report-title">{tr("Know what reached your customers", "Jua kilichowafikia wateja wako")}</H2>
          </Reveal>
          <Reveal delay={120}>
            <SmsReportMock />
          </Reveal>
        </div>
      </Section>

      <Section grey id="replies" labelledBy="sms-replies-title">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <Reveal>
            <TeamInboxMock />
          </Reveal>
          <Reveal delay={120}>
            <H2 id="sms-replies-title">{tr("Answer replies with your team", "Jibuni majibu ya wateja kama timu")}</H2>
          </Reveal>
        </div>
      </Section>

      <Section labelledBy="sms-api-title">
        <Reveal>
          <div className="flex flex-col gap-6 rounded-3xl border border-[#E3E7EE] p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 id="sms-api-title" className="flex items-center gap-3 text-2xl font-bold text-[#0B1B3F]">
                <Code2 className="h-6 w-6 text-[#2563EB]" aria-hidden /> {tr("Send from your own system", "Tuma kutoka kwenye mfumo wako")}
              </h2>
              <p className="mt-2 max-w-xl text-[#4B5565]">
                {tr(
                  "Use the REST API and delivery webhooks for OTPs, alerts and notifications.",
                  "Tumia REST API na webhooks za uwasilishaji kwa OTP, tahadhari na taarifa.",
                )}
              </p>
            </div>
            <ButtonLink to="/developer" variant="secondary">
              {tr("Open the API reference", "Fungua maelezo ya API")}
            </ButtonLink>
          </div>
        </Reveal>
      </Section>

      <Section grey id="sms-pricing" labelledBy="sms-pricing-title">
        <Reveal>
          <H2 id="sms-pricing-title">{tr("Pay only for what you send", "Lipia tu unachotuma")}</H2>
        </Reveal>
        <div className="mt-10">
          <TierCards tiers={SMS_TIERS} unit="SMS" ctaTo="/signup" ctaLabel={tr("Get started", "Anza sasa")} />
        </div>
        <Reveal className="mt-6">
          <SmsCalculator />
        </Reveal>
      </Section>

      <DemoInvitation source="bulk-sms" />
      <Faqs items={SMS_FAQS} title={tr("Bulk SMS questions", "Maswali kuhusu SMS")} />
    </SitePage>
  );
}
