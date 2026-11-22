import { useSiteLang } from "./i18n";

// Shared content for the public SENDA website (website-redesign branch).
// Everything a reviewer needs to approve before going live is in this one file:
// the staged sample call, plan prices, FAQ answers and support contacts.
// Items marked `TODO(approve)` are placeholders that must be confirmed before publication.

export const SUPPORT = {
  phoneDisplay: "+255 615 229 007",
  phoneHref: "tel:+255615229007",
  whatsappHref: "https://wa.me/255615229007",
  email: "communications@quantumintelligence.co.tz",
  company: "Quantum Intelligence",
  companyUrl: "https://quantumintelligence.co.tz",
};

/* ------------------------------------------------------------------ */
/* Staged sample call: one coach-booking enquiry used on every page.   */
/* Audio: public/website/sample-call-sw.mp3, generated with Microsoft  */
/* neural TTS (sw-TZ-RehemaNeural = agent, sw-TZ-DaudiNeural = caller). */
/* Line `at` times are measured from that file. TODO(approve): replace  */
/* with a recording by real voice actors before going live, and have a  */
/* native speaker review the Kiswahili.                                 */
/* ------------------------------------------------------------------ */

export const SAMPLE_CALL = {
  title: "Coach booking enquiry",
  subtitle: "A passenger asks about tomorrow's coach from Dar es Salaam to Arusha.",
  operator: "Safari Bora Coaches",
  route: "Dar es Salaam → Arusha",
  departure: "9:00 AM",
  seats: 3,
  fare: "TZS 45,000",
  date: "Thu, 19 Nov 2026",
  time: "8:42 AM",
  durationSec: 72,
  callerNumber: "+255 7•• ••• 214",
  agent: "Neema",
  audioSrc: "/website/sample-call-sw.mp3",
  nextStep: "Send the booking link for 3 seats on the 9:00 AM coach to Arusha.",
};

export type Line = { at: number; who: "customer" | "agent"; sw: string; en: string };

export const SAMPLE_LINES: Line[] = [
  {
    at: 0.35,
    who: "agent",
    sw: "Habari za asubuhi, Safari Bora Coaches, naitwa Neema. Nikusaidie vipi?",
    en: "Good morning, Safari Bora Coaches, this is Neema. How can I help?",
  },
  {
    at: 8.17,
    who: "customer",
    sw: "Aah, nzuri dada. Eeh, nilikuwa nauliza... kesho asubuhi kuna basi la kwenda Arusha?",
    en: "Ah, fine, thanks. Um, I wanted to ask... is there a coach to Arusha tomorrow morning?",
  },
  {
    at: 15.77,
    who: "agent",
    sw: "Ndiyo, lipo. Tuna basi la saa kumi na mbili asubuhi, na lingine la saa tatu. Yote yanaondoka Kituo cha Mabasi cha Magufuli.",
    en: "Yes, there is. We have one at 6:00 AM, and another at 9:00. Both leave from Magufuli Bus Terminal.",
  },
  {
    at: 27.65,
    who: "customer",
    sw: "Sawa sawa. Na nauli ni shilingi ngapi?",
    en: "Okay. And how much is the fare?",
  },
  {
    at: 32.27,
    who: "agent",
    sw: "Ni shilingi elfu arobaini na tano, kwa kiti kimoja.",
    en: "It's TZS 45,000 per seat.",
  },
  {
    at: 37.55,
    who: "customer",
    sw: "Mmh, sawa. Basi tunahitaji viti vitatu, kwenye lile la saa tatu. Naweza kulipia kwa simu?",
    en: "Mm, okay. Then we need three seats, on the 9:00 one. Can I pay by phone?",
  },
  {
    at: 46.64,
    who: "agent",
    sw: "Ndiyo, bila shaka. Unaweza kulipa kwa M-Pesa, Mixx by Yas, au Airtel Money. Nitakutumia kiungo cha kuhifadhi viti kwa SMS, sawa?",
    en: "Yes, of course. You can pay with M-Pesa, Mixx by Yas or Airtel Money. I'll send you a seat booking link by SMS, okay?",
  },
  {
    at: 59.28,
    who: "customer",
    sw: "Sawa, asante sana. Nitumie kwenye namba hii hii.",
    en: "Okay, thank you very much. Send it to this same number.",
  },
  {
    at: 64.6,
    who: "agent",
    sw: "Sawa, nakutumia sasa hivi. Asante kwa kupiga, safari njema!",
    en: "Sure, I'm sending it now. Thanks for calling, have a good trip!",
  },
];

