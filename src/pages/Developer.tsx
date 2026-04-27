import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React, { useContext, useState, useEffect } from "react";
import {
  Code,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Users,
  Send,
  BarChart3,
  Globe,
  Activity,
  Server,
  Target,
  Clock,
  Menu
} from "lucide-react";
import { Link } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { LanguageContext } from "../contexts/LanguageContext";
import MobileMenu from "../components/layout/MobileMenu";
const Developer = () => {
  const context = useContext(LanguageContext);
  const { language, t } = context || { language: 'en', t: (s: string) => s };
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Handle scroll-based header color change with performance optimization
  useEffect(() => {
    let ticking = false;
    let cachedHeroBottom = 0;

    const cacheHeroBottom = () => {
      const heroSection = document.getElementById('developer-hero');
      if (heroSection) {
        cachedHeroBottom = heroSection.offsetTop + heroSection.offsetHeight;
      }
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', cacheHeroBottom, { passive: true });
    handleScroll(); // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', cacheHeroBottom);
    };
  }, []);

  // Auto-scroll to hero section on page load
  useEffect(() => {
    // Small delay to ensure the page has fully loaded
    setTimeout(() => {
      scrollToSection('developer-hero');
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 z-[50] w-full bg-transparent py-4 backdrop-blur-xl">
        <section className="mx-4 md:mx-12 lg:mx-16 xl:mx-24 flex items-center justify-between">

          {/* Logo */}
          <Link to="/#about" className="w-28 flex items-center justify-center">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 h-8">
              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-lg flex-shrink-0">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className={`font-heading text-sm sm:text-lg lg:text-xl font-bold whitespace-nowrap leading-none transition-colors duration-300 ${
                isScrolled ? 'text-gray-900' : 'text-white'
              }`}>
                SENDA
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/#features" className={`transition-colors duration-300 flex items-center gap-2 ${
              isScrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-gray-200'
            }`}>
              {language === 'sw' ? 'Vipengele' : 'Features'}
            </Link>
            <Link to="/#pricing" className={`transition-colors duration-300 flex items-center gap-2 ${
              isScrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-gray-200'
            }`}>
              {language === 'sw' ? 'Bei' : 'Pricing'}
            </Link>
            <Link to="/developer" className={`transition-colors duration-300 ${
              isScrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-gray-200'
            }`}>
              {language === 'sw' ? 'Developa' : 'Developer'}
            </Link>
            <Link to="/whatsapp-broadcast" className={`transition-colors duration-300 flex items-center gap-1.5 ${
              isScrolled
                ? 'text-gray-900 hover:text-[#25D366]'
                : 'text-white hover:text-[#25D366]'
            }`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-3 justify-end">
              <LanguageToggle isDark={isScrolled} />
              <Link to="/login">
                <button className={`relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer flex items-center justify-center ${
                  isScrolled
                    ? 'border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                    : 'border border-white text-white hover:bg-white hover:text-gray-900'
                }`}>
                  {language === 'sw' ? 'Ingia' : 'Login'}
                </button>
              </Link>
              <Link to="/signup">
                <button className={`relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer inline-flex items-center justify-center leading-tight whitespace-nowrap ${
                  isScrolled
                    ? 'border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                    : 'border border-white text-white hover:bg-blue-600 hover:text-white hover:border-blue-600'
                }`}>
                  {language === 'sw' ? 'Jiunge' : 'Get started'}
                </button>
              </Link>
          </div>

          {/* Language Toggle and Mobile Menu Button (Mobile) */}
          <div className="flex lg:hidden items-center gap-2">
            <LanguageToggle isDark={isScrolled} />
            <button
              className={`relative p-2 cursor-pointer transition-colors duration-300 ${
                isScrolled
                  ? 'text-gray-900 hover:text-gray-700'
                  : 'text-white hover:text-gray-200'
              }`}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </section>
      </header>

      {/* Hero Section - Full Viewport */}
      <section id="developer-hero" className="min-h-screen flex flex-col justify-center items-center px-3 sm:px-4 md:px-5 lg:px-6 relative pt-20 pb-3 sm:pt-24 sm:pb-4 md:pt-28 md:pb-6 lg:pt-32 lg:pb-8 z-10">
        {/* Background Image for Hero Only */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/home background12.jpg"
            alt="Hero background"
            className="w-full h-full object-cover scale-[3]"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        <div className="w-full relative z-10">
          {/* Content - Centered like Textmagic */}
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Text Content - Centered */}
            <div className="text-center w-full space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 max-w-4xl mx-auto">
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <h1 className="font-heading text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {language === 'sw' ? 'API ya SENDA' : 'SENDA API'}
                  <br />
                  <span className="text-blue-200">{language === 'sw' ? 'Nyaraka' : 'Documentation'}</span>
                </h1>
                <p className="text-center text-sm sm:text-base md:text-lg text-gray-100 max-w-3xl mx-auto leading-relaxed font-normal">
                  {language === 'sw' ? 'Rahisisha mawasiliano yako kwa kutumia API ya SENDA. Nyaraka na mwongozo wa msanidi programu vinakupa kila kitu unachohitaji kuunganisha huduma za SMS kwenye programu zako.' : 'Simplify your communication with the SENDA API. Our comprehensive documentation and developer guides provide everything you need to seamlessly integrate SMS services into your applications.'}
                </p>
              </div>

              <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 justify-center pt-2">
                <a href="https://docs-sms.mifumolabs.com/" target="_blank" rel="noopener noreferrer">
                  <Button className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-4 sm:px-6 md:px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    {language === 'sw' ? 'Anza' : 'Get started'}
                  </Button>
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 md:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'sw' ? 'Jenga uzoefu wa mawasiliano wenye nguvu' : 'Build powerful communication experiences'}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {language === 'sw' ? 'kwa API zetu kamili, SDKs na zana za msanidi programu.' : 'with our comprehensive APIs, SDKs and developer tools.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* High Availability */}
            <Card className="group relative bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <CardContent className="relative p-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mb-4 shadow-md">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{language === 'sw' ? 'Upatikanaji wa Juu' : 'High Availability'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {language === 'sw' ? 'API ya SENDA imeundwa kuwa na upatikanaji wa juu na kupanuka. Inaboresha uaminifu wa programu zako kwa kutumia mifumo iliyosambazwa.' : 'SENDA API is designed to be highly available and scalable. Enhancing the reliability of your applications using distributed systems.'}
                </p>
                <div className="mt-4 items-center text-blue-600 font-medium hidden">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            {/* Focus on What Matters */}
            <Card className="group relative bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <CardContent className="relative p-6">
                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center mb-4 shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{language === 'sw' ? 'Lenga Kinachohusika' : 'Focus on What Matters'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {language === 'sw' ? 'API ya SENDA inakuwezesha kuzingatia mantiki ya biashara yako kwa kutoa huduma ya arifa inayotegemewa na inayopanuka. Unahitaji tu kuunganisha na API yetu na tutashughulikia yote mengine.' : 'SENDA API allows you to focus on your business logic by providing a reliable and scalable notification service. You just need to integrate with our API and we will take care of the rest.'}
                </p>
                <div className="mt-4 items-center text-green-600 font-medium hidden">
                  <span>{language === 'sw' ? 'Jifunze zaidi' : 'Learn more'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            {/* Reliable Message Delivery */}
            <Card className="group relative bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <CardContent className="relative p-6">
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center mb-4 shadow-md">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{language === 'sw' ? 'Uwasilishaji wa Ujumbe wa Kuaminika' : 'Reliable Message Delivery'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {language === 'sw' ? 'API ya SENDA inahakikisha ujumbe wako unawafikia watumiaji wako kwa wakati. Tunatoa kumbukumbu na ripoti za kina ili kukusaidia kufuatilia hali ya ujumbe wako.' : 'SENDA API ensures that your messages are delivered to your users in a timely manner. We provide detailed logs and reports to help you track the status of your messages.'}
                </p>
                <div className="mt-4 items-center text-purple-600 font-medium hidden">
                  <span>{language === 'sw' ? 'Jifunze zaidi' : 'Learn more'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Features Section */}
      <section className="py-16 px-4 md:px-12 lg:px-16 xl:px-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {language === 'sw' ? 'Vipengele vya API ya SMS' : 'Powerful SMS API Features'}
            </h2>
            <p className="text-lg text-gray-600">
              {language === 'sw' ? 'Kila kitu unachohitaji kuunganisha SMS kwenye programu zako' : 'Everything you need to integrate SMS functionality into your applications'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Send className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{language === 'sw' ? 'Tuma SMS' : 'Send SMS'}</h3>
              <p className="text-sm text-gray-600">{language === 'sw' ? 'Tuma ujumbe wa SMS kwa watu binafsi au makundi' : 'Send SMS messages to individuals or groups'}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{language === 'sw' ? 'Usimamizi wa Mawasiliano' : 'Contact Management'}</h3>
              <p className="text-sm text-gray-600">{language === 'sw' ? 'Simamia mawasiliano na makundi kwa ufanisi' : 'Manage contacts and groups efficiently'}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{language === 'sw' ? 'Takwimu' : 'Analytics'}</h3>
              <p className="text-sm text-gray-600">{language === 'sw' ? 'Fuatilia viwango vya uwasilishaji na utendaji wa kampeni' : 'Track delivery rates and campaign performance'}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Globe className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{language === 'sw' ? 'Lugha Nyingi' : 'Multi-language'}</h3>
              <p className="text-sm text-gray-600">{language === 'sw' ? 'Msaada kwa lugha na kanda mbalimbali' : 'Support for multiple languages and regions'}</p>
            </div>
          </div>
        </div>
      </section>


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
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                <MessageSquare className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-white">
                SENDA
              </span>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-white/90">
              <a className="hover:underline hover:text-white" href="/#about">{language === 'sw' ? 'Kuhusu' : 'About'}</a>
              <a className="hover:underline hover:text-white" href="/#features">{language === 'sw' ? 'Vipengele' : 'Features'}</a>
              <a className="hover:underline hover:text-white" href="/#pricing">{language === 'sw' ? 'Bei' : 'Pricing'}</a>
              <Link to="/developer" className="hover:underline hover:text-white">{language === 'sw' ? 'Developa' : 'Developer'}</Link>
              <Link to="/" className="hover:underline hover:text-[#25D366] flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </Link>
            </nav>

            {/* Contact */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-white/90">+255 615 229 007</span>
              <a
                href="https://wa.me/255615229007"
                target="_blank"
                rel="noreferrer"
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm transition-colors duration-300"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="border-t border-white/20 mt-3 sm:mt-4 pt-3 sm:pt-4 text-center">
            <p className="text-xs sm:text-sm text-white/80">&copy; 2025 SENDA. {language === 'sw' ? 'Haki zote zimehifadhiwa.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      {/* Mobile Menu - Half page overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        scrollToSection={scrollToSection}
      />
    </div>
  );
};

export default Developer;
