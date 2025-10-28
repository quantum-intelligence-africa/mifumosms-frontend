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
  Activity
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

  // Background slides with company colors - Only blue gradient
  const backgroundSlides = [
    {
      gradient: "from-blue-600 via-blue-700 to-blue-800",
      overlay: "from-blue-900/20 via-blue-800/30 to-blue-900/40",
      accent: "blue"
    }
  ];

  // SMS Animation messages - Company informational messages
  const messages = [
    { text: "MIFUMO SMS: Usikose! Kumbusha wateja wako kuhusu punguzo la mwisho wa mwezi.", sender: "Mifumo SMS", time: "1:00 PM", type: "sms" },
    { text: "MIFUMO SMS: Vikumbusho vya oda vimefufua wateja 24 waliokuwa kimya.", sender: "Mifumo SMS", time: "2:30 PM", type: "whatsapp" },
    { text: "MIFUMO SMS: Ujumbe wako wa ‘Asante Mteja’ umetumwa kwa wateja 1,200.", sender: "Mifumo SMS", time: "3:10 PM", type: "sms" },
    { text: "MIFUMO SMS: Je, salio limeisha? Ongeza sasa ili kampeni zako ziendelee.", sender: "Mifumo SMS", time: "3:40 PM", type: "sms" },
    { text: "MIFUMO SMS: Ofa mpya ya ‘SMS Weekend’ ipo hewani. Tuma zaidi kwa gharama nafuu!", sender: "Mifumo SMS", time: "4:15 PM", type: "sms" },
    { text: "MIFUMO SMS: Ripoti mpya iko tayari – angalia wateja wanaojibu zaidi.", sender: "Mifumo SMS", time: "5:00 PM", type: "sms" },
    { text: "MIFUMO SMS: Ujumbe wako wa WhatsApp umegusa wateja 2,000 leo. Hongera kwa hatua!", sender: "Mifumo SMS", time: "6:10 PM", type: "whatsapp" }
  ];

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // No need to cycle through background slides since we only have blue
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentSlide((prev) => (prev + 1) % backgroundSlides.length);
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [backgroundSlides.length]);

  type Tier = { name: string; min: number; max?: number; rate?: number; note?: string; rangeLabel: string };
  const tiers: Tier[] = useMemo(() => [
    { name: "Lite", min: 1, max: 49999, rate: 30, rangeLabel: "1 to 49,999 SMS" },
    { name: "Standard", min: 50000, max: 149999, rate: 25, rangeLabel: "50,000 to 149,999 SMS" },
    { name: "Pro", min: 250000, rate: 18, rangeLabel: "250,000 SMS and above" },
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

  // SMS Animation Component
  const SMSAnimation = () => {
    const message = messages[currentMessage];

    return (
      <div className="relative w-full max-w-[280px] mx-auto sm:max-w-[300px] lg:max-w-[320px]">
        {/* Slim Smartphone Mockup - Clean design */}
        <div className="relative bg-black rounded-[2.5rem] p-1.5 shadow-xl">
          {/* Slim Frame */}
          <div className="bg-black rounded-[2.3rem] p-0.5">
            <div className="bg-white rounded-[2.1rem] overflow-hidden relative">
              {/* Simple Dynamic Island */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-black rounded-full z-10"></div>

              {/* Clean Status Bar */}
              <div className="bg-white pt-7 pb-2 px-5 flex justify-between items-center text-xs font-semibold text-black">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  {/* Signal bars */}
                  <div className="flex items-end gap-0.5">
                    <div className="w-1 h-2 bg-black rounded-sm"></div>
                    <div className="w-1 h-3 bg-black rounded-sm"></div>
                    <div className="w-1 h-4 bg-black rounded-sm"></div>
                    <div className="w-1 h-4 bg-black rounded-sm"></div>
                  </div>
                  {/* WiFi */}
                  <div className="w-4 h-3 bg-black rounded-sm ml-1"></div>
                  {/* Battery */}
                  <div className="flex items-center gap-1 ml-1">
                    <span className="text-xs font-medium">100%</span>
                    <div className="w-6 h-3 border border-black rounded-sm relative">
                      <div className="w-4 h-2 bg-black rounded-sm m-0.5"></div>
                      <div className="absolute -right-0.5 top-0.5 w-0.5 h-2 bg-black rounded-r-sm"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages App Interface */}
              <div className="bg-gray-50 h-[400px] sm:h-[450px] lg:h-[480px]">
                {/* App Header */}
                <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-gray-900 font-semibold text-sm">{message.sender}</h3>
                    <p className="text-gray-500 text-xs">System Messages</p>
                  </div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>

                {/* Messages Area */}
                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 h-[320px] sm:h-[360px] lg:h-[400px] overflow-y-auto bg-gray-50">
                  {/* Previous messages */}
                  {messages.slice(0, currentMessage).map((msg, index) => (
                    <div key={index} className="flex justify-start">
                      <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
                        <p className="text-gray-900 text-xs leading-relaxed">{msg.text}</p>
                        <p className="text-gray-400 text-[10px] mt-1">{msg.time}</p>
                      </div>
                    </div>
                  ))}

                  {/* Current message with animation */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm animate-pulse">
                      <p className="text-gray-900 text-xs leading-relaxed">{message.text}</p>
                      <p className="text-gray-400 text-[10px] mt-1">{message.time}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Home indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-white rounded-full"></div>
        </div>

        {/* Simple floating notification icons */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <Send className="w-3 h-3 text-white" />
        </div>
        <div className="absolute -bottom-1 -left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
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
      rate: "TZS 30/SMS",
      credits: "1 to 49,999 SMS",
      features: [
        "Instant top-up",
        "Basic delivery reports",
        "Email receipt",
      ],
    },
    {
      name: "Standard",
      rate: "TZS 25/SMS",
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
      rate: "TZS 18/SMS",
      credits: "250,000 SMS and above",
      features: [
        "Bulk campaign tools",
        "Advanced analytics",
        "API access",
      ],
    },
    {
      name: "Enterprise",
      rate: "Custom (≤12 TZS/SMS)",
      credits: "Enterprise (1M+ SMS)",
      features: [
        "Dedicated account manager",
        "Custom invoicing & contracts",
        "Enterprise API & SSO",
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
          .float-animation {
            animation: float 4s ease-in-out infinite;
          }
          .drift-animation {
            animation: drift 6s ease-in-out infinite;
          }
          .glow-animation {
            animation: glow 2s ease-in-out infinite;
          }
        `
      }} />

      {/* Sliding Background */}
      <SlidingBackground />

      {/* Header */}
      <header className="relative z-10 glass border-b border-border-subtle backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-foreground">
                Mifumo SMS
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3 hover:bg-white/10 transition-all duration-300">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" className="text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Viewport */}
      <section id="about" className="min-h-screen flex flex-col justify-center items-center px-3 sm:px-4 lg:px-6 relative py-6 sm:py-8 md:py-12 lg:py-0 z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center w-full">
          {/* Text Content */}
          <div className="text-center lg:text-left lg:col-span-1 w-full space-y-6 sm:space-y-8 md:space-y-10">
            {/* Badge */}
            <div className="flex justify-center lg:justify-start">
              {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Trusted by 1000+ African Businesses</span>
              </div> */}
            </div>

            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight animate-fade-in-up">
                Sell more
                <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-pulse">
                  Spend less
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl text-white/90 max-w-3xl mx-auto lg:mx-0 leading-relaxed font-light animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Automate customers outreach on WhatsApp and SMS, that drives replies, repeat purchases, and track every conversation back to revenue.
              </p>
            </div>

            <div className="flex flex-row gap-2 sm:gap-4 lg:gap-6 justify-center lg:justify-start">
              <Link to="/signup">
                <Button
                  className="text-xs sm:text-sm lg:text-base h-8 sm:h-10 lg:h-12 px-3 sm:px-4 lg:px-6 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 group"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  Start Free Trial
                  <ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 ml-1.5 transition-transform duration-300 ${isHovering ? 'translate-x-1' : ''}`} />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="text-xs sm:text-sm lg:text-base h-8 sm:h-10 lg:h-12 px-3 sm:px-4 lg:px-6 border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 group"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 group-hover:scale-110 transition-transform duration-300" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6 pt-3 sm:pt-4">
              <div className="text-center lg:text-left">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">1000+</div>
                <div className="text-xs text-white/70">Active Businesses</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">50M+</div>
                <div className="text-xs text-white/70">Messages Sent</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white">98%</div>
                <div className="text-xs text-white/70">Delivery Rate</div>
              </div>
            </div>
          </div>

          {/* SMS Animation - Responsive sizing with layered effect */}
          <div className="flex justify-center lg:justify-end mt-6 lg:mt-0">
            <div className="transform hover:scale-105 transition-transform duration-500 animate-fade-in-right scale-75 sm:scale-90 lg:scale-100 relative z-10">
              <SMSAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6 relative bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
            {/* Left Column - Heading and Description */}
            <div className="text-left flex flex-col justify-center">
              <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Everything you need to
                <span className="block text-blue-500">
                  grow your business
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                Powerful features designed for African businesses to scale their customer communication
              </p>
            </div>

            {/* Right Column - Feature Cards Grid */}
            <div className="w-full">
              {/* Mobile: Reference-style layout with alternating descriptions */}
              <div className="sm:hidden space-y-8">
                {features.map((feature, index) => (
                  <div key={index} className={`flex items-start gap-6 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                    {/* Feature Block */}
                    <div className={`flex-shrink-0 w-24 h-24 rounded-lg border-2 flex flex-col items-center justify-center shadow-sm ${
                      index === 0 ? 'bg-white border-gray-300' :
                      index === 1 ? 'bg-blue-50 border-blue-300' :
                      index === 2 ? 'bg-red-50 border-red-300' :
                      'bg-green-50 border-green-300'
                    }`}>
                      {/* Icon at top-center */}
                      <feature.icon className={`w-8 h-8 mb-2 ${
                        index === 0 ? 'text-gray-700' :
                        index === 1 ? 'text-blue-600' :
                        index === 2 ? 'text-red-600' :
                        'text-green-600'
                      }`} />
                      {/* Title centered below icon */}
                      <h3 className={`font-bold text-sm text-center leading-tight ${
                        index === 0 ? 'text-gray-800' :
                        index === 1 ? 'text-blue-700' :
                        index === 2 ? 'text-red-700' :
                        'text-green-700'
                      }`}>
                        {feature.title}
                      </h3>
                    </div>

                    {/* Description text - alternates sides */}
                    <div className="flex-1 pt-3">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Compact 3 columns, 2 rows layout */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-4 lg:gap-6">
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    className="group relative bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 rounded-xl overflow-hidden animate-in slide-in-from-right-7 fade-in-50"
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardContent className="relative p-6 flex flex-col h-full min-h-[180px]">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md group-hover:shadow-lg mx-auto">
                        <feature.icon className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                      </div>

                      {/* Title */}
                      <h3 className="font-heading text-sm font-bold text-blue-500 group-hover:text-blue-600 transition-colors duration-300 text-center mb-3 leading-tight">
                        {feature.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 text-center flex-1">
                        {feature.description}
                      </p>

                      {/* Hover effect indicator */}
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </CardContent>
                  </Card>
                ))}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
                        {activeTier ? (
                          activeTier.name === 'Enterprise'
                            ? (activeTier.note || 'Custom')
                            : `TZS ${activeTier.rate}/SMS`
                        ) : '—'}
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
      <section id="contact" className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4 lg:px-6 relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-bounce" />
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-yellow-300/30 rounded-lg rotate-45 animate-ping" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">

          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
            Ready to transform your
            <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              customer communication?
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed">
            Join thousands of African businesses already using Mifumo SMS
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Link to="/signup">
              <Button
                size="hero"
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
