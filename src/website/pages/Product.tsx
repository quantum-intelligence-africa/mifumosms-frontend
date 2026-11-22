import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Check, FileText, Headphones, PhoneForwarded, PhoneMissed, PlayCircle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink, H2, Lead, Section, SitePage, Tag, focusRing } from "../Layout";
import { AgentDashboardMock, MissedCallsMock, ReviewCallMock, SupervisorDashboardMock, TrendsMock } from "../Mockups";
import { SAMPLE_LINES, fmtTime } from "../content";
import { useSiteLang } from "../i18n";
import { Reveal } from "../Reveal";
import { CallToFollowUp, CustomerStory, DemoInvitation, Faqs, HowItWorks } from "./Home";

type Tr = ReturnType<typeof useSiteLang>["tr"];

function TranscriptVisual() {
  const { tr } = useSiteLang();
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E3E7EE] bg-white">
      <div className="flex items-center justify-between border-b border-[#E3E7EE] bg-[#FAFBFC] px-4 py-2.5">
        <span className="text-sm font-semibold text-[#0B1B3F]">{tr("Transcript", "Maandishi ya mazungumzo")}</span>
        <span className="rounded-full bg-[#EEF0F4] px-2.5 py-1 text-xs font-semibold text-[#3F4A5A]">{tr("Demo data", "Data ya mfano")}</span>
      </div>
      <ol className="space-y-1 p-3">
        {SAMPLE_LINES.slice(1, 6).map((l, i) => (
          <li key={i} className={cn("rounded-lg p-2 text-sm", i === 2 && "bg-[#EAF1FF]")}>
            <p className="text-xs text-[#5B6575]">
              <span className="font-semibold text-[#0B1B3F]">{l.who === "customer" ? "Mteja · Customer" : "Mhudumu · Agent"}</span> ·{" "}
              <span className="tabular-nums">{fmtTime(l.at)}</span>
            </p>
            <p className="mt-0.5 text-[#0B1B3F]">{l.sw}</p>
            <p className="text-[#5B6575]">{l.en}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

const capabilities = (tr: Tr) => [
  {
    id: "call-review",
    icon: PlayCircle,
    title: tr("Call review", "Kupitia simu"),
    body: tr(
      "Play any recorded call, jump to the moment that matters and see who answered, when and for how long.",
      "Sikiliza simu yoyote iliyorekodiwa, ruka hadi sehemu muhimu na uone nani alipokea, lini na kwa muda gani.",
    ),
    visual: <ReviewCallMock />,
  },
  {
    id: "transcripts",
    icon: FileText,
    title: tr("Transcripts", "Maandishi ya mazungumzo"),
    body: tr(
      "Time-stamped transcripts in the language spoken, with an English translation for review. Click a line to hear it.",
      "Maandishi yenye muda kwa lugha iliyozungumzwa, pamoja na tafsiri ya Kiingereza kwa ajili ya kupitia. Bofya mstari kuusikiliza.",
    ),
    visual: <TranscriptVisual />,
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: tr("Call analytics", "Takwimu za simu"),
    body: tr(
      "Answered and missed calls, answer rate and callbacks due for any reporting period, by team or agent.",
      "Simu zilizopokelewa na zilizokosekana, kiwango cha kupokea na simu za kupiga tena kwa kipindi chochote, kwa timu au mhudumu.",
    ),
    visual: <TrendsMock />,
  },
  {
    id: "missed-calls",
    icon: PhoneMissed,
    title: tr("Missed-call handling", "Kushughulikia simu zilizokosekana"),
    body: tr(
      "Every missed call is listed with how it ended, so your team can schedule a callback and mark it contacted.",
      "Kila simu iliyokosekana inaorodheshwa pamoja na jinsi ilivyoisha, ili timu yako ipange kupiga tena na kuweka alama kuwa mteja amepatikana.",
    ),
    visual: <MissedCallsMock />,
  },
];

function VoiceAndIvr() {
  const { tr } = useSiteLang();
  const pillars = [
    {
      icon: PhoneForwarded,
      title: tr("Smart call routing", "Uelekezaji mahiri wa simu"),
      body: tr("Every call reaches the right agent the first time.", "Kila simu inamfikia mhudumu sahihi mara ya kwanza."),
      items: [
        tr("IVR menus", "Menyu za IVR"),
        tr("Automatic call distribution", "Kugawa simu kiotomatiki"),
        tr("Priority queues", "Foleni za kipaumbele"),
        tr("Callback on busy", "Kupigiwa tena laini ikiwa na shughuli"),
      ],
    },
    {
      icon: Headphones,
      title: tr("Full telephony suite", "Huduma kamili za simu"),
      body: tr("Answer on a softphone, deskphone or mobile with the same login.", "Pokea kwa simu ya kompyuta, simu ya mezani au simu ya mkononi kwa akaunti ileile."),
      items: [
        tr("Hold, mute, transfer and conference", "Kusubirisha, kunyamazisha, kuhamisha na simu ya mkutano"),
        tr("Call recording", "Kurekodi simu"),
        tr("Live listen, whisper and barge-in", "Kusikiliza moja kwa moja, kunong'oneza na kuingilia simu"),
        tr("Working hours rules", "Kanuni za saa za kazi"),
      ],
    },
    {
      icon: Radio,
      title: tr("Outbound and surveys", "Simu za kutoka na tafiti"),
      body: tr("Call customers back and learn how calls went.", "Wapigie wateja tena na ujue simu zilikwendaje."),
      items: [
        tr("Outbound campaign dialer", "Kipigaji cha kampeni za simu za kutoka"),
        tr("Automated voice surveys", "Tafiti za sauti za kiotomatiki"),
        tr("Post-call satisfaction", "Kuridhika baada ya simu"),
        tr("Multilingual prompts", "Maelekezo ya sauti kwa lugha mbalimbali"),
      ],
    },
  ];
  return (
    <Section labelledBy="voice-title">
      <Reveal>
        <H2 id="voice-title">{tr("Everything you need to run a call team", "Kila unachohitaji kuendesha timu ya simu")}</H2>
        <Lead>
          {tr(
            "Replace the scattered staff mobiles with one business line, one menu and one place to see every call.",
            "Badala ya simu za mkononi za wafanyakazi zilizotawanyika, tumia laini moja ya biashara, menyu moja na sehemu moja ya kuona kila simu.",
          )}
        </Lead>
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {pillars.map(({ icon: Icon, title, body, items }, i) => (
          <Reveal key={title} delay={i * 80}>
            <div className="h-full rounded-2xl border border-[#E3E7EE] p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-[#0B1B3F]">{title}</h3>
              <p className="mt-2 text-[#4B5565]">{body}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#3F4A5A]">
                {items.map((x) => (
                  <li key={x} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563EB]" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
      <p className="mt-6 text-sm text-[#5B6575]">
        <Tag tone="grey">{tr("Plan features vary", "Huduma hutofautiana kwa mpango")}</Tag>{" "}
        <span className="ml-2">{tr("Some features depend on your plan. See ", "Baadhi ya huduma hutegemea mpango wako. Tazama ")}</span>
        <a href="/pricing#calls" className="font-semibold text-[#2563EB] underline">
          {tr("Call Center plans", "mipango ya Kituo cha Simu")}
        </a>
        .
      </p>
    </Section>
  );
}

export default function Product() {
  const { tr } = useSiteLang();
  const CAPABILITIES = capabilities(tr);
  return (
    <SitePage title={tr("Call Center — SENDA", "Kituo cha Simu — SENDA")}>
      <section className="bg-white" aria-labelledby="product-title">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 lg:pt-20">
          <h1 id="product-title" className="max-w-3xl text-4xl font-extrabold tracking-tight text-[#0B1B3F] sm:text-5xl">
            {tr("Give every customer call a clear next step", "Kila simu ya mteja ipate hatua inayofuata iliyo wazi")}
          </h1>
          <Lead>
            {tr(
              "A cloud call center on the number your customers already know: IVR menus and call routing, recordings and transcripts, team review and missed-call follow-up.",
              "Kituo cha simu cha mtandaoni kwenye namba ambayo wateja wako tayari wanaijua: menyu za IVR na uelekezaji wa simu, rekodi na maandishi ya mazungumzo, kupitia simu kama timu na ufuatiliaji wa simu zilizokosekana.",
            )}
          </Lead>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/book-demo?source=call-center-hero">{tr("Book a demo", "Omba onyesho")}</ButtonLink>
            <ButtonLink to="/pricing#calls" variant="secondary">
              {tr("See Call Center plans", "Tazama mipango ya Kituo cha Simu")}
            </ButtonLink>
            <ButtonLink to="/#sample-call" variant="secondary">
              {tr("Hear a sample call", "Sikiliza simu ya mfano")}
            </ButtonLink>
          </div>
          <nav aria-label={tr("Capabilities", "Uwezo")} className="mt-8 flex flex-wrap gap-2">
            {CAPABILITIES.map(({ id, icon: Icon, title }) => (
              <a
                key={id}
                href={`#${id}`}
                className={cn("inline-flex items-center gap-2 rounded-full border border-[#E3E7EE] px-4 py-2 text-sm font-semibold text-[#0B1B3F] hover:border-[#2563EB] hover:text-[#2563EB]", focusRing)}
              >
                <Icon className="h-4 w-4 text-[#2563EB]" aria-hidden /> {title}
              </a>
            ))}
            <a
              href="#walkthrough"
              className={cn("inline-flex items-center gap-2 rounded-full bg-[#EAF1FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#DCE7FF]", focusRing)}
            >
              {tr("Dashboard walkthrough", "Ziara ya dashibodi")} <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </nav>
        </div>
      </section>

      <CustomerStory />
      <VoiceAndIvr />
      <CallToFollowUp />
      {CAPABILITIES.map(({ id, icon: Icon, title, body, visual }, i) => (
        <Section key={id} id={id} grey={i % 2 === 1} labelledBy={`${id}-title`}>
          <div className={cn("grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center", i % 2 === 1 && "lg:[&>*:first-child]:order-2")}>
            <Reveal>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h2 id={`${id}-title`} className="mt-5 text-3xl font-bold tracking-tight text-[#0B1B3F]">
                {title}
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-[#4B5565]">{body}</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <a href="#walkthrough" className={cn("inline-flex items-center gap-1.5 font-semibold text-[#2563EB] hover:underline", focusRing)}>
                  {tr("See it in the walkthrough", "Iona kwenye ziara ya dashibodi")} <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                <Link to={`/book-demo?source=product-${id}`} className={cn("inline-flex items-center gap-1.5 font-semibold text-[#0B1B3F] hover:underline", focusRing)}>
                  {tr("Book a demo", "Omba onyesho")}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={120}>{visual}</Reveal>
          </div>
        </Section>
      ))}

      <Section id="walkthrough" labelledBy="walkthrough-title">
        <Reveal>
          <H2 id="walkthrough-title">{tr("What your agents and supervisors see", "Kile wahudumu na wasimamizi wako wanachoona")}</H2>
          <Lead>
            {tr(
              "Illustrative screens with demonstration data. Labels and filters match the live Call Center dashboard.",
              "Skrini za mfano zenye data ya maonyesho. Lebo na vichujio vinalingana na dashibodi halisi ya Kituo cha Simu.",
            )}
          </Lead>
        </Reveal>

        <Reveal className="mt-12 grid gap-8 lg:grid-cols-[0.55fr_1.45fr]">
          <div>
            <h3 className="text-xl font-semibold text-[#0B1B3F]">{tr("Agent view", "Mwonekano wa mhudumu")}</h3>
            <ul className="mt-3 space-y-3 text-[#4B5565]">
              <li>
                <span className="font-semibold text-[#0B1B3F]">{tr("Find a call.", "Tafuta simu.")}</span>{" "}
                {tr(
                  "Search by number or agent and filter by direction, team, result and date.",
                  "Tafuta kwa namba au mhudumu na chuja kwa uelekeo, timu, matokeo na tarehe.",
                )}
              </li>
              <li>
                <span className="font-semibold text-[#0B1B3F]">{tr("Open it.", "Ifungue.")}</span>{" "}
                {tr(
                  "See the date, time, duration and who answered, play the recording when one is available, and read the transcript.",
                  "Ona tarehe, saa, muda na nani alipokea, sikiliza rekodi ikiwepo, na usome maandishi ya mazungumzo.",
                )}
              </li>
            </ul>
          </div>
          <AgentDashboardMock />
        </Reveal>

        <Reveal className="mt-14 grid gap-8 lg:grid-cols-[0.55fr_1.45fr]">
          <div>
            <h3 className="text-xl font-semibold text-[#0B1B3F]">{tr("Supervisor view", "Mwonekano wa msimamizi")}</h3>
            <ul className="mt-3 space-y-3 text-[#4B5565]">
              <li>
                <span className="font-semibold text-[#0B1B3F]">{tr("Choose a reporting period.", "Chagua kipindi cha ripoti.")}</span>{" "}
                {tr(
                  "Answered and missed calls, answer rate and callbacks due, for all teams or one.",
                  "Simu zilizopokelewa na zilizokosekana, kiwango cha kupokea na simu za kupiga tena, kwa timu zote au moja.",
                )}
              </li>
              <li>
                <span className="font-semibold text-[#0B1B3F]">{tr("Review with the team.", "Pitieni pamoja kama timu.")}</span>{" "}
                {tr(
                  "Open any agent's calls from the performance table and go through a call together.",
                  "Fungua simu za mhudumu yeyote kutoka jedwali la utendaji na mpitie simu pamoja.",
                )}
              </li>
            </ul>
          </div>
          <SupervisorDashboardMock />
        </Reveal>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <ButtonLink to="/book-demo?source=product-walkthrough">{tr("Book a demo", "Omba onyesho")}</ButtonLink>
          <ButtonLink to="/pricing" variant="secondary">
            {tr("Compare plans", "Linganisha mipango")}
          </ButtonLink>
        </div>
      </Section>

      <HowItWorks />
      <DemoInvitation source="call-center" />
      <Faqs />
    </SitePage>
  );
}
