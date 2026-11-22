import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, focusRing } from "./Layout";
import { Reveal } from "./Reveal";
import { useSiteLang } from "./i18n";

/**
 * Partners we provide our solutions to — a bordered logo grid (like a wall of
 * clients), ending with a "Your business next" call-to-action cell, plus a
 * second row of our top SMS users. Logos show their colour and lift on hover.
 */
type Logo = { name: string; src: string; href: string; /** app-icon style: rounded tile */ icon?: boolean };

const PARTNERS: Logo[] = [
  { name: "Swahilies", src: "/website/partners/swahilies.png", href: "https://www.swahilies.com/" },
  { name: "Ijuka Luxury Coach", src: "/website/partners/ijuka.png", href: "https://ijukaluxury.co.tz/" },
  { name: "Harvest Point", src: "/website/partners/harvestpoint.png", href: "https://harvestpoint.co.tz/" },
  { name: "Magige Lens", src: "/website/partners/magigelens.png", href: "https://magigelens.co.tz/" },
];

const TOP_SMS_USERS: Logo[] = [
  { name: "TangaYetu", src: "/website/partners/tangayetu.png", href: "https://tz.linkedin.com/company/tangayetu/" },
  { name: "Swahilies Pepea", src: "/website/partners/swahilies-pepea.png", href: "https://play.google.com/store/apps/details?id=com.swahiliespepea.app", icon: true },
  { name: "Kuza", src: "/website/partners/kuza.png", href: "https://play.google.com/store/apps/details?id=com.kuza.com", icon: true },
  { name: "Kinara Copilot", src: "/website/partners/kinara.svg", href: "http://kinaracopilot.com/", icon: true },
];

const CELL = "flex items-center justify-center border-b border-r border-[#E7EAF0] p-6 sm:p-8";

function LogoCell({ logo }: { logo: Logo }) {
  return (
    <li>
      <a
        href={logo.href}
        target="_blank"
        rel="noreferrer"
        aria-label={logo.name}
        className={cn(CELL, "group h-28 transition sm:h-32", focusRing)}
      >
        <img
          src={logo.src}
          alt={logo.name}
          className={cn(
            "w-auto object-contain transition duration-300 group-hover:scale-105",
            logo.icon ? "max-h-16 rounded-2xl shadow-sm ring-1 ring-black/5 sm:max-h-20" : "max-h-14 max-w-[80%] sm:max-h-16",
          )}
          loading="lazy"
          draggable={false}
        />
      </a>
    </li>
  );
}

export function Partners() {
  const { tr } = useSiteLang();
  return (
    <Section grey labelledBy="partners-title">
      <Reveal>
        <h2 id="partners-title" className="text-center text-xl font-bold tracking-tight text-[#0B1B3F] sm:text-2xl">
          {tr("Businesses we power", "Biashara tunazohudumia")}
        </h2>
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-8 overflow-hidden rounded-3xl border-l border-t border-[#E7EAF0] bg-white">
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {PARTNERS.map((p) => (
              <LogoCell key={p.name} logo={p} />
            ))}
            <li>
              <Link
                to="/book-demo?source=partners"
                className={cn(CELL, "group h-28 bg-[#F6F8FD] transition hover:bg-[#EEF3FF] sm:h-32", focusRing)}
              >
                <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0B1B3F]">
                  {tr("Your business next", "Biashara yako inafuata")}
                  <ArrowRight className="h-4 w-4 text-[#2563EB] transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <h3 className="mt-12 text-center text-sm font-semibold uppercase tracking-wide text-[#6B7585]">
          {tr("Top SMS users", "Watumiaji wakuu wa SMS")}
        </h3>
      </Reveal>
      <Reveal delay={160}>
        <div className="mx-auto mt-6 max-w-3xl overflow-hidden rounded-3xl border-l border-t border-[#E7EAF0] bg-white">
          <ul className="grid grid-cols-2 sm:grid-cols-4">
            {TOP_SMS_USERS.map((p) => (
              <LogoCell key={p.name} logo={p} />
            ))}
          </ul>
        </div>
      </Reveal>
    </Section>
  );
}
