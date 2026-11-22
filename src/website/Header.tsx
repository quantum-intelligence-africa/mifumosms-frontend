import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, Menu, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Wordmark, focusRing } from "./Layout";
import { useSiteLang } from "./i18n";

/* Site header in the style of retellai.com: a floating rounded bar that grows into a
 * mega-menu panel (grouped links + a featured card). Developers is its own top-level menu. */

type MenuLink = { label: string; to: string; hint: string };
type MenuGroup = { title: string; links: MenuLink[] };
type Feature = { title: string; body: string; to: string; art: "call" | "bus" | "code" };
type MegaMenu = { key: string; label: string; groups: MenuGroup[]; feature: Feature };

function useMenus() {
  const { tr } = useSiteLang();
  const menus: MegaMenu[] = [
    {
      key: "products",
      label: tr("Products", "Huduma"),
      groups: [
        {
          title: tr("Call Center", "Kituo cha Simu"),
          links: [
            {
              label: tr("Call Center overview", "Muhtasari wa Kituo cha Simu"),
              to: "/products/call-center",
              hint: tr("IVR, call routing and recording on your business number", "IVR, uelekezaji na kurekodi simu kwenye namba yako ya biashara"),
            },
            { label: tr("Call review", "Kupitia simu"), to: "/products/call-center#call-review", hint: tr("Recordings, key moments and takeaways", "Rekodi, matukio muhimu na mambo ya kufuatilia") },
            { label: tr("Transcripts", "Maandishi ya simu"), to: "/products/call-center#transcripts", hint: tr("Kiswahili and English, time-stamped", "Kiswahili na Kiingereza, pamoja na muda") },
            { label: tr("Call analytics", "Takwimu za simu"), to: "/products/call-center#analytics", hint: tr("Answer rate, missed calls and trends", "Kiwango cha kupokea, simu zilizokosa na mwenendo") },
            {
              label: tr("Missed-call follow-up", "Ufuatiliaji wa simu zilizokosa"),
              to: "/products/call-center#missed-calls",
              hint: tr("Schedule callbacks so no caller is forgotten", "Panga kupiga tena ili mpigaji asisahaulike"),
            },
          ],
        },
        {
          title: tr("Messaging", "Ujumbe"),
          links: [
            { label: "Bulk SMS", to: "/products/bulk-sms", hint: tr("Campaigns, sender names and delivery reports", "Kampeni, majina ya mtumaji na ripoti za ufikishaji") },
            { label: "WhatsApp Business", to: "/products/whatsapp", hint: tr("Broadcasts, polls and documents", "Matangazo, kura za maoni na nyaraka") },
            {
              label: tr("Shared team inbox", "Kikasha cha pamoja cha timu"),
              to: "/products/whatsapp#wa-inbox",
              hint: tr("Calls, WhatsApp and SMS in one place", "Simu, WhatsApp na SMS mahali pamoja"),
            },
          ],
        },
        {
          title: tr("Get started", "Anza"),
          links: [
            { label: tr("Pricing", "Bei"), to: "/pricing", hint: tr("Call Center, SMS and WhatsApp prices", "Bei za Kituo cha Simu, SMS na WhatsApp") },
            { label: tr("Download the app", "Pakua programu"), to: "/download", hint: tr("SENDA on your phone", "SENDA kwenye simu yako") },
            { label: tr("Book a demo", "Omba onyesho"), to: "/book-demo", hint: tr("See SENDA with your own workflow", "Ona SENDA ikifanya kazi na utaratibu wako") },
          ],
        },
      ],
      feature: {
        title: tr("Hear a sample call", "Sikiliza simu ya mfano"),
        body: tr("A coach booking enquiry in Kiswahili, with transcript and translation", "Ulizo la kuhifadhi kiti cha basi kwa Kiswahili, pamoja na maandishi na tafsiri"),
        to: "/#sample-call",
        art: "call",
      },
    },
    {
      key: "usecases",
      label: tr("Use cases", "Matumizi"),
      groups: [
        {
          title: tr("By industry", "Kwa sekta"),
          links: [
            {
              label: tr("Transport operators", "Wasafirishaji"),
              to: "/use-cases/transport",
              hint: tr("Booking enquiries, missed calls and shift handover", "Maulizo ya tiketi, simu zilizokosa na makabidhiano ya zamu"),
            },
          ],
        },
        {
          title: tr("By team", "Kwa timu"),
          links: [
            { label: tr("Customer service", "Huduma kwa wateja"), to: "/products/call-center", hint: tr("Answer, review and follow up on calls", "Pokea, pitia na fuatilia simu") },
            { label: tr("Marketing", "Masoko"), to: "/products/bulk-sms", hint: tr("SMS and WhatsApp campaigns", "Kampeni za SMS na WhatsApp") },
            { label: tr("Developers", "Wasanidi programu"), to: "/developer", hint: tr("OTPs, alerts and notifications by API", "OTP, tahadhari na arifa kupitia API") },
          ],
        },
      ],
      feature: {
        title: tr("Transport operators", "Wasafirishaji"),
        body: tr("How booking offices follow up on every passenger call", "Jinsi ofisi za tiketi zinavyofuatilia kila simu ya abiria"),
        to: "/use-cases/transport",
        art: "bus",
      },
    },
    {
      key: "developers",
      label: tr("Developers", "Wasanidi"),
      groups: [
        {
          title: tr("Build", "Jenga"),
          links: [
            { label: tr("API reference", "Marejeo ya API"), to: "/developer", hint: tr("REST API for SMS, WhatsApp and voice", "REST API kwa SMS, WhatsApp na sauti") },
            { label: tr("Send SMS by API", "Tuma SMS kwa API"), to: "/developer", hint: tr("OTPs, alerts and notifications", "OTP, tahadhari na arifa") },
            { label: "Webhooks", to: "/developer", hint: tr("Delivery and status updates in real time", "Taarifa za ufikishaji papo hapo") },
          ],
        },
        {
          title: tr("Account", "Akaunti"),
          links: [
            { label: tr("Get API keys", "Pata funguo za API"), to: "/signup", hint: tr("Create an account, then generate keys", "Fungua akaunti, kisha tengeneza funguo") },
            { label: tr("Log in", "Ingia"), to: "/login", hint: tr("Manage keys and usage in your dashboard", "Simamia funguo na matumizi kwenye dashibodi") },
          ],
        },
      ],
      feature: {
        title: tr("Open the API reference", "Fungua marejeo ya API"),
        body: tr("Send your first SMS in a few lines of code", "Tuma SMS yako ya kwanza kwa mistari michache ya msimbo"),
        to: "/developer",
        art: "code",
      },
    },
  ];
  return { menus, pricing: { label: tr("Pricing", "Bei"), to: "/pricing" } };
}

