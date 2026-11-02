import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Menu
} from "lucide-react";
import MobileMenu from "@/components/layout/MobileMenu";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

const Terms = () => {
  const { t } = useLanguage();
  // Force light theme on marketing surfaces
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Check if user is authenticated by checking localStorage
  const isAuthenticated = !!localStorage.getItem('access_token');
  const user = null; // We don't need user data on the terms page

  // Smooth scroll function for navigation
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll-based header color change with performance optimization
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-blue-100 to-white">
      <LandingHeader forceScrolled />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        scrollToSection={scrollToSection}
      />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16" style={{ paddingTop: '120px' }}>
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-4">{t('legal.terms.title')}</h1>
          <p className="text-gray-700 text-base sm:text-lg">{t('legal.terms.last_updated')}</p>
        </div>
        <div className="p-6 sm:p-8 lg:p-12 text-black min-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s1_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s1_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s2_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s2_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s3_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s3_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s4_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s4_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s5_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s5_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s6_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              {t('legal.terms.s6_p_pre')}
              {" "}
            <Link to="/privacy" className="text-blue-600 underline hover:text-blue-800">{t('legal.terms.privacy_policy_link')}</Link>.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s7_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s7_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s8_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s8_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s9_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s9_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s10_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s10_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.terms.s11_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.terms.s11_p')}</p>

          <div className="bg-black/10 rounded-xl p-6 mt-8">
            <p className="text-gray-700 text-center font-medium">{t('legal.terms.footer_note')}</p>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};

export default Terms;