export const SAMPLE_KEY_DETAILS = [
  { label: "Route", value: SAMPLE_CALL.route },
  { label: "Travel date", value: "Tomorrow, 9:00 AM coach" },
  { label: "Seats", value: "3" },
  { label: "Fare quoted", value: `${SAMPLE_CALL.fare} per seat` },
  { label: "Payment", value: "Mobile money, link by SMS" },
];

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Plans. Starter/Business/Growth/Custom mirror the live call-center   */
/* packages (billing migration 0029). Basic and the onboarding fee are */
/* not in the system yet.                                              */
/* ------------------------------------------------------------------ */

export type Plan = {
  key: string;
  name: string;
  summary: string;
  price: number | null; // monthly, TZS; null = quoted
  pending?: boolean; // TODO(approve): price not yet confirmed
  agents: string;
  features: string[];
  support: string;
  recommended?: boolean;
};

export const PLANS: Plan[] = [
  {
    key: "basic",
    name: "Basic",
    summary: "A simple way to start reviewing customer calls.",
    price: null,
    pending: true,
    agents: "To be confirmed",
    features: ["Call recording and call history", "Missed-call list"],
    support: "Email and WhatsApp support",
  },
  {
    key: "starter",
    name: "Starter",
    summary: "Your first business line for a small team.",
    price: 89000,
    agents: "Up to 3 agents",
    features: [
      "1 business number",
      "1 IVR menu",
      "200 inbound minutes included",
      "Call recording, logs and missed-call tracking",
      "Email transcripts after every call",
    ],
    support: "Email and WhatsApp support",
  },
  {
    key: "business",
    name: "Business",
    summary: "A complete, team-ready plan with AI call summaries.",
    price: 249000,
    agents: "Up to 10 agents",
    recommended: true,
    features: [
      "4,400 minutes included",
      "400 outbound minutes included",
      "AI-generated call summaries",
      "Smart routing (round-robin)",
      "Working hours rules",
    ],
    support: "Email and WhatsApp support",
  },
  {
    key: "growth",
    name: "Growth",
    summary: "Several branches, one support operation.",
    price: 599000,
    agents: "Up to 25 agents",
    features: [
      "3 business numbers",
      "2,600 inbound minutes",
      "1,500 outbound minutes",
      "Call forwarding",
      "Top-ups anytime",
    ],
    support: "Priority email and WhatsApp support",
  },
  {
    key: "custom",
    name: "Custom",
    summary: "For operators taking 1,000+ calls a day.",
    price: null,
    agents: "Unlimited agents",
    features: [
      "Custom call routing and integration",
      "Integration with your existing systems",
      "Compliance and audit logs",
      "Dedicated success manager",
    ],
    support: "Dedicated success manager",
  },
];

/** One-time Call Center setup fee, as published on the current site (ivr_pricing.setup_fee). */
export const ONBOARDING_FEE: { amount: number | null; covers: string[] } = {
  amount: 150000,
  covers: ["Call-forwarding setup on your business line", "Agent accounts created", "A test call before go-live"],
};

export function fmtTZS(n: number): string {
  return `TZS ${n.toLocaleString("en-US")}`;
}

/* ------------------------------------------------------------------ */
/* FAQs. TODO(approve): confirm each answer with the operations team.  */
/* ------------------------------------------------------------------ */

