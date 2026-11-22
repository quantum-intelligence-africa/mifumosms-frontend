import { BarChart3, Bot, FileText, Link2, ListChecks, Send, Upload, Users } from "lucide-react";
import { ButtonLink, H2, Lead, Section, SitePage, Tag } from "../Layout";
import { TeamInboxMock, WaBroadcastMock } from "../ChannelMockups";
import { useContent } from "../content";
import { useSiteLang } from "../i18n";
import { Reveal } from "../Reveal";
import { TierCards } from "./BulkSms";
import { DemoInvitation, Faqs } from "./Home";

export default function WhatsApp() {
  const { tr } = useSiteLang();
  const { WA_TIERS, WA_FAQS } = useContent();

  const steps = [
    {
      icon: Link2,
      title: tr("Connect your Meta account", "Unganisha akaunti yako ya Meta"),
      body: tr(
        "Link your WhatsApp Business account in Settings. Our team helps if you don't have one yet.",
        "Unganisha akaunti yako ya WhatsApp Business kwenye Mipangilio. Timu yetu itakusaidia kama bado huna.",
      ),
    },
    {
      icon: Upload,
      title: tr("Choose your contacts", "Chagua mawasiliano yako"),
      body: tr(
        "Use SENDA's contact manager or paste numbers. Segment by group, date or individual selection.",
        "Tumia kisimamizi cha mawasiliano cha SENDA au bandika namba. Gawanya kwa kundi, tarehe au uchaguzi binafsi.",
      ),
    },
    {
      icon: Send,
      title: tr("Compose and broadcast", "Andika na tangaza"),
      body: tr(
        "Pick an approved Meta template or write a message, then send. Status updates in real time.",
        "Chagua kiolezo kilichoidhinishwa na Meta au andika ujumbe, kisha tuma. Hali inasasishwa papo hapo.",
      ),
    },
  ];

  const rich = [
    {
      icon: Upload,
      title: tr("Direct file upload", "Pakia faili moja kwa moja"),
      body: tr("Send images and documents with your broadcast.", "Tuma picha na hati pamoja na tangazo lako."),
    },
    {
      icon: ListChecks,
      title: tr("Interactive polls", "Kura zinazoshirikisha"),
      body: tr("Ask a question and let customers answer with one tap.", "Uliza swali na wateja wajibu kwa kugusa mara moja."),
    },
    {
      icon: FileText,
      title: tr("PDF documents", "Hati za PDF"),
      body: tr("Share timetables, price lists and receipts as PDF tiles.", "Tuma ratiba, orodha za bei na risiti kama vigae vya PDF."),
    },
    {
      icon: BarChart3,
      title: tr("Poll results dashboard", "Dashibodi ya matokeo ya kura"),
      body: tr("See answers as they arrive and export them.", "Ona majibu yanavyoingia na uyapakue."),
    },
  ];

  return (
    <SitePage title={tr("WhatsApp Business — SENDA", "WhatsApp Business — SENDA")}>
      <section className="bg-white" aria-labelledby="wa-title">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:pt-16">
          <div className="min-w-0">
            <h1 id="wa-title" className="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#0B1B3F] sm:text-5xl">
              {tr("Broadcast on WhatsApp and reply as a team", "Tangaza kwenye WhatsApp na mjibu kama timu")}
            </h1>
            <Lead>
              {tr(
                "Send approved templates, polls and documents to thousands of customers, then handle every reply from one shared inbox.",
                "Tuma violezo vilivyoidhinishwa, kura na hati kwa maelfu ya wateja, kisha shughulikia kila jibu kutoka kisanduku kimoja cha pamoja.",
              )}
            </Lead>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/signup">{tr("Get started", "Anza sasa")}</ButtonLink>
              <ButtonLink to="/book-demo?source=whatsapp-hero" variant="secondary">
                {tr("Book a demo", "Omba onyesho")}
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-[#5B6575]">
              {tr("Pay as you go from TZS 12 per message. No contract.", "Lipa kadri unavyotumia, kuanzia TZS 12 kwa ujumbe. Hakuna mkataba.")}
            </p>
          </div>
          <div className="min-w-0">
            <WaBroadcastMock />
          </div>
        </div>
      </section>

      <Section grey labelledBy="wa-steps-title">
        <Reveal>
          <H2 id="wa-steps-title">{tr("Your first broadcast in three steps", "Tangazo lako la kwanza kwa hatua tatu")}</H2>
        </Reveal>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title}>
              <Reveal delay={i * 80} className="h-full">
                <div className="h-full rounded-2xl border border-[#E3E7EE] bg-white p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">{i + 1}</span>
                    <Icon className="h-5 w-5 text-[#2563EB]" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#0B1B3F]">{title}</h3>
                  <p className="mt-2 leading-relaxed text-[#4B5565]">{body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Section>

      <Section labelledBy="wa-rich-title">
        <Reveal>
          <H2 id="wa-rich-title">{tr("More than text", "Zaidi ya maandishi")}</H2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rich.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 80}>
              <div className="h-full rounded-2xl border border-[#E3E7EE] p-6">
                <Icon className="h-7 w-7 text-[#2563EB]" aria-hidden />
                <h3 className="mt-4 font-semibold text-[#0B1B3F]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4B5565]">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section grey id="wa-inbox" labelledBy="wa-inbox-title">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <Reveal>
            <H2 id="wa-inbox-title">{tr("Every reply reaches the right person", "Kila jibu linamfikia mtu sahihi")}</H2>
            <Lead>
              {tr(
                "Assign chats to team members, use saved replies, and see each customer's history before you answer.",
                "Wape wanatimu mazungumzo, tumia majibu yaliyohifadhiwa, na uone historia ya kila mteja kabla ya kujibu.",
              )}
            </Lead>
            <ul className="mt-6 space-y-3 text-[#3F4A5A]">
              <li className="flex gap-3">
                <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2563EB]" aria-hidden />{" "}
                {tr("One inbox for the whole team, with role-based access.", "Kikasha kimoja kwa timu nzima, chenye ruhusa kulingana na wadhifa.")}
              </li>
              <li className="flex gap-3">
                <Bot className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2563EB]" aria-hidden />{" "}
                {tr(
                  "An AI agent can answer routine questions from your knowledge base and hand the chat to a person when needed.",
                  "Msaidizi wa AI anaweza kujibu maswali ya kawaida kutoka kwenye hazina yako ya maarifa na kumkabidhi mtu mazungumzo inapohitajika.",
                )}
              </li>
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <TeamInboxMock />
          </Reveal>
        </div>
      </Section>

      <Section id="wa-pricing" labelledBy="wa-pricing-title">
        <Reveal>
          <H2 id="wa-pricing-title">{tr("WhatsApp broadcast pricing", "Bei za matangazo ya WhatsApp")}</H2>
          <Lead>
            {tr(
              "Pay as you go. Volume discounts apply automatically. Prices exclude VAT.",
              "Lipa kadri unavyotumia. Punguzo la kiasi linatumika kiotomatiki. Bei hazijumuishi VAT.",
            )}
          </Lead>
        </Reveal>
        <div className="mt-10">
          <TierCards tiers={WA_TIERS} unit={tr("message", "ujumbe")} ctaTo="/signup" ctaLabel={tr("Get started", "Anza sasa")} />
        </div>
      </Section>

      <DemoInvitation source="whatsapp" />
      <Faqs items={WA_FAQS} title={tr("WhatsApp questions", "Maswali kuhusu WhatsApp")} />
    </SitePage>
  );
}
