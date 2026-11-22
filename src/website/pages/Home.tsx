import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Code2,
  MessageCircle,
  MessageSquare,
  Database,
  Headphones,
  LayoutDashboard,
  MessageSquareText,
  PhoneCall,
  PhoneForwarded,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink, H2, Lead, Section, SitePage, Tag, focusRing } from "../Layout";
import { SampleCallCard, useSamplePlayback } from "../SampleCallPlayer";
import { Partners } from "../Partners";
import { DiscussMock, ReviewCallMock, TrendsMock } from "../Mockups";
import { SmsComposerMock, TeamInboxMock, WaBroadcastMock } from "../ChannelMockups";
import { ProductKey, SAMPLE_LINES, SUPPORT, useContent } from "../content";
import { useSiteLang } from "../i18n";
import { Reveal } from "../Reveal";

function Hero() {
  const { tr } = useSiteLang();
  const playback = useSamplePlayback();
  const { hash, key } = useLocation();
  const [tab, setTab] = useState<ProductKey>("calls");
  const [expanded, setExpanded] = useState(false);
  // "Hear a sample call" links from other sections and pages land here expanded.
  useEffect(() => {
    if (hash === "#sample-call") {
      setTab("calls");
      setExpanded(true);
    }
  }, [hash, key]);

  const heroTabs: { key: ProductKey; label: string; icon: typeof PhoneCall }[] = [
    { key: "calls", label: tr("Call Center", "Kituo cha Simu"), icon: PhoneCall },
    { key: "sms", label: "Bulk SMS", icon: MessageSquare },
    { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  ];

  const hearSample = () => {
    setTab("calls");
    setExpanded(true);
    playback.play();
    requestAnimationFrame(() => document.getElementById("hero-demo")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const showWide = tab === "calls" && expanded;

  return (
    <section className="bg-white px-3 pb-4 pt-4 sm:px-5 sm:pb-6" aria-labelledby="hero-title">
      {/* Same soft gradient as the Call Center panel, as a rounded hero canvas. */}
      <div className="relative mx-auto max-w-[1320px] overflow-hidden rounded-[32px] bg-[radial-gradient(120%_120%_at_0%_0%,#DCE8FF_0%,#EEF3FF_35%,#F7F1FB_70%,#FDF2F4_100%)]">
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-14 pt-12 text-center sm:px-6 lg:pb-20 lg:pt-16">
        <div className="min-w-0">
          {/* Two lines on desktop: one sentence per line. */}
          <h1
            id="hero-title"
            className="text-[2.5rem] font-extrabold leading-[1.08] tracking-tight text-[#0B1B3F] sm:text-5xl xl:text-[min(3.4vw,3.5rem)]"
          >
            <span className="block">{tr("The complete contact & customer center,", "Kituo kamili cha mawasiliano na huduma kwa wateja,")}</span>
            <span className="block">{tr("built around AI voice agents.", "kilichojengwa kwenye wakala wa sauti wa AI.")}</span>
          </h1>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/signup">{tr("Get started", "Anza sasa")}</ButtonLink>
            <ButtonLink to="/book-demo?source=home-hero" variant="secondary">
              {tr("Book a demo", "Omba onyesho")}
            </ButtonLink>
          </div>
          <button type="button" onClick={hearSample} className={cn("mt-5 inline-flex items-center gap-2 font-semibold text-[#2563EB] hover:underline", focusRing)}>
            <Play className="h-4 w-4" fill="currentColor" aria-hidden /> {tr("Hear a sample call", "Sikiliza simu ya mfano")}
          </button>
        </div>

        <div id="hero-demo" className={cn("mt-12 w-full min-w-0 scroll-mt-24 text-left", showWide ? "max-w-5xl" : "max-w-3xl")}>
          <div
            role="tablist"
            aria-label={tr("Product preview", "Onyesho la huduma")}
            className="mx-auto mb-4 flex w-fit rounded-full border border-[#E3E7EE] bg-white p-1 shadow-sm"
          >
            {heroTabs.map(({ key: k, label, icon: Icon }) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4",
                  focusRing,
                  tab === k ? "bg-[#0B1B3F] text-white" : "text-[#3F4A5A] hover:bg-[#F1F4F9]",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            {tab === "sms" && <SmsComposerMock />}
            {tab === "whatsapp" && <WaBroadcastMock />}
            {tab === "calls" && (
              <SampleCallCard expanded={expanded} onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} playback={playback} />
            )}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}

function ProductsOverview() {
  const { tr } = useSiteLang();
  const { PRODUCTS } = useContent();
  const icons = { sms: MessageSquare, whatsapp: MessageCircle, calls: PhoneCall };
  return (
    <Section grey labelledBy="products-title">
      <Reveal>
        <H2 id="products-title">{tr("Everything your customers use to reach you", "Kila njia wateja wanayotumia kukufikia")}</H2>
        <Lead>
          {tr(
            "Use one channel or all three. Contacts, reports and your team stay in one account.",
            "Tumia njia moja au zote tatu. Anwani, ripoti na timu yako vinabaki kwenye akaunti moja.",
          )}
        </Lead>
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PRODUCTS.map((p, i) => {
          const Icon = icons[p.key];
          return (
            <Reveal key={p.key} delay={i * 80} className="flex">
              <Link
                to={p.to}
                className={cn(
                  "group flex w-full flex-col rounded-2xl border border-[#E3E7EE] bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-[#0B1B3F]/[0.06]",
                  focusRing,
                )}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-[#0B1B3F]">{p.name}</h3>
                <p className="mt-2 leading-relaxed text-[#4B5565]">{p.tagline}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-[#3F4A5A]">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563EB]" aria-hidden /> {pt}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-between border-t border-[#EEF0F4] pt-4">
                  <span className="text-sm font-semibold text-[#0B1B3F]">{p.from}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB]">
                    {tr("Learn more", "Soma zaidi")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}

function SharedInbox() {
  const { tr } = useSiteLang();
  const points = [
    tr("Assign and transfer conversations", "Kabidhi na hamisha mazungumzo"),
    tr("Saved replies", "Majibu yaliyohifadhiwa"),
    tr("Customer history in every thread", "Historia ya mteja kwenye kila mazungumzo"),
    tr("Role-based access", "Ufikiaji kulingana na wadhifa"),
  ];
  return (
    <Section labelledBy="inbox-title">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <Reveal>
          <H2 id="inbox-title">{tr("Every conversation in one place", "Mazungumzo yote mahali pamoja")}</H2>
          <Lead>
            {tr(
              "WhatsApp chats, SMS replies and missed calls arrive in one inbox. Assign each conversation to a team member, see the customer's history, and reply on the channel they used.",
              "Gumzo za WhatsApp, majibu ya SMS na simu zilizokosa zinaingia kwenye kikasha kimoja. Mkabidhi kila mazungumzo mtu wa timu, ona historia ya mteja, na ujibu kupitia njia aliyotumia.",
            )}
          </Lead>
          <ul className="mt-6 grid gap-2 text-[#3F4A5A] sm:grid-cols-2">
            {points.map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-1 h-4 w-4 flex-shrink-0 text-[#2563EB]" aria-hidden /> {x}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120} className="min-w-0">
          <TeamInboxMock />
        </Reveal>
      </div>
    </Section>
  );
}

/** Light, rounded call-center highlight panel. */
function CallCenterPanel() {
  const { tr } = useSiteLang();
  return (
    <section className="bg-white" aria-labelledby="cc-panel-title">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Reveal>
          <div className="rounded-[32px] bg-[radial-gradient(120%_120%_at_0%_0%,#DCE8FF_0%,#EEF3FF_35%,#F7F1FB_70%,#FDF2F4_100%)] px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 id="cc-panel-title" className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-[#0B1B3F] sm:text-5xl">
              {tr("Give every customer call a clear next step.", "Kila simu ya mteja ipate hatua inayofuata iliyo wazi.")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#4B5565]">
              {tr(
                "Review calls, read transcripts and help your team follow up.",
                "Kagua simu, soma maandishi ya mazungumzo na saidia timu yako kufuatilia.",
              )}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/products/call-center"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full bg-[#0B1B3F] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#16295A]",
                  focusRing,
                )}
              >
                {tr("Explore the Call Center", "Gundua Kituo cha Simu")} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                to="/#sample-call"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-[#D5DCE8] bg-white px-6 py-3 font-semibold text-[#0B1B3F] transition-colors hover:bg-[#F5F6F8]",
                  focusRing,
                )}
              >
                <Play className="h-4 w-4" fill="currentColor" aria-hidden /> {tr("Hear a sample call", "Sikiliza simu ya mfano")}
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function DevelopersStrip() {
  const { tr } = useSiteLang();
  return (
    <Section grey labelledBy="dev-title">
      <Reveal>
        <div className="grid gap-8 rounded-3xl border border-[#E3E7EE] bg-white p-6 sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <H2 id="dev-title">{tr("Connect SENDA to the systems you already run", "Unganisha SENDA na mifumo unayotumia tayari")}</H2>
            <Lead>
              {tr(
                "Send OTPs, alerts and notifications by SMS and WhatsApp from your own software, with a REST API, delivery webhooks and sandbox keys.",
                "Tuma OTP, tahadhari na arifa kwa SMS na WhatsApp kutoka kwenye programu yako, kupitia REST API, webhooks za ufikishaji na funguo za majaribio (sandbox).",
              )}
            </Lead>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/developer" variant="secondary">
                <Code2 className="h-4 w-4" aria-hidden /> {tr("Open the API reference", "Fungua mwongozo wa API")}
              </ButtonLink>
            </div>
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-[#0B1B3F] p-5 text-[13px] leading-relaxed text-[#C9D3E3]">
            <code>{`POST /api/integration/v1/sms/send/
Authorization: Bearer mif_your_api_key_here
Content-Type: application/json

{
  "recipients": ["+255712345678"],
  "message": "Tiketi yako imethibitishwa.",
  "sender_id": "SENDA"
}`}</code>
          </pre>
        </div>
      </Reveal>
    </Section>
  );
}

export function CustomerStory() {
  const { tr } = useSiteLang();
  const rows = [
    {
      icon: Target,
      title: tr("Challenge", "Changamoto"),
      body: tr(
        "Booking lines are busiest before the morning departures. Passengers ask about routes, times and fares, and some enquiries end without a booking or a callback.",
        "Simu za uhifadhi zinakuwa nyingi zaidi kabla ya safari za asubuhi. Abiria huuliza kuhusu njia, saa na nauli, na baadhi ya maombi huishia bila tiketi wala kupigiwa tena.",
      ),
    },
    {
      icon: Workflow,
      title: tr("Team workflow", "Utaratibu wa timu"),
      body: tr(
        "Each call is recorded and transcribed. Agents see the route, travel date and seats the passenger asked about, and the supervisor checks that every open enquiry has an owner.",
        "Kila simu hurekodiwa na kuandikwa. Wahudumu wanaona njia, tarehe ya safari na viti alivyoulizia abiria, na msimamizi anahakikisha kila ombi lililo wazi lina mhusika.",
      ),
    },
    {
      icon: BarChart3,
      title: tr("Outcome to measure", "Matokeo ya kupima"),
      body: tr(
        "Share of booking enquiries that receive a follow-up the same day. A verified result will be published here once a customer approves it.",
        "Asilimia ya maombi ya uhifadhi yanayofuatiliwa siku hiyo hiyo. Matokeo yaliyothibitishwa yatachapishwa hapa mteja atakapoyaidhinisha.",
      ),
    },
  ];
  return (
    <Section grey labelledBy="story-title">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <img
            src="/website/coach-depot.webp"
            alt={tr("Coaches parked at an operator's depot", "Mabasi yameegeshwa kwenye karakana ya kampuni")}
            className="aspect-[4/3] w-full rounded-3xl object-cover lg:aspect-[3/4]"
            loading="lazy"
          />
        </Reveal>
        <div>
          <Reveal>
            <Tag>{tr("Example use case", "Mfano wa matumizi")}</Tag>
            <H2 id="story-title" className="mt-4">
              {tr("Following up on coach booking enquiries", "Kufuatilia maombi ya kuhifadhi tiketi za basi")}
            </H2>
          </Reveal>
          <ul className="mt-8 space-y-4">
            {rows.map(({ icon: Icon, title, body }, i) => (
              <li key={title}>
                <Reveal delay={i * 80} className="flex gap-4 rounded-2xl border border-[#E3E7EE] bg-white p-5">
                  <Icon className="mt-0.5 h-6 w-6 flex-shrink-0 text-[#2563EB]" aria-hidden />
                  <div>
                    <h3 className="font-semibold text-[#0B1B3F]">{title}</h3>
                    <p className="mt-1 leading-relaxed text-[#4B5565]">{body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          <Link to="/use-cases/transport" className={cn("mt-6 inline-flex items-center gap-1.5 font-semibold text-[#2563EB] hover:underline", focusRing)}>
            {tr("See the transport use case", "Ona mfano wa usafirishaji")} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </Section>
  );
}

export function CallToFollowUp() {
  const { tr } = useSiteLang();
  const { SAMPLE_CALL } = useContent();
  const question = SAMPLE_LINES[5];
  const card = "flex h-full flex-col rounded-2xl border border-[#E3E7EE] p-5";
  return (
    <Section labelledBy="flow-title">
      <Reveal>
        <H2 id="flow-title">{tr("One passenger question, carried through to a reply", "Swali moja la abiria, hadi kupata jibu")}</H2>
        <Lead>
          {tr(
            "The same enquiry moves from the phone line to the call review to your team's follow-up, without anyone retyping it.",
            "Ombi lilelile linatoka kwenye simu, linakaguliwa, kisha timu yako inalifuatilia, bila mtu yeyote kuliandika upya.",
          )}
        </Lead>
      </Reveal>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        <li>
          <Reveal className={card}>
            <StepHead n={1} icon={PhoneCall} title={tr("Incoming enquiry", "Ombi linaloingia")} />
            <p className="mt-1 text-sm text-[#5B6575]">
              {SAMPLE_CALL.time} · {SAMPLE_CALL.callerNumber}
            </p>
            <blockquote className="mt-4 rounded-xl bg-[#F5F6F8] p-4">
              <p className="text-[15px] text-[#0B1B3F]">“{question.sw}”</p>
              <p className="mt-2 text-sm text-[#5B6575]">“{question.en}”</p>
            </blockquote>
          </Reveal>
        </li>
        <li>
          <Reveal delay={80} className={card}>
            <StepHead n={2} icon={MessageSquareText} title={tr("Review the call", "Kagua simu")} />
            <p className="mt-1 text-sm text-[#5B6575]">{tr("Recording, transcript and key details", "Rekodi, maandishi na mambo muhimu")}</p>
            <dl className="mt-4 space-y-1.5 text-sm">
              {[
                [tr("Route", "Njia"), SAMPLE_CALL.route],
                [tr("Coach", "Basi"), tr(`Tomorrow, ${SAMPLE_CALL.departure}`, `Kesho, ${SAMPLE_CALL.departure}`)],
                [tr("Seats", "Viti"), String(SAMPLE_CALL.seats)],
                [tr("Asked", "Aliuliza"), tr("Pay by phone", "Kulipa kwa simu")],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 rounded-lg bg-[#F5F6F8] px-3 py-2">
                  <dt className="text-[#5B6575]">{k}</dt>
                  <dd className="text-right font-medium text-[#0B1B3F]">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </li>
        <li>
          <Reveal delay={160} className={card}>
            <StepHead n={3} icon={Send} title={tr("Team follows up", "Timu inafuatilia")} />
            <p className="mt-1 text-sm text-[#5B6575]">
              {tr("Owner", "Mhusika")}: {SAMPLE_CALL.agent} · {tr("Bookings team", "Timu ya uhifadhi")}
            </p>
            <div className="mt-4 rounded-xl border border-[#D6E2FB] bg-[#F4F8FF] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1D4ED8]">{tr("Staff response (SMS)", "Jibu la mhudumu (SMS)")}</p>
              <p className="mt-1.5 text-[15px] text-[#0B1B3F]">
                “Habari! Hiki ni kiungo cha kuhifadhi viti 3 kwenye basi la saa tatu asubuhi kwenda Arusha. Asante — Safari Bora Coaches.”
              </p>
              <p className="mt-2 text-sm text-[#5B6575]">
                “Hello! Here is the link to reserve 3 seats on the 9:00 AM coach to Arusha. Thank you — Safari Bora Coaches.”
              </p>
            </div>
            <span className="mt-3">
              <Tag tone="green">{tr("Followed up", "Imefuatiliwa")}</Tag>
            </span>
          </Reveal>
        </li>
      </ol>
    </Section>
  );
}

function StepHead({ n, icon: Icon, title }: { n: number; icon: typeof PhoneCall; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">{n}</span>
      <h3 className="flex items-center gap-2 text-lg font-semibold text-[#0B1B3F]">
        <Icon className="h-5 w-5 text-[#2563EB]" aria-hidden /> {title}
      </h3>
    </div>
  );
}

export function HowItWorks() {
  const { tr } = useSiteLang();
  const stages = [
    {
      icon: PhoneForwarded,
      title: tr("Business phone line", "Namba ya simu ya biashara"),
      body: tr(
        "Keep the number customers already call and forward it to SENDA.",
        "Endelea kutumia namba ambayo wateja tayari wanaipiga na uielekeze kwa SENDA.",
      ),
    },
    {
      icon: Sparkles,
      title: "SENDA",
      body: tr(
        "Each call is recorded, transcribed and summarised with the key details and a suggested next step.",
        "Kila simu hurekodiwa, huandikwa na kufupishwa pamoja na mambo muhimu na hatua inayopendekezwa.",
      ),
    },
    {
      icon: LayoutDashboard,
      title: tr("Team dashboard", "Dashibodi ya timu"),
      body: tr(
        "Agents and supervisors review the call, agree the next step and track follow-ups.",
        "Wahudumu na wasimamizi wanakagua simu, wanakubaliana hatua inayofuata na kufuatilia utekelezaji.",
      ),
    },
  ];
  return (
    <Section grey labelledBy="how-title">
      <Reveal>
        <H2 id="how-title">{tr("From your phone line to your team in three steps", "Kutoka namba yako ya simu hadi kwa timu yako kwa hatua tatu")}</H2>
      </Reveal>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {stages.map(({ icon: Icon, title, body }, i) => (
          <li key={title}>
            <Reveal delay={i * 80} className="relative h-full rounded-2xl border border-[#E3E7EE] bg-white p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#5B6575]">
                {tr("Step", "Hatua")} {i + 1}
              </p>
              <h3 className="mt-1 text-xl font-semibold text-[#0B1B3F]">{title}</h3>
              <p className="mt-2 leading-relaxed text-[#4B5565]">{body}</p>
              {i < stages.length - 1 && (
                <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 rounded-full bg-[#F5F6F8] text-[#2563EB] md:block" aria-hidden />
              )}
            </Reveal>
          </li>
        ))}
      </ol>
      <Link to="/products/call-center" className={cn("mt-8 inline-flex items-center gap-1.5 font-semibold text-[#2563EB] hover:underline", focusRing)}>
        {tr("Explore the Call Center", "Gundua Kituo cha Simu")} <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </Section>
  );
}

export function TeamReview() {
  const { tr } = useSiteLang();
  const tabs = [
    { key: "review", label: tr("Review a call", "Kagua simu"), view: <ReviewCallMock /> },
    { key: "discuss", label: tr("Discuss the next step", "Jadilini hatua inayofuata"), view: <DiscussMock /> },
    { key: "trends", label: tr("Check call trends", "Angalia mwenendo wa simu"), view: <TrendsMock /> },
  ];
  const [active, setActive] = useState("review");
  return (
    <Section labelledBy="review-title">
      <Reveal className="text-center">
        <H2 id="review-title">{tr("Review calls with your team", "Kagueni simu pamoja na timu yako")}</H2>
        <Lead className="mx-auto">
          {tr(
            "Bring real customer conversations to your team, see what happened, and decide together on the next step.",
            "Leteni mazungumzo halisi ya wateja kwa timu, oneni kilichotokea, na mkubaliane pamoja hatua inayofuata.",
          )}
        </Lead>
      </Reveal>
      <Reveal delay={80}>
        <div role="tablist" aria-label={tr("Team review views", "Mionekano ya ukaguzi wa timu")} className="mx-auto mt-8 grid max-w-3xl gap-2 sm:grid-cols-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={active === t.key}
              aria-controls={`panel-${t.key}`}
              type="button"
              onClick={() => setActive(t.key)}
              className={cn(
                "rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors",
                focusRing,
                active === t.key ? "bg-[#2563EB] text-white" : "border border-[#E3E7EE] bg-white text-[#0B1B3F] hover:bg-[#F5F6F8]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="mx-auto mt-6 max-w-4xl">
          {tabs.map((t) => (
            <div key={t.key} role="tabpanel" id={`panel-${t.key}`} aria-labelledby={`tab-${t.key}`} hidden={active !== t.key}>
              {t.view}
            </div>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

export function TrustAndSupport() {
  const { tr } = useSiteLang();
  const cards = [
    {
      icon: Users,
      title: tr("Who can access calls", "Nani anaweza kufikia simu"),
      body: tr(
        "Access is role-based. Your administrators invite agents and supervisors and decide who can open recordings, transcripts and reports.",
        "Ufikiaji unategemea wadhifa. Wasimamizi wa mfumo wako huwaalika wahudumu na wasimamizi, na huamua nani anaweza kufungua rekodi, maandishi na ripoti.",
      ),
      link: { label: tr("How access works", "Jinsi ufikiaji unavyofanya kazi"), to: "/products/call-center#walkthrough", external: false },
    },
    {
      icon: Database,
      title: tr("How call data is handled", "Jinsi data za simu zinavyoshughulikiwa"),
      body: tr(
        "Recordings and transcripts are stored for your organisation only and are used to provide the service. Our privacy notice explains what we keep and why.",
        "Rekodi na maandishi huhifadhiwa kwa ajili ya shirika lako pekee na hutumika kutoa huduma. Taarifa yetu ya faragha inaeleza tunachohifadhi na kwa nini.",
      ),
      link: { label: tr("Read the privacy notice", "Soma taarifa ya faragha"), to: "/privacy", external: false },
    },
    {
      icon: Headphones,
      title: tr("Who to contact for support", "Wasiliana na nani kwa msaada"),
      body: tr(
        `Call or WhatsApp ${SUPPORT.phoneDisplay}, or email ${SUPPORT.email}. During setup you have a named SENDA contact.`,
        `Piga simu au tuma WhatsApp kwa ${SUPPORT.phoneDisplay}, au barua pepe kwa ${SUPPORT.email}. Wakati wa kuanza utakuwa na mtu maalum wa SENDA wa kuwasiliana naye.`,
      ),
      link: { label: tr("Message support on WhatsApp", "Tuma ujumbe kwa msaada kupitia WhatsApp"), to: SUPPORT.whatsappHref, external: true },
    },
  ];
  return (
    <Section grey labelledBy="trust-title">
      <Reveal>
        <H2 id="trust-title">{tr("Know what to expect before you go live", "Jua cha kutarajia kabla ya kuanza kutumia")}</H2>
      </Reveal>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {cards.map(({ icon: Icon, title, body, link }, i) => (
          <Reveal key={title} delay={i * 80} className="flex flex-col rounded-2xl border border-[#E3E7EE] bg-white p-6">
            <Icon className="h-8 w-8 text-[#2563EB]" aria-hidden />
            <h3 className="mt-5 text-xl font-semibold text-[#0B1B3F]">{title}</h3>
            <p className="mt-2 flex-1 leading-relaxed text-[#4B5565]">{body}</p>
            {link.external ? (
              <a href={link.to} target="_blank" rel="noreferrer" className={cn("mt-5 inline-flex items-center gap-1.5 font-semibold text-[#2563EB] hover:underline", focusRing)}>
                {link.label} <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            ) : (
              <Link to={link.to} className={cn("mt-5 inline-flex items-center gap-1.5 font-semibold text-[#2563EB] hover:underline", focusRing)}>
                {link.label} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </Reveal>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm text-[#5B6575]">
        <ShieldCheck className="h-4 w-4 text-[#2563EB]" aria-hidden />{" "}
        {tr(
          "SENDA is built and supported in Tanzania.",
          "SENDA imejengwa na inahudumiwa nchini Tanzania.",
        )}
      </p>
    </Section>
  );
}

export function DemoInvitation({ source = "home" }: { source?: string }) {
  const { tr } = useSiteLang();
  return (
    <Section labelledBy="invite-title">
      <Reveal>
        <div className="rounded-3xl border border-[#E3E7EE] bg-[#F5F6F8] px-6 py-12 text-center sm:px-12">
          <span className="mx-auto mt-4 block h-1 w-12 rounded-full bg-[#2563EB]" aria-hidden />
          <H2 id="invite-title" className="mt-6">
            {tr("See how SENDA fits your team.", "Ona jinsi SENDA inavyoifaa timu yako.")}
          </H2>
          <Lead className="mx-auto">
            {tr(
              "Bring one typical customer enquiry. We'll walk through how your team could review it and follow up.",
              "Leta ombi moja la kawaida la mteja. Tutakuonyesha jinsi timu yako inavyoweza kulikagua na kulifuatilia.",
            )}
          </Lead>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to={`/book-demo?source=${source}-invite`}>{tr("Book a demo", "Omba onyesho")}</ButtonLink>
            <ButtonLink to="/#sample-call" variant="secondary">
              <Play className="h-4 w-4" fill="currentColor" aria-hidden /> {tr("Hear a sample call", "Sikiliza simu ya mfano")}
            </ButtonLink>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

export function Faqs({ items, title }: { items?: { q: string; a: string }[]; title?: string }) {
  const { tr } = useSiteLang();
  const { FAQS } = useContent();
  const list = items ?? FAQS;
  const heading = title ?? tr("Frequently asked questions", "Maswali yanayoulizwa mara kwa mara");
  const [open, setOpen] = useState(0);
  return (
    <Section grey labelledBy="faq-title">
      <Reveal className="text-center">
        <H2 id="faq-title">{heading}</H2>
        <Lead className="mx-auto">
          {tr("Quick answers about SMS, WhatsApp, calls, setup and support.", "Majibu mafupi kuhusu SMS, WhatsApp, simu, kuanza na msaada.")}
        </Lead>
      </Reveal>
      <Reveal delay={80}>
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {list.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className={cn("rounded-2xl border bg-white", isOpen ? "border-[#2563EB]" : "border-[#E3E7EE]")}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className={cn("flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-[17px] font-semibold text-[#0B1B3F]", focusRing)}
                  >
                    {f.q}
                    <ChevronDown className={cn("h-5 w-5 flex-shrink-0 text-[#2563EB] transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </button>
                </h3>
                <div id={`faq-${i}`} hidden={!isOpen} className="px-5 pb-5 leading-relaxed text-[#4B5565]">
                  {f.a}
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}

export default function Home() {
  const { tr } = useSiteLang();
  const { FAQS, SMS_FAQS, WA_FAQS } = useContent();
  return (
    <SitePage
      title={tr(
        "SENDA — Call Center, Bulk SMS and WhatsApp for Tanzanian businesses",
        "SENDA — Kituo cha Simu, SMS na WhatsApp kwa biashara za Tanzania",
      )}
    >
      <Hero />
      <Partners />
      <ProductsOverview />
      <CallCenterPanel />
      <CallToFollowUp />
      <HowItWorks />
      <TeamReview />
      <SharedInbox />
      <DevelopersStrip />
      <TrustAndSupport />
      <DemoInvitation />
      <Faqs items={[...FAQS.slice(0, 3), SMS_FAQS[0], WA_FAQS[0], SMS_FAQS[1], FAQS[5]]} />
    </SitePage>
  );
}
