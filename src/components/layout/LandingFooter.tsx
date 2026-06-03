import { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LanguageContext } from "@/contexts/LanguageContext";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { PLATFORM_LINKS } from "@/components/landing/shared/platformLinks";

interface LandingFooterProps {
  /**
   * When provided, anchor clicks scroll in-page (landing). When omitted, the
   * footer navigates to /#anchor so the landing page can pick up the hash.
   */
  scrollToSection?: (sectionId: string) => void;
}

export const LandingFooter = ({ scrollToSection }: LandingFooterProps) => {
  const { language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAnchor = (anchor: string) => {
    if (scrollToSection && location.pathname === "/") {
      scrollToSection(anchor);
    } else {
      navigate(`/#${anchor}`);
    }
  };

  return (
    <footer className="relative isolate overflow-hidden py-6 sm:py-8 px-3 sm:px-4 lg:px-6 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-600">
      {/* Decorative blur orbs + grid overlay (clipped to the footer's stacking context via `isolate` above) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 translate-x-1/2 translate-y-1/3 rounded-full bg-blue-300/25 blur-3xl" />
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="footerGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footerGrid)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Brand */}
          <div
            onClick={() => handleAnchor("about")}
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer"
          >
            <BrandLogo className="h-16 sm:h-20 w-auto -my-3 sm:-my-4 -mr-8 sm:-mr-10" />
            <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-white">
              SENDA
            </span>
          </div>

          {/* Main nav */}
          <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-white/90">
            <button
              type="button"
              onClick={() => handleAnchor("about")}
              className="hover:underline hover:text-white"
            >
              {language === "sw" ? "Kuhusu" : "About"}
            </button>
            <button
              type="button"
              onClick={() => handleAnchor("features")}
              className="hover:underline hover:text-white"
            >
              {language === "sw" ? "Vipengele" : "Features"}
            </button>
            <button
              type="button"
              onClick={() => handleAnchor("pricing")}
              className="hover:underline hover:text-white"
            >
              {language === "sw" ? "Bei" : "Pricing"}
            </button>
            <Link to="/developer" className="hover:underline hover:text-white">
              {language === "sw" ? "Developa" : "Developer"}
            </Link>
            <Link
              to="/whatsapp-broadcast"
              className="hover:underline hover:text-[#25D366] flex items-center gap-1"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </Link>
          </nav>

          {/* Contact */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-white/90">
              +255 615 229 007
            </span>
            <a
              href="https://wa.me/255615229007"
              target="_blank"
              rel="noreferrer"
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-semibold transition-colors duration-300"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Platform anchors */}
        <div className="border-t border-white/20 mt-3 sm:mt-4 pt-3 sm:pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
              {language === "sw" ? "Jukwaa" : "Platform"}
            </span>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-x-4 text-xs text-white/80">
              {PLATFORM_LINKS.map(({ id, anchor, label, labelSw }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleAnchor(anchor)}
                  className="hover:underline hover:text-white transition-colors"
                >
                  {language === "sw" ? labelSw : label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="border-t border-white/20 mt-3 sm:mt-4 pt-3 sm:pt-4 text-center">
          <p className="text-xs sm:text-sm text-white/80">
            &copy; 2025 SENDA.{" "}
            {language === "sw"
              ? "Haki zote zimehifadhiwa."
              : "All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
