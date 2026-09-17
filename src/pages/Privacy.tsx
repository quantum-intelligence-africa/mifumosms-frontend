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
      {/* Header */}
      <header className="fixed top-0 left-0 z-[50] w-full bg-transparent py-4 backdrop-blur-xl">
        <section className="mx-4 md:mx-12 lg:mx-16 xl:mx-24 flex items-center justify-between">

          {/* Logo */}
          <div onClick={() => navigate('/')} className="w-28 flex items-center justify-center cursor-pointer">
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 h-8">
              <BrandLogo className="h-14 sm:h-16 lg:h-20 w-auto -my-3 sm:-my-3 lg:-my-4 -mr-7 sm:-mr-8 lg:-mr-10" />
              <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold whitespace-nowrap leading-none text-gray-900">
                SENDA
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => navigate('/#features')} className="transition-colors duration-300 cursor-pointer flex items-center gap-2 text-gray-900 hover:text-gray-700">
              {t('legal.nav.features')}
            </button>
            <button onClick={() => navigate('/#pricing')} className="transition-colors duration-300 cursor-pointer flex items-center gap-2 text-gray-900 hover:text-gray-700">
              {t('legal.nav.pricing')}
            </button>
            <Link to="/developer" className="transition-colors duration-300 text-gray-900 hover:text-gray-700">
              {t('legal.nav.developer')}
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-4 w-28 justify-end">
              <Link to="/login">
                <button className="relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer flex items-center justify-center border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600">
                  {t('legal.nav.login')}
                </button>
              </Link>
              <Link to="/signup">
                <button className="relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer inline-flex items-center justify-center leading-tight whitespace-nowrap border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600">
                  {t('legal.nav.get_started')}
                </button>
              </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden relative p-2 cursor-pointer transition-colors duration-300 text-gray-900 hover:text-gray-700"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </section>
      </header>

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

      {/* Footer */}
      <footer className="relative py-4 sm:py-6 px-3 sm:px-4 lg:px-6">
        {/* Background Image for Footer */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/home background12.jpg"
            alt="Footer background"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Brand */}
            <div onClick={() => navigate('/')} className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                <BrandLogo className="h-16 sm:h-20 w-auto -my-3 sm:-my-4 -mr-8 sm:-mr-10" />
                <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-white">
                  SENDA
                </span>
              </div>

            {/* Nav */}
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-white/90">
              <a className="hover:underline hover:text-white" href="/#about">{t('legal.nav.about')}</a>
              <a className="hover:underline hover:text-white" href="/#features">{t('legal.nav.features')}</a>
              <a className="hover:underline hover:text-white" href="/#pricing">{t('legal.nav.pricing')}</a>
              <a href="/developer" className="hover:underline hover:text-white">{t('legal.nav.developer')}</a>
            </nav>

            {/* Contact */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-white/90">+255 614 459 923</span>
              <a
                href="https://wa.me/255614459923"
                target="_blank"
                rel="noreferrer"
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm transition-colors duration-300"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="border-t border-white/20 mt-3 sm:mt-4 pt-3 sm:pt-4 text-center">
            <p className="text-xs sm:text-sm text-white/80">{t('legal.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
