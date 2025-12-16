import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  Send,
  TrendingUp,
  Shield,
  Globe,
  Star,
  Check,
  ArrowRight,
  Zap,
  BarChart3,
  Play,
  Sparkles,
  Wifi,
  Network,
  Activity,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const Landing = () => {
  // Force light theme on marketing surfaces
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  // Check if user is authenticated by checking localStorage
  const isAuthenticated = !!localStorage.getItem('access_token');
  const user = null; // We don't need user data on the landing page
  const navigate = useNavigate();
  const [customCredits, setCustomCredits] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState(0);
  const [isPhoneHovered, setIsPhoneHovered] = useState(false);
  const [businessCycleCount, setBusinessCycleCount] = useState(0); // Track cycles for companies with many messages
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Background slides with company colors - Only blue gradient
  const backgroundSlides = [
    {
      gradient: "from-blue-600 via-blue-700 to-blue-800",
      overlay: "from-blue-900/20 via-blue-800/30 to-blue-900/40",
      accent: "blue"
    }
  ];

  // Business profiles with their SMS messages
  const businessProfiles = useMemo(() => [
    {
      name: "Mifumo SMS",
      sender: "Mifumo SMS",
      messages: [
        { text: "MIFUMO SMS: Usikose! Kumbusha wateja wako kuhusu punguzo la mwisho wa mwezi.", time: "1:00 PM" },
        { text: "MIFUMO SMS: Vikumbusho vya oda vimefufua wateja 24 waliokuwa kimya.", time: "2:30 PM" },
        { text: "MIFUMO SMS: Ujumbe wako wa 'Asante Mteja' umetumwa kwa wateja 1,200.", time: "3:10 PM" },
        { text: "MIFUMO SMS: Je, salio limeisha? Ongeza sasa ili kampeni zako ziendelee.", time: "3:40 PM" },
      ]
    },
    {
      name: "QUANTUM",
      sender: "QUANTUM",
      messages: [
        { text: "QUANTUM: Habari! Tunakukumbusha kuwa ofa yako ya mwisho wa mwezi inaisha kesho. Usikose!", time: "10:15 AM" },
        { text: "QUANTUM: Asante kwa kuwa mteja wetu. Tuna furaha kukujulisha kuwa bidhaa mpya zimefika.", time: "11:30 AM" },
        { text: "QUANTUM: Kumbuka! Oda yako ya leo itakuwa tayari kesho asubuhi. Tutakupigia simu.", time: "2:45 PM" },
        { text: "QUANTUM: Tafadhali tujulishe maoni yako kuhusu huduma yetu. Asante!", time: "4:20 PM" },
      ]
    },
    {
      name: "SURAFOFT",
      sender: "SURAFOFT",
      messages: [
        { text: "SURAFOFT: Habari! Kamera yako ya CCTV ya AI imegundua harakati isiyo ya kawaida eneo la kazi. Angalia taarifa hii mara moja.", time: "8:30 AM" },
        { text: "SURAFOFT: Taarifa: Mfumo wako wa usalama umeunganishwa kikamilifu. Kamera zote 12 zinafanya kazi kwa ufanisi.", time: "10:00 AM" },
        { text: "SURAFOFT: Kumbuka: Backup ya video yako ya jana imehifadhiwa kikamilifu. Unaweza kupata kwa mfumo wetu wa wingu.", time: "2:15 PM" },
        { text: "SURAFOFT: Asante kwa kuwa mteja wetu. Tuna teknolojia mpya ya AI inayoweza kutambua watu na magari kwa usahihi zaidi.", time: "4:30 PM" },
        { text: "SURAFOFT: Taarifa: Mfumo wako unahitaji uangalizi wa kila mwezi. Tafadhali panga miadi ya huduma.", time: "5:45 PM" },
      ]
    },
    {
      name: "MFUMO LAB",
      sender: "MFUMO LAB",
      messages: [
        { text: "MFUMO LAB: Habari! Programu yako ya maendeleo imekamilika na tayari kwa kujaribwa. Tafadhali angalia na tujulishe maoni.", time: "9:00 AM" },
        { text: "MFUMO LAB: Kumbuka: Simu yako ya Android ina update mpya inayojumuisha features za ziada. Update sasa!", time: "11:00 AM" },
        { text: "MFUMO LAB: Taarifa: Mfumo wako wa maendeleo ya programu unahitaji backup. Tafadhali fanya backup ya data zako.", time: "1:30 PM" },
        { text: "MFUMO LAB: Asante kwa kuwa mteja wetu. Tuna teknolojia mpya ya maendeleo ya programu za simu na vifaa vya mkononi.", time: "3:00 PM" },
        { text: "MFUMO LAB: Kumbuka: Miadi yako ya msaada wa kiufundi ni kesho. Tafadhali tayarisha maswali yako.", time: "4:00 PM" },
        { text: "MFUMO LAB: Taarifa: Programu yako mpya ya iOS imetengenezwa na tayari kwa kujaribwa. Angalia App Store.", time: "5:30 PM" },
      ]
    }
  ], []);

  // Get current business messages
  const currentBusinessData = businessProfiles[currentBusiness];
  const messages = currentBusinessData.messages.map(msg => ({
    ...msg,
    sender: currentBusinessData.sender,
    type: "sms"
  }));

  // Navigation functions
  const goToPreviousBusiness = () => {
    setCurrentBusiness((prev) => (prev > 0 ? prev - 1 : businessProfiles.length - 1));
  };

  const goToNextBusiness = () => {
    setCurrentBusiness((prev) => (prev < businessProfiles.length - 1 ? prev + 1 : 0));
  };

  // No need to cycle through background slides since we only have blue
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentSlide((prev) => (prev + 1) % backgroundSlides.length);
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [backgroundSlides.length]);

  type Tier = { name: string; min: number; max?: number; rate?: number; note?: string; rangeLabel: string };
  const tiers: Tier[] = useMemo(() => [
    { name: "Lite", min: 1, max: 49999, rate: 18, rangeLabel: "1 to 49,999 SMS" },
    { name: "Standard", min: 50000, max: 149999, rate: 14, rangeLabel: "50,000 to 149,999 SMS" },
    { name: "Pro", min: 250000, rate: 12, rangeLabel: "250,000 SMS and above" },
  ], []);

  const parsedCredits = useMemo(() => Math.max(parseInt(customCredits || "0", 10) || 0, 0), [customCredits]);
  const activeTier = useMemo(() => {
    if (parsedCredits === 0) return null;
    if (parsedCredits < 50000) return tiers[0]; // Lite: 1-49,999
    if (parsedCredits < 250000) return tiers[1]; // Standard: 50,000-149,999
    return tiers[2]; // Pro: 250,000+
  }, [parsedCredits, tiers]);

  const customPrice = useMemo(() => {
    if (!parsedCredits) return 0;
    if (!activeTier) return 0;
    return parsedCredits * (activeTier.rate as number);
  }, [parsedCredits, activeTier]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Sliding Background Component - Light blue gradient like Textmagic
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden bg-blue-grad has-image height-auto main-section has-bg-blue">
        {/* Light blue gradient background - almost white at top, slightly darker blue towards bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-blue-50/80 to-blue-100/60">
          {/* Subtle abstract patterns overlay - positioned on right side like Textmagic */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-full h-full">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="patternGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.08" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.08" />
                  </linearGradient>
                </defs>
                {/* Wavy/fluid patterns - more subtle */}
                <path
                  d="M800,200 Q900,150 1000,200 T1200,200 L1200,800 L800,800 Z"
                  fill="url(#patternGradient)"
                  opacity="0.5"
                />
                <path
                  d="M600,300 Q750,250 900,300 T1200,300 L1200,800 L600,800 Z"
                  fill="url(#patternGradient)"
                  opacity="0.4"
                />
                <path
                  d="M400,400 Q600,300 800,400 T1200,400 L1200,800 L400,800 Z"
                  fill="url(#patternGradient)"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // SMS Animation Component with navigation buttons
  const SMSAnimation = () => {
    return (
      <div className="relative w-full max-w-[260px] mx-auto sm:max-w-[280px] lg:max-w-[300px]">
        {/* Navigation Button - Left */}
        <button
          onClick={goToPreviousBusiness}
          className="absolute -left-4 sm:-left-6 md:-left-8 lg:-left-10 top-1/2 -translate-y-1/2 z-30 bg-blue-600 active:bg-blue-800 lg:hover:bg-blue-700 rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 flex items-center justify-center shadow-lg active:shadow-md lg:hover:shadow-xl transition-all duration-200 active:scale-90 lg:hover:scale-110 touch-manipulation"
          aria-label="Previous company"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
        </button>

        {/* Navigation Button - Right */}
        <button
          onClick={goToNextBusiness}
          className="absolute -right-2 sm:-right-3 md:-right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-30 bg-blue-600 active:bg-blue-800 lg:hover:bg-blue-700 rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 flex items-center justify-center shadow-lg active:shadow-md lg:hover:shadow-xl transition-all duration-200 active:scale-90 lg:hover:scale-110 touch-manipulation"
          aria-label="Next company"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
        </button>

        {/* Phone container - Static, no rotation */}
        <div className="relative w-full h-auto">
          {/* iPhone Frame - Using transparent PNG */}
          <div className="relative w-full h-auto">
            {/* iPhone PNG Background - Transparent frame */}
            <img
              src="/iphone_PNG5735.png"
              alt="iPhone mockup"
              className="w-full h-auto object-contain drop-shadow-2xl pointer-events-none select-none"
              style={{ filter: 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.5))' }}
            />

          {/* Screen mask: Realistic phone screen covering blue background - Proper fit with correct height and width */}
          <div
            className="absolute z-10 overflow-hidden bg-white flex flex-col"
            style={{
              top: '16%',
              left: '15.5%',
              right: '16%',
              bottom: '18.5%',
              borderRadius: '0.6rem',
            }}
          >
            {/* Content wrapper with smooth transition on change */}
            <div key={currentBusiness} className="phone-content-transition w-full h-full flex flex-col">
              {/* Status Bar Area - Matching iPhone style */}
              <div className="flex justify-between items-center px-2.5 pt-0.5 pb-0.5 text-[9px] font-semibold text-black bg-white flex-shrink-0">
                <span>9:41</span>
                <div className="flex items-center gap-0.5">
                  {/* Signal bars */}
                  <div className="flex items-end gap-0.5">
                    <div className="w-0.5 h-1.5 bg-black rounded-sm" />
                    <div className="w-0.5 h-2 bg-black rounded-sm" />
                    <div className="w-0.5 h-2.5 bg-black rounded-sm" />
                    <div className="w-0.5 h-2.5 bg-black rounded-sm" />
                  </div>
                  {/* WiFi */}
                  <div className="w-3 h-2 bg-black rounded-sm ml-0.5" />
                  {/* Battery */}
                  <div className="flex items-center gap-0.5 ml-0.5">
                    <span className="text-[8px] font-medium">100%</span>
                    <div className="w-5 h-2.5 border border-black rounded-sm relative">
                      <div className="w-3.5 h-1.5 bg-black rounded-sm m-0.5" />
                      <div className="absolute -right-0.5 top-0.5 w-0.5 h-1.5 bg-black rounded-r-sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages App Interface */}
              <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                {/* App Header */}
                <div className="bg-white border-b border-gray-200 px-2.5 py-2 flex items-center gap-2 flex-shrink-0">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-semibold text-[10px] truncate">{currentBusinessData.sender}</h3>
                    <p className="text-gray-500 text-[8px]">System Messages</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                </div>

                {/* Messages Area - Show ALL messages at once */}
                <div className="flex-1 p-2 space-y-1.5 overflow-y-auto bg-gray-50 scrollbar-hide">
                  {messages.map((msg, index) => (
                    <div key={index} className="flex justify-start">
                      <div className="max-w-[88%] bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-sm">
                        <p className="text-gray-900 text-[10px] leading-relaxed">{msg.text}</p>
                        <p className="text-gray-400 text-[9px] mt-0.5">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  };
  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp Business",
      description: "Send messages and manage conversations through WhatsApp Business API."
    },
    {
      icon: Send,
      title: "SMS Campaigns",
      description: "Create, schedule, and track bulk SMS campaigns with real-time delivery reports."
    },
    {
      icon: Users,
      title: "Contact Management",
      description: "Import, segment, and organize contacts with advanced filtering and CSV support."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Monitor delivery rates, engagement metrics, and campaign performance with detailed charts."
    },
    {
      icon: Zap,
      title: "Templates & Automation",
      description: "Create message templates and set up automated workflows for customer engagement."
    },
    {
      icon: Globe,
      title: "Multi-language",
      description: "Communicate in English, Kiswahili, French, and Arabic for businesses across Africa."
    }
  ];

  const pricing = [
    {
      name: "Lite",
      rate: "TZS 18/SMS",
      credits: "1 to 49,999 SMS",
      features: [
        "Instant top-up",
        "Basic delivery reports",
        "Email receipt",
      ],
    },
    {
      name: "Standard",
      rate: "TZS 14/SMS",
      credits: "50,000 to 149,999 SMS",
      features: [
        "Priority top-up & support",
        "Advanced delivery analytics",
        "Campaign scheduling",
      ],
      popular: true,
    },
    {
      name: "Pro",
      rate: "TZS 12/SMS",
      credits: "250,000 SMS and above",
      features: [
        "Bulk campaign tools",
        "Advanced analytics",
        "API access",
      ],
    }
  ];

  // Testimonials section removed

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Custom CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes smoothContentFade {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .phone-content-transition {
            animation: smoothContentFade 0.4s ease-out;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .touch-manipulation {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          .bg-blue-grad.has-image.height-auto.main-section.has-bg-blue {
            height: 100vh;
            min-height: 100vh;
          }
          /* Mobile viewport optimization */
          @media (max-width: 640px) {
            #about {
              min-height: 100vh;
              min-height: 100dvh; /* Dynamic viewport height for mobile */
              padding-top: env(safe-area-inset-top, 0.5rem);
              padding-bottom: env(safe-area-inset-bottom, 0.75rem);
            }
          }
        `
      }} />

      {/* Sliding Background */}
      <SlidingBackground />

      {/* Header */}
      <header className="relative z-10 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-gray-900">
                Mifumo SMS
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-2 lg:gap-4">
              <div className="hidden sm:flex items-center gap-2 lg:gap-4">
                <Link to="/login">
                  <Button variant="ghost" className="text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3 text-gray-700 hover:bg-gray-100 transition-all duration-300">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" className="text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-300 shadow-lg hover:shadow-xl">
                    Get Started
                  </Button>
                </Link>
              </div>
              <Button
                variant="outline"
                className="sm:hidden h-9 w-9 px-0 border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="sm:hidden mt-3 rounded-xl border border-gray-200 bg-white shadow-lg p-4 space-y-3 text-sm text-gray-800">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-sm">
                  Login
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full justify-center text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md">
                  Get Started
                </Button>
              </Link>
              <div className="flex flex-col gap-1">
                <a href="tel:+255742123456" className="font-semibold text-blue-600">
                  +255 742 123 456
                </a>
                <p className="text-xs text-gray-500">Call us Mon-Fri, 9am-6pm</p>
              </div>
              <a href="https://wa.me/255742123456" target="_blank" rel="noreferrer" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center gap-2 border-green-500 text-green-600 hover:bg-green-50">
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - Full Viewport */}
      <section id="about" className="min-h-screen flex flex-col justify-center items-center px-3 sm:px-4 md:px-5 lg:px-6 relative pt-2 pb-3 sm:pt-4 sm:pb-4 md:pt-8 md:pb-6 lg:pt-12 lg:pb-8 z-10">
        <div className="max-w-7xl mx-auto w-full relative">
          {/* Content - Centered like Textmagic */}
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Text Content - Centered */}
            <div className="text-center w-full space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 max-w-4xl mx-auto">
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <h1 className="font-heading text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  Getting customers is cheap.
                  <br />
                  <span className="text-blue-600">Churn isn&apos;t</span>
                </h1>
                <p className="text-center text-sm sm:text-base md:text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed font-normal">
                  Customer communications platform that combines the best of AI and human support, so you can treat every customer like a VIP. Drives replies, repeat purchases, and tracks every conversation back to revenue.
                </p>
              </div>

              <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 justify-center pt-2">
                <Link to="/signup">
                  <Button
                    className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-4 sm:px-6 md:px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    Try now for free
                  </Button>
                </Link>
                <a href="#pricing">
                  <Button
                    variant="outline"
                    className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-4 sm:px-6 md:px-8 border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    View pricing
                  </Button>
                </a>
              </div>

              {/* Supporting Text */}
              <p className="text-center text-xs sm:text-sm text-gray-500 pt-1" id="credit-text">
                No credit card required • Get free credit for testing
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 pt-4 sm:pt-6 md:pt-8">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">50+</div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-600 leading-tight mt-1">Active Businesses</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">1M+</div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-600 leading-tight mt-1">Messages Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">98%</div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-600 leading-tight mt-1">Delivery Rate</div>
                </div>
              </div>

              {/* Device Mockups Container - Positioned directly below stats, arranged straight beside each other */}
              <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 pt-0 w-full hidden lg:flex">
                {/* Mobile Phone with Mobile Cover Image */}
                <div className="relative w-[450px] sm:w-[500px] md:w-[550px] lg:w-[600px] h-auto opacity-95">
                  {/* Mobile Cover Image - Behind the mockup, visible through screen */}
                  <div
                    className="absolute z-0 overflow-hidden"
                    style={{
                      top: '7%',
                      left: '20%',
                      right: '18%',
                      bottom: '7%',
                      borderRadius: '0.8rem',
                    }}
                  >
                    <img
                      src="/mobile cover.png"
                      alt="Mobile app screen"
                      className="w-full h-full"
                      style={{
                        borderRadius: '0.8rem',
                        objectFit: 'cover',
                        objectPosition: 'top',
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        imageRendering: 'crisp-edges',
                      }}
                    />
                  </div>
                  {/* Mobile Mockup Frame - On top of the cover */}
                  <img
                    src="/mobile 1.webp"
                    alt="Mobile mockup"
                    className="relative z-10 w-full h-auto object-contain"
                    style={{
                      filter: 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.2))',
                    }}
                  />
                </div>

                {/* Desktop Monitor with Desktop Cover Image - Largest mockup */}
                <div className="relative w-[1100px] sm:w-[1200px] md:w-[1300px] lg:w-[1400px] xl:w-[1500px] h-auto opacity-95">
                  {/* Desktop Cover Image - Behind the mockup, visible through screen */}
                  <div
                    className="absolute z-0 overflow-hidden"
                    style={{
                      top: '17%',
                      left: '6.7%',
                      right: '6.7%',
                      bottom: '10%',
                      borderRadius: '0.5rem',
                    }}
                  >
                    <img
                      src="/desktop cover.png"
                      alt="Desktop app screen"
                      className="w-full h-full"
                      style={{
                        borderRadius: '0.5rem',
                        objectFit: 'contain',
                        objectPosition: 'top center',
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        imageRendering: 'crisp-edges',
                      }}
                    />
                  </div>
                  {/* Desktop Mockup Frame - On top of the cover */}
                  <img
                    src="/desktop.png"
                    alt="Desktop mockup"
                    className="relative z-10 w-full h-auto object-contain"
                    style={{
                      filter: 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.2))',
                    }}
                  />
                </div>

                {/* iPhone with SMS Content */}
                <div className="relative w-[450px] sm:w-[500px] md:w-[550px] lg:w-[600px] h-auto opacity-95">
                  <img
                    src="/iphone_PNG5735.png"
                    alt="iPhone mockup"
                    className="w-full h-auto object-contain"
                    style={{
                      filter: 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.2))',
                    }}
                  />
                  {/* SMS Content Overlay for iPhone */}
                  <div
                    className="absolute z-10 overflow-hidden bg-white flex flex-col"
                    style={{
                      top: '16%',
                      left: '15.5%',
                      right: '16%',
                      bottom: '18.5%',
                      borderRadius: '0.6rem',
                    }}
                  >
                    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                      <div className="bg-white border-b border-gray-200 px-2 py-1.5 flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare className="w-2 h-2 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-gray-900 font-semibold text-[8px] truncate">{currentBusinessData.sender}</h3>
                        </div>
                      </div>
                      <div className="flex-1 p-1.5 space-y-1 overflow-y-auto bg-gray-50">
                        {currentBusinessData.messages.slice(0, 3).map((msg, index) => (
                          <div key={index} className="flex justify-start">
                            <div className="max-w-[88%] bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
                              <p className="text-gray-900 text-[8px] leading-tight">{msg.text}</p>
                              <p className="text-gray-400 text-[7px] mt-0.5">{msg.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SMS Animation - Visible on mobile, hidden on desktop where we show device mockups */}
            <div className="flex justify-center lg:hidden order-2 mt-4 sm:mt-6 md:mt-8 w-full">
              <div className="animate-fade-in-right scale-[0.8] sm:scale-[0.9] md:scale-100 relative z-10 w-full max-w-[300px] sm:max-w-[340px] md:max-w-[380px]">
                <SMSAnimation />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative bg-gray-50">
        {/* Mobile block (unchanged) */}
        <div className="max-w-6xl mx-auto border-2 border-gray-200 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-yellow-50 shadow-sm px-4 py-5 sm:hidden">
          <div className="text-left mb-8">
            <h2 className="font-heading text-xl font-bold text-gray-900 mb-2 leading-tight">
              Everything you need to
              <span className="block text-blue-500">
                manage customer communications
              </span>
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-3xl">
              Powerful features designed for African businesses to scale their customer communication
            </p>
          </div>
          <div className="space-y-8">
            {features.map((feature, index) => {
              const colorSchemes = [
                { bg: 'bg-white', border: 'border-gray-300', icon: 'text-gray-700', title: 'text-gray-800' },
                { bg: 'bg-blue-50', border: 'border-blue-300', icon: 'text-blue-600', title: 'text-blue-700' },
                { bg: 'bg-red-50', border: 'border-red-300', icon: 'text-red-600', title: 'text-red-700' },
                { bg: 'bg-green-50', border: 'border-green-300', icon: 'text-green-600', title: 'text-green-700' },
              ];
              const colors = colorSchemes[index % colorSchemes.length];
              const isEven = index % 2 === 0;
              return (
                <div key={index} className={`flex items-start gap-4 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`flex-shrink-0 w-24 h-24 rounded-lg border-2 ${colors.bg} ${colors.border} flex flex-col items-center justify-center shadow-sm`}>
                    <feature.icon className={`w-8 h-8 mb-2 ${colors.icon}`} />
                    <h3 className={`font-bold text-xs text-center leading-tight px-1 ${colors.title}`}>
                      {feature.title}
                    </h3>
                  </div>
                  <div className="flex-1 pt-3">
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop block matching reference image */}
        <div className="hidden sm:block">
          <div className="max-w-7xl mx-auto px-2 lg:px-0">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-14">
              <div className="flex-1 max-w-xl text-left">
                <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  Everything you need to
                  <span className="block text-blue-500">
                    manage customer communications
                  </span>
                </h2>
                <p className="mt-4 text-base md:text-lg text-gray-600 leading-relaxed">
                  Powerful features designed for African businesses to scale their customer communication
                </p>
              </div>

              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                  {features.map((feature, index) => (
                    <Card
                      key={index}
                      className="group relative bg-white border border-gray-100 shadow-md lg:shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.02] rounded-2xl overflow-hidden"
                      style={{
                        animationDelay: `${index * 150}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardContent className="relative p-6 lg:p-7 flex flex-col h-full min-h-[160px] lg:min-h-[180px]">
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:rotate-2 transition-all duration-300">
                          <feature.icon className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-heading text-sm lg:text-base font-bold text-blue-500 mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-xs lg:text-sm text-gray-600 leading-relaxed flex-1">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

      {/* Pricing */}
      <section id="pricing" className="pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-28 lg:pb-24 px-3 sm:px-4 lg:px-6 relative bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">

            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {/* Simple, transparent */}
              <span className="block bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                Pricing packages
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {pricing.map((plan, index) => (
              <div key={index} className="relative group">
                {plan.popular && (
                  <div className="absolute -top-6 sm:-top-7 lg:-top-8 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="px-3 py-1.5 sm:px-4 sm:py-2 lg:px-6 lg:py-2.5 text-xs sm:text-sm font-bold bg-yellow-400 text-black shadow-lg group-hover:scale-110 group-hover:shadow-xl group-hover:border-yellow-400 transition-all duration-300 rounded-full border-2 border-yellow-300">
                    Most Popular
                  </Badge>
                  </div>
                )}
                <Card
                  className={`relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 transition-all duration-500 hover:-translate-y-2 hover:scale-105 cursor-pointer ${
                    plan.popular
                      ? 'shadow-xl ring-2 ring-yellow-500/20 scale-105 hover:ring-yellow-500/30 hover:shadow-2xl'
                      : 'shadow-md hover:shadow-xl'
                  }`}
                  style={{
                    animationDelay: `${index * 150}ms`
                  }}
                >

                <div className={`absolute inset-0 bg-gradient-to-br ${
                  plan.popular
                    ? 'from-yellow-500/10 via-transparent to-blue-500/10'
                    : 'from-blue-500/5 via-transparent to-yellow-500/5'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <CardContent className="relative p-4 sm:p-6 lg:p-8">
                  <div className="text-center mb-6">
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {plan.name}
                  </h3>
                    <div className="mb-2">
                      <span className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {plan.rate}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {plan.credits}
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        <span className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/signup">
                    <Button
                      className={`w-full text-xs sm:text-sm h-8 sm:h-10 font-bold transition-all duration-300 group-hover:scale-105 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg hover:shadow-yellow-500/25'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </Link>
                </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Amount Calculator (public view) */}
      <section className="py-12 sm:py-16 px-3 sm:px-4 lg:px-6 relative bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">

            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {/* Calculate Your */}
              <span className="block bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent">
                Pricing Calculator
              </span>
            </h3>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Enter your desired SMS credits to see the exact pricing based on our tiered structure
            </p>
          </div>

          <Card className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Number of SMS Credits
                  </Label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                    className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                  min="100"
                />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Total Cost
                  </Label>
                  <div className="h-12 px-4 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">TZS {customPrice.toLocaleString()}</span>
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                      {activeTier?.name || 'Select amount'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-yellow-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Pricing Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Tier:</span>
                      <span className="font-semibold text-gray-900">
                        {activeTier ? activeTier.name : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rate per SMS:</span>
                      <span className="font-semibold text-gray-900">
                        {activeTier ? `TZS ${activeTier.rate}/SMS` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SMS Range:</span>
                      <span className="font-semibold text-gray-900">
                        {activeTier ? activeTier.rangeLabel : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-yellow-800">Minimum Purchase</p>
                      <p className="text-xs text-yellow-700">100 SMS credits required</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {parsedCredits > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-gray-600">Ready to get started?</p>
                    <p className="text-xs text-gray-500">Purchase {parsedCredits.toLocaleString()} SMS credits</p>
                  </div>
                  <Link to="/signup">
                    <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-2 h-10 transition-all duration-300 hover:scale-105">
                      Buy Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
            </div>
            )}
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6 relative bg-gradient-to-br from-blue-50 via-white to-yellow-50 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300/25 rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-blue-200/25 rounded-full animate-bounce" />
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-200/30 rounded-lg rotate-45 animate-ping" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">

          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Ready to transform your
            <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              customer communication?
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 max-w-2xl mx-auto leading-relaxed">
            Join thousands of African businesses already using Mifumo SMS
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Link to="/signup">
              <Button
                size="lg"
                className="text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 group"
              >
              Get Started
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            {/* <Button
              size="hero"
              variant="outline"
              className="text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-105"
            >
              Contact Sales
            </Button> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-border-subtle py-4 sm:py-6 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Brand */}
            <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-foreground">
                  Mifumo SMS
                </span>
              </div>

            {/* Nav */}
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-foreground/80">
              <a className="hover:underline" href="#about">About</a>
              <a className="hover:underline" href="#features">Features</a>
              <a className="hover:underline" href="#pricing">Pricing</a>
            </nav>

            {/* Contact */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-foreground/80">+255 614 459 923</span>
              <a
                href="https://wa.me/255614459923"
                target="_blank"
                rel="noreferrer"
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 text-xs sm:text-sm"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="border-t border-border-subtle mt-3 sm:mt-4 pt-3 sm:pt-4 text-center text-text-subtle">
            <p className="text-xs sm:text-sm">&copy; 2025 Mifumo SMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