export const SMS_FAQS: { q: string; a: string }[] = [
  {
    q: "Can I send with my own sender name?",
    a: "Yes. Request a sender name (for example your business name) from your dashboard. We submit it for approval with the networks, and you can send from it once approved.",
  },
  {
    q: "Is there a contract or setup fee for SMS?",
    a: "No. Buy SMS credits when you need them. The rate per SMS drops automatically as your purchase grows. The minimum purchase is 1,000 SMS.",
  },
  {
    q: "Can I connect SMS to my own system?",
    a: "Yes. Use the REST API and delivery webhooks to send OTPs, alerts and notifications from your own software.",
  },
];

export const WA_FAQS: { q: string; a: string }[] = [
  {
    q: "Do I need a Meta Business Account?",
    a: "Yes. SENDA connects to your WhatsApp Business account on Meta. If you don't have one, our onboarding team helps you set it up at no extra cost.",
  },
  {
    q: "Are there contracts or minimum commitments?",
    a: "No. WhatsApp broadcasts are pay-as-you-go, and volume discounts apply automatically as your usage grows.",
  },
  {
    q: "How large can a broadcast be?",
    a: "SENDA's scheduler batches large campaigns automatically, so you can reach your whole contact list without splitting it yourself.",
  },
  {
    q: "Are WhatsApp prices inclusive of VAT?",
    a: "No. Prices shown exclude VAT, which is added at the applicable rate on your invoice.",
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "Can I keep my existing business number?",
    a: "Yes. Most teams keep the number their customers already know and forward its calls to SENDA. We confirm what your phone provider supports during setup.",
  },
  {
    q: "How does call forwarding work?",
    a: "You (or your provider) set your business line to forward calls to the SENDA number we give you. We place a test call together to confirm routing before you go live.",
  },
  {
    q: "Which languages are supported?",
    a: "Calls in Kiswahili and English. Transcripts are shown in the language spoken, with an English translation available for review.",
  },
  {
    q: "Who on my team can see calls?",
    a: "Access is role-based. Your administrators add agents and supervisors and decide who can open recordings, transcripts and reports.",
  },
  {
    q: "How long does setup take?",
    a: "After payment is verified, we confirm phone routing, create your agent accounts and run a test call with you. Timing depends on your phone provider; we agree dates with you at the start.",
  },
  {
    q: "How do I get support?",
    a: `Call or WhatsApp ${SUPPORT.phoneDisplay}, or email ${SUPPORT.email}. Every client also has a named setup contact during onboarding.`,
  },
];

/* ------------------------------------------------------------------ */
/* Bulk SMS and WhatsApp: rates as published on the current site.      */
/* ------------------------------------------------------------------ */

export type Tier = { name: string; range: string; rate: number; summary: string; features: string[]; popular?: boolean };

/** Bulk SMS tiers (pages/Landing.tsx). TODO(approve): the published ranges skip 150,000–249,999 SMS. */
export const SMS_TIERS: Tier[] = [
  {
    name: "Lite",
    range: "1,000 to 49,999 SMS",
    rate: 18,
    summary: "For teams getting started with SMS",
    features: ["Instant top-up", "Delivery reports", "Email receipt"],
  },
  {
    name: "Standard",
    range: "50,000 to 149,999 SMS",
    rate: 14,
    summary: "For growing teams running active campaigns",
    features: ["Priority top-up and support", "Advanced delivery analytics", "Campaign scheduling"],
    popular: true,
  },
  {
    name: "Pro",
    range: "250,000 SMS and above",
    rate: 12,
    summary: "For high-volume senders and developers",
    features: ["Bulk campaign tools", "Advanced analytics", "API access"],
  },
];

export const SMS_MIN_CREDITS = 1000;

export function smsRateFor(credits: number): number {
  if (credits >= 250000) return 12;
  if (credits >= 50000) return 14;
  return 18;
}

