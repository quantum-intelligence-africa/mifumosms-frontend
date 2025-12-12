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
  ChevronRight
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const Landing = () => {
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

  // Sliding Background Component - Static blue background with flowing animations
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-blue-800/30 to-blue-900/40" />

            {/* Animated geometric shapes */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse" />
            <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-lg rotate-45 animate-bounce" />
            <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-ping" />
            <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-white/5 rounded-lg rotate-12 animate-pulse" />

          {/* Flowing SMS/Chat Icons */}
          <div className="absolute top-20 left-10 w-12 h-12 text-white float-animation">
            <MessageSquare className="w-full h-full" />
          </div>
          <div className="absolute top-40 right-20 w-10 h-10 text-white drift-animation">
            <Send className="w-full h-full" />
          </div>
          <div className="absolute bottom-32 left-1/4 w-14 h-14 text-white animate-ping glow-animation" style={{animationDuration: '4s'}}>
            <MessageSquare className="w-full h-full" />
          </div>
          <div className="absolute bottom-20 right-1/3 w-11 h-11 text-white float-animation" style={{animationDelay: '1s'}}>
            <Send className="w-full h-full" />
          </div>

          {/* Additional flowing SMS icons with staggered animations */}
          <div className="absolute top-1/3 left-1/3 w-8 h-8 text-white drift-animation" style={{animationDelay: '2s'}}>
            <MessageSquare className="w-full h-full" />
          </div>
          <div className="absolute top-2/3 right-1/4 w-9 h-9 text-white float-animation" style={{animationDelay: '0.5s'}}>
            <Send className="w-full h-full" />
          </div>
          <div className="absolute bottom-1/3 left-1/2 w-7 h-7 text-white animate-pulse glow-animation" style={{animationDelay: '0.5s', animationDuration: '3.5s'}}>
            <MessageSquare className="w-full h-full" />
          </div>

          {/* More SMS icons for better coverage */}
          <div className="absolute top-1/6 right-1/6 w-6 h-6 text-white drift-animation" style={{animationDelay: '1.8s'}}>
            <Send className="w-full h-full" />
          </div>
          <div className="absolute bottom-1/6 left-1/6 w-8 h-8 text-white float-animation" style={{animationDelay: '0.3s'}}>
            <MessageSquare className="w-full h-full" />
          </div>
          <div className="absolute top-5/6 right-1/2 w-7 h-7 text-white drift-animation" style={{animationDelay: '2.3s'}}>
            <Send className="w-full h-full" />
          </div>


          {/* Connection Lines/Dots */}
          <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-white rounded-full animate-ping glow-animation" style={{animationDelay: '1.5s'}} />
          <div className="absolute bottom-1/3 left-1/3 w-5 h-5 bg-white rounded-full animate-pulse glow-animation" style={{animationDelay: '2.5s'}} />
          <div className="absolute top-2/3 left-2/3 w-3 h-3 bg-white rounded-full animate-ping glow-animation" style={{animationDelay: '0.8s'}} />

          {/* Floating SMS bubbles */}
          <div className="absolute top-1/4 right-1/3 w-5 h-5 bg-white rounded-full animate-bounce glow-animation" style={{animationDelay: '1.5s'}} />
          <div className="absolute bottom-1/4 left-1/5 w-4 h-4 bg-white rounded-full animate-pulse glow-animation" style={{animationDelay: '2.5s'}} />
          <div className="absolute top-3/4 left-2/3 w-6 h-6 bg-white rounded-full animate-ping glow-animation" style={{animationDelay: '0.8s'}} />

          {/* Additional floating elements */}
          <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-white rounded-full animate-bounce glow-animation" style={{animationDelay: '3.2s'}} />
          <div className="absolute bottom-1/2 right-1/4 w-4 h-4 bg-white rounded-full animate-pulse glow-animation" style={{animationDelay: '1.8s'}} />
          <div className="absolute top-1/6 left-1/2 w-2 h-2 bg-white rounded-full animate-ping glow-animation" style={{animationDelay: '2.2s'}} />
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
          className="absolute -left-8 sm:-left-10 top-1/2 -translate-y-1/2 z-30 bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Previous company"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>

        {/* Navigation Button - Right */}
        <button
          onClick={goToNextBusiness}
          className="absolute -right-4 sm:-right-5 top-1/2 -translate-y-1/2 z-30 bg-blue-600 hover:bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Next company"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>

        {/* Phone container */}
        <div
          key={currentBusiness}
          className="relative animate-in fade-in duration-500"
        >
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

        {/* Floating notification icons */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg z-20">
          <Send className="w-3 h-3 text-white" />
        </div>
        <div className="absolute -bottom-1 -left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-20">
          <MessageSquare className="w-2.5 h-2.5 text-white" />
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
      {/* Custom CSS for flowing animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg) scale(1);
              filter: drop-shadow(0 0 8px rgba(255,255,255,0.8));
            }
            50% {
              transform: translateY(-30px) rotate(10deg) scale(1.1);
              filter: drop-shadow(0 0 15px rgba(255,255,255,1));
            }
          }
          @keyframes drift {
            0% {
              transform: translateX(0px) translateY(0px) rotate(0deg) scale(1);
              filter: drop-shadow(0 0 6px rgba(255,255,255,0.6));
            }
            25% {
              transform: translateX(20px) translateY(-15px) rotate(5deg) scale(1.05);
              filter: drop-shadow(0 0 12px rgba(255,255,255,0.8));
            }
            50% {
              transform: translateX(-10px) translateY(-30px) rotate(-5deg) scale(1.1);
              filter: drop-shadow(0 0 18px rgba(255,255,255,1));
            }
            75% {
              transform: translateX(-20px) translateY(-10px) rotate(3deg) scale(1.05);
              filter: drop-shadow(0 0 12px rgba(255,255,255,0.8));
            }
            100% {
              transform: translateX(0px) translateY(0px) rotate(0deg) scale(1);
              filter: drop-shadow(0 0 6px rgba(255,255,255,0.6));
            }
          }
          @keyframes glow {
            0%, 100% {
              filter: drop-shadow(0 0 15px rgba(255,255,255,0.8));
              opacity: 0.8;
            }
            50% {
              filter: drop-shadow(0 0 30px rgba(255,255,255,1));
              opacity: 1;
            }
          }
          @keyframes rotatePhone {
            0%, 90%, 100% {
              transform: perspective(1000px) rotateY(0deg);
            }
            5%, 85% {
              transform: perspective(1000px) rotateY(180deg);
            }
          }
          @keyframes fadeInOut {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.3;
            }
          }
          @keyframes smoothFlip {
            0% {
              transform: perspective(1000px) rotateY(0deg) scale(1);
              opacity: 1;
            }
            50% {
              transform: perspective(1000px) rotateY(90deg) scale(0.95);
              opacity: 0;
            }
            100% {
              transform: perspective(1000px) rotateY(0deg) scale(1);
              opacity: 1;
            }
          }
          @keyframes elegantFade {
            0% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
            50% {
              opacity: 0;
              transform: scale(0.98) translateY(-10px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .phone-transition {
            animation: elegantFade 1.2s ease-in-out;
          }
          .float-animation {
            animation: float 4s ease-in-out infinite;
          }
          .drift-animation {
            animation: drift 6s ease-in-out infinite;
          }
          .glow-animation {
            animation: glow 2s ease-in-out infinite;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />

      {/* Sliding Background */}
      <SlidingBackground />

      {/* Header - Clean & Minimal */}
      <header className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-heading text-base sm:text-lg lg:text-xl font-semibold text-white tracking-tight">
                Mifumo
              </span>
            </div>
            
            {/* Mobile: Hamburger menu icon (visual only for now) */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  className="hidden sm:inline-flex text-sm h-9 px-4 text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  variant="default" 
                  className="text-sm h-9 sm:h-10 px-4 sm:px-5 bg-white text-gray-900 hover:bg-gray-100 font-medium transition-all duration-200 shadow-lg shadow-black/10"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean & Focused */}
      <section id="about" className="min-h-[calc(100vh-72px)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative py-12 sm:py-16 lg:py-0 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center w-full">
          {/* Text Content - Mobile First */}
          <div className="text-center lg:text-left space-y-6 sm:space-y-8 order-1">
            {/* Main headline - Clean typography */}
            <div className="space-y-4 sm:space-y-5">
              <h1 className="font-heading text-[1.75rem] sm:text-3xl md:text-4xl lg:text-5xl text-white leading-[1.15] tracking-tight">
                Unlock growth with
                <span className="block text-white/90">seamless, flexible</span>
                <span className="block text-white">messaging.</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-white/70 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Reach your customers instantly. Send reminders, promotions, and updates—without complexity.
              </p>
            </div>

            {/* CTA Buttons - Thumb-friendly */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button
                  className="w-full sm:w-auto text-sm sm:text-base h-12 sm:h-11 px-6 sm:px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  Get Started
                  <ArrowRight className={`w-4 h-4 ml-2 transition-transform duration-200 ${isHovering ? 'translate-x-0.5' : ''}`} />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-sm sm:text-base h-12 sm:h-11 px-6 sm:px-8 border-white/20 text-white bg-white/5 hover:bg-white/10 font-medium transition-all duration-200"
                >
                  Speak to Sales
                </Button>
              </Link>
            </div>

            {/* Stats - Clean grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-white/10">
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white tracking-tight">50+</div>
                <div className="text-xs sm:text-sm text-white/50 mt-0.5">Businesses</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white tracking-tight">1M+</div>
                <div className="text-xs sm:text-sm text-white/50 mt-0.5">Messages</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white tracking-tight">98%</div>
                <div className="text-xs sm:text-sm text-white/50 mt-0.5">Delivered</div>
              </div>
            </div>
          </div>

          {/* SMS Animation - Hide on small mobile, show on larger */}
          <div className="hidden sm:flex justify-center lg:justify-end order-2">
            <div className="transform hover:scale-[1.02] transition-transform duration-500 scale-90 lg:scale-100 relative z-10">
              <SMSAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Clean & Scannable */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
              Everything you need
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
              Simple, powerful tools to manage your customer communications
            </p>
          </div>

          {/* Features Grid - Mobile optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-5 sm:p-6 rounded-2xl bg-gray-50 hover:bg-gray-100/80 transition-colors duration-200"
              >
                {/* Icon */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>

                {/* Title */}
                <h3 className="font-medium text-base sm:text-lg text-gray-900 mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

      {/* Pricing - Clean & Minimal */}
      <section id="pricing" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
              Simple pricing
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              Pay only for what you use. No hidden fees.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {pricing.map((plan, index) => (
              <div 
                key={index} 
                className={`relative p-5 sm:p-6 rounded-2xl transition-all duration-200 ${
                  plan.popular 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-xs font-medium bg-emerald-500 text-white rounded-full">
                      Popular
                    </span>
                  </div>
                )}

                {/* Plan name */}
                <h3 className={`font-medium text-lg mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-1">
                  <span className={`text-2xl sm:text-3xl font-semibold ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.rate}
                  </span>
                </div>
                <p className={`text-sm mb-5 ${plan.popular ? 'text-white/60' : 'text-gray-500'}`}>
                  {plan.credits}
                </p>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features?.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.popular ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className={`text-sm ${plan.popular ? 'text-white/80' : 'text-gray-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to="/signup" className="block">
                  <Button
                    className={`w-full h-11 text-sm font-medium transition-all duration-200 ${
                      plan.popular
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calculator - Simplified */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-heading text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              Calculate your cost
            </h3>
            <p className="text-sm text-gray-500">
              Enter your volume to see pricing
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-gray-50 border border-gray-200">
            <div className="space-y-5">
              {/* Input */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Number of SMS
                </Label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  className="h-12 text-base bg-white border-gray-200 focus:border-gray-400 focus:ring-0"
                  min="100"
                />
              </div>

              {/* Result */}
              <div className="p-4 rounded-xl bg-gray-900 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total cost</p>
                    <p className="text-2xl sm:text-3xl font-semibold">
                      TZS {customPrice.toLocaleString()}
                    </p>
                  </div>
                  {activeTier && (
                    <div className="text-right">
                      <p className="text-white/60 text-sm">Tier</p>
                      <p className="font-medium">{activeTier.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA */}
              {parsedCredits > 0 && (
                <Link to="/signup" className="block">
                  <Button className="w-full h-12 text-base font-medium bg-emerald-500 hover:bg-emerald-600 text-white">
                    Buy {parsedCredits.toLocaleString()} SMS
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Clean & Focused */}
      <section id="contact" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative bg-gray-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-4 tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-sm sm:text-base text-white/60 mb-8 max-w-md mx-auto">
            Join businesses across Africa using Mifumo SMS to reach their customers
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup">
              <Button className="h-12 px-8 text-base font-medium bg-white text-gray-900 hover:bg-gray-100">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="https://wa.me/255614459923" target="_blank" rel="noreferrer">
              <Button variant="outline" className="h-12 px-8 text-base font-medium border-white/20 text-white bg-transparent hover:bg-white/10">
                Talk to Sales
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading text-base font-semibold text-gray-900">
                Mifumo
              </span>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-6 text-sm text-gray-500">
              <a className="hover:text-gray-900 transition-colors" href="#features">Features</a>
              <a className="hover:text-gray-900 transition-colors" href="#pricing">Pricing</a>
              <Link to="/login" className="hover:text-gray-900 transition-colors">Login</Link>
            </nav>

            {/* Contact */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">+255 614 459 923</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">&copy; 2025 Mifumo SMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
