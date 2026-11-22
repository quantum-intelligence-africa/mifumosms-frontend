import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { SUPPORT } from "./content";
import { useSiteLang } from "./i18n";
import { SiteHeader } from "./Header";
import { HelpCallButton } from "@/components/landing/HelpCallButton";

/* Shared building blocks for the public website. Colours are fixed (light) on purpose:
 * the marketing site uses white and #F5F6F8 surfaces regardless of the app theme. */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2";

export function ButtonLink({
  to,
  children,
  variant = "primary",
  className,
  onClick,
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(btnClass(variant), className)}
    >
      {children}
    </Link>
  );
}

export function btnClass(variant: "primary" | "secondary" = "primary") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold transition-colors",
    focusRing,
    variant === "primary"
      ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
      : "border border-[#2563EB] bg-white text-[#2563EB] hover:bg-[#EFF4FF]",
  );
}

export function Section({
  id,
  children,
  grey,
  className,
  labelledBy,
}: {
  id?: string;
  children: ReactNode;
  grey?: boolean;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("scroll-mt-20 py-16 sm:py-20", grey ? "bg-[#F5F6F8]" : "bg-white", className)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#2563EB]">{children}</p>;
}

export function H2({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn("text-3xl font-bold tracking-tight text-[#0B1B3F] sm:text-4xl", className)}>
      {children}
    </h2>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-3 max-w-2xl text-lg leading-relaxed text-[#4B5565]", className)}>{children}</p>;
}

/** Text + colour status label (never colour alone). */
export function Tag({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "grey" | "amber" | "green" }) {
  const tones = {
    blue: "bg-[#EAF1FF] text-[#1D4ED8]",
    grey: "bg-[#EEF0F4] text-[#3F4A5A]",
    amber: "bg-[#FFF4DB] text-[#8A5300]",
    green: "bg-[#E6F6EC] text-[#166534]",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

/** SENDA logo + name (no tagline), used in the header and footer. */
export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      {/* Tightly cropped copy of the SENDA mark (public/website/senda-mark.webp), so it sits close to the name. */}
      <img src="/website/senda-mark.webp" alt="" className="h-10 w-auto object-contain sm:h-12" draggable={false} />
      <span className="text-[22px] font-bold leading-tight tracking-tight text-[#0B1B3F] sm:text-2xl">SENDA</span>
    </span>
  );
}

export function SiteFooter() {
  const { tr } = useSiteLang();
  const cols: { title: string; links: { label: string; to: string; external?: boolean }[] }[] = [
    {
      title: tr("Products", "Huduma"),
      links: [
        { label: tr("Call Center", "Kituo cha Simu"), to: "/products/call-center" },
        { label: "Bulk SMS", to: "/products/bulk-sms" },
        { label: "WhatsApp Business", to: "/products/whatsapp" },
        { label: tr("Download the app", "Pakua programu"), to: "/download" },
      ],
    },
    {
      title: tr("Developers", "Wasanidi"),
      links: [
        { label: tr("API reference", "Marejeo ya API"), to: "/developer" },
        { label: tr("Get API keys", "Pata funguo za API"), to: "/signup" },
        { label: tr("Use cases: Transport", "Matumizi: Usafirishaji"), to: "/use-cases/transport" },
        { label: tr("Pricing", "Bei"), to: "/pricing" },
      ],
    },
    {
      title: tr("Support", "Msaada"),
      links: [
        { label: `${tr("Call", "Piga")} ${SUPPORT.phoneDisplay}`, to: SUPPORT.phoneHref, external: true },
        { label: tr("WhatsApp us", "Tuandikie WhatsApp"), to: SUPPORT.whatsappHref, external: true },
        { label: tr("Email support", "Tuma barua pepe"), to: `mailto:${SUPPORT.email}`, external: true },
        { label: tr("Book a demo", "Omba onyesho"), to: "/book-demo" },
        { label: tr("Log in", "Ingia"), to: "/login" },
      ],
    },
    {
      title: "Quantum Intelligence",
      links: [
        { label: tr("About Quantum Intelligence", "Kuhusu Quantum Intelligence"), to: SUPPORT.companyUrl, external: true },
        { label: tr("Privacy", "Faragha"), to: "/privacy" },
        { label: tr("Terms", "Masharti"), to: "/terms" },
      ],
    },
  ];
  return (
    <footer className="border-t border-[#E3E7EE] bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#4B5565]">
            {tr(
              "Call center, bulk SMS and WhatsApp tools for businesses in Tanzania, in one account.",
              "Kituo cha simu, SMS na WhatsApp kwa biashara za Tanzania, katika akaunti moja.",
            )}
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-[#0B1B3F]">{col.title}</h3>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.to}
                      target={l.to.startsWith("http") ? "_blank" : undefined}
                      rel={l.to.startsWith("http") ? "noreferrer" : undefined}
                      className={cn("rounded text-sm text-[#4B5565] hover:text-[#2563EB]", focusRing)}
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link to={l.to} className={cn("rounded text-sm text-[#4B5565] hover:text-[#2563EB]", focusRing)}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[#E3E7EE]">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-[#5B6575] sm:px-6">
          © {new Date().getFullYear()} Quantum Intelligence.{" "}
          {tr("SENDA is a Quantum Intelligence product.", "SENDA ni huduma ya Quantum Intelligence.")}
        </p>
      </div>
    </footer>
  );
}

/** Page shell: header, content, footer, and scroll-to-hash / scroll-to-top on navigation. */
export function SitePage({ children, title }: { children: ReactNode; title: string }) {
  const { pathname, hash, search } = useLocation();
  const { tr, lang, setLang } = useSiteLang();
  // Shareable language links: ?lang=sw or ?lang=en sets the visitor's language.
  useEffect(() => {
    const wanted = new URLSearchParams(search).get("lang");
    if ((wanted === "sw" || wanted === "en") && wanted !== lang) setLang(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  useEffect(() => {
    document.title = title;
  }, [title]);
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <div className="min-h-screen bg-white font-sans text-[#3F4A5A] antialiased">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        {tr("Skip to content", "Ruka hadi maudhui")}
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      {/* "Need help? Call us" floating button, configured from the portal (kept from the previous site). */}
      <HelpCallButton />
    </div>
  );
}