/** WhatsApp broadcast tiers (pages/WhatsAppBroadcast.tsx). Prices exclude VAT. */
export const WA_TIERS: Tier[] = [
  {
    name: "Standard",
    range: "1 to 50,000 messages",
    rate: 16,
    summary: "Start broadcasting on WhatsApp",
    features: ["Approved Meta templates", "Real-time delivery status", "Contact segments"],
  },
  {
    name: "Growth",
    range: "50,001 to 100,000 messages",
    rate: 14,
    summary: "For regular campaigns to a growing audience",
    features: ["Scheduled broadcasts", "Polls and PDF documents", "Poll results dashboard"],
    popular: true,
  },
  {
    name: "Enterprise",
    range: "100,001+ messages",
    rate: 12,
    summary: "For large audiences and API sending",
    features: ["Automatic batching", "API and webhooks", "Priority support"],
  },
];

export type ProductKey = "sms" | "whatsapp" | "calls";

export const PRODUCTS: {
  key: ProductKey;
  name: string;
  to: string;
  tagline: string;
  from: string;
  points: string[];
}[] = [
  {
    key: "calls",
    name: "Call Center",
    to: "/products/call-center",
    tagline: "Answer calls as a team, review recordings and transcripts, and follow up on every enquiry.",
    from: "From TZS 89,000 per month",
    points: ["IVR, routing and call recording", "Transcripts and AI summaries", "Missed-call follow-up"],
  },
  {
    key: "sms",
    name: "Bulk SMS",
    to: "/products/bulk-sms",
    tagline: "Send campaigns, reminders and alerts to every network in Tanzania, with your own sender name.",
    from: "From TZS 12 per SMS",
    points: ["Campaigns and scheduling", "Real-time delivery reports", "Sender names and templates"],
  },
  {
    key: "whatsapp",
    name: "WhatsApp Business",
    to: "/products/whatsapp",
    tagline: "Broadcast on WhatsApp and reply to customers from one shared team inbox.",
    from: "From TZS 12 per message",
    points: ["Broadcasts with approved templates", "Shared team inbox", "Polls and PDF documents"],
  },
];

export const AGENT_COUNTS =["1–3", "4–10", "11–25", "26–50", "50+"];

export const REFERRAL_SOURCES = [
  "Google search",
  "ChatGPT or another AI assistant",
  "Recommendation from someone",
  "Facebook or Instagram",
  "LinkedIn",
  "WhatsApp",
  "Event or conference",
  "Existing SENDA SMS customer",
  "Other",
];

/* ------------------------------------------------------------------ */
/* Localised content. Components call useContent() and get the same    */
/* shapes as the English exports above, in the visitor's language.     */
/* ------------------------------------------------------------------ */

const CONTENT_EN = {
  SAMPLE_CALL,
  SAMPLE_KEY_DETAILS,
  PLANS,
  ONBOARDING_FEE,
  SMS_TIERS,
  WA_TIERS,
  PRODUCTS,
  SMS_FAQS,
  WA_FAQS,
  FAQS,
  AGENT_COUNTS,
  REFERRAL_SOURCES,
};

export type SiteContent = typeof CONTENT_EN;

/* Kiswahili versions: same shapes and keys as CONTENT_EN. Amounts, rates, keys and links are
 * unchanged; plan and tier names stay as brand names. TODO(approve): native-speaker review. */

const SAMPLE_CALL_SW: SiteContent["SAMPLE_CALL"] = {
  ...SAMPLE_CALL,
  title: "Ulizo la kukata tiketi ya basi",
  subtitle: "Abiria anauliza kuhusu basi la kesho kutoka Dar es Salaam kwenda Arusha.",
  route: "Dar es Salaam → Arusha",
  departure: "Saa 3:00 asubuhi",
  date: "Alh, 19 Nov 2026",
  time: "Saa 2:42 asubuhi",
  nextStep: "Tuma kiungo cha kuhifadhi viti 3 kwenye basi la saa 3:00 asubuhi kwenda Arusha.",
};

