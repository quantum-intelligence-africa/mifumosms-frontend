import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section, focusRing } from "./Layout";
import { Reveal } from "./Reveal";
import { useSiteLang } from "./i18n";

/**
 * Partners we provide our solutions to — a bordered logo grid (like a wall of
 * clients), ending with a "Your business next" call-to-action cell. Logos are
 * muted by default and show their colour on hover.
 */
const PARTNERS = [
  { name: "Swahilies", src: "/website/partners/swahilies.png", href: "https://www.swahilies.com/" },
  { name: "Ijuka Luxury Coach", src: "/website/partners/ijuka.png", href: "https://ijukaluxury.co.tz/" },
  { name: "Harvest Point", src: "/website/partners/harvestpoint.png", href: "https://harvestpoint.co.tz/" },
  { name: "Magige Lens", src: "/website/partners/magigelens.png", href: "https://magigelens.co.tz/" },
];

const CELL = "flex items-center justify-center border-b border-r border-[#E7EAF0] p-6 sm:p-8";

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
              <li key={p.name}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={p.name}
                  className={cn(CELL, "group h-28 transition sm:h-32", focusRing)}
                >
                  <img
                    src={p.src}
                    alt={p.name}
                    className="max-h-14 w-auto max-w-[80%] object-contain transition duration-300 group-hover:scale-105 sm:max-h-16"
                    loading="lazy"
                    draggable={false}
                  />
                </a>
              </li>
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
    </Section>
  );
}
