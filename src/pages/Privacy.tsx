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
import { useEffect, useMemo, useState } from "react";
import { getImageSrc, encodeImagePath } from "@/utils/imageFallback";
import { useLanguage } from "@/hooks/useLanguage";

const Privacy = () => {
  const { t } = useLanguage();
  // Force light theme on marketing surfaces
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Check if user is authenticated by checking localStorage
  const isAuthenticated = !!localStorage.getItem('access_token');
  const user = null; // We don't need user data on the privacy page

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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-4">{t('legal.privacy.title')}</h1>
          <p className="text-gray-700 text-base sm:text-lg">{t('legal.privacy.last_updated')}</p>
        </div>
        <div className="p-6 sm:p-8 lg:p-12 text-black min-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.privacy.s1_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.privacy.s1_p1')}</p>
          <p className="text-gray-800 text-lg mb-8 leading-relaxed">{t('legal.privacy.s1_p2')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.privacy.s2_title')}</h2>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">{t('legal.privacy.s2_1_title')}</h3>
          <ul className="text-gray-800 text-lg mb-8 space-y-2">
            <li><strong className="text-black">{t('legal.privacy.s2_1_item1_label')}</strong> {t('legal.privacy.s2_1_item1_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s2_1_item2_label')}</strong> {t('legal.privacy.s2_1_item2_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s2_1_item3_label')}</strong> {t('legal.privacy.s2_1_item3_desc')}</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s2_2_title')}</h3>
          <ul className="text-gray-800 mb-6 space-y-1">
            <li><strong className="text-black">{t('legal.privacy.s2_2_item1_label')}</strong> {t('legal.privacy.s2_2_item1_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s2_2_item2_label')}</strong> {t('legal.privacy.s2_2_item2_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s2_2_item3_label')}</strong> {t('legal.privacy.s2_2_item3_desc')}</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s2_3_title')}</h3>
          <p className="text-gray-800 mb-6">{t('legal.privacy.s2_3_p')}</p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.privacy.s3_title')}</h2>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">{t('legal.privacy.s3_1_title')}</h3>
          <ul className="text-gray-800 text-lg mb-6 space-y-2">
            <li>{t('legal.privacy.s3_1_item1')}</li>
            <li>{t('legal.privacy.s3_1_item2')}</li>
            <li>{t('legal.privacy.s3_1_item3')}</li>
            <li>{t('legal.privacy.s3_1_item4')}</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">{t('legal.privacy.s3_2_title')}</h3>
          <ul className="text-gray-800 text-lg mb-6 space-y-2">
            <li>{t('legal.privacy.s3_2_item1')}</li>
            <li>{t('legal.privacy.s3_2_item2')}</li>
            <li>{t('legal.privacy.s3_2_item3')}</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">{t('legal.privacy.s3_3_title')}</h3>
          <ul className="text-gray-800 text-lg mb-6 space-y-2">
            <li>{t('legal.privacy.s3_3_item1')}</li>
            <li>{t('legal.privacy.s3_3_item2')}</li>
            <li>{t('legal.privacy.s3_3_item3')}</li>
            <li>{t('legal.privacy.s3_3_item4')}</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">{t('legal.privacy.s3_4_title')}</h3>
          <ul className="text-gray-800 text-lg mb-8 space-y-2">
            <li>{t('legal.privacy.s3_4_item1')}</li>
            <li>{t('legal.privacy.s3_4_item2')}</li>
            <li>{t('legal.privacy.s3_4_item3')}</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s4_title')}</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s4_1_title')}</h3>
          <p className="text-gray-800 mb-2">{t('legal.privacy.s4_1_p1')}</p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>{t('legal.privacy.s4_1_item1')}</li>
            <li>{t('legal.privacy.s4_1_item2')}</li>
            <li>{t('legal.privacy.s4_1_item3')}</li>
            <li>{t('legal.privacy.s4_1_item4')}</li>
          </ul>
          <p className="text-gray-800 mb-6">{t('legal.privacy.s4_1_p2')}</p>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s4_2_title')}</h3>
          <p className="text-gray-800 mb-2">{t('legal.privacy.s4_2_p1')}</p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>{t('legal.privacy.s4_2_item1')}</li>
            <li>{t('legal.privacy.s4_2_item2')}</li>
            <li>{t('legal.privacy.s4_2_item3')}</li>
            <li>{t('legal.privacy.s4_2_item4')}</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s4_3_title')}</h3>
          <p className="text-gray-800 mb-6">{t('legal.privacy.s4_3_p')}</p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s5_title')}</h2>
          <p className="text-gray-800 mb-2">{t('legal.privacy.s5_p1')}</p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li><strong className="text-black">{t('legal.privacy.s5_item1_label')}</strong> {t('legal.privacy.s5_item1_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s5_item2_label')}</strong> {t('legal.privacy.s5_item2_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s5_item3_label')}</strong> {t('legal.privacy.s5_item3_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s5_item4_label')}</strong> {t('legal.privacy.s5_item4_desc')}</li>
          </ul>
          <p className="text-gray-800 mb-6">{t('legal.privacy.s5_p2')}</p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s6_title')}</h2>
          <p className="text-gray-800 mb-2">{t('legal.privacy.s6_p1')}</p>
          <ul className="text-gray-800 mb-6 space-y-1">
            <li>{t('legal.privacy.s6_item1')}</li>
            <li>{t('legal.privacy.s6_item2')}</li>
            <li>{t('legal.privacy.s6_item3')}</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s7_title')}</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s7_1_title')}</h3>
          <p className="text-gray-800 mb-2">{t('legal.privacy.s7_1_p')}</p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li><strong className="text-black">{t('legal.privacy.s7_1_item1_label')}</strong> {t('legal.privacy.s7_1_item1_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s7_1_item2_label')}</strong> {t('legal.privacy.s7_1_item2_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s7_1_item3_label')}</strong> {t('legal.privacy.s7_1_item3_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s7_1_item4_label')}</strong> {t('legal.privacy.s7_1_item4_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s7_1_item5_label')}</strong> {t('legal.privacy.s7_1_item5_desc')}</li>
            <li><strong className="text-black">{t('legal.privacy.s7_1_item6_label')}</strong> {t('legal.privacy.s7_1_item6_desc')}</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s7_2_title')}</h3>
          <p className="text-gray-800 mb-2">{t('legal.privacy.s7_2_p')}</p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>{t('legal.privacy.s7_2_item1')}</li>
            <li>{t('legal.privacy.s7_2_item2')}</li>
            <li>{t('legal.privacy.s7_2_item3')}</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s7_3_title')}</h3>
          <p className="text-gray-800 mb-6">{t('legal.privacy.s7_3_p')}</p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s8_title')}</h2>
          <p className="text-gray-800 mb-4">{t('legal.privacy.s8_p')}</p>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s8_1_title')}</h3>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>{t('legal.privacy.s8_1_item1')}</li>
            <li>{t('legal.privacy.s8_1_item2')}</li>
            <li>{t('legal.privacy.s8_1_item3')}</li>
            <li>{t('legal.privacy.s8_1_item4')}</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s8_2_title')}</h3>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>{t('legal.privacy.s8_2_item1')}</li>
            <li>{t('legal.privacy.s8_2_item2')}</li>
            <li>{t('legal.privacy.s8_2_item3')}</li>
            <li>{t('legal.privacy.s8_2_item4')}</li>
            </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s8_3_title')}</h3>
          <ul className="text-gray-800 mb-6 space-y-1">
            <li>{t('legal.privacy.s8_3_item1')}</li>
            <li>{t('legal.privacy.s8_3_item2')}</li>
            <li>{t('legal.privacy.s8_3_item3')}</li>
            </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s9_title')}</h2>
          <p className="text-gray-800 mb-6">{t('legal.privacy.s9_p')}</p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s10_title')}</h2>
          <p className="text-gray-800 mb-6">{t('legal.privacy.s10_p')}</p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s11_title')}</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s11_1_title')}</h3>
          <p className="text-gray-800 mb-4">{t('legal.privacy.s11_1_p')}</p>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s11_2_title')}</h3>
          <p className="text-gray-800 mb-2">{t('legal.privacy.s11_2_p')}</p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>{t('legal.privacy.s11_2_item1')}</li>
            <li>{t('legal.privacy.s11_2_item2')}</li>
            <li>{t('legal.privacy.s11_2_item3')}</li>
            <li>{t('legal.privacy.s11_2_item4')}</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">{t('legal.privacy.s11_3_title')}</h3>
          <p className="text-gray-800 mb-6">{t('legal.privacy.s11_3_p')}</p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">{t('legal.privacy.s12_title')}</h2>
          <p className="text-gray-800 mb-2">{t('legal.privacy.s12_p')}</p>
          <ul className="text-gray-800 mb-6 space-y-1">
            <li>{t('legal.privacy.s12_item1')}</li>
            <li>{t('legal.privacy.s12_item2')}</li>
            <li>{t('legal.privacy.s12_item3')}</li>
            <li>{t('legal.privacy.s12_item4')}</li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">{t('legal.privacy.s13_title')}</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">{t('legal.privacy.s13_p')}</p>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">{t('legal.privacy.s13_dpo_title')}</h3>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
            {t('legal.privacy.label_email')} support@mifumosms.com<br/>
            {t('legal.privacy.label_phone')} +255 614 459 923<br/>
            {t('legal.privacy.label_address')} Dar es Salaam, Tanzania
          </p>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">{t('legal.privacy.s13_response_title')}</h3>
          <p className="text-gray-800 text-lg mb-8 leading-relaxed">{t('legal.privacy.s13_response_p')}</p>

          <div className="bg-black/10 rounded-xl p-6 mt-8">
            <p className="text-gray-700 text-center font-medium">{t('legal.privacy.footer_note')}</p>
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};

export default Privacy;