const CONTENT_SW: SiteContent = {
  SAMPLE_CALL: SAMPLE_CALL_SW,
  SAMPLE_KEY_DETAILS: [
    { label: "Njia", value: SAMPLE_CALL_SW.route },
    { label: "Tarehe ya safari", value: "Kesho, basi la saa 3:00 asubuhi" },
    { label: "Viti", value: "3" },
    { label: "Nauli iliyotajwa", value: `${SAMPLE_CALL.fare} kwa kiti` },
    { label: "Malipo", value: "Pesa kwa simu, kiungo kwa SMS" },
  ],
  PLANS: [
    {
      key: "basic",
      name: "Basic",
      summary: "Njia rahisi ya kuanza kupitia simu za wateja.",
      price: null,
      pending: true,
      agents: "Itathibitishwa",
      features: ["Kurekodi simu na historia ya simu", "Orodha ya simu zilizokosekana"],
      support: "Msaada kwa barua pepe na WhatsApp",
    },
    {
      key: "starter",
      name: "Starter",
      summary: "Laini yako ya kwanza ya biashara kwa timu ndogo.",
      price: 89000,
      agents: "Hadi wahudumu 3",
      features: [
        "Namba 1 ya biashara",
        "Menyu 1 ya IVR",
        "Dakika 200 za simu zinazoingia",
        "Kurekodi simu, kumbukumbu na ufuatiliaji wa simu zilizokosekana",
        "Maandishi ya mazungumzo kwa barua pepe baada ya kila simu",
      ],
      support: "Msaada kwa barua pepe na WhatsApp",
    },
    {
      key: "business",
      name: "Business",
      summary: "Mpango kamili kwa timu, wenye muhtasari wa simu kwa AI.",
      price: 249000,
      agents: "Hadi wahudumu 10",
      recommended: true,
      features: [
        "Dakika 4,400 zimejumuishwa",
        "Dakika 400 za simu zinazotoka",
        "Muhtasari wa simu unaoandaliwa na AI",
        "Uelekezaji mahiri (kwa zamu)",
        "Kanuni za saa za kazi",
      ],
      support: "Msaada kwa barua pepe na WhatsApp",
    },
    {
      key: "growth",
      name: "Growth",
      summary: "Matawi kadhaa, huduma moja kwa wateja.",
      price: 599000,
      agents: "Hadi wahudumu 25",
      features: [
        "Namba 3 za biashara",
        "Dakika 2,600 za simu zinazoingia",
        "Dakika 1,500 za simu zinazotoka",
        "Kuhamisha simu",
        "Ongeza salio wakati wowote",
      ],
      support: "Msaada wa kipaumbele kwa barua pepe na WhatsApp",
    },
    {
      key: "custom",
      name: "Custom",
      summary: "Kwa kampuni zinazopokea simu 1,000+ kwa siku.",
      price: null,
      agents: "Wahudumu bila kikomo",
      features: [
        "Uelekezaji wa simu na muunganisho maalum",
        "Muunganisho na mifumo yako iliyopo",
        "Uzingatiaji wa kanuni na kumbukumbu za ukaguzi",
        "Meneja maalum wa huduma kwa mteja",
      ],
      support: "Meneja maalum wa huduma kwa mteja",
    },
  ],
  ONBOARDING_FEE: {
    amount: ONBOARDING_FEE.amount,
    covers: ["Kuweka uhamishaji wa simu kwenye laini yako ya biashara", "Akaunti za wahudumu zinaundwa", "Simu ya majaribio kabla ya kuanza"],
  },
  SMS_TIERS: [
    {
      name: "Lite",
      range: "SMS 1,000 hadi 49,999",
      rate: 18,
      summary: "Kwa timu zinazoanza kutumia SMS",
      features: ["Ongeza salio papo hapo", "Ripoti za uwasilishaji", "Risiti kwa barua pepe"],
    },
    {
      name: "Standard",
      range: "SMS 50,000 hadi 149,999",
      rate: 14,
      summary: "Kwa timu zinazokua zenye kampeni za mara kwa mara",
      features: ["Kipaumbele kwenye salio na msaada", "Takwimu za kina za uwasilishaji", "Kupanga ratiba ya kampeni"],
      popular: true,
    },
    {
      name: "Pro",
      range: "SMS 250,000 na zaidi",
      rate: 12,
      summary: "Kwa watumaji wa kiasi kikubwa na wasanidi programu",
      features: ["Zana za kampeni kubwa", "Takwimu za kina", "Ufikiaji wa API"],
    },
  ],
  WA_TIERS: [
    {
      name: "Standard",
      range: "Ujumbe 1 hadi 50,000",
      rate: 16,
      summary: "Anza kutangaza kwenye WhatsApp",
      features: ["Violezo vilivyoidhinishwa na Meta", "Hali ya uwasilishaji papo hapo", "Makundi ya mawasiliano"],
    },
    {
      name: "Growth",
      range: "Ujumbe 50,001 hadi 100,000",
      rate: 14,
      summary: "Kwa kampeni za mara kwa mara kwa hadhira inayokua",
      features: ["Matangazo yaliyopangwa", "Kura na hati za PDF", "Dashibodi ya matokeo ya kura"],
      popular: true,
    },
    {
      name: "Enterprise",
      range: "Ujumbe 100,001+",
      rate: 12,
      summary: "Kwa hadhira kubwa na utumaji kupitia API",
      features: ["Kugawanya makundi kiotomatiki", "API na webhooks", "Msaada wa kipaumbele"],
    },
  ],
  PRODUCTS: [
    {
      key: "calls",
      name: "Kituo cha Simu",
      to: "/products/call-center",
      tagline: "Pokeeni simu kama timu, pitieni rekodi na maandishi ya mazungumzo, na fuatilieni kila ulizo.",
      from: "Kuanzia TZS 89,000 kwa mwezi",
      points: ["IVR, uelekezaji na kurekodi simu", "Maandishi ya mazungumzo na muhtasari wa AI", "Ufuatiliaji wa simu zilizokosekana"],
    },
    {
      key: "sms",
      name: "Bulk SMS",
      to: "/products/bulk-sms",
      tagline: "Tuma kampeni, vikumbusho na taarifa kwa mitandao yote Tanzania, kwa jina lako la mtumaji.",
      from: "Kuanzia TZS 12 kwa SMS",
      points: ["Kampeni na ratiba", "Ripoti za uwasilishaji papo hapo", "Majina ya mtumaji na violezo"],
    },
    {
      key: "whatsapp",
      name: "WhatsApp Business",
      to: "/products/whatsapp",
      tagline: "Tangaza kwenye WhatsApp na ujibu wateja kutoka kisanduku kimoja cha timu.",
      from: "Kuanzia TZS 12 kwa ujumbe",
      points: ["Matangazo kwa violezo vilivyoidhinishwa", "Kikasha cha pamoja cha timu", "Kura na hati za PDF"],
    },
  ],
  SMS_FAQS: [
    {
      q: "Naweza kutuma kwa jina langu la mtumaji?",
      a: "Ndiyo. Omba jina la mtumaji (kwa mfano jina la biashara yako) kwenye dashibodi yako. Tunaliwasilisha kwa mitandao kwa idhini, na utaweza kulitumia likishaidhinishwa.",
    },
    {
      q: "Je, kuna mkataba au ada ya kuanzisha kwa SMS?",
      a: "Hapana. Nunua salio la SMS unapohitaji. Bei kwa kila SMS hushuka kiotomatiki kadiri ununuzi wako unavyoongezeka. Kiwango cha chini ni SMS 1,000.",
    },
    {
      q: "Naweza kuunganisha SMS na mfumo wangu?",
      a: "Ndiyo. Tumia REST API na webhooks za uwasilishaji kutuma OTP, tahadhari na taarifa kutoka kwenye programu yako.",
    },
  ],
  WA_FAQS: [
    {
      q: "Je, ninahitaji Akaunti ya Meta Business?",
      a: "Ndiyo. SENDA inaunganishwa na akaunti yako ya WhatsApp Business kwenye Meta. Kama huna, timu yetu itakusaidia kuianzisha bila gharama ya ziada.",
    },
    {
      q: "Je, kuna mikataba au kiwango cha chini cha matumizi?",
      a: "Hapana. Matangazo ya WhatsApp ni lipa-kadri-unavyotumia, na punguzo la kiasi linatumika kiotomatiki kadiri matumizi yako yanavyokua.",
    },
    {
      q: "Tangazo moja linaweza kuwa kubwa kiasi gani?",
      a: "Mpangaji wa SENDA hugawanya kampeni kubwa kiotomatiki, hivyo unaweza kufikia orodha yako yote ya mawasiliano bila kuigawanya mwenyewe.",
    },
    {
      q: "Je, bei za WhatsApp zinajumuisha VAT?",
      a: "Hapana. Bei zilizoonyeshwa hazijumuishi VAT, ambayo huongezwa kwa kiwango kinachotumika kwenye ankara yako.",
    },
  ],
  FAQS: [
    {
      q: "Naweza kuendelea kutumia namba yangu ya biashara iliyopo?",
      a: "Ndiyo. Timu nyingi huendelea kutumia namba ambayo wateja wao tayari wanaijua na kuhamishia simu zake kwenda SENDA. Tunathibitisha kile mtoa huduma wako wa simu anachoruhusu wakati wa kuweka mfumo.",
    },
    {
      q: "Uhamishaji wa simu unafanyaje kazi?",
      a: "Wewe (au mtoa huduma wako) mnaweka laini yako ya biashara ihamishie simu kwenda namba ya SENDA tutakayokupa. Tunapiga simu ya majaribio pamoja kuthibitisha uelekezaji kabla ya kuanza.",
    },
    {
      q: "Lugha zipi zinatumika?",
      a: "Simu kwa Kiswahili na Kiingereza. Maandishi ya mazungumzo huonyeshwa kwa lugha iliyozungumzwa, pamoja na tafsiri ya Kiingereza kwa ajili ya kupitia.",
    },
    {
      q: "Nani kwenye timu yangu anaweza kuona simu?",
      a: "Ruhusa hutolewa kulingana na wadhifa. Wasimamizi wako huongeza wahudumu na wasimamizi, na huamua nani anaweza kufungua rekodi, maandishi ya mazungumzo na ripoti.",
    },
    {
      q: "Kuweka mfumo huchukua muda gani?",
      a: "Baada ya malipo kuthibitishwa, tunathibitisha uelekezaji wa simu, tunaunda akaunti za wahudumu wako na tunapiga simu ya majaribio pamoja nawe. Muda unategemea mtoa huduma wako wa simu; tunakubaliana tarehe nawe mwanzoni.",
    },
    {
      q: "Napataje msaada?",
      a: `Piga simu au tuma WhatsApp kwa ${SUPPORT.phoneDisplay}, au barua pepe ${SUPPORT.email}. Kila mteja pia ana mtu maalum wa kumsaidia wakati wa kuanza.`,
    },
  ],
  AGENT_COUNTS,
  REFERRAL_SOURCES: [
    "Utafutaji wa Google",
    "ChatGPT au msaidizi mwingine wa AI",
    "Pendekezo kutoka kwa mtu",
    "Facebook au Instagram",
    "LinkedIn",
    "WhatsApp",
    "Tukio au mkutano",
    "Mteja aliyepo wa SENDA SMS",
    "Nyingine",
  ],
};

export function useContent(): SiteContent {
  const { lang } = useSiteLang();
  return lang === "sw" ? CONTENT_SW : CONTENT_EN;
}

export const COUNTRY_CODES = [
  { code: "+255", label: "Tanzania (+255)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+256", label: "Uganda (+256)" },
  { code: "+250", label: "Rwanda (+250)" },
  { code: "+257", label: "Burundi (+257)" },
  { code: "+260", label: "Zambia (+260)" },
  { code: "+258", label: "Mozambique (+258)" },
  { code: "+27", label: "South Africa (+27)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+1", label: "US / Canada (+1)" },
];
