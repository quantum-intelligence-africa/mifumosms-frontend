import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Menu,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const Developer = () => {
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

  // Handle scroll-based header color change
  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById('developer-hero');
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        setIsScrolled(window.scrollY > heroBottom - 100); // Add small offset
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

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
                Mifumo SMS
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
              Features
            </Link>
            <Link to="/#pricing" className={`transition-colors duration-300 flex items-center gap-2 ${
              isScrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-gray-200'
            }`}>
              Pricing
            </Link>
            <Link to="/developer" className={`transition-colors duration-300 ${
              isScrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-gray-200'
            }`}>
              Developer
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-4 w-28 justify-end">
              <Link to="/login">
                <button className={`relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer flex items-center justify-center ${
                  isScrolled
                    ? 'border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                    : 'border border-white text-white hover:bg-white hover:text-gray-900'
                }`}>
                  Login
                </button>
              </Link>
              <Link to="/signup">
                <button className={`relative rounded-full px-6 py-2 text-sm transition duration-300 ease-out cursor-pointer inline-flex items-center justify-center leading-tight whitespace-nowrap ${
                  isScrolled
                    ? 'border border-gray-900 text-gray-900 hover:bg-blue-600 hover:text-white hover:border-blue-600'
                    : 'border border-white text-white hover:bg-blue-600 hover:text-white hover:border-blue-600'
                }`}>
                  Get started
                </button>
              </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden relative p-2 cursor-pointer transition-colors duration-300 ${
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
                  Mifumo SMS API
                  <br />
                  <span className="text-blue-200">Documentation</span>
                </h1>
                <p className="text-center text-sm sm:text-base md:text-lg text-gray-100 max-w-3xl mx-auto leading-relaxed font-normal">
                  Simplify your communication with the Mifumo SMS API. Our comprehensive documentation and developer guides provide everything you need to seamlessly integrate SMS services into your applications.
                </p>
              </div>

              <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 justify-center pt-2">
                <a href="https://docs-sms.mifumolabs.com/" target="_blank" rel="noopener noreferrer">
                  <Button className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-4 sm:px-6 md:px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    Get started
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
              Build powerful communication experiences
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              with our comprehensive APIs, SDKs and developer tools.
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">High Availability</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mifumo SMS API is designed to be highly available and scalable. Enhancing the reliability of your applications using distributed systems.
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-medium hidden">
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">Focus on What Matters</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mifumo SMS API allows you to focus on your business logic by providing a reliable and scalable notification service. You just need to integrate with our API and we will take care of the rest.
                </p>
                <div className="mt-4 flex items-center text-green-600 font-medium hidden">
                  <span>Learn more</span>
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">Reliable Message Delivery</h3>
                <p className="text-gray-600 leading-relaxed">
                  Mifumo SMS API ensures that your messages are delivered to your users in a timely manner. We provide detailed logs and reports to help you track the status of your messages.
                </p>
                <div className="mt-4 flex items-center text-purple-600 font-medium hidden">
                  <span>Learn more</span>
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
              Powerful SMS API Features
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need to integrate SMS functionality into your applications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Send className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Send SMS</h3>
              <p className="text-sm text-gray-600">Send SMS messages to individuals or groups</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Contact Management</h3>
              <p className="text-sm text-gray-600">Manage contacts and groups efficiently</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600">Track delivery rates and campaign performance</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Globe className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Multi-language</h3>
              <p className="text-sm text-gray-600">Support for multiple languages and regions</p>
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
            <Link to="/#about" className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-white">
                  Mifumo SMS
                </span>
              </Link>

            {/* Nav */}
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-white/90">
              <Link to="/?scroll=about" className="hover:underline hover:text-white">About</Link>
              <Link to="/?scroll=features" className="hover:underline hover:text-white">Features</Link>
              <Link to="/?scroll=pricing" className="hover:underline hover:text-white">Pricing</Link>
              <a href="#developer-hero" className="text-blue-200 hover:underline hover:text-white">Developer</a>
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
            <p className="text-xs sm:text-sm text-white/80">&copy; 2025 Mifumo SMS. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Menu Overlay */}
      <>
        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-lg z-[1000] sm:hidden animate-in fade-in duration-300" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        {/* Mobile Menu - Slide from Right */}
        {isMobileMenuOpen && (
          <div className="fixed top-0 right-0 h-full w-5/6 max-w-xs bg-white/95 backdrop-blur-xl shadow-2xl z-[1001] lg:hidden flex flex-col transform transition-transform duration-300 ease-out overflow-hidden border-l border-gray-200" style={{ transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)' }}>
            {/* Header with Close Button */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-heading text-sm font-bold text-gray-900">
                      Mifumo SMS
                    </h2>
                    <p className="text-xs text-gray-500">Navigation</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="h-10 w-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Menu Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 sm:space-y-6">
              {/* Navigation Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Navigate</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <Link to="/#about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-blue-50 active:bg-blue-100 text-gray-900 hover:text-blue-600 transition-all duration-300 group border border-gray-200 hover:border-blue-300 touch-manipulation transform hover:scale-[1.02]">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                      <span className="font-semibold text-sm">About</span>
                    </Link>
                    <Link to="/#features" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-blue-50 active:bg-blue-100 text-gray-900 hover:text-blue-600 transition-all duration-300 group border border-gray-200 hover:border-blue-300 touch-manipulation transform hover:scale-[1.02]">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                      <span className="font-semibold text-sm">Features</span>
                    </Link>
                    <Link to="/#pricing" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-blue-50 active:bg-blue-100 text-gray-900 hover:text-blue-600 transition-all duration-300 group border border-gray-200 hover:border-blue-300 touch-manipulation transform hover:scale-[1.02]">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                      <span className="font-semibold text-sm">Pricing</span>
                    </Link>
                    <a href="#developer-hero" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-blue-50 active:bg-blue-100 text-blue-600 transition-all duration-300 group border border-blue-300 touch-manipulation transform hover:scale-[1.02]">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                      <span className="font-semibold text-sm">Developer</span>
                    </a>
                </div>
              </div>

              {/* Account Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Account</p>
                </div>
                <div className="space-y-3">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full justify-center text-sm h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300 font-semibold touch-manipulation rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] flex items-center">
                        Login
                      </button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full justify-center text-sm h-12 bg-blue-600 hover:bg-blue-700 border-2 border-blue-600 text-white transition-all duration-300 font-semibold touch-manipulation rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] flex items-center">
                        Get Started
                      </button>
                    </Link>
                </div>
              </div>

              {/* Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Contact Us</p>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 p-5 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
                    <a href="tel:+255614459923" className="font-bold text-gray-900 hover:text-blue-600 transition-colors text-sm">
                      +255 614 459 923
                    </a>
                    <p className="text-xs text-gray-600 font-medium">
                      Mon-Fri, 9am-6pm
                    </p>
                  </div>
                    <a href="https://wa.me/255614459923" target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full justify-center gap-3 bg-green-600 hover:bg-green-700 text-white border-green-600 h-12 transition-all duration-300 hover:shadow-lg font-semibold rounded-xl touch-manipulation transform hover:scale-[1.02]">
                        <MessageSquare className="w-5 h-5" />
                        WhatsApp Chat
                      </Button>
                    </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

export default Developer;
