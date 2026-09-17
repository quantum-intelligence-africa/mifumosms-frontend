import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useLanguage } from '@/hooks/useLanguage';

export function InstallAppPrompt() {
  const { canInstall, installed, recentlyDismissed, prompt, dismiss } = useInstallPrompt();
  const { t } = useLanguage();

  if (installed || !canInstall || recentlyDismissed) return null;

  return (
    <div
      role="dialog"
      aria-label={t("pwa.install_prompt.title")}
      className="fixed right-4 z-[85] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-4 shadow-xl animate-in slide-in-from-bottom-4 fade-in bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] md:bottom-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">{t("pwa.install_prompt.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("pwa.install_prompt.desc")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => prompt()}>{t("pwa.install_prompt.install_button")}</Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>{t("pwa.not_now")}</Button>
          </div>
        </div>
        <button
          type="button"
          aria-label={t("pwa.dismiss_aria")}
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
