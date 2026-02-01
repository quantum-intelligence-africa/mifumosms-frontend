import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Menu,
  X
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Terms = () => {
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
      {/* Header */}
      <header className="fixed top-0 left-0 z-[50] w-full bg-transparent py-4 backdrop-blur-xl">
        <section className="mx-4 md:mx-12 lg:mx-16 xl:mx-24 flex items-center justify-between">

          {/* Logo */}
          <div onClick={() => navigate('/')} className="w-28 flex items-center justify-center cursor-pointer">
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
          </div>

          {/* Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => navigate('/#features')} className={`transition-colors duration-300 cursor-pointer flex items-center gap-2 ${
              isScrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-gray-200'
            }`}>
              Features
            </button>
            <button onClick={() => navigate('/#pricing')} className={`transition-colors duration-300 cursor-pointer flex items-center gap-2 ${
              isScrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-gray-200'
            }`}>
              Pricing
            </button>
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
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-heading text-sm font-bold text-gray-900">
                      Mifumo SMS
                    </h2>
                    <p className="text-xs text-gray-600">Navigation</p>
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
                    <button onClick={() => { navigate('/#features'); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-blue-50 active:bg-blue-100 text-gray-900 hover:text-blue-600 transition-all duration-300 group border border-gray-200 hover:border-blue-300 touch-manipulation transform hover:scale-[1.02]">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                      <span className="font-semibold text-sm">Features</span>
                    </button>
                    <button onClick={() => { navigate('/#pricing'); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-blue-50 active:bg-blue-100 text-gray-900 hover:text-blue-600 transition-all duration-300 group border border-gray-200 hover:border-blue-300 touch-manipulation transform hover:scale-[1.02]">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                      <span className="font-semibold text-sm">Pricing</span>
                    </button>
                    <Link to="/developer" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-blue-50 active:bg-blue-100 text-gray-900 hover:text-blue-600 transition-all duration-300 group border border-gray-200 hover:border-blue-300 touch-manipulation transform hover:scale-[1.02]">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                      <span className="font-semibold text-sm">Developer</span>
                    </Link>
                </div>
              </div>

              {/* Account Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Account</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {isAuthenticated ? (
                    <>
                      <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-green-50 active:bg-green-100 text-gray-900 hover:text-green-600 transition-all duration-300 group border border-gray-200 hover:border-green-300 touch-manipulation transform hover:scale-[1.02]">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                        <span className="font-semibold text-sm">Dashboard</span>
                      </Link>
                      <button onClick={() => { navigate('/logout'); setIsMobileMenuOpen(false); }} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-red-50 active:bg-red-100 text-gray-900 hover:text-red-600 transition-all duration-300 group border border-gray-200 hover:border-red-300 touch-manipulation transform hover:scale-[1.02]">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 to-red-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                        <span className="font-semibold text-sm">Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-blue-50 active:bg-blue-100 text-gray-900 hover:text-blue-600 transition-all duration-300 group border border-gray-200 hover:border-blue-300 touch-manipulation transform hover:scale-[1.02]">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                        <span className="font-semibold text-sm">Login</span>
                      </Link>
                      <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 w-full text-left py-4 px-5 rounded-2xl hover:bg-green-50 active:bg-green-100 text-gray-900 hover:text-green-600 transition-all duration-300 group border border-gray-200 hover:border-green-300 touch-manipulation transform hover:scale-[1.02]">
                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600 opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
                        <span className="font-semibold text-sm">Get Started</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16" style={{ paddingTop: '120px' }}>
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-4">Terms of Service</h1>
          <p className="text-gray-700 text-base sm:text-lg">Last updated: October 6, 2025</p>
        </div>
        <div className="p-6 sm:p-8 lg:p-12 text-black min-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">1. Agreement</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              By accessing or using this service, you agree to be bound by these
              Terms of Service. If you do not agree to these terms, do not use the
              service.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">2. Use of the Service</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              You must use the service in compliance with applicable laws and
              regulations. You are responsible for all activity that occurs under
              your account and for maintaining the security of your credentials.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">3. Messaging and Content</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              You are solely responsible for the content you send through the
              platform, including obtaining necessary consents and honoring opt-in
              and opt-out requirements. Prohibited content includes spam, illegal
              content, and abusive or deceptive messages.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">4. Fees and Billing</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              Certain features may require payment. Prices and billing terms are
              presented at checkout. Taxes may apply. We may change prices with
              reasonable notice.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">5. Availability and Support</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              We strive for high availability but do not guarantee uninterrupted
              service. Planned maintenance and unforeseen outages may occur.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">6. Data and Privacy</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              Our handling of personal data is described in our
              {" "}
            <Link to="/privacy" className="text-blue-600 underline hover:text-blue-800">Privacy Policy</Link>.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">7. Intellectual Property</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              The platform and its content (excluding user content) are owned by
              us or our licensors and are protected by intellectual property laws.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">8. Termination</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              We may suspend or terminate access if you violate these terms or use
              the service in a harmful manner. You may stop using the service at
              any time.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">9. Disclaimers and Limitation of Liability</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              The service is provided "as is" without warranties of any kind. To
              the maximum extent permitted by law, we are not liable for indirect
              or consequential damages.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">10. Changes</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              We may modify these terms from time to time. Continued use of the
              service after changes become effective constitutes acceptance of the
              updated terms.
            </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">11. Contact</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
              Questions about these terms? Contact us via the support channels in
              your account.
          </p>

          <div className="bg-black/10 rounded-xl p-6 mt-8">
            <p className="text-gray-700 text-center font-medium">
              These terms are designed to comply with Tanzanian and Kenyan data protection and consumer protection laws.
            </p>
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
            <div onClick={() => navigate('/')} className="flex items-center gap-1 sm:gap-2 cursor-pointer">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-white">
                  Mifumo SMS
                </span>
              </div>

            {/* Nav */}
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-white/90">
              <a className="hover:underline hover:text-white" href="/#about">About</a>
              <a className="hover:underline hover:text-white" href="/#features">Features</a>
              <a className="hover:underline hover:text-white" href="/#pricing">Pricing</a>
              <a href="/developer" className="hover:underline hover:text-white">Developer</a>
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
    </div>
  );
};

export default Terms;


