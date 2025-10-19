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
  Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";

const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [customCredits, setCustomCredits] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Background slides with company colors
  const backgroundSlides = [
    {
      gradient: "from-blue-600 via-blue-700 to-blue-800",
      overlay: "from-blue-900/20 via-blue-800/30 to-blue-900/40",
      accent: "blue"
    },
    {
      gradient: "from-yellow-400 via-yellow-500 to-yellow-600",
      overlay: "from-yellow-900/20 via-yellow-800/30 to-yellow-900/40",
      accent: "yellow"
    },
    {
      gradient: "from-white via-gray-100 to-gray-200",
      overlay: "from-gray-900/20 via-gray-800/30 to-gray-900/40",
      accent: "white"
    }
  ];

  // SMS Animation messages - Company informational messages
  const messages = [
    { text: "MIFUMO WMS: Your account has been successfully created. Welcome to our platform!", sender: "Mifumo WMS", time: "2:30 PM", type: "sms" },
    { text: "MIFUMO WMS: Your SMS campaign 'Welcome Series' has been delivered to 1,250 contacts successfully.", sender: "Mifumo WMS", time: "2:32 PM", type: "sms" },
    { text: "MIFUMO WMS: Your WhatsApp message delivery rate is 98.5% this month. Great performance!", sender: "Mifumo WMS", time: "2:35 PM", type: "whatsapp" },
    { text: "MIFUMO WMS: Your account balance is running low. Please top up to continue sending messages.", sender: "Mifumo WMS", time: "2:37 PM", type: "sms" },
  ];

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  // Cycle through background slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundSlides.length]);

  type Tier = { name: string; min: number; max?: number; rate?: number; note?: string; rangeLabel: string };
  const tiers: Tier[] = useMemo(() => [
    { name: "Lite", min: 1, max: 5000, rate: 30, rangeLabel: "1 – 5,000 SMS" },
    { name: "Standard", min: 5001, max: 50000, rate: 25, rangeLabel: "5,001 – 50,000 SMS" },
    { name: "Pro", min: 50001, max: 250000, rate: 18, rangeLabel: "50,001 – 250,000 SMS" },
    { name: "Enterprise", min: 1000000, rate: 12, note: "Custom (≤12 TZS/SMS)", rangeLabel: "Enterprise (1M+ SMS)" },
  ], []);

  const parsedCredits = useMemo(() => Math.max(parseInt(customCredits || "0", 10) || 0, 0), [customCredits]);
  const activeTier = useMemo(() => {
    if (parsedCredits === 0) return null;
    if (parsedCredits <= 5000) return tiers[0];
    if (parsedCredits <= 50000) return tiers[1];
    if (parsedCredits <= 250000) return tiers[2];
    return tiers[3];
  }, [parsedCredits, tiers]);

  const customPrice = useMemo(() => {
    if (!parsedCredits) return 0;
    if (!activeTier) return 0;
    if (activeTier.name === "Enterprise") {
      // Show an estimated maximum (≤ rate)
      return parsedCredits * (activeTier.rate || 12);
    }
    return parsedCredits * (activeTier.rate as number);
  }, [parsedCredits, activeTier]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Sliding Background Component
  const SlidingBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {backgroundSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${slide.overlay}`} />
            {/* Animated geometric shapes */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full animate-pulse" />
            <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-lg rotate-45 animate-bounce" />
            <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-white/10 rounded-full animate-ping" />
            <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-white/5 rounded-lg rotate-12 animate-pulse" />
          </div>
        ))}
      </div>
    );
  };

  // SMS Animation Component
  const SMSAnimation = () => {
    const message = messages[currentMessage];

    return (
      <div className="relative w-full max-w-[280px] mx-auto">
        {/* iPhone Mockup - Realistic design */}
        <div className="relative bg-black rounded-[3rem] p-2 shadow-2xl">
          {/* iPhone Frame */}
          <div className="bg-black rounded-[2.8rem] p-1">
            <div className="bg-white rounded-[2.5rem] overflow-hidden relative">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-black rounded-full z-10"></div>

              {/* Status Bar */}
              <div className="bg-white pt-8 pb-2 px-6 flex justify-between items-center text-xs font-semibold text-black">
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
                  {/* Battery with percentage */}
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
              <div className="bg-gray-50 h-[480px]">
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
                <div className="p-4 space-y-3 h-[400px] overflow-y-auto bg-gray-50">
                  {/* Previous messages */}
                  {messages.slice(0, currentMessage).map((msg, index) => (
                    <div key={index} className="flex justify-start">
                      <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                        <p className="text-gray-900 text-sm leading-relaxed">{msg.text}</p>
                        <p className="text-gray-400 text-xs mt-2">{msg.time}</p>
                      </div>
                    </div>
                  ))}

                  {/* Current message with animation */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm animate-pulse">
                      <p className="text-gray-900 text-sm leading-relaxed">{message.text}</p>
                      <p className="text-gray-400 text-xs mt-2">{message.time}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white rounded-full"></div>
        </div>

        {/* Floating notification icons */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-bounce shadow-lg">
          <Send className="w-4 h-4 text-white" />
        </div>
        <div className="absolute -bottom-2 -left-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
      </div>
    );
  };
  const features = [
    {
      icon: MessageSquare,
      title: "WhatsApp Business",
      description: "Connect with customers on their preferred messaging platform with our official WhatsApp Business API integration."
    },
    {
      icon: Send,
      title: "SMS Campaigns",
      description: "Reach customers instantly with bulk SMS campaigns. Perfect for time-sensitive promotions and notifications."
    },
    {
      icon: Users,
      title: "Contact Management",
      description: "Organize, segment, and manage your customer database with advanced filtering and tagging capabilities."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Track performance with detailed analytics. Monitor delivery rates, engagement, and ROI across all channels."
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Set up automated workflows and responses to engage customers at the right moment without manual effort."
    },
    {
      icon: Globe,
      title: "Multi-language",
      description: "Communicate in English, Kiswahili, French, and Arabic. Perfect for businesses across Africa."
    }
  ];

  const pricing = [
    {
      name: "Lite",
      rate: "TZS 30/SMS",
      credits: "1 – 5,000 SMS",
      features: [
        "Instant top-up",
        "Basic delivery reports",
        "Email receipt",
      ],
    },
    {
      name: "Standard",
      rate: "TZS 25/SMS",
      credits: "5,001 – 50,000 SMS",
      features: [
        "Priority top-up & support",
        "Advanced delivery analytics",
        "Campaign scheduling",
        "Team access",
      ],
      popular: true,
    },
    {
      name: "Pro",
      rate: "TZS 18/SMS",
      credits: "50,001 – 250,000 SMS",
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
        "Priority routing SLA",
        "Enterprise API & SSO",
      ],
    }
  ];

  // Testimonials section removed

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
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
                Mifumo WMS
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

            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight animate-fade-in-up">
                Connect with Customers
                <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-pulse">
                  Across Africa
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl text-white/90 max-w-3xl mx-auto lg:mx-0 leading-relaxed font-light animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                Reach millions of customers via WhatsApp and SMS. Built specifically for African businesses
                with multi-language support and local payment integration.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-6 justify-center lg:justify-start">
              <Link to="/signup">
                <Button
                  size="hero"
                  className="text-sm sm:text-base lg:text-lg h-10 sm:h-12 lg:h-14 px-6 sm:px-8 w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105 group"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  Start Free Trial
                  <ArrowRight className={`w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform duration-300 ${isHovering ? 'translate-x-1' : ''}`} />
                </Button>
              </Link>
              <Button
                size="hero"
                variant="outline"
                className="text-sm sm:text-base lg:text-lg h-10 sm:h-12 lg:h-14 px-6 sm:px-8 w-full sm:w-auto border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 group"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 pt-4 sm:pt-6">
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">1000+</div>
                <div className="text-xs sm:text-sm text-white/70">Active Businesses</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">50M+</div>
                <div className="text-xs sm:text-sm text-white/70">Messages Sent</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">98%</div>
                <div className="text-xs sm:text-sm text-white/70">Delivery Rate</div>
              </div>
            </div>
          </div>

          {/* SMS Animation - Enhanced for mobile */}
          <div className="flex justify-center lg:justify-end mt-8 lg:mt-0">
            <div className="transform hover:scale-105 transition-transform duration-500 animate-fade-in-right animate-float">
            <SMSAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 lg:py-24 px-3 sm:px-4 lg:px-6 relative bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Powerful Features</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything you need to
              <span className="block bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                grow your business
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Powerful features designed for African businesses to scale their customer communication
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="relative p-6 sm:p-8 lg:p-10">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Hover effect indicator */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-20 lg:py-24 px-3 sm:px-4 lg:px-6 relative bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              <span>Transparent Pricing</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple, transparent
              <span className="block bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                pricing
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
            {pricing.map((plan, index) => (
              <Card
                key={index}
                className={`group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 transition-all duration-500 hover:-translate-y-3 hover:scale-105 cursor-pointer ${
                  plan.popular
                    ? 'shadow-2xl ring-2 ring-yellow-500/20 scale-105'
                    : 'shadow-lg hover:shadow-2xl'
                }`}
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="px-6 py-2 text-sm font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg group-hover:scale-110 transition-transform duration-300">
                    Most Popular
                  </Badge>
                  </div>
                )}

                <div className={`absolute inset-0 bg-gradient-to-br ${
                  plan.popular
                    ? 'from-yellow-500/10 via-transparent to-blue-500/10'
                    : 'from-blue-500/5 via-transparent to-yellow-500/5'
                } opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <CardContent className="relative p-6 sm:p-8 lg:p-10">
                  <div className="text-center mb-8">
                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {plan.name}
                  </h3>
                    <div className="mb-2">
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {plan.rate}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                      {plan.credits}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/login">
                    <Button
                      className={`w-full text-sm sm:text-base h-10 sm:h-12 font-bold transition-all duration-300 group-hover:scale-105 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg hover:shadow-yellow-500/25'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Amount Calculator (public view) */}
      <section className="py-12 sm:py-16 px-3 sm:px-4 lg:px-6 relative bg-gradient-to-br from-blue-50 via-white to-yellow-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              <span>Custom Calculator</span>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Calculate Your
              <span className="block bg-gradient-to-r from-blue-600 to-yellow-500 bg-clip-text text-transparent">
                Custom Pricing
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span>Ready to get started?</span>
          </div>

          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
            Ready to transform your
            <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              customer communication?
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed">
            Join thousands of African businesses already using Mifumo WMS
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
                  Mifumo WMS
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
            <p className="text-xs sm:text-sm">&copy; 2025 Mifumo WMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
