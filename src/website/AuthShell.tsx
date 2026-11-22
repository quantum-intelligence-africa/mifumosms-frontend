import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo, BrandName } from "@/components/layout/BrandLogo";
import { useBranding, useHostBranding } from "@/contexts/BrandingContext";
import { SiteHeader } from "./Header";
import { focusRing } from "./Layout";
import { useSiteLang } from "./i18n";

/* Shared layout for the auth pages (log in, sign up, forgot / reset password), in the
 * visual language of the public website. On a white-label host it drops everything SENDA
 * (site header, marketing aside, links) and shows only the organization's brand + the form. */

export const authInputClass = cn(
  "h-auto w-full rounded-xl border border-[#D5DCE8] bg-white px-3.5 py-3 text-[15px] text-[#0B1B3F] placeholder:text-[#8A94A6] shadow-none",
  focusRing,
);
export const authLabelClass = "text-sm font-semibold text-[#0B1B3F]";
export const authPrimaryBtnClass = cn(
  "h-auto w-full rounded-xl bg-[#2563EB] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60",
  focusRing,
);
export const authSecondaryBtnClass = cn(
  "h-auto w-full rounded-xl border border-[#D5DCE8] bg-white py-3 text-[15px] font-semibold text-[#0B1B3F] transition-colors hover:bg-[#F5F6F8] hover:text-[#0B1B3F]",
  focusRing,
);
export const authLinkClass = cn("font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline rounded", focusRing);

function DefaultAside() {
  return (
    <div>
      <img
        src="/sign in image.webp"
        alt=""
        aria-hidden="true"
        className="w-full max-w-md object-contain"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

/** Support contact, always visible: in the panel on desktop and under the form on phones. */
function SupportContact({ compact, top }: { compact?: boolean; top?: boolean }) {
  const { tr } = useSiteLang();
  const links = (
    <span className="whitespace-nowrap">
      <a href="tel:+255615229007" className={cn("font-semibold text-[#2563EB] hover:underline rounded", focusRing)}>
        +255 615 229 007
      </a>
      {" · "}
      <a href="https://wa.me/255615229007" target="_blank" rel="noreferrer" className={cn("font-semibold text-[#2563EB] hover:underline rounded", focusRing)}>
        WhatsApp
      </a>
    </span>
  );
  if (compact) {
    return (
      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-1.5 text-center text-sm text-[#4B5565] lg:hidden">
        <Phone className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
        {tr("Need help?", "Unahitaji msaada?")} {links}
      </p>
    );
  }
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5", top ? "mb-8" : "mt-8")}>
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#EFF4FF] text-[#2563EB]">
        <Phone className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="text-sm text-[#0B1B3F]">
        <span className="block font-semibold">{tr("Need help? Call or WhatsApp us", "Unahitaji msaada? Tupigie au tutumie WhatsApp")}</span>
        {links}
      </p>
    </div>
  );
}

function FormCard({ title, subtitle, children, wide }: { title: string; subtitle?: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn("w-full rounded-3xl border border-[#E3E7EE] bg-white p-6 shadow-sm sm:p-8", wide ? "max-w-2xl" : "max-w-md")}>
      <h1 className="text-3xl font-extrabold tracking-tight text-[#0B1B3F]">{title}</h1>
      {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-[#4B5565]">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  aside,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
  /** Wider form card (two fields per row), e.g. sign-up. */
  wide?: boolean;
}): JSX.Element {
  const { tr, lang, setLang } = useSiteLang();
  // Shareable language links (?lang=sw / ?lang=en), as on the website pages.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("lang");
    if ((wanted === "sw" || wanted === "en") && wanted !== lang) setLang(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Same switch the auth pages already use: a customer's white-label domain shows none of SENDA.
  const { branded } = useHostBranding();
  const brand = useBranding();
  const brandName = brand.branded ? brand.workspace_name || brand.display_name : undefined;

  useEffect(() => {
    document.title = branded ? (brandName ? `${title} — ${brandName}` : title) : `${title} — SENDA`;
  }, [title, branded, brandName]);

  if (branded) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-[#F5F6F8] px-4 py-10 sm:py-16">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <BrandLogo large />
          <p className="text-xl font-bold text-[#0B1B3F]">
            <BrandName />
          </p>
        </div>
        <FormCard title={title} subtitle={subtitle} wide={wide}>
          {children}
        </FormCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <main className="mx-auto max-w-[1320px] px-3 pb-10 pt-4 sm:px-5">
        <div className={cn("grid gap-6", wide ? "lg:grid-cols-[1.35fr_1fr]" : "lg:grid-cols-[1fr_1fr]")}>
          <div className="flex flex-col items-center justify-center py-4 lg:py-8">
            <FormCard title={title} subtitle={subtitle} wide={wide}>
              {children}
            </FormCard>
            <SupportContact compact />
            <p className="mt-5 text-center text-xs text-[#4B5565]">
              <Link to="/privacy" className={cn("rounded hover:text-[#0B1B3F] hover:underline", focusRing)}>
                {tr("Privacy", "Faragha")}
              </Link>
              <span className="mx-2" aria-hidden="true">·</span>
              <Link to="/terms" className={cn("rounded hover:text-[#0B1B3F] hover:underline", focusRing)}>
                {tr("Terms", "Masharti")}
              </Link>
            </p>
          </div>
          <aside className="hidden rounded-[32px] bg-[radial-gradient(120%_120%_at_0%_0%,#DCE8FF_0%,#EEF3FF_35%,#F7F1FB_70%,#FDF2F4_100%)] p-8 lg:sticky lg:top-28 lg:block lg:self-start xl:p-10">
            <SupportContact top />
            {aside ?? <DefaultAside />}
          </aside>
        </div>
      </main>
    </div>
  );
}
