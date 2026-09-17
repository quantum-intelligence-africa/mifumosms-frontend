import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React, { useEffect } from "react";
import {
  Code,
  Zap,
  Shield,
  CheckCircle,
  ArrowRight,
  MessageSquare,
  Users,
  Send,
  BarChart3,
  Globe,
  Activity,
  Server,
  Target,
  Clock,
} from "lucide-react";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";
import { useLanguage } from "@/hooks/useLanguage";

const Developer = () => {
  const { t } = useLanguage();

  // Auto-scroll to hero section on page load
  useEffect(() => {
    setTimeout(() => {
      const el = document.getElementById('developer-hero');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Shared landing header */}
      <LandingHeader heroSectionId="developer-hero" />

      {/* Hero Section - Full Viewport */}
      <section id="developer-hero" className="min-h-screen flex flex-col justify-center items-center px-3 sm:px-4 md:px-5 lg:px-6 relative pt-20 pb-3 sm:pt-24 sm:pb-4 md:pt-28 md:pb-6 lg:pt-32 lg:pb-8 z-10">
        {/* Background Image for Hero Only */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/home background12.jpg"
            alt="Hero background"
            className="w-full h-full object-cover scale-[3]"
          />
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        <div className="w-full relative z-10">
          {/* Content - Centered like Textmagic */}
          <div className="relative z-10 w-full flex flex-col items-center">
            {/* Text Content - Centered */}
            <div className="text-center w-full space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 max-w-4xl mx-auto">
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <h1 className="font-heading text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                  {t("developer.hero.title_line1")}
                  <br />
                  <span className="text-blue-200">{t("developer.hero.title_line2")}</span>
                </h1>
                <p className="text-center text-sm sm:text-base md:text-lg text-gray-100 max-w-3xl mx-auto leading-relaxed font-normal">
                  {t("developer.hero.desc")}
                </p>
              </div>

              <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 justify-center pt-2">
                <a href="https://docs-sms.mifumolabs.com/" target="_blank" rel="noopener noreferrer">
                  <Button className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-4 sm:px-6 md:px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    {t("developer.hero.get_started_button")}
                  </Button>
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 md:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("developer.features.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {t("developer.features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* High Availability */}
            <Card className="group relative bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <CardContent className="relative p-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mb-4 shadow-md">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t("developer.features.high_availability.title")}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("developer.features.high_availability.desc")}
                </p>
                <div className="mt-4 items-center text-blue-600 font-medium hidden">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            {/* Focus on What Matters */}
            <Card className="group relative bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <CardContent className="relative p-6">
                <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center mb-4 shadow-md">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t("developer.features.focus.title")}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("developer.features.focus.desc")}
                </p>
                <div className="mt-4 items-center text-green-600 font-medium hidden">
                  <span>{t("developer.features.learn_more")}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>

            {/* Reliable Message Delivery */}
            <Card className="group relative bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              <CardContent className="relative p-6">
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center mb-4 shadow-md">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{t("developer.features.reliable.title")}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("developer.features.reliable.desc")}
                </p>
                <div className="mt-4 items-center text-purple-600 font-medium hidden">
                  <span>{t("developer.features.learn_more")}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* API Features Section */}
      <section className="py-16 px-4 md:px-12 lg:px-16 xl:px-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t("developer.api_features.title")}
            </h2>
            <p className="text-lg text-gray-600">
              {t("developer.api_features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Send className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{t("nav.send_sms")}</h3>
              <p className="text-sm text-gray-600">{t("developer.api_features.send_sms_desc")}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{t("developer.api_features.contact_mgmt_title")}</h3>
              <p className="text-sm text-gray-600">{t("developer.api_features.contact_mgmt_desc")}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{t("developer.api_features.analytics_title")}</h3>
              <p className="text-sm text-gray-600">{t("developer.api_features.analytics_desc")}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Globe className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{t("developer.api_features.multilang_title")}</h3>
              <p className="text-sm text-gray-600">{t("developer.api_features.multilang_desc")}</p>
            </div>
          </div>
        </div>
      </section>


      {/* Shared landing footer */}
      <LandingFooter />
    </div>
  );
};

export default Developer;
