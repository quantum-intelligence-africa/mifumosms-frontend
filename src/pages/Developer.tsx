import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React, { useContext, useEffect } from "react";
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
import { LanguageContext } from "../contexts/LanguageContext";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { LandingFooter } from "@/components/layout/LandingFooter";

const Developer = () => {
  const context = useContext(LanguageContext);
  const { language } = context || { language: 'en', t: (s: string) => s };

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
                  {language === 'sw' ? 'API ya SENDA' : 'SENDA API'}
                  <br />
                  <span className="text-blue-200">{language === 'sw' ? 'Nyaraka' : 'Documentation'}</span>
                </h1>
                <p className="text-center text-sm sm:text-base md:text-lg text-gray-100 max-w-3xl mx-auto leading-relaxed font-normal">
                  {language === 'sw' ? 'Rahisisha mawasiliano yako kwa kutumia API ya SENDA. Nyaraka na mwongozo wa msanidi programu vinakupa kila kitu unachohitaji kuunganisha huduma za SMS kwenye programu zako.' : 'Simplify your communication with the SENDA API. Our comprehensive documentation and developer guides provide everything you need to seamlessly integrate SMS services into your applications.'}
                </p>
              </div>

              <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 justify-center pt-2">
                <a href="https://docs-sms.mifumolabs.com/" target="_blank" rel="noopener noreferrer">
                  <Button className="text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11 px-4 sm:px-6 md:px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    {language === 'sw' ? 'Anza' : 'Get started'}
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
              {language === 'sw' ? 'Jenga uzoefu wa mawasiliano wenye nguvu' : 'Build powerful communication experiences'}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {language === 'sw' ? 'kwa API zetu kamili, SDKs na zana za msanidi programu.' : 'with our comprehensive APIs, SDKs and developer tools.'}
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">{language === 'sw' ? 'Upatikanaji wa Juu' : 'High Availability'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {language === 'sw' ? 'API ya SENDA imeundwa kuwa na upatikanaji wa juu na kupanuka. Inaboresha uaminifu wa programu zako kwa kutumia mifumo iliyosambazwa.' : 'SENDA API is designed to be highly available and scalable. Enhancing the reliability of your applications using distributed systems.'}
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">{language === 'sw' ? 'Lenga Kinachohusika' : 'Focus on What Matters'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {language === 'sw' ? 'API ya SENDA inakuwezesha kuzingatia mantiki ya biashara yako kwa kutoa huduma ya arifa inayotegemewa na inayopanuka. Unahitaji tu kuunganisha na API yetu na tutashughulikia yote mengine.' : 'SENDA API allows you to focus on your business logic by providing a reliable and scalable notification service. You just need to integrate with our API and we will take care of the rest.'}
                </p>
                <div className="mt-4 items-center text-green-600 font-medium hidden">
                  <span>{language === 'sw' ? 'Jifunze zaidi' : 'Learn more'}</span>
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">{language === 'sw' ? 'Uwasilishaji wa Ujumbe wa Kuaminika' : 'Reliable Message Delivery'}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {language === 'sw' ? 'API ya SENDA inahakikisha ujumbe wako unawafikia watumiaji wako kwa wakati. Tunatoa kumbukumbu na ripoti za kina ili kukusaidia kufuatilia hali ya ujumbe wako.' : 'SENDA API ensures that your messages are delivered to your users in a timely manner. We provide detailed logs and reports to help you track the status of your messages.'}
                </p>
                <div className="mt-4 items-center text-purple-600 font-medium hidden">
                  <span>{language === 'sw' ? 'Jifunze zaidi' : 'Learn more'}</span>
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
              {language === 'sw' ? 'Vipengele vya API ya SMS' : 'Powerful SMS API Features'}
            </h2>
            <p className="text-lg text-gray-600">
              {language === 'sw' ? 'Kila kitu unachohitaji kuunganisha SMS kwenye programu zako' : 'Everything you need to integrate SMS functionality into your applications'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Send className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{language === 'sw' ? 'Tuma SMS' : 'Send SMS'}</h3>
              <p className="text-sm text-gray-600">{language === 'sw' ? 'Tuma ujumbe wa SMS kwa watu binafsi au makundi' : 'Send SMS messages to individuals or groups'}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{language === 'sw' ? 'Usimamizi wa Mawasiliano' : 'Contact Management'}</h3>
              <p className="text-sm text-gray-600">{language === 'sw' ? 'Simamia mawasiliano na makundi kwa ufanisi' : 'Manage contacts and groups efficiently'}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{language === 'sw' ? 'Takwimu' : 'Analytics'}</h3>
              <p className="text-sm text-gray-600">{language === 'sw' ? 'Fuatilia viwango vya uwasilishaji na utendaji wa kampeni' : 'Track delivery rates and campaign performance'}</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <Globe className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{language === 'sw' ? 'Lugha Nyingi' : 'Multi-language'}</h3>
              <p className="text-sm text-gray-600">{language === 'sw' ? 'Msaada kwa lugha na kanda mbalimbali' : 'Support for multiple languages and regions'}</p>
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
