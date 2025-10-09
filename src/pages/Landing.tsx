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

  type Tier = { name: string; min: number; max?: number; rate?: number; note?: string; rangeLabel: string };
  const tiers: Tier[] = [
    { name: "Lite", min: 1, max: 5000, rate: 30, rangeLabel: "1 – 5,000 SMS" },
    { name: "Standard", min: 5001, max: 50000, rate: 25, rangeLabel: "5,001 – 50,000 SMS" },
    { name: "Pro", min: 50001, max: 250000, rate: 18, rangeLabel: "50,001 – 250,000 SMS" },
    { name: "Enterprise", min: 1000000, rate: 12, note: "Custom (≤12 TZS/SMS)", rangeLabel: "Enterprise (1M+ SMS)" },
  ];

  const parsedCredits = useMemo(() => Math.max(parseInt(customCredits || "0", 10) || 0, 0), [customCredits]);
  const activeTier = useMemo(() => {
    if (parsedCredits === 0) return null;
    if (parsedCredits <= 5000) return tiers[0];
    if (parsedCredits <= 50000) return tiers[1];
    if (parsedCredits <= 250000) return tiers[2];
    return tiers[3];
  }, [parsedCredits]);

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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-xl font-bold text-foreground">
                Mifumo WMS
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="default">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="about" className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">

          <h1 className="font-heading text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Connect with Customers
            <span className="gradient-text block">Across Africa</span>
          </h1>
          <p className="text-xl text-text-subtle mb-8 max-w-2xl mx-auto">
            Reach millions of customers via WhatsApp and SMS. Built specifically for African businesses
            with multi-language support and local payment integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="hero" variant="hero">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="hero" variant="outline">
              Watch Demo
            </Button>
          </div>
          {/* <p className="text-sm text-text-subtle mt-4">
            14-day free trial • No credit card required
          </p> */}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything you need to grow
            </h2>
            <p className="text-xl text-text-subtle max-w-2xl mx-auto">
              Powerful features designed for African businesses to scale their customer communication
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="glass border-0 hover:shadow-lg transition-smooth">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-subtle">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials removed */}

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gradient-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-text-subtle">
              Choose the plan that fits your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                <CardContent className="p-8 transition-smooth">
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-1">
                    <span className="text-2xl font-bold text-foreground transition-smooth group-hover:text-primary">{plan.rate}</span>
                  </div>
                  <p className="text-text-subtle mb-6 transition-smooth group-hover:text-foreground/80">{plan.credits}</p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-text-subtle">{plan.rate}</span>
                    </li>
                    {/* Savings display not used in tiered pricing */}
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-text-subtle">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/login">
                    <Button className="w-full transition-smooth group-hover:translate-y-[-1px]" variant={plan.popular ? "default" : "outline"}>
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
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Card className="p-6 glass">
            <h3 className="font-heading text-lg font-semibold mb-4">Or Enter Custom Amount</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of SMS Credits</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  className="glass-subtle border-0"
                  min="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <div className="h-10 px-3 rounded-lg glass-subtle flex items-center text-lg font-semibold">
                  TZS {customPrice.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm text-text-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-2">
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
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Ready to transform your customer communication?
          </h2>
          <p className="text-xl text-text-subtle mb-8">
            Join thousands of African businesses already using Mifumo WMS
          </p>
          <Link to="/signup">
            <Button size="hero" variant="hero">
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-border-subtle py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading text-xl font-bold text-foreground">
                  Mifumo WMS
                </span>
              </div>

            {/* Nav */}
            <nav className="flex items-center gap-8 text-sm text-foreground/80">
              <a className="hover:underline" href="#about">About</a>
              <a className="hover:underline" href="#features">Features</a>
              <a className="hover:underline" href="#pricing">Pricing</a>
            </nav>

            {/* Contact */}
            <div className="flex items-center gap-3">
              <span className="text-foreground/80">+255 614 459 923</span>
              <a
                href="https://wa.me/255614459923"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90"
              >
                WhatsApp
              </a>
            </div>
          </div>

          <div className="border-t border-border-subtle mt-4 pt-4 text-center text-text-subtle">
            <p>&copy; 2025 Mifumo WMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
