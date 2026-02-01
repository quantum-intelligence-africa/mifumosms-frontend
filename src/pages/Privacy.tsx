import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Menu,
  X
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getImageSrc, encodeImagePath } from "@/utils/imageFallback";

const Privacy = () => {
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-black mb-4">Privacy Policy</h1>
          <p className="text-gray-700 text-base sm:text-lg">Last updated: January 22, 2026</p>
        </div>
        <div className="p-6 sm:p-8 lg:p-12 text-black min-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">1. Introduction</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
            Welcome to Mifumo SMS ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SMS communication platform.
          </p>
          <p className="text-gray-800 text-lg mb-8 leading-relaxed">
            By using our services, you agree to the collection and use of information in accordance with this policy. We comply with Tanzanian and Kenyan data protection laws, including the Data Protection Act and any applicable telecommunications regulations.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">2. Information We Collect</h2>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">2.1 Personal Information</h3>
          <ul className="text-gray-800 text-lg mb-8 space-y-2">
            <li><strong className="text-black">Account Information:</strong> Name, email address, phone number, company details, and billing information</li>
            <li><strong className="text-black">Contact Lists:</strong> Phone numbers and contact details you upload for SMS campaigns</li>
            <li><strong className="text-black">Profile Information:</strong> Business details, preferences, and communication settings</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">2.2 Usage and Technical Data</h3>
          <ul className="text-gray-800 mb-6 space-y-1">
            <li><strong className="text-black">Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
            <li><strong className="text-black">Usage Logs:</strong> SMS delivery status, campaign performance, login times, and feature usage</li>
            <li><strong className="text-black">Cookies and Tracking:</strong> Session data and analytics information (see our Cookie Policy)</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">2.3 Message Content</h3>
          <p className="text-gray-800 mb-6">
            We process SMS message content solely for delivery purposes. Message content is encrypted in transit and at rest, and we do not read, analyze, or store message content beyond what's necessary for service delivery and compliance.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">3. How We Use Your Information</h2>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">3.1 Service Provision</h3>
          <ul className="text-gray-800 text-lg mb-6 space-y-2">
            <li>Deliver SMS messages to intended recipients</li>
            <li>Process payments and manage billing</li>
            <li>Provide customer support and technical assistance</li>
            <li>Maintain service availability and performance</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">3.2 Communication</h3>
          <ul className="text-gray-800 text-lg mb-6 space-y-2">
            <li>Send service updates, billing notifications, and account alerts</li>
            <li>Respond to customer inquiries and support requests</li>
            <li>Provide marketing communications (with your consent)</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">3.3 Compliance and Security</h3>
          <ul className="text-gray-800 text-lg mb-6 space-y-2">
            <li>Prevent fraud, abuse, and unauthorized access</li>
            <li>Comply with legal obligations and regulatory requirements</li>
            <li>Conduct security monitoring and incident response</li>
            <li>Enforce our Terms of Service</li>
          </ul>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">3.4 Service Improvement</h3>
          <ul className="text-gray-800 text-lg mb-8 space-y-2">
            <li>Analyze usage patterns and service performance</li>
            <li>Develop new features and improve existing services</li>
            <li>Conduct research and analytics (in aggregated, anonymized form)</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">4. Information Sharing and Disclosure</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">4.1 Service Providers</h3>
          <p className="text-gray-800 mb-2">
            We work with trusted third-party service providers who assist us in operating our platform, including:
          </p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>SMS gateway providers and telecommunications companies</li>
            <li>Payment processors and financial institutions</li>
            <li>Cloud hosting and infrastructure providers</li>
            <li>Customer support and analytics platforms</li>
          </ul>
          <p className="text-gray-800 mb-6">
            These providers are contractually obligated to maintain confidentiality and security of your data.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">4.2 Legal Requirements</h3>
          <p className="text-gray-800 mb-2">
            We may disclose information when required by law, including:
          </p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>Response to legal process or government requests</li>
            <li>Compliance with telecommunications regulations</li>
            <li>Protection of our rights, property, or safety</li>
            <li>Investigation of fraud or security incidents</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">4.3 Business Transfers</h3>
          <p className="text-gray-800 mb-6">
            In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction, subject to the same privacy protections.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">5. Data Retention and Deletion</h2>
          <p className="text-gray-800 mb-2">
            We retain personal information for as long as necessary to provide our services and comply with legal obligations. Specific retention periods include:
          </p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li><strong className="text-black">Account Data:</strong> Retained while your account is active and for 7 years thereafter for tax and regulatory compliance</li>
            <li><strong className="text-black">Message Logs:</strong> Retained for 90 days for delivery verification and support purposes</li>
            <li><strong className="text-black">Billing Records:</strong> Retained for 7 years for financial compliance</li>
            <li><strong className="text-black">Support Communications:</strong> Retained for 2 years to maintain service quality</li>
          </ul>
          <p className="text-gray-800 mb-6">
            You may request deletion of your account and associated data at any time. Some information may be retained in anonymized form for analytics and legal compliance.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">6. International Data Transfers</h2>
          <p className="text-gray-800 mb-2">
            As an East African service provider, your data is primarily stored in secure data centers within Tanzania and Kenya. For global service delivery and backup purposes, data may be transferred to other jurisdictions with appropriate safeguards, including:
          </p>
          <ul className="text-gray-800 mb-6 space-y-1">
            <li>Standard contractual clauses and data processing agreements</li>
            <li>Adequacy decisions by relevant data protection authorities</li>
            <li>Industry-standard encryption and security measures</li>
          </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">7. Your Rights and Choices</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">7.1 Access and Control</h3>
          <p className="text-gray-800 mb-2">
            Depending on your location, you may have the following rights:
          </p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li><strong className="text-black">Access:</strong> Request a copy of your personal information</li>
            <li><strong className="text-black">Correction:</strong> Update or correct inaccurate information</li>
            <li><strong className="text-black">Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
            <li><strong className="text-black">Portability:</strong> Receive your data in a structured, machine-readable format</li>
            <li><strong className="text-black">Restriction:</strong> Limit how we process your information</li>
            <li><strong className="text-black">Objection:</strong> Object to certain types of processing</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">7.2 Marketing Communications</h3>
          <p className="text-gray-800 mb-2">
            You can opt out of marketing communications at any time by:
          </p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>Using the unsubscribe link in our emails</li>
            <li>Contacting our support team</li>
            <li>Updating your preferences in your account settings</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">7.3 Cookies and Tracking</h3>
          <p className="text-gray-800 mb-6">
            You can control cookie preferences through your browser settings. Please note that disabling certain cookies may affect service functionality.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">8. Security Measures</h2>
          <p className="text-gray-800 mb-4">
            We implement comprehensive security measures to protect your information:
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">8.1 Technical Security</h3>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>End-to-end encryption for data in transit and at rest</li>
            <li>Multi-factor authentication for account access</li>
            <li>Regular security audits and penetration testing</li>
            <li>Automated monitoring and threat detection</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">8.2 Organizational Security</h3>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>Employee background checks and security training</li>
            <li>Access controls and role-based permissions</li>
            <li>Incident response and breach notification procedures</li>
            <li>Regular security awareness programs</li>
            </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">8.3 Physical Security</h3>
          <ul className="text-gray-800 mb-6 space-y-1">
            <li>Secure data center facilities with 24/7 monitoring</li>
            <li>Controlled access and surveillance systems</li>
            <li>Backup and disaster recovery systems</li>
            </ul>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">9. Children's Privacy</h2>
          <p className="text-gray-800 mb-6">
            Our services are not intended for children under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete such information.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">10. Third-Party Services</h2>
          <p className="text-gray-800 mb-6">
            Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you use.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">11. SMS-Specific Privacy Considerations</h2>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">11.1 Message Delivery</h3>
          <p className="text-gray-800 mb-4">
            For SMS delivery, we work with licensed telecommunications providers in Tanzania and Kenya. Message content is processed only for routing and delivery purposes and is not stored or analyzed.
          </p>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">11.2 Regulatory Compliance</h3>
          <p className="text-gray-800 mb-2">
            We comply with telecommunications regulations in East Africa, including:
          </p>
          <ul className="text-gray-800 mb-4 space-y-1">
            <li>Tanzania Communications Regulatory Authority (TCRA) requirements</li>
            <li>Communications Authority of Kenya (CA) guidelines</li>
            <li>Anti-spam and consumer protection regulations</li>
            <li>Data protection and privacy laws</li>
          </ul>

          <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">11.3 Opt-Out and Consent</h3>
          <p className="text-gray-800 mb-6">
            We respect recipient preferences and provide opt-out mechanisms. You are responsible for obtaining proper consent for SMS communications in accordance with applicable laws.
          </p>

          <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">12. Changes to This Privacy Policy</h2>
          <p className="text-gray-800 mb-2">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will:
          </p>
          <ul className="text-gray-800 mb-6 space-y-1">
            <li>Post the updated policy on our website</li>
            <li>Update the "Last updated" date at the top of this page</li>
            <li>Send email notifications for material changes</li>
            <li>Provide a summary of key changes</li>
          </ul>

          <h2 className="text-2xl sm:text-3xl font-bold text-black mb-6">13. Contact Information</h2>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">Data Protection Officer</h3>
          <p className="text-gray-800 text-lg mb-6 leading-relaxed">
            Email: support@mifumosms.com<br/>
            Phone: +255 614 459 923<br/>
            Address: Dar es Salaam, Tanzania
          </p>

          <h3 className="text-xl sm:text-2xl font-semibold text-black mb-4">Response Time</h3>
          <p className="text-gray-800 text-lg mb-8 leading-relaxed">
            We will respond to privacy-related inquiries within 30 days. For urgent data protection matters, we aim to respond within 72 hours.
          </p>

          <div className="bg-black/10 rounded-xl p-6 mt-8">
            <p className="text-gray-700 text-center font-medium">
              This privacy policy is designed to comply with Tanzanian and Kenyan data protection laws, including the Data Protection Act 2022 (Tanzania) and the Data Protection Act 2019 (Kenya).
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

export default Privacy;
