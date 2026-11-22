import type { LucideIcon } from "lucide-react";
import {
  Bus,
  HeartPulse,
  Hotel,
  GraduationCap,
  ShoppingBag,
  PiggyBank,
  CalendarClock,
  PhoneMissed,
  ClipboardList,
  MessageSquare,
  Star,
  Megaphone,
  Users,
  Package,
  Bell,
  CreditCard,
} from "lucide-react";
import { useSiteLang } from "../i18n";

export type UseCaseNeed = { icon: LucideIcon; title: string; body: string };

export type UseCaseConfig = {
  slug: string;
  icon: LucideIcon;
  /** Short industry label shown in the menu and as the hero eyebrow. */
  industry: string;
  /** Hero headline. */
  title: string;
  /** One-line summary used in the menu and under the headline. */
  intro: string;
  needs: UseCaseNeed[];
  ctaTitle: string;
  /** `true` for Transport, which has its own bespoke page (sample call etc.). */
  bespoke?: boolean;
};

/**
 * The industries SENDA is sold into. Transport keeps its own rich page
 * (`Transport.tsx`); every other industry is rendered by the data-driven
 * `UseCase.tsx` from this config, so adding a new one is just another entry here.
 */
export function useUseCases(): UseCaseConfig[] {
  const { tr } = useSiteLang();
  return [
    {
      slug: "transport",
      icon: Bus,
      bespoke: true,
      industry: tr("Transport operators", "Wasafirishaji"),
      title: tr("Follow up on every booking enquiry", "Fuatilia kila ulizo la kukata tiketi"),
      intro: tr("Booking enquiries, missed calls and shift handover", "Maulizo ya tiketi, simu zilizokosa na makabidhiano ya zamu"),
      ctaTitle: tr("See SENDA with your booking office", "Ona SENDA ikifanya kazi na ofisi yako ya tiketi"),
      needs: [],
    },
    {
      slug: "healthcare",
      icon: HeartPulse,
      industry: tr("Clinics & hospitals", "Kliniki na hospitali"),
      title: tr("Keep every patient call followed up", "Fuatilia kila simu ya mgonjwa"),
      intro: tr("Appointments, results and missed-call callbacks", "Miadi, majibu na kupiga tena simu zilizokosa"),
      ctaTitle: tr("See SENDA with your front desk", "Ona SENDA ikifanya kazi na mapokezi yako"),
      needs: [
        {
          icon: CalendarClock,
          title: tr("Appointment reminders", "Kumbusho za miadi"),
          body: tr("Send SMS reminders before each appointment so fewer patients miss their slot.", "Tuma kumbusho za SMS kabla ya kila miadi ili wagonjwa wachache wakose muda wao."),
        },
        {
          icon: PhoneMissed,
          title: tr("Missed calls", "Simu zilizokosekana"),
          body: tr("Every missed call is listed so the front desk can call the patient back.", "Kila simu iliyokosekana inaorodheshwa ili mapokezi waweze kumpigia mgonjwa tena."),
        },
        {
          icon: ClipboardList,
          title: tr("Call records", "Kumbukumbu za simu"),
          body: tr("Recordings and transcripts keep a clear record of what each patient was told.", "Rekodi na maandishi huhifadhi kumbukumbu wazi ya kile kila mgonjwa aliambiwa."),
        },
      ],
    },
    {
      slug: "hospitality",
      icon: Hotel,
      industry: tr("Hotels & tourism", "Hoteli na utalii"),
      title: tr("Turn enquiries into bookings", "Geuza maulizo kuwa mahifadhi"),
      intro: tr("Room enquiries, WhatsApp replies and guest follow-up", "Maulizo ya vyumba, majibu ya WhatsApp na ufuatiliaji wa wageni"),
      ctaTitle: tr("See SENDA with your front office", "Ona SENDA ikifanya kazi na ofisi yako ya mapokezi"),
      needs: [
        {
          icon: CalendarClock,
          title: tr("Booking enquiries", "Maulizo ya mahifadhi"),
          body: tr("See the dates and rooms each guest asked about, and who is following up.", "Ona tarehe na vyumba ambavyo kila mgeni aliuliza, na nani anafuatilia."),
        },
        {
          icon: MessageSquare,
          title: tr("WhatsApp replies", "Majibu ya WhatsApp"),
          body: tr("Answer rates and availability on WhatsApp as a team, from one shared inbox.", "Jibu bei na upatikanaji kwenye WhatsApp kama timu, kutoka kikasha kimoja cha pamoja."),
        },
        {
          icon: Star,
          title: tr("Guest follow-up", "Ufuatiliaji wa wageni"),
          body: tr("Follow up after the stay for reviews and repeat bookings.", "Fuatilia baada ya kukaa kwa ajili ya maoni na mahifadhi ya kurudia."),
        },
      ],
    },
    {
      slug: "education",
      icon: GraduationCap,
      industry: tr("Schools & colleges", "Shule na vyuo"),
      title: tr("Stay in touch with every parent", "Baki na mawasiliano na kila mzazi"),
      intro: tr("Admissions, fees reminders and school announcements", "Udahili, kumbusho za ada na matangazo ya shule"),
      ctaTitle: tr("See SENDA with your school office", "Ona SENDA ikifanya kazi na ofisi yako ya shule"),
      needs: [
        {
          icon: Megaphone,
          title: tr("Announcements", "Matangazo"),
          body: tr("Send fees reminders and school notices by SMS to all parents at once.", "Tuma kumbusho za ada na taarifa za shule kwa SMS kwa wazazi wote kwa pamoja."),
        },
        {
          icon: PhoneMissed,
          title: tr("Admission enquiries", "Maulizo ya udahili"),
          body: tr("Follow up on every admission call before the term starts.", "Fuatilia kila simu ya udahili kabla muhula haujaanza."),
        },
        {
          icon: Users,
          title: tr("Shared office", "Ofisi ya pamoja"),
          body: tr("The whole front office sees which parent enquiries are still open.", "Ofisi nzima ya mapokezi inaona maulizo ya wazazi ambayo bado yako wazi."),
        },
      ],
    },
    {
      slug: "retail",
      icon: ShoppingBag,
      industry: tr("Shops & e-commerce", "Maduka na biashara mtandao"),
      title: tr("Answer orders and deliver on time", "Jibu maagizo na fikisha kwa wakati"),
      intro: tr("Order enquiries, delivery updates and promotions", "Maulizo ya maagizo, taarifa za ufikishaji na matangazo"),
      ctaTitle: tr("See SENDA with your shop", "Ona SENDA ikifanya kazi na duka lako"),
      needs: [
        {
          icon: Package,
          title: tr("Order enquiries", "Maulizo ya maagizo"),
          body: tr("Track what each customer asked about and whether the order is confirmed.", "Fuatilia kile kila mteja aliuliza na kama agizo limethibitishwa."),
        },
        {
          icon: Bell,
          title: tr("Delivery updates", "Taarifa za ufikishaji"),
          body: tr("Send SMS and WhatsApp updates so customers know when to expect their order.", "Tuma taarifa za SMS na WhatsApp ili wateja wajue lini wategemee agizo lao."),
        },
        {
          icon: Megaphone,
          title: tr("Promotions", "Matangazo"),
          body: tr("Reach your customers with SMS and WhatsApp campaigns under your own name.", "Fikia wateja wako kwa kampeni za SMS na WhatsApp kwa jina lako mwenyewe."),
        },
      ],
    },
    {
      slug: "finance",
      icon: PiggyBank,
      industry: tr("SACCOs & microfinance", "SACCOS na fedha ndogo"),
      title: tr("Support members and get paid on time", "Huduma kwa wanachama na lipwa kwa wakati"),
      intro: tr("Payment reminders, member support and OTP alerts", "Kumbusho za malipo, huduma kwa wanachama na arifa za OTP"),
      ctaTitle: tr("See SENDA with your members", "Ona SENDA ikifanya kazi na wanachama wako"),
      needs: [
        {
          icon: CreditCard,
          title: tr("Payment reminders", "Kumbusho za malipo"),
          body: tr("Send SMS reminders before each repayment is due.", "Tuma kumbusho za SMS kabla ya kila marejesho kufika muda wake."),
        },
        {
          icon: ClipboardList,
          title: tr("Call records", "Kumbukumbu za simu"),
          body: tr("Recordings and transcripts keep a clear record of what each member was told.", "Rekodi na maandishi huhifadhi kumbukumbu wazi ya kile kila mwanachama aliambiwa."),
        },
        {
          icon: Bell,
          title: tr("OTPs & alerts", "OTP na arifa"),
          body: tr("Deliver one-time codes and account alerts by SMS through the API.", "Fikisha misimbo ya mara moja na arifa za akaunti kwa SMS kupitia API."),
        },
      ],
    },
  ];
}

export function useUseCase(slug?: string): UseCaseConfig | null {
  return useUseCases().find((u) => u.slug === slug) ?? null;
}
