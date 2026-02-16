import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/utils/logger";
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
import MobileMenu from "@/components/layout/MobileMenu";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import { getImageSrc, encodeImagePath } from "@/utils/imageFallback";
import { useStaggeredReveal, useScrollReveal } from "@/hooks/useScrollReveal";
import { useScroll, useTransform, motion, MotionValue } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Landing = () => {
  // Force light theme on marketing surfaces
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'light');
  }, []);
const [showVideoModal, setShowVideoModal] = useState(false);
  // Preload critical images to ensure they're available
  useEffect(() => {
    const imageUrls = [
      encodeImagePath('/mobile cover.png'),
      getImageSrc('/mobile1.webp', '/mobile2.png'),
      encodeImagePath('/desktop cover.png'),
      encodeImagePath('/desktop.png'),
      encodeImagePath('/iphone_PNG5735.png')
    ];

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        logger.debug('Image preloaded');
      };
      img.onerror = () => {
        logger.warn('Image preload failed');
      };
    });
  }, []);

  // Check if user is authenticated by checking localStorage
  const isAuthenticated = !!localStorage.getItem('access_token');
  const user = null; // We don't need user data on the landing page

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
  const [customCredits, setCustomCredits] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState(0);
  const [isPhoneHovered, setIsPhoneHovered] = useState(false);
  const [businessCycleCount, setBusinessCycleCount] = useState(0); // Track cycles for companies with many messages
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Scroll-based animations for the desktop section
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobileDevice ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 0.3], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], scaleDimensions());

  // Handle cross-page navigation with scroll parameters or hash
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const scrollTo = searchParams.get('scroll') || location.hash.substring(1); // Remove # from hash

    if (scrollTo) {
      // Quick delay to ensure the page has loaded
      setTimeout(() => {
        scrollToSection(scrollTo);
        // Clean up the URL by removing the scroll parameter and hash
        window.history.replaceState({}, '', location.pathname);
      }, 50);
    }
  }, [location.search, location.hash, location.pathname]);

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

  // Handle scroll-based header color change with performance optimization
  useEffect(() => {
    let ticking = false;
    let cachedHeroBottom = 0;

    const cacheHeroBottom = () => {
      const heroSection = document.getElementById('about');
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

  // Hero Background Component - Using home background image
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/home background12.jpg"
            alt="Hero background"
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      </div>
    );
  };

  // SMS Animation Component
  const SMSAnimation = () => {
    return (
      <div className="relative w-full max-w-[400px] mx-auto sm:max-w-[450px] md:max-w-[500px] lg:max-w-[550px]">
        {/* Phone container - Static, no rotation */}
        <div className="relative w-full h-auto">
          {/* iPhone Frame - Using transparent PNG */}
          <div className="relative w-full h-auto">
            {/* iPhone PNG Background - Transparent frame */}
            <img
              src={encodeImagePath('/iphone_PNG5735.png')}
              alt="iPhone mockup"
              className="w-full h-auto object-contain drop-shadow-2xl pointer-events-none select-none"
              loading="eager"
              onError={(e) => {
                logger.warn('iPhone mockup image failed to load');
                e.currentTarget.style.display = 'none';
              }}
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
            {/* Content wrapper - Static frame, no animation */}
            <div className="w-full h-full flex flex-col">
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
                    <h3 key={currentBusiness} className="text-gray-900 font-semibold text-[10px] truncate phone-content-transition">{currentBusinessData.sender}</h3>
                    <p className="text-gray-500 text-[8px]">System Messages</p>
                  </div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
                </div>

                {/* Messages Area - Show ALL messages at once - Only this content changes */}
                <div key={currentBusiness} className="flex-1 p-2 space-y-1.5 overflow-y-auto bg-gray-50 scrollbar-hide phone-content-transition">
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

  // ContainerScroll Component with motion animations
  const ContainerScroll = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {
    const translate = useTransform(scrollYProgress, [0, 1], [50, -50]);

    return (
        <div
          className="h-[30rem] md:h-[40rem] w-full flex items-center justify-center relative"
          ref={containerRef}
        >
        <div
          className="w-full relative"
          style={{
            perspective: "1000px",
          }}
        >
          <MotionCard rotate={rotate} scale={scale}>
            {/* Invisible content to maintain container dimensions */}
            <div className="invisible w-full h-full">
              {children}
            </div>
            {children}
          </MotionCard>
        </div>
      </div>
    );
  };


  const MotionCard = ({
    rotate,
    scale,
    children,
  }: {
    rotate: MotionValue<number>;
    scale: MotionValue<number>;
    children: React.ReactNode;
  }) => {
    return (
      <motion.div
        style={{
          rotateX: rotate,
          scale,
          boxShadow:
            "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
        }}
        className="w-[48rem] max-w-3xl mt-8 mx-auto h-[25rem] md:h-[35rem] border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
      >
        <div className=" h-full w-full  overflow-hidden rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl md:p-2 ">
          {children}
        </div>
      </motion.div>
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

  // Scroll reveal animations
  const featuresReveal = useStaggeredReveal(features.length, 150);
  const pricingReveal = useStaggeredReveal(pricing.length, 200);
  const heroStatsReveal = useStaggeredReveal(3, 200); // 3 stats cards
  const ctaReveal = useScrollReveal({ threshold: 0.2 });

  // Testimonials section removed

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Custom CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Modern Scroll Reveal Animations */
          @keyframes slideInFromBottom {
            0% {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes slideInFromLeft {
            0% {
              opacity: 0;
              transform: translateX(-30px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }

          @keyframes slideInFromRight {
            0% {
              opacity: 0;
              transform: translateX(30px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }

          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes scaleIn {
            0% {
              opacity: 0;
              transform: scale(0.8);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          /* Animation classes */
          .animate-slide-in-bottom {
            animation: slideInFromBottom 0.8s ease-out forwards;
          }

          .animate-slide-in-left {
            animation: slideInFromLeft 0.8s ease-out forwards;
          }

          .animate-slide-in-right {
            animation: slideInFromRight 0.8s ease-out forwards;
          }

          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
          }

          .animate-scale-in {
            animation: scaleIn 0.5s ease-out forwards;
          }

          .animate-bounce-in {
            animation: bounceIn 0.8s ease-out forwards;
          }

          /* Staggered animation delays */
          .animate-delay-100 { animation-delay: 100ms; }
          .animate-delay-200 { animation-delay: 200ms; }
          .animate-delay-300 { animation-delay: 300ms; }
          .animate-delay-400 { animation-delay: 400ms; }
          .animate-delay-500 { animation-delay: 500ms; }
          .animate-delay-600 { animation-delay: 600ms; }
          .animate-delay-700 { animation-delay: 700ms; }
          .animate-delay-800 { animation-delay: 800ms; }

          /* Initial hidden state */
          .reveal-hidden {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
            transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .reveal-visible {
            opacity: 1;
            transform: translateY(0) scale(1);
          }

          /* Smooth content transitions */
          @keyframes smoothContentFade {
            0% {
              opacity: 0;
            }
            100% {
              opacity: 1;
            }
          }
          .phone-content-transition {
            animation: smoothContentFade 0.3s ease-in-out;
          }

          /* Scrollbar and touch utilities */
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

          /* Background utilities */
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

          /* Prevent horizontal scrolling */
          body, html {
            overflow-x: hidden;
            max-width: 100%;
          }

          /* Responsive animation adjustments */
          @media (prefers-reduced-motion: reduce) {
            .animate-slide-in-bottom,
            .animate-slide-in-left,
            .animate-slide-in-right,
            .animate-fade-in-up,
            .animate-scale-in,
            .animate-bounce-in {
              animation: none;
              opacity: 1;
              transform: none;
            }

            .reveal-hidden {
              opacity: 1;
              transform: none;
              transition: none;
            }
          }
        `
      }} />

      {/* Sliding Background */}
      <SlidingBackground />

      {/* Header */}
      <header className="fixed top-0 left-0 z-[50] w-full bg-transparent py-4 backdrop-blur-xl">
        <section className="px-0 pl-6 sm:pl-8 md:pl-12 lg:pl-20 flex items-center justify-between max-w-full pr-4 sm:pr-6 md:pr-8 lg:pr-12">

          {/* Logo */}
          <div onClick={() => scrollToSection('about')} className="flex items-center justify-start cursor-pointer">
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
            <button onClick={() => scrollToSection('features')} className={`transition-colors duration-300 cursor-pointer flex items-center gap-2 ${
              isScrolled
                ? 'text-gray-900 hover:text-gray-700'
                : 'text-white hover:text-gray-200'
            }`}>
              Features
            </button>
            <button onClick={() => scrollToSection('pricing')} className={`transition-colors duration-300 cursor-pointer flex items-center gap-2 ${
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
          <div className="hidden lg:flex items-center gap-4 justify-end">
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

      {/* Mobile Menu - Half page overlay */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        scrollToSection={scrollToSection}
      />

      {/* Hero Section - Full Viewport */}
      <section id="about" className="min-h-screen flex flex-col justify-center px-0 relative pt-20 pb-3 sm:pt-24 sm:pb-4 md:pt-28 md:pb-6 lg:pt-32 lg:pb-8 z-10">
        <div className="w-full relative max-w-full pl-6 sm:pl-8 md:pl-12 lg:pl-20">
          {/* Content - Two column layout on desktop */}
          <div className="relative z-10 w-full flex flex-col lg:flex-row items-center lg:items-start lg:justify-between gap-8 lg:gap-12">
            {/* Text Content - Left side on desktop, centered on mobile */}
            <div className="lg:text-left w-full lg:w-1/2 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 lg:max-w-none mt-24 sm:mt-0 px-0 text-left pr-4 sm:pr-6 md:pr-8 lg:pr-12">
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <h1 className="font-heading lg:text-left text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight text-left">
                  Getting customers is cheap.
                  <br />
                  <span className="text-blue-200">Churn isn&apos;t</span>
              </h1>
                <p className="lg:text-left text-sm sm:text-base md:text-lg text-gray-100 max-w-3xl lg:max-w-none leading-relaxed font-normal text-left">
                Customer communications platform that combines the best of AI and human support, so you can treat every customer like a VIP. Drives replies, repeat purchases, and tracks every conversation back to revenue.
              </p>
            </div>

            <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 lg:justify-start pt-2 w-full lg:w-auto justify-start pr-4 sm:pr-6 md:pr-8 lg:pr-12">
  <Link
    to="/signup">
    <Button
      variant="outline"
      className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-4 sm:px-6 md:px-8 border-2 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
    >
      Start Free
    </Button>
  </Link>

  {/* View Tutorial Button - Blue */}
  <Button
    onClick={() => setShowVideoModal(true)}
    className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2"
  >
    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
    How to Use.
  </Button>
</div>

            {/* Stats - Below buttons in the left column */}
            <div ref={heroStatsReveal.containerRef} className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 pt-8 lg:pt-12 w-full justify-start pr-4 sm:pr-6 md:pr-8 lg:pr-12">
                <div className={`text-left ${heroStatsReveal.isVisible ? 'animate-bounce-in' : 'reveal-hidden'}`} style={{ animationDelay: heroStatsReveal.isVisible ? '0ms' : '0ms' }}>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">50+</div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-200 leading-tight mt-1">Active Businesses</div>
                </div>
                <div className={`text-left ${heroStatsReveal.isVisible ? 'animate-bounce-in' : 'reveal-hidden'}`} style={{ animationDelay: heroStatsReveal.isVisible ? '200ms' : '0ms' }}>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">1M+</div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-200 leading-tight mt-1">Messages Sent</div>
                </div>
                <div className={`text-left ${heroStatsReveal.isVisible ? 'animate-bounce-in' : 'reveal-hidden'}`} style={{ animationDelay: heroStatsReveal.isVisible ? '400ms' : '0ms' }}>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white">98%</div>
                  <div className="text-xs sm:text-sm md:text-base text-gray-200 leading-tight mt-1">Delivery Rate</div>
                </div>
              </div>

            </div>

            {/* Hero Banner - Absolutely positioned on right side for desktop */}
            <div className="hidden lg:block absolute top-1/2 right-8 transform -translate-y-1/2 z-10">
              <img
                src="/hero-section-banner.svg"
                alt="Hero banner"
                className="w-99 h-auto object-contain opacity-50"
              />
            </div>

            {/* SMS Animation - Visible on mobile, hidden on desktop where we show device mockups */}
            <div className="flex justify-center lg:hidden order-2 -mt-4 sm:-mt-6 md:-mt-8 w-full overflow-x-hidden relative">
              {/* Navigation Button - Left */}
              <button
                onClick={goToPreviousBusiness}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-blue-600 active:bg-blue-800 lg:hover:bg-blue-700 rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 flex items-center justify-center shadow-lg active:shadow-md lg:hover:shadow-xl transition-all duration-200 active:scale-90 lg:hover:scale-110 touch-manipulation"
                aria-label="Previous company"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
              </button>

              {/* Navigation Button - Right */}
              <button
                onClick={goToNextBusiness}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-blue-600 active:bg-blue-800 lg:hover:bg-blue-700 rounded-full w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 flex items-center justify-center shadow-lg active:shadow-md lg:hover:shadow-xl transition-all duration-200 active:scale-90 lg:hover:scale-110 touch-manipulation"
                aria-label="Next company"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
              </button>

              <div className="animate-fade-in-right scale-[0.8] sm:scale-[0.9] md:scale-100 relative z-10 w-full max-w-[480px] sm:max-w-[540px] md:max-w-[600px] overflow-x-hidden">
              <SMSAnimation />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: ContainerScroll with mobile and iPhone mockups positioned beside */}
        <div className="hidden lg:block mt-8 lg:mt-12">
          <div className="relative w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-0 lg:gap-0">
              {/* Mobile Phone Mockup - Left Side */}
              <motion.div
                style={{
                  rotateX: rotate,
                  scale,
                }}
                className="relative w-[300px] lg:w-[350px] xl:w-[400px] h-auto opacity-100 flex-shrink-0 -mr-24 lg:-mr-32 -mt-4 lg:-mt-6 self-start"
              >
                {/* Mobile Cover Image - Behind the mockup, visible through screen */}
                <div
                  className="absolute z-[1] overflow-hidden"
                  style={{
                    top: '7%',
                    left: '20%',
                    right: '20%',
                    bottom: '7%',
                    borderRadius: '0.8rem',
                    zIndex: 1,
                  }}
                >
                  <img
                    src={encodeImagePath('/mobile cover.png')}
                    alt="Mobile app screen"
                    className="w-full h-full"
                    loading="eager"
                    onError={(e) => {
                      logger.warn('Mobile cover image failed to load');
                      e.currentTarget.style.display = 'none';
                    }}
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
                  src={getImageSrc('/mobile1.webp', '/mobile2.png')}
                  alt="Mobile mockup"
                  className="relative z-[2] w-full h-auto object-contain object-left"
                  loading="eager"
                  onError={(e) => {
                    logger.warn('Mobile mockup image failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                  style={{
                    filter: 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.2))',
                    zIndex: 2,
                    position: 'relative',
                  }}
                />
              </motion.div>

              {/* ContainerScroll Motion Card - Center */}
              <div className="flex-shrink-0">
                <ContainerScroll>
            {/* Desktop Cover Image inside the motion card */}
            <div
              className="absolute inset-2 z-[1] overflow-hidden"
              style={{
                borderRadius: '0.8rem',
                zIndex: 1,
              }}
            >
              <img
                src={encodeImagePath('/desktop cover.png')}
                alt="Desktop app interface"
                className="w-full h-full object-cover object-left"
                loading="eager"
                onError={(e) => {
                  logger.warn('Desktop cover image failed to load');
                  e.currentTarget.style.display = 'none';
                }}
                style={{
                  borderRadius: '0.8rem',
                }}
              />
            </div>
                </ContainerScroll>
              </div>

              {/* iPhone Mockup - Right Side */}
              <motion.div
                style={{
                  rotateX: rotate,
                  scale,
                }}
                className="relative w-[250px] lg:w-[300px] xl:w-[350px] h-auto opacity-100 flex-shrink-0 -ml-24 lg:-ml-32"
              >
                <img
                  src={encodeImagePath('/iphone_PNG5735.png')}
                  alt="iPhone mockup"
                  className="w-full h-auto object-contain relative z-[1]"
                  loading="eager"
                  onError={(e) => {
                    logger.warn('iPhone mockup image failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                  style={{
                    filter: 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.2))',
                    zIndex: 1,
                    position: 'relative',
                  }}
                />
                {/* SMS Content Overlay for iPhone */}
                <div
                  className="absolute z-[2] overflow-hidden bg-white flex flex-col"
                  style={{
                    top: '16%',
                    left: '15.5%',
                    right: '16%',
                    bottom: '18.5%',
                    borderRadius: '0.6rem',
                    zIndex: 2,
                  }}
                >
                  <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                    <div className="bg-white border-b border-gray-200 px-1 py-0.5 flex items-center gap-0.5 flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-1.5 h-1.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 font-semibold text-[10px] truncate">{currentBusinessData.sender}</h3>
                      </div>
                    </div>
                    <div className="flex-1 p-0.5 space-y-0.5 overflow-y-auto bg-gray-50">
                      {currentBusinessData.messages.slice(0, 2).map((msg, index) => (
                        <div key={index} className="flex justify-start">
                          <div className="max-w-[88%] bg-white border border-gray-200 rounded px-0.5 py-0.5 shadow-sm">
                            <p className="text-gray-900 text-[10px] leading-tight">{msg.text}</p>
                            <p className="text-gray-400 text-[8px] mt-0.5">{msg.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 relative bg-gray-50 shadow-lg border-t border-gray-200">
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
              <div
                ref={featuresReveal.containerRef}
                className={`flex-1 max-w-xl text-left transition-all duration-800 ${
                  featuresReveal.isVisible
                    ? 'animate-slide-in-left'
                    : 'opacity-0 translate-x-[-30px] scale-95'
                }`}
              >
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
                      className={`group relative bg-white border border-gray-100 shadow-md lg:shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.02] rounded-2xl overflow-hidden ${
                        featuresReveal.isVisible
                          ? 'animate-slide-in-bottom'
                          : 'reveal-hidden'
                      }`}
                      style={{
                        animationDelay: featuresReveal.isVisible ? `${index * 150}ms` : '0ms',
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
      <section id="pricing" className="pt-20 pb-16 sm:pt-24 sm:pb-20 lg:pt-28 lg:pb-24 px-3 sm:px-4 lg:px-6 relative bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">

            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {/* Simple, transparent */}
              <span className="block text-blue-600">
                Pricing packages
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div ref={pricingReveal.containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {pricing.map((plan, index) => (
              <div key={index} className={`relative group ${
                pricingReveal.isVisible
                  ? 'animate-scale-in'
                  : 'reveal-hidden'
              }`} style={{
                animationDelay: pricingReveal.isVisible ? `${index * 200}ms` : '0ms',
                animationFillMode: 'both'
              }}>
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
      <section className="py-12 sm:py-16 px-3 sm:px-4 lg:px-6 relative bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">

            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {/* Calculate Your */}
              <span className="block text-blue-600">
                Pricing Calculator
              </span>
            </h3>
            <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
              Enter your desired SMS credits to see the exact pricing based on our tiered structure
            </p>
          </div>

          <Card className="p-6 sm:p-8 bg-gradient-to-br from-blue-50/50 to-white border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-300">
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
                    className="h-12 text-base border-2 border-blue-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-blue-50/30 transition-all duration-300"
                  min="100"
                />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Total Cost
                  </Label>
                  <div className="h-12 px-4 rounded-lg bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-900">TZS {customPrice.toLocaleString()}</span>
                    <div className="text-xs text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                      {activeTier?.name || 'Select amount'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-4 rounded-lg border-2 border-blue-300">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Pricing Details
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Active Tier:</span>
                      <span className="font-semibold text-blue-900">
                        {activeTier ? activeTier.name : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Rate per SMS:</span>
                      <span className="font-semibold text-blue-900">
                        {activeTier ? `TZS ${activeTier.rate}/SMS` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">SMS Range:</span>
                      <span className="font-semibold text-blue-900">
                        {activeTier ? activeTier.rangeLabel : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-800">Minimum Purchase</p>
                      <p className="text-xs text-red-700">100 SMS credits required</p>
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
      <section id="contact" className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6 relative bg-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-300/25 rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-blue-200/25 rounded-full animate-bounce" />
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-blue-100/30 rounded-lg rotate-45 animate-ping" />
        </div>

        <div ref={ctaReveal.elementRef} className="max-w-3xl mx-auto text-center relative z-10">

          <h2 className={`font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight transition-all duration-800 ${
            ctaReveal.isVisible
              ? 'animate-fade-in-up'
              : 'opacity-0 translate-y-4'
          }`}>
            Ready to transform your
            <span className="block text-blue-600">
              customer communication?
            </span>
          </h2>
          <p className={`text-sm sm:text-base md:text-lg text-gray-700 mb-6 max-w-2xl mx-auto leading-relaxed transition-all duration-800 delay-200 ${
            ctaReveal.isVisible
              ? 'animate-fade-in-up'
              : 'opacity-0 translate-y-4'
          }`} style={{ animationDelay: ctaReveal.isVisible ? '200ms' : '0ms' }}>
            Join thousands of African businesses already using Mifumo SMS
          </p>

          <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center transition-all duration-800 delay-400 ${
            ctaReveal.isVisible
              ? 'animate-scale-in'
              : 'opacity-0 scale-95'
          }`} style={{ animationDelay: ctaReveal.isVisible ? '400ms' : '0ms' }}>
          <Link to="/signup">
              <Button
                size="lg"
                className="text-sm sm:text-base h-10 sm:h-12 px-5 sm:px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 group"
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
            <div onClick={() => scrollToSection('about')} className="flex items-center gap-1 sm:gap-2 cursor-pointer">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-white">
                  Mifumo SMS
                </span>
              </div>

            {/* Nav */}
            <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm text-white/90">
              <a className="hover:underline hover:text-white" href="#about">About</a>
              <a className="hover:underline hover:text-white" href="#features">Features</a>
              <a className="hover:underline hover:text-white" href="#pricing">Pricing</a>
              <a href="/developer" className="hover:underline hover:text-white">Developer</a>
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
            <p className="text-xs sm:text-sm text-white/80">&copy; 2025 Mifumo SMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
      {/* Video Tutorial Modal */}
<Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
  <DialogContent className="glass max-w-2xl max-h-[90vh] flex flex-col p-4 rounded-lg">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-lg">
        <Play className="w-5 h-5 text-blue-600" />
        Video Tutorial
      </DialogTitle>
      <DialogDescription>
        Learn how to use Mifumo SMS platform effectively
      </DialogDescription>
    </DialogHeader>

    <div className="flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden min-h-[400px]">
      <video
        key={showVideoModal ? "visible" : "hidden"}
        controls
        autoPlay
        className="w-full h-full max-h-[500px] object-contain"
        style={{ maxWidth: "100%", maxHeight: "500px" }}
      >
        <source src="/tutorial/mfumosms video tutorial.mp4" type="video/mp4" />
        <p className="text-center text-gray-600 p-4">
          Your browser does not support the video tag. Please download the video to watch it.
        </p>
      </video>
    </div>


  </DialogContent>
</Dialog>
    </div>
  );
};

export default Landing;
