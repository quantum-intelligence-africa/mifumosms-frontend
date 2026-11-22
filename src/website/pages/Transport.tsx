import { useState } from "react";
import { Bus, CalendarDays, Play, PhoneMissed, Users } from "lucide-react";
import { ButtonLink, H2, Lead, Section, SitePage, Tag, btnClass } from "../Layout";
import { SampleCallCard, useSamplePlayback } from "../SampleCallPlayer";
import { DiscussMock, MissedCallsMock } from "../Mockups";
import { useContent } from "../content";
import { useSiteLang } from "../i18n";
import { Reveal } from "../Reveal";
import { Faqs } from "./Home";

const DEMO_LINK = "/book-demo?usecase=transport&source=usecase-transport";

export default function Transport() {
  const { tr } = useSiteLang();
  const { SAMPLE_CALL } = useContent();
  const playback = useSamplePlayback();
  const [expanded, setExpanded] = useState(false);
  const hearSample = () => {
    setExpanded(true);
    playback.play();
    requestAnimationFrame(() => document.getElementById("sample-call")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const needs = [
    {
      icon: CalendarDays,
      title: tr("Booking enquiries", "Maulizo ya kukata tiketi"),
      body: tr(
        "See the route, travel date and seats each passenger asked about, and who is following up.",
        "Ona njia, tarehe ya safari na viti ambavyo kila abiria aliuliza, na nani anafuatilia.",
      ),
    },
    {
      icon: PhoneMissed,
      title: tr("Missed calls", "Simu zilizokosekana"),
      body: tr(
        "Every missed call is listed with how it ended, so the team can schedule a callback before the coach leaves.",
        "Kila simu iliyokosekana inaorodheshwa pamoja na jinsi ilivyoisha, ili timu ipange kupiga tena kabla basi halijaondoka.",
      ),
    },
    {
      icon: Users,
      title: tr("Shift handover", "Kukabidhiana zamu"),
      body: tr(
        "The next shift sees which enquiries are still open, with the call and notes attached.",
        "Zamu inayofuata inaona maulizo ambayo bado yako wazi, pamoja na simu na maelezo yake.",
      ),
    },
  ];

  const details: [string, string][] = [
    [tr("Route", "Njia"), SAMPLE_CALL.route],
    [tr("Coach", "Basi"), `${tr("Tomorrow", "Kesho")}, ${SAMPLE_CALL.departure}`],
    [tr("Seats", "Viti"), String(SAMPLE_CALL.seats)],
    [tr("Fare quoted", "Nauli iliyotajwa"), SAMPLE_CALL.fare],
  ];

  return (
    <SitePage title={tr("Transport operators — SENDA", "Wasafirishaji — SENDA")}>
      <section className="bg-white" aria-labelledby="transport-title">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:pb-20 lg:pt-16">
          <div>
            <h1 id="transport-title" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0B1B3F] sm:text-5xl">
              {tr("Follow up on every booking enquiry", "Fuatilia kila ulizo la kukata tiketi")}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[#4B5565]">
              {tr(
                "Passengers call to ask about routes, times and fares. SENDA records and transcribes each call so your team can follow up before the coach leaves, across every shift.",
                "Abiria hupiga simu kuuliza kuhusu njia, saa na nauli. SENDA hurekodi na kuandika kila simu ili timu yako ifuatilie kabla basi halijaondoka, katika kila zamu.",
              )}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={hearSample} className={btnClass("secondary")}>
                <Play className="h-4 w-4" fill="currentColor" aria-hidden /> {tr("Hear a sample call", "Sikiliza simu ya mfano")}
              </button>
              <ButtonLink to={DEMO_LINK}>{tr("Book a demo", "Omba onyesho")}</ButtonLink>
            </div>
          </div>
          <img
            src="/website/transport-dar-station.webp"
            alt={tr("Passengers boarding coaches at a bus terminal in Dar es Salaam", "Abiria wakipanda mabasi kwenye kituo cha mabasi Dar es Salaam")}
            className="aspect-[3/2] w-full rounded-3xl object-cover"
          />
        </div>
      </section>

      <Section grey labelledBy="needs-title">
        <Reveal>
          <H2 id="needs-title">{tr("Built around how booking offices work", "Imejengwa kulingana na kazi ya ofisi za tiketi")}</H2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {needs.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-[#E3E7EE] bg-white p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2563EB]">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-[#0B1B3F]">{title}</h3>
                <p className="mt-2 leading-relaxed text-[#4B5565]">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section labelledBy="transport-sample-title">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <H2 id="transport-sample-title">{tr("A passenger books three seats to Arusha", "Abiria anahifadhi viti vitatu kwenda Arusha")}</H2>
            <Lead>
              {tr(
                "A staged call in Kiswahili: the passenger asks about tomorrow's coaches, the fare and paying by phone. Play it, read the transcript or switch to the English translation.",
                "Simu ya maigizo kwa Kiswahili: abiria anauliza kuhusu mabasi ya kesho, nauli na kulipa kwa simu. Isikilize, soma maandishi ya mazungumzo au badili kwenda tafsiri ya Kiingereza.",
              )}
            </Lead>
            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              {details.map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[#F5F6F8] p-3">
                  <dt className="text-[#5B6575]">{k}</dt>
                  <dd className="font-semibold text-[#0B1B3F]">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={120}>
            <SampleCallCard expanded={expanded} onExpand={() => setExpanded(true)} onCollapse={() => setExpanded(false)} playback={playback} />
          </Reveal>
        </div>
      </Section>

      <Section grey labelledBy="transport-followup-title">
        <Reveal>
          <H2 id="transport-followup-title">{tr("The booking office agrees the next step", "Ofisi ya tiketi inakubaliana hatua inayofuata")}</H2>
          <Lead>
            {tr(
              "The supervisor checks the seats, the agent who took the call owns the follow-up, and missed callers get a scheduled callback.",
              "Msimamizi anahakiki viti, mhudumu aliyepokea simu anasimamia ufuatiliaji, na waliokosa kupokelewa wanapangiwa kupigiwa tena.",
            )}
          </Lead>
        </Reveal>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <DiscussMock />
          </Reveal>
          <Reveal delay={120}>
            <MissedCallsMock />
          </Reveal>
        </div>
      </Section>

      <Section labelledBy="transport-cta-title">
        <Reveal>
          <div className="rounded-3xl border border-[#E3E7EE] bg-[#F5F6F8] px-6 py-12 text-center sm:px-12">
            <H2 id="transport-cta-title">{tr("See SENDA with your booking office", "Ona SENDA ikifanya kazi na ofisi yako ya tiketi")}</H2>
            <Lead className="mx-auto">
              {tr(
                "Bring one typical passenger enquiry. We'll set up the demo around your routes and shifts.",
                "Kuja na ulizo moja la kawaida la abiria. Tutaandaa onyesho kulingana na njia na zamu zako.",
              )}
            </Lead>
            <div className="mt-8 flex justify-center">
              <ButtonLink to={DEMO_LINK}>{tr("Book a transport demo", "Omba onyesho la usafirishaji")}</ButtonLink>
            </div>
          </div>
        </Reveal>
      </Section>

      <Faqs />
    </SitePage>
  );
}
