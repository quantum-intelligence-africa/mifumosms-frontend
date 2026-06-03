import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, ChevronDown } from "lucide-react";
import { LanguageContext } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { BrandLogo } from "@/components/layout/BrandLogo";
import MobileMenu from "@/components/layout/MobileMenu";
import { PLATFORM_LINKS } from "@/components/landing/shared/platformLinks";

interface LandingHeaderProps {
  /**
   * When provided, internal anchor clicks (Features, Pricing, Platform items)
   * call this instead of navigating. Used on the landing page itself so links
   * smooth-scroll in place. From other pages, omit it — the header navigates
   * back to /#<anchor>.
   */
  scrollToSection?: (sectionId: string) => void;
  /**
   * When true the header skips the transparent-over-hero treatment and renders
   * in its scrolled (solid) state from the first frame. Set on pages that have
   * no hero band at all.
   */
  forceScrolled?: boolean;
  /**
   * ID of the dark hero section on the current page. The header is transparent
   * over it and switches to its scrolled (light) state once the user scrolls
   * past. Defaults to `about` (landing page).
   */
  heroSectionId?: string;
}

export const LandingHeader = ({
  scrollToSection,
  forceScrolled = false,
  heroSectionId = "about",
}: LandingHeaderProps) => {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(forceScrolled);

  // Cross-page anchor navigation: in-page smooth scroll on /, otherwise route to /#anchor.
  const handleAnchor = (anchor: string) => {
    if (scrollToSection && location.pathname === "/") {
      scrollToSection(anchor);
    } else {
      navigate(`/#${anchor}`);
    }
  };

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Scroll-driven color swap. Only meaningful on the landing page; on other
  // pages we stay in the scrolled (solid) state because there is no hero band.
  useEffect(() => {
    if (forceScrolled) {
      setIsScrolled(true);
      return;
    }

    let ticking = false;
    let cachedHeroBottom = 0;

    const cacheHeroBottom = () => {
      const heroSection = document.getElementById(heroSectionId);
      cachedHeroBottom = heroSection
        ? heroSection.offsetTop + heroSection.offsetHeight
        : 0;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > cachedHeroBottom - 100);
          ticking = false;
        });
        ticking = true;
      }
    };

    cacheHeroBottom();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", cacheHeroBottom, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", cacheHeroBottom);
    };
  }, [forceScrolled, heroSectionId]);

  const linkColor = isScrolled
    ? "text-gray-900 hover:text-gray-700"
    : "text-white hover:text-gray-200";

  return (
    <>
      <header className="fixed top-0 left-0 z-[50] w-full bg-transparent py-4 backdrop-blur-xl">
        <section className="px-0 pl-6 sm:pl-8 md:pl-12 lg:pl-20 flex items-center justify-between max-w-full pr-4 sm:pr-6 md:pr-8 lg:pr-12">
          {/* Logo */}
          <div
            onClick={() => handleAnchor("about")}
            className="flex items-center justify-start cursor-pointer"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 h-8">
              <BrandLogo className="h-14 sm:h-16 lg:h-20 w-auto -my-3 sm:-my-3 lg:-my-4 -mr-7 sm:-mr-8 lg:-mr-10" />
              <span
                className={`font-heading text-sm sm:text-lg lg:text-xl font-bold whitespace-nowrap leading-none transition-colors duration-300 ${
                  isScrolled ? "text-gray-900" : "text-white"
                }`}
              >
                SENDA
              </span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => handleAnchor("features")}
              className={`transition-colors duration-300 cursor-pointer flex items-center gap-2 ${linkColor}`}
            >
              {language === "sw" ? "Vipengele" : "Features"}
            </button>
            <button
              onClick={() => handleAnchor("pricing")}
              className={`transition-colors duration-300 cursor-pointer flex items-center gap-2 ${linkColor}`}
            >
              {language === "sw" ? "Bei" : "Pricing"}
            </button>

            {/* Platform mega-menu */}
            <div className="relative group">
              <button
                type="button"
                className={`transition-colors duration-300 cursor-pointer inline-flex items-center gap-1 ${linkColor}`}
                aria-haspopup="true"
                aria-label="Platform menu"
              >
                {language === "sw" ? "Jukwaa" : "Platform"}
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
              </button>
              <div
                role="menu"
                className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 absolute left-1/2 -translate-x-1/2 top-full pt-3 w-[560px] transition-all duration-200 z-50"
              >
                <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-blue-900/10 overflow-hidden">
                  <div className="px-5 pt-4 pb-3 border-b border-gray-100 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                      {language === "sw" ? "Jukwaa" : "Platform"}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-gray-900">
                      {language === "sw"
                        ? "Njia tatu, suite moja."
                        : "Three channels, one stack."}
                    </p>
                  </div>
                  <ul className="grid grid-cols-2 gap-1 p-2">
                    {PLATFORM_LINKS.map(
                      ({ id, anchor, label, labelSw, blurb, blurbSw, Icon }) => (
                        <li key={id} role="none">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleAnchor(anchor)}
                            className="group/item w-full text-left flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-blue-50/70 focus:bg-blue-50/70 focus:outline-none transition-colors"
                          >
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[13px] font-semibold text-gray-900 leading-tight">
                                {language === "sw" ? labelSw : label}
                              </span>
                              <span className="block mt-0.5 text-[11px] text-gray-500 leading-snug">
                                {language === "sw" ? blurbSw : blurb}
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <Link
              to="/developer"
              className={`transition-colors duration-300 ${linkColor}`}
            >
              {language === "sw" ? "Developa" : "Developer"}
            </Link>
            <Link
              to="/whatsapp-broadcast"
              className={`transition-colors duration-300 flex items-center gap-1.5 ${
                isScrolled
                  ? "text-gray-900 hover:text-[#25D366]"
                  : "text-white hover:text-[#25D366]"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </Link>
          </div>

          {/* Desktop action buttons */}
          <div className="hidden lg:flex items-center gap-3 justify-end">
            <LanguageToggle isDark={isScrolled} />
            <Link to="/login">
              <button
                className={`relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer flex items-center justify-center ${
                  isScrolled
                    ? "border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    : "border border-white text-white hover:bg-white hover:text-gray-900"
                }`}
              >
                {language === "sw" ? "Ingia" : "Login"}
              </button>
            </Link>
            <Link to="/signup">
              <button
                className={`relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer inline-flex items-center justify-center leading-tight whitespace-nowrap ${
                  isScrolled
                    ? "border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                    : "border border-white text-white hover:bg-blue-600 hover:text-white hover:border-blue-600"
                }`}
              >
                {language === "sw" ? "Jiunge" : "Get started"}
              </button>
            </Link>
          </div>

          {/* Mobile language + hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageToggle isDark={isScrolled} />
            <button
              className={`relative p-2 cursor-pointer transition-colors duration-300 ${linkColor}`}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </section>
      </header>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        scrollToSection={(id) => {
          handleAnchor(id);
        }}
      />
    </>
  );
};

export default LandingHeader;
