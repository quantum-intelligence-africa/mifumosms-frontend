import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Share, SquarePlus, CheckCircle2, Zap, BellRing, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "@/hooks/use-toast";

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Classic iPhone/iPad/iPod UA, plus iPadOS 13+ which reports as "MacIntel"
  // but exposes multi-touch (a real Mac does not).
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

const DownloadApp = () => {
  const { t } = useLanguage();
  const { canInstall, installed, prompt } = useInstallPrompt();
  const [installing, setInstalling] = useState(false);
  const isIOS = useMemo(detectIOS, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const result = await prompt();
      if (result === "accepted") {
        toast({ title: t("pwa.download_page.install_success_title"), description: t("pwa.download_page.install_success_desc") });
      } else if (result === "unavailable") {
        toast({ title: t("pwa.download_page.install_unavailable_title"), description: t("pwa.download_page.install_unavailable_desc"), variant: "destructive" });
      }
    } finally {
      setInstalling(false);
    }
  };

  const benefits = [
    { icon: Zap, title: t("pwa.download_page.benefit_fast_title"), desc: t("pwa.download_page.benefit_fast_desc") },
    { icon: BellRing, title: t("pwa.download_page.benefit_alerts_title"), desc: t("pwa.download_page.benefit_alerts_desc") },
    { icon: WifiOff, title: t("pwa.download_page.benefit_offline_title"), desc: t("pwa.download_page.benefit_offline_desc") },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-blue-100 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo className="h-10 w-auto -my-2" />
            <span className="font-heading text-base font-bold text-gray-900">SENDA</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline">
            {t("auth.common.home")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
            <BrandLogo className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t("pwa.download_page.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            {t("pwa.download_page.subtitle")}
          </p>
        </div>

        {/* Action card */}
        <div className="mt-8 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          {installed ? (
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <p className="mt-3 text-sm font-semibold text-gray-900">{t("pwa.download_page.already_installed_title")}</p>
              <p className="mt-1 text-xs text-gray-600">{t("pwa.download_page.already_installed_desc")}</p>
              <Button asChild className="mt-4">
                <Link to="/dashboard">{t("pwa.download_page.open_app_button")}</Link>
              </Button>
            </div>
          ) : canInstall ? (
            <div className="flex flex-col items-center text-center">
              <Button
                size="lg"
                onClick={handleInstall}
                disabled={installing}
                className="h-12 gap-2 px-8 text-base font-semibold shadow-lg"
              >
                <Download className="h-5 w-5" />
                {installing ? t("pwa.download_page.installing") : t("pwa.download_page.install_button")}
              </Button>
              <p className="mt-3 text-xs text-gray-500">{t("pwa.download_page.install_button_hint")}</p>
            </div>
          ) : isIOS ? (
            <div>
              <p className="text-center text-sm font-semibold text-gray-900">{t("pwa.download_page.ios_title")}</p>
              <ol className="mt-4 space-y-3">
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Share className="h-4 w-4" />
                  </span>
                  {t("pwa.download_page.ios_step1")}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <SquarePlus className="h-4 w-4" />
                  </span>
                  {t("pwa.download_page.ios_step2")}
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {t("pwa.download_page.ios_step3")}
                </li>
              </ol>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">{t("pwa.download_page.unsupported_title")}</p>
              <p className="mt-1 text-xs text-gray-600">{t("pwa.download_page.unsupported_desc")}</p>
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-xl border border-white/60 bg-white/70 p-4 text-center shadow-sm backdrop-blur-sm">
              <b.icon className="mx-auto h-5 w-5 text-blue-600" />
              <p className="mt-2 text-xs font-semibold text-gray-900">{b.title}</p>
              <p className="mt-1 text-[11px] leading-snug text-gray-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default DownloadApp;
