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
  BarChart3
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";

const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [customCredits, setCustomCredits] = useState<string>("");
  const [currentMessage, setCurrentMessage] = useState(0);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded-lg gradient-primary flex items-center justify-center">
                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="font-heading text-sm sm:text-lg lg:text-xl font-bold text-foreground">
                Mifumo WMS
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3">
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="default" className="text-xs sm:text-sm h-6 sm:h-7 lg:h-8 px-2 sm:px-3">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Viewport */}
      <section id="about" className="min-h-screen flex flex-col justify-center items-center px-3 sm:px-4 lg:px-6 relative py-6 sm:py-8 md:py-12 lg:py-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 items-center w-full">
          {/* Text Content */}
          <div className="text-center lg:text-left lg:col-span-1 w-full space-y-4 sm:space-y-6 md:space-y-8">
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight">
                Connect with Customers
                <span className="gradient-text block">Across Africa</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl text-text-subtle max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Reach millions of customers via WhatsApp and SMS. Built specifically for African businesses
                with multi-language support and local payment integration.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-4 justify-center lg:justify-start">
              <Link to="/signup">
                <Button size="hero" variant="hero" className="text-sm sm:text-base lg:text-base h-10 sm:h-11 lg:h-12 px-6 sm:px-8 w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ml-2" />
                </Button>
              </Link>
              <Button size="hero" variant="outline" className="text-sm sm:text-base lg:text-base h-10 sm:h-11 lg:h-12 px-6 sm:px-8 w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* SMS Animation - Hidden on mobile */}
          <div className="hidden lg:flex justify-center lg:justify-end">
            <SMSAnimation />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Everything you need to grow
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-text-subtle max-w-2xl mx-auto">
              Powerful features designed for African businesses to scale their customer communication
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass border-0 hover:shadow-lg transition-smooth">
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-text-subtle">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

      {/* Pricing */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6 bg-gradient-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-text-subtle">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {pricing.map((plan, index) => (
              <Card
                key={index}
                className={`group glass border-0 relative transition-smooth will-change-transform
                  ${plan.popular ? 'shadow-xl' : ''}
                  hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:ring-1 hover:ring-primary/30`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 transition-smooth group-hover:scale-105 group-hover:-translate-y-0.5">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-4 sm:p-6 lg:p-8 transition-smooth">
                  <h3 className="font-heading text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-1">
                    <span className="text-xl sm:text-2xl font-bold text-foreground transition-smooth group-hover:text-primary">{plan.rate}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-text-subtle mb-4 sm:mb-6 transition-smooth group-hover:text-foreground/80">{plan.credits}</p>

                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                      <span className="text-xs sm:text-sm text-text-subtle">{plan.rate}</span>
                    </li>
                    {/* Savings display not used in tiered pricing */}
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                        <span className="text-xs sm:text-sm text-text-subtle">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/login">
                    <Button className="w-full text-xs sm:text-sm h-8 sm:h-9 lg:h-10 transition-smooth group-hover:translate-y-[-1px]" variant={plan.popular ? "default" : "outline"}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Amount Calculator (public view) */}
      <section className="py-8 sm:py-12 px-3 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-4 sm:p-6 glass">
            <h3 className="font-heading text-base sm:text-lg font-semibold mb-3 sm:mb-4">Or Enter Custom Amount</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Number of SMS Credits</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  className="glass-subtle border-0 text-xs sm:text-sm h-8 sm:h-9"
                  min="100"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label className="text-xs sm:text-sm">Total Cost</Label>
                <div className="h-8 sm:h-9 px-3 rounded-lg glass-subtle flex items-center text-sm sm:text-lg font-semibold">
                  TZS {customPrice.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs sm:text-sm text-text-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
              <span>
                Active tier: {activeTier ? (
                  <>
                    <b>{activeTier.name}</b> — {activeTier.rangeLabel} — {activeTier.name === 'Enterprise' ? (activeTier.note || 'Custom') : `TZS ${activeTier.rate}/SMS`}
                  </>
                ) : '—'}
              </span>
              <span>Minimum 100 credits</span>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 lg:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Ready to transform your customer communication?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-text-subtle mb-6 sm:mb-8">
            Join thousands of African businesses already using Mifumo WMS
          </p>
          <Link to="/signup">
            <Button size="hero" variant="hero" className="text-xs sm:text-sm lg:text-base h-9 sm:h-10 lg:h-12 px-4 sm:px-6">
              Get Started for Free
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 ml-1 sm:ml-2" />
            </Button>
          </Link>
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
