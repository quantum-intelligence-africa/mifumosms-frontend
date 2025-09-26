import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Link } from "react-router-dom";

const Landing = () => {
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
      name: "Starter",
      price: "$29",
      description: "Perfect for small businesses",
      features: [
        "Up to 1,000 messages/month",
        "Basic analytics",
        "Email support",
        "Contact management",
        "Template library"
      ]
    },
    {
      name: "Professional",
      price: "$99",
      description: "For growing businesses",
      popular: true,
      features: [
        "Up to 10,000 messages/month",
        "Advanced analytics",
        "Priority support",
        "Campaign automation",
        "Custom integrations",
        "Team collaboration"
      ]
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Unlimited messages",
        "Custom analytics",
        "Dedicated support",
        "White-label solution",
        "API access",
        "Advanced security"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Sarah Mwangi",
      role: "Marketing Director, KenyaCorp",
      content: "Mifumo WMS transformed our customer communication. We increased engagement by 300% in just 3 months.",
      avatar: "SM"
    },
    {
      name: "Ahmed Hassan",
      role: "CEO, Cairo Retail",
      content: "The multi-language support helped us expand across North Africa. Excellent platform for growing businesses.",
      avatar: "AH"
    },
    {
      name: "Marie Dubois",
      role: "Operations Manager, Dakar Logistics",
      content: "The automation features saved us 20 hours per week. Customer satisfaction improved dramatically.",
      avatar: "MD"
    }
  ];

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
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            <Zap className="w-4 h-4 mr-1" />
            Africa's #1 Messaging Platform
          </Badge>
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
          <p className="text-sm text-text-subtle mt-4">
            14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-surface">
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

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Trusted by businesses across Africa
            </h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-primary text-primary" />
              ))}
              <span className="ml-2 text-text-subtle">4.9/5 from 1,200+ reviews</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="glass border-0">
                <CardContent className="p-6">
                  <p className="text-text-subtle mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-text-subtle">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-gradient-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-text-subtle">
              Choose the plan that fits your business needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, index) => (
              <Card key={index} className={`glass border-0 relative ${plan.popular ? 'scale-105 shadow-xl' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <CardContent className="p-8">
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-text-subtle mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-text-subtle">/month</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-text-subtle">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
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
      <footer className="glass border-t border-border-subtle py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading text-xl font-bold text-foreground">
                  Mifumo WMS
                </span>
              </div>
              <p className="text-text-subtle">
                Africa's leading messaging platform for businesses
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-text-subtle">
                <li>Features</li>
                <li>Pricing</li>
                <li>API Docs</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-text-subtle">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-text-subtle">
                <li>Help Center</li>
                <li>Community</li>
                <li>Status</li>
                <li>Security</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border-subtle mt-8 pt-8 text-center text-text-subtle">
            <p>&copy; 2024 Mifumo WMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;