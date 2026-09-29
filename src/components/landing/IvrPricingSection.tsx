import { Check, Headset, PhoneCall, Building2, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useStaggeredReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

type TFn = (key: any, params?: any) => string;

const SALES_WHATSAPP_URL = "https://wa.me/255615229007";

interface Plan {
  key: "starter" | "business" | "growth" | "custom";
  Icon: typeof PhoneCall;
  price: string;
  suffix: string;
  badge?: "popular" | "best_value";
  cta: "get_started" | "contact_sales";
}

const PLANS: Plan[] = [
  { key: "starter", Icon: PhoneCall, price: "TZS 89K", suffix: "/month", cta: "get_started" },
  { key: "business", Icon: Headset, price: "TZS 249K", suffix: "/month", badge: "popular", cta: "get_started" },
  { key: "growth", Icon: Building2, price: "TZS 599K", suffix: "/month", badge: "best_value", cta: "get_started" },
  { key: "custom", Icon: Sparkles, price: "Custom", suffix: "", cta: "contact_sales" },
];

const getPlanFeatures = (t: TFn): Record<Plan["key"], string[]> => ({
  starter: [
    t("landing.ivr_pricing.starter.feature1"),
    t("landing.ivr_pricing.starter.feature2"),
    t("landing.ivr_pricing.starter.feature3"),
    t("landing.ivr_pricing.starter.feature4"),
    t("landing.ivr_pricing.starter.feature5"),
    t("landing.ivr_pricing.starter.feature6"),
  ],
  business: [
    t("landing.ivr_pricing.business.feature1"),
    t("landing.ivr_pricing.business.feature2"),
    t("landing.ivr_pricing.business.feature3"),
    t("landing.ivr_pricing.business.feature4"),
    t("landing.ivr_pricing.business.feature5"),
    t("landing.ivr_pricing.business.feature6"),
  ],
  growth: [
    t("landing.ivr_pricing.growth.feature1"),
    t("landing.ivr_pricing.growth.feature2"),
    t("landing.ivr_pricing.growth.feature3"),
    t("landing.ivr_pricing.growth.feature4"),
    t("landing.ivr_pricing.growth.feature5"),
    t("landing.ivr_pricing.growth.feature6"),
  ],
  custom: [
    t("landing.ivr_pricing.custom.feature1"),
    t("landing.ivr_pricing.custom.feature2"),
    t("landing.ivr_pricing.custom.feature3"),
    t("landing.ivr_pricing.custom.feature4"),
    t("landing.ivr_pricing.custom.feature5"),
    t("landing.ivr_pricing.custom.feature6"),
  ],
});

const IvrPricingSection = () => {
  const { t } = useLanguage();
  const planFeatures = getPlanFeatures(t);
  const reveal = useStaggeredReveal(PLANS.length, 150);

  return (
    <>
      <div
        ref={reveal.containerRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch"
      >
        {PLANS.map((plan, index) => {
            const features = planFeatures[plan.key];
            const isPopular = plan.badge === "popular";
            const isBestValue = plan.badge === "best_value";
            const isHighlighted = isPopular || isBestValue;

            return (
              <div
                key={plan.key}
                className={cn(
                  "group relative flex",
                  reveal.isVisible ? "animate-scale-in" : "reveal-hidden"
                )}
                style={{
                  animationDelay: reveal.isVisible ? `${index * 150}ms` : "0ms",
                  animationFillMode: "both",
                }}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      {t(`landing.ivr_pricing.${plan.badge}`)}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    "relative flex flex-col w-full overflow-hidden rounded-3xl bg-white transition-all duration-300 group-hover:-translate-y-1",
                    isHighlighted
                      ? "ring-2 ring-blue-500 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.4)] group-hover:shadow-[0_30px_60px_-15px_rgba(37,99,235,0.5)]"
                      : "ring-1 ring-gray-200 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] group-hover:ring-gray-300 group-hover:shadow-[0_15px_35px_-10px_rgba(15,23,42,0.18)]"
                  )}
                >
                  <div className="relative px-6 pt-7 pb-5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          isHighlighted
                            ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                            : "bg-gray-50 text-gray-600 ring-1 ring-gray-100"
                        )}
                      >
                        <plan.Icon className="h-4 w-4" strokeWidth={2.2} />
                      </span>
                      <p className="font-heading text-[15px] font-semibold text-gray-900">
                        {t(`landing.ivr_pricing.${plan.key}.name`)}
                      </p>
                    </div>

                    <p className="mt-3 text-[13px] text-gray-500 leading-relaxed min-h-[2.5rem]">
                      {t(`landing.ivr_pricing.${plan.key}.tagline`)}
                    </p>

                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="font-heading text-[36px] sm:text-[40px] font-bold text-gray-900 leading-none tracking-tight">
                        {plan.price}
                      </span>
                      {plan.suffix && (
                        <span className="text-sm font-medium text-gray-500">{plan.suffix}</span>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-1">
                    {plan.cta === "contact_sales" ? (
                      <a href={SALES_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="block">
                        <Button
                          className={cn(
                            "w-full h-11 text-sm font-semibold rounded-xl transition-all",
                            "bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                          )}
                        >
                          {t("landing.ivr_pricing.contact_sales")}
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </a>
                    ) : (
                      <Link to="/signup" className="block">
                        <Button
                          className={cn(
                            "w-full h-11 text-sm font-semibold rounded-xl transition-all",
                            isHighlighted
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40"
                              : "bg-gray-900 hover:bg-gray-800 text-white shadow-sm"
                          )}
                        >
                          {t("landing.ivr_pricing.get_started")}
                          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="mx-6 border-t border-gray-100" />

                  <div className="px-6 pt-5 pb-6 flex-1 flex flex-col">
                    <p className="text-sm font-semibold text-gray-900 mb-3">
                      {t("landing.ivr_pricing.whats_included")}
                    </p>
                    <ul className="space-y-2.5">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span
                            className={cn(
                              "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full mt-0.5",
                              isHighlighted ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                            )}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          <span className="text-[12.5px] leading-relaxed text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default IvrPricingSection;