function FeatureArt({ art }: { art: Feature["art"] }) {
  if (art === "bus") {
    return <img src="/website/transport-dar-station.webp" alt="" className="h-full w-full object-cover" loading="lazy" />;
  }
  if (art === "code") {
    return (
      <pre className="h-full w-full overflow-hidden bg-[#0B1B3F] p-5 text-[12px] leading-relaxed text-[#C9D3E3]">
        <code>{`POST /api/integration/v1/sms/send/
Authorization: Bearer mif_…

{
  "recipients": ["+2557…"],
  "message": "Karibu!",
  "sender_id": "SENDA"
}`}</code>
      </pre>
    );
  }
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[radial-gradient(120%_120%_at_0%_0%,#DCE8FF_0%,#EEF3FF_40%,#F7F1FB_75%,#FDF2F4_100%)]">
      <span className="absolute -left-6 top-8 h-20 w-20 rounded-full bg-[radial-gradient(circle_at_30%_30%,#FFD2B8,#F97316)] opacity-80" />
      <span className="absolute -right-4 bottom-6 h-16 w-16 rounded-full bg-[radial-gradient(circle_at_30%_30%,#B8F5E6,#14B8A6)] opacity-80" />
      <span className="relative flex h-32 w-32 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#BFD7FF,#2563EB)] shadow-xl shadow-[#2563EB]/30">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0B1B3F]">
          <Phone className="h-5 w-5" fill="currentColor" aria-hidden />
        </span>
      </span>
    </div>
  );
}

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, tr } = useSiteLang();
  return (
    <div role="group" aria-label={tr("Language", "Lugha")} className={cn("inline-flex rounded-full border border-[#D5DCE8] bg-white p-0.5", className)}>
      {(["en", "sw"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-bold tracking-wide transition-colors duration-200",
            focusRing,
            lang === l ? "bg-[#0B1B3F] text-white" : "text-[#3F4A5A] hover:text-[#0B1B3F]",
          )}
        >
          <span aria-hidden>{l === "en" ? "EN" : "SW"}</span>
          <span className="sr-only">{l === "en" ? "English" : "Kiswahili"}</span>
        </button>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const { tr } = useSiteLang();
  const { menus, pricing } = useMenus();
  // Dev-only: ?menu=products opens a menu on load, for screenshot review.
  const devMenu = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("menu") : null;
  const [openKey, setOpenKey] = useState<string | null>(devMenu);
  const [lastKey, setLastKey] = useState<string | null>(devMenu);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const closeTimer = useRef<number>();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!devMenu) setOpenKey(null);
    setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenKey(null);
        setMobileOpen(false);
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpenKey(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const openNow = (k: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenKey(k);
    setLastKey(k);
  };
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenKey(null), 160);
  };

  // Keep the last menu's content rendered while the panel animates closed.
  const panelMenu = menus.find((m) => m.key === (openKey ?? lastKey)) ?? null;
  const isOpen = openKey !== null;

  const SECTION_PREFIX: Record<string, string> = { products: "/products", usecases: "/use-cases", developers: "/developer" };
  const isCurrent = (m: MegaMenu) => pathname.startsWith(SECTION_PREFIX[m.key] ?? "#");
  const navText = (on: boolean, current: boolean) =>
    cn(
      "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[16px] font-medium transition-colors duration-200 xl:px-4 xl:text-[17px]",
      focusRing,
      isOpen ? (on ? "text-[#0B1B3F]" : "text-[#8A93A3] hover:text-[#0B1B3F]") : current ? "text-[#1D4ED8]" : "text-[#0B1B3F] hover:bg-[#F1F4F9]",
    );

  return (
    <>
      {/* Soft dim behind the open menu keeps attention on it. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none fixed inset-0 z-30 bg-[#0B1B3F]/[0.12] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0",
        )}
      />
      <header
        ref={headerRef}
        className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4"
        onMouseLeave={closeSoon}
        onMouseEnter={() => window.clearTimeout(closeTimer.current)}
      >
        <div
          className={cn(
            "mx-auto max-w-[1320px] border border-white/70 ring-1 ring-[#0B1B3F]/[0.06] backdrop-blur-xl transition-[border-radius,box-shadow,background-color] duration-300",
            isOpen || mobileOpen ? "rounded-[28px] bg-white shadow-[0_24px_60px_rgba(11,27,63,0.18)]" : "rounded-[36px] bg-white/90 shadow-[0_8px_30px_rgba(11,27,63,0.10)]",
          )}
        >
          <div className="flex h-16 items-center justify-between gap-3 pl-4 pr-2.5 sm:h-[72px] sm:pl-6 sm:pr-3">
            <Link to="/" className={cn("flex-shrink-0 rounded-full", focusRing)} aria-label={tr("SENDA home", "Ukurasa mkuu wa SENDA")}>
              <Wordmark />
            </Link>

            <nav aria-label={tr("Main", "Menyu kuu")} className="hidden items-center gap-0.5 lg:flex">
              {menus.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  aria-expanded={openKey === m.key}
                  aria-controls="site-mega-menu"
                  onMouseEnter={() => openNow(m.key)}
                  onClick={() => (openKey === m.key ? setOpenKey(null) : openNow(m.key))}
                  className={navText(openKey === m.key, isCurrent(m))}
                >
                  {m.label}
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", openKey === m.key && "rotate-180")} aria-hidden />
                </button>
              ))}
              <NavLink to={pricing.to} onMouseEnter={closeSoon} className={({ isActive }) => navText(false, isActive)}>
                {pricing.label}
              </NavLink>
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <LanguageSwitch />
              <Link to="/login" className={cn("whitespace-nowrap rounded-full px-3 py-2 text-[16px] font-medium text-[#0B1B3F] hover:bg-[#F1F4F9] xl:text-[17px]", focusRing)}>
                {tr("Log in", "Ingia")}
              </Link>
              <Link
                to="/book-demo"
                className={cn(
                  "whitespace-nowrap rounded-full border border-[#D5DCE8] bg-white px-4 py-2.5 text-[15px] font-medium text-[#0B1B3F] transition-colors hover:border-[#0B1B3F] xl:px-5 xl:text-[16px]",
                  focusRing,
                )}
              >
                {tr("Book a demo", "Omba onyesho")}
              </Link>
              <Link
                to="/signup"
                className={cn(
                  "whitespace-nowrap rounded-full bg-[#0B1B3F] px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#1A2B55] xl:px-6 xl:text-[16px]",
                  focusRing,
                )}
              >
                {tr("Get started", "Anza sasa")}
              </Link>
            </div>

            <div className="flex items-center gap-1.5 lg:hidden">
              <LanguageSwitch />
              <button
                type="button"
                className={cn("rounded-full p-2.5 text-[#0B1B3F] hover:bg-[#F1F4F9]", focusRing)}
                aria-label={mobileOpen ? tr("Close menu", "Funga menyu") : tr("Open menu", "Fungua menyu")}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Desktop mega menu: the bar grows into a panel; content fades and lifts in. */}
          <div
            id="site-mega-menu"
            className={cn(
              "hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid",
              isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
            aria-hidden={!isOpen}
            {...(!isOpen ? ({ inert: "" } as object) : {})}
          >
            <div className="min-h-0 overflow-hidden">
              {panelMenu && (
                <div
                  key={panelMenu.key}
                  className={cn(
                    "grid grid-cols-[1fr_320px] gap-8 px-6 pb-6 pt-3 transition-[opacity,transform] duration-300 xl:grid-cols-[1fr_340px]",
                    isOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
                  )}
                >
                  <div className={cn("grid gap-6 xl:pl-[10.5rem]", panelMenu.groups.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
                    {panelMenu.groups.map((g, gi) => (
                      <div
                        key={g.title}
                        className="animate-in fade-in slide-in-from-top-1 duration-300"
                        style={{ animationDelay: `${gi * 60}ms`, animationFillMode: "both" }}
                      >
                        <p className="mb-3 text-sm font-medium text-[#8A93A3]">{g.title}</p>
                        <ul className="space-y-0.5">
                          {g.links.map((l) => (
                            <li key={l.label}>
                              <Link
                                to={l.to}
                                onClick={() => setOpenKey(null)}
                                className={cn("-mx-3 block rounded-2xl px-3 py-2.5 transition-colors hover:bg-[#F5F6F8]", focusRing)}
                              >
                                <span className="block text-[16px] font-semibold text-[#0B1B3F]">{l.label}</span>
                                <span className="mt-0.5 block text-[14px] leading-snug text-[#5B6575]">{l.hint}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={panelMenu.feature.to}
                    onClick={() => setOpenKey(null)}
                    className={cn(
                      "group flex flex-col overflow-hidden rounded-3xl bg-[#F3F2EF] transition-transform duration-300 hover:-translate-y-0.5",
                      focusRing,
                    )}
                  >
                    <div className="h-44 overflow-hidden">
                      <FeatureArt art={panelMenu.feature.art} />
                    </div>
                    <div className="p-5">
                      <p className="flex items-center gap-1.5 font-semibold text-[#0B1B3F]">
                        {panelMenu.feature.title}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </p>
                      <p className="mt-1 text-sm text-[#5B6575]">{panelMenu.feature.body}</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu: the same groups as accordions. */}
          {mobileOpen && (
            <nav aria-label={tr("Mobile menu", "Menyu ya simu")} className="max-h-[calc(100vh-6rem)] overflow-y-auto border-t border-[#EEF0F4] px-4 pb-6 pt-1 lg:hidden">
              {menus.map((m) => {
                const open = mobileSection === m.key;
                return (
                  <div key={m.key} className="border-b border-[#EEF0F4]">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setMobileSection(open ? null : m.key)}
                      className={cn("flex w-full items-center justify-between py-3.5 text-left text-base font-semibold text-[#0B1B3F]", focusRing)}
                    >
                      {m.label}
                      <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", open && "rotate-180")} aria-hidden />
                    </button>
                    <div className={cn("grid transition-[grid-template-rows] duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                      <div className="min-h-0 overflow-hidden" {...(!open ? ({ inert: "" } as object) : {})}>
                        {m.groups.map((g) => (
                          <div key={g.title} className="pb-3">
                            <p className="px-1 pb-1 text-xs font-medium text-[#8A93A3]">{g.title}</p>
                            {g.links.map((l) => (
                              <Link key={l.label} to={l.to} className={cn("block rounded-xl px-1 py-2", focusRing)}>
                                <span className="block text-[15px] font-medium text-[#0B1B3F]">{l.label}</span>
                                <span className="block text-xs text-[#5B6575]">{l.hint}</span>
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              <Link to={pricing.to} className={cn("block border-b border-[#EEF0F4] py-3.5 text-base font-semibold text-[#0B1B3F]", focusRing)}>
                {pricing.label}
              </Link>
              <div className="mt-5 grid gap-3">
                <Link to="/signup" className={cn("rounded-full bg-[#0B1B3F] px-5 py-3 text-center font-semibold text-white", focusRing)}>
                  {tr("Get started", "Anza sasa")}
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/book-demo" className={cn("rounded-full border border-[#D5DCE8] px-4 py-3 text-center font-medium text-[#0B1B3F]", focusRing)}>
                    {tr("Book a demo", "Omba onyesho")}
                  </Link>
                  <Link to="/login" className={cn("rounded-full border border-[#D5DCE8] px-4 py-3 text-center font-medium text-[#0B1B3F]", focusRing)}>
                    {tr("Log in", "Ingia")}
                  </Link>
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
